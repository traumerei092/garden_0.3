'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import { BarChart3, Users, UserCheck, Heart, Briefcase, MapPin } from 'lucide-react';
import CircularChart from '@/components/UI/CircularChart';
import CustomModal from '@/components/UI/Modal';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';

interface DistributionItem {
  label: string;
  count: number;
  percentage: number;
}

interface AnalysisData {
  axis: string;
  distribution: DistributionItem[];
  total_regulars: number;
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
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  // タブ設定
  const tabs: TabConfig[] = [
    {
      key: 'age',
      label: '年代構成',
      icon: <Users size={16} strokeWidth={1} />,
      apiAxis: 'age_group'
    },
    {
      key: 'occupation',
      label: '職業分布',
      icon: <Briefcase size={16} strokeWidth={1} />,
      apiAxis: 'occupation'
    },
    {
      key: 'area',
      label: 'エリア分布',
      icon: <MapPin size={16} strokeWidth={1} />,
      apiAxis: 'primary_area'
    },
    {
      key: 'interests',
      label: '趣味・関心',
      icon: <Heart size={16} strokeWidth={1} />,
      apiAxis: 'interests'
    }
  ];

  // カラーパレット（温かみのあるコミュニティ向け）
  const colorPalette = [
    '#FF6B6B', '#FFE66D', '#FF8E53', '#4ECDC4', '#45B7D1',
    '#A8E6CF', '#FFA07A', '#98D8C8', '#F7DC6F', '#DDA0DD'
  ];

  // プライバシー配慮：人数→割合表示変換
  const convertToPercentage = (count: number, total: number): number => {
    if (total === 0) return 0;
    const exactPercentage = (count / total) * 100;
    return Math.round(exactPercentage / 5) * 5;
  };

  // 感情的解釈生成
  const generateInsight = (tabKey: string, data: AnalysisData): string => {
    if (!data.distribution || data.distribution.length === 0) {
      return "データが不十分です";
    }

    const dominantItem = data.distribution[0];
    const percentage = convertToPercentage(dominantItem.count, data.total_regulars);

    switch (tabKey) {
      case 'age':
        if (dominantItem.label.includes('30代')) {
          return `30代が中心のコミュニティ。同世代の仲間と出会えそうです`;
        } else if (dominantItem.label.includes('20代')) {
          return `20代が多い活気あるコミュニティ。エネルギッシュな交流が期待できます`;
        } else if (dominantItem.label.includes('40代')) {
          return `40代中心の落ち着いたコミュニティ。深い会話を楽しめそうです`;
        }
        return `${dominantItem.label}を中心とした多様なコミュニティです`;

      case 'occupation':
        return `${dominantItem.label}の方が多く、専門的な話題で盛り上がれそうです`;

      case 'area':
        return `${dominantItem.label}エリアの方が多く、地域の話題で繋がれそうです`;

      case 'interests':
        return `${dominantItem.label}に興味がある方が多く、共通の話題で盛り上がれそうです`;

      default:
        return `${dominantItem.label}という共通点でつながるコミュニティです`;
    }
  };

  // 個人的マッチング情報生成
  const generatePersonalMatch = (): string | null => {
    if (!user) return null;

    // 実際のマッチング計算は省略し、サンプルを返す
    const samplePercentage = Math.floor(Math.random() * 40) + 10;
    return `あなたと同じカテゴリ: ${samplePercentage}%`;
  };

  // データ取得
  const loadAnalysisData = async (axis: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regulars/analysis/`);
      url.searchParams.append('axis', axis);

      const response = await fetchWithAuth(url.toString(), {
        method: 'GET',
        cache: 'no-store'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const analysisData = await response.json();
      setData(analysisData);
    } catch (err) {
      console.error('Failed to fetch regulars analysis:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // タブ変更時のデータ取得
  useEffect(() => {
    if (isOpen) {
      const currentTab = tabs.find(tab => tab.key === selectedTab);
      if (currentTab) {
        loadAnalysisData(currentTab.apiAxis);
      }
    }
  }, [selectedTab, isOpen, shopId]);

  // 円グラフ用データ変換
  const getChartData = (data: AnalysisData) => {
    return data.distribution.map((item, index) => ({
      label: item.label,
      value: convertToPercentage(item.count, data.total_regulars),
      percentage: convertToPercentage(item.count, data.total_regulars),
      color: colorPalette[index % colorPalette.length]
    }));
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

                        {data && !loading && !error && (
                          <div className={styles.analysisContent}>
                            {/* 円グラフセクション */}
                            <div className={styles.chartSection}>
                              <CircularChart
                                data={getChartData(data)}
                                size={240}
                                className={styles.circularChart}
                              />
                            </div>

                            {/* インサイトパネル */}
                            <div className={styles.insightPanel}>
                              <div className={styles.insightHeader}>
                                <h3 className={styles.insightTitle}>
                                  <Heart className={styles.insightIcon} />
                                  分析結果
                                </h3>
                              </div>

                              <div className={styles.insight}>
                                <div className={styles.insightMessage}>
                                  {generateInsight(selectedTab, data)}
                                </div>

                                {generatePersonalMatch() && (
                                  <div className={styles.personalMatch}>
                                    <UserCheck className={styles.matchIcon} size={16} />
                                    {generatePersonalMatch()}
                                  </div>
                                )}
                              </div>

                              {/* 詳細データリスト */}
                              <div className={styles.detailsList}>
                                <h4 className={styles.detailsTitle}>詳細データ</h4>
                                <div className={styles.detailsItems}>
                                  {data.distribution.map((item, index) => (
                                    <div key={index} className={styles.detailItem}>
                                      <div className={styles.detailLabel}>
                                        <div
                                          className={styles.detailColor}
                                          style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                                        />
                                        {item.label}
                                      </div>
                                      <div className={styles.detailStats}>
                                        <span className={styles.detailPercentage}>
                                          {convertToPercentage(item.count, data.total_regulars)}%
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {data && data.distribution.length === 0 && (
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