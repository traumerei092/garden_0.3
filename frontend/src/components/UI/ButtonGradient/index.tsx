'use client';

import { Button } from '@nextui-org/react';
import styles from './style.module.scss';
import classNames from "classnames";

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  anotherStyle: string;
  type?: 'button' | 'submit' | 'reset';
};

const ButtonGradient = ({ children, onClick, anotherStyle, type="button" }: Props) => {
  console.log("🧩 onPress in ButtonGradient:", onClick);
    return (
      <div className={classNames(styles.gradientWrapper, anotherStyle)}>
        <Button
          className={classNames(styles.gradient, anotherStyle)}
          onPress={onClick}
          type={type}
        >
          {children}
        </Button>
      </div>
    );
};

export default ButtonGradient;