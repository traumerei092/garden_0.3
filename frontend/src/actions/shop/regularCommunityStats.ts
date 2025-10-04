/**
 * 常連コミュニティ統計API
 */

import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

// 型定義
export interface AtmosphereTendencyData {
  tag: string;
  tendency: 'solitude' | 'flexible' | 'community' | null;
  percentage: number;
}

export interface VisitPurposeData {
  tag: string;
  purpose_name: string | null;
}

export interface RegularCommunitySummary {
  age_gender_summary: string;
  atmosphere_tendency: AtmosphereTendencyData;
  popular_visit_purpose: VisitPurposeData;
  regular_count: number;
}

export interface CommonalityData {
  percentage: number;
  text: string;
}

export interface UserCommonalities {
  age_gender?: CommonalityData;
  atmosphere?: CommonalityData;
  visit_purpose?: CommonalityData;
}

export interface RegularCommunityStatsResponse {
  summary: RegularCommunitySummary;
  commonalities: UserCommonalities;
  last_calculated: string;
}

/**
 * 店舗の常連コミュニティ統計を取得
 */
export const fetchRegularCommunityStats = async (
  shopId: number
): Promise<RegularCommunityStatsResponse> => {
  try {
    const response = await fetchWithAuth(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular_community_stats/`
    );

    if (!response.ok) {
      throw new Error(`統計データの取得に失敗しました: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Regular community stats fetch error:', error);
    throw error;
  }
};

/**
 * 雰囲気傾向のスタイリング用ヘルパー
 */
export const getAtmosphereTendencyStyle = (tendency: string | null): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} => {
  switch (tendency) {
    case 'solitude':
      return {
        backgroundColor: '#E3F2FD',
        color: '#1976D2',
        borderColor: '#1976D2',
      };
    case 'flexible':
      return {
        backgroundColor: '#F3E5F5',
        color: '#7B1FA2',
        borderColor: '#7B1FA2',
      };
    case 'community':
      return {
        backgroundColor: '#E8F5E8',
        color: '#388E3C',
        borderColor: '#388E3C',
      };
    default:
      return {
        backgroundColor: '#F5F5F5',
        color: '#757575',
        borderColor: '#BDBDBD',
      };
  }
};

/**
 * パーセンテージの表示用フォーマット
 */
export const formatPercentage = (percentage: number): string => {
  if (percentage === 0) return '0%';
  if (percentage < 1) return '<1%';
  return `${Math.round(percentage)}%`;
};