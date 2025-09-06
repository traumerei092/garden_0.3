import { fetchWithAuth } from "@/app/lib/fetchWithAuth";

export interface CommonPoint {
  category: string;
  commonalities: string[];
  total_count: number;
}

export interface CommonalitiesData {
  age_gender: CommonPoint;
  atmosphere_preferences: CommonPoint;
  visit_purposes: CommonPoint;
  total_regulars: number;
  has_commonalities: boolean;
}

export const fetchCommonalities = async (shopId: number): Promise<CommonalitiesData> => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/commonalities/`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch commonalities:', error);
    throw error;
  }
};