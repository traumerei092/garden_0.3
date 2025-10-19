/**
 * 問い合わせ・報告・要望の型定義
 */

export type ContactType = 'report' | 'inquiry' | 'request';

export type ContactCategory =
  // 報告カテゴリ
  | 'shop_closed'
  | 'inappropriate_image'
  | 'inappropriate_review'
  | 'inappropriate_tag'
  | 'malicious_user'
  // 問い合わせカテゴリ
  | 'how_to_use'
  | 'account_privacy'
  | 'technical_issue'
  | 'other_inquiry'
  // 要望カテゴリ
  | 'new_feature'
  | 'improvement'
  | 'design_ux'
  | 'other_request';

export type ContactStatus = 'pending' | 'in_progress' | 'resolved' | 'closed';

export interface ContactSubmission {
  id: number;
  user: number | null;
  user_name: string | null;
  user_email: string | null;
  contact_type: ContactType;
  category: ContactCategory;
  subject: string;
  description: string;
  shop: number | null;
  shop_name: string | null;
  review: number | null;
  review_id: number | null;
  tag: number | null;
  tag_value: string | null;
  image: number | null;
  image_id: number | null;
  reported_user: number | null;
  reported_user_name: string | null;
  screenshot: string | null;
  contact_email: string | null;
  status: ContactStatus;
  admin_note: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ContactSubmissionCreate {
  contact_type: ContactType;
  category: ContactCategory;
  subject: string;
  description: string;
  shop?: number | null;
  review?: number | null;
  tag?: number | null;
  image?: number | null;
  reported_user?: number | null;
  screenshot?: File | null;
  contact_email?: string | null;
}

export interface CategoryOption {
  value: ContactCategory;
  label: string;
  description: string;
}

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  report: '報告',
  inquiry: '問い合わせ',
  request: '要望',
};

export const REPORT_CATEGORIES: CategoryOption[] = [
  {
    value: 'shop_closed',
    label: '店舗閉店・休店・移転',
    description: '店舗が閉店、休店、または移転していた場合',
  },
  {
    value: 'inappropriate_image',
    label: '不適切な店舗画像',
    description: '誤った画像や不適切・卑猥な店舗画像',
  },
  {
    value: 'inappropriate_review',
    label: '不適切な口コミ',
    description: '誹謗中傷や不適切・卑猥な口コミ投稿',
  },
  {
    value: 'inappropriate_tag',
    label: '不適切な印象タグ',
    description: '不適切・卑猥な印象タグ',
  },
  {
    value: 'malicious_user',
    label: '悪質ユーザー',
    description: '迷惑行為や規約違反をしているユーザー',
  },
];

export const INQUIRY_CATEGORIES: CategoryOption[] = [
  {
    value: 'how_to_use',
    label: '使い方',
    description: 'アプリの操作方法や機能の使い方',
  },
  {
    value: 'account_privacy',
    label: 'アカウント・プライバシー',
    description: 'プロフィール公開設定やアカウントに関する質問',
  },
  {
    value: 'technical_issue',
    label: '技術的問題・バグ',
    description: 'エラーや動作不良の報告',
  },
  {
    value: 'other_inquiry',
    label: 'その他の問い合わせ',
    description: '上記に当てはまらない質問',
  },
];

export const REQUEST_CATEGORIES: CategoryOption[] = [
  {
    value: 'new_feature',
    label: '新機能要望',
    description: '新しい機能のアイデアや提案',
  },
  {
    value: 'improvement',
    label: '既存機能改善',
    description: '現在の機能の改善提案',
  },
  {
    value: 'design_ux',
    label: 'デザイン・UI/UX',
    description: 'デザインや使い勝手に関する提案',
  },
  {
    value: 'other_request',
    label: 'その他の要望',
    description: '上記に当てはまらない要望',
  },
];

export const CATEGORY_OPTIONS: Record<ContactType, CategoryOption[]> = {
  report: REPORT_CATEGORIES,
  inquiry: INQUIRY_CATEGORIES,
  request: REQUEST_CATEGORIES,
};
