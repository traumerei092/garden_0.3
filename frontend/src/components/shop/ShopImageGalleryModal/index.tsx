'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@nextui-org/react';
import { X, Plus, Camera, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);

  const handleImageClick = (index: number) => {
    setSelectedImage(index);
    if (onImageClick) {
      onImageClick(index);
    }
  };

  const closeSelectedImage = () => {
    setSelectedImage(null);
    setImageLoadError(false);
  };

  const goToPrevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
      setImageLoadError(false);
    }
  };

  const goToNextImage = () => {
    if (selectedImage !== null && selectedImage < images.length - 1) {
      setSelectedImage(selectedImage + 1);
      setImageLoadError(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (selectedImage === null) return;

      switch (event.key) {
        case 'Escape':
          closeSelectedImage();
          break;
        case 'ArrowLeft':
          goToPrevImage();
          break;
        case 'ArrowRight':
          goToNextImage();
          break;
      }
    };

    if (selectedImage !== null) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

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

      {/* Netflix風フルスクリーン拡大表示 */}
      {selectedImage !== null && (
        <div className={styles.fullscreenLightbox}>
          <div className={styles.lightboxOverlay} onClick={closeSelectedImage} />

          {/* トップナビゲーションバー */}
          <div className={styles.lightboxTopBar}>
            <div className={styles.topBarLeft}>
              <Button
                className={styles.backButton}
                isIconOnly
                variant="light"
                size="sm"
                onPress={closeSelectedImage}
              >
                <ArrowLeft size={20} strokeWidth={2} />
              </Button>
              <span className={styles.imageTitle}>
                {images[selectedImage].caption || `${shopName}の画像`}
              </span>
            </div>
            <div className={styles.topBarRight}>
              <span className={styles.imageCounter}>
                {selectedImage + 1} / {images.length}
              </span>
              <Button
                className={styles.closeButton}
                isIconOnly
                variant="light"
                size="sm"
                onPress={closeSelectedImage}
              >
                <X size={20} strokeWidth={2} />
              </Button>
            </div>
          </div>

          {/* メイン画像コンテナ */}
          <div className={styles.lightboxMainContent}>
            {/* 前の画像ボタン */}
            {selectedImage > 0 && (
              <Button
                className={`${styles.navButton} ${styles.navPrev}`}
                isIconOnly
                variant="light"
                size="lg"
                onPress={goToPrevImage}
              >
                <ChevronLeft size={32} strokeWidth={2} />
              </Button>
            )}

            {/* メイン画像 */}
            <div className={styles.imageDisplayArea}>
              {!imageLoadError ? (
                <Image
                  src={images[selectedImage].image_url.startsWith('http')
                    ? images[selectedImage].image_url
                    : `${process.env.NEXT_PUBLIC_API_URL}${images[selectedImage].image_url}`
                  }
                  alt={images[selectedImage].caption || `${shopName}の画像 ${selectedImage + 1}`}
                  fill
                  sizes="95vw"
                  style={{ objectFit: 'contain' }}
                  className={styles.mainImage}
                  onError={() => setImageLoadError(true)}
                  priority
                />
              ) : (
                <div className={styles.imageError}>
                  <Camera size={48} strokeWidth={1} />
                  <p>画像を読み込めませんでした</p>
                </div>
              )}
            </div>

            {/* 次の画像ボタン */}
            {selectedImage < images.length - 1 && (
              <Button
                className={`${styles.navButton} ${styles.navNext}`}
                isIconOnly
                variant="light"
                size="lg"
                onPress={goToNextImage}
              >
                <ChevronRight size={32} strokeWidth={2} />
              </Button>
            )}
          </div>

          {/* ボトムキャプションエリア */}
          {images[selectedImage].caption && (
            <div className={styles.lightboxBottomBar}>
              <div className={styles.captionContainer}>
                <p className={styles.caption}>
                  {images[selectedImage].caption}
                </p>
              </div>
            </div>
          )}

          {/* サムネイルストリップ（Netflix風） */}
          {images.length > 1 && (
            <div className={styles.thumbnailStrip}>
              <div className={styles.thumbnailContainer}>
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`${styles.thumbnailItem} ${
                      index === selectedImage ? styles.activeThumbnail : ''
                    }`}
                    onClick={() => {
                      setSelectedImage(index);
                      setImageLoadError(false);
                    }}
                  >
                    <Image
                      src={image.image_url.startsWith('http')
                        ? image.image_url
                        : `${process.env.NEXT_PUBLIC_API_URL}${image.image_url}`
                      }
                      alt={`サムネイル ${index + 1}`}
                      fill
                      sizes="120px"
                      style={{ objectFit: 'cover' }}
                      className={styles.thumbnailImage}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ShopImageGalleryModal;