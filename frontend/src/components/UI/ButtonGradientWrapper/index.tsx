'use client';

import { Button } from '@nextui-org/react';
import styles from './style.module.scss';
import classNames from "classnames";

type Props = {
    children: React.ReactNode;
    onClick?: () => void;
    anotherStyle: string;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
}

const ButtonGradientWrapper = ({ children, onClick, anotherStyle, type="button", disabled }: Props) => {
  return (
      <div className={classNames(styles.gradientWrapper, anotherStyle)}>
        <Button
          className={classNames(styles.gradient, anotherStyle)}
          onPress={onClick}
          type={type}
          disabled={disabled}
        >
          {children}
        </Button>
      </div>

  );
};

export default ButtonGradientWrapper;