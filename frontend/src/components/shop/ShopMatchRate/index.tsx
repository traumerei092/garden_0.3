'use client';

import React from 'react';
import { CircularProgress } from '@nextui-org/react';
import styles from './style.module.scss';

type ShopMatchRateProps = {
  rate: number;
  showTitle?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const ShopMatchRate: React.FC<ShopMatchRateProps> = ({ 
  rate, 
  showTitle = true, 
  size = 'lg',
  className 
}) => {
  const containerClass = className ? `${styles.container} ${className}` : styles.container;
  const compactClass = !showTitle ? styles.compact : '';
  const finalContainerClass = compactClass ? `${containerClass} ${compactClass}` : containerClass;

  return (
    <div className={finalContainerClass}>
      {showTitle && (
        <div className={styles.title}>あなたとのマッチ率</div>
      )}
      <div className={styles.rateContainer}>
        <CircularProgress
          classNames={{
            svg: styles.circleSvg,
            indicator: styles.circleIndicator,
            track: styles.circleTrack,
            value: styles.circleValue,
          }}
          value={rate}
          color="secondary"
          showValueLabel={true}
          aria-label="マッチ率"
          size={size}
        />
      </div>
    </div>
  );
};

export default ShopMatchRate;
