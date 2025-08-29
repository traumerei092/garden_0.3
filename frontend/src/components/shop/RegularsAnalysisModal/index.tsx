'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody } from '@nextui-org/react';
import { X, BarChart3, Users } from 'lucide-react';
import StyledAutocomplete, { AutocompleteOption } from '@/components/UI/StyledAutocomplete';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
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
  const [selectedAxis, setSelectedAxis] = useState<string>('age_group');
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 分析軸のオプション
  const analysisOptions: AutocompleteOption[] = [
    { key: 'age_group', label: '年齢層' },
    { key: 'gender', label: '性別' },
    { key: 'occupation', label: '職業' },
    { key: 'industry', label: '業種' },
    { key: 'mbti', label: 'MBTI' },
    { key: 'primary_area', label: 'メインエリア' },
    { key: 'interests', label: '興味' },
    { key: 'hobbies', label: '趣味' },
    { key: 'alcohols', label: '好きなお酒' },
    { key: 'visit_purposes', label: '利用目的' }
  ];

  // 軸ラベルのマップ
  const axisLabelMap: { [key: string]: string } = {
    age_group: '年齢層',
    gender: '性別',
    occupation: '職業',
    industry: '業種',
    mbti: 'MBTI',
    primary_area: 'メインエリア',
    interests: '興味',
    hobbies: '趣味',
    alcohols: '好きなお酒',
    visit_purposes: '利用目的'
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

  // 軸変更時のデータ取得
  useEffect(() => {
    if (isOpen) {
      loadAnalysisData(selectedAxis);
    }
  }, [selectedAxis, isOpen, shopId]);

  // プログレスバーの色を取得
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 40) return 'rgba(0, 255, 255, 0.8)';
    if (percentage >= 20) return 'rgba(59, 130, 246, 0.8)';
    if (percentage >= 10) return 'rgba(168, 85, 247, 0.8)';
    return 'rgba(156, 163, 175, 0.6)';
  };

  // 軸変更ハンドラー
  const handleAxisChange = (key: string | null) => {
    if (key) {
      setSelectedAxis(key);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onClose}
      size="2xl"
      className={styles.modal}
      classNames={{
        backdrop: styles.backdrop,
        base: styles.modalBase,
        body: styles.modalBody
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className={styles.modalHeader}>
              <div className={styles.headerContent}>
                <div className={styles.headerLeft}>
                  <BarChart3 className={styles.headerIcon} />
                  <div>
                    <h2 className={styles.modalTitle}>常連さん詳細分析</h2>
                    {shopName && (
                      <p className={styles.shopName}>{shopName}</p>
                    )}
                  </div>
                </div>
                <button 
                  className={styles.closeButton} 
                  onClick={onClose}
                  aria-label="閉じる"
                >
                  <X size={20} />
                </button>
              </div>
            </ModalHeader>
            
            <ModalBody className={styles.modalBody}>
              {/* 分析軸選択 */}
              <div className={styles.controlsSection}>
                <div className={styles.selectorWrapper}>
                  <label className={styles.selectorLabel}>
                    分析軸を選択
                  </label>
                  <StyledAutocomplete
                    options={analysisOptions}
                    defaultSelectedKey={selectedAxis}
                    placeholder="分析軸を選択"
                    onSelectionChange={handleAxisChange}
                    aria-label="分析軸を選択"
                  />
                </div>
              </div>

              {/* 結果表示エリア */}
              <div className={styles.resultsSection}>
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
                  <>
                    <div className={styles.resultsHeader}>
                      <h3 className={styles.resultsTitle}>
                        <Users className={styles.resultsIcon} />
                        {axisLabelMap[data.axis]}別の分布
                      </h3>
                      <span className={styles.totalCount}>
                        対象: {data.total_regulars}人
                      </span>
                    </div>

                    <div className={styles.distributionList}>
                      {data.distribution.map((item, index) => (
                        <div key={index} className={styles.distributionItem}>
                          <div className={styles.itemHeader}>
                            <span className={styles.itemLabel}>
                              {item.label}
                            </span>
                            <div className={styles.itemStats}>
                              <span className={styles.itemCount}>
                                {item.count}人
                              </span>
                              <span className={styles.itemPercentage}>
                                {item.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                          <div className={styles.progressBarContainer}>
                            <div 
                              className={styles.progressBar}
                              style={{
                                background: getProgressColor(item.percentage)
                              }}
                            >
                              <div 
                                className={styles.progressFill}
                                style={{ 
                                  width: `${item.percentage}%`,
                                  background: getProgressColor(item.percentage)
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {data.distribution.length === 0 && (
                      <div className={styles.emptyState}>
                        <p>📊 この軸での分析データがありません</p>
                        <span className={styles.emptySubtext}>
                          他の軸を選択してみてください
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ModalBody>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default RegularsAnalysisModal;