import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

export async function updateAlcoholCategories(alcoholCategoryIds: number[]): Promise<User> {
  const response = await fetchWithAuth('/accounts/update-alcohol-categories/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alcohol_categories: alcoholCategoryIds,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'お酒のジャンルの更新に失敗しました');
  }

  return response.json();
}
