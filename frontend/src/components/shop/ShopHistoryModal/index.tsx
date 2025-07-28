'use client';

import React, { useState, useEffect } from 'react';
import CustomModal from '@/components/UI/Modal';
import { Button, Spinner } from '@nextui-org/react';
import { useShopModalStore } from '@/store/useShopModalStore';
import { Shop, ShopEditHistory } from '@/types/shops';
import { fetchShopEditHistory, evaluateShopEditHistory } from '@/actions/shop/shopEditHistory';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import styles from './style.module.scss';

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
      <Button color="primary" onClick={closeHistoryModal}>閉じる</Button>
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
        <div className={styles.historyContainer}>
          {history.map(item => (
            <div key={item.id} className={styles.historyItem}>
              <p className={styles.historyMeta}>
                <span className={styles.historyUser}>{item.user?.name || '不明なユーザー'}</span> が 
                <span className={styles.historyUser}>{format(new Date(item.edited_at), 'yyyy年MM月dd日 HH:mm', { locale: ja })}</span> に編集
              </p>
              <p className={styles.historyDetail}>
                <span className={styles.fieldName}>{item.field_name}</span>:
                <span className={styles.oldValue}>{item.old_value || '未設定'}</span> → 
                <span className={styles.newValue}>{item.new_value || '未設定'}</span>
              </p>
              <div className={styles.evaluationButtons}>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  startContent={<ThumbsUp size={16} />}
                  onClick={() => handleEvaluation(item.id, 'GOOD')}
                  className={styles.goodButton}
                >
                  {item.good_count}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  startContent={<ThumbsDown size={16} />}
                  onClick={() => handleEvaluation(item.id, 'BAD')}
                  className={styles.badButton}
                >
                  {item.bad_count}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </CustomModal>
  );
};

export default ShopHistoryModal;