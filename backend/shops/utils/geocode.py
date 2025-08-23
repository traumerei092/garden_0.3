import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def get_coordinates_from_address(address):
    """
    住所から緯度経度を取得する（Google Maps Geocoding API使用）
    
    Args:
        address (str): 住所文字列
        
    Returns:
        tuple: (latitude, longitude) または None（エラー時）
    """
    try:
        # Google Maps Geocoding APIを使用する
        api_key = getattr(settings, 'GOOGLE_MAPS_API_KEY', '')
        
        if not api_key:
            logger.warning("Google Maps API key is not set")
            return None
            
        # Google Maps Geocoding APIリクエスト
        api_url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': address,
            'key': api_key,
            'language': 'ja',
            'region': 'jp',  # 日本地域を優先
        }
        
        response = requests.get(api_url, params=params)
        
        if response.status_code != 200:
            logger.error(f"Geocoding API error: {response.status_code}")
            return None
            
        data = response.json()
        
        if data['status'] != 'OK' or not data['results']:
            logger.error(f"Geocoding failed: {data.get('status', 'Unknown error')}")
            if 'error_message' in data:
                logger.error(f"Error message: {data['error_message']}")
            return None
            
        # 結果から緯度経度を取得
        location = data['results'][0]['geometry']['location']
        return (location['lat'], location['lng'])
        
    except Exception as e:
        logger.error(f"Error in geocoding: {str(e)}")
        return None

def calculate_distance(lat1, lon1, lat2, lon2):
    """
    2点間の距離をメートル単位で計算する（ハーバーサイン公式）
    
    Args:
        lat1 (float): 緯度1
        lon1 (float): 経度1
        lat2 (float): 緯度2
        lon2 (float): 経度2
        
    Returns:
        float: 距離（メートル）
    """
    import math
    
    # 地球の半径（メートル）
    R = 6371e3
    
    # 緯度経度をラジアンに変換
    φ1 = math.radians(lat1)
    φ2 = math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lon2 - lon1)
    
    # ハーバーサイン公式
    a = math.sin(Δφ/2) * math.sin(Δφ/2) + \
        math.cos(φ1) * math.cos(φ2) * \
        math.sin(Δλ/2) * math.sin(Δλ/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    # 距離（メートル）
    distance = R * c
    
    return distance

def format_distance(distance):
    """
    距離を読みやすい形式にフォーマットする
    
    Args:
        distance (float): 距離（メートル）
        
    Returns:
        str: フォーマットされた距離
    """
    if distance < 1000:
        return f"{round(distance)} m"
    else:
        return f"{distance/1000:.1f} km"
