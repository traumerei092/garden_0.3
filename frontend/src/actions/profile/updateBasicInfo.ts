import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { UpdateBasicInfoRequest, ApiResponse, User } from '@/types/users';

export const updateBasicInfo = async (data: UpdateBasicInfoRequest): Promise<ApiResponse<User>> => {
  try {
    console.log('updateBasicInfo - Sending data:', data);
    const response = await fetchWithAuth('/accounts/users/me/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('updateBasicInfo - Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.log('updateBasicInfo - Error response:', errorData);
      return {
        success: false,
        error: errorData.message || errorData.detail || JSON.stringify(errorData) || 'プロフィールの更新に失敗しました',
      };
    }

    const userData = await response.json();
    return {
      success: true,
      data: userData,
      message: 'プロフィールを更新しました',
    };
  } catch (error) {
    console.error('Basic info update error:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
};
