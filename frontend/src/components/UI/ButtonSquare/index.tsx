'use client';

import { Button } from '@nextui-org/react';
import styles from './style.module.scss';
import {useRouter} from "next/navigation";

type Props = {
  children: React.ReactNode;
  href: string;
};

const ButtonSquare = ({ children, href }: Props) => {

    const router = useRouter();
    const handleNavigation = () => {
        router.push(href);
    };

    return (
        <div className={styles.gradientWrapper}>
            <Button
                className={styles.gradient}
                onClick={handleNavigation}
            >
                {children}
            </Button>
        </div>
    );
};

export default ButtonSquare;