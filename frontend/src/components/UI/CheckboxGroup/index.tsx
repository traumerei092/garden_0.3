'use client';

import { CheckboxGroup } from '@nextui-org/react';
import styles from './style.module.scss';
import CheckboxCustom from "@/components/UI/CheckboxCustom";

type Option = {
  label: string;
  value: string;
};

type Props = {
    name: string;
    values: string[];
    onChange: (values: string[]) => void;
    options: Option[];
};

export default function CustomCheckboxGroup({
    name,
    values,
    onChange,
    options,
}: Props) {
    const toggleValue = (value: string) => {
        if (values.includes(value)) {
            onChange(values.filter((v) => v !== value));
        } else {
            onChange([...values, value]);
        }
    };

    return (
        <>
            <CheckboxGroup
                value={values}
                onChange={onChange}
                orientation="horizontal"
                classNames={{
                    base: styles.checkboxGroup,
                }}
                name={name}
            >
                {options.map((option) => (
                    <CheckboxCustom
                        key={option.value}
                        isSelected={values.includes(option.value)}
                        onClick={() => toggleValue(option.value)}
                    >
                        {option.label}
                    </CheckboxCustom>
                ))}
            </CheckboxGroup>
        </>
    );
}