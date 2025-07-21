import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { ProfileOptions, ApiResponse } from '@/types/users';

export const fetchProfileOptions = async (): Promise<ApiResponse<ProfileOptions>> => {
  try {
    const response = await fetchWithAuth('/accounts/profile-data/', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: 'プロフィール選択肢データの取得に失敗しました',
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Profile options fetch error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};
