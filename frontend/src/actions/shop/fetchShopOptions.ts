import { ShopOption } from '@/types/shops'
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

export async function fetchShopOptions(): Promise<ShopOption[]> {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shop-options/`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch shop types');
  }

  return await res.json();
}