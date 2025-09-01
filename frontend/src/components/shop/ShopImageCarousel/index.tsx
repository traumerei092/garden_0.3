'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Button } from '@nextui-org/react';
import { ChevronLeft, ChevronRight, Grid3X3, Camera } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Thumbs } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';

// Swiperのスタイルをインポート
import 'swiper/css';
import 'swiper/css/thumbs';

import styles from './style.module.scss';

interface ShopImage {
  id: number;
  image_url: string;
  caption?: string;
}

interface ShopImageCarouselProps {
  images: ShopImage[];
  shopName: string;
  onImageUpload?: () => void;
  onViewAll?: () => void;
  className?: string;
}

const ShopImageCarousel: React.FC<ShopImageCarouselProps> = ({
  images,
  shopName,
  onImageUpload,
  onViewAll,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

  // デフォルト画像がない場合の処理
  const displayImages = images?.length > 0 ? images : [{
    id: 0,
    image_url: '/assets/picture/no-image.jpg',
    caption: '画像がありません'
  }];

  const hasImages = images?.length > 0;

  return (
    <div className={`${styles.carouselContainer} ${className}`}>
      {/* メインカルーセル */}
      <div className={styles.mainCarousel}>
        <Swiper
          modules={[Thumbs]}
          spaceBetween={0}
          slidesPerView={1}
          thumbs={{ 
            swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null,
            multipleActiveThumbs: false
          }}
          onSwiper={setMainSwiper}
          onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
          className={styles.mainSwiper}
        >
          {displayImages.map((image, index) => (
            <SwiperSlide key={image.id || index}>
              <div className={styles.imageWrapper}>
                <Image
                  src={image.image_url.startsWith('http') ? image.image_url : `${process.env.NEXT_PUBLIC_API_URL}${image.image_url}`}
                  alt={image.caption || `${shopName}の画像 ${index + 1}`}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: 'cover' }}
                  className={styles.shopImage}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>

        {/* ナビゲーションボタン */}
        {hasImages && displayImages.length > 1 && (
          <>
            <Button
              className={`${styles.navButton} ${styles.navButtonPrev}`}
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => {
                if (mainSwiper) {
                  mainSwiper.slidePrev();
                }
              }}
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </Button>
            <Button
              className={`${styles.navButton} ${styles.navButtonNext}`}
              isIconOnly
              variant="light"
              size="sm"
              onPress={() => {
                if (mainSwiper) {
                  mainSwiper.slideNext();
                }
              }}
            >
              <ChevronRight size={20} strokeWidth={2} />
            </Button>
          </>
        )}

        {/* 画像追加ボタン（控えめ） */}
        {onImageUpload && (
          <Button
            className={styles.uploadButton}
            isIconOnly
            variant="light"
            size="sm"
            onPress={onImageUpload}
          >
            <Camera size={16} strokeWidth={1.5} />
          </Button>
        )}

        {/* 一覧表示ボタン */}
        {onViewAll && hasImages && (
          <Button
            className={styles.viewAllButton}
            variant="light"
            size="sm"
            onPress={onViewAll}
          >
            <Grid3X3 size={16} strokeWidth={1.5} />
            <span>すべて表示</span>
          </Button>
        )}

        {/* 画像インジケーター */}
        {hasImages && displayImages.length > 1 && (
          <div className={styles.indicators}>
            <span className={styles.indicatorText}>
              {activeIndex + 1} / {displayImages.length}
            </span>
          </div>
        )}
      </div>

      {/* サムネイルギャラリー */}
      {hasImages && displayImages.length > 1 && (
        <div className={styles.thumbsContainer}>
          <Swiper
            modules={[Thumbs]}
            onSwiper={setThumbsSwiper}
            spaceBetween={8}
            slidesPerView="auto"
            freeMode={true}
            watchSlidesProgress={true}
            className={styles.thumbsSwiper}
          >
            {displayImages.map((image, index) => (
              <SwiperSlide key={image.id || index} className={styles.thumbSlide}>
                <div 
                  className={`${styles.thumbWrapper} ${index === activeIndex ? styles.active : ''}`}
                  onClick={() => {
                    if (mainSwiper) {
                      mainSwiper.slideTo(index);
                      setActiveIndex(index);
                    }
                  }}
                >
                  <Image
                    src={image.image_url.startsWith('http') ? image.image_url : `${process.env.NEXT_PUBLIC_API_URL}${image.image_url}`}
                    alt={`${shopName}のサムネイル ${index + 1}`}
                    fill
                    sizes="120px"
                    style={{ objectFit: 'cover' }}
                    className={styles.thumbImage}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}
    </div>
  );
};

export default ShopImageCarousel;