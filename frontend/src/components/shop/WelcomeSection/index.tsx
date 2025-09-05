'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HandHeart, ThumbsUp } from 'lucide-react';
import { Button, Tooltip } from '@nextui-org/react';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchWelcomeData, toggleWelcome, type WelcomeData } from '@/actions/shop/welcome';
import styles from './style.module.scss';

interface WelcomeSectionProps {
  shopId: number;
  className?: string;
  refreshTrigger?: number; // 外部からの更新トリガー用
}

const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  shopId,
  className = '',
  refreshTrigger
}) => {
  const [data, setData] = useState<WelcomeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();

  const loadData = useCallback(async () => {
    // ログインしていない場合は何もしない
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const welcomeData = await fetchWelcomeData(shopId);
      setData(welcomeData);
    } catch (err) {
      console.error('Failed to fetch welcome data:', err);
    } finally {
      setLoading(false);
    }
  }, [shopId, user]);

  const handleWelcome = async () => {
    if (!data || submitting) return;
    
    try {
      setSubmitting(true);
      const result = await toggleWelcome(shopId);
      
      if (result) {
        // データを更新 - トグル動作に対応
        setData(prev => prev ? {
          ...prev,
          welcome_count: result.welcome_count,
          user_welcomed: result.user_welcomed,
          show_welcome_button: result.show_welcome_button
        } : null);
      }
      
    } catch (err) {
      console.error('Failed to toggle welcome:', err);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // refreshTrigger の変更時にデータを再読み込み
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      loadData();
    }
  }, [refreshTrigger, loadData]);

  // ログインしていない、またはloadingの場合は表示しない
  if (!user || loading) {
    return null;
  }

  // データがない場合は表示しない
  if (!data) {
    return null;
  }
  
  // ウェルカム数が0の場合の特別処理
  if (data.welcome_count === 0) {
    // 自分が行きつけなら初回ウェルカム用にボタンを表示
    if (data.is_regular && !data.user_welcomed) {
      return (
        <div className={`${styles.container} ${className}`}>
          <div className={styles.content}>
            <div className={styles.icon}>
              <HandHeart size={14} strokeWidth={1} />
            </div>
            <div className={styles.message}>
              ウェルカムボタンを押して新しいお客さんを歓迎しましょう！
            </div>
            <Tooltip content="初来店のお客さんを歓迎しましょう！"  className={styles.tooltip}>
              <Button
                type='button'
                className={styles.welcomeButton}
                onPress={handleWelcome}
                disabled={submitting}
              >
                {submitting ? (
                  '...'
                ) : (
                  <ThumbsUp
                    size={16}
                    fill={data.user_welcomed ? 'rgba(0, 255, 255, 0.9)' : 'none'} 
                    stroke="rgba(0, 255, 255, 0.9)"
                    strokeWidth={1.5}
                  />
                )}
              </Button>
            </Tooltip>
          </div>
        </div>
      );
    }
    // それ以外は表示しない
    return null;
  }

  const welcomeMessage = data.welcome_count === 1
    ? (
        <>
          <span className={styles.highlightCount}>1人</span>の常連さんが「ウェルカム！」と言っています！
        </>
      )
    : (
        <>
          <span className={styles.highlightCount}>{data.welcome_count}人</span>の常連さんが「ウェルカム！」と言っています！
        </>
      );

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <HandHeart size={14} strokeWidth={1} />
        </div>
        <div className={styles.message}>
          {welcomeMessage}
        </div>
        {data.show_welcome_button && (
          <Button
            type='button'
            className={styles.welcomeButton}
            onPress={handleWelcome}
            disabled={submitting}
          >
            {submitting ? (
              '...'
            ) : (
              <ThumbsUp 
                size={16} 
                fill={data.user_welcomed ? 'rgba(0, 255, 255, 0.9)' : 'none'} 
                stroke="rgba(0, 255, 255, 0.9)"
                strokeWidth={1.5}
              />
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default WelcomeSection;