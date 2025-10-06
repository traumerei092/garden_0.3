'use client';

import React, { useState, useEffect } from 'react';
import { Button, Input, Chip } from '@nextui-org/react';
import Modal from '@/components/UI/Modal';
import AtmosphereInput, { AtmosphereScores } from '@/components/UI/AtmosphereInput';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';

interface ShopVisitedModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: number;
  shopName: string;
  onComplete?: () => void;
  existingTags?: Array<{ id: number; value: string }>;
}

type Step = 'atmosphere' | 'impression';

const ShopVisitedModal: React.FC<ShopVisitedModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  onComplete,
  existingTags = []
}) => {
  const [currentStep, setCurrentStep] = useState<Step>('atmosphere');
  const [atmosphereScores, setAtmosphereScores] = useState<AtmosphereScores>({});
  const [initialAtmosphereScores, setInitialAtmosphereScores] = useState<AtmosphereScores>({});
  const [tagValue, setTagValue] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ id: number; value: string }>>([]);
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditingAtmosphere, setIsEditingAtmosphere] = useState(false);
  
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  // 既存の雰囲気フィードバックを取得
  useEffect(() => {
    if (isOpen && shopId && isLoggedIn) {
      const fetchExistingFeedback = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetchWithAuth(`/shops/${shopId}/my_atmosphere_feedback/`);
          
          if (response.ok) {
            const data = await response.json();
            setInitialAtmosphereScores(data.atmosphere_scores || {});
            setAtmosphereScores(data.atmosphere_scores || {});
            setIsEditingAtmosphere(true);
          } else if (response.status === 404) {
            // フィードバックがない場合は新規作成モード
            setInitialAtmosphereScores({});
            setAtmosphereScores({});
            setIsEditingAtmosphere(false);
          }
        } catch (err) {
          console.error('Failed to fetch existing feedback:', err);
          setInitialAtmosphereScores({});
          setAtmosphereScores({});
          setIsEditingAtmosphere(false);
        } finally {
          setLoading(false);
        }
      };

      fetchExistingFeedback();
    }
  }, [isOpen, shopId, isLoggedIn]);

  // タグ入力時に既存タグから候補を表示
  useEffect(() => {
    if (tagValue.trim().length > 0) {
      const matchingTags = existingTags.filter(tag => 
        tag.value.toLowerCase().includes(tagValue.toLowerCase())
      );
      setSuggestions(matchingTags);
    } else {
      setSuggestions([]);
    }
  }, [tagValue, existingTags]);

  const handleAtmosphereScoresChange = (newScores: AtmosphereScores) => {
    setAtmosphereScores(newScores);
  };

  const handleSuggestionClick = (value: string) => {
    setTagValue(value);
  };

  const hasAtmosphereChanges = () => {
    if (!isEditingAtmosphere) return Object.keys(atmosphereScores).length > 0;
    return JSON.stringify(atmosphereScores) !== JSON.stringify(initialAtmosphereScores);
  };

  const handleNextStep = async () => {
    if (currentStep === 'atmosphere') {
      // 雰囲気フィードバックを保存
      if (hasAtmosphereChanges()) {
        try {
          setSubmitting(true);
          setError(null);

          const response = await fetchWithAuth(`/shops/${shopId}/atmosphere_feedback/`, {
            method: 'POST',
            body: JSON.stringify({
              atmosphere_scores: atmosphereScores
            })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '雰囲気フィードバックの保存に失敗しました');
          }

          console.log('Atmosphere feedback saved successfully');
        } catch (err) {
          console.error('Failed to save atmosphere feedback:', err);
          setError(err instanceof Error ? err.message : '雰囲気フィードバックの保存に失敗しました');
          return;
        } finally {
          setSubmitting(false);
        }
      }
      
      // 印象タグステップに進む
      setCurrentStep('impression');
    }
  };

  const handlePreviousStep = () => {
    if (currentStep === 'impression') {
      setCurrentStep('atmosphere');
    }
  };

  const handleSubmitTag = async () => {
    if (!isLoggedIn) {
      setError('ログインが必要です');
      return;
    }

    if (!tagValue.trim()) {
      setError('タグを入力してください');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-tags/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `JWT ${localStorage.getItem('access')}`
        },
        body: JSON.stringify({
          shop: shopId,
          value: tagValue.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Tag added successfully');
        onComplete?.();
        handleClose();
      } else {
        throw new Error(data.detail || 'タグの追加に失敗しました');
      }
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipTag = () => {
    onComplete?.();
    handleClose();
  };

  const handleClose = () => {
    setCurrentStep('atmosphere');
    setAtmosphereScores({});
    setInitialAtmosphereScores({});
    setTagValue('');
    setError(null);
    setIsEditingAtmosphere(false);
    onClose();
  };

  if (!isLoggedIn) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose}>
        <div className={styles.modalContainer}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>ログインが必要です</h2>
          </div>
          
          <div className={styles.modalContent}>
            <div className={styles.loginPrompt}>
              <p>お店の訪問記録を残すにはログインが必要です</p>
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button 
              className={styles.cancelButton}
              onClick={handleClose}
            >
              閉じる
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {shopName} に訪問
          </h2>
          <p className={styles.modalSubtitle}>
            {currentStep === 'atmosphere' 
              ? 'ステップ 1/2: 雰囲気を評価'
              : 'ステップ 2/2: 印象タグを追加'
            }
          </p>
          
          <div className={styles.stepIndicator}>
            <div className={`${styles.step} ${currentStep === 'atmosphere' ? styles.active : styles.completed}`}>
              {currentStep === 'impression' ? <Check size={16} /> : '1'}
            </div>
            <div className={styles.stepConnector} />
            <div className={`${styles.step} ${currentStep === 'impression' ? styles.active : ''}`}>
              2
            </div>
          </div>
        </div>

        <div className={styles.modalContent}>
          {currentStep === 'atmosphere' && (
            <>
              {loading ? (
                <div className={styles.loadingContainer}>
                  <LoadingSpinner />
                  <p>既存の評価を読み込み中...</p>
                </div>
              ) : (
                <AtmosphereInput
                  shopId={shopId}
                  initialScores={initialAtmosphereScores}
                  onScoresChange={handleAtmosphereScoresChange}
                  title="この店舗の雰囲気はいかがでしたか？"
                  description="実際に訪れた際の雰囲気を教えてください。他のユーザーの参考になります。"
                />
              )}
            </>
          )}

          {currentStep === 'impression' && (
            <div className={styles.impressionStep}>
              <div className={styles.stepDescription}>
                <h3>印象タグを追加（任意）</h3>
                <p>このお店の印象を一言で表現してください。他のユーザーの参考になります。</p>
              </div>
              
              <Input
                label="このお店の印象を一言で"
                placeholder="例: マスターが優しい、雰囲気が落ち着く"
                value={tagValue}
                onChange={(e) => setTagValue(e.target.value)}
                className={styles.tagInput}
                classNames={{
                  inputWrapper: styles.tagInputWrapper,
                  input: styles.tagInputElement,
                }}
              />
              
              {suggestions.length > 0 && (
                <div className={styles.suggestions}>
                  <p className={styles.suggestionsTitle}>似たタグ:</p>
                  <div className={styles.suggestionChips}>
                    {suggestions.map(tag => (
                      <Chip
                        key={tag.id}
                        onClick={() => handleSuggestionClick(tag.value)}
                        className={styles.suggestionChip}
                        variant="flat"
                        color="primary"
                      >
                        {tag.value}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={submitting}
          >
            キャンセル
          </button>
          
          <div className={styles.actionButtons}>
            {currentStep === 'impression' && (
              <button
                className={styles.skipButton}
                onClick={handleSkipTag}
                disabled={submitting}
              >
                スキップ
              </button>
            )}
            
            {currentStep === 'atmosphere' && (
              <ButtonGradientWrapper
                onClick={handleNextStep}
                disabled={submitting || loading}
                anotherStyle={styles.submitButton}
              >
                {submitting ? (
                  <>
                    <LoadingSpinner />
                    保存中...
                  </>
                ) : (
                  <>
                    次へ
                    <ArrowRight size={16} />
                  </>
                )}
              </ButtonGradientWrapper>
            )}
            
            {currentStep === 'impression' && (
              <>
                <button
                  className={styles.backButton}
                  onClick={handlePreviousStep}
                  disabled={submitting}
                >
                  <ArrowLeft size={16} />
                  戻る
                </button>
                
                <ButtonGradientWrapper
                  onClick={handleSubmitTag}
                  disabled={submitting || !tagValue.trim()}
                  anotherStyle={styles.submitButton}
                >
                  {submitting ? (
                    <>
                      <LoadingSpinner />
                      追加中...
                    </>
                  ) : (
                    <>
                      完了
                      <Check size={16} />
                    </>
                  )}
                </ButtonGradientWrapper>
              </>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ShopVisitedModal;