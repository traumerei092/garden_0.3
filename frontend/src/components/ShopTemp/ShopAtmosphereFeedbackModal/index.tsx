'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/UI/Modal';
import AtmosphereInput, { AtmosphereScores } from '@/components/UI/AtmosphereInput';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import ModalButtons from '@/components/UI/ModalButtons';
import { submitShopFeedback, getUserShopFeedback, FeedbackData } from '@/actions/shop/feedback';
import styles from './style.module.scss';

interface ShopAtmosphereFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: number;
  shopName: string;
  onSuccess?: () => void;
}

const ShopAtmosphereFeedbackModal: React.FC<ShopAtmosphereFeedbackModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  onSuccess
}) => {
  const [scores, setScores] = useState<AtmosphereScores>({});
  const [initialScores, setInitialScores] = useState<AtmosphereScores>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 既存のフィードバックデータを取得
  useEffect(() => {
    if (isOpen && shopId) {
      const fetchExistingFeedback = async () => {
        try {
          setLoading(true);
          setError(null);

          const data = await getUserShopFeedback(shopId);

          if (data) {
            setInitialScores(data.atmosphere_scores || {});
            setScores(data.atmosphere_scores || {});
            setIsEditing(true);
          } else {
            // フィードバックがない場合は新規作成モード
            setInitialScores({});
            setScores({});
            setIsEditing(false);
          }
        } catch (err) {
          console.error('Failed to fetch existing feedback:', err);
          // エラーが発生してもモーダルは表示し、新規作成として扱う
          setInitialScores({});
          setScores({});
          setIsEditing(false);
        } finally {
          setLoading(false);
        }
      };

      fetchExistingFeedback();
    }
  }, [isOpen, shopId]);

  const handleScoresChange = (newScores: AtmosphereScores) => {
    setScores(newScores);
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const feedbackData: FeedbackData = {
        atmosphere_scores: scores
      };

      await submitShopFeedback(shopId, feedbackData);
      console.log('Atmosphere feedback saved');

      // 成功時はコールバックを呼び出してモーダルを閉じる
      if (onSuccess) {
        onSuccess();
      }
      handleClose();

    } catch (err) {
      console.error('Failed to save atmosphere feedback:', err);
      setError(err instanceof Error ? err.message : 'フィードバックの保存に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setScores({});
    setInitialScores({});
    setError(null);
    setIsEditing(false);
    onClose();
  };

  // スコアに変更があるかチェック
  const hasChanges = () => {
    if (!isEditing) return Object.keys(scores).length > 0;
    
    return JSON.stringify(scores) !== JSON.stringify(initialScores);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="雰囲気フィードバック">
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {shopName} の雰囲気フィードバック
          </h2>
          <p className={styles.modalSubtitle}>
            {isEditing ? '既存のフィードバックを更新できます' : '新しく雰囲気をフィードバックします'}
          </p>
        </div>

        <div className={styles.modalContent}>
          {loading ? (
            <div className={styles.loadingContainer}>
              <LoadingSpinner />
              <p>既存の評価を読み込み中...</p>
            </div>
          ) : (
            <AtmosphereInput
              shopId={shopId}
              initialScores={initialScores}
              onScoresChange={handleScoresChange}
            />
          )}

          {error && (
            <div className={styles.errorMessage}>
              <p>{error}</p>
            </div>
          )}
        </div>

        <ModalButtons
          onCancel={handleClose}
          onSave={handleSubmit}
          saveText={isEditing ? '更新する' : '保存する'}
          cancelText="キャンセル"
          isLoading={submitting}
          isDisabled={loading || !hasChanges()}
        />
      </div>
    </Modal>
  );
};

export default ShopAtmosphereFeedbackModal;