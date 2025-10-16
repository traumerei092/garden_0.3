'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import styles from './style.module.scss';

interface BackButtonProps {
  variant?: 'back' | 'link';
  href?: string;
  text?: string;
  className?: string;
  iconType?: 'arrow' | 'chevron';
  strokeWidth?: number;
}

const BackButton: React.FC<BackButtonProps> = ({
  variant = 'back',
  href,
  text = '戻る',
  className = '',
  iconType = 'arrow',
  strokeWidth = 1,
}) => {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  const Icon = iconType === 'chevron' ? ChevronLeft : ArrowLeft;
  const iconSize = iconType === 'chevron' ? 18 : 20;

  if (variant === 'link' && href) {
    return (
      <Link href={href} className={`${styles.backButton} ${className}`}>
        <Icon size={iconSize} strokeWidth={strokeWidth}/>
        <span className={styles.backButtonText}>{text}</span>
      </Link>
    );
  }

  return (
    <button onClick={handleBackClick} className={`${styles.backButton} ${className}`}>
      <Icon size={iconSize} />
      <span className={styles.backButtonText}>{text}</span>
    </button>
  );
};

export default BackButton;