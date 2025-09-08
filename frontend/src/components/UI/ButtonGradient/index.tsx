'use client';

import { Button } from '@nextui-org/react';
import styles from './style.module.scss';
import classNames from "classnames";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  anotherStyle: string;
  type?: 'button' | 'submit' | 'reset';
  size?: 'sm' | 'md' | 'lg';
};

const ButtonGradient = ({ children, onClick, anotherStyle, type="button", size="md" }: Props) => {
  console.log("🧩 onPress in ButtonGradient:", onClick);
    return (
      <div className={classNames(styles.gradientWrapper, anotherStyle)}>
        <Button
          className={classNames(styles.gradient, anotherStyle)}
          onPress={onClick}
          type={type}
          size={size}
        >
          {children}
        </Button>
      </div>
    );
};

export default ButtonGradient;