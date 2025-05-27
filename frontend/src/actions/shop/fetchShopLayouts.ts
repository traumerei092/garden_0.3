import { ShopLayout } from '@/types/shops'
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

export async function fetchShopLayouts(): Promise<ShopLayout[]> {
  const res = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shop-layouts/`, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch shop types');
  }

  return await res.json();
}