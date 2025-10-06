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
    
    // 値に基づいて評価ラベルを生成（-2から2の範囲を0-100に変換）
    const normalizedValue = Math.round(((value / maxValue) * 4) - 2); // -2 to 2 range
    
    const getScoreLabel = (score: number): string => {
        switch (score) {
            case -2:
                return getLeftLabel();
            case -1:
                return `やや${getLeftLabel()}`;
            case 0:
                return 'どちらでも';
            case 1:
                return `やや${getRightLabel()}`;
            case 2:
                return getRightLabel();
            default:
                return 'どちらでも';
        }
    };
    
    const getLeftLabel = (): string => {
        switch (label) {
            case '話しかけ度':
                return '静かに過ごす';
            case '盛り上がり度':
                return '落ち着いた雰囲気';
            case 'コミュニティ性':
                return '個人の時間を重視';
            case '他のお客さんとの距離感':
                return '自分の時間を尊重';
            case 'マスターのキャラクター':
                return '控えめなサービス';
            default:
                return '控えめ';
        }
    };
    
    const getRightLabel = (): string => {
        switch (label) {
            case '話しかけ度':
                return '会話を楽しむ';
            case '盛り上がり度':
                return '賑やかな雰囲気';
            case 'コミュニティ性':
                return 'コミュニティ重視';
            case '他のお客さんとの距離感':
                return '交流が生まれる';
            case 'マスターのキャラクター':
                return '積極的なサービス';
            default:
                return '積極的';
        }
    };

    return (
        <div className={styles.atmosphereSlider}>
            <div className={styles.header}>
                <h4 className={styles.title}>{label}</h4>
                <span className={styles.currentValue}>
                    {getScoreLabel(normalizedValue)}
                </span>
            </div>
            
            <div className={styles.sliderContainer}>
                <div className={styles.labels}>
                    <span className={styles.leftLabel}>
                        {getLeftLabel()}
                    </span>
                    <span className={styles.rightLabel}>
                        {getRightLabel()}
                    </span>
                </div>
                
                <div className={styles.sliderWrapper}>
                    <div className={styles.sliderTrack}>
                        <div
                            className={styles.sliderFill}
                            style={{ width: `${percentage}%` }}
                        />
                        <div 
                            className={styles.sliderThumb}
                            style={{ left: `${percentage}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShopRatingBar;
