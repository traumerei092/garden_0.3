'use client';

import React from 'react';
import { RadioGroup, Radio } from '@nextui-org/react';
import styles from './style.module.scss';

interface RadioOption {
  value: string;
  label: string;
  description?: string;
}

interface CustomRadioGroupProps {
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  className?: string;
}

const CustomRadioGroup: React.FC<CustomRadioGroupProps> = ({
  options,
  value,
  onChange,
  name,
  className
}) => {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      name={name}
      className={`${styles.radioGroup} ${className || ''}`}
      classNames={{
        wrapper: styles.radioWrapper,
      }}
    >
      {options.map((option) => (
        <Radio
          key={option.value}
          value={option.value}
          className={styles.radioItem}
          classNames={{
            base: styles.radioBase,
            wrapper: styles.radioControl,
            labelWrapper: styles.radioLabelWrapper,
            label: styles.radioLabel,
            control: styles.radioControlInner,
          }}
        >
          <div className={styles.radioContent}>
            <span className={styles.radioText}>{option.label}</span>
            {option.description && (
              <span className={styles.radioDesc}>{option.description}</span>
            )}
          </div>
        </Radio>
      ))}
    </RadioGroup>
  );
};

export default CustomRadioGroup;