/**
 * 雰囲気指標関連のユーティリティ関数
 */

// 雰囲気指標の型定義
export interface AtmosphereIndicator {
  id: number;
  name: string;
  description_left: string;
  description_right: string;
}

// 雰囲気スコア（指標ID → スコア値）
export interface AtmosphereScores {
  [indicatorId: string]: number;
}

/**
 * スコアに基づいて表示テキストを生成（AtmosphereVisualizationから抽出）
 * @param score スコア値 (-2.0 ～ +2.0)
 * @param leftLabel 左側（負の値）のラベル
 * @param rightLabel 右側（正の値）のラベル
 * @returns 表示用のテキスト
 */
export const getScoreText = (score: number, leftLabel: string, rightLabel: string): string => {
  if (score === 0) return 'どちらも楽しめる';

  const absScore = Math.abs(score);
  const isRight = score > 0;
  const label = isRight ? rightLabel : leftLabel;

  if (absScore >= 1.5) {
    return label;
  } else if (absScore >= 0.5) {
    // labelによって変化
    switch (label) {
      case '落ち着いている':
        return `${label}方`;
      case '賑やか':
        return `${label}な方`;
      case '自分の時間を楽しめる':
        return `${label}方`;
      case '交流が生まれる':
        return `${label}方`;
      case '会話を楽しめる':
        return `${label}方`;
      case 'アットホーム':
        return `${label}な方`;
      case 'スタイリッシュ':
        return `${label}な方`;
      default:
        return `${label}な方`;
    }
  } else {
    return 'どちらも楽しめる';
  }
};

/**
 * スコアから右側（description_right）の色の割合を計算
 * @param score スコア値 (-2.0 ～ +2.0)
 * @returns 0～100の割合
 */
export const scoreToRightPercentage = (score: number): number => {
  // -2.0 ～ +2.0 を 0% ～ 100% に変換
  return Math.max(0, Math.min(100, ((score + 2) / 4) * 100));
};

/**
 * スコアからマーカー位置を計算（50%を中心とした実際の位置）
 * @param score スコア値 (-2.0 ～ +2.0)
 * @returns 0～100の位置
 */
export const scoreToMarkerPosition = (score: number): number => {
  // -2.0 ～ +2.0 を 0% ～ 100% に変換
  return Math.max(0, Math.min(100, ((score + 2) / 4) * 100));
};

/**
 * スコアに基づいて色を取得
 * @param score スコア値 (-2.0 ～ +2.0)
 * @returns CSSカラー文字列
 */
export const getScoreColor = (score: number): string => {
  if (score === 0) return 'rgba(255, 255, 255, 0.8)';
  const rightPercentage = scoreToRightPercentage(score);
  if (rightPercentage > 50) {
    // 右側（ピンク）が優勢
    return 'rgba(235, 14, 242, 0.8)';
  } else {
    // 左側（シアン）が優勢
    return 'rgba(0, 194, 255, 0.8)';
  }
};