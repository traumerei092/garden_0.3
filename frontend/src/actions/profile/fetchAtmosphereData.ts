import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { AtmosphereIndicator, UserAtmospherePreference } from '@/types/users';

export async function fetchAtmosphereIndicators(): Promise<{
  success: boolean;
  data?: AtmosphereIndicator[];
  error?: string;
}> {
  try {
    const response = await fetchWithAuth('/accounts/atmosphere-indicators/', {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        error: '雰囲気指標の取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('雰囲気指標取得エラー:', error);
    return {
      success: false,
      error: '雰囲気指標の取得に失敗しました',
    };
  }
}

export async function fetchUserAtmospherePreferences(): Promise<{
  success: boolean;
  data?: UserAtmospherePreference[];
  error?: string;
}> {
  try {
    const response = await fetchWithAuth('/accounts/atmosphere-preferences/', {
      method: 'GET',
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'ユーザーの雰囲気好みの取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('ユーザー雰囲気好み取得エラー:', error);
    return {
      success: false,
      error: 'ユーザーの雰囲気好みの取得に失敗しました',
    };
  }
}
