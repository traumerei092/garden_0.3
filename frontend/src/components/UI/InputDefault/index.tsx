'use client';

import styles from './style.module.scss';
import {Input} from "@nextui-org/react";
import { ReactNode } from 'react';
import classNames from "classnames";

type Props = {
  label?: string;
  type?: string;
  name?: string;
  value?: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  min?: number;
  isRequired?: boolean;
  endContent?: ReactNode;
  anotherStyle?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: () => void;
  isInvalid?: boolean;
  errorMessage?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  classNames?: {
    inputWrapper?: string;
    input?: string;
  };
};

const InputDefault = ({
                          label,
                          type = 'text',
                          name,
                          value = '',
                          placeholder,
                          size = 'md',
                          min,
                          isRequired,
                          endContent,
                          anotherStyle,
                          onChange,
                          onClick,
                          isInvalid,
                          errorMessage,
                          className,
                          style,
                          readOnly,
                          classNames: customClassNames,
                      }: Props) => {
    return (
        <Input
            label={label}
            type={type}
            name={name}
            value={value}
            placeholder={placeholder}
            size={size}
            min={min}
            onChange={onChange}
            onClick={onClick}
            variant="bordered"
            radius="none"
            isRequired={isRequired}
            endContent={endContent}
            isInvalid={isInvalid}
            errorMessage={errorMessage}
            readOnly={readOnly}
            style={style}
            className={className || classNames(styles.input, anotherStyle)}
            classNames={{
                inputWrapper: customClassNames?.inputWrapper || styles.customInputWrapper,
                label: styles.customLabel,
                input: customClassNames?.input || styles.customInput,
            }}
        />
    );
};

export default InputDefault;