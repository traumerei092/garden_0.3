'use client';

import React, { useState, useEffect } from 'react';
import { User, DoorOpen, Gamepad2, TrendingUp } from 'lucide-react';
import { fetchRegularsSnapshot } from '@/actions/shop/regulars';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import styles from './style.module.scss';

interface RegularsCoreGroup {
  age_group: string;
  gender: string;
}

interface RegularsSnapshotData {
  core_group: RegularsCoreGroup;
  atmosphere_summary: string;
  top_interests: string[];
  total_regulars: number;
}

interface RegularsSnapshotProps {
  shopId: number;
  onViewDetails: () => void;
  className?: string;
}

const RegularsSnapshot: React.FC<RegularsSnapshotProps> = ({ 
  shopId, 
  onViewDetails,
  className = '' 
}) => {
  const [data, setData] = useState<RegularsSnapshotData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const snapshotData = await fetchRegularsSnapshot(shopId);
        setData(snapshotData);
      } catch (err) {
        console.error('Failed to fetch regulars snapshot:', err);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [shopId]);

  if (loading) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loadingState}>
          <div className={styles.shimmer}>
            <div className={styles.shimmerTitle}></div>
            <div className={styles.shimmerContent}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.errorState}>
          <p>📊 常連さんのデータがありません</p>
          <span className={styles.errorSubtext}>
            もう少し評価が集まると、傾向を分析できます
          </span>
        </div>
      </div>
    );
  }

  // データ不足の場合の表示
  if (data.total_regulars < 3) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.insufficientData}>
          <h3 className={styles.title}>
            <TrendingUp className={styles.titleIcon} />
            常連さんの傾向
          </h3>
          <p className={styles.insufficientMessage}>
            もう少し「行きつけ」登録が増えると、<br />
            常連さんの傾向を分析できます
          </p>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${(data.total_regulars / 3) * 100}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>
              {data.total_regulars}/3人の登録
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <TrendingUp className={styles.titleIcon} strokeWidth={1} />
          常連さんの傾向
        </h3>
        <ButtonGradientWrapper
          type='button'
          anotherStyle={styles.detailsButton}
          onClick={onViewDetails}
        >
          詳しく見る
        </ButtonGradientWrapper>
      </div>

      <div className={styles.content}>
        <div className={styles.insights}>
          {/* 中心層 */}
          <div className={styles.insightItem}>
            <div className={styles.insightIcon}>
              <User size={14} strokeWidth={1}/>
            </div>
            <div className={styles.insightContent}>
              <span className={styles.insightValue}>
                {data.core_group.age_group}の{data.core_group.gender}
              </span>
              <span className={styles.insightValue}>が多い</span>
            </div>
          </div>

          {/* 主な興味 */}
          <div className={styles.insightItem}>
            <div className={styles.insightIcon}>
              <Gamepad2 size={14} strokeWidth={1} />
            </div>
            <div className={styles.insightContent}>
              <span className={styles.insightValue}>
                {data.top_interests.length > 0 
                  ? data.top_interests.join(' • ') 
                  : 'データ不足'
                }
              </span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default RegularsSnapshot;