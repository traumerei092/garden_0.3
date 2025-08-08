import { ProfileVisibilitySettings, ApiResponse } from '@/types/users';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

/**
 * プロフィール公開設定を取得する
 * @returns ApiResponse<ProfileVisibilitySettings>
 */
export async function fetchProfileVisibilitySettings(): Promise<ApiResponse<ProfileVisibilitySettings>> {
  try {
    const response = await fetchWithAuth('/accounts/profile-visibility/');

    if (!response.ok) {
      return {
        success: false,
        error: '公開設定の取得に失敗しました'
      };
    }

    const data: ProfileVisibilitySettings = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Profile visibility fetch error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
}

/**
 * プロフィール公開設定を更新する
 * @param settings 更新する公開設定
 * @returns ApiResponse<ProfileVisibilitySettings>
 */
export async function updateProfileVisibilitySettings(
  settings: Partial<ProfileVisibilitySettings>
): Promise<ApiResponse<ProfileVisibilitySettings>> {
  try {
    const response = await fetchWithAuth('/accounts/profile-visibility/', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      return {
        success: false,
        error: '公開設定の更新に失敗しました'
      };
    }

    const data: ProfileVisibilitySettings = await response.json();
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Profile visibility update error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました'
    };
  }
}