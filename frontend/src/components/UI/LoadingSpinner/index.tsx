'use client'

import React from 'react';
import { Spinner } from '@nextui-org/react';
import styles from './style.module.scss';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  color = 'primary',
  className 
}) => {
  return (
    <div className={`${styles.spinnerContainer} ${className || ''}`}>
      <Spinner size={size} color={color} />
    </div>
  );
};

export default LoadingSpinner;
