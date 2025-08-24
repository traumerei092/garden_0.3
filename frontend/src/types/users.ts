export interface User {
  id: number;
  uid: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  name: string;
  avatar: string | null;
  header_image?: string | null;
  bio: string | null;
  introduction: string | null;
  gender: string | null;
  birthdate: string | null;
  my_area: string | null;
  work_info: string | null;
  occupation: string | null;
  industry: string | null;
  position: string | null;
  exercise_frequency: ExerciseFrequency | null;
  dietary_preference: DietaryPreference | null;
  budget_range: BudgetRange | null;
  visit_purposes: VisitPurpose[];
  is_profile_public: boolean;
  interests: Interest[];
  blood_type: BloodType | null;
  mbti: MBTI | null;
  alcohols: Alcohol[];
  alcohol_categories: AlcoholCategory[];
  alcohol_brands: AlcoholBrand[];
  drink_styles: DrinkStyle[];
  hobbies: Hobby[];
  exercise_habits: ExerciseHabit[];
  social_preferences: SocialPreference[];
  updated_at: string;
  created_at: string;
}

// プロフィール関連の型定義
export interface BaseTag {
  id: number;
  name: string;
}

export interface InterestCategory extends BaseTag {}

export interface Interest extends BaseTag {
  category: InterestCategory;
}

export interface BloodType extends BaseTag {}

export interface MBTI extends BaseTag {}

export interface Alcohol extends BaseTag {}

export interface AlcoholCategory extends BaseTag {}

export interface AlcoholBrand extends BaseTag {
  category: AlcoholCategory;
}

export interface DrinkStyle extends BaseTag {
  category: AlcoholCategory;
}

export interface Hobby extends BaseTag {}

export interface ExerciseHabit extends BaseTag {}

export interface SocialPreference extends BaseTag {}

export interface ExerciseFrequency extends BaseTag {
  order: number;
}

export interface DietaryPreference extends BaseTag {
  description: string;
}

export interface BudgetRange extends BaseTag {
  min_price: number | null;
  max_price: number | null;
  order: number;
}

export interface VisitPurpose extends BaseTag {
  description: string;
  order: number;
}

export interface AtmosphereIndicator extends BaseTag {
  description_left: string;
  description_right: string;
}

export interface UserAtmospherePreference {
  id: number;
  indicator: AtmosphereIndicator;
  score: number;
}

// ユーザーのタグの型定義
export interface UserTag {
  id: number;
  name: string;
}

// ユーザーとタグの紐付けの型定義
export interface UserUserTag {
  id: number;
  user: number;
  user_tag: number;
}

// API通信用の型定義
export interface UpdateBasicInfoRequest {
  name?: string;
  gender?: string;
  birthdate?: string | null;
  my_area?: string;
  introduction?: string;
  is_profile_public?: boolean;
}

export interface UpdatePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface UpdateProfileFieldRequest {
  [key: string]: string | number | number[] | null;
}

export interface ProfileOptions {
  blood_types: Array<{ id: number; name: string }>;
  mbti_types: Array<{ id: number; name: string }>;
  alcohols: Array<{ id: number; name: string }>;
  alcohol_categories: Array<{ id: number; name: string }>;
  alcohol_brands: Array<{ 
    id: number; 
    name: string; 
    category: { id: number; name: string } 
  }>;
  drink_styles: Array<{ 
    id: number; 
    name: string; 
    category: { id: number; name: string } 
  }>;
  hobbies: Array<{ id: number; name: string }>;
  exercise_habits: Array<{ id: number; name: string }>;
  social_preferences: Array<{ id: number; name: string }>;
  interests: Array<{ 
    id: number; 
    name: string; 
    category: { id: number; name: string } 
  }>;
  exercise_frequencies: Array<{ id: number; name: string; order: number }>;
  dietary_preferences: Array<{ id: number; name: string; description: string }>;
  budget_ranges: Array<{ 
    id: number; 
    name: string; 
    min_price: number | null; 
    max_price: number | null; 
    order: number 
  }>;
  visit_purposes: Array<{ 
    id: number; 
    name: string; 
    description: string; 
    order: number 
  }>;
}

// プロフィール公開設定の型定義
export interface ProfileVisibilitySettings {
  age: boolean;
  my_area: boolean;
  interests: boolean;
  blood_type: boolean;
  mbti: boolean;
  occupation: boolean;
  industry: boolean;
  position: boolean;
  alcohol_preferences: boolean;
  hobbies: boolean;
  exercise_frequency: boolean;
  dietary_preference: boolean;
  atmosphere_preferences: boolean;
  visit_purposes: boolean;
}

// 他のユーザーから見たプロフィール用の型定義
import { Area } from './areas';

export interface PublicUserProfile {
  uid: string;
  name: string;
  avatar: string | null;
  header_image?: string | null;
  introduction: string | null;
  gender: string | null;
  age?: number;
  my_areas?: Area[];
  primary_area?: Area | null;
  interests?: Interest[];
  blood_type?: BloodType | null;
  mbti?: MBTI | null;
  occupation?: string | null;
  industry?: string | null;
  position?: string | null;
  alcohol_categories?: AlcoholCategory[];
  alcohol_brands?: AlcoholBrand[];
  drink_styles?: DrinkStyle[];
  hobbies?: Hobby[];
  exercise_frequency?: ExerciseFrequency | null;
  dietary_preference?: DietaryPreference | null;
  atmosphere_preferences?: UserAtmospherePreference[];
  visit_purposes?: VisitPurpose[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
