'use client';

import React from 'react';
import styles from './style.module.scss';
import { AtmosphereIndicator, AtmospherePreference, AtmosphereChoice } from '@/types/search';

interface AtmosphereRadioProps {
  indicator: AtmosphereIndicator;
  value: AtmospherePreference | null;
  onChange: (value: AtmospherePreference | null) => void;
  disabled?: boolean;
}

const AtmosphereRadio: React.FC<AtmosphereRadioProps> = ({
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
    console.log('🔥🔥🔥 AtmosphereRadio.handleChoiceChange:', selectedValue);
    // 同じ選択肢をクリックした場合はクリア（null）
    const newValue = value === selectedValue ? null : selectedValue;
    console.log('🔥🔥🔥 AtmosphereRadio.newValue:', newValue);
    onChange(newValue);
  };

  // 現在の選択値に基づいてタグのスタイルを取得
  const getCurrentValueStyle = () => {
    if (!value) return {};

    switch (value) {
      case 'quiet':
        return {
          color: 'rgb(0, 198, 255)',
          background: 'rgba(0, 198, 255, 0.15)',
          border: '1px solid rgba(0, 198, 255, 0.3)'
        };
      case 'social':
        return {
          color: 'rgb(235, 14, 242)',
          background: 'rgba(235, 14, 242, 0.15)',
          border: '1px solid rgba(235, 14, 242, 0.3)'
        };
      case 'neutral':
        return {
          background: 'linear-gradient(135deg, rgba(0, 198, 255, 0.15) 0%, rgba(235, 14, 242, 0.15) 100%)',
          border: '1px solid transparent',
          color: '#fff',
          position: 'relative' as const,
          '&::before': {
            content: '""',
            position: 'absolute' as const,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 'inherit',
            padding: '1px',
            background: 'linear-gradient(135deg, rgb(0, 198, 255) 0%, rgb(235, 14, 242) 100%)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude'
          }
        };
      default:
        return {};
    }
  };

  return (
    <div className={styles.atmosphereRadio}>
      <div className={styles.header}>
        <h4 className={styles.title}>{indicator.name}</h4>
        {value && (
          <span className={styles.currentValue} style={getCurrentValueStyle()}>
            {choices.find(choice => choice.key === value)?.label || 'どちらでもOK'}
          </span>
        )}
      </div>

      <div className={styles.choicesContainer}>
        {choices.map((choice) => (
          <div
            key={choice.key}
            className={`${styles.choiceItem} ${styles[choice.key]} ${value === choice.key ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
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

export default AtmosphereRadio;