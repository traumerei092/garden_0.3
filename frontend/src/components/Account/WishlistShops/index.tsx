'use client'

import React, { useState } from 'react';
import { Switch, Button } from '@nextui-org/react';
import { Eye, EyeOff, MapPin, Plus, Heart } from 'lucide-react';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import SwitchVisibility from '@/components/UI/SwitchVisibility';

const WishlistShops = () => {
  // 公開設定の状態
  const [isPublic, setIsPublic] = useState(true);
  
  // サンプルデータ
  const wishlistShops = [
    {
      id: 1,
      name: 'The SG Club',
      area: '六本木',
      tags: ['ラウンジ', 'クラブ', 'フードあり'],
      layouts: ['ハイテーブル', 'オープンテラス'],
      options: ['フードあり'],
      image: '/assets/picture/bar_people.jpg'
    },
    {
      id: 2,
      name: 'すし佐竹',
      area: '神楽坂',
      tags: ['寿司屋', 'カウンター', '高級'],
      layouts: ['カウンター'],
      options: [],
      image: '/assets/picture/sample-dining-1.jpg'
    }
  ];

  // おすすめ店舗のサンプルデータ
  const recommendedShops = [
    {
      id: 3,
      name: 'フレンチ・レストラン Lumière',
      area: '恵比寿',
      rating: 4.8,
      image: '/assets/picture/sample-restaurant-1.jpg'
    },
    {
      id: 4,
      name: 'Craft Beer Bar ANTENNA',
      area: '渋谷',
      rating: 4.6,
      image: '/assets/picture/bar.jpg'
    }
  ];

  return (
    <div className={styles.wishlistShopsContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>行きたいお店</h2>
        <p className={styles.sectionDescription}>気になるお店をウィッシュリストで管理</p>
        
        <div className={styles.controlsRow}>
          <div className={styles.visibilityControl}>
            <span>公開設定</span>
            <SwitchVisibility
              isSelected={isPublic}
              onValueChange={setIsPublic}
            />
          </div>
          
          <ButtonGradientWrapper anotherStyle={styles.addButton} onClick={() => {}}>
            <Plus size={16} />
            お店を追加
          </ButtonGradientWrapper>
        </div>
      </div>
      
      <div className={styles.shopsGrid}>
        {wishlistShops.map(shop => (
          <div key={shop.id} className={styles.shopCard}>
            <div className={styles.shopImageContainer}>
              <img src={shop.image} alt={shop.name} className={styles.shopImage} />
              <div className={styles.shopFavorite}>
                <Heart size={16} fill="#FF6B8B" color="#FF6B8B" />
              </div>
            </div>
            
            <div className={styles.shopInfo}>
              <h3 className={styles.shopName}>{shop.name}</h3>
              <p className={styles.shopArea}>
                <MapPin size={14} />
                {shop.area}
              </p>
              
              <div className={styles.shopTags}>
                {shop.tags.slice(0, 3).map((tag, index) => (
                  <span key={index} className={styles.tag}>{tag}</span>
                ))}
              </div>
              
              <div className={styles.shopLayouts}>
                <h4>レイアウト</h4>
                <div className={styles.layoutTags}>
                  {shop.layouts.map((layout, index) => (
                    <span key={index} className={styles.layoutTag}>{layout}</span>
                  ))}
                </div>
              </div>
              
              {shop.options.length > 0 && (
                <div className={styles.shopOptions}>
                  <h4>オプション</h4>
                  <div className={styles.optionTags}>
                    {shop.options.map((option, index) => (
                      <span key={index} className={styles.optionTag}>{option}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        <div className={styles.addShopCard}>
          <div className={styles.addShopContent}>
            <div className={styles.addIconContainer}>
              <Heart size={32} />
            </div>
            <h3>気になるお店を追加</h3>
            <p>行ってみたいお店を保存して、一緒に行く人を見つけましょう</p>
          </div>
        </div>
      </div>
      
      {/* おすすめのお店セクション */}
      <div className={styles.recommendedSection}>
        <h3 className={styles.recommendedTitle}>あなたにおすすめのお店</h3>
        
        <div className={styles.recommendedGrid}>
          {recommendedShops.map(shop => (
            <div key={shop.id} className={styles.recommendedCard}>
              <div className={styles.recommendedImageContainer}>
                <img src={shop.image} alt={shop.name} className={styles.recommendedImage} />
              </div>
              
              <div className={styles.recommendedInfo}>
                <h4 className={styles.recommendedName}>{shop.name}</h4>
                <p className={styles.recommendedArea}>{shop.area} • {'★'.repeat(Math.floor(shop.rating))} {shop.rating}</p>
                
                <ButtonGradientWrapper anotherStyle={styles.wishlistButton} onClick={() => {}}>
                  <Plus size={14} />
                  ウィッシュリストに追加
                </ButtonGradientWrapper>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistShops;
