'use server'

import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

interface UpdateVisitPurposesResponse {
  success: boolean;
  data?: User;
  error?: string;
}

export async function updateVisitPurposes(visitPurposeIds: number[]): Promise<UpdateVisitPurposesResponse> {
  try {
    const response = await fetchWithAuth('/accounts/visit-purposes/update/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visit_purposes: visitPurposeIds,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.error || '利用目的の更新に失敗しました',
      };
    }

    const userData = await response.json();
    return {
      success: true,
      data: userData,
    };
  } catch (error) {
    console.error('利用目的更新エラー:', error);
    return {
      success: false,
      error: 'ネットワークエラーが発生しました',
    };
  }
}
