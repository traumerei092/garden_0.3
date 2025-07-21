import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { UserAtmospherePreference } from '@/types/users';

export interface UpdateAtmospherePreferencesRequest {
  preferences: Array<{
    indicator_id: number;
    score: number;
  }>;
}

export async function updateAtmospherePreferences(
  data: UpdateAtmospherePreferencesRequest
): Promise<{ success: boolean; data?: UserAtmospherePreference[]; error?: string }> {
  try {
    const response = await fetchWithAuth('/accounts/atmosphere-preferences/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || '雰囲気好みの更新に失敗しました',
      };
    }

    const result = await response.json();
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('雰囲気好み更新エラー:', error);
    return {
      success: false,
      error: '雰囲気好みの更新に失敗しました',
    };
  }
}
