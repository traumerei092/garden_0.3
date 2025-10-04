'use client';

import React from 'react';
import { RadioGroup, Radio } from '@nextui-org/react';
import styles from './style.module.scss';
import { AtmosphereIndicator } from '@/types/search';
import { getScoreText, getScoreColor } from '@/utils/atmosphere';

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
          style={{ color: getScoreColor(value) }}
        >
          {getScoreText(value, indicator.description_left, indicator.description_right)}
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
