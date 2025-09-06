'use client';

import React from 'react';
import { Button, Tooltip } from '@nextui-org/react';
import { Star, Heart, Crown } from 'lucide-react';
import { RelationType } from '@/types/shops';
import styles from './style.module.scss';

type ShopActionButtonProps = {
    type: RelationType;
    count: number;
    isActive?: boolean;
    onClick?: () => void;
    loading?: boolean;
    showCount?: boolean;
    anotherStyle?: string;
};

const ShopActionButton: React.FC<ShopActionButtonProps> = ({
    type,
    count,
    isActive = false,
    onClick,
    loading = false,
    showCount = true,
    anotherStyle
}) => {
    // デバッグ用：ShopActionButtonが受け取ったpropsを確認
    console.log(`ShopActionButton [${type.name}]:`, {
        typeName: type.name,
        typeId: type.id,
        isActive,
        count
    });
    const getIcon = () => {
        switch (type.name) {
            case 'favorite':
                return <Crown
                    size={16}
                    strokeWidth={isActive ? 0 : 1.5}
                    fill={isActive ? '#00ffff' : 'none'}
                    color={isActive ? '#00ffff' : 'white'}
                    className={styles.icon}
                />;
            case 'visited':
                return <Star
                    size={16}
                    strokeWidth={isActive ? 0 : 1.5}
                    fill={isActive ? '#ffc107' : 'none'}
                    color={isActive ? '#ffc107' : 'white'}
                    className={styles.icon}
                />;
            case 'interested':
                return <Heart
                    size={16}
                    strokeWidth={isActive ? 0 : 1.5}
                    fill={isActive ? '#ef4444' : 'none'}
                    color={isActive ? '#ef4444' : 'white'}
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
        <div className={`${styles.buttonContainer} ${anotherStyle}`}>
            <Tooltip content={tooltipContent()} placement="bottom" className={styles.tooltip}>
                <Button
                    className={`${styles.button} ${styles[type.name]} ${isActive ? styles.active : ''}`}
                    isIconOnly
                    variant="light"
                    onPress={onClick}
                    isLoading={loading}
                    aria-label={type.label}
                >
                    {getIcon()}
                </Button>
            </Tooltip>
            {showCount && <span className={styles.countDisplay}>{count}</span>}
        </div>
    );
};

export default ShopActionButton;
