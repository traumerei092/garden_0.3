'use client';

import { Button } from '@nextui-org/react';
import styles from './style.module.scss';
import {CirclePlus} from "lucide-react";

type Props = {
  children: React.ReactNode;
  action?: () => void;
};

const ButtonCondition = ({ children, action }: Props) => {
  return (
    <Button
        className={styles.gradient}
        onClick={action}
    >
        <CirclePlus className={styles.circleIcon}/>
        {children}
    </Button>
  );
};

export default ButtonCondition;