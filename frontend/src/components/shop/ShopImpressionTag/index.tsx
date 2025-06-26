'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';
import { X } from 'lucide-react';

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
  const [hasReacted, setHasReacted] = useState(userHasReacted);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  // userHasReactedプロパティが変更されたら状態を更新
  useEffect(() => {
    console.log(`ShopImpressionTag ${id} (${label}): userHasReacted=${userHasReacted}, isCreator=${isCreator}`);
    setHasReacted(userHasReacted);
  }, [userHasReacted, id, label, isCreator]);

  // タグのスタイルを決定
  const getTagClassName = () => {
    console.log(`getTagClassName for tag ${id} (${label}): isLoggedIn=${isLoggedIn}, hasReacted=${hasReacted}, isCreator=${isCreator}`);
    
    // 明示的にbooleanに変換して確実に比較する
    const isUserLoggedIn = Boolean(isLoggedIn);
    const hasUserReacted = Boolean(hasReacted);
    const isUserCreator = Boolean(isCreator);
    
    console.log(`After boolean conversion: isLoggedIn=${isUserLoggedIn}, hasReacted=${hasUserReacted}, isCreator=${isUserCreator}`);
    
    // クラス名を配列で構築
    const classNames = [styles.tag];
    
    // 共感済みの場合はactiveクラスを追加
    if (isUserLoggedIn && hasUserReacted) {
      classNames.push(styles.active);
      console.log(`Adding active class for tag ${id}`);
    }
    
    // 作成者の場合はcreatorクラスを追加
    if (isUserLoggedIn && isUserCreator) {
      classNames.push(styles.creator);
      console.log(`Adding creator class for tag ${id}`);
    }
    
    // 配列を文字列に結合
    const result = classNames.join(' ');
    console.log(`Final className for tag ${id}: ${result}`);
    return result;
  };

  // タグクリック時の処理
  const handleClick = () => {
    if (onClick && !disabled) {
      console.log(`ShopImpressionTag ${id} (${label}) clicked, calling onClick handler`);
      console.log(`Current state - isLoggedIn: ${isLoggedIn}, hasReacted: ${hasReacted}, isCreator: ${isCreator}`);
      
      // クリック時に先に状態を更新して即時フィードバックを提供
      if (isLoggedIn) {
        // 明示的にbooleanに変換
        const currentHasReacted = Boolean(hasReacted);
        console.log(`Updating hasReacted state from ${currentHasReacted} to ${!currentHasReacted}`);
        
        // 状態を反転させる
        setHasReacted(!currentHasReacted);
        
        // 更新後の状態をログに出力
        setTimeout(() => {
          console.log(`After state update - hasReacted: ${!currentHasReacted}`);
        }, 0);
      }
      
      // 親コンポーネントのonClickハンドラを呼び出す
      onClick();
    }
  };

  // 削除確認モーダル表示
  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      // 確認モーダルを表示する処理
      if (window.confirm('このタグを削除しますか？')) {
        onDelete();
      }
    }
  };

  // インラインスタイルを定義
  const getInlineStyles = () => {
    const isUserLoggedIn = Boolean(isLoggedIn);
    const hasUserReacted = Boolean(hasReacted);
    const isUserCreator = Boolean(isCreator);
    
    // 基本スタイル
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      borderRadius: '10px',
      padding: '4px 8px',
      fontSize: '0.7rem',
      cursor: 'pointer', // クリック可能であることを明示
      transition: 'all 0.2s ease',
      position: 'relative',
    };
    
    // アクティブスタイル（共感済みまたは作成者）
    if (isUserLoggedIn && (hasUserReacted || isUserCreator)) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(76, 201, 240, 0.2)',
        border: '1px solid #4cc9f0',
      };
    }
    
    return baseStyle;
  };

  // カウント表示のインラインスタイル
  const getCountStyle = () => {
    const isUserLoggedIn = Boolean(isLoggedIn);
    const hasUserReacted = Boolean(hasReacted);
    const isUserCreator = Boolean(isCreator);
    
    // 基本スタイル
    const baseStyle: React.CSSProperties = {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '0.7rem',
      fontWeight: 'bold',
    };
    
    // アクティブスタイル
    if (isUserLoggedIn && (hasUserReacted || isUserCreator)) {
      return {
        ...baseStyle,
        backgroundColor: '#4cc9f0',
      };
    }
    
    return baseStyle;
  };

  return (
    <div
      className={getTagClassName()}
      style={getInlineStyles()} // インラインスタイルを追加
      onClick={handleClick}
      onMouseEnter={() => isCreator && setShowDeleteButton(true)}
      onMouseLeave={() => setShowDeleteButton(false)}
      data-active={Boolean(isLoggedIn) && (Boolean(hasReacted) || Boolean(isCreator))} // データ属性を追加
      data-creator={Boolean(isCreator)}
      data-reacted={Boolean(hasReacted)}
    >
      <span className={styles.label} style={{ color: 'white' }}>{label}</span>
      <span className={styles.count} style={getCountStyle()}>{count}</span>
      
      {isCreator && showDeleteButton && (
        <button 
          className={styles.deleteButton}
          onClick={handleDeleteConfirm}
          aria-label="タグを削除"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: 'rgba(243, 18, 96, 0.9)',
            color: 'white',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
};

export default ShopImpressionTag;
