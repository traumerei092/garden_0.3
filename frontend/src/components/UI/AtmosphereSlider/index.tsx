'use client';

import React from 'react';
import { RadioGroup, Radio } from '@nextui-org/react';
import styles from './style.module.scss';
import { AtmosphereIndicator } from '@/types/search';

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
  // スコアに基づいて説明テキストを取得
  const getScoreDescription = (score: number): string => {
    switch (score) {
      case -2:
        return indicator.description_left;
      case -1:
        return `やや${indicator.description_left}`;
      case 0:
        return 'どちらも楽しめる';
      case 1:
        return `やや${indicator.description_right}`;
      case 2:
        return indicator.description_right;
      default:
        return 'どちらも楽しめる';
    }
  };

  // スコアに基づいて現在値の色を取得
  const getValueColor = (score: number): string => {
    if (score < 0) {
      return 'rgb(0, 198, 255)'; // 左側（青系）
    } else if (score > 0) {
      return 'rgb(235, 14, 242)'; // 右側（紫系）
    }
    return '#fff'; // 中央（白）
  };

  // ラジオボタンのオプション定義
  const radioOptions = [
    { value: '-2', label: indicator.description_left, position: 'left' },
    { value: '-1', label: '', position: 'left-center' },
    { value: '0', label: '', position: 'center' },
    { value: '1', label: '', position: 'right-center' },
    { value: '2', label: indicator.description_right, position: 'right' },
  ];

  return (
    <div className={styles.atmosphereSlider}>
      <div className={styles.header}>
        <h4 className={styles.title}>{indicator.name}</h4>
        <span
          className={styles.currentValue}
          style={{ color: getValueColor(value) }}
        >
          {getScoreDescription(value)}
        </span>
      </div>

      <div className={styles.radioContainer}>
        <div className={styles.radioLabels}>
          <span className={styles.leftLabel}>{indicator.description_left}</span>
          <span className={styles.rightLabel}>{indicator.description_right}</span>
        </div>

        <RadioGroup
          value={value.toString()}
          onValueChange={(val) => onChange(parseInt(val))}
          orientation="horizontal"
          className={styles.radioGroup}
          isDisabled={disabled}
        >
          <div className={styles.radioOptions}>
            {radioOptions.map((option) => (
              <div key={option.value} className={styles.radioOption}>
                <Radio
                  value={option.value}
                  className={`${styles.radio} ${styles[option.position]}`}
                />
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default AtmosphereSlider;
