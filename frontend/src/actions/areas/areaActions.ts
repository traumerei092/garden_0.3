import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { Area } from '@/types/areas';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PopularAreasResponse {
  popular_areas: Area[];
}

export interface SearchAreasResponse {
  results: Area[];
  total: number;
  query: string;
}

export interface MyAreasResponse {
  my_areas: Area[];
  primary_area: Area | null;
  total_areas: number;
}

export interface UpdateMyAreasRequest {
  my_area_ids: number[];
  primary_area_id?: number | null;
}

/**
 * 人気エリア一覧を取得
 */
export const getPopularAreas = async (): Promise<ApiResponse<PopularAreasResponse>> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/areas/popular/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch popular areas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '人気エリアの取得に失敗しました' 
    };
  }
};

/**
 * エリア名で検索
 */
export const searchAreas = async (query: string): Promise<ApiResponse<SearchAreasResponse>> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/areas/search/?q=${encodeURIComponent(query)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to search areas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'エリア検索に失敗しました' 
    };
  }
};

/**
 * エリア階層ツリーを取得
 */
export const getAreaTree = async (): Promise<ApiResponse<Area[]>> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/areas/tree/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch area tree:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'エリア階層の取得に失敗しました' 
    };
  }
};

/**
 * 現在のマイエリア情報を取得
 */
export const getMyAreas = async (): Promise<ApiResponse<MyAreasResponse>> => {
  try {
    const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/accounts/my-areas/`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch my areas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'マイエリアの取得に失敗しました' 
    };
  }
};

/**
 * マイエリア情報を更新
 */
export const updateMyAreas = async (
  updateData: UpdateMyAreasRequest
): Promise<ApiResponse<MyAreasResponse>> => {
  try {
    const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/accounts/my-areas/`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to update my areas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'マイエリアの更新に失敗しました' 
    };
  }
};

/**
 * 特定エリアの子エリアを取得
 */
export const getChildAreas = async (parentId: number): Promise<ApiResponse<Area[]>> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/areas/${parentId}/children/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Failed to fetch child areas:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '子エリアの取得に失敗しました' 
    };
  }
};