'use client'

import React, { useState, useEffect } from 'react';
import { User as UserType, ProfileOptions } from '@/types/users';
import { updateSocialPreferences } from '@/actions/profile/updateSocialPreferences';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import styles from './style.module.scss';

interface SocialPreferencesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  profileOptions: ProfileOptions;
  onUpdate: (updatedUser: UserType) => void;
}

const SocialPreferencesEditModal: React.FC<SocialPreferencesEditModalProps> = ({
  isOpen,
  onClose,
  user,
  profileOptions,
  onUpdate
}) => {
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  // 現在の交友関係の好みを初期値として設定
  useEffect(() => {
    if (user.social_preferences && isOpen) {
      const currentPreferenceIds = user.social_preferences.map(pref => String(pref.id));
      setSelectedPreferences(currentPreferenceIds);
    }
  }, [user.social_preferences, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      console.log('交友関係の好み更新開始:', {
        selectedPreferences,
        preferenceIds: selectedPreferences.map(id => parseInt(id))
      });
      
      const preferenceIds = selectedPreferences.map(id => parseInt(id));
      const result = await updateSocialPreferences(preferenceIds);
      
      console.log('交友関係の好み更新結果:', result);
      
      if (result.success && result.data) {
        onUpdate(result.data);
        showProfileUpdateToast();
        onClose();
      } else {
        console.error('交友関係の好み更新エラー:', result.error);
        showErrorToast(result.error || '交友関係の好みの更新に失敗しました');
      }
    } catch (error) {
      console.error('交友関係の好み更新例外:', error);
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 元の値に戻す
    if (user.social_preferences) {
      const currentPreferenceIds = user.social_preferences.map(pref => String(pref.id));
      setSelectedPreferences(currentPreferenceIds);
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
      title="交友関係の好みを編集"
      footer={footer}
      size="lg"
    >
      <div className={styles.modalHeader}>
        <div className={styles.visibilitySection}>
          <div className={styles.visibilityLabel}>興味の公開設定</div>
          <SwitchVisibility
            isSelected={isPublic}
            onValueChange={setIsPublic}
          />
        </div>
      </div>
      
      <p className={styles.description}>
        あなたの交友関係の好みを選択してください。複数選択可能です。
      </p>
      
      <div className={styles.preferencesContainer}>
        <CustomCheckboxGroup
          name="social-preferences"
          values={selectedPreferences}
          onChange={setSelectedPreferences}
          options={profileOptions.social_preferences?.map(preference => ({
            label: preference.name,
            value: String(preference.id)
          })) || []}
        />
      </div>
    </CustomModal>
  );
};

export default SocialPreferencesEditModal;
