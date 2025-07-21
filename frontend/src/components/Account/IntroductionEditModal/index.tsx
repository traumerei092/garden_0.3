'use client'

import React, { useState, useEffect } from 'react';
import { Textarea } from '@nextui-org/react';
import { User } from '@/types/users';
import { updateIntroduction } from '@/actions/profile/updateIntroduction';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import styles from './style.module.scss';

interface IntroductionEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const IntroductionEditModal: React.FC<IntroductionEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate
}) => {
  const [introduction, setIntroduction] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      setIntroduction(user.introduction || '');
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await updateIntroduction(introduction);
      
      if (result.success && result.data) {
        onUpdate(result.data);
        showProfileUpdateToast();
        onClose();
      } else {
        showErrorToast(result.error || '自己紹介の更新に失敗しました');
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setIntroduction(user.introduction || '');
      onClose();
    }
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
      title="自己紹介を編集"
      footer={footer}
      size="lg"
    >
      <p className={styles.description}>
        あなたの自己紹介を入力してください。
      </p>
      
      <div className={styles.textareaContainer}>
        <Textarea
          value={introduction}
          onChange={(e) => setIntroduction(e.target.value)}
          placeholder="自己紹介を入力してください..."
          minRows={6}
          maxRows={10}
          variant="bordered"
          radius="sm"
          classNames={{
            base: styles.textareaBase,
            label: styles.textareaLabel,
            inputWrapper: styles.textareaWrapper,
            input: styles.textarea
          }}
        />
      </div>
      
      <div className={styles.characterCount}>
        {introduction.length} / 500文字
      </div>
    </CustomModal>
  );
};

export default IntroductionEditModal;
