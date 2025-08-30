import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

export interface WelcomeData {
  welcome_count: number;
  user_welcomed: boolean;
  is_regular: boolean;
  show_welcome_button: boolean;
}

export interface WelcomeResponse {
  welcome_count: number;
  user_welcomed: boolean;
  message: string;
  show_welcome_button: boolean;
}

// ウェルカムデータ取得
export async function fetchWelcomeData(shopId: number): Promise<WelcomeData | null> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/welcome/`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // 認証エラーの場合は静かに終了
        return null;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch welcome data:', error);
    return null;
  }
}

// ウェルカムトグル
export async function toggleWelcome(shopId: number): Promise<WelcomeResponse | null> {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/welcome/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Failed to toggle welcome:', error);
    throw error;
  }
}