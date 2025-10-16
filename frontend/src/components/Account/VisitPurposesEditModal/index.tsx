'use client'

import React, { useState, useEffect } from 'react';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import CustomCheckboxGroup from '@/components/UI/CheckboxGroup';
import { User as UserType, ProfileOptions } from '@/types/users';
import { updateVisitPurposes } from '@/actions/profile/updateVisitPurposes';
import { useProfileVisibility } from '@/hooks/useProfileVisibility';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import styles from './style.module.scss';

interface VisitPurposesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType;
  profileOptions: ProfileOptions;
  onUpdate: (updatedUser: UserType) => void;
}

const VisitPurposesEditModal: React.FC<VisitPurposesEditModalProps> = ({
  isOpen,
  onClose,
  user,
  profileOptions,
  onUpdate,
}) => {
  const [selectedPurposes, setSelectedPurposes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // 公開設定フック
  const { visibilitySettings, updateVisibilitySetting } = useProfileVisibility();

  // モーダルが開かれた時にユーザーの現在の利用目的を設定
  useEffect(() => {
    if (isOpen && user.visit_purposes) {
      setSelectedPurposes(user.visit_purposes.map(purpose => String(purpose.id)));
    }
  }, [isOpen, user.visit_purposes]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const purposeIds = selectedPurposes.map(id => parseInt(id));
      const result = await updateVisitPurposes(purposeIds);
      
      if (result.success && result.data) {
        onUpdate(result.data);
        showProfileUpdateToast();
        onClose();
      } else {
        showErrorToast(result.error || '利用目的の更新に失敗しました');
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    // 元の状態に戻す
    if (user.visit_purposes) {
      setSelectedPurposes(user.visit_purposes.map(purpose => String(purpose.id)));
    } else {
      setSelectedPurposes([]);
    }
    onClose();
  };

  return (
    <CustomModal isOpen={isOpen} onClose={handleCancel} title="利用目的を編集">
      <div className={styles.modalContent}>
        <div className={styles.visibilitySection}>
          <div className={styles.visibilityLabel}>利用目的の公開設定</div>
          <SwitchVisibility
            isSelected={visibilitySettings?.visit_purposes ?? true}
            onValueChange={(value) => updateVisibilitySetting('visit_purposes', value)}
          />
        </div>
        
        <div className={styles.description}>
          どのような目的でお店を利用することが多いですか？複数選択可能です。
        </div>
        
        <div className={styles.checkboxSection}>
          <CustomCheckboxGroup
            name="visit_purposes"
            values={selectedPurposes}
            onChange={setSelectedPurposes}
            options={profileOptions.visit_purposes.map(purpose => ({
              label: purpose.name,
              value: String(purpose.id)
            }))}
          />
        </div>
        
        <div className={styles.infoBox}>
          <span className={styles.infoIcon}>💡</span>
          <span className={styles.infoText}>
            利用目的を設定すると、シーンに合ったお店を見つけやすくなります
          </span>
        </div>
      </div>
      
      <ModalButtons
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isLoading}
        saveText="保存"
        cancelText="キャンセル"
      />
    </CustomModal>
  );
};

export default VisitPurposesEditModal;
