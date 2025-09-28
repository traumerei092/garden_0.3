import { ShopAtmosphereFeedback } from '@/actions/shop/feedback';

/**
 * クライアントサイド用：ユーザーの既存フィードバックを取得（localStorage）
 */
export function getUserShopFeedbackFromStorage(shopId: number): ShopAtmosphereFeedback | null {
  try {
    // ブラウザ環境でのみ実行
    if (typeof window === 'undefined') {
      return null;
    }

    const storageKey = `shop_feedback_${shopId}`;
    const storedData = localStorage.getItem(storageKey);

    if (storedData) {
      const feedback = JSON.parse(storedData);
      console.log('localStorage から取得したフィードバック:', feedback);
      return feedback;
    }

    console.log('localStorage にフィードバックデータなし');
    return null; // フィードバックが存在しない
  } catch (error) {
    console.error('localStorage フィードバック取得エラー:', error);
    return null;
  }
}