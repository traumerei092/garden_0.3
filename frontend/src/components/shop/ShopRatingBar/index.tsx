'use client';

import React from 'react';
import styles from './style.module.scss';

type ShopRatingBarProps = {
    label: string;
    value: number;
    maxValue?: number;
};

const ShopRatingBar: React.FC<ShopRatingBarProps> = ({
    label,
    value,
    maxValue = 100
}) => {
    const percentage = (value / maxValue) * 100;

    return (
        <div className={styles.ratingItem}>
            <div className={styles.ratingLabel}>{label}</div>
            <div className={styles.ratingBar}>
                <div
                    className={styles.ratingFill}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};

export default ShopRatingBar;
