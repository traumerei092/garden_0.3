import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

export interface UserShop {
  id: number;
  name: string;
  prefecture: string;
  city: string;
  area: string;
  image_url: string | null;
  visited_at?: string;
  added_at?: string;
  relations?: {
    visited: boolean;
    interested: boolean;
  };
}

export interface UserShopsResponse {
  shops: UserShop[];
}

export const fetchVisitedShops = async (): Promise<UserShop[]> => {
  try {
    const response = await fetchWithAuth('/user-shop-relations/visited_shops/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: UserShopsResponse = await response.json();
    return data.shops;
  } catch (error) {
    console.error('Error fetching visited shops:', error);
    throw error;
  }
};

export const fetchWishlistShops = async (): Promise<UserShop[]> => {
  try {
    const response = await fetchWithAuth('/user-shop-relations/wishlist_shops/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: UserShopsResponse = await response.json();
    return data.shops;
  } catch (error) {
    console.error('Error fetching wishlist shops:', error);
    throw error;
  }
};

export const fetchFavoriteShops = async (): Promise<UserShop[]> => {
  try {
    const response = await fetchWithAuth('/user-shop-relations/favorite_shops/');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: UserShopsResponse = await response.json();
    return data.shops;
  } catch (error) {
    console.error('Error fetching favorite shops:', error);
    throw error;
  }
};
