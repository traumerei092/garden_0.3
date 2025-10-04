'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { User, Users, TrendingUp } from 'lucide-react';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { fetchCommonalities, CommonalitiesData } from '@/actions/shop/commonalities';
import { fetchRegularCommunityStats, RegularCommunityStatsResponse, formatPercentage } from '@/actions/shop/regularCommunityStats';
import { useAuthStore } from '@/store/useAuthStore';
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
  age_distribution: Record<string, number>;
  occupation_distribution: Record<string, number>;
  area_distribution: Record<string, number>;
}

interface RegularsCommunityProps {
  shopId: number;
  onViewDetails: () => void;
  className?: string;
  refreshTrigger?: number;
}

const RegularsCommunitySection: React.FC<RegularsCommunityProps> = ({
  shopId,
  onViewDetails,
  className = '',
  refreshTrigger
}) => {
  const [regularsData, setRegularsData] = useState<RegularsSnapshotData | null>(null);
  const [communityStats, setCommunityStats] = useState<RegularCommunityStatsResponse | null>(null);
  const [commonalitiesData, setCommonalitiesData] = useState<CommonalitiesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // データ変換ユーティリティ
  const convertToPercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    const exactPercentage = (count / total) * 100;
    return Math.round(exactPercentage / 5) * 5;
  };

  const getEmotionalExpression = (percentage: number): string => {
    if (percentage >= 40) return "多く";
    if (percentage >= 20) return "そこそこ";
    if (percentage >= 10) return "少し";
    return "わずかに";
  };

  const generateCommunityInsight = (data: RegularsSnapshotData): string => {
    const ageDescriptions = {
      '20代': '20代が中心の活気ある若い',
      '30代': '30代が中心の落ち着いた働き盛りの',
      '40代': '40代が中心の経験豊富な大人の',
      '50代': '50代が中心の落ち着きのある成熟した'
    };

    return `${ageDescriptions[data.core_group.age_group as keyof typeof ageDescriptions] || '多様な'}空間`;
  };


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 常連データの取得
      const regularsResponse = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regulars/snapshot/`,
        {
          method: 'GET',
          cache: 'no-store'
        }
      );

      if (!regularsResponse.ok) {
        throw new Error(`HTTP error! status: ${regularsResponse.status}`);
      }

      const regularsSnapshot = await regularsResponse.json();
      setRegularsData(regularsSnapshot);

      // 常連コミュニティ統計の取得
      try {
        const statsData = await fetchRegularCommunityStats(shopId);
        setCommunityStats(statsData);
      } catch (err) {
        console.error('Community stats fetch failed:', err);
        setCommunityStats(null);
      }

      // 共通点データの取得（ユーザーがログインしている場合のみ）
      if (user?.id) {
        try {
          const commonalitiesSnapshot = await fetchCommonalities(shopId);
          setCommonalitiesData(commonalitiesSnapshot);
        } catch (err) {
          console.error('Commonalities fetch failed:', err);
          // 共通点データの取得に失敗しても常連データは表示する
          setCommonalitiesData(null);
        }
      }

    } catch (err) {
      console.error('Failed to fetch community data:', err);
      setError('データの取得に失敗しました');
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
  }, [refreshTrigger, loadData]);

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

  if (error || !regularsData) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.errorState}>
          <p>コミュニティデータがありません</p>
          <span className={styles.errorSubtext}>
            もう少し評価が集まると、コミュニティの分析ができます
          </span>
        </div>
      </div>
    );
  }

  // データ不足の場合
  if (regularsData.total_regulars < 3) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.insufficientData}>
          <h3 className={styles.title}>
            <TrendingUp className={styles.titleIcon} />
            コミュニティ
          </h3>
          <p className={styles.insufficientMessage}>
            もう少し「行きつけ」登録が増えると、<br />
            コミュニティの魅力をお伝えできます
          </p>
          <div className={styles.progressContainer}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${(regularsData.total_regulars / 3) * 100}%` }}
              ></div>
            </div>
            <span className={styles.progressText}>
              {regularsData.total_regulars}/3人の登録
            </span>
          </div>
        </div>
      </div>
    );
  }

  // 共通点データの処理（新しいAPI対応）
  const renderPersonalConnection = () => {
    if (!user?.id) {
      return null;
    }

    // 新しいAPI（communityStats）を優先使用
    if (communityStats?.commonalities) {
      const { commonalities } = communityStats;
      const hasAnyCommonalities = commonalities.age_gender || commonalities.atmosphere || commonalities.visit_purpose;

      if (!hasAnyCommonalities) {
        return null;
      }

      return (
        <div className={styles.regularsSummary}>
          <div className={styles.summaryTitle}>あなたとの共通度</div>
          <div className={styles.commonalityTags}>
            {commonalities.age_gender && (
              <div className={`${styles.tag} ${styles.commonalityTag}`}>
                {commonalities.age_gender.text}
              </div>
            )}
            {commonalities.atmosphere && (
              <div className={`${styles.tag} ${styles.commonalityTag}`}>
                {commonalities.atmosphere.text}
              </div>
            )}
            {commonalities.visit_purpose && (
              <div className={`${styles.tag} ${styles.commonalityTag}`}>
                {commonalities.visit_purpose.text}
              </div>
            )}
          </div>
        </div>
      );
    }

    // フォールバック: 従来のAPI
    if (!commonalitiesData || !commonalitiesData.has_commonalities) {
      return null;
    }

    const commonPoints = [
      commonalitiesData.age_gender,
      commonalitiesData.atmosphere_preferences,
      commonalitiesData.visit_purposes
    ].filter(point => point && point.commonalities && point.commonalities.length > 0);

    if (commonPoints.length === 0) {
      return null;
    }

    // 最も関連度の高い共通点を選択
    const primaryMatch = commonPoints[0];
    const secondaryMatches = commonPoints.slice(1);

    // プライバシー配慮：人数から割合表示に変換
    const primaryPercentage = convertToPercentage(primaryMatch.total_count, commonalitiesData.total_regulars);
    const primaryEmotional = getEmotionalExpression(primaryPercentage);

    return (
      <div className={styles.personalConnection}>
        <div className={styles.connectionHighlight}>
          <span className={styles.highlightText}>
            あなたと同じ{primaryMatch.commonalities.join('・')}の方が{primaryEmotional}います
          </span>
          {primaryPercentage >= 10 && (
            <span className={styles.percentageText}>({primaryPercentage}%)</span>
          )}
        </div>

        {secondaryMatches.length > 0 && (
          <div className={styles.additionalConnections}>
            {secondaryMatches.map((match) => {
              const percentage = convertToPercentage(match.total_count, commonalitiesData.total_regulars);
              return percentage >= 10 ? (
                <span key={match.category} className={styles.connectionItem}>
                  {match.commonalities.join('・')}: {percentage}%
                </span>
              ) : null;
            }).filter(Boolean)}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>
          <Users className={styles.titleIcon} strokeWidth={1} />
          常連客の特徴
        </h3>
        <ButtonGradientWrapper
          type='button'
          anotherStyle={styles.detailsButton}
          onClick={onViewDetails}
        >
          詳しく見る
        </ButtonGradientWrapper>
      </div>

      {/* メインビジュアル - コミュニティの第一印象 */}
      <div className={styles.communityPreview}>
        <div className={styles.avatarGroup}>
          {/* アイコンベースのアバター表現 */}
          <div className={styles.avatar}>
            <User size={14} strokeWidth={1} />
          </div>
          <div className={styles.avatar}>
            <User size={14} strokeWidth={1} />
          </div>
          <div className={styles.avatar}>
            <User size={14} strokeWidth={1} />
          </div>
          <div className={styles.avatarMore}>+{regularsData.total_regulars - 3}</div>
        </div>
        <div className={styles.communityDescription}>
          {generateCommunityInsight(regularsData)}
        </div>
      </div>

      {/* 常連サマリー（タグ形式） */}
      <div className={styles.regularsSummary}>
        <div className={styles.summaryTitle}>常連客の特徴</div>
        <div className={styles.summaryTags}>
          {communityStats ? (
            <>
              <div className={`${styles.tag} ${styles.regularsSummaryTag}`}>
                {communityStats.summary.age_gender_summary}
              </div>
              <div
                className={`${styles.tag} ${styles.regularsSummaryTag}`}
              >
                {communityStats.summary.atmosphere_tendency.tag}
              </div>
              <div className={`${styles.tag} ${styles.regularsSummaryTag}`}>
                {communityStats.summary.popular_visit_purpose.purpose_name ?
                  `${communityStats.summary.popular_visit_purpose.purpose_name}で利用する方が多いです` :
                  '多様な利用シーンで楽しまれています'
                }
              </div>
            </>
          ) : (
            <>
              <div className={`${styles.tag} ${styles.ageGenderTag}`}>
                {regularsData.core_group.age_group}・{regularsData.core_group.gender}が中心
              </div>
              <div className={`${styles.tag} ${styles.atmosphereTag}`}>
                経験豊富な大人の空間
              </div>
              <div className={`${styles.tag} ${styles.visitPurposeTag}`}>
                {regularsData.top_interests.slice(0, 2).join('・')}が人気
              </div>
            </>
          )}
        </div>
      </div>

      {/* あなたとの共通点 */}
      {renderPersonalConnection()}
    </div>
  );
};

export default RegularsCommunitySection;