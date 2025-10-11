/**
 * 常連客の詳細分析データ取得用ファイル
 *
 * 用途: RegularsAnalysisModal（詳細分析モーダル）専用
 * - 各軸（年齢、雰囲気、利用シーン、職業、趣味）の詳細分布データ
 * - 円グラフ表示用の実データ取得
 * - ユーザー個別の共通点分析
 *
 * エンドポイント: /api/shops/{shop_id}/regulars/analysis/
 * パラメータ: axis（age_group, atmosphere_preference, usage_scenes, occupation, interests）
 */

import { fetchWithSession } from '@/app/lib/fetchWithSession';

// 常連客スナップショット取得
export async function fetchRegularsSnapshot(shopId: number) {
  try {
    const response = await fetchWithSession(
      `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regulars/snapshot/`,
      {
        method: 'GET',
        cache: 'no-store'
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch regulars snapshot:', error);
    throw error;
  }
}

// 常連客詳細分析取得
export async function fetchRegularsAnalysis(shopId: number, axis: string) {
  console.log('=== fetchRegularsAnalysis called ===');
  console.log('shopId:', shopId, 'axis:', axis);
  console.log('NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regulars/analysis/`);
    url.searchParams.append('axis', axis);

    console.log('Request URL:', url.toString());

    const response = await fetchWithSession(url.toString(), {
      method: 'GET',
      cache: 'no-store'
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Failed to fetch regulars analysis:', error);
    throw error;
  }
}