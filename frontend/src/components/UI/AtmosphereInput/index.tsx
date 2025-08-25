'use client';

import React, { useState, useEffect } from 'react';
import AtmosphereSlider from '@/components/UI/AtmosphereSlider';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import styles from './style.module.scss';

// 雰囲気指標の型定義
interface AtmosphereIndicator {
  id: number;
  name: string;
  description_left: string;
  description_right: string;
}

// 雰囲気スコア（指標ID → スコア値）
export interface AtmosphereScores {
  [indicatorId: string]: number;
}

interface AtmosphereInputProps {
  shopId?: number;
  initialScores?: AtmosphereScores;
  onScoresChange: (scores: AtmosphereScores) => void;
  title?: string;
  description?: string;
}

const AtmosphereInput: React.FC<AtmosphereInputProps> = ({
  shopId,
  initialScores = {},
  onScoresChange,
  title = "店舗の雰囲気を教えてください",
  description = "あなたが感じた店舗の雰囲気を5段階で評価してください"
}) => {
  const [indicators, setIndicators] = useState<AtmosphereIndicator[]>([]);
  const [scores, setScores] = useState<AtmosphereScores>(initialScores);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 指標データを取得
  useEffect(() => {
    const fetchIndicators = async () => {
      try {
        setLoading(true);
        
        // shopIdがある場合はそのAPIを使用、なければ汎用的なエンドポイントを想定
        const url = shopId 
          ? `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/atmosphere_indicators/`
          : `${process.env.NEXT_PUBLIC_API_URL}/atmosphere-indicators/`; // 今後必要に応じて追加
          
        const response = await fetchWithAuth(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setIndicators(data);
        
        // 初期スコアが設定されていない場合は、すべて0で初期化
        if (Object.keys(initialScores).length === 0) {
          const defaultScores: AtmosphereScores = {};
          data.forEach((indicator: AtmosphereIndicator) => {
            defaultScores[indicator.id.toString()] = 0;
          });
          setScores(defaultScores);
          onScoresChange(defaultScores);
        }
        
      } catch (err) {
        console.error('Failed to fetch atmosphere indicators:', err);
        setError('雰囲気指標の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchIndicators();
  }, [shopId]);

  // initialScoresが変更された場合にscoresを更新（一度だけ）
  useEffect(() => {
    if (Object.keys(initialScores).length > 0 && indicators.length > 0) {
      setScores(initialScores);
    }
  }, [Object.keys(initialScores).length, indicators.length]);

  // スコア変更ハンドラー
  const handleScoreChange = (indicatorId: number, score: number) => {
    const newScores = {
      ...scores,
      [indicatorId.toString()]: score
    };
    setScores(newScores);
    onScoresChange(newScores);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
        <p>雰囲気指標を読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className={styles.retryButton}
        >
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className={styles.atmosphereInput}>
      {title && (
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.description}>{description}</p>
        </div>
      )}

      <div className={styles.indicatorsList}>
        {indicators.map((indicator) => (
          <AtmosphereSlider
            key={indicator.id}
            indicator={indicator}
            value={scores[indicator.id.toString()] || 0}
            onChange={(value) => handleScoreChange(indicator.id, value)}
          />
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.footerNote}>
          評価は匿名で集計され、他のユーザーの参考情報として活用されます。
        </p>
      </div>
    </div>
  );
};

export default AtmosphereInput;