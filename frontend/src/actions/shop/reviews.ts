import { ShopReview, VisitPurpose } from "@/types/shops";
import { fetchWithAuth } from "@/app/lib/fetchWithAuth";

// 口コミ取得
export const fetchShopReviews = async (
  shopId: number,
  filters: { visit_purpose_id?: number; status?: string }
): Promise<ShopReview[]> => {
  const query = new URLSearchParams();
  if (filters.visit_purpose_id) {
    query.append('visit_purpose_id', filters.visit_purpose_id.toString());
  }
  if (filters.status) {
    query.append('status', filters.status);
  }

  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/reviews/?${query.toString()}`);

  if (!res.ok) {
    throw new Error('Failed to fetch reviews');
  }
  return res.json();
};

// 口コミ投稿
export const createShopReview = async (
  shopId: number,
  comment: string,
  visitPurposeId: number | null
): Promise<ShopReview> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/reviews/`, {
    method: 'POST',
    body: JSON.stringify({ comment, visit_purpose_id: visitPurposeId }),
  });

  if (!res.ok) {
    throw new Error('Failed to create review');
  }
  return res.json();
};

// 口コミのいいね切り替え
export const toggleReviewLike = async (reviewId: number): Promise<{ status: string; likes_count: number }> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/reviews/${reviewId}/like/`, {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('Failed to toggle like');
  }
  return res.json();
};

// 来店目的リスト取得
export const fetchVisitPurposes = async (): Promise<VisitPurpose[]> => {
  // このAPIは認証が不要なため、通常のfetchを使用
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/accounts/visit-purposes/`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch visit purposes');
  }
  return res.json();
};