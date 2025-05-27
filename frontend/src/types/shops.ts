export interface ShopCategory {
  id: number;
  name: string;
}

export interface ShopTag {
  id: number;
  shop: number;
  value: string;
  created_at: string;
  reaction_count: number;
  user_has_reacted: boolean;
  is_creator: boolean;
  created_by?: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

// 想定されるShop型の定義（types/shops.ts）
export interface ShopImage {
  id: number;
  image_url: string;
  shop: number;
  is_icon: boolean;
  caption: string;
}

export interface Shop {
  id: number;
  name: string;
  address: string;
  prefecture: string | null;
  city: string | null;
  area: string | null;
  street: string | null;
  building: string | null;
  capacity: number | null;
  images: ShopImage[] | null;
  shop_types: ShopCategory[];
  shop_layouts: ShopCategory[];
  shop_options: ShopCategory[];
  business_hours: BusinessHour[];
  latitude: number | null;
  longitude: number | null;
  tags: ShopTag[];
}

export interface ShopType {
  id: string;
  name: string;
}

export interface ShopLayout {
  id: string;
  name: string;
}

export interface ShopOption {
  id: string;
  name: string;
}

export interface ShopFormValues {
  shopName: string;
  zipCode: string;
  prefecture: string;
  city: string;
  street: string;
  building: string;
  shopTypes: ShopType[];
  shopLayouts: ShopLayout[];
  shopOptions: ShopOption[];
  capacity: number | null;
  businessHours: Record<WeekDay, BusinessHourForm>;
  images: Array<{
    file: File | null;
    caption: string;
    isIcon: boolean;
  }>
}

///* 営業日・営業時間フィールド *////
// 共通の曜日型
export type WeekDay =
  | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun' | 'hol';

// 登録後にAPIから返ってくる形式（Djangoのモデル準拠）
export type BusinessHour = {
  weekday: WeekDay;
  weekday_display: string;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

// 登録前のフォーム用の形式（Time 型を使う）
import type { Time } from '@internationalized/date';

export type BusinessHourForm = {
  open: Time | null;
  close: Time | null;
  isClosed: boolean;
};


// ユーザーと店舗のリレーションのための型
export type RelationType = {
  id: number;
  name: string;
  label: string;
  count: number;
  color: string;
}

export interface ShopStats {
  counts: RelationType[];
  user_relations: number[];
}