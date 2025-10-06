'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { UserCheck, Users, Coffee, Heart } from 'lucide-react';
import { fetchCommonalities, CommonalitiesData } from '@/actions/shop/commonalities';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';

interface CommonalitiesSectionProps {
  shopId: number;
  className?: string;
  refreshTrigger?: number;
}

const CommonalitiesSection: React.FC<CommonalitiesSectionProps> = ({
  shopId,
  className = '',
  refreshTrigger
}) => {
  const [data, setData] = useState<CommonalitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const loadData = useCallback(async () => {
    // ユーザー情報がない場合は何もしない
    if (!user?.id) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const commonalitiesData = await fetchCommonalities(shopId);
      setData(commonalitiesData);
    } catch (err) {
      console.error('Failed to fetch commonalities:', err);
      // 認証エラーの場合は何も表示しない
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('Unauthorized'))) {
        setData(null);
        setError(null);
      } else {
        setError('データの取得に失敗しました');
      }
    } finally {
      setLoading(false);
    }
  }, [shopId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadData();
    }
  }, [refreshTrigger]);

  // ユーザー情報がない場合は何も表示しない
  if (!user?.id) {
    return null;
  }

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

  if (error) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.errorState}>
          <p>🔍 共通点のデータがありません</p>
          <span className={styles.errorSubtext}>
            プロフィール登録を完了すると、常連さんとの共通点を表示できます
          </span>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // 常連数が少ない場合のメッセージ
  if (data.total_regulars < 3) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.insufficientData}>
          <h3 className={styles.title}>
            <UserCheck className={styles.titleIcon} strokeWidth={1} />
            あなたとの共通点
          </h3>
          <p className={styles.insufficientMessage}>
            常連さんがもう少し増えると、<br />
            あなたと常連さんとの共通点を分析できます
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

  // 共通点がない場合
  if (!data.has_commonalities) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.noCommonalities}>
          <h3 className={styles.title}>
            <UserCheck className={styles.titleIcon} strokeWidth={1} />
            あなたとの共通点
          </h3>
          <p className={styles.noCommonalitiesMessage}>
            現在、常連さんとの共通点が見つかりませんでした。<br />
            プロフィールを詳しく登録すると、より多くの共通点を発見できます。
          </p>
        </div>
      </div>
    );
  }

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'age_gender':
        return <Users size={14} strokeWidth={1} />;
      case 'atmosphere_preferences':
        return <Heart size={14} strokeWidth={1} />;
      case 'visit_purposes':
        return <Coffee size={14} strokeWidth={1} />;
      default:
        return <UserCheck size={14} strokeWidth={1} />;
    }
  };

  const formatCommonalityMessage = (point: any) => {
    if (point.total_count === 0 || point.commonalities.length === 0) {
      return '';
    }

    switch (point.category) {
      case 'age_gender':
        return (
          <>
            <span className={styles.commonalityCount}>{point.total_count}人</span>の常連さんがあなたと同じ
            <span className={styles.commonalityValue}>{point.commonalities.join('・')}</span>です
          </>
        );
      case 'atmosphere_preferences':
        return (
          <>
            <span className={styles.commonalityCount}>{point.total_count}人</span>の常連さんがあなたと似た
            <span className={styles.commonalityValue}>{point.commonalities.join('・')}</span>の好みです
          </>
        );
      case 'visit_purposes':
        return (
          <>
            <span className={styles.commonalityCount}>{point.total_count}人</span>の常連さんがあなたと同じ
            <span className={styles.commonalityValue}>{point.commonalities.join('・')}</span>で利用しています
          </>
        );
      default:
        return (
          <>
            <span className={styles.commonalityCount}>{point.total_count}人</span>の常連さんと共通：
            <span className={styles.commonalityValue}>{point.commonalities.join('・')}</span>
          </>
        );
    }
  };

  const commonPoints = [
    data.age_gender,
    data.atmosphere_preferences,
    data.visit_purposes
  ].filter(point => point.commonalities.length > 0);

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <UserCheck className={styles.titleIcon} strokeWidth={1} />
          あなたとの共通点
        </h3>
        <div className={styles.regularsCount}>
          常連{data.total_regulars}人と比較
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.commonalities}>
          {commonPoints.map((point) => (
            <div key={point.category} className={styles.commonalityItem}>
              <div className={styles.commonalityIcon}>
                {getIconForCategory(point.category)}
              </div>
              <div className={styles.commonalityContent}>
                <div className={styles.commonalityMessage}>
                  {formatCommonalityMessage(point)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {commonPoints.length === 0 && (
          <div className={styles.noCommonalities}>
            <p className={styles.noCommonalitiesMessage}>
              現在、表示できる共通点がありません。<br />
              プロフィールを詳しく登録すると、共通点を発見できます。
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommonalitiesSection;