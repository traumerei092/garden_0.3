'use client'

import React, { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@nextui-org/react';
import { Eye, EyeOff } from 'lucide-react';
import { UpdatePasswordRequest } from '@/types/users';
import { updatePassword } from '@/actions/profile/updatePassword';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import InputDefault from '@/components/UI/InputDefault';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import styles from './style.module.scss';

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<UpdatePasswordRequest>({
    current_password: '',
    new_password: ''
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof UpdatePasswordRequest | 'confirmPassword', value: string) => {
    if (field === 'confirmPassword') {
      setConfirmPassword(value);
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.current_password) {
      newErrors.current_password = '現在のパスワードを入力してください';
    }

    if (!formData.new_password) {
      newErrors.new_password = '新しいパスワードを入力してください';
    } else if (formData.new_password.length < 8) {
      newErrors.new_password = 'パスワードは8文字以上で入力してください';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'パスワードの確認を入力してください';
    } else if (formData.new_password !== confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    if (formData.current_password === formData.new_password) {
      newErrors.new_password = '現在のパスワードと同じパスワードは使用できません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await updatePassword(formData);
      
      if (result.success) {
        showProfileUpdateToast();
        handleClose();
      } else {
        showErrorToast(result.error || 'パスワードの変更に失敗しました');
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        current_password: '',
        new_password: ''
      });
      setConfirmPassword('');
      setErrors({});
      setShowPasswords({
        current: false,
        new: false,
        confirm: false
      });
      onClose();
    }
  };

  const footer = (
    <ModalButtons
      onCancel={handleClose}
      onSave={handleSave}
      isLoading={isLoading}
    />
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="興味を編集"
      footer={footer}
      size="lg"
    >
      <ModalContent>
        <ModalHeader>
          <h2 className={styles.title}>パスワードを変更</h2>
        </ModalHeader>
        <ModalBody>
          <div className={styles.formGrid}>
            <InputDefault
              label="現在のパスワード"
              type={showPasswords.current ? 'text' : 'password'}
              name="current_password"
              value={formData.current_password}
              onChange={(e) => handleInputChange('current_password', e.target.value)}
              isRequired
              isInvalid={!!errors.current_password}
              errorMessage={errors.current_password}
              endContent={
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('current')}
                  className={styles.eyeButton}
                >
                  {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              anotherStyle={styles.inputField}
            />

            <InputDefault
              label="新しいパスワード"
              type={showPasswords.new ? 'text' : 'password'}
              name="new_password"
              value={formData.new_password}
              onChange={(e) => handleInputChange('new_password', e.target.value)}
              isRequired
              isInvalid={!!errors.new_password}
              errorMessage={errors.new_password}
              endContent={
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className={styles.eyeButton}
                >
                  {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              anotherStyle={styles.inputField}
            />

            <InputDefault
              label="新しいパスワード（確認用）"
              type={showPasswords.confirm ? 'text' : 'password'}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              isRequired
              isInvalid={!!errors.confirmPassword}
              errorMessage={errors.confirmPassword}
              endContent={
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('confirm')}
                  className={styles.eyeButton}
                >
                  {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              anotherStyle={styles.inputField}
            />
          </div>

          <div className={styles.passwordRequirements}>
            <h4 className={styles.requirementsTitle}>※パスワード条件</h4>
            <ul className={styles.requirementsList}>
              <li className={formData.new_password.length >= 8 ? styles.valid : styles.invalid}>
                ・8文字以上
              </li>
              <li className={/[A-Z]/.test(formData.new_password) ? styles.valid : styles.invalid}>
                ・大文字を含む
              </li>
              <li className={/[a-z]/.test(formData.new_password) ? styles.valid : styles.invalid}>
                ・小文字を含む
              </li>
              <li className={/[0-9]/.test(formData.new_password) ? styles.valid : styles.invalid}>
                ・数字を含む
              </li>
            </ul>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="light"
            onPress={handleClose}
            disabled={isLoading}
            className={styles.cancelButton}
          >
            キャンセル
          </Button>
          <Button
            color="primary"
            onPress={handleSave}
            disabled={isLoading}
            className={styles.saveButton}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : '変更'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </CustomModal>
  );
};

export default PasswordChangeModal;
