import { FeedbackData, ShopAtmosphereFeedback } from '@/actions/shop/feedback';

/**
 * クライアントサイド用：店舗フィードバックをlocalStorageに保存
 */
export function saveShopFeedbackToStorage(shopId: number, feedbackData: FeedbackData): void {
  if (typeof window === 'undefined') {
    return;
  }

  const storageKey = `shop_feedback_${shopId}`;
  const mockFeedback: ShopAtmosphereFeedback = {
    id: Date.now(),
    user: 1,
    shop: shopId,
    atmosphere_scores: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // atmosphere_scoresを適切な形式に変換
  feedbackData.atmosphereScores.forEach(score => {
    mockFeedback.atmosphere_scores[score.indicator_id.toString()] = score.score;
  });

  localStorage.setItem(storageKey, JSON.stringify(mockFeedback));
  console.log('雰囲気フィードバック保存完了:', mockFeedback);
}