import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

interface UpdateHobbiesResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export async function updateHobbies(hobbyNames: string[]): Promise<UpdateHobbiesResponse> {
  try {
    const response = await fetchWithAuth('/accounts/hobbies/update/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        hobby_names: hobbyNames,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || '趣味の更新に失敗しました',
      };
    }

    const userData = await response.json();
    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('趣味更新エラー:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}