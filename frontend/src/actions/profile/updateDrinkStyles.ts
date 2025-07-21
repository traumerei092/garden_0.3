import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

export async function updateDrinkStyles(drinkStyleIds: number[]): Promise<User> {
  const response = await fetchWithAuth('/accounts/update-drink-styles/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      drink_styles: drinkStyleIds,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || '飲み方・カクテルの更新に失敗しました');
  }

  return response.json();
}
