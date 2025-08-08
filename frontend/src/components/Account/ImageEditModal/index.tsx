'use client'

import React, { useState } from 'react';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import { updateProfileImage } from '@/actions/profile/updateProfileImage';
import CustomModal from '@/components/UI/Modal';
import ModalButtons from '@/components/UI/ModalButtons';
import { PictureUpload } from '@/components/UI/PictureUpload';
import styles from './style.module.scss';

// BasicInfoで使用するUserInfo型と完全に互換性のあるインターface
interface UserForImageEdit {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  avatar: string | null;
  introduction: string | null;
  gender: string | null;
  birthdate: string | null;
  my_area: string | null;
}

interface ImageEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserForImageEdit;
  onUpdate: (updatedUser: UserForImageEdit) => void;
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
      const result = await updateProfileImage(selectedImage);
      
      if (result.success && result.data) {
        onUpdate(result.data);
        showProfileUpdateToast();
        onClose();
      } else {
        showErrorToast(result.error || '画像の更新に失敗しました');
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
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
