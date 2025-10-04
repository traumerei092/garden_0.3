import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

export interface FeedbackData {
  atmosphere_scores: { [key: string]: number };
  impressionTags?: string[];
}

export interface ShopAtmosphereFeedback {
  id: number;
  user: number;
  shop: number;
  atmosphere_scores: { [key: string]: number };
  created_at: string;
  updated_at: string;
}

/**
 * 店舗フィードバックを送信（雰囲気のみ）
 */
export async function submitShopFeedback(shopId: number, feedbackData: FeedbackData): Promise<void> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/atmosphere_feedback/`;
    const response = await fetchWithAuth(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(feedbackData),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'フィードバックの送信に失敗しました');
    }
  } catch (error) {
    console.error('API フィードバック送信エラー:', error);
    throw error;
  }
}

/**
 * ユーザーの既存フィードバックを取得
 */
export async function getUserShopFeedback(shopId: number): Promise<ShopAtmosphereFeedback | null> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/my_atmosphere_feedback/`;
    const response = await fetchWithAuth(url, {
      method: 'GET',
    });
    if (response.status === 404) {
      return null;
    }
    if (!response.ok) {
      throw new Error('フィードバック取得に失敗しました');
    }
    return await response.json();
  } catch (error) {
    console.error('API フィードバック取得エラー:', error);
    return null;
  }
}

