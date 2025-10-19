'use client';

import { fetchWithSession } from '@/app/lib/fetchWithSession';
import { SearchFilters, ShopSearchResponse, SearchOptions, AtmosphereIndicator } from '@/types/search';

export async function searchShops(filters: SearchFilters): Promise<ShopSearchResponse> {
  try {
    // クエリパラメータを構築
    const queryParams = new URLSearchParams();

    // 基本的な検索条件
    if (filters.welcome_min !== undefined) {
      queryParams.append('welcome_min', filters.welcome_min.toString());
    }

    if (filters.regular_age_groups?.length) {
      filters.regular_age_groups.forEach(age => {
        queryParams.append('regular_age_groups', age);
      });
    }

    // 最も多い年代（単一選択）
    if (filters.dominant_age_group) {
      queryParams.append('dominant_age_group', filters.dominant_age_group);
    }

    if (filters.regular_genders?.length) {
      filters.regular_genders.forEach(gender => {
        queryParams.append('regular_genders', gender);
      });
    }

    if (filters.occupation) {
      queryParams.append('occupation', filters.occupation);
    }

    if (filters.industry) {
      queryParams.append('industry', filters.industry);
    }

    if (filters.common_interests) {
      queryParams.append('common_interests', 'true');
    }

    // 新しい常連さん検索フィルター
    if (filters.regular_count_min !== undefined) {
      queryParams.append('regular_count_min', filters.regular_count_min.toString());
    }

    if (filters.regular_interests?.length) {
      filters.regular_interests.forEach(interestId => {
        queryParams.append('regular_interests', interestId);
      });
    }

    if (filters.regular_alcohol_preferences?.length) {
      filters.regular_alcohol_preferences.forEach(alcoholId => {
        queryParams.append('regular_alcohol_preferences', alcoholId.toString());
      });
    }

    if (filters.regular_blood_types?.length) {
      filters.regular_blood_types.forEach(bloodTypeId => {
        queryParams.append('regular_blood_types', bloodTypeId);
      });
    }

    if (filters.regular_mbti_types?.length) {
      filters.regular_mbti_types.forEach(mbtiId => {
        queryParams.append('regular_mbti_types', mbtiId);
      });
    }

    if (filters.regular_exercise_frequency?.length) {
      filters.regular_exercise_frequency.forEach(frequencyId => {
        queryParams.append('regular_exercise_frequency', frequencyId);
      });
    }

    if (filters.regular_dietary_preferences?.length) {
      filters.regular_dietary_preferences.forEach(preferenceId => {
        queryParams.append('regular_dietary_preferences', preferenceId);
      });
    }

    // 雰囲気フィルター（新しい3択システム）
    if (filters.atmosphere_simple) {
      console.log('🌟 atmosphere_simpleパラメータを追加:', filters.atmosphere_simple);
      const jsonString = JSON.stringify(filters.atmosphere_simple);
      console.log('🌟 JSONエンコード後:', jsonString);
      queryParams.append('atmosphere_simple', jsonString);
    }

    // 雰囲気フィルター（従来のレンジシステム - 互換性のため保持）
    if (filters.atmosphere_filters) {
      Object.entries(filters.atmosphere_filters).forEach(([indicatorId, range]) => {
        queryParams.append(`atmosphere_${indicatorId}_min`, range.min.toString());
        queryParams.append(`atmosphere_${indicatorId}_max`, range.max.toString());
      });
    }

    // 利用シーン
    if (filters.visit_purposes?.length) {
      filters.visit_purposes.forEach(purpose => {
        queryParams.append('visit_purposes', purpose);
      });
    }

    if (filters.impression_tags) {
      queryParams.append('impression_tags', filters.impression_tags);
    }

    // 基本条件
    if (filters.area_ids?.length) {
      filters.area_ids.forEach(areaId => {
        queryParams.append('area_ids', areaId.toString());
      });
    }

    if (filters.budget_min !== undefined) {
      queryParams.append('budget_min', filters.budget_min.toString());
    }

    if (filters.budget_max !== undefined) {
      queryParams.append('budget_max', filters.budget_max.toString());
    }

    if (filters.budget_type) {
      queryParams.append('budget_type', filters.budget_type);
    }

    // 位置情報
    if (filters.user_lat !== undefined && filters.user_lng !== undefined) {
      queryParams.append('user_lat', filters.user_lat.toString());
      queryParams.append('user_lng', filters.user_lng.toString());
    }

    if (filters.distance_km !== undefined) {
      queryParams.append('distance_km', filters.distance_km.toString());
    }

    if (filters.open_now) {
      queryParams.append('open_now', 'true');
    }

    // お店の特徴
    if (filters.shop_types?.length) {
      filters.shop_types.forEach(typeId => {
        queryParams.append('shop_types', typeId.toString());
      });
    }

    if (filters.shop_layouts?.length) {
      filters.shop_layouts.forEach(layoutId => {
        queryParams.append('shop_layouts', layoutId.toString());
      });
    }

    if (filters.shop_options?.length) {
      filters.shop_options.forEach(optionId => {
        queryParams.append('shop_options', optionId.toString());
      });
    }

    // ドリンク
    if (filters.alcohol_categories?.length) {
      filters.alcohol_categories.forEach(categoryId => {
        queryParams.append('alcohol_categories', categoryId.toString());
      });
    }

    if (filters.alcohol_brands?.length) {
      filters.alcohol_brands.forEach(brandId => {
        queryParams.append('alcohol_brands', brandId.toString());
      });
    }

    if (filters.drink_name) {
      queryParams.append('drink_name', filters.drink_name);
    }

    if (filters.drink_names?.length) {
      filters.drink_names.forEach(drinkName => {
        queryParams.append('drink_names', drinkName);
      });
    }

    // 座席数
    if (filters.seat_count_min !== undefined) {
      queryParams.append('seat_count_min', filters.seat_count_min.toString());
    }

    if (filters.seat_count_max !== undefined) {
      queryParams.append('seat_count_max', filters.seat_count_max.toString());
    }

    // ソートパラメータ（オプション）
    if (filters.sort) {
      queryParams.append('sort', filters.sort);
    }

    // API呼び出し
    const url = `/shops/search/?${queryParams.toString()}`;
    console.log('🔥 API URL:', url);
    console.log('🔥 Full API URL with base:', `http://localhost:8000/api${url}`);

    const response = await fetchWithSession(url, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Shop search API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData
      });
      throw new Error(`店舗検索に失敗しました: ${response.status}`);
    }

    const data: ShopSearchResponse = await response.json();
    
    console.log('Shop search successful:', {
      count: data.count,
      shops: data.shops?.length
    });

    return data;

  } catch (error) {
    console.error('Shop search error:', error);
    throw error instanceof Error 
      ? error 
      : new Error('店舗検索中に予期しないエラーが発生しました');
  }
}

/**
 * 雰囲気指標を取得する
 */
export async function fetchAtmosphereIndicators(): Promise<AtmosphereIndicator[]> {
  try {
    const url = `/atmosphere-indicators/`;
    
    const response = await fetchWithSession(url, {
      method: 'GET',
      cache: 'force-cache' // 雰囲気指標はキャッシュしても良い
    });

    if (!response.ok) {
      console.error('Atmosphere indicators fetch error:', response.status);
      throw new Error('雰囲気指標の取得に失敗しました');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Atmosphere indicators error:', error);
    return [];
  }
}

/**
 * 選択肢データを取得する（エリア、店舗タイプ等）
 */
export async function fetchSearchOptions(): Promise<SearchOptions> {
  try {
    const [areas, shopTypes, shopLayouts, shopOptions, alcoholCategories] = await Promise.all([
      fetchWithSession('/areas/').then(r => r.json()),
      fetchWithSession('/shop-types/').then(r => r.json()),
      fetchWithSession('/shop-layouts/').then(r => r.json()),
      fetchWithSession('/shop-options/').then(r => r.json()),
      // alcohol-categories APIは実装されていない可能性があるため、エラーハンドリング付き
      fetchWithSession('/alcohol-categories/')
        .then(r => r.json())
        .catch(() => [])
    ]);

    return {
      areas,
      shopTypes,
      shopLayouts,
      shopOptions,
      alcoholCategories
    };

  } catch (error) {
    console.error('Search options fetch error:', error);
    return {
      areas: [],
      shopTypes: [],
      shopLayouts: [],
      shopOptions: [],
      alcoholCategories: []
    };
  }
}

/**
 * 店舗タグを取得する
 */
export async function fetchShopTags(): Promise<any[]> {
  try {
    const response = await fetchWithSession('/shop-tags/', {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      console.error('Shop tags fetch error:', response.status);
      throw new Error('店舗タグの取得に失敗しました');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Shop tags error:', error);
    return [];
  }
}