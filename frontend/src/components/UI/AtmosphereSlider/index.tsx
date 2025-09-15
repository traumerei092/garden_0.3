'use client';

import React from 'react';
import styles from './style.module.scss';
import { AtmosphereIndicator, AtmospherePreference, AtmosphereChoice } from '@/types/search';

interface AtmosphereSliderProps {
  indicator: AtmosphereIndicator;
  value: AtmospherePreference | null;
  onChange: (value: AtmospherePreference | null) => void;
  disabled?: boolean;
}

const AtmosphereSlider: React.FC<AtmosphereSliderProps> = ({
  indicator,
  value,
  onChange,
  disabled = false,
}) => {
  // 3択の選択肢を動的に生成
  const getChoices = (): AtmosphereChoice[] => [
    {
      key: 'quiet',
      label: indicator.description_left,
      description: '一人の時間を重視'
    },
    {
      key: 'neutral',
      label: 'どちらでもOK',
      description: 'フレキシブル'
    },
    {
      key: 'social',
      label: indicator.description_right,
      description: 'コミュニティを重視'
    }
  ];

  const choices = getChoices();

  const handleChoiceChange = (selectedValue: AtmospherePreference) => {
    // 同じ選択肢をクリックした場合はクリア（null）
    const newValue = value === selectedValue ? null : selectedValue;
    onChange(newValue);
  };

  return (
    <div className={styles.atmosphereSlider}>
      <div className={styles.header}>
        <h4 className={styles.title}>{indicator.name}</h4>
        {value && (
          <span className={styles.currentValue}>
            {choices.find(choice => choice.key === value)?.label || 'どちらでもOK'}
          </span>
        )}
      </div>

      <div className={styles.choicesContainer}>
        {choices.map((choice) => (
          <div
            key={choice.key}
            className={`${styles.choiceItem} ${value === choice.key ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
            onClick={() => !disabled && handleChoiceChange(choice.key)}
          >
            <div className={styles.radioButton}>
              <input
                type="radio"
                name={`atmosphere-${indicator.id}`}
                value={choice.key}
                checked={value === choice.key}
                onChange={() => handleChoiceChange(choice.key)}
                disabled={disabled}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
            </div>
            <div className={styles.choiceContent}>
              <span className={styles.choiceLabel}>{choice.label}</span>
              <span className={styles.choiceDescription}>{choice.description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AtmosphereSlider;
