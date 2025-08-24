/**
 * エリア関連の型定義
 */

export interface Area {
  id: number;
  name: string;
  name_kana?: string;
  area_type: 'prefecture' | 'city' | 'ward' | 'district' | 'neighborhood' | 'custom';
  level: number;
  parent?: Area | null;
  children?: Area[];
  geometry?: string;
  center_point?: string;
  postal_code?: string;
  jis_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  get_full_name?: string; // 階層を含む完全名 (例: "東京都 > 渋谷区")
}

export interface AreaTreeNode extends Area {
  children: AreaTreeNode[];
}

export interface AreaSearchResult {
  results: Area[];
  total: number;
  query: string;
}

export interface PopularAreas {
  popular_areas: Area[];
}

export interface MyAreasData {
  my_areas: Area[];
  primary_area: Area | null;
  total_areas: number;
}

export interface UpdateMyAreasPayload {
  my_area_ids: number[];
  primary_area_id?: number | null;
}

export interface AreaFilters {
  area_type?: string;
  level?: number;
  parent?: number;
  root_only?: boolean;
}

export interface GeoJSONFeature {
  type: 'Feature';
  properties: {
    id: number;
    name: string;
    area_type: string;
    level: number;
    get_full_name: string;
  };
  geometry: {
    type: 'Polygon' | 'MultiPolygon';
    coordinates: number[][][] | number[][][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
}

/**
 * エリア選択コンポーネント用の状態インターフェース
 */
export interface AreaSelectorState {
  selectedAreas: Area[];
  primaryArea: Area | null;
  searchQuery: string;
  searchResults: Area[];
  popularAreas: Area[];
  currentPath: Area[]; // 階層選択時の現在のパス
  isLoading: boolean;
  error: string | null;
}

/**
 * エリア選択コンポーネントのプロパティ
 */
export interface AreaSelectorProps {
  selectedAreas: Area[];
  primaryArea: Area | null;
  onAreasChange: (areas: Area[]) => void;
  onPrimaryAreaChange: (area: Area | null) => void;
  maxAreas?: number;
  allowMultiple?: boolean;
  showPrimarySelection?: boolean;
  className?: string;
}

/**
 * 地域コード関連
 */
export interface RegionCode {
  prefectureCode: string;
  cityCode?: string;
  wardCode?: string;
}

/**
 * 座標情報
 */
export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * バウンディングボックス（地図表示用）
 */
export interface BoundingBox {
  north: number;
  south: number;
  east: number;
  west: number;
}

export default Area;