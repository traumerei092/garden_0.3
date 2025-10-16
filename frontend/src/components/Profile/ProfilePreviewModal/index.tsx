'use client'

import React from 'react';
import CustomModal from '@/components/UI/Modal';
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
    <CustomModal
      isOpen={isOpen}
      onClose={handleClose}
      title="プレビュー - 他のユーザーから見たプロフィール"
      size="full"
      scrollBehavior="inside"
    >
      <div className={styles.headerContent}>
        <p className={styles.subtitle}>
          このプロフィールは、他のユーザーがあなたのプロフィールを見た時の表示です
        </p>
      </div>

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
    </CustomModal>
  );
};

export default ProfilePreviewModal;