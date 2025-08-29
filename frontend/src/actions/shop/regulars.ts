import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

// 常連客スナップショット取得
export async function fetchRegularsSnapshot(shopId: number) {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regulars/snapshot/`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch regulars snapshot:', error);
    throw error;
  }
}

// 常連客詳細分析取得
export async function fetchRegularsAnalysis(shopId: number, axis: string) {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regulars/analysis/`);
    url.searchParams.append('axis', axis);

    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch regulars analysis:', error);
    throw error;
  }
}