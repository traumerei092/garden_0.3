'use client'

import React, { useState, useEffect } from 'react';
import { Input, Select, SelectItem, DatePicker, Switch } from '@nextui-org/react';
import { CalendarDate } from '@internationalized/date';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import { updateBasicInfo } from '@/actions/profile/updateBasicInfo';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import { User } from '@/types/users';
import styles from './style.module.scss';

interface BasicInfoEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const BasicInfoEditModal: React.FC<BasicInfoEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    name: '',
    gender: '',
    birthdate: '',
    my_area: '',
    introduction: '',
    is_profile_public: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        gender: user.gender || '',
        birthdate: user.birthdate || '',
        my_area: user.my_area || '',
        introduction: user.introduction || '',
        is_profile_public: user.is_profile_public ?? true
      });
      setErrors({});
    }
  }, [user, isOpen]);

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleDateChange = (date: any) => {
    if (date) {
      const dateString = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
      handleInputChange('birthdate', dateString);
    } else {
      handleInputChange('birthdate', '');
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'ユーザー名は必須です';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const updateData = {
        name: formData.name,
        gender: formData.gender,
        birthdate: formData.birthdate,
        my_area: formData.my_area,
        introduction: formData.introduction,
        is_profile_public: formData.is_profile_public
      };

      const result = await updateBasicInfo(updateData);
      
      if (result.success && result.data) {
        onUpdate(result.data);
        showProfileUpdateToast();
        onClose();
      } else {
        showErrorToast(result.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const parseBirthdate = (dateString?: string): CalendarDate | null => {
    if (!dateString) return null;
    const [year, month, day] = dateString.split('-').map(Number);
    if (year && month && day) {
      return new CalendarDate(year, month, day);
    }
    return null;
  };

  const genderOptions = [
    { key: 'male', label: '男性' },
    { key: 'female', label: '女性' },
    { key: 'other', label: 'その他' }
  ];

  const footer = (
    <ModalButtons
      onCancel={handleCancel}
      onSave={handleSave}
      isLoading={isLoading}
    />
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="基本情報を編集"
      footer={footer}
      size="2xl"
    >
      <p className={styles.description}>
        あなたの基本情報を編集してください。
      </p>
      
      <div className={styles.formGrid}>
        <div className={styles.formField}>
          <Input
            label="ユーザー名"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            variant="bordered"
            radius="sm"
            isRequired
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            classNames={{
              base: styles.inputBase,
              label: styles.inputLabel,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
          />
        </div>

        <div className={styles.formField}>
          <Select
            label="性別"
            selectedKeys={formData.gender ? [formData.gender] : []}
            onSelectionChange={(keys) => {
              const selectedKey = Array.from(keys)[0];
              handleInputChange('gender', selectedKey ? String(selectedKey) : '');
            }}
            variant="bordered"
            radius="sm"
            placeholder="選択してください"
            classNames={{
              base: styles.inputBase,
              label: styles.inputLabel,
              trigger: styles.selectTrigger,
              value: styles.selectValue,
              popoverContent: styles.selectPopover
            }}
          >
            {genderOptions.map((option) => (
              <SelectItem key={option.key} value={option.key} className={styles.selectItem}>
                {option.label}
              </SelectItem>
            ))}
          </Select>
        </div>

        <div className={styles.formField}>
          <DatePicker
            label="生年月日"
            value={parseBirthdate(formData.birthdate) as any}
            onChange={handleDateChange}
            variant="bordered"
            radius="sm"
            showMonthAndYearPickers
            classNames={{
              base: styles.inputBase,
              label: styles.inputLabel,
              inputWrapper: styles.datePickerWrapper,
              popoverContent: styles.datePickerPopover
            }}
          />
        </div>

        <div className={styles.formField}>
          <Input
            label="マイエリア"
            value={formData.my_area}
            onChange={(e) => handleInputChange('my_area', e.target.value)}
            variant="bordered"
            radius="sm"
            placeholder="マイエリアを入力"
            classNames={{
              base: styles.inputBase,
              label: styles.inputLabel,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
          />
        </div>
      </div>

      <div className={styles.formField}>
        <Input
          label="自己紹介"
          value={formData.introduction}
          onChange={(e) => handleInputChange('introduction', e.target.value)}
          variant="bordered"
          radius="sm"
          placeholder="自己紹介を入力"
          classNames={{
            base: styles.inputBase,
            label: styles.inputLabel,
            inputWrapper: styles.inputWrapper,
            input: styles.input
          }}
        />
      </div>

      <div className={styles.visibilitySection}>
        <div className={styles.visibilityField}>
          <label className={styles.visibilityLabel}>プロフィール公開設定</label>
          <div className={styles.switchContainer}>
            <Switch
              isSelected={formData.is_profile_public}
              onValueChange={(value) => handleInputChange('is_profile_public', value)}
              size="sm"
              color="primary"
            />
            <span className={styles.switchText}>
              {formData.is_profile_public ? '公開' : '非公開'}
            </span>
          </div>
        </div>
        <p className={styles.visibilityDescription}>
          プロフィールを公開すると、他のユーザーがあなたの情報を閲覧できます。
        </p>
      </div>
    </CustomModal>
  );
};

export default BasicInfoEditModal;
