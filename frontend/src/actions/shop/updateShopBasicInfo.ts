
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * 店舗の基本情報を更新する
 * @param shopId 更新する店舗のID
 * @param data 更新するデータ
 */
export const updateShopBasicInfo = async (shopId: string, data: any) => {
  try {
    const response = await fetchWithAuth(`${API_URL}/shops/${shopId}/update/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || '店舗情報の更新に失敗しました');
    }

    return await response.json();
  } catch (error) {
    console.error('店舗情報更新エラー:', error);
    throw error;
  }
};
