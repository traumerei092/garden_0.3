
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { ShopEditHistory } from '@/types/shops';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 店舗の編集履歴を取得する
 * @param shopId 履歴を取得する店舗のID
 */
export const fetchShopEditHistory = async (shopId: string): Promise<ShopEditHistory[]> => {
  try {
    const response = await fetchWithAuth(`${API_URL}/shops/${shopId}/history/`);

    if (!response.ok) {
      throw new Error('編集履歴の取得に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('編集履歴取得エラー:', error);
    throw error;
  }
};

/**
 * 編集履歴を評価する
 * @param historyId 評価する履歴のID
 * @param evaluation 'GOOD' または 'BAD'
 */
export const evaluateShopEditHistory = async (historyId: number, evaluation: 'GOOD' | 'BAD'): Promise<any> => {
  try {
    const response = await fetchWithAuth(`${API_URL}/history/${historyId}/evaluate/`, {
      method: 'POST',
      body: JSON.stringify({ evaluation }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '履歴の評価に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('履歴評価エラー:', error);
    throw error;
  }
};
