'use client';

import React from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';

type ShopImpressionTagProps = {
  id: number;
  label: string;
  count: number;
  isCreator?: boolean;
  userHasReacted?: boolean;
  onClick?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
};

const ShopImpressionTag: React.FC<ShopImpressionTagProps> = ({
  id,
  label,
  count,
  isCreator = false,
  userHasReacted = false,
  onClick,
  onDelete,
  disabled = false
}) => {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  // タグのスタイルを決定
  const getTagClassName = () => {
    if (!isLoggedIn) return styles.tag; // 未ログイン時は白ベース
    if (userHasReacted) return `${styles.tag} ${styles.active}`; // 共感済みはシアンベース
    if (isCreator) return `${styles.tag} ${styles.creator}`; // 作成者は特別なスタイル
    return styles.tag; // デフォルトは白ベース
  };

  // タグクリック時の処理
  const handleClick = () => {
    if (onClick && !disabled) onClick();
  };

  // 削除確認モーダル表示（実装は省略）
  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      // 確認モーダルを表示する処理（実際の実装では確認ダイアログを表示）
      if (window.confirm('このタグを削除しますか？')) {
        onDelete();
      }
    }
  };

  return (
    <div
      className={getTagClassName()}
      onClick={handleClick}
    >
      <span className={styles.label}>{label}</span>
      <span className={styles.count}>{count}</span>
    </div>
  );
};

export default ShopImpressionTag;
