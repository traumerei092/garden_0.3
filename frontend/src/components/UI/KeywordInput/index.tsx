'use client';

import { Input } from "@nextui-org/react";
import { ReactNode } from 'react';

type Props = {
  label?: string;
  value: string;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  isRequired?: boolean;
  endContent?: ReactNode;
  anotherStyle?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  isInvalid?: boolean;
  errorMessage?: ReactNode;
  className?: string;
  classNames?: {
    inputWrapper?: string;
    input?: string;
  };
  autoFocus?: boolean;
};

const KeywordInput = ({
  label,
  value,
  placeholder,
  size = 'md',
  isRequired,
  endContent,
  anotherStyle,
  onChange,
  onFocus,
  onBlur,
  isInvalid,
  errorMessage,
  className,
  classNames: customClassNames,
  autoFocus,
}: Props) => {
  return (
    <Input
      isClearable
      label={label}
      type="text"
      value={value}
      placeholder={placeholder}
      size={size}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      variant="bordered"
      radius="none"
      isRequired={isRequired}
      endContent={endContent}
      isInvalid={isInvalid}
      errorMessage={errorMessage}
      autoFocus={autoFocus}
      className={className || anotherStyle}
      classNames={customClassNames}
    />
  );
};

export default KeywordInput;