import { z } from 'zod';

// 基本情報編集用のバリデーションスキーマ
export const basicInfoSchema = z.object({
  name: z.string()
    .min(1, '名前は必須です')
    .max(50, '名前は50文字以内で入力してください'),
  introduction: z.string()
    .max(500, '自己紹介は500文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  gender: z.string().optional().or(z.literal('')),
  birthdate: z.string().optional().or(z.literal('')),
  my_area: z.string()
    .max(100, 'マイエリアは100文字以内で入力してください')
    .optional()
    .or(z.literal(''))
});

// パスワード変更用のバリデーションスキーマ
export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, '現在のパスワードを入力してください'),
  newPassword: z.string()
    .min(8, 'パスワードは8文字以上で入力してください')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'パスワードは大文字、小文字、数字を含む必要があります'
    ),
  confirmPassword: z.string()
    .min(1, 'パスワード確認を入力してください')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "パスワードが一致しません",
  path: ["confirmPassword"],
});

// 詳細プロフィール個別項目用のバリデーションスキーマ
export const profileFieldSchema = z.object({
  work_info: z.string()
    .max(100, '職種は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  hobby: z.string()
    .max(100, '趣味は100文字以内で入力してください')
    .optional()
    .or(z.literal('')),
  blood_type_id: z.number().optional().nullable(),
  mbti_id: z.number().optional().nullable()
});

// 型定義をエクスポート
export type BasicInfoFormData = z.infer<typeof basicInfoSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
export type ProfileFieldFormData = z.infer<typeof profileFieldSchema>;
