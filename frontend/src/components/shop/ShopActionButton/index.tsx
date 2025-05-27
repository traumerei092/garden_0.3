'use client';

import React from 'react';
import { Button, Tooltip } from '@nextui-org/react';
import { Star, Heart } from 'lucide-react';
import { RelationType } from '@/types/shops';
import styles from './style.module.scss';

type ShopActionButtonProps = {
    type: RelationType;
    count: number;
    isActive?: boolean;
    onClick?: () => void;
    loading?: boolean;
};

const ShopActionButton: React.FC<ShopActionButtonProps> = ({
    type,
    count,
    isActive = false,
    onClick,
    loading = false
}) => {
    const getIcon = () => {
        switch (type.name) {
            case 'visited':
                return <Star
                    size={24}
                    strokeWidth={isActive ? 0 : 1}
                    fill={isActive ? type.color : 'none'}
                    className={styles.icon}
                />;
            case 'interested':
                return <Heart
                    size={24}
                    strokeWidth={isActive ? 0 : 1}
                    fill={isActive ? type.color : 'none'}
                    className={styles.icon}
                />;
            default:
                return null;
        }
    };

    const tooltipContent = () => {
        return (
            <div className={styles.tooltipContent}>
                <div>{type.label}</div>
            </div>
        );
    };

    return (
        <div className={styles.buttonContainer}>
            <Tooltip content={tooltipContent()} placement="bottom" className={styles.tooltip}>
                <Button
                    className={`${styles.button} ${isActive ? styles.active : ''}`}
                    isIconOnly
                    variant="light"
                    onPress={onClick}
                    isLoading={loading}
                    aria-label={type.label}
                >
                    {getIcon()}
                </Button>
            </Tooltip>
            <span className={styles.countDisplay}>{count}</span>
        </div>
    );
};

export default ShopActionButton;
