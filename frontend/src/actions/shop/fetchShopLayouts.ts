import { ShopLayout } from '@/types/shops'
import { fetchWithSession } from '@/app/lib/fetchWithSession';

export async function fetchShopLayouts(): Promise<ShopLayout[]> {
  const res = await fetchWithSession(`${process.env.NEXT_PUBLIC_API_URL}/shop-layouts/`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch shop types');
  }

  return await res.json();
}