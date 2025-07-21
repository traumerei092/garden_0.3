'use client'

import React from 'react';
import { Button } from '@nextui-org/react';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import styles from './style.module.scss';

interface ModalButtonsProps {
  onCancel: () => void;
  onSave: () => void;
  isLoading?: boolean;
  saveText?: string;
  cancelText?: string;
  isDisabled?: boolean;
}

const ModalButtons: React.FC<ModalButtonsProps> = ({
  onCancel,
  onSave,
  isLoading = false,
  saveText = '保存',
  cancelText = 'キャンセル',
  isDisabled = false
}) => {
  return (
    <div className={styles.container}>
      <Button
        variant="light"
        onPress={onCancel}
        className={styles.cancelButton}
        isDisabled={isLoading}
      >
        {cancelText}
      </Button>
      <Button
        onPress={onSave}
        className={styles.saveButton}
        isLoading={isLoading}
        isDisabled={isDisabled}
        spinner={<LoadingSpinner size="sm" />}
      >
        {saveText}
      </Button>
    </div>
  );
};

export default ModalButtons;
