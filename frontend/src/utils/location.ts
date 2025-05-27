/**
 * 現在位置を取得する
 * @returns Promise<GeolocationPosition>
 */
export const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position),
      (error) => reject(error),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  });
};

/**
 * 2点間の距離をメートル単位で計算する（ハーバーサイン公式）
 * @param lat1 緯度1
 * @param lon1 経度1
 * @param lat2 緯度2
 * @param lon2 経度2
 * @returns 距離（メートル）
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371e3; // 地球の半径（メートル）
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
};

/**
 * 距離を読みやすい形式にフォーマットする
 * @param distance 距離（メートル）
 * @returns フォーマットされた距離
 */
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  } else {
    return `${(distance / 1000).toFixed(1)} km`;
  }
};

/**
 * 住所から緯度経度を取得する（Geocoding API）
 * 注: 実際の実装では、APIキーの管理やレート制限の考慮が必要
 * @param address 住所
 * @returns Promise<{latitude: number, longitude: number}>
 */
export const getCoordinatesFromAddress = async (
  address: string
): Promise<{ latitude: number; longitude: number }> => {
  try {
    // 実際の実装では、バックエンドAPIを呼び出すか、
    // フロントエンドで直接Geocoding APIを使用する
    // ここではモックデータを返す
    return {
      latitude: 35.6812362,
      longitude: 139.7671248,
    };
  } catch (error) {
    console.error('Error getting coordinates from address:', error);
    throw error;
  }
};
