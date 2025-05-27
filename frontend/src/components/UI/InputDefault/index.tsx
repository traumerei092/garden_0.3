'use client';

import styles from './style.module.scss';
import {Input} from "@nextui-org/react";
import { ReactNode } from 'react';
import classNames from "classnames";

type Props = {
  label: string;
  type: string;
  name: string;
  value: string;
  isRequired?: boolean;
  endContent?: ReactNode;
  anotherStyle: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isInvalid?: boolean;
  errorMessage?: ReactNode;
};

const InputDefault = ({
                          label,
                          type,
                          name,
                          value,
                          isRequired,
                          endContent,
                          anotherStyle,
                          onChange,
                          isInvalid,
                          errorMessage,
                      }: Props) => {
    return (
        <Input
            label={label}
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            variant="underlined"
            radius="none"
            isRequired={isRequired}
            endContent={endContent}
            isInvalid={isInvalid}
            errorMessage={errorMessage}
            className={classNames(styles.input, anotherStyle)}
            classNames={{
                inputWrapper: styles.customInputWrapper,
                label: styles.customLabel,
                input: styles.customInput,
            }}
        />
    );
};

export default InputDefault;