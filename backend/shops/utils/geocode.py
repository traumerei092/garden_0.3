import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def get_coordinates_from_address(address):
    """
    住所から緯度経度を取得する
    
    Args:
        address (str): 住所文字列
        
    Returns:
        tuple: (latitude, longitude) または None（エラー時）
    """
    try:
        # OpenCage Geocoding APIを使用する
        # APIキーは環境変数またはsettings.pyから取得
        api_key = getattr(settings, 'OPENCAGE_API_KEY', '')
        
        if not api_key:
            logger.warning("OpenCage API key is not set")
            return None
            
        # 住所をURLエンコード
        encoded_address = requests.utils.quote(address)
        
        # APIリクエスト
        url = f"https://api.opencagedata.com/geocode/v1/json?q={encoded_address}&key={api_key}&language=ja&countrycode=jp"
        response = requests.get(url)
        
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
