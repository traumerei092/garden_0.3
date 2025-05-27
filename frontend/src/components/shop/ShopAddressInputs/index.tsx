'use client';

import React from 'react';
import {Button, Chip, Input } from '@nextui-org/react';
import styles from './style.module.scss';
import axios from 'axios';
import { ShopFormValues } from '@/types/shops';

type Props = {
    values: ShopFormValues;
    onChange: (field: keyof ShopFormValues, value: string) => void;
    errors?: {[key: string]: string};
};

export default function ShopAddressInputs({ values, onChange, errors = {} }: Props){

    // 郵便番号検索ハンドラー
    const handleZipSearch = async () => {
        if (values.zipCode.length !== 7) return;

        try {
            const res = await axios.get(
                `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${values.zipCode}`
            );
            const result = res.data.results?.[0];
            if (result) {
                onChange('prefecture', result.address1);
                onChange('city', result.address2);
                onChange('street', result.address3)
            }
        } catch (err) {
            console.error('郵便番号検索失敗', err);
        }
    };

    return (
        <>
            {/* 郵便番号（任意） */}
            <div className={styles.formRow}>
                <div className={styles.formLabel}><p>郵便番号</p></div>
                <div className={styles.formRequire} />
                <div className={`${styles.formItem} ${styles.formZip}`}>
                    <Input
                        label="郵便番号"
                        type="text"
                        name="zipCode"
                        value={values.zipCode}
                        onChange={(e) => onChange(e.target.name as keyof ShopFormValues, e.target.value)}
                        classNames={{
                            base: styles.formZipcodeBase,
                            inputWrapper: styles.formZipcode,
                            input: styles.formInputElement,
                        }}
                        placeholder={"例：1234567（ハイフンなしで記載）"}
                    />
                    <Button
                        type="button"
                        size="sm"
                        color="primary"
                        className={styles.zipSearchBtn}
                        onPress={handleZipSearch}
                    >
                        郵便番号から自動入力
                    </Button>
                </div>
            </div>

            {/* 都道府県 */}
            <div className={styles.formRow}>
                <div className={styles.formLabel}><p>都道府県</p></div>
                <div className={styles.formRequire}>
                    <Chip radius="sm" color="danger" size="sm">必須</Chip>
                </div>
                <div className={`${styles.formItem} ${styles.formLabel}`}>
                    <Input
                        label="都道府県"
                        type="text"
                        name="prefecture"
                        value={values.prefecture}
                        onChange={(e) => onChange(e.target.name as keyof ShopFormValues, e.target.value)}
                        isRequired
                        isInvalid={!!errors.prefecture}
                        errorMessage={errors.prefecture}
                        classNames={{
                            inputWrapper: styles.formInput,
                            input: styles.formInputElement,
                        }}
                    />
                </div>
            </div>

            {/* 市区町村 */}
            <div className={styles.formRow}>
                <div className={styles.formLabel}><p>市区町村</p></div>
                <div className={styles.formRequire}>
                    <Chip radius="sm" color="danger" size="sm">必須</Chip>
                </div>
                <div className={`${styles.formItem} ${styles.formLabel}`}>
                    <Input
                        label="市区町村"
                        type="text"
                        name="city"
                        value={values.city}
                        onChange={(e) => onChange(e.target.name as keyof ShopFormValues, e.target.value)}
                        isRequired
                        isInvalid={!!errors.city}
                        errorMessage={errors.city}
                        classNames={{
                            inputWrapper: styles.formInput,
                            input: styles.formInputElement,
                        }}
                    />
                </div>
            </div>

            {/* 番地 */}
            <div className={styles.formRow}>
                <div className={styles.formLabel}><p>番地</p></div>
                <div className={styles.formRequire}>
                    <Chip radius="sm" color="danger" size="sm">必須</Chip>
                </div>
                <div className={`${styles.formItem} ${styles.formLabel}`}>
                    <Input
                        label="番地"
                        type="text"
                        name="street"
                        value={values.street}
                        onChange={(e) => onChange(e.target.name as keyof ShopFormValues, e.target.value)}
                        isRequired
                        isInvalid={!!errors.street}
                        errorMessage={errors.street}
                        classNames={{
                            inputWrapper: styles.formInput,
                            input: styles.formInputElement,
                        }}
                    />
                </div>
            </div>

            {/* 建物名・部屋番号（任意） */}
            <div className={styles.formRow}>
                <div className={styles.formLabel}><p>建物名・部屋番号</p></div>
                <div className={styles.formRequire} />
                <div className={`${styles.formItem} ${styles.formLabel}`}>
                    <Input
                        label="建物名・部屋番号"
                        type="text"
                        name="building"
                        value={values.building}
                        onChange={(e) => onChange(e.target.name as keyof ShopFormValues, e.target.value)}
                        classNames={{
                            inputWrapper: styles.formInput,
                            input: styles.formInputElement,
                        }}
                    />
                </div>
            </div>
        </>
    );
};
