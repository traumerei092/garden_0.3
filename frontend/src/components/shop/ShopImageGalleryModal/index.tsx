'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button, Modal, ModalContent } from '@nextui-org/react';
import { X, Plus, Camera } from 'lucide-react';
import CustomModal from '@/components/UI/Modal';
import styles from './style.module.scss';

interface ShopImage {
  id: number;
  image_url: string;
  caption?: string;
}

interface ShopImageGalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: ShopImage[];
  shopName: string;
  onImageUpload?: () => void;
  onImageClick?: (index: number) => void;
}

const ShopImageGalleryModal: React.FC<ShopImageGalleryModalProps> = ({
  isOpen,
  onClose,
  images,
  shopName,
  onImageUpload,
  onImageClick
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
    if (onImageClick) {
      onImageClick(index);
    }
  };

  const closeSelectedImage = () => {
    setSelectedImage(null);
  };

  // Masonry風のグリッドアイテムの高さを計算
  const getGridItemHeight = (index: number) => {
    const heights = [200, 250, 180, 220, 190, 240, 210, 170, 230, 200];
    return heights[index % heights.length];
  };

  const headerActions = (
    <div className={styles.headerActions}>
      {onImageUpload && (
        <Button
          className={styles.uploadButton}
          variant="light"
          size="sm"
          onPress={onImageUpload}
        >
          <Camera size={16} strokeWidth={1.5} />
          <span>追加</span>
        </Button>
      )}
    </div>
  );

  return (
    <>
      <CustomModal
        isOpen={isOpen}
        onClose={onClose}
        title={`${shopName} - 画像ギャラリー`}
        size="5xl"
        scrollBehavior="inside"
        footer={headerActions}
      >
        {images.length === 0 ? (
          <div className={styles.emptyState}>
            <Camera size={48} strokeWidth={1} />
            <p>まだ画像がありません</p>
            {onImageUpload && (
              <Button
                className={styles.emptyUploadButton}
                variant="bordered"
                onPress={onImageUpload}
              >
                <Plus size={16} />
                最初の画像を追加
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.masonryGrid}>
            {images.map((image, index) => (
              <div
                key={image.id}
                className={styles.gridItem}
                style={{ height: `${getGridItemHeight(index)}px` }}
                onClick={() => handleImageClick(index)}
              >
                <div className={styles.imageContainer}>
                  <Image
                    src={image.image_url.startsWith('http') ? image.image_url : `${process.env.NEXT_PUBLIC_API_URL}${image.image_url}`}
                    alt={image.caption || `${shopName}の画像 ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                    style={{ objectFit: 'cover' }}
                    className={styles.gridImage}
                  />
                  {image.caption && (
                    <div className={styles.imageCaption}>
                      <span>{image.caption}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CustomModal>

      {/* 拡大表示モーダル */}
      {selectedImage !== null && (
        <Modal 
          isOpen={true} 
          onClose={closeSelectedImage} 
          size="5xl" 
          className={styles.lightboxModal}
          hideCloseButton
        >
          <ModalContent className={styles.lightboxContent}>
            <>
              <div className={styles.lightboxHeader}>
                <span className={styles.lightboxCounter}>
                  {selectedImage + 1} / {images.length}
                </span>
                <Button
                  className={styles.lightboxCloseButton}
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={closeSelectedImage}
                >
                  <X size={20} strokeWidth={2} />
                </Button>
              </div>
              <div className={styles.lightboxImageContainer}>
                <Image
                  src={images[selectedImage].image_url.startsWith('http') 
                    ? images[selectedImage].image_url 
                    : `${process.env.NEXT_PUBLIC_API_URL}${images[selectedImage].image_url}`
                  }
                  alt={images[selectedImage].caption || `${shopName}の画像 ${selectedImage + 1}`}
                  fill
                  sizes="90vw"
                  style={{ objectFit: 'contain' }}
                  className={styles.lightboxImage}
                />
                {images[selectedImage].caption && (
                  <div className={styles.lightboxCaption}>
                    {images[selectedImage].caption}
                  </div>
                )}
              </div>
            </>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default ShopImageGalleryModal;