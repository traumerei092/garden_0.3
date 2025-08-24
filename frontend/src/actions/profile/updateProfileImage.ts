import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

interface UpdateProfileImageResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export async function updateProfileImage(imageFile: File, imageType: 'avatar' | 'header' = 'avatar'): Promise<UpdateProfileImageResponse> {
  try {
    console.log('updateProfileImage - File info:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    const formData = new FormData();
    const fieldName = imageType === 'header' ? 'header_image' : 'avatar';
    const endpoint = imageType === 'header' ? '/accounts/users/me/header/' : '/accounts/users/me/avatar/';
    
    formData.append(fieldName, imageFile);

    const response = await fetchWithAuth(endpoint, {
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