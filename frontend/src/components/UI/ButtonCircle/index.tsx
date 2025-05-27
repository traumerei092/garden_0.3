'use client';

import { Button } from '@nextui-org/react';
import styles from './style.module.scss';

type Props = {
  children: React.ReactNode;
  action: () => void;
};

const ButtonCircle = ({ children, action }: Props) => {

    const handleClick = () => {
        action();
    };

    return (
        <div className={styles.gradientWrapper}>
            <Button
                className={styles.gradient}
                onClick={handleClick}
            >
                {children}
            </Button>
        </div>
    );
};

export default ButtonCircle;