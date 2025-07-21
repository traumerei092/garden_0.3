import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

interface UpdateSocialPreferencesResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export async function updateSocialPreferences(socialPreferences: number[]): Promise<UpdateSocialPreferencesResponse> {
  try {
    const response = await fetchWithAuth('/accounts/update-social-preferences/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ social_preferences: socialPreferences }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || '交友関係の好みの更新に失敗しました',
      };
    }

    const userData = await response.json();
    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('交友関係の好み更新エラー:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}
