'use client';

import React from 'react';
import { Button } from '@nextui-org/react';
import { ChevronRight } from 'lucide-react';
import styles from './style.module.scss';

type ShopActionLinkProps = {
    label: string;
    onClick?: () => void;
};

const ShopActionLink: React.FC<ShopActionLinkProps> = ({
    label,
    onClick
}) => {
    return (
        <Button
            className={styles.button}
            variant="flat"
            color="default"
            endContent={<ChevronRight size={18} />}
            onClick={onClick}
            fullWidth
        >
        {label}
        </Button>
    );
};

export default ShopActionLink;
