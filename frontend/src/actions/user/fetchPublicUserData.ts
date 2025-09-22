import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { UserShop } from '@/actions/shop/fetchUserShops';
import { ShopReview } from '@/types/shops';

export interface PublicUserShopsResponse {
  shops: UserShop[];
}

export interface PublicUserReviewsResponse {
  reviews: ShopReview[];
}

export const fetchPublicUserFavoriteShops = async (uid: string): Promise<UserShop[]> => {
  try {
    const response = await fetchWithAuth(`/user-shop-relations/public/${uid}/favorite_shops/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PublicUserShopsResponse = await response.json();
    return data.shops;
  } catch (error) {
    console.error('Error fetching public user favorite shops:', error);
    return [];
  }
};

export const fetchPublicUserVisitedShops = async (uid: string): Promise<UserShop[]> => {
  try {
    const response = await fetchWithAuth(`/user-shop-relations/public/${uid}/visited_shops/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PublicUserShopsResponse = await response.json();
    return data.shops;
  } catch (error) {
    console.error('Error fetching public user visited shops:', error);
    return [];
  }
};

export const fetchPublicUserReviews = async (uid: string): Promise<ShopReview[]> => {
  try {
    const response = await fetchWithAuth(`/shop-reviews/public/user/${uid}/`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data; // APIからShopReview[]形式で直接返される
  } catch (error) {
    console.error('Error fetching public user reviews:', error);
    return [];
  }
};