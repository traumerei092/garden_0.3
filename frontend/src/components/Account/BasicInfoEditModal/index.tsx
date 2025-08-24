'use client'

import React, { useState, useEffect } from 'react';
import { Input, Select, SelectItem, DatePicker, Button } from '@nextui-org/react';
import { CalendarDate } from '@internationalized/date';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import { updateBasicInfo } from '@/actions/profile/updateBasicInfo';
import { getMyAreas, updateMyAreas } from '@/actions/areas/areaActions';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import MyAreaSelector from '@/components/Account/MyAreaSelector';
import { User } from '@/types/users';
import { Area } from '@/types/areas';
import { useProfileVisibility } from '@/hooks/useProfileVisibility';
import { MapPin, Edit3 } from 'lucide-react';
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
    introduction: '',
    is_profile_public: true
  });
  
  // マイエリア関連の状態
  const [selectedAreas, setSelectedAreas] = useState<Area[]>([]);
  const [primaryArea, setPrimaryArea] = useState<Area | null>(null);
  const [isAreaSelectorOpen, setIsAreaSelectorOpen] = useState(false);
  const [isLoadingAreas, setIsLoadingAreas] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 公開設定フック
  const { visibilitySettings, updateVisibilitySetting } = useProfileVisibility();

  // ユーザーデータの初期化
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        gender: user.gender || '',
        birthdate: user.birthdate || '',
        introduction: user.introduction || '',
        is_profile_public: user.is_profile_public ?? true
      });
      setErrors({});
      
      // マイエリア情報を取得
      loadMyAreas();
    }
  }, [user, isOpen]);

  // マイエリア情報取得
  const loadMyAreas = async () => {
    setIsLoadingAreas(true);
    try {
      const result = await getMyAreas();
      if (result.success && result.data) {
        setSelectedAreas(result.data.my_areas);
        setPrimaryArea(result.data.primary_area);
      }
    } catch (error) {
      console.error('Failed to load my areas:', error);
    } finally {
      setIsLoadingAreas(false);
    }
  };

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
    if (date && date.year && date.month && date.day) {
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
      // 基本情報更新
      const updateData = {
        name: formData.name,
        gender: formData.gender || '',
        birthdate: formData.birthdate || null,
        introduction: formData.introduction || '',
        is_profile_public: formData.is_profile_public
      };

      const basicInfoResult = await updateBasicInfo(updateData);
      
      if (!basicInfoResult.success) {
        showErrorToast(basicInfoResult.error || 'プロフィールの更新に失敗しました');
        return;
      }

      // マイエリア更新
      if (selectedAreas.length > 0) {
        const areasUpdateData = {
          my_area_ids: selectedAreas.map(area => area.id),
          primary_area_id: primaryArea?.id || null
        };

        const areasResult = await updateMyAreas(areasUpdateData);
        
        if (!areasResult.success) {
          showErrorToast(areasResult.error || 'マイエリアの更新に失敗しました');
          return;
        }
      }
      
      if (basicInfoResult.data) {
        onUpdate(basicInfoResult.data);
        showProfileUpdateToast();
        onClose();
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
      
      {/* 基本情報セクション */}
      <div className={styles.basicInfoSection}>
        <h3 className={styles.sectionHeader}>基本情報</h3>
        <div className={styles.basicInfoGrid}>
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
        </div>
        
        {/* 生年月日を全幅にして横に引き延ばす */}
        <div className={styles.formField}>
          <div className={styles.fieldWithVisibility}>
            <DatePicker
              label="生年月日"
              value={parseBirthdate(formData.birthdate) as any}
              onChange={handleDateChange}
              variant="bordered"
              radius="sm"
              showMonthAndYearPickers
              classNames={{
                base: styles.datePickerBase,
                popoverContent: styles.datePickerPopover,
                calendar: styles.datePickerCalendar,
                calendarContent: styles.datePickerCalendarContent,
              }}
            />
            <div className={styles.visibilityControl}>
              <SwitchVisibility
                isSelected={visibilitySettings?.age ?? true}
                onValueChange={(value) => updateVisibilitySetting('age', value)}
              />
            </div>
          </div>
        </div>
        
      </div>
      
      {/* マイエリアセクション */}
      <div className={styles.myAreaSection}>
        <h3 className={styles.sectionHeader}>マイエリア</h3>
        <div className={styles.areaContainer}>
          <div className={styles.areaContent}>
            <div className={styles.areaSectionHeader}>
              <p className={styles.areaSectionDescription}>
                よく行くエリアを設定してください。最大10箇所まで選択できます。
              </p>
              <Button
                size="md"
                variant="bordered"
                startContent={<Edit3 size={16} />}
                onPress={() => setIsAreaSelectorOpen(true)}
                isLoading={isLoadingAreas}
                className={styles.editAreasButton}
              >
                {selectedAreas.length > 0 ? 'エリアを編集' : 'エリアを選択'}
              </Button>
            </div>
            
            {selectedAreas.length > 0 ? (
              <div className={styles.selectedAreasDisplay}>
                {selectedAreas.map(area => (
                  <div key={area.id} className={styles.areaChip}>
                    <MapPin size={14} />
                    <span className={styles.areaChipName}>{area.get_full_name || area.name}</span>
                    {primaryArea?.id === area.id && (
                      <span className={styles.primaryLabel}>メイン</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noAreasContainer}>
                <MapPin size={24} className={styles.noAreasIcon} />
                <p className={styles.noAreasText}>マイエリアが設定されていません</p>
                <p className={styles.noAreasSubText}>エリアを選択してプロフィールをより詳しく設定しましょう</p>
              </div>
            )}
          </div>
          <div className={styles.visibilityControl}>
            <SwitchVisibility
              isSelected={visibilitySettings?.my_area ?? true}
              onValueChange={(value) => updateVisibilitySetting('my_area', value)}
            />
          </div>
        </div>
      </div>

      {/* マイエリア選択モーダル */}
      {isAreaSelectorOpen && (
        <CustomModal
          isOpen={isAreaSelectorOpen}
          onClose={() => setIsAreaSelectorOpen(false)}
          title="マイエリアを選択"
          size="4xl"
          footer={
            <ModalButtons
              onCancel={() => setIsAreaSelectorOpen(false)}
              onSave={() => setIsAreaSelectorOpen(false)}
              isLoading={false}
            />
          }
        >
          <MyAreaSelector
            selectedAreas={selectedAreas}
            primaryArea={primaryArea}
            onAreasChange={setSelectedAreas}
            onPrimaryAreaChange={setPrimaryArea}
            maxAreas={10}
          />
        </CustomModal>
      )}
    </CustomModal>
  );
};

export default BasicInfoEditModal;
