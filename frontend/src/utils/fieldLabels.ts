/**
 * フィールド名をユーザーフレンドリーな表示名に変換するヘルパー関数
 */

export const FIELD_LABELS: Record<string, string> = {
  // 基本情報
  name: '店舗名',
  zip_code: '郵便番号',
  address: '住所',
  prefecture: '都道府県',
  city: '市区町村',
  street: '町名・番地',
  building: '建物名',
  area: 'エリア',
  capacity: '収容人数',
  phone_number: '電話番号',
  access: 'アクセス情報',

  // 予算関連
  budget_weekday_min: '平日予算（最低）',
  budget_weekday_max: '平日予算（最高）',
  budget_weekend_min: '週末予算（最低）',
  budget_weekend_max: '週末予算（最高）',
  budget_note: '予算メモ',

  // 位置情報
  latitude: '緯度',
  longitude: '経度',

  // リレーション
  shop_types: '店舗タイプ',
  shop_layouts: '店舗レイアウト',
  shop_options: '店舗オプション',
  payment_methods: '支払い方法',

  // システム
  created_at: '作成日時',
  created_by: '作成者',
};

/**
 * フィールド名を表示名に変換
 */
export const getFieldLabel = (fieldName: string): string => {
  return FIELD_LABELS[fieldName] || fieldName;
};

/**
 * 値を表示用にフォーマット
 */
export const formatFieldValue = (fieldName: string, value: unknown): string => {
  if (value === null || value === undefined) {
    return '未設定';
  }

  if (value === '' || value === 'None') {
    return '未設定';
  }

  // 数値の場合
  if (typeof value === 'number') {
    // 予算関連フィールドの場合は円マークを付ける
    if (fieldName.includes('budget_') && !fieldName.includes('note')) {
      return `¥${value.toLocaleString()}`;
    }

    // 収容人数の場合
    if (fieldName === 'capacity') {
      return value === 0 ? '未設定' : `${value}名`;
    }

    return value.toString();
  }

  // 文字列の場合
  if (typeof value === 'string') {
    return value;
  }

  // その他の場合はJSONに変換
  return JSON.stringify(value);
};

/**
 * 変更内容を見やすくフォーマット（HTML形式）
 */
export const formatChangeDescription = (
  fieldName: string,
  oldValue: unknown,
  newValue: unknown
): { __html: string } => {
  const fieldLabel = getFieldLabel(fieldName);
  const formattedOldValue = formatFieldValue(fieldName, oldValue);
  const formattedNewValue = formatFieldValue(fieldName, newValue);

  const html = `<strong>${fieldLabel}</strong>: <span class="oldValue">${formattedOldValue}</span> → <span class="newValue">${formattedNewValue}</span>`;

  return { __html: html };
};