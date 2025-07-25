'use client';

import React from 'react';
import { Tabs, Tab } from '@nextui-org/react';
import styles from './style.module.scss';

export interface TabItem {
  key: string;
  title: React.ReactNode;
  content?: React.ReactNode;
  disabled?: boolean;
}

interface CustomTabsProps {
  items: TabItem[];
  selectedKey?: string;
  onSelectionChange?: (key: string) => void;
  variant?: 'solid' | 'underlined' | 'bordered' | 'light';
  size?: 'sm' | 'md' | 'lg';
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  fullWidth?: boolean;
  isVertical?: boolean;
  placement?: 'top' | 'bottom' | 'start' | 'end';
  className?: string;
  disableAnimation?: boolean;
  destroyInactiveTabPanel?: boolean;
  motionProps?: any;
}

const CustomTabs: React.FC<CustomTabsProps> = ({
  items,
  selectedKey,
  onSelectionChange,
  variant = 'solid',
  size = 'md',
  color = 'default',
  fullWidth = false,
  isVertical = false,
  placement = 'top',
  className = '',
  disableAnimation = false,
  destroyInactiveTabPanel = true,
  motionProps,
}) => {
  return (
    <Tabs
      selectedKey={selectedKey}
      onSelectionChange={(key) => onSelectionChange?.(String(key))}
      variant={variant}
      size={size}
      color={color}
      fullWidth={fullWidth}
      isVertical={isVertical}
      placement={placement}
      disableAnimation={disableAnimation}
      destroyInactiveTabPanel={destroyInactiveTabPanel}
      motionProps={motionProps}
      className={`${styles.customTabs} ${className}`}
      classNames={{
        tabList: `${styles.tabList} ${styles[`tabList--${variant}`]}`,
        cursor: `${styles.cursor} ${styles[`cursor--${variant}`]}`,
        tab: `${styles.tab} ${styles[`tab--${variant}`]} ${styles[`tab--${size}`]}`,
        tabContent: `${styles.tabContent} ${styles[`tabContent--${variant}`]}`,
        panel: styles.panel,
      }}
    >
      {items.map((item) => (
        <Tab
          key={item.key}
          title={item.title}
          isDisabled={item.disabled}
        >
          {item.content}
        </Tab>
      ))}
    </Tabs>
  );
};

export default CustomTabs;
