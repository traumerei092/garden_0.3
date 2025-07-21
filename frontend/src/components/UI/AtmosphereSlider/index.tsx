'use client';

import React from 'react';
import styles from './style.module.scss';
import { AtmosphereIndicator } from '@/types/users';

interface AtmosphereSliderProps {
  indicator: AtmosphereIndicator;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const AtmosphereSlider: React.FC<AtmosphereSliderProps> = ({
  indicator,
  value,
  onChange,
  disabled = false,
}) => {
  const getScoreLabel = (score: number): string => {
    switch (score) {
      case -2:
        return indicator.description_left;
      case -1:
        return `やや${indicator.description_left}`;
      case 0:
        return 'どちらでも';
      case 1:
        return `やや${indicator.description_right}`;
      case 2:
        return indicator.description_right;
      default:
        return 'どちらでも';
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    onChange(newValue);
  };

  return (
    <div className={styles.atmosphereSlider}>
      <div className={styles.header}>
        <h4 className={styles.title}>{indicator.name}</h4>
        <span className={styles.currentValue}>
          {getScoreLabel(value)}
        </span>
      </div>
      
      <div className={styles.sliderContainer}>
        <div className={styles.labels}>
          <span className={styles.leftLabel}>
            {indicator.description_left}
          </span>
          <span className={styles.rightLabel}>
            {indicator.description_right}
          </span>
        </div>
        
        <div className={styles.sliderWrapper}>
          <input
            type="range"
            min="-2"
            max="2"
            step="1"
            value={value}
            onChange={handleSliderChange}
            disabled={disabled}
            className={styles.slider}
          />
          <div className={styles.marks}>
            {[-2, -1, 0, 1, 2].map((mark) => (
              <div
                key={mark}
                className={`${styles.mark} ${value === mark ? styles.active : ''}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AtmosphereSlider;
