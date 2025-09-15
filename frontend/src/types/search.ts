// 店舗検索機能の型定義

export interface SearchFilters {
  // 常連さんで探す
  welcome_min?: number;
  regular_count_min?: number;
  dominant_age_group?: string; // 最も多い年代（単一選択）
  regular_genders?: string[];
  regular_interests?: string[];
  regular_blood_types?: string[];
  regular_mbti_types?: string[];
  regular_exercise_frequency?: string[];
  regular_dietary_preferences?: string[];
  regular_alcohol_preferences?: number[];
  occupation?: string;
  industry?: string;
  common_interests?: boolean;

  // 雰囲気・利用シーンで探す
  atmosphere_filters?: { [key: string]: { min: number; max: number } };
  // 新しい3択雰囲気フィルター ('quiet' | 'neutral' | 'social')
  atmosphere_simple?: { [key: string]: AtmospherePreference };
  visit_purposes?: string[];
  impression_tags?: string;

  // 詳細条件
  area_ids?: number[];
  // マイエリアのみで検索するかどうかのフラグ
  use_my_area_only?: boolean;
  budget_min?: number;
  budget_max?: number;
  budget_type?: 'weekday' | 'weekend';
  user_lat?: number;
  user_lng?: number;
  distance_km?: number;
  open_now?: boolean;
  seat_count_min?: number;
  seat_count_max?: number;

  // お店の特徴
  shop_types?: number[];
  shop_layouts?: number[];
  shop_options?: number[];

  // ドリンク
  alcohol_categories?: number[];
  alcohol_brands?: number[];
  drink_name?: string;
  drink_names?: string[];
  drink_likes_min?: number;
}

export interface ShopSearchResponse {
  shops: unknown[];
  count: number;
}

export interface AtmosphereIndicator {
  id: number;
  name: string;
  description_left: string;
  description_right: string;
}

// 雰囲気の好み（3択）
export type AtmospherePreference = 'quiet' | 'neutral' | 'social';

export interface AtmosphereChoice {
  key: AtmospherePreference;
  label: string;
  description: string;
}

export interface UserProfile {
  birthdate?: string | null;
  gender?: string | null;
  visit_purposes?: Array<{ name: string }>;
  my_area?: string | { id: number; name: string } | null;
}

// 検索オプション関連
export interface SearchOptions {
  areas: Area[];
  shopTypes: ShopType[];
  shopLayouts: ShopLayout[];
  shopOptions: ShopOption[];
  alcoholCategories: AlcoholCategory[];
}

export interface Area {
  id: number;
  name: string;
  level: number;
  parent?: number;
}

export interface ShopType {
  id: number;
  name: string;
  description?: string;
}

export interface ShopLayout {
  id: number;
  name: string;
  description?: string;
}

export interface ShopOption {
  id: number;
  name: string;
  description?: string;
}

export interface AlcoholCategory {
  id: number;
  name: string;
  description?: string;
}

// 検索カテゴリタブ
export type SearchCategory = 
  | 'regulars'      // 常連さんで探す
  | 'atmosphere'    // 雰囲気で探す
  | 'area'          // エリアで探す
  | 'basic'         // 基本条件で探す
  | 'features'      // お店の特徴で探す
  | 'drinks';       // ドリンクで探す

export interface SearchCategoryTab {
  key: SearchCategory;
  label: string;
  description?: string;
  icon?: React.ComponentType<{ size?: number }>;
}

// 検索モーダルのProps
export interface ShopSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (filters: SearchFilters) => void;
  initialFilters?: SearchFilters;
  isLoading?: boolean;
}