'use client';

import React from 'react';
import styles from './style.module.scss';
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@nextui-org/react";
import { TimeInput } from "@nextui-org/react";
import { Checkbox } from "@nextui-org/react";
import type { BusinessHourForm, WeekDay } from '@/types/shops';

interface Props {
    value: Record<WeekDay, BusinessHourForm>;
    onChange: <K extends keyof BusinessHourForm>(
        day: WeekDay,
        field: K,
        value: BusinessHourForm[K]
    ) => void;
};

// ラベル表示用（日本語）
const weekdayLabels = ['月', '火', '水', '木', '金', '土', '日', '祝'] as const;
// データ構造用（英語キー）
const weekdays: WeekDay[] = [
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'hol',
];

export default function ShopBusinessHourTable({ value, onChange }: Props){

    return (
        <Table
            aria-label="営業時間設定"
            classNames={{
                wrapper: styles.tableWrapper,
                th: styles.tableHeader,
            }}
        >
            <TableHeader>
                <TableColumn>曜日</TableColumn>
                <TableColumn>営業開始</TableColumn>
                <TableColumn>営業終了</TableColumn>
                <TableColumn>定休日</TableColumn>
            </TableHeader>
            <TableBody>
                {weekdays.map((day, index) => (
                    <TableRow key={day}>
                        <TableCell>{weekdayLabels[index]}</TableCell>
                        <TableCell>
                            <TimeInput
                                value={value[day].open ?? undefined}
                                variant={"underlined"}
                                onChange={val => onChange(day, "open", val)}
                                isDisabled={value[day].isClosed}
                                classNames={{
                                    input: styles.inputHour,
                                }}
                            />
                        </TableCell>
                        <TableCell>
                            <TimeInput
                                value={value[day].close ?? undefined}
                                variant={"underlined"}
                                onChange={val => onChange(day, "close", val)}
                                isDisabled={value[day].isClosed}
                                classNames={{
                                    input: styles.inputHour,
                                }}
                            />
                        </TableCell>
                        <TableCell>
                            <Checkbox
                                isSelected={value[day].isClosed}
                                onValueChange={(val) => onChange(day, "isClosed", val)}
                            />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
};