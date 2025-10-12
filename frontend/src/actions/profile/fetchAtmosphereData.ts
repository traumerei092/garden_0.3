import { fetchWithSession } from '@/app/lib/fetchWithSession';
import { AtmosphereIndicator, UserAtmospherePreference } from '@/types/users';

export async function fetchAtmosphereIndicators(): Promise<{
  success: boolean;
  data?: AtmosphereIndicator[];
  error?: string;
}> {
  try {
    console.log('🔍 fetchAtmosphereIndicators - Starting request to:', '/accounts/atmosphere-indicators/');
    const response = await fetchWithSession('/accounts/atmosphere-indicators/', {
      method: 'GET',
    });

    console.log('🔍 fetchAtmosphereIndicators - Response status:', response.status, response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ fetchAtmosphereIndicators - API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      return {
        success: false,
        error: `雰囲気指標の取得に失敗しました (${response.status}: ${response.statusText})`,
      };
    }

    const data = await response.json();
    console.log('✅ fetchAtmosphereIndicators - Success:', data.length, 'indicators received');
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('💥 fetchAtmosphereIndicators - Exception:', error);
    return {
      success: false,
      error: `雰囲気指標の取得に失敗しました: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

export async function fetchUserAtmospherePreferences(): Promise<{
  success: boolean;
  data?: UserAtmospherePreference[];
  error?: string;
}> {
  try {
    const response = await fetchWithSession('/accounts/atmosphere-preferences/', {
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
