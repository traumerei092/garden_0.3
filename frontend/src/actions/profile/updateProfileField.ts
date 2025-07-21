import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { UpdateProfileFieldRequest, ApiResponse, User } from '@/types/users';

export const updateProfileField = async (data: UpdateProfileFieldRequest): Promise<ApiResponse<User>> => {
  try {
    const response = await fetchWithAuth('/accounts/users/me/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'プロフィールの更新に失敗しました',
      };
    }

    const userData = await response.json();
    return {
      success: true,
      data: userData,
      message: 'プロフィールを更新しました',
    };
  } catch (error) {
    console.error('Profile field update error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};
