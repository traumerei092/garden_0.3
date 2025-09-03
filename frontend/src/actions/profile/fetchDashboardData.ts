import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

// ダッシュボードサマリーデータ
export interface DashboardSummary {
  favorite_shops_count: number;  // 行きつけの店
  visited_shops_count: number;   // 行った店
  interested_shops_count: number; // 気になる店
  favorite_shops_details: FavoriteShopDetail[];
  visited_shops_details: VisitedShopDetail[];
  total_welcome_count: number;
  user_atmosphere_preferences: Record<string, number>;
  favorite_shops_atmosphere_average: Record<string, number>;
  visited_without_feedback_count: number;
}

export interface FavoriteShopDetail {
  shop_id: number;
  shop_name: string;
  is_welcomed_by_user: boolean;
  atmosphere_scores: Record<string, number>;
}

export interface VisitedShopDetail {
  shop_id: number;
  shop_name: string;
  has_feedback: boolean;
}

// 閲覧履歴項目
export interface ViewHistoryItem {
  id: number;
  shop_name: string;
  shop_id: number;
  viewed_at: string;
}

// 口コミ履歴項目
export interface ReviewHistoryItem {
  id: number;
  shop_name: string;
  shop_id: number;
  content: string;
  rating: number;
  visit_purpose: {
    id: number | null;
    name: string | null;
  };
  created_at: string;
}

// 最近のアクティビティ項目
export interface RecentActivityItem {
  id: number;
  type: 'view' | 'review' | 'favorite' | 'visited' | 'interested';
  shop_name?: string;
  shop_id?: number;
  content?: string;
  created_at: string;
}

// 雰囲気フィードバック履歴項目
export interface AtmosphereFeedbackHistoryItem {
  id: number;
  shop_name: string;
  shop_id: number;
  atmosphere_scores: Record<string, number>;
  created_at: string;
}

// 印象タグ履歴項目
export interface TagReactionHistoryItem {
  id: number;
  shop_name: string;
  shop_id: number;
  tag_text: string;
  tag_id: number;
  reacted_at: string;
}

// ダッシュボードデータ取得
export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/accounts/profile/dashboard/summary/`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch dashboard summary:', error);
    throw error;
  }
}

// 閲覧履歴取得（最新5件）
export async function fetchViewHistory(limit: number = 5): Promise<ViewHistoryItem[]> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/accounts/profile/dashboard/view-history/?limit=${limit}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch view history:', error);
    throw error;
  }
}

// 口コミ履歴取得（最新5件）
export async function fetchReviewHistory(limit: number = 5): Promise<ReviewHistoryItem[]> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/accounts/profile/dashboard/review-history/?limit=${limit}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch review history:', error);
    throw error;
  }
}

// 最近のアクティビティ取得（最新5件）
export async function fetchRecentActivity(limit: number = 5): Promise<RecentActivityItem[]> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/accounts/profile/dashboard/recent-activity/?limit=${limit}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch recent activity:', error);
    throw error;
  }
}

// 雰囲気フィードバック履歴取得
export async function fetchAtmosphereFeedbackHistory(limit: number = 5): Promise<AtmosphereFeedbackHistoryItem[]> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/accounts/profile/dashboard/atmosphere-feedback-history/?limit=${limit}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch atmosphere feedback history:', error);
    throw error;
  }
}

// 印象タグ履歴取得
export async function fetchTagReactionHistory(limit: number = 5): Promise<TagReactionHistoryItem[]> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/accounts/profile/dashboard/tag-reaction-history/?limit=${limit}`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch tag reaction history:', error);
    throw error;
  }
}