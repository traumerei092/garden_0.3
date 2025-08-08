import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

interface UpdateProfileImageResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export async function updateProfileImage(imageFile: File): Promise<UpdateProfileImageResponse> {
  try {
    const formData = new FormData();
    formData.append('avatar', imageFile);

    const response = await fetchWithAuth('/accounts/users/me/avatar/', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || '画像の更新に失敗しました',
      };
    }

    const userData = await response.json();
    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('プロフィール画像更新エラー:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}