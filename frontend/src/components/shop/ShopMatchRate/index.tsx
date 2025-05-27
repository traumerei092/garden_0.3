'use client';

import React from 'react';
import { CircularProgress } from '@nextui-org/react';
import styles from './style.module.scss';

type ShopMatchRateProps = {
  rate: number;
};

const ShopMatchRate: React.FC<ShopMatchRateProps> = ({ rate }) => {
  return (
    <div className={styles.container}>
      <div className={styles.title}>あなたとのマッチ率</div>
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
          size="lg"
        />
      </div>
    </div>
  );
};

export default ShopMatchRate;
