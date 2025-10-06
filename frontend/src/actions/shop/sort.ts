import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { Shop } from '@/types/shops';

export interface SortOption {
  key: string;
  label: string;
  description?: string;
}

export interface SortedShopsResponse {
  results: Shop[];
  count: number;
  page: number;
  page_size: number;
}

// ソートオプション定義
export const SORT_OPTIONS: SortOption[] = [
  { key: 'welcome_count', label: 'ウェルカムが多い順', description: '常連客からの歓迎が多い店舗順' },
  { key: 'distance', label: '近い順', description: '現在地からの距離順' },
  { key: 'favorite_count', label: '常連客が多い順', description: '行きつけにしている人が多い順' },
  { key: 'visited_count', label: '行った人が多い順', description: '訪問経験者が多い順' },
  { key: 'interested_count', label: '気になるが多い順', description: '興味を持つ人が多い順' },
  { key: 'solitude_friendly', label: '一人で過ごすのに向いてる順', description: '一人の時間を重視する雰囲気の店舗順' },
  { key: 'community_friendly', label: 'みんなと交流できるのに向いてる順', description: 'コミュニティ重視の雰囲気の店舗順' },
  { key: 'tag_count', label: '印象タグが多い順', description: '印象タグ数が多い順' },
  { key: 'tag_reaction_count', label: '印象タグの共感数が多い順', description: 'タグへの共感が多い順' },
  { key: 'review_count', label: '口コミが多い順', description: 'レビュー数が多い順' },
  { key: 'drink_count', label: '登録ドリンクが多い順', description: '提供中ドリンク数が多い順' },
];

/**
 * ソート済み店舗リストを取得
 */
export const fetchSortedShops = async (
  sortKey: string,
  filters: Record<string, any> = {},
  page: number = 1
): Promise<SortedShopsResponse> => {
  try {
    const params = new URLSearchParams();
    params.set('sort', sortKey);
    params.set('page', page.toString());

    // フィルター条件を追加
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          params.set(key, value.join(','));
        } else {
          params.set(key, value.toString());
        }
      }
    });

    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/sort/?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`ソート機能の取得に失敗しました: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Sort fetch error:', error);
    throw error;
  }
};

/**
 * ソートオプション一覧を取得
 */
export const getSortOptions = (): SortOption[] => {
  return SORT_OPTIONS;
};

/**
 * ソートキーからラベルを取得
 */
export const getSortLabel = (sortKey: string): string => {
  const option = SORT_OPTIONS.find(opt => opt.key === sortKey);
  return option?.label || 'デフォルト';
};

/**
 * デフォルトソートキーを取得
 */
export const getDefaultSortKey = (): string => {
  return 'welcome_count'; // デフォルトは「ウェルカムが多い順」
};