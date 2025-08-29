'use client';

import React from 'react';
import { Autocomplete, AutocompleteItem } from '@nextui-org/react';
import styles from './style.module.scss';

export interface AutocompleteOption {
  key: string;
  label: string;
  value?: string;
}

interface StyledAutocompleteProps {
  options: AutocompleteOption[];
  defaultSelectedKey?: string;
  placeholder?: string;
  onSelectionChange?: (key: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}

const StyledAutocomplete: React.FC<StyledAutocompleteProps> = ({
  options,
  defaultSelectedKey,
  placeholder,
  onSelectionChange,
  className = '',
  size = 'sm',
  radius = 'sm',
  'aria-label': ariaLabel,
}) => {
  return (
    <Autocomplete
      size={size}
      radius={radius}
      className={`${styles.autocomplete} ${className}`}
      classNames={{
        base: styles.autocompleteInputWrapper,
        popoverContent: styles.autocompletePopoverContent,
        listboxWrapper: styles.autocompleteListboxWrapper,
        endContentWrapper: styles.autocompleteEndContentWrapper,
      }}
      defaultSelectedKey={defaultSelectedKey}
      placeholder={placeholder}
      aria-label={ariaLabel}
      onSelectionChange={(key) => {
        if (onSelectionChange) {
          onSelectionChange(key as string | null);
        }
      }}
    >
      {options.map((option) => (
        <AutocompleteItem 
          key={option.key} 
          className={styles.autocompleteItem}
          value={option.value || option.key}
        >
          {option.label}
        </AutocompleteItem>
      ))}
    </Autocomplete>
  );
};

export default StyledAutocomplete;