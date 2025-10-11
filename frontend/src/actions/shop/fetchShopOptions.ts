import { ShopOption } from '@/types/shops'
import { fetchWithSession } from '@/app/lib/fetchWithSession';

export async function fetchShopOptions(): Promise<ShopOption[]> {
  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-options/`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch shop types');
  }

  return await res.json();
}