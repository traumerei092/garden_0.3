'use client'

import React from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, Button } from '@nextui-org/react';
import { X } from 'lucide-react';
import useSWR from 'swr';
import { fetchProfilePreview } from '@/actions/user/fetchPublicProfile';
import { PublicUserProfile } from '@/types/users';
import PublicProfileView from '@/components/User/PublicProfileView';
import styles from './style.module.scss';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfilePreviewModal: React.FC<ProfilePreviewModalProps> = ({
  isOpen,
  onClose
}) => {
  const { data: previewData, error, isLoading } = useSWR<PublicUserProfile | null>(
    isOpen ? 'profile-preview' : null,
    isOpen ? () => fetchProfilePreview() : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  );

  const handleClose = () => {
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="full"
      classNames={{
        base: styles.modalBase,
        backdrop: styles.modalBackdrop,
        header: styles.modalHeader,
        body: styles.modalBody,
        footer: styles.modalFooter,
      }}
      hideCloseButton
      scrollBehavior="inside"
    >
      <ModalContent className={styles.modalContent}>
        <ModalHeader className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>プレビュー - 他のユーザーから見たプロフィール</h2>
            <p className={styles.subtitle}>
              このプロフィールは、他のユーザーがあなたのプロフィールを見た時の表示です
            </p>
          </div>
          <Button
            isIconOnly
            variant="light"
            onPress={handleClose}
            className={styles.closeButton}
          >
            <X size={24} />
          </Button>
        </ModalHeader>

        <ModalBody className={styles.body}>
          {isLoading && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner} />
              </div>
              <p className={styles.loadingText}>プレビューを読み込み中...</p>
            </div>
          )}

          {error && (
            <div className={styles.errorContainer}>
              <div className={styles.errorContent}>
                <h3 className={styles.errorTitle}>プレビューの読み込みに失敗しました</h3>
                <p className={styles.errorMessage}>
                  しばらくしてから再度お試しください。
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <details className={styles.errorDetails}>
                    <summary>エラー詳細</summary>
                    <pre>{error.message}</pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {previewData && (
            <div className={styles.previewContent}>
              <PublicProfileView userProfile={previewData} />
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ProfilePreviewModal;