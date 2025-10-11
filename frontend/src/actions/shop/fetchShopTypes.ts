import { ShopType } from '@/types/shops'
import { fetchWithSession } from '@/app/lib/fetchWithSession';

export async function fetchShopTypes(): Promise<ShopType[]> {
  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-types/`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch shop types');
  }

  return await res.json();
}