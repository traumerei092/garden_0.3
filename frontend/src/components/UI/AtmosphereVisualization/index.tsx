'use client';

import React, { useState, useEffect } from 'react';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import styles from './style.module.scss';

interface AtmosphereIndicator {
  id: number;
  name: string;
  description_left: string;
  description_right: string;
}

interface AtmosphereAggregate {
  shop: string;
  atmosphere_averages: Record<string, number>; // indicator_id -> average_score
  total_feedbacks: number;
  last_updated: string | null;
}

interface AtmosphereVisualizationProps {
  shopId: number;
  className?: string;
  showTitle?: boolean;
  showConfidence?: boolean;
}

const AtmosphereVisualization: React.FC<AtmosphereVisualizationProps> = ({
  shopId,
  className = '',
  showTitle = true,
  showConfidence = true
}) => {
  const [indicators, setIndicators] = useState<AtmosphereIndicator[]>([]);
  const [aggregate, setAggregate] = useState<AtmosphereAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAtmosphereData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 指標とアグリゲートデータを並行取得
        const [indicatorsResponse, aggregateResponse] = await Promise.all([
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/atmosphere_indicators/`),
          fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/atmosphere_aggregate/`)
        ]);

        if (indicatorsResponse.ok) {
          const indicatorsData = await indicatorsResponse.json();
          setIndicators(indicatorsData);
        } else {
          throw new Error('指標データの取得に失敗しました');
        }

        if (aggregateResponse.ok) {
          const aggregateData = await aggregateResponse.json();
          setAggregate(aggregateData);
        } else if (aggregateResponse.status === 404) {
          // アグリゲートデータがない場合（まだフィードバックがない）
          setAggregate(null);
        } else {
          throw new Error('アグリゲートデータの取得に失敗しました');
        }

      } catch (err) {
        console.error('Failed to fetch atmosphere data:', err);
        setError(err instanceof Error ? err.message : '雰囲気データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchAtmosphereData();
    }
  }, [shopId]);

  // スコアから右側（description_right）の色の割合を計算
  const scoreToRightPercentage = (score: number): number => {
    // -2.0 ～ +2.0 を 0% ～ 100% に変換
    return Math.max(0, Math.min(100, ((score + 2) / 4) * 100));
  };

  // スコアからマーカー位置を計算（50%を中心とした実際の位置）
  const scoreToMarkerPosition = (score: number): number => {
    // -2.0 ～ +2.0 を 0% ～ 100% に変換
    return Math.max(0, Math.min(100, ((score + 2) / 4) * 100));
  };

  // スコアに基づいて色を取得
  const getScoreColor = (score: number): string => {
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

  // スコアに基づいて表示テキストを生成
  const getScoreText = (score: number, leftLabel: string, rightLabel: string): string => {
    if (score === 0) return 'どちらでもない';
    
    const absScore = Math.abs(score);
    const isRight = score > 0;
    const label = isRight ? rightLabel : leftLabel;
    
    if (absScore >= 1.5) {
      return label;
    } else if (absScore >= 0.5) {
      return `やや${label}`;
    } else {
      return 'どちらでもない';
    }
  };

  // 信頼度レベルの表示テキスト
  const getConfidenceText = (level: string, count: number): string => {
    switch (level) {
      case 'high':
        return `高い信頼度 (${count}件の評価)`;
      case 'medium':
        return `中程度の信頼度 (${count}件の評価)`;
      case 'low':
        return `低い信頼度 (${count}件の評価)`;
      default:
        return `${count}件の評価`;
    }
  };

  // 信頼度レベルのクラス名
  const getConfidenceClass = (level: string): string => {
    switch (level) {
      case 'high':
        return styles.confidenceHigh;
      case 'medium':
        return styles.confidenceMedium;
      case 'low':
        return styles.confidenceLow;
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>雰囲気データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.errorContainer}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!aggregate || !aggregate.atmosphere_averages || indicators.length === 0 || aggregate.total_feedbacks === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.noDataContainer}>
          <p>まだ雰囲気のフィードバックがありません</p>
          <p className={styles.noDataSubtext}>
            最初のフィードバックを追加して、他のユーザーの参考にしましょう！
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      {showTitle && (
        <div className={styles.header}>
          <h3 className={styles.title}>雰囲気マップ</h3>
          {showConfidence && aggregate && aggregate.total_feedbacks > 0 && (
            <div className={`${styles.confidence} ${getConfidenceClass('medium')}`}>
              {getConfidenceText('medium', aggregate.total_feedbacks)}
            </div>
          )}
        </div>
      )}

      <div className={styles.indicators}>
        {indicators.map((indicator) => {
          const score = aggregate?.atmosphere_averages?.[indicator.id.toString()] || 0;
          const rightPercentage = scoreToRightPercentage(score);
          const leftPercentage = 100 - rightPercentage;
          const markerPosition = scoreToMarkerPosition(score);
          

          return (
            <div key={indicator.id} className={styles.indicatorItem}>
              <div className={styles.indicatorHeader}>
                <span className={styles.indicatorName}>
                  {indicator.name}
                </span>
                <div 
                  className={styles.scoreChip}
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    borderColor: getScoreColor(score),
                    backgroundColor: `${getScoreColor(score)}15`,
                    fontSize: '9px'
                  }}
                >
                  {getScoreText(score, indicator.description_left, indicator.description_right)}
                </div>
              </div>

              <div className={styles.barContainer}>
                <div className={styles.barTrack}>
                  <div 
                    className={styles.barFill}
                    style={{ 
                      width: '100%',
                      background: `linear-gradient(90deg, 
                        rgba(0,194,255,1) 0%, 
                        rgba(0,194,255,0.6) ${Math.max(0, leftPercentage - 8)}%, 
                        rgba(117,104,249,0.4) ${leftPercentage}%, 
                        rgba(235,14,242,0.6) ${Math.min(100, leftPercentage + 8)}%, 
                        rgba(235,14,242,1) 100%)`
                    }}
                  />
                  {/* スコア位置マーカー */}
                  <div 
                    className={styles.scoreMarker}
                    style={{ 
                      left: `${leftPercentage}%`
                    }}
                    title={`Score: ${score.toFixed(2)} | Position: ${markerPosition.toFixed(1)}%`}
                  />
                </div>
                
                <div className={styles.labels}>
                  <span className={styles.negativeLabel}>
                    {indicator.description_left}
                  </span>
                  <span className={styles.positiveLabel}>
                    {indicator.description_right}
                  </span>
                </div>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AtmosphereVisualization;