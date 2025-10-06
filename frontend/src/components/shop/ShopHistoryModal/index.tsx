'use client';

import React, { useState, useEffect } from 'react';
import CustomModal from '@/components/UI/Modal';
import { Button, Spinner } from '@nextui-org/react';
import Link from 'next/link';
import { useShopModalStore } from '@/store/useShopModalStore';
import { Shop, ShopEditHistory } from '@/types/shops';
import { fetchShopEditHistory, evaluateShopEditHistory } from '@/actions/shop/shopEditHistory';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { formatChangeDescription } from '@/utils/fieldLabels';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';

interface ShopHistoryModalProps {
  shop: Shop;
}

const ShopHistoryModal: React.FC<ShopHistoryModalProps> = ({ shop }) => {
  const { isHistoryModalOpen, closeHistoryModal } = useShopModalStore();
  const [history, setHistory] = useState<ShopEditHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchShopEditHistory(shop.id.toString());
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '履歴の読み込みに失敗しました');
      console.error('Failed to load shop history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHistoryModalOpen) {
      loadHistory();
    }
  }, [isHistoryModalOpen, shop.id]);

  const handleEvaluation = async (historyId: number, evaluation: 'GOOD' | 'BAD') => {
    try {
      await evaluateShopEditHistory(historyId, evaluation);
      // 評価後に履歴を再取得して表示を更新
      loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : '評価に失敗しました');
      console.error('Failed to evaluate history:', err);
    }
  };

  const renderFooter = () => (
    <div className="flex justify-end w-full">
      <ButtonGradientWrapper onClick={closeHistoryModal}>閉じる</ButtonGradientWrapper>
    </div>
  );

  return (
    <CustomModal
      isOpen={isHistoryModalOpen}
      onClose={closeHistoryModal}
      title="編集履歴"
      size="3xl"
      footer={renderFooter()}
    >
      {loading ? (
        <div className={styles.loadingContainer}><Spinner /></div>
      ) : error ? (
        <p className={styles.messageText}>{error}</p>
      ) : history.length === 0 ? (
        <p className={styles.messageText}>まだ編集履歴はありません。</p>
      ) : (
        <>
          {shop.created_by && (
            <div className={styles.shopCreator}>
              <span className={styles.creatorLabel}>登録者:</span>
              <Link href={`/user/${shop.created_by.uid}`} className={styles.creatorName}>
                {shop.created_by.name}
              </Link>
            </div>
          )}
          <div className={styles.historyContainer}>
          {history.map(item => (
            <div key={item.id} className={styles.historyItem}>
              <p className={styles.historyMeta}>
                <Link href={`/user/${item.user?.uid}`} className={styles.historyUser}>
                  {item.user?.name || '不明なユーザー'}
                </Link> が
                <span className={styles.historyUser}>{format(new Date(item.edited_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span> に編集
              </p>
              <div className={styles.historyContent}>
                <div
                  className={styles.changeDescription}
                  dangerouslySetInnerHTML={formatChangeDescription(item.field_name, item.old_value, item.new_value)}
                />
                <div className={styles.evaluationButtons}>
                  <button
                    onClick={() => handleEvaluation(item.id, 'GOOD')}
                    className={`${styles.voteButton} ${styles.goodButton} ${item.user_evaluation === 'GOOD' ? styles.active : ''}`}
                    title="Good"
                  >
                    <ThumbsUp size={16} strokeWidth={1} fill={item.user_evaluation === 'GOOD' ? 'currentColor' : 'none'} />
                    <span className={styles.voteCount}>{item.good_count}</span>
                  </button>
                  <button
                    onClick={() => handleEvaluation(item.id, 'BAD')}
                    className={`${styles.voteButton} ${styles.badButton} ${item.user_evaluation === 'BAD' ? styles.active : ''}`}
                    title="Bad"
                  >
                    <ThumbsDown size={16} strokeWidth={1} fill={item.user_evaluation === 'BAD' ? 'currentColor' : 'none'} />
                    <span className={styles.voteCount}>{item.bad_count}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        </>
      )}
    </CustomModal>
  );
};

export default ShopHistoryModal;