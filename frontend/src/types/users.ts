export interface User {
  id: number;
  uid: string;
  email: string;
  name: string;
  avatar: string | null;
  introduction: string | null;
  gender: string | null;
  birthdate: string | null;
  work_info: string | null;
  interests: Interest[];
  blood_type: BloodType | null;
  mbti: MBTI | null;
  alcohols: Alcohol[];
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

export interface Hobby extends BaseTag {}

export interface ExerciseHabit extends BaseTag {}

export interface SocialPreference extends BaseTag {}

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
