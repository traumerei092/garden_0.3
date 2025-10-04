import { fetchWithAuth } from "@/app/lib/fetchWithAuth";

export interface RegularUsageScene {
  id: number;
  user: string;
  shop: string;
  visit_purposes: Array<{
    id: number;
    name: string;
  }>;
  created_at: string;
  updated_at: string;
}

export interface RegularUsageSceneCreateData {
  visit_purpose_ids: number[];
}

// 常連利用シーン取得
export const fetchRegularUsageScene = async (shopId: number): Promise<RegularUsageScene | null> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular-usage-scenes/`);

  if (res.status === 204) {
    // データが存在しない場合
    return null;
  }

  if (!res.ok) {
    throw new Error('Failed to fetch regular usage scene');
  }

  return res.json();
};

// 常連利用シーン登録・更新
export const submitRegularUsageScene = async (
  shopId: number,
  data: RegularUsageSceneCreateData
): Promise<RegularUsageScene> => {
  // 既存データがあるかチェック
  const existingData = await fetchRegularUsageScene(shopId);

  const url = existingData
    ? `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular-usage-scenes/${existingData.id}/`
    : `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular-usage-scenes/`;

  const method = existingData ? 'PUT' : 'POST';

  const res = await fetchWithAuth(url, {
    method,
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error('Failed to submit regular usage scene');
  }

  return res.json();
};

// 常連利用シーン削除
export const deleteRegularUsageScene = async (shopId: number, usageSceneId: number): Promise<void> => {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular-usage-scenes/${usageSceneId}/`, {
    method: 'DELETE',
  });

  if (!res.ok) {
    throw new Error('Failed to delete regular usage scene');
  }
};