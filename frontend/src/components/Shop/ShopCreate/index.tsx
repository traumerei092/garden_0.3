'use client';

import React, { useEffect, useState } from 'react';
import styles from './style.module.scss';
import {Card, CardBody, Chip, Input, RadioGroup, Tooltip} from "@nextui-org/react";
import RowSteps from "@/components/UI/RowSteps";
import ButtonGradientWrapper from "@/components/UI/ButtonGradientWrapper";
import ButtonGradient from "@/components/UI/ButtonGradient";
import {useRouter} from "next/navigation";
import ShopAddressInputs from "@/components/Shop/ShopAddressInputs";
import {ShopFormValues, ShopType, ShopLayout, ShopOption, BusinessHourForm, WeekDay, PaymentMethod} from "@/types/shops";
import CheckboxGroup from "@/components/UI/CheckboxGroup";
import { fetchShopTypes } from '@/actions/shop/fetchShopTypes';
import { fetchShopLayouts } from "@/actions/shop/fetchShopLayouts";
import { fetchShopOptions } from "@/actions/shop/fetchShopOptions";
import { fetchPaymentMethods } from "@/actions/shop/fetchPaymentMethods";
import ShopBusinessHourTable from "@/components/Shop/ShopBusinessHourTable";
import ChipSelected from "@/components/UI/ChipSelected";
import { Time } from '@internationalized/date';
import ShopCreateModal from "@/components/Shop/ShopCreateModal";
import {PictureUpload} from "@/components/UI/PictureUpload";

const steps = [
    { title: "入力" },
    { title: "確認" },
    { title: "完了" },
];

const initialBusinessHours: Record<WeekDay, BusinessHourForm> = {
    mon: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
    tue: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
    wed: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
    thu: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
    fri: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
    sat: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
    sun: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
    hol: { open: new Time(18, 0), close: new Time(23, 0), isClosed: false },
};

const ShopCreate = () => {

    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [showModal, setShowModal] = useState(false);
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [createdShopId, setCreatedShopId] = useState<number | null>(null);

    // タイプ、レイアウト、オプション、支払方法
    const [shopTypeOptions, setShopTypeOptions] = useState<ShopType[]>([]);
    const [shopLayoutOptions, setShopLayoutOptions] = useState<ShopLayout[]>([]);
    const [shopOptionOptions, setShopOptionOptions] = useState<ShopOption[]>([]);
    const [paymentMethodOptions, setPaymentMethodOptions] = useState<PaymentMethod[]>([]);

    const [formValues, setFormValues] = useState<ShopFormValues>({
        shopName: '',
        zipCode: '',
        prefecture: '',
        city: '',
        street: '',
        building: '',
        shopTypes: [],
        shopLayouts: [],
        shopOptions: [],
        capacity: null,
        businessHours: initialBusinessHours,
        images: Array(6).fill({ file: null, caption: '', isIcon: false }),
        phoneNumber: '',
        access: '',
        paymentMethods: [],
        budgetWeekdayMin: null,
        budgetWeekdayMax: null,
        budgetWeekendMin: null,
        budgetWeekendMax: null,
        budgetNote: '',
    });

    const validateForm = () => {
        const newErrors: {[key: string]: string} = {};
        
        // 店舗名のバリデーション
        if (!formValues.shopName.trim()) {
            newErrors.shopName = '店舗名は必須です';
        }
        
        // 住所のバリデーション
        if (!formValues.prefecture.trim()) {
            newErrors.prefecture = '都道府県は必須です';
        }
        
        if (!formValues.city.trim()) {
            newErrors.city = '市区町村は必須です';
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            if (currentStep === 0 && !validateForm()) {
                return; // バリデーションエラーがある場合は次に進まない
            }
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleBackShopList = () => {
        router.push('/shops');
    };

    const handleGoToShopPage = () => {
        if (createdShopId) {
            router.push(`/shops/${createdShopId}`);
        }
    };

    const handleInputChange = (field: keyof ShopFormValues, value: string) => {
        setFormValues((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // 営業時間データの整形
    const formatTime = (time: Time | null) => {
        if (!time) return '';
        const hour = time.hour.toString().padStart(2, '0');
        const minute = time.minute.toString().padStart(2, '0');
        return `${hour}:${minute}`;
    };

    // 営業時間テーブルへの曜日のラベル付け
    const weekdayMap: Record<WeekDay, string> = {
        mon: '月',
        tue: '火',
        wed: '水',
        thu: '木',
        fri: '金',
        sat: '土',
        sun: '日',
        hol: '祝',
    };

    // 画像登録周り
    const handleImageChange = (index: number, file: File | null) => {
        setFormValues(prev => {
            const newImages = [...prev.images];
            newImages[index] = { ...newImages[index], file };
            return { ...prev, images: newImages };
        });
    };

    const handleCaptionChange = (index: number, caption: string) => {
        setFormValues(prev => {
            const newImages = [...prev.images];
            newImages[index] = { ...newImages[index], caption };
            return { ...prev, images: newImages };
        });
    };

    const handleIconChange = (value: string) => {
        const selectedIndex = parseInt(value);
        setFormValues(prev => {
            const newImages = prev.images.map((img, i) => ({
                ...img,
                isIcon: i === selectedIndex && img.file !== null
            }));
            return { ...prev, images: newImages };
        });
    };

    useEffect(() => {
        const load = async () => {
            try {
                const types = await fetchShopTypes();
                setShopTypeOptions(types);
            } catch (err) {
                console.error('ショップタイプ取得失敗:', err);
            }

            try {
                const layouts = await fetchShopLayouts();
                setShopLayoutOptions(layouts);
            } catch (err) {
                console.error('ショップレイアウト取得失敗:', err);
            }

            try {
                const options = await fetchShopOptions();
                setShopOptionOptions(options);
            } catch (err) {
                console.error('ショップオプション取得失敗:', err);
            }

            try {
                const paymentMethods = await fetchPaymentMethods();
                setPaymentMethodOptions(paymentMethods);
            } catch (err) {
                console.error('支払方法取得失敗:', err);
            }
        };

        load();
    }, []);

    return (
        <div className={styles.container}>
            <Card className={styles.createTitle}>
                <CardBody className={styles.createTitleBody}>
                    <h1>【店舗登録】</h1>
                    <h2>あなたのご協力があなたにより還元できるサービスになります</h2>
                    <p>
                        Bar／スナック／立ち飲み屋などの店舗情報登録のご協力をお願いいたします。<br/>
                        不明の項目は未入力のままでの登録できます。<br/>
                        信憑性のある情報登録にご協力ください。
                    </p>
                </CardBody>
            </Card>
            <Card className={styles.createNav}>
                <CardBody className={styles.createNavBody}>
                    <RowSteps steps={steps} currentStep={currentStep} />
                </CardBody>
            </Card>
            <div className={styles.createForm}>
                {currentStep === 0 && (
                    <>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>店舗名</p>
                            </div>
                            <div className={styles.formRequire}><Chip radius="sm" color="danger" size="sm">必須</Chip>
                            </div>
                            <div className={styles.formItem}>
                                <Input
                                    label="店舗名"
                                    type="text"
                                    name="shopName"
                                    value={formValues.shopName}
                                    onChange={(e) => handleInputChange(e.target.name as keyof ShopFormValues, e.target.value)}
                                    isRequired={true}
                                    isInvalid={!!errors.shopName}
                                    errorMessage={errors.shopName}
                                    classNames={{
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            </div>
                        </div>
                        <ShopAddressInputs
                            values={formValues}
                            onChange={handleInputChange}
                            errors={errors}
                        />
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>店舗タイプ</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.formCheckbox}`}>
                                <CheckboxGroup
                                    name="shopTypes"
                                    values={formValues.shopTypes.map((type) => type.id.toString())}
                                    onChange={(selected: string[]) =>
                                        setFormValues((prev) => ({
                                            ...prev,
                                            shopTypes: shopTypeOptions.filter((type) => selected.includes(type.id.toString())),
                                        }))
                                    }
                                    options={shopTypeOptions.map((type) => ({
                                        label: type.name,
                                        value: type.id.toString(),
                                    }))}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>レイアウト</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.formCheckbox}`}>
                                <CheckboxGroup
                                    name="shopLayouts"
                                    values={formValues.shopLayouts.map((type) => type.id.toString())}
                                    onChange={(selected: string[]) =>
                                        setFormValues((prev) => ({
                                            ...prev,
                                            shopLayouts: shopLayoutOptions.filter((type) => selected.includes(type.id.toString())),
                                        }))
                                    }
                                    options={shopLayoutOptions.map((type) => ({
                                        label: type.name,
                                        value: type.id.toString(),
                                    }))}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>オプション</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.formCheckbox}`}>
                                <CheckboxGroup
                                    name="shopOptions"
                                    values={formValues.shopOptions.map((type) => type.id.toString())}
                                    onChange={(selected: string[]) =>
                                        setFormValues((prev) => ({
                                            ...prev,
                                            shopOptions: shopOptionOptions.filter((type) => selected.includes(type.id.toString())),
                                        }))
                                    }
                                    options={shopOptionOptions.map((type) => ({
                                        label: type.name,
                                        value: type.id.toString(),
                                    }))}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>予算目安</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.budgetSection}`}>
                                <div className={styles.budgetCategory}>
                                    <h4 className={styles.budgetCategoryTitle}>平日予算</h4>
                                    <div className={styles.budgetRange}>
                                        <Input
                                            label="最低額"
                                            type="number"
                                            placeholder="2000"
                                            value={formValues.budgetWeekdayMin?.toString() || ''}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                                setFormValues(prev => ({ ...prev, budgetWeekdayMin: value }));
                                            }}
                                            endContent={
                                                <div className="pointer-events-none flex items-center">
                                                    <span className="text-default-400 text-small">円</span>
                                                </div>
                                            }
                                            classNames={{
                                                base: styles.budgetInput,
                                                inputWrapper: styles.formInput,
                                                input: styles.formInputElement,
                                                label: styles.budgetLabel,
                                            }}
                                        />
                                        <span className={styles.budgetSeparator}>〜</span>
                                        <Input
                                            label="最高額"
                                            type="number"
                                            placeholder="4000"
                                            value={formValues.budgetWeekdayMax?.toString() || ''}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                                setFormValues(prev => ({ ...prev, budgetWeekdayMax: value }));
                                            }}
                                            endContent={
                                                <div className="pointer-events-none flex items-center">
                                                    <span className="text-default-400 text-small">円</span>
                                                </div>
                                            }
                                            classNames={{
                                                base: styles.budgetInput,
                                                inputWrapper: styles.formInput,
                                                input: styles.formInputElement,
                                                label: styles.budgetLabel,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.budgetCategory}>
                                    <h4 className={styles.budgetCategoryTitle}>週末予算</h4>
                                    <div className={styles.budgetRange}>
                                        <Input
                                            label="最低額"
                                            type="number"
                                            placeholder="3000"
                                            value={formValues.budgetWeekendMin?.toString() || ''}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                                setFormValues(prev => ({ ...prev, budgetWeekendMin: value }));
                                            }}
                                            endContent={
                                                <div className="pointer-events-none flex items-center">
                                                    <span className="text-default-400 text-small">円</span>
                                                </div>
                                            }
                                            classNames={{
                                                base: styles.budgetInput,
                                                inputWrapper: styles.formInput,
                                                input: styles.formInputElement,
                                                label: styles.budgetLabel,
                                            }}
                                        />
                                        <span className={styles.budgetSeparator}>〜</span>
                                        <Input
                                            label="最高額"
                                            type="number"
                                            placeholder="5000"
                                            value={formValues.budgetWeekendMax?.toString() || ''}
                                            onChange={(e) => {
                                                const value = e.target.value === '' ? null : parseInt(e.target.value);
                                                setFormValues(prev => ({ ...prev, budgetWeekendMax: value }));
                                            }}
                                            endContent={
                                                <div className="pointer-events-none flex items-center">
                                                    <span className="text-default-400 text-small">円</span>
                                                </div>
                                            }
                                            classNames={{
                                                base: styles.budgetInput,
                                                inputWrapper: styles.formInput,
                                                input: styles.formInputElement,
                                                label: styles.budgetLabel,
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className={styles.budgetNoteSection}>
                                    <Input
                                        label="予算に関する補足（料金システムなど）"
                                        type="text"
                                        placeholder="チャージ料金、サービス料、時間制など"
                                        value={formValues.budgetNote}
                                        onChange={(e) => {
                                            setFormValues(prev => ({ ...prev, budgetNote: e.target.value }));
                                        }}
                                        classNames={{
                                            base: styles.budgetNoteInput,
                                            inputWrapper: styles.formInput,
                                            input: styles.formInputElement,
                                            label: styles.budgetLabel,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>支払方法</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.formCheckbox}`}>
                                <CheckboxGroup
                                    name="paymentMethods"
                                    values={formValues.paymentMethods.map((method) => String(method.id))}
                                    onChange={(selected: string[]) =>
                                        setFormValues((prev) => ({
                                            ...prev,
                                            paymentMethods: paymentMethodOptions.filter((method) => selected.includes(String(method.id))),
                                        }))
                                    }
                                    options={paymentMethodOptions.map((method) => ({
                                        label: method.name,
                                        value: String(method.id),
                                    }))}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>電話番号</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.form}`}>
                                <Input
                                    label="電話番号"
                                    type="tel"
                                    name="phoneNumber"
                                    value={formValues.phoneNumber}
                                    onChange={(e) => handleInputChange(e.target.name as keyof ShopFormValues, e.target.value)}
                                    classNames={{
                                        base: styles.formHalf,
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>アクセス</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.form}`}>
                                <Input
                                    label="アクセス情報"
                                    type="text"
                                    name="access"
                                    value={formValues.access}
                                    onChange={(e) => handleInputChange(e.target.name as keyof ShopFormValues, e.target.value)}
                                    classNames={{
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>席数</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.form}`}>
                                <Input
                                    label="席数"
                                    type="number"
                                    name="capacity"
                                    value={formValues.capacity?.toString() ?? ''}
                                    onChange={(e) => handleInputChange(e.target.name as keyof ShopFormValues, e.target.value)}
                                    classNames={{
                                        base: styles.formHalf,
                                        inputWrapper: styles.formInput,
                                        input: styles.formInputElement,
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>営業時間</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.form}`}>
                                <ShopBusinessHourTable
                                    value={formValues.businessHours}
                                    onChange={(day, field, val) => {
                                        setFormValues((prev) => ({
                                            ...prev,
                                            businessHours: {
                                                ...prev.businessHours,
                                                [day]: {
                                                    ...prev.businessHours[day],
                                                    [field]: val,
                                                },
                                            },
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                        <div className={styles.formRow}>
                            <div className={styles.formLabel}>
                                <p>画像登録</p>
                            </div>
                            <div className={styles.formRequire}/>
                            <div className={`${styles.formItem} ${styles.imageUploadContainer}`}>
                                <div className={styles.imageUploadGrid}>
                                    {formValues.images.map((img, index) => (
                                        <PictureUpload
                                            key={index}
                                            index={index}
                                            file={img.file}
                                            caption={img.caption}
                                            onFileChange={handleImageChange}
                                            onCaptionChange={handleCaptionChange}
                                            value={index.toString()}
                                            hideIconSelect={false}
                                            isRequired={false}
                                            isSelected={formValues.images[index].isIcon}
                                            onIconSelect={() => handleIconChange(index.toString())}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {currentStep === 1 && (
                    <>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>店舗名</p>
                            <p className={styles.confirmValue}>{formValues.shopName}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>郵便番号</p>
                            <p className={styles.confirmValue}>{formValues.zipCode}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>都道府県</p>
                            <p className={styles.confirmValue}>{formValues.prefecture}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>市区町村</p>
                            <p className={styles.confirmValue}>{formValues.city}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>番地</p>
                            <p className={styles.confirmValue}>{formValues.street}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>建物名・部屋番号</p>
                            <p className={styles.confirmValue}>{formValues.building}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>店舗タイプ</p>
                            <div className={`${styles.confirmValue} ${styles.confirmChip}`}>
                                {formValues.shopTypes.map((type) => (
                                    <ChipSelected key={type.id}>{type.name}</ChipSelected>
                                ))}
                            </div>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>レイアウト</p>
                            <div className={`${styles.confirmValue} ${styles.confirmChip}`}>
                                {formValues.shopLayouts.map((layout) => (
                                    <ChipSelected key={layout.id}>{layout.name}</ChipSelected>
                                ))}
                            </div>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>オプション</p>
                            <div className={`${styles.confirmValue} ${styles.confirmChip}`}>
                                {formValues.shopOptions.map((option) => (
                                    <ChipSelected key={option.id}>{option.name}</ChipSelected>
                                ))}
                            </div>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>支払方法</p>
                            <div className={`${styles.confirmValue} ${styles.confirmChip}`}>
                                {formValues.paymentMethods.map((method) => (
                                    <ChipSelected key={method.id}>{method.name}</ChipSelected>
                                ))}
                            </div>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>電話番号</p>
                            <p className={styles.confirmValue}>{formValues.phoneNumber || '未入力'}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>アクセス</p>
                            <p className={styles.confirmValue}>{formValues.access || '未入力'}</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>予算目安</p>
                            <div className={styles.confirmValue}>
                                <div className={styles.budgetConfirm}>
                                    <div className={styles.budgetConfirmCategory}>
                                        <span className={styles.budgetCategoryLabel}>平日:</span>
                                        <span className={styles.budgetItem}>
                                            {formValues.budgetWeekdayMin || formValues.budgetWeekdayMax ? 
                                                `${formValues.budgetWeekdayMin?.toLocaleString() || ''}円 〜 ${formValues.budgetWeekdayMax?.toLocaleString() || ''}円` 
                                                : '未設定'
                                            }
                                        </span>
                                    </div>
                                    <div className={styles.budgetConfirmCategory}>
                                        <span className={styles.budgetCategoryLabel}>週末:</span>
                                        <span className={styles.budgetItem}>
                                            {formValues.budgetWeekendMin || formValues.budgetWeekendMax ? 
                                                `${formValues.budgetWeekendMin?.toLocaleString() || ''}円 〜 ${formValues.budgetWeekendMax?.toLocaleString() || ''}円` 
                                                : '未設定'
                                            }
                                        </span>
                                    </div>
                                    {formValues.budgetNote && (
                                        <div className={styles.budgetConfirmNote}>
                                            <span className={styles.budgetNoteLabel}>補足:</span>
                                            <span className={styles.budgetNoteText}>{formValues.budgetNote}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>席数</p>
                            <p className={styles.confirmValue}>{formValues.capacity} 席</p>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>営業時間</p>
                            <div className={styles.confirmValue}>
                                <table className={styles.hourTable}>
                                    <thead>
                                    <tr>
                                        <th>曜日</th>
                                        <th>開始</th>
                                        <th>終了</th>
                                        <th>定休日</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {Object.entries(formValues.businessHours).map(([day, hour]) => (
                                        <tr key={day}>
                                            <td>{weekdayMap[day as WeekDay]}</td>
                                            <td>{hour.isClosed ? '—' : formatTime(hour.open)}</td>
                                            <td>{hour.isClosed ? '—' : formatTime(hour.close)}</td>
                                            <td>{hour.isClosed ? '◯' : ''}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className={styles.confirmRow}>
                            <p className={styles.confirmLabel}>登録画像</p>
                            <div className={styles.confirmValue}>
                                <div className={styles.imagePreviewGrid}>
                                    {formValues.images
                                        .filter((img) => img.file !== null)
                                        .map((img, index) => (
                                            <div key={index} className={styles.imagePreviewItem}>
                                                <img
                                                    src={URL.createObjectURL(img.file!)}
                                                    alt={`image-${index}`}
                                                    className={styles.imageThumb}
                                                />
                                                <p className={styles.imageFilename}>{img.file?.name}</p>
                                                {img.caption && (
                                                    <p className={styles.imageCaption}>キャプション：{img.caption}</p>
                                                )}
                                                {img.isIcon && (
                                                    <Chip color="primary" size="sm" variant="solid">
                                                        アイコン
                                                    </Chip>
                                                )}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {currentStep === 2 && (
                    <div className={styles.completionSection}>
                        <div className={styles.completionIcon}>
                            <div className={styles.checkmarkContainer}>
                                <svg className={styles.checkmark} viewBox="0 0 52 52">
                                    <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none"/>
                                    <path className={styles.checkmarkCheck} fill="none" d="m14,27 l8,8 16,-16"/>
                                </svg>
                            </div>
                        </div>
                        <div className={styles.completionContent}>
                            <h2 className={styles.completionTitle}>店舗登録が完了しました！</h2>
                            <p className={styles.completionMessage}>
                                ご登録いただき、ありがとうございます。<br/>
                                あなたの素敵なサードプレイスが、多くの人に発見されることを願っています。
                            </p>
                            <div className={styles.completionStats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>📍</span>
                                    <span className={styles.statLabel}>新しい場所が追加されました</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>🎉</span>
                                    <span className={styles.statLabel}>コミュニティの一員です</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
            <div className={styles.createNext}>
                {currentStep === 0 && (
                    <Tooltip
                        content={Object.keys(errors).length > 0 ? "必須項目を入力してください" : ""}
                        isOpen={Object.keys(errors).length > 0}
                        color="danger"
                    >
                        <div>
                            <ButtonGradient anotherStyle={''} onClick={handleNext}>
                                登録内容の確認へ
                            </ButtonGradient>
                        </div>
                    </Tooltip>
                )}

                {currentStep === 1 && (
                    <>
                        <ButtonGradientWrapper anotherStyle={''} onClick={handlePrev}>
                            入力内容を修正する
                        </ButtonGradientWrapper>
                        <ButtonGradient anotherStyle={''} onClick={() => setShowModal(true)}>
                            登録する
                        </ButtonGradient>

                        {showModal && (
                            <ShopCreateModal
                                isOpen={showModal}
                                onClose={() => setShowModal(false)}
                                formValues={formValues}
                                setCurrentStep={setCurrentStep}
                                onShopCreated={setCreatedShopId}
                            />
                        )}
                    </>
                )}

                {currentStep === 2 && (
                    <>
                        <ButtonGradientWrapper anotherStyle={''} onClick={handleBackShopList}>
                            店舗リストに戻る
                        </ButtonGradientWrapper>
                        {createdShopId && (
                            <ButtonGradient anotherStyle={''} onClick={handleGoToShopPage}>
                                登録した店舗ページへ
                            </ButtonGradient>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ShopCreate;
