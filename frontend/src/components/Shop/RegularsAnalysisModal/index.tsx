'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import { BarChart3, Users, UserCheck, Heart, Briefcase } from 'lucide-react';
import CircularChart from '@/components/UI/CircularChart';
import CustomModal from '@/components/UI/Modal';
import { fetchRegularCommunityStats, RegularCommunityStatsResponse } from '@/actions/shop/regularCommunityStats';
import { fetchRegularsAnalysis } from '@/actions/shop/regulars';
import { useAuthSession } from '@/hooks/useAuthSession';
import styles from './style.module.scss';

interface DistributionItem {
  category: string;
  percentage: number;
}

interface TabData {
  axis: string;
  distribution: DistributionItem[];
  user_specific_info?: {
    percentage: number;
    text: string;
  };
}

interface TabConfig {
  key: string;
  label: string;
  icon: React.ReactNode;
  apiAxis: string;
}

interface RegularsAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: number;
  shopName?: string;
}

const RegularsAnalysisModal: React.FC<RegularsAnalysisModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName
}) => {
  const [selectedTab, setSelectedTab] = useState<string>('age');
  const [communityStats, setCommunityStats] = useState<RegularCommunityStatsResponse | null>(null);
  const [currentTabData, setCurrentTabData] = useState<TabData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabDataCache, setTabDataCache] = useState<Record<string, TabData>>({});
  const { user } = useAuthSession();

  // タブ設定
  const tabs: TabConfig[] = [
    {
      key: 'age',
      label: '年齢構成',
      icon: <Users size={16} strokeWidth={1} />,
      apiAxis: 'age_group'
    },
    {
      key: 'atmosphere',
      label: '好みの雰囲気',
      icon: <Heart size={16} strokeWidth={1} />,
      apiAxis: 'atmosphere_preference'
    },
    {
      key: 'usage_scenes',
      label: '利用シーン',
      icon: <UserCheck size={16} strokeWidth={1} />,
      apiAxis: 'usage_scenes'
    },
    {
      key: 'occupation',
      label: '職業分布',
      icon: <Briefcase size={16} strokeWidth={1} />,
      apiAxis: 'occupation'
    },
    {
      key: 'interests',
      label: '趣味・関心',
      icon: <BarChart3 size={16} strokeWidth={1} />,
      apiAxis: 'interests'
    }
  ];

  // カラーパレット（Development Guidelinesに準拠）
  const colorPalette = [
    'rgb(0,255,255)',      // 第一強調色
    'rgb(0,198,255)',      // 第二強調色-青
    'rgba(235,14,242,0.8)', // 第二強調色-紫
    'rgba(0,255,255,0.7)',
    'rgba(0,198,255,0.7)',
    'rgba(235,14,242,0.6)',
    'rgba(255,255,255,0.3)',
    'rgba(0,255,255,0.5)',
    'rgba(0,198,255,0.5)',
    'rgba(235,14,242,0.4)'
  ];


  // 実データ取得関数
  const fetchTabData = async (axis: string) => {
    try {
      setLoading(true);
      setError(null);

      // キャッシュから取得を試行
      if (tabDataCache[axis]) {
        setCurrentTabData(tabDataCache[axis]);
        setLoading(false);
        return;
      }

      const data = await fetchRegularsAnalysis(shopId, axis);

      const tabData: TabData = {
        axis: axis,
        distribution: data.distribution || [],
        user_specific_info: data.user_specific_info
      };

      // キャッシュに保存
      setTabDataCache(prev => ({
        ...prev,
        [axis]: tabData
      }));

      setCurrentTabData(tabData);
    } catch (err) {
      console.error(`Failed to fetch ${axis} data:`, err);
      setError(`${axis}データの取得に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // 雰囲気データの処理（既存のAPIを使用）
  const processAtmosphereData = (stats: RegularCommunityStatsResponse) => {
    const atmosphereTendency = stats.summary.atmosphere_tendency;
    const mainTendency = atmosphereTendency.tendency;
    const percentage = atmosphereTendency.percentage;

    // 傾向に基づいて分布を作成
    const distributions: Record<string, DistributionItem[]> = {
      'solitude': [
        { category: '一人の時間を重視', percentage: percentage },
        { category: 'フレキシブル', percentage: (100 - percentage) * 0.6 },
        { category: 'コミュニティを重視', percentage: (100 - percentage) * 0.4 }
      ],
      'flexible': [
        { category: 'フレキシブル', percentage: percentage },
        { category: '一人の時間を重視', percentage: (100 - percentage) * 0.5 },
        { category: 'コミュニティを重視', percentage: (100 - percentage) * 0.5 }
      ],
      'community': [
        { category: 'コミュニティを重視', percentage: percentage },
        { category: 'フレキシブル', percentage: (100 - percentage) * 0.6 },
        { category: '一人の時間を重視', percentage: (100 - percentage) * 0.4 }
      ]
    };

    setCurrentTabData({
      axis: 'atmosphere_preference',
      distribution: (mainTendency && distributions[mainTendency]) || distributions['flexible'],
      user_specific_info: stats.commonalities?.atmosphere ? {
        percentage: stats.commonalities.atmosphere.percentage,
        text: stats.commonalities.atmosphere.text
      } : undefined
    });
  };



  // ユーザー固有情報の表示
  const getUserSpecificText = (): string | null => {
    if (!user || !currentTabData?.user_specific_info) return null;
    return currentTabData.user_specific_info.text;
  };

  // データ取得
  const loadCommunityStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const statsData = await fetchRegularCommunityStats(shopId);
      setCommunityStats(statsData);
    } catch (err) {
      console.error('Failed to fetch community stats:', err);
      setError(`データの取得に失敗しました: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // タブ変更時のデータ処理
  useEffect(() => {
    if (isOpen) {
      const tabConfig = tabs.find(tab => tab.key === selectedTab);
      if (tabConfig) {
        if (selectedTab === 'atmosphere' && communityStats) {
          // 雰囲気は既存APIを使用
          processAtmosphereData(communityStats);
        } else {
          // その他のタブは実データを取得
          fetchTabData(tabConfig.apiAxis);
        }
      }
    }
  }, [selectedTab, isOpen, communityStats]);

  // 初回データ取得
  useEffect(() => {
    if (isOpen) {
      loadCommunityStats();
    }
  }, [isOpen, shopId]);

  // 円グラフ用データ変換（上位3位 + その他）
  const getChartData = (data: TabData) => {
    const topThree = data.distribution.slice(0, 3);
    const others = data.distribution.slice(3);

    const chartData = topThree.map((item, index) => ({
      label: item.category,
      value: item.percentage,
      percentage: item.percentage,
      color: colorPalette[index % colorPalette.length]
    }));

    // その他をまとめる
    if (others.length > 0) {
      const othersTotal = others.reduce((sum, item) => sum + item.percentage, 0);
      chartData.push({
        label: 'その他',
        value: othersTotal,
        percentage: othersTotal,
        color: colorPalette[3 % colorPalette.length]
      });
    }

    return chartData;
  };

  // タブ変更ハンドラー
  const handleTabChange = (key: React.Key) => {
    setSelectedTab(key.toString());
  };

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={onClose}
      size="3xl"
      title={`コミュニティ詳細分析${shopName ? ` - ${shopName}` : ''}`}
    >
      <div className={styles.modalContent}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <BarChart3 className={styles.headerIcon} />
            <div>
              <h2 className={styles.modalTitle}>コミュニティ詳細分析</h2>
              {shopName && (
                <p className={styles.shopName}>{shopName}</p>
              )}
            </div>
          </div>
        </div>
              {/* タブナビゲーション */}
              <div className={styles.tabsContainer}>
                <Tabs
                  selectedKey={selectedTab}
                  onSelectionChange={handleTabChange}
                  variant="underlined"
                  className={styles.tabs}
                  classNames={{
                    tabList: styles.tabList,
                    tab: styles.tab,
                    tabContent: styles.tabContent,
                    panel: styles.tabPanel
                  }}
                >
                  {tabs.map(tab => (
                    <Tab
                      key={tab.key}
                      title={
                        <div className={styles.tabTitle}>
                          {tab.icon}
                          <span>{tab.label}</span>
                        </div>
                      }
                    >
                      {/* タブコンテンツ */}
                      <div className={styles.tabContentWrapper}>
                        {loading && (
                          <div className={styles.loadingState}>
                            <div className={styles.loadingSpinner}></div>
                            <p>データを分析中...</p>
                          </div>
                        )}

                        {error && (
                          <div className={styles.errorState}>
                            <p>❌ {error}</p>
                          </div>
                        )}

                        {currentTabData && !loading && !error && (
                          <div className={styles.analysisContent}>
                            {/* 円グラフセクション */}
                            <div className={styles.chartSection}>
                              <CircularChart
                                data={getChartData(currentTabData)}
                                size={240}
                                className={styles.circularChart}
                              />
                            </div>

                            {/* ユーザー固有情報パネル */}
                            <div className={styles.insightPanel}>
                              {getUserSpecificText() && (
                                <div className={styles.personalMatchSection}>
                                  <div className={styles.personalMatch}>
                                    <UserCheck className={styles.matchIcon} size={16} />
                                    {getUserSpecificText()}
                                  </div>
                                </div>
                              )}

                              {/* 詳細データリスト（上位3位のみ） */}
                              <div className={styles.detailsList}>
                                <h4 className={styles.detailsTitle}>詳細データ</h4>
                                <div className={styles.detailsItems}>
                                  {currentTabData.distribution.slice(0, 3).map((item, index) => (
                                    <div key={index} className={styles.detailItem}>
                                      <div className={styles.detailLabel}>
                                        <div
                                          className={styles.detailColor}
                                          style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                                        />
                                        {item.category}
                                      </div>
                                      <div className={styles.detailStats}>
                                        <span className={styles.detailPercentage}>
                                          {item.percentage.toFixed(1)}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {currentTabData && currentTabData.distribution.length === 0 && (
                          <div className={styles.emptyState}>
                            <p>📊 この項目での分析データがありません</p>
                            <span className={styles.emptySubtext}>
                              他のタブを確認してみてください
                            </span>
                          </div>
                        )}
                      </div>
                    </Tab>
                  ))}
                </Tabs>
              </div>
      </div>
    </CustomModal>
  );
};

export default RegularsAnalysisModal;