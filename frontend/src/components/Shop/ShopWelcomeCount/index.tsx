'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import styles from './style.module.scss';

type ShopWelcomeCountProps = {
  count: number;
  showTitle?: boolean;
  variant?: 'card' | 'grid';
  className?: string;
};

const getWelcomeStatus = (count: number) => {
  if (count === 0) {
    return { intensity: 'neutral' };
  } else if (count <= 5) {
    return { intensity: 'low' };
  } else if (count <= 15) {
    return { intensity: 'medium' };
  } else {
    return { intensity: 'high' };
  }
};

const ShopWelcomeCount: React.FC<ShopWelcomeCountProps> = ({
  count,
  variant = 'card',
  className
}) => {
  const welcomeStatus = getWelcomeStatus(count);
  const containerClass = className
    ? `${styles.container} ${styles[variant]} ${styles[welcomeStatus.intensity]} ${className}`
    : `${styles.container} ${styles[variant]} ${styles[welcomeStatus.intensity]}`;

  if (variant === 'grid') {
    // ShopGridCardはアイコンサイズを大きく
    return (
      <div className={containerClass}>
        <div className={styles.welcomeIcon}>
          <Heart size={32} strokeWidth={0} fill="currentColor" />
          <span className={styles.countNumber}>{count}</span>
        </div>
      </div>
    );
  }

  // ShopCardは外枠とテキストを残す
  return (
    <div className={containerClass}>
      <div className={styles.welcomeContent}>
        <div className={styles.welcomeIcon}>
          <Heart size={48} strokeWidth={0} fill="currentColor" />
          <span className={styles.countNumber}>{count}</span>
        </div>
        <div className={styles.welcomeText}>
          <span
            className={styles.countText}
            style={{
              color:"currentColor"
             }}
          >
            {count}人がウェルカム
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShopWelcomeCount;