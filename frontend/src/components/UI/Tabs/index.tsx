'use client'

import React, { useState, ReactNode } from 'react';
import styles from './style.module.scss';
import { cn } from '@nextui-org/react';

interface TabItem {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  children: ReactNode[];
}

const Tabs: React.FC<TabsProps> = ({ 
  items, 
  defaultActiveKey, 
  onChange,
  children 
}) => {
  const [activeKey, setActiveKey] = useState(defaultActiveKey || items[0]?.key || '');

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    if (onChange) {
      onChange(key);
    }
  };

  // 現在のアクティブなタブに対応する子要素を表示
  const activeIndex = items.findIndex(item => item.key === activeKey);
  const activeContent = children[activeIndex] || null;

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsHeader}>
        {items.map((item) => (
          <div
            key={item.key}
            className={cn(
              styles.tabItem,
              activeKey === item.key ? styles.active : ''
            )}
            onClick={() => handleTabClick(item.key)}
          >
            {item.icon && <span className={styles.tabIcon}>{item.icon}</span>}
            <span className={styles.tabLabel}>{item.label}</span>
          </div>
        ))}
      </div>
      <div className={styles.tabContent}>
        {activeContent}
      </div>
    </div>
  );
};

export default Tabs;
