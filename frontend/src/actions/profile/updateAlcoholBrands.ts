import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { User } from '@/types/users';

export async function updateAlcoholBrands(alcoholBrandIds: number[]): Promise<User> {
  const response = await fetchWithAuth('/accounts/update-alcohol-brands/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      alcohol_brands: alcoholBrandIds,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'お酒の銘柄の更新に失敗しました');
  }

  return response.json();
}
