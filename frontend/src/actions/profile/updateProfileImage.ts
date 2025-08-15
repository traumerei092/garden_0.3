import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

interface UpdateProfileImageResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export async function updateProfileImage(imageFile: File): Promise<UpdateProfileImageResponse> {
  try {
    console.log('updateProfileImage - File info:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    const formData = new FormData();
    formData.append('avatar', imageFile);

    const response = await fetchWithAuth('/accounts/users/me/avatar/', {
      method: 'POST',
      body: formData,
    });

    console.log('updateProfileImage - Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.log('updateProfileImage - Error response:', errorData);
      return {
        success: false,
        error: errorData.error || errorData.detail || JSON.stringify(errorData) || '画像の更新に失敗しました',
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