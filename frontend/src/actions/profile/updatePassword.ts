import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { UpdatePasswordRequest, ApiResponse } from '@/types/users';

export const updatePassword = async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
  try {
    const response = await fetchWithAuth('/accounts/change-password/', {
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
        error: errorData.error || 'パスワードの変更に失敗しました',
      };
    }

    const responseData = await response.json();
    return {
      success: true,
      message: responseData.message || 'パスワードを変更しました',
    };
  } catch (error) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};
