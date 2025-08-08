'use client'

import React, { useState, useEffect } from 'react';
import { User as UserType, ProfileOptions } from '@/types/users';
import { updateInterests } from '@/actions/profile/updateInterests';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import { useProfileVisibility } from '@/hooks/useProfileVisibility';
import styles from './style.module.scss';

interface InterestsEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  profileOptions: ProfileOptions;
  onUpdate: (updatedUser: UserType) => void;
}

const InterestsEditModal: React.FC<InterestsEditModalProps> = ({
  isOpen,
  onClose,
  user,
  profileOptions,
  onUpdate
}) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 公開設定フック
  const { visibilitySettings, updateVisibilitySetting } = useProfileVisibility();

  // 現在の興味を初期値として設定
  useEffect(() => {
    if (user.interests && isOpen) {
      const currentInterestIds = user.interests.map(interest => String(interest.id));
      setSelectedInterests(currentInterestIds);
    }
  }, [user.interests, isOpen]);

  // 興味をカテゴリ別にグループ化
  const groupedInterests = profileOptions.interests?.reduce((acc, interest) => {
    const categoryName = interest.category.name;
    if (!acc[categoryName]) {
      acc[categoryName] = [];
    }
    acc[categoryName].push(interest);
    return acc;
  }, {} as Record<string, typeof profileOptions.interests>) || {};

  const handleSave = async () => {
    setIsLoading(true);
    try {
      console.log('興味更新開始:', {
        selectedInterests,
        interestIds: selectedInterests.map(id => parseInt(id))
      });
      
      const interestIds = selectedInterests.map(id => parseInt(id));
      const result = await updateInterests(interestIds);
      
      console.log('興味更新結果:', result);
      
      if (result.success && result.data) {
        onUpdate(result.data);
        showProfileUpdateToast();
        onClose();
      } else {
        console.error('興味更新エラー:', result.error);
        showErrorToast(result.error || '興味の更新に失敗しました');
      }
    } catch (error) {
      console.error('興味更新例外:', error);
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 元の値に戻す
    if (user.interests) {
      const currentInterestIds = user.interests.map(interest => String(interest.id));
      setSelectedInterests(currentInterestIds);
    }
    onClose();
  };

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
      title="興味を編集"
      footer={footer}
      size="2xl"
    >
      <div className={styles.modalHeader}>
        <div className={styles.visibilitySection}>
          <div className={styles.visibilityLabel}>興味の公開設定</div>
          <SwitchVisibility
            isSelected={visibilitySettings?.interests ?? true}
            onValueChange={(value) => updateVisibilitySetting('interests', value)}
          />
        </div>
      </div>
      
      <p className={styles.description}>
        あなたの興味を選択してください。複数選択可能です。
      </p>
      
      <div className={styles.categoriesContainer}>
        {Object.entries(groupedInterests).map(([categoryName, interests]) => (
          <div key={categoryName} className={styles.categorySection}>
            <h3 className={styles.categoryTitle}>{categoryName}</h3>
            <CustomCheckboxGroup
              name={`interests-${categoryName}`}
              values={selectedInterests}
              onChange={setSelectedInterests}
              options={interests.map(interest => ({
                label: interest.name,
                value: String(interest.id)
              }))}
            />
          </div>
        ))}
      </div>
    </CustomModal>
  );
};

export default InterestsEditModal;
