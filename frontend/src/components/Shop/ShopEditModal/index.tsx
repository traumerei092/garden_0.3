'use client';

import React, { useState, useEffect } from 'react';
import CustomModal from '@/components/UI/Modal';
import { Button, Input, Textarea } from '@nextui-org/react';
import { useShopModalStore } from '@/store/useShopModalStore';
import { Shop, ShopType, ShopLayout, ShopOption, PaymentMethod, BusinessHourForm, WeekDay } from '@/types/shops';
import { useForm, Controller, Control, FieldErrors } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { fetchShopTypes } from '@/actions/shop/fetchShopTypes';
import { fetchShopLayouts } from '@/actions/shop/fetchShopLayouts';
import { fetchShopOptions } from '@/actions/shop/fetchShopOptions';
import { fetchPaymentMethods } from '@/actions/shop/fetchPaymentMethods';
import { updateShopBasicInfo } from '@/actions/shop/updateShopBasicInfo';
import { CheckCircle, MapPin, Phone, Clock, Users, CreditCard, Store, LayoutDashboard, Settings, Sparkles } from 'lucide-react';
import RowSteps from '@/components/UI/RowSteps';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import ShopBusinessHourTable from '@/components/Shop/ShopBusinessHourTable';
import ModalButtons from '@/components/UI/ModalButtons';
import { Time } from '@internationalized/date';
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
  business_hours: z.record(z.object({
    open: z.any().nullable(),
    close: z.any().nullable(),
    isClosed: z.boolean(),
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
  const [step, setStep] = useState(0);
  const [apiError, setApiError] = useState<string | null>(null);

  const [shopTypeOptions, setShopTypeOptions] = useState<ShopType[]>([]);
  const [shopLayoutOptions, setShopLayoutOptions] = useState<ShopLayout[]>([]);
  const [shopOptionOptions, setShopOptionOptions] = useState<ShopOption[]>([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState<PaymentMethod[]>([]);
  const [businessHours, setBusinessHours] = useState<Record<WeekDay, BusinessHourForm>>({
    mon: { open: null, close: null, isClosed: false },
    tue: { open: null, close: null, isClosed: false },
    wed: { open: null, close: null, isClosed: false },
    thu: { open: null, close: null, isClosed: false },
    fri: { open: null, close: null, isClosed: false },
    sat: { open: null, close: null, isClosed: false },
    sun: { open: null, close: null, isClosed: false },
    hol: { open: null, close: null, isClosed: false },
  });

  const steps = [
    { title: '更新' },
    { title: '確認' },
    { title: '完了' }
  ];

  const { control, handleSubmit, reset, getValues, formState: { errors, isSubmitting }, } = useForm<EditShopForm>({
    resolver: zodResolver(editShopSchema),
  });

  useEffect(() => {
    const loadOptions = async () => {
      try {
        // 全てのオプションをAPIから取得（選択肢として全ての選択肢が必要）
        const [shopTypes, shopLayouts, shopOptions, paymentMethods] = await Promise.all([
          fetchShopTypes(),
          fetchShopLayouts(), 
          fetchShopOptions(),
          fetchPaymentMethods()
        ]);
        
        setShopTypeOptions(shopTypes);
        setShopLayoutOptions(shopLayouts);
        setShopOptionOptions(shopOptions);
        setPaymentMethodOptions(paymentMethods);
      } catch (error) {
        console.error("Failed to load shop options:", error);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (shop && shopTypeOptions.length > 0 && shopLayoutOptions.length > 0 && shopOptionOptions.length > 0 && paymentMethodOptions.length > 0) {
      console.log('=== ShopEditModal useEffect Debug ===');
      console.log('shop.shop_types:', shop.shop_types);
      console.log('shop.shop_layouts:', shop.shop_layouts);
      console.log('shop.shop_options:', shop.shop_options);
      console.log('shop.payment_methods:', shop.payment_methods);
      console.log('shop.zip_code:', shop.zip_code);
      console.log('shop.business_hours:', shop.business_hours);

      // 営業時間データの変換
      const convertedBusinessHours: Record<WeekDay, BusinessHourForm> = {
        mon: { open: null, close: null, isClosed: false },
        tue: { open: null, close: null, isClosed: false },
        wed: { open: null, close: null, isClosed: false },
        thu: { open: null, close: null, isClosed: false },
        fri: { open: null, close: null, isClosed: false },
        sat: { open: null, close: null, isClosed: false },
        sun: { open: null, close: null, isClosed: false },
        hol: { open: null, close: null, isClosed: false },
      };

      if (shop.business_hours && Array.isArray(shop.business_hours)) {
        shop.business_hours.forEach((hour: any) => {
          const weekday = hour.weekday as WeekDay;
          if (weekday in convertedBusinessHours) {
            convertedBusinessHours[weekday] = {
              open: hour.open_time ? new Time(
                parseInt(hour.open_time.split(':')[0]),
                parseInt(hour.open_time.split(':')[1])
              ) : null,
              close: hour.close_time ? new Time(
                parseInt(hour.close_time.split(':')[0]),
                parseInt(hour.close_time.split(':')[1])
              ) : null,
              isClosed: hour.is_closed || false,
            };
          }
        });
      }

      setBusinessHours(convertedBusinessHours);

      // APIから返されるデータ構造に応じてIDを取得
      const getIdsFromData = (data: any, options: {id: number, name: string}[]) => {
        if (!data || !Array.isArray(data)) return [];
        
        // 空配列の場合
        if (data.length === 0) return [];
        
        // 既にIDの配列の場合
        if (typeof data[0] === 'number') {
          return data;
        }
        
        // オブジェクトの配列の場合（{id: number, name: string}[]）
        if (typeof data[0] === 'object' && data[0].id !== undefined) {
          return data.map((item: any) => item.id);
        }
        
        // 文字列配列の場合（shop_types, shop_layouts, shop_optionsなど）
        if (typeof data[0] === 'string') {
          return data.map((name: string) => {
            const option = options.find(opt => opt.name === name);
            return option ? option.id : null;
          }).filter((id: number | null) => id !== null);
        }
        
        return [];
      };

      const shopTypeIds = getIdsFromData(shop.shop_types, shopTypeOptions);
      const shopLayoutIds = getIdsFromData(shop.shop_layouts, shopLayoutOptions);
      const shopOptionIds = getIdsFromData(shop.shop_options, shopOptionOptions);
      const paymentMethodIds = getIdsFromData(shop.payment_methods, paymentMethodOptions);

      console.log('shopTypeIds:', shopTypeIds);
      console.log('shopLayoutIds:', shopLayoutIds);
      console.log('shopOptionIds:', shopOptionIds);
      console.log('paymentMethodIds:', paymentMethodIds);

      const formData = {
        name: shop.name || '',
        phone_number: shop.phone_number || '',
        zip_code: shop.zip_code || '',
        address: shop.address || '',
        access: shop.access || '',
        capacity: shop.capacity || null,
        shop_types: shopTypeIds,
        shop_layouts: shopLayoutIds,
        shop_options: shopOptionIds,
        payment_methods: paymentMethodIds,
        business_hours: convertedBusinessHours,
        budget_weekday_min: shop.budget_weekday_min || null,
        budget_weekday_max: shop.budget_weekday_max || null,
        budget_weekend_min: shop.budget_weekend_min || null,
        budget_weekend_max: shop.budget_weekend_max || null,
        budget_note: shop.budget_note || '',
      };

      console.log('Form data to reset:', formData);
      reset(formData);
    }
  }, [shop, reset, shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions]);

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const processSubmit = async (data: EditShopForm) => {
    setApiError(null);
    try {
      // 営業時間データの変換
      const businessHoursArray = Object.entries(businessHours).map(([weekday, hours]) => ({
        weekday,
        open_time: hours.open ? `${hours.open.hour.toString().padStart(2, '0')}:${hours.open.minute.toString().padStart(2, '0')}` : null,
        close_time: hours.close ? `${hours.close.hour.toString().padStart(2, '0')}:${hours.close.minute.toString().padStart(2, '0')}` : null,
        is_closed: hours.isClosed,
      }));

      const submitData = {
        ...data,
        business_hours: businessHoursArray,
      };

      await updateShopBasicInfo(shop.id.toString(), submitData);
      handleNext(); // 完了画面に移動
      onUpdate(); // データ更新を通知
    } catch (error) {
      setApiError(error instanceof Error ? error.message : '更新に失敗しました');
    }
  };

  const handleClose = () => {
    setStep(0);
    setApiError(null);
    closeEditModal();
  };

  const handleBusinessHourChange = <K extends keyof BusinessHourForm>(
    day: WeekDay,
    field: K,
    value: BusinessHourForm[K]
  ) => {
    setBusinessHours(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return <ShopEditForm control={control} errors={errors} options={{ shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions }} businessHours={businessHours} onBusinessHourChange={handleBusinessHourChange} />;
      case 1:
        return <ShopEditConfirm values={getValues()} originalShop={shop} allOptions={{ shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions }} businessHours={businessHours} />;
      case 2:
        return <ShopEditComplete />;
      default:
        return null;
    }
  };

  const renderFooter = () => (
    <div className={styles.footerContainer}>
      <div className={styles.footerLeft}>
      </div>
      <div className={styles.footerRight}>
        {step === 0 && (
          <ModalButtons
            onCancel={handleClose}
            onSave={handleSubmit(handleNext)}
            saveText="確認画面へ"
            cancelText="キャンセル"
            isLoading={isSubmitting}
          />
        )}
        {step === 1 && (
          <ModalButtons
            onCancel={handleBack}
            onSave={handleSubmit(processSubmit)}
            saveText="この内容で更新する"
            cancelText="修正する"
            isLoading={isSubmitting}
          />
        )}
        {step === 2 && (
          <Button 
            color="primary" 
            onClick={handleClose}
            className={styles.primaryButton}
          >
            閉じる
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <CustomModal
      isOpen={isEditModalOpen}
      onClose={handleClose}
      title="店舗基本情報の編集"
      size="4xl"
      footer={renderFooter()}
    >
      <div className={styles.modalContent}>
        <div className={styles.stepsWrapper}>
          <RowSteps steps={steps} currentStep={step} />
        </div>
        
        <div className={styles.contentWrapper}>
          {renderStepContent()}
          {apiError && (
            <div className={styles.errorMessage}>
              <span className={styles.errorIcon}>⚠️</span>
              {apiError}
            </div>
          )}
        </div>
      </div>
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
  businessHours: Record<WeekDay, BusinessHourForm>;
  onBusinessHourChange: <K extends keyof BusinessHourForm>(
    day: WeekDay,
    field: K,
    value: BusinessHourForm[K]
  ) => void;
}

const ShopEditForm: React.FC<ShopEditFormProps> = ({ control, errors, options, businessHours, onBusinessHourChange }) => {
  const { shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions } = options;

  return (
    <div className={styles.formSection}>
      <div className={styles.formHeader}>
        <Sparkles className={styles.headerIcon} size={24} />
        <h3 className={styles.formTitle}>基本情報を更新</h3>
        <p className={styles.formSubtitle}>店舗の最新情報を入力してください</p>
      </div>

      <div className={styles.formGrid}>
        {/* 基本情報セクション */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <Store className={styles.cardIcon} size={20} />
            <h4 className={styles.cardTitle}>基本情報</h4>
          </div>
          
          <div className={styles.inputGroup}>
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
          </div>
        </div>

        {/* 店舗タイプセクション */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <Store className={styles.cardIcon} size={20} />
            <h4 className={styles.cardTitle}>店舗タイプ</h4>
          </div>
          
          <Controller
            name="shop_types"
            control={control}
            render={({ field }) => (
              <CustomCheckboxGroup
                name="shop_types"
                values={field.value?.map(String) || []}
                onChange={(values: string[]) => field.onChange(values.map(Number))}
                options={shopTypeOptions.map(type => ({ label: type.name, value: type.id.toString() }))}
              />
            )}
          />
        </div>

        {/* レイアウトセクション */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <LayoutDashboard className={styles.cardIcon} size={20} />
            <h4 className={styles.cardTitle}>レイアウト</h4>
          </div>
          
          <Controller
            name="shop_layouts"
            control={control}
            render={({ field }) => (
              <CustomCheckboxGroup
                name="shop_layouts"
                values={field.value?.map(String) || []}
                onChange={(values: string[]) => field.onChange(values.map(Number))}
                options={shopLayoutOptions.map(layout => ({ label: layout.name, value: layout.id.toString() }))}
              />
            )}
          />
        </div>

        {/* オプションセクション */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <Settings className={styles.cardIcon} size={20} />
            <h4 className={styles.cardTitle}>オプション</h4>
          </div>
          
          <Controller
            name="shop_options"
            control={control}
            render={({ field }) => (
              <CustomCheckboxGroup
                name="shop_options"
                values={field.value?.map(String) || []}
                onChange={(values: string[]) => field.onChange(values.map(Number))}
                options={shopOptionOptions.map(option => ({ label: option.name, value: option.id.toString() }))}
              />
            )}
          />
        </div>

        {/* 支払い方法セクション */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <CreditCard className={styles.cardIcon} size={20} />
            <h4 className={styles.cardTitle}>支払い方法</h4>
          </div>
          
          <Controller
            name="payment_methods"
            control={control}
            render={({ field }) => (
              <CustomCheckboxGroup
                name="payment_methods"
                values={field.value?.map(String) || []}
                onChange={(values: string[]) => field.onChange(values.map(Number))}
                options={paymentMethodOptions.map(method => ({ label: method.name, value: method.id.toString() }))}
              />
            )}
          />
        </div>

        {/* 予算目安セクション */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <CreditCard className={styles.cardIcon} size={20} />
            <h4 className={styles.cardTitle}>予算目安</h4>
          </div>
          
          <div className={styles.budgetGrid}>
            <Controller
              name="budget_weekday_min"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="平日最低価格"
                  placeholder="例: 2000"
                  type="number"
                  variant="bordered"
                  isInvalid={!!errors.budget_weekday_min}
                  errorMessage={errors.budget_weekday_min?.message}
                  className={styles.inputField}
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                />
              )}
            />

            <Controller
              name="budget_weekday_max"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="平日最高価格"
                  placeholder="例: 4000"
                  type="number"
                  variant="bordered"
                  isInvalid={!!errors.budget_weekday_max}
                  errorMessage={errors.budget_weekday_max?.message}
                  className={styles.inputField}
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                />
              )}
            />

            <Controller
              name="budget_weekend_min"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="休日最低価格"
                  placeholder="例: 2500"
                  type="number"
                  variant="bordered"
                  isInvalid={!!errors.budget_weekend_min}
                  errorMessage={errors.budget_weekend_min?.message}
                  className={styles.inputField}
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                />
              )}
            />

            <Controller
              name="budget_weekend_max"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="休日最高価格"
                  placeholder="例: 5000"
                  type="number"
                  variant="bordered"
                  isInvalid={!!errors.budget_weekend_max}
                  errorMessage={errors.budget_weekend_max?.message}
                  className={styles.inputField}
                  value={field.value?.toString() || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
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
                label="予算に関する備考"
                placeholder="料金に関する詳細情報があれば入力してください"
                variant="bordered"
                isInvalid={!!errors.budget_note}
                errorMessage={errors.budget_note?.message}
                className={styles.textareaField}
                value={field.value || ''}
              />
            )}
          />
        </div>

        {/* 営業時間セクション */}
        <div className={styles.formCard}>
          <div className={styles.cardHeader}>
            <Clock className={styles.cardIcon} size={20} />
            <h4 className={styles.cardTitle}>営業時間</h4>
          </div>
          <ShopBusinessHourTable
            value={businessHours}
            onChange={onBusinessHourChange}
          />
        </div>
      </div>
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
  businessHours: Record<WeekDay, BusinessHourForm>;
}

const ShopEditConfirm: React.FC<ShopEditConfirmProps> = ({ values, originalShop, allOptions, businessHours }) => {
  const { shopTypeOptions, shopLayoutOptions, shopOptionOptions, paymentMethodOptions } = allOptions;

  const renderField = (label: string, originalValue: any, newValue: any) => {
    const originalStr = originalValue !== undefined && originalValue !== null ? String(originalValue) : '未設定';
    const newStr = newValue !== undefined && newValue !== null ? String(newValue) : '未設定';
    const isChanged = originalStr !== newStr;

    return (
      <div className={styles.confirmField}>
        <span className={styles.confirmLabel}>{label}</span>
        <div className={styles.confirmValueContainer}>
          {isChanged && <span className={styles.originalValue}>{originalStr}</span>}
          <span className={isChanged ? styles.newValueChanged : styles.newValue}>{newStr}</span>
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

  const formatTime = (time: Time | null) => {
    if (!time) return '';
    const hour = time.hour.toString().padStart(2, '0');
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

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

  return (
    <div className={styles.confirmSection}>
      <div className={styles.confirmHeader}>
        <CheckCircle className={styles.confirmIcon} size={24} />
        <h3 className={styles.confirmTitle}>入力内容の確認</h3>
        <p className={styles.confirmNote}>変更点をご確認ください。変更がある項目は青色で表示されます。</p>
      </div>

      <div className={styles.confirmGrid}>
        {renderField("店舗名", originalShop.name, values.name)}
        {renderField("郵便番号", originalShop.zip_code, values.zip_code)}
        {renderField("住所", originalShop.address, values.address)}
        {renderField("電話番号", originalShop.phone_number, values.phone_number)}
        {renderField("アクセス", originalShop.access, values.access)}
        {renderField("席数", originalShop.capacity, values.capacity)}
        
        {renderMultiSelectField("店舗タイプ", originalShop.shop_types || [], values.shop_types, shopTypeOptions)}
        {renderMultiSelectField("レイアウト", originalShop.shop_layouts || [], values.shop_layouts, shopLayoutOptions)}
        {renderMultiSelectField("オプション", originalShop.shop_options || [], values.shop_options, shopOptionOptions)}
        {renderMultiSelectField("支払い方法", originalShop.payment_methods || [], values.payment_methods, paymentMethodOptions)}

        {/* 予算目安セクション */}
        {renderField("平日最低価格", originalShop.budget_weekday_min ? `¥${originalShop.budget_weekday_min}` : null, values.budget_weekday_min ? `¥${values.budget_weekday_min}` : null)}
        {renderField("平日最高価格", originalShop.budget_weekday_max ? `¥${originalShop.budget_weekday_max}` : null, values.budget_weekday_max ? `¥${values.budget_weekday_max}` : null)}
        {renderField("休日最低価格", originalShop.budget_weekend_min ? `¥${originalShop.budget_weekend_min}` : null, values.budget_weekend_min ? `¥${values.budget_weekend_min}` : null)}
        {renderField("休日最高価格", originalShop.budget_weekend_max ? `¥${originalShop.budget_weekend_max}` : null, values.budget_weekend_max ? `¥${values.budget_weekend_max}` : null)}
        {renderField("予算に関する備考", originalShop.budget_note, values.budget_note)}

        <div className={styles.confirmField}>
          <span className={styles.confirmLabel}>営業時間</span>
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
                {Object.entries(businessHours).map(([day, hour]) => (
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
      </div>
    </div>
  );
};

// Step 3: 完了画面
const ShopEditComplete: React.FC = () => {
  return (
    <div className={styles.completeSection}>
      <div className={styles.completeHeader}>
        <CheckCircle className={styles.completeIcon} size={48} />
        <h3 className={styles.completeTitle}>更新が完了しました</h3>
        <p className={styles.completeMessage}>
          店舗基本情報の更新が正常に完了しました。<br />
          変更内容は即座に反映されます。
        </p>
      </div>
    </div>
  );
};

export default ShopEditModal;
