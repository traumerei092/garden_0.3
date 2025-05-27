'use client';

import { Chip } from '@nextui-org/react';
import type { ReactNode } from 'react';
import styles from './style.module.scss';

type Props = {
  children: ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
};

export default function CheckboxCustom({ children, isSelected = false, onClick }: Props) {
    return (
        <Chip
            onClick={onClick}
            variant="flat"
            radius="sm"
            className={`${styles.checkboxChip} ${isSelected ? styles.selected : ''}`}
            classNames={{
                content:styles.font,
            }}
        >
            {children}
        </Chip>
    );
}