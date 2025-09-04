'use client';

import React, { useEffect } from 'react';
import { Accordion, AccordionItem } from '@nextui-org/react';
import styles from './style.module.scss';

interface DarkAccordionProps {
  variant?: 'splitted' | 'shadow' | 'bordered' | 'light';
  className?: string;
  children: React.ReactNode;
}

const DarkAccordion: React.FC<DarkAccordionProps> = ({
  variant = 'splitted',
  className = '',
  children
}) => {
  // NextUI Accordionの白い背景を強制的にダークテーマに変更
  useEffect(() => {
    const applyDarkTheme = () => {
      const accordionItems = document.querySelectorAll('[data-slot="base"]');
      accordionItems.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.setProperty('background', 'rgba(255, 255, 255, 0.05)', 'important');
          item.style.setProperty('background-color', 'rgba(255, 255, 255, 0.05)', 'important');
          item.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.1)', 'important');
          item.style.setProperty('border-radius', '12px', 'important');
          item.style.setProperty('box-shadow', 'none', 'important');
        }
      });

      const triggers = document.querySelectorAll('[data-slot="trigger"]');
      triggers.forEach(trigger => {
        if (trigger instanceof HTMLElement) {
          trigger.style.setProperty('background', 'transparent', 'important');
          trigger.style.setProperty('color', '#fff', 'important');
          // ホバーエフェクトを無効化
          trigger.addEventListener('mouseenter', () => {
            trigger.style.setProperty('background', 'transparent', 'important');
          });
          trigger.addEventListener('mouseleave', () => {
            trigger.style.setProperty('background', 'transparent', 'important');
          });
        }
      });

      const titles = document.querySelectorAll('[data-slot="title"]');
      titles.forEach(title => {
        if (title instanceof HTMLElement) {
          title.style.setProperty('color', '#fff', 'important');
        }
      });

      const subtitles = document.querySelectorAll('[data-slot="subtitle"]');
      subtitles.forEach(subtitle => {
        if (subtitle instanceof HTMLElement) {
          subtitle.style.setProperty('color', 'rgba(255, 255, 255, 0.7)', 'important');
        }
      });

      const indicators = document.querySelectorAll('[data-slot="indicator"]');
      indicators.forEach(indicator => {
        if (indicator instanceof HTMLElement) {
          indicator.style.setProperty('color', '#00C2FF', 'important');
        }
      });
    };

    const timer = setTimeout(applyDarkTheme, 100);
    return () => clearTimeout(timer);
  }, [children]);

  return (
    <Accordion 
      variant={variant} 
      className={`${styles.darkAccordion} ${className}`}
      style={{
        '--nextui-background': 'rgba(255, 255, 255, 0.05)',
        '--nextui-default-50': 'rgba(255, 255, 255, 0.05)',
        '--nextui-default-100': 'rgba(255, 255, 255, 0.05)',
        '--nextui-content1': 'rgba(255, 255, 255, 0.05)',
        '--nextui-content2': 'rgba(255, 255, 255, 0.05)',
      } as React.CSSProperties}
    >
      {children}
    </Accordion>
  );
};

// DarkAccordionItemも一緒にexport
export { AccordionItem as DarkAccordionItem };
export default DarkAccordion;