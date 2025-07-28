'use client';

import React, { useState, useEffect } from 'react';
import CustomModal from '@/components/UI/Modal';
import { Button, Input, Textarea, CheckboxGroup, Checkbox } from '@nextui-org/react';
import { useShopModalStore } from '@/store/useShopModalStore';
import { Shop, ShopType, ShopLayout, ShopOption, PaymentMethod } from '@/types/shops';
import { useForm, Controller, Control, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchShopTypes } from '@/actions/shop/fetchShopTypes';
import { fetchShopLayouts } from '@/actions/shop/fetchShopLayouts';
import { fetchShopOptions } from '@/actions/shop/fetchShopOptions';
import { fetchPaymentMethods } from '@/actions/shop/fetchPaymentMethods';
import { updateShopBasicInfo } from '@/actions/shop/updateShopBasicInfo';
import { CheckCircle } from 'lucide-react';
import styles from './style.module.scss';

const editShopSchema = z.object({
  name: z.string().min(1, '店舗名は必須です'),
  phone_number: z.string().optional().nullable(),
  zip_code: z.string().optional().nullable(),
  address: z.string().min(1, '住所は必須です'),
  access: z.string().optional().nullable(),
  capacity: z.number().int().positive('席数は正の整数で入力してください').optional().nullable(),
  shop_types: z.array(z.number()).optional(),
  shop_layouts: z.array(z.number()).optional(),
  shop_options: z.array(z.number()).optional(),
  payment_methods: z.array(z.number()).optional(),
  business_hours: z.array(z.object({
    weekday: z.string(),
    open_time: z.string().nullable(),
    close_time: z.string().nullable(),
    is_closed: z.boolean(),
  })).optional(),
  budget_weekday_min: z.number().int().optional().nullable(),
  budget_weekday_max: z.number().int().optional().nullable(),
  budget_weekend_min: z.number().int().optional().nullable(),
  budget_weekend_max: z.number().int().optional().nullable(),
  budget_note: z.string().optional().nullable(),
});

type EditShopForm = z.infer<typeof editShopSchema>;

interface ShopEditModalProps {
  shop: Shop;
  onUpdate: () => void;
}

const ShopEditModal: React.FC<ShopEditModalProps> = ({ shop, onUpdate }) => {
  const { isEditModalOpen, closeEditModal } = useShopModalStore();
  const [step, setStep] = useState(1);
  const [apiError, setApiError] = useState<string | null>(null);

  const [shopTypeOptions, setShopTypeOptions] = useState<ShopType[]>([]);
  const [shopLayoutOptions, setShopLayoutOptions] = useState<ShopLayout[]>([]);
  const [shopOptionOptions, setShopOptionOptions] = useState<ShopOption[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<PaymentMethod[]>([]);

  const { control, handleSubmit, reset, getValues, formState: { errors, isSubmitting }, } = useForm<EditShopForm>({
    resolver: zodResolver(editShopSchema),
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        setShopTypeOptions(await fetchShopTypes());
        setShopLayoutOptions(await fetchShopLayouts());
        setShopOptionOptions(await fetchShopOptions());
        setPaymentMethodOptions(await fetchPaymentMethods());
      } catch (error) {
        console.error("Failed to load shop options:", error);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (shop) {
      reset({
        name: shop.name,
        phone_number: shop.phone_number || null,
        zip_code: shop.zip_code || null,
        address: shop.address,
        access: shop.access || null,
        capacity: shop.capacity,
        shop_types: shop.shop_types.map(t => t.id),
        shop_layouts: shop.shop_layouts.map(l => l.id),
        shop_options: shop.shop_options.map(o => o.id),
        payment_methods: shop.payment_methods.map(p => p.id),
        business_hours: shop.business_hours,
        budget_weekday_min: shop.budget_weekday_min,
        budget_weekday_max: shop.budget_weekday_max,
        budget_weekend_min: shop.budget_weekend_min,
        budget_weekend_max: shop.budget_weekend_max,
        budget_note: shop.budget_note || null,
      });
    }
  }, [shop, reset]);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const processSubmit = async (data: EditShopForm) => {
    setApiError(null);
    try {
      await updateShopBasicInfo(shop.id.toString(), data);
      onUpdate();
      handleNext();
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '更新に失敗しました');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return <ShopEditForm control={control} errors={errors} options={{ shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions }} />;
      case 2:
        return <ShopEditConfirm values={getValues()} originalShop={shop} allOptions={{ shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions }} />;
      case 3:
        return <ShopEditComplete />;
      default:
        return null;
    }
  };

  const renderFooter = () => (
    <div className={styles.footerContainer}>
      <div>
        {step === 2 && (
          <Button variant="ghost" onClick={handleBack}>修正する</Button>
        )}
      </div>
      <div>
        {step === 1 && (
          <Button color="primary" type="submit" isLoading={isSubmitting}>確認画面へ</Button>
        )}
        {step === 2 && (
          <Button color="primary" onClick={handleSubmit(processSubmit)} isLoading={isSubmitting}>この内容で更新する</Button>
        )}
        {step === 3 && (
          <Button color="primary" onClick={closeEditModal}>閉じる</Button>
        )}
      </div>
    </div>
  );

  return (
    <CustomModal
      isOpen={isEditModalOpen}
      onClose={closeEditModal}
      title="店舗基本情報の編集"
      size="4xl"
      footer={renderFooter()}
    >
      {renderStepContent()}
      {apiError && <p className={styles.apiError}>{apiError}</p>}
    </CustomModal>
  );
};

// Step 1: 入力フォーム
interface ShopEditFormProps {
  control: Control<EditShopForm>;
  errors: FieldErrors<EditShopForm>;
  options: {
    shopTypeOptions: ShopType[];
    shopLayoutOptions: ShopLayout[];
    shopOptionOptions: ShopOption[];
    paymentMethodOptions: PaymentMethod[];
  };
}

const ShopEditForm: React.FC<ShopEditFormProps> = ({ control, errors, options }) => {
  const { shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions } = options;

  return (
    <div className={styles.formSection}>
      <h3 className={styles.formTitle}>基本情報入力</h3>

      {/* 店舗名 */}
      <Controller
        name="name"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="店舗名"
            placeholder="店舗名を入力してください"
            variant="bordered"
            isInvalid={!!errors.name}
            errorMessage={errors.name?.message}
            className={styles.inputField}
            value={field.value || ''}
          />
        )}
      />

      {/* 住所 */}
      <Controller
        name="address"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="住所"
            placeholder="都道府県、市区町村、番地まで入力してください"
            variant="bordered"
            isInvalid={!!errors.address}
            errorMessage={errors.address?.message}
            className={styles.inputField}
            value={field.value || ''}
          />
        )}
      />

      {/* 電話番号 */}
      <Controller
        name="phone_number"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="電話番号"
            placeholder="000-0000-0000"
            variant="bordered"
            isInvalid={!!errors.phone_number}
            errorMessage={errors.phone_number?.message}
            className={styles.inputField}
            value={field.value || ''}
          />
        )}
      />

      {/* 郵便番号 */}
      <Controller
        name="zip_code"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="郵便番号"
            placeholder="例: 810-0000"
            variant="bordered"
            isInvalid={!!errors.zip_code}
            errorMessage={errors.zip_code?.message}
            className={styles.inputField}
            value={field.value || ''}
          />
        )}
      />

      {/* アクセス */}
      <Controller
        name="access"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            label="アクセス"
            placeholder="最寄りの駅からのアクセスなどを入力してください"
            variant="bordered"
            isInvalid={!!errors.access}
            errorMessage={errors.access?.message}
            className={styles.textareaField}
            value={field.value || ''}
          />
        )}
      />

      {/* 席数 */}
      <Controller
        name="capacity"
        control={control}
        render={({ field }) => (
          <Input
            {...field}
            label="席数"
            placeholder="例: 20"
            type="number"
            variant="bordered"
            isInvalid={!!errors.capacity}
            errorMessage={errors.capacity?.message}
            className={styles.inputField}
            value={field.value?.toString() || ''}
            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
          />
        )}
      />

      {/* 店舗タイプ */}
      <Controller
        name="shop_types"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="店舗タイプ"
            orientation="horizontal"
            value={field.value?.map(String) || []}
            onValueChange={(values: string[]) => field.onChange(values.map(Number))}
            className={styles.checkboxGroup}
          >
            {shopTypeOptions.map((type) => (
              <Checkbox key={type.id} value={type.id.toString()}>{type.name}</Checkbox>
            ))}
          </CheckboxGroup>
        )}
      />

      {/* レイアウト */}
      <Controller
        name="shop_layouts"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="レイアウト"
            orientation="horizontal"
            value={field.value?.map(String) || []}
            onValueChange={(values: string[]) => field.onChange(values.map(Number))}
            className={styles.checkboxGroup}
          >
            {shopLayoutOptions.map((layout) => (
              <Checkbox key={layout.id} value={layout.id.toString()}>{layout.name}</Checkbox>
            ))}
          </CheckboxGroup>
        )}
      />

      {/* オプション */}
      <Controller
        name="shop_options"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="オプション"
            orientation="horizontal"
            value={field.value?.map(String) || []}
            onValueChange={(values: string[]) => field.onChange(values.map(Number))}
            className={styles.checkboxGroup}
          >
            {shopOptionOptions.map((option) => (
              <Checkbox key={option.id} value={option.id.toString()}>{option.name}</Checkbox>
            ))}
          </CheckboxGroup>
        )}
      />

      {/* 支払い方法 */}
      <Controller
        name="payment_methods"
        control={control}
        render={({ field }) => (
          <CheckboxGroup
            label="支払い方法"
            orientation="horizontal"
            value={field.value?.map(String) || []}
            onValueChange={(values: string[]) => field.onChange(values.map(Number))}
            className={styles.checkboxGroup}
          >
            {paymentMethodOptions.map((method) => (
              <Checkbox key={method.id} value={method.id.toString()}>{method.name}</Checkbox>
            ))}
          </CheckboxGroup>
        )}
      />

      {/* 営業時間 - ここはShopBusinessHourTableのようなカスタムコンポーネントを想定 */}
      {/* 現状は簡易的な表示。後でShopBusinessHourTableを参考に実装 */}
      <div className={styles.businessHoursSection}>
        <h4 className={styles.businessHoursTitle}>営業時間</h4>
        <p className={styles.businessHoursNote}>営業時間の編集機能は現在開発中です。</p>
      </div>

      {/* 予算目安 */}
      <div className={styles.budgetGrid}>
        <Controller
          name="budget_weekday_min"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="平日予算 (最小)"
              placeholder="例: 3000"
              type="number"
              variant="bordered"
              isInvalid={!!errors.budget_weekday_min}
              errorMessage={errors.budget_weekday_min?.message}
              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
              value={field.value?.toString() || ''}
            />
          )}
        />
        <Controller
          name="budget_weekday_max"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="平日予算 (最大)"
              placeholder="例: 5000"
              type="number"
              variant="bordered"
              isInvalid={!!errors.budget_weekday_max}
              errorMessage={errors.budget_weekday_max?.message}
              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
              value={field.value?.toString() || ''}
            />
          )}
        />
        <Controller
          name="budget_weekend_min"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="週末予算 (最小)"
              placeholder="例: 4000"
              type="number"
              variant="bordered"
              isInvalid={!!errors.budget_weekend_min}
              errorMessage={errors.budget_weekend_min?.message}
              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
              value={field.value?.toString() || ''}
            />
          )}
        />
        <Controller
          name="budget_weekend_max"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              label="週末予算 (最大)"
              placeholder="例: 6000"
              type="number"
              variant="bordered"
              isInvalid={!!errors.budget_weekend_max}
              errorMessage={errors.budget_weekend_max?.message}
              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
              value={field.value?.toString() || ''}
            />
          )}
        />
      </div>
      <Controller
        name="budget_note"
        control={control}
        render={({ field }) => (
          <Textarea
            {...field}
            label="予算に関する補足"
            placeholder="例: お一人様あたりの目安料金（お酒3-4杯程度）"
            variant="bordered"
            isInvalid={!!errors.budget_note}
            errorMessage={errors.budget_note?.message}
            className={styles.textareaField}
            value={field.value || ''}
          />
        )}
      />
    </div>
  );
};

// Step 2: 確認画面
interface ShopEditConfirmProps {
  values: EditShopForm;
  originalShop: Shop;
  allOptions: {
    shopTypeOptions: ShopType[];
    shopLayoutOptions: ShopLayout[];
    shopOptionOptions: ShopOption[];
    paymentMethodOptions: PaymentMethod[];
  };
}

const ShopEditConfirm: React.FC<ShopEditConfirmProps> = ({ values, originalShop, allOptions }) => {
  const { shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions } = allOptions;

  const renderField = (label: string, key: keyof EditShopForm) => {
    const originalValue = originalShop[key] !== undefined && originalShop[key] !== null ? String(originalShop[key]) : '未設定';
    const newValue = values[key] !== undefined && values[key] !== null ? String(values[key]) : '未設定';
    const isChanged = originalValue !== newValue;

    return (
      <div className={styles.confirmField}>
        <span className={styles.confirmLabel}>{label}</span>
        <div className={styles.confirmValueContainer}>
          {isChanged && <span className={styles.originalValue}>{originalValue}</span>}
          <span className={isChanged ? styles.newValueChanged : styles.newValue}>{newValue}</span>
        </div>
      </div>
    );
  };

  const renderMultiSelectField = (label: string, originalItems: { id: number; name: string; }[], newIds: number[] | undefined, allOptionsList: { id: number; name: string; }[]) => {
    const originalNames = originalItems.map(item => item.name).sort().join('、');
    const newNames = (newIds || []).map(id => allOptionsList.find(opt => opt.id === id)?.name || '').sort().join('、');
    const isChanged = originalNames !== newNames;

    return (
      <div className={styles.confirmField}>
        <span className={styles.confirmLabel}>{label}</span>
        <div className={styles.confirmValueContainer}>
          {isChanged && <span className={styles.originalValue}>{originalNames || '未設定'}</span>}
          <span className={isChanged ? styles.newValueChanged : styles.newValue}>{newNames || '未設定'}</span>
        </div>
      </div>
    );
  };

  const formatBudget = (min: number | null | undefined, max: number | null | undefined) => {
    if (min === null || min === undefined || max === null || max === undefined) return '未設定';
    return `¥${min.toLocaleString()} - ¥${max.toLocaleString()}`;
  };

  const isBudgetChanged = (
    originalShop.budget_weekday_min !== values.budget_weekday_min ||
    originalShop.budget_weekday_max !== values.budget_weekday_max ||
    originalShop.budget_weekend_min !== values.budget_weekend_min ||
    originalShop.budget_weekend_max !== values.budget_weekend_max
  );

  return (
    <div className={styles.confirmSection}>
      <h3 className={styles.confirmTitle}>入力内容の確認</h3>
      <p className={styles.confirmNote}>変更点をご確認ください。変更がある項目は青色で表示されます。</p>

      {renderField("店舗名", "name")}
      {renderField("住所", "address")}
      {renderField("電話番号", "phone_number")}
      {renderField("郵便番号", "zip_code")}
      {renderField("アクセス", "access")}
      {renderField("席数", "capacity")}
      
      {renderMultiSelectField("店舗タイプ", originalShop.shop_types, values.shop_types, shopTypeOptions)}
      {renderMultiSelectField("レイアウト", originalShop.shop_layouts, values.shop_layouts, shopLayoutOptions)}
      {renderMultiSelectField("オプション", originalShop.shop_options, values.shop_options, shopOptionOptions)}
      {renderMultiSelectField("支払い方法", originalShop.payment_methods, values.payment_methods, paymentMethodOptions)}

      {/* 営業時間は現在簡易表示のため、確認画面も簡易的に */}
      <div className={styles.confirmField}>
        <span className={styles.confirmLabel}>営業時間</span>
        <span className={styles.newValue}>変更なし (現在開発中)</span>
      </div>

      <div className={styles.confirmField}>
        <span className={styles.confirmLabel}>予算目安 (平日)</span>
        <div className={styles.confirmValueContainer}>
          {isBudgetChanged && <span className={styles.originalValue}>{formatBudget(originalShop.budget_weekday_min, originalShop.budget_weekday_max)}</span>}
          <span className={isBudgetChanged ? styles.newValueChanged : styles.newValue}>{formatBudget(values.budget_weekday_min, values.budget_weekday_max)}</span>
        </div>
      </div>
      <div className={styles.confirmField}>
        <span className={styles.confirmLabel}>予算目安 (週末)</span>
        <div className={styles.confirmValueContainer}>
          {isBudgetChanged && <span className={styles.originalValue}>{formatBudget(originalShop.budget_weekend_min, originalShop.budget_weekend_max)}</span>}
          <span className={isBudgetChanged ? styles.newValueChanged : styles.newValue}>{formatBudget(values.budget_weekend_min, values.budget_weekend_max)}</span>
        </div>
      </div>
      {renderField("予算に関する補足", "budget_note")}

    </div>
  );
};

// Step 3: 完了画面
const ShopEditComplete: React.FC = () => {
  return (
    <div className={styles.completeSection}>
      <CheckCircle size={64} className={styles.completeIcon} />
      <h3 className={styles.completeTitle}>更新が完了しました！</h3>
      <p className={styles.completeMessage}>ご協力ありがとうございます。店舗情報が更新されました。</p>
    </div>
  );
};

export default ShopEditModal;