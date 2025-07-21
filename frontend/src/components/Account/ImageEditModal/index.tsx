'use client'

import React, { useState } from 'react';
import { User } from '@/types/users';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import { PictureUpload } from '@/components/UI/PictureUpload';
import styles from './style.module.scss';

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdate: (updatedUser: User) => void;
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (index: number, file: File | null) => {
    setSelectedImage(file);
  };

  const handleCaptionChange = (index: number, newCaption: string) => {
    setCaption(newCaption);
  };

  const handleSave = async () => {
    if (!selectedImage) {
      showErrorToast('画像を選択してください');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: 画像アップロードAPIの実装
      // const result = await updateProfileImage(selectedImage);
      
      // 仮の実装
      const previewUrl = URL.createObjectURL(selectedImage);
      const updatedUser = { ...user, avatar: previewUrl };
      onUpdate(updatedUser);
      showProfileUpdateToast();
      onClose();
    } catch (error) {
      showErrorToast('画像の更新に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setSelectedImage(null);
      setCaption('');
      onClose();
    }
  };

  const footer = (
    <ModalButtons
      onCancel={handleCancel}
      onSave={handleSave}
      isLoading={isLoading}
      isDisabled={!selectedImage}
    />
  );

  return (
    <CustomModal
      isOpen={isOpen}
      onClose={handleCancel}
      title="プロフィール画像を変更"
      footer={footer}
      size="md"
    >
      <p className={styles.description}>
        新しいプロフィール画像を選択してください。
      </p>
      
      <div className={styles.uploadContainer}>
        <PictureUpload
          file={selectedImage}
          caption={caption}
          index={0}
          onFileChange={handleFileChange}
          onCaptionChange={handleCaptionChange}
          hideIconSelect={true}
        />
      </div>
      
      {selectedImage && (
        <div className={styles.imageInfo}>
          <p className={styles.fileName}>
            選択されたファイル: {selectedImage.name}
          </p>
          <p className={styles.fileSize}>
            サイズ: {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
      )}
    </CustomModal>
  );
};

export default ImageEditModal;
