'use client';

import React, { useState } from 'react';
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
  disabled = false
}) => {
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  // isCreator または userHasReacted に基づいてアクティブ状態を決定
  const isActive = isLoggedIn && userHasReacted;

  // タグクリック時の処理
  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  // インラインスタイルを定義
  const getInlineStyles = () => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.8)',
      borderRadius: '10px',
      padding: '4px 8px',
      fontSize: '0.7rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      position: 'relative',
    };
    
    if (isActive) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(0, 255, 255, 0.2)',
        border: '1px solid rgba(0, 255, 255, 1)',
        boxShadow: '0 0 10px rgba(0, 255, 255, 0.3)',
      };
    }
    
    return baseStyle;
  };

  // カウント表示のインラインスタイル
  const getCountStyle = () => {
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
    
    if (isActive) {
      return {
        ...baseStyle,
        backgroundColor: 'rgba(0, 255, 255, 1)',
        color: '#000000',
      };
    }
    
    return baseStyle;
  };

  return (
    <div
      className={styles.tag}
      style={getInlineStyles()}
      onClick={handleClick}
    >
      <span style={{ color: isActive ? 'rgba(255, 255, 255, 1)' : 'white' }}>{label}</span>
      <span style={getCountStyle()}>{count}</span>
      
    </div>
  );
};

export default ShopImpressionTag;
''
