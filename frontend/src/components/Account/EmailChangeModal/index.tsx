'use client'

import React, { useState } from 'react';
import {
  InputOtp
} from '@nextui-org/react';
import { Eye, EyeOff, Mail, Shield } from 'lucide-react';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import InputDefault from '@/components/UI/InputDefault';
import CustomModal from '@/components/UI/Modal';
import { sendEmailChangeOTP, verifyEmailChangeOTP } from '@/actions/profile/updateEmail';
import { useSession } from 'next-auth/react';
import ModalButtons from '@/components/UI/ModalButtons';
import styles from './style.module.scss';

type FlowStep = 'password_verify' | 'email_input' | 'otp_verify' | 'complete';

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

const EmailChangeModal: React.FC<EmailChangeModalProps> = ({
  isOpen,
  onClose,
  currentEmail
}) => {
  const { update } = useSession();
  const [currentStep, setCurrentStep] = useState<FlowStep>('password_verify');
  const [formData, setFormData] = useState({
    currentPassword: '',
    newEmail: '',
    otp: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof typeof formData, value: string) => {
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

  const validateCurrentStep = (): boolean => {
    const newErrors: Record<string, string> = {};

    switch (currentStep) {
      case 'password_verify':
        if (!formData.currentPassword) {
          newErrors.currentPassword = '現在のパスワードを入力してください';
        }
        break;
      case 'email_input':
        if (!formData.newEmail) {
          newErrors.newEmail = '新しいメールアドレスを入力してください';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
          newErrors.newEmail = '有効なメールアドレスを入力してください';
        } else if (formData.newEmail === currentEmail) {
          newErrors.newEmail = '現在のメールアドレスと同じメールアドレスは使用できません';
        }
        break;
      case 'otp_verify':
        if (!formData.otp || formData.otp.length !== 6) {
          newErrors.otp = '6桁のコードを入力してください';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);

    try {
      switch (currentStep) {
        case 'password_verify':
          // パスワード検証は次のステップで新しいメールアドレスと一緒に送信
          setCurrentStep('email_input');
          break;

        case 'email_input':
          // OTP送信
          const otpResult = await sendEmailChangeOTP({
            currentPassword: formData.currentPassword,
            newEmail: formData.newEmail
          });

          if (otpResult.success) {
            setCurrentStep('otp_verify');
          } else {
            showErrorToast(otpResult.error || 'OTPの送信に失敗しました');
          }
          break;

        case 'otp_verify':
          // OTP検証とメールアドレス変更
          const updateResult = await verifyEmailChangeOTP({
            newEmail: formData.newEmail,
            otp: formData.otp
          });

          if (updateResult.success) {
            setCurrentStep('complete');
            // セッション情報を更新（新しいメールアドレスを明示的に指定）
            await update({
              email: formData.newEmail,
              user: {
                email: formData.newEmail
              }
            });
            setTimeout(() => {
              showProfileUpdateToast();
              handleClose();
            }, 2000);
          } else {
            showErrorToast(updateResult.error || 'コードが正しくありません');
          }
          break;
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'email_input':
        setCurrentStep('password_verify');
        break;
      case 'otp_verify':
        setCurrentStep('email_input');
        break;
    }
  };

  const handleClose = () => {
    if (!isLoading && currentStep !== 'complete') {
      setCurrentStep('password_verify');
      setFormData({
        currentPassword: '',
        newEmail: '',
        otp: ''
      });
      setErrors({});
      setShowPassword(false);
      onClose();
    } else if (currentStep === 'complete') {
      // 完了時は強制的に閉じる
      setCurrentStep('password_verify');
      setFormData({
        currentPassword: '',
        newEmail: '',
        otp: ''
      });
      setErrors({});
      setShowPassword(false);
      onClose();
    }
  };

  const getStepContent = () => {
    switch (currentStep) {
      case 'password_verify':
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <Shield className={styles.stepIcon} size={24} />
              <h3 className={styles.stepTitle}>セキュリティ確認</h3>
              <p className={styles.stepDescription}>現在のパスワードを入力してください</p>
            </div>
            <InputDefault
              label="現在のパスワード"
              type={showPassword ? 'text' : 'password'}
              name="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              isRequired
              isInvalid={!!errors.currentPassword}
              errorMessage={errors.currentPassword}
              endContent={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.eyeButton}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
              anotherStyle={styles.inputField}
            />
          </div>
        );

      case 'email_input':
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <Mail className={styles.stepIcon} size={24} />
              <h3 className={styles.stepTitle}>新しいメールアドレス</h3>
              <p className={styles.stepDescription}>変更したいメールアドレスを入力してください</p>
            </div>
            <div className={styles.emailComparison}>
              <div className={styles.currentEmail}>
                <span className={styles.label}>現在:</span>
                <span className={styles.email}>{currentEmail}</span>
              </div>
              <div className={styles.arrow}>↓</div>
            </div>
            <InputDefault
              label="新しいメールアドレス"
              type="email"
              name="newEmail"
              value={formData.newEmail}
              onChange={(e) => handleInputChange('newEmail', e.target.value)}
              isRequired
              isInvalid={!!errors.newEmail}
              errorMessage={errors.newEmail}
              anotherStyle={styles.inputField}
              placeholder="example@email.com"
            />
          </div>
        );

      case 'otp_verify':
        return (
          <div className={styles.stepContent}>
            <div className={styles.stepHeader}>
              <Mail className={styles.stepIcon} size={24} />
              <h3 className={styles.stepTitle}>確認コード入力</h3>
              <p className={styles.stepDescription}>
                <strong>{formData.newEmail}</strong> に送信された6桁のコードを入力してください
              </p>
            </div>
            <div className={styles.otpContainer}>
              <InputOtp
                value={formData.otp}
                onValueChange={(value) => handleInputChange('otp', value)}
                length={6}
                className={styles.otpInput}
                classNames={{
                  segment: styles.otpInputField,
                }}
              />
              {errors.otp && (
                <p className={styles.errorMessage}>{errors.otp}</p>
              )}
            </div>
            <div className={styles.otpInfo}>
              <p>コードが届かない場合は、迷惑メールフォルダもご確認ください。</p>
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className={styles.stepContent}>
            <div className={styles.completedStep}>
              <div className={styles.successIcon}>✓</div>
              <h3 className={styles.stepTitle}>変更完了</h3>
              <p className={styles.stepDescription}>
                メールアドレスが正常に変更されました。<br />
                新しいメールアドレス: <strong>{formData.newEmail}</strong>
              </p>
              <p className={styles.notificationInfo}>
                変更通知を元のメールアドレスにも送信いたします。
              </p>
            </div>
          </div>
        );
    }
  };


  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="メールアドレスを変更"
      size="lg"
    >
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <div className={styles.stepIndicator}>
            ステップ {
              currentStep === 'password_verify' ? '1' :
              currentStep === 'email_input' ? '2' :
              currentStep === 'otp_verify' ? '3' : '4'
            } / 4
          </div>
        </div>
        <div className={styles.modalBody}>
          {getStepContent()}
        </div>
        {currentStep !== 'complete' && (
          <div className={styles.modalFooter}>
            <ModalButtons
              onCancel={currentStep === 'password_verify' ? handleClose : handleBack}
              onSave={handleNext}
              isLoading={isLoading}
              cancelText={currentStep === 'password_verify' ? 'キャンセル' : '戻る'}
              saveText={
                currentStep === 'password_verify' ? '次へ' :
                currentStep === 'email_input' ? 'コード送信' :
                '確認'
              }
            />
          </div>
        )}
      </div>
    </CustomModal>
  );
};

export default EmailChangeModal;