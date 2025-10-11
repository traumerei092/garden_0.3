import { fetchWithSession } from '@/app/lib/fetchWithSession';

/**
 * 店舗の雰囲気集計データを取得
 */
export async function fetchShopAtmosphereAggregate(shopId: number): Promise<any> {
  try {
    const response = await fetchWithSession(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/atmosphere_aggregate/`,
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
    console.error('Failed to fetch shop atmosphere aggregate:', error);
    throw error;
  }
}

/**
 * ユーザーの雰囲気フィードバックを取得
 */
export async function fetchUserAtmosphereFeedback(shopId: number): Promise<any> {
  try {
    const response = await fetchWithSession(
      `/shops/${shopId}/my_atmosphere_feedback/`,
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
    console.error('Failed to fetch user atmosphere feedback:', error);
    throw error;
  }
}

/**
 * 雰囲気フィードバックを投稿
 */
export async function submitAtmosphereFeedback(
  shopId: number,
  atmosphereScores: Record<string, number>
): Promise<any> {
  try {
    const response = await fetchWithSession(
      `/shops/${shopId}/atmosphere_feedback/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          atmosphere_scores: atmosphereScores
        }),
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to submit atmosphere feedback:', error);
    throw error;
  }
}