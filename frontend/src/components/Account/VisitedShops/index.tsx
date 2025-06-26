'use client'

import React, { useState } from 'react';
import { Switch, Button } from '@nextui-org/react';
import { Eye, EyeOff, MapPin, Plus } from 'lucide-react';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import SwitchVisibility from '@/components/UI/SwitchVisibility';

const VisitedShops = () => {
  // 公開設定の状態
  const [isPublic, setIsPublic] = useState(true);
  
  // サンプルデータ
  const visitedShops = [
    {
      id: 1,
      name: 'Bar Lupin',
      area: '銀座',
      tags: ['カクテルバー', '立ち飲み屋', 'フードあり'],
      layouts: ['カウンター', 'テーブル席'],
      options: ['フードあり'],
      image: '/assets/picture/bar.jpg'
    },
    {
      id: 2,
      name: '鮨 次郎',
      area: '築地',
      tags: ['寿司屋', 'カウンター', '高級'],
      layouts: ['カウンター'],
      options: [],
      image: '/assets/picture/sample-restaurant-1.jpg'
    },
    {
      id: 3,
      name: 'The SG Club',
      area: '六本木',
      tags: ['クラブ', 'ハイテーブル', 'フードあり'],
      layouts: ['カウンター', 'ハイテーブル', 'オープンテラス'],
      options: ['フードあり'],
      image: '/assets/picture/bar_people.jpg'
    }
  ];

  return (
    <div className={styles.visitedShopsContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>行ったお店</h2>
        <p className={styles.sectionDescription}>あなたが訪れたお店を管理できます</p>
        
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
        {visitedShops.map(shop => (
          <div key={shop.id} className={styles.shopCard}>
            <div className={styles.shopImageContainer}>
              <img src={shop.image} alt={shop.name} className={styles.shopImage} />
              <div className={styles.shopFavorite}>
                <span className={styles.starIcon}>★</span>
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
              <Plus size={32} />
            </div>
            <h3>新しいお店を追加</h3>
            <p>行ったお店を追加して、プロフィールを充実させましょう</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitedShops;
