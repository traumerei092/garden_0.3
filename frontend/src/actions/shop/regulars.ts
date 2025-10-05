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
  console.log('=== fetchRegularsAnalysis called ===');
  console.log('shopId:', shopId, 'axis:', axis);
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regulars/analysis/`);
    url.searchParams.append('axis', axis);

    console.log('Request URL:', url.toString());

    const response = await fetchWithAuth(url.toString(), {
      method: 'GET',
      cache: 'no-store'
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch regulars analysis:', error);
    throw error;
  }
}