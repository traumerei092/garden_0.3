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
  header_image?: string | null;
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
  imageType?: 'avatar' | 'header';
}

const ImageEditModal: React.FC<ImageEditModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdate,
  imageType = 'avatar'
}) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 画像タイプに応じたタイトルと説明を取得
  const getModalTitle = () => {
    return imageType === 'header' ? 'ヘッダー画像を変更' : 'プロフィール画像を変更';
  };

  const getModalDescription = () => {
    return imageType === 'header' ? '新しいヘッダー画像を選択してください。' : '新しいプロフィール画像を選択してください。';
  };

  const getCurrentImageUrl = () => {
    if (imageType === 'header') {
      // ヘッダー画像のフィールドが追加されるまでは固定画像を表示
      return user.header_image || '/assets/picture/beach.jpg';
    }
    return user.avatar;
  };

  const handleFileChange = (index: number, file: File | null) => {
    setSelectedImage(file);
  };

  const handleSave = async () => {
    if (!selectedImage) {
      showErrorToast('画像を選択してください');
      return;
    }

    setIsLoading(true);
    try {
      console.log('ImageEditModal - Uploading image:', selectedImage.name, selectedImage.size);
      const result = await updateProfileImage(selectedImage, imageType);
      console.log('ImageEditModal - Upload result:', result);
      
      if (result.success && result.data) {
        // User型からUserInfo型への変換
        const userInfo = {
          id: result.data.id,
          uid: result.data.uid,
          email: result.data.email,
          name: result.data.name,
          avatar: result.data.avatar,
          header_image: result.data.header_image,
          introduction: result.data.introduction,
          gender: result.data.gender,
          birthdate: result.data.birthdate,
          my_area: result.data.my_area
        };
        onUpdate(userInfo);
        showProfileUpdateToast();
        setSelectedImage(null);
        onClose();
      } else {
        console.error('ImageEditModal - Error:', result.error);
        showErrorToast(result.error || '画像の更新に失敗しました');
      }
    } catch (error) {
      console.error('ImageEditModal - Network error:', error);
      showErrorToast('ネットワークエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      setSelectedImage(null);
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
      title={getModalTitle()}
      footer={footer}
      size="md"
    >
      <p className={styles.description}>
        {getModalDescription()}
      </p>

      {/* 現在の画像プレビュー */}
      {getCurrentImageUrl() && (
        <div className={styles.currentImageSection}>
          <h4 className={styles.sectionTitle}>現在の画像</h4>
          <div className={styles.currentImageContainer}>
            <img 
              src={getCurrentImageUrl() || ''} 
              alt={imageType === 'header' ? 'ヘッダー画像' : 'プロフィール画像'} 
              className={styles.currentImage}
            />
          </div>
        </div>
      )}
      
      <div className={styles.uploadContainer}>
        <PictureUpload
          file={selectedImage}
          caption=""
          index={0}
          onFileChange={handleFileChange}
          onCaptionChange={() => {}} // ダミー関数
          hideIconSelect={true}
          hideCaption={true}
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
