'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import styles from './style.module.scss';

interface ShopGridCardProps {
  id: number;
  name: string;
  area: string;
  imageUrl?: string | null;
  onClick?: () => void;
}

const ShopGridCard: React.FC<ShopGridCardProps> = ({
  id,
  name,
  area,
  imageUrl,
  onClick
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/shops/${id}`);
    }
  };

  return (
    <div className={styles.shopGridCard} onClick={handleClick}>
      <div className={styles.imageContainer}>
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name}
            className={styles.shopImage}
          />
        ) : (
          <div className={styles.placeholderImage}>
            <div className={styles.placeholderIcon}>🏪</div>
          </div>
        )}
        <div className={styles.overlay} />
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.shopName}>{name}</h3>
        <div className={styles.areaInfo}>
          <MapPin size={14} className={styles.locationIcon} />
          <span className={styles.areaText}>{area}</span>
        </div>
      </div>
    </div>
  );
};

export default ShopGridCard;
