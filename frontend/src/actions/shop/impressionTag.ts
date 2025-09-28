import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

export interface ShopTagResponse {
  id: number;
  shop: number;
  value: string;
  created_at: string;
  reaction_count: number;
  user_has_reacted: boolean;
  is_creator: boolean;
  created_by?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

/**
 * 印象タグを追加（ShopTagModal統一版）
 */
export async function addImpressionTag(shopId: number, tagValue: string): Promise<ShopTagResponse> {
  const url = `${process.env.NEXT_PUBLIC_API_URL}/shop-tags/`;

  const response = await fetchWithAuth(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      shop: shopId,
      value: tagValue.trim()
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'タグの追加に失敗しました');
  }

  const result = await response.json();
  console.log('印象タグ追加API呼び出し成功:', tagValue, result);
  return result;
}

/**
 * 複数の印象タグを一括追加
 */
export async function addMultipleImpressionTags(shopId: number, tags: string[]): Promise<ShopTagResponse[]> {
  const validTags = tags.filter(tag => tag.trim().length > 0);
  const results: ShopTagResponse[] = [];

  for (const tag of validTags) {
    try {
      const result = await addImpressionTag(shopId, tag);
      results.push(result);
    } catch (error) {
      console.error(`タグ "${tag}" の追加エラー:`, error);
      throw error; // エラーを上位に伝播
    }
  }

  return results;
}