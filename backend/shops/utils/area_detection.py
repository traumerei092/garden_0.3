import requests
import logging
from typing import Optional, List, Tuple, Dict
from django.conf import settings
from django.contrib.gis.geos import Point
from shops.models import Area

logger = logging.getLogger(__name__)


class AreaDetectionService:
    """
    エリア自動判定サービス
    住所や緯度経度からエリアを自動検出する機能を提供
    """
    
    @staticmethod
    def geocode_address(address: str) -> Optional[Tuple[float, float]]:
        """
        住所から緯度経度を取得
        
        Args:
            address (str): 住所文字列
            
        Returns:
            tuple: (latitude, longitude) または None（エラー時）
        """
        try:
            api_key = getattr(settings, 'OPENCAGE_API_KEY', '')
            
            if not api_key:
                logger.warning("OpenCage API key is not set")
                return None
                
            # APIリクエスト
            url = "https://api.opencagedata.com/geocode/v1/json"
            params = {
                'q': address,
                'key': api_key,
                'language': 'ja',
                'countrycode': 'jp',
                'limit': 1
            }
            
            response = requests.get(url, timeout=10)
            
            if response.status_code != 200:
                logger.error(f"Geocoding API error: {response.status_code}")
                return None
                
            data = response.json()
            
            if len(data['results']) == 0:
                logger.error("No results found for the address")
                return None
                
            # 結果から緯度経度を取得
            location = data['results'][0]['geometry']
            return (location['lat'], location['lng'])
            
        except Exception as e:
            logger.error(f"Error in geocoding: {str(e)}")
            return None
    
    @staticmethod
    def find_areas_by_point(latitude: float, longitude: float, 
                          area_type: Optional[str] = None) -> List[Area]:
        """
        緯度経度を含むエリアを全て取得
        
        Args:
            latitude (float): 緯度
            longitude (float): 経度  
            area_type (str, optional): エリアタイプでフィルタ
            
        Returns:
            List[Area]: 該当するエリアのリスト（階層順）
        """
        try:
            areas = Area.find_areas_containing_point(latitude, longitude)
            
            if area_type:
                areas = areas.filter(area_type=area_type)
            
            return list(areas)
            
        except Exception as e:
            logger.error(f"Error finding areas by point: {str(e)}")
            return []
    
    @staticmethod
    def get_most_specific_area(latitude: float, longitude: float) -> Optional[Area]:
        """
        緯度経度に対して最も詳細なエリアを取得
        
        Args:
            latitude (float): 緯度
            longitude (float): 経度
            
        Returns:
            Area: 最も詳細なエリア または None
        """
        areas = AreaDetectionService.find_areas_by_point(latitude, longitude)
        return areas[-1] if areas else None  # 最も高いレベル（詳細）のエリア
    
    @staticmethod
    def detect_area_from_address(address: str) -> Optional[Area]:
        """
        住所からエリアを自動検出
        
        Args:
            address (str): 住所文字列
            
        Returns:
            Area: 検出されたエリア または None
        """
        # まず住所を緯度経度に変換
        coordinates = AreaDetectionService.geocode_address(address)
        if not coordinates:
            return None
            
        latitude, longitude = coordinates
        
        # 緯度経度から最も詳細なエリアを取得
        return AreaDetectionService.get_most_specific_area(latitude, longitude)
    
    @staticmethod
    def get_area_hierarchy(latitude: float, longitude: float) -> Dict[str, Optional[Area]]:
        """
        緯度経度に対するエリア階層情報を取得
        
        Args:
            latitude (float): 緯度
            longitude (float): 経度
            
        Returns:
            Dict[str, Area]: エリアタイプをキーとするエリア辞書
        """
        areas = AreaDetectionService.find_areas_by_point(latitude, longitude)
        
        hierarchy = {
            'prefecture': None,
            'city': None,
            'ward': None,
            'district': None,
            'neighborhood': None,
            'custom': None
        }
        
        for area in areas:
            if area.area_type in hierarchy:
                hierarchy[area.area_type] = area
        
        return hierarchy
    
    @staticmethod
    def update_shop_area(shop):
        """
        店舗のエリア情報を更新
        
        Args:
            shop: Shopインスタンス
            
        Returns:
            bool: 更新成功の場合True
        """
        try:
            if shop.latitude is not None and shop.longitude is not None:
                area = AreaDetectionService.get_most_specific_area(
                    shop.latitude, 
                    shop.longitude
                )
                if area:
                    shop.area = area
                    shop.save(update_fields=['area'])
                    logger.info(f"Shop '{shop.name}' area updated to: {area.get_full_name()}")
                    return True
            return False
        except Exception as e:
            logger.error(f"Error updating shop area: {str(e)}")
            return False
    
    @staticmethod
    def bulk_update_shop_areas():
        """
        全店舗のエリア情報を一括更新
        
        Returns:
            Dict[str, int]: 更新統計情報
        """
        from shops.models import Shop
        
        stats = {
            'total': 0,
            'updated': 0,
            'failed': 0,
            'no_coordinates': 0
        }
        
        shops = Shop.objects.filter(area__isnull=True)
        stats['total'] = shops.count()
        
        for shop in shops:
            if shop.latitude is None or shop.longitude is None:
                stats['no_coordinates'] += 1
                continue
                
            if AreaDetectionService.update_shop_area(shop):
                stats['updated'] += 1
            else:
                stats['failed'] += 1
        
        return stats
    
    @staticmethod
    def find_nearby_areas(latitude: float, longitude: float, 
                         radius_km: float = 5.0) -> List[Area]:
        """
        指定地点から半径内のエリアを検索
        
        Args:
            latitude (float): 緯度
            longitude (float): 経度
            radius_km (float): 検索半径（キロメートル）
            
        Returns:
            List[Area]: 近接エリアのリスト（距離順）
        """
        try:
            from django.contrib.gis.measure import Distance
            from django.contrib.gis.geos import Point
            from django.contrib.gis.db.models.functions import Distance as DistanceFunction
            
            point = Point(longitude, latitude, srid=4326)
            distance = Distance(km=radius_km)
            
            areas = Area.objects.filter(
                geometry__distance_lte=(point, distance),
                is_active=True
            ).annotate(
                distance=DistanceFunction('geometry', point)
            ).order_by('distance')
            
            return list(areas)
            
        except Exception as e:
            logger.error(f"Error finding nearby areas: {str(e)}")
            return []