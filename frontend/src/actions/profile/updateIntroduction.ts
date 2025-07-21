import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { ApiResponse, User } from '@/types/users';

export const updateIntroduction = async (introduction: string): Promise<ApiResponse<User>> => {
  try {
    const response = await fetchWithAuth('/accounts/users/me/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ introduction }),
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
    console.error('Introduction update error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};
