'use client';

import React from 'react';
import { Shop } from '@/types/shops';
import { Wine, Beer, GlassWater, Coffee } from 'lucide-react';
import styles from './style.module.scss';

interface ShopDrinksProps {
  shop: Shop;
}

const ShopDrinks: React.FC<ShopDrinksProps> = ({ shop }) => {
  // サンプルドリンクデータ
  const drinkCategories = [
    {
      id: 1,
      name: 'ウイスキー',
      icon: <Wine size={20} />,
      items: [
        { id: 1, name: '山崎 12年', price: 1800, description: '日本を代表するシングルモルトウイスキー。華やかな香りと複雑な味わい。' },
        { id: 2, name: 'マッカラン 18年', price: 2500, description: 'シェリー樽熟成による豊かな風味と滑らかな口当たり。' },
        { id: 3, name: 'ボウモア 15年', price: 1600, description: 'アイラ島の特徴的なピート香と海の香りが楽しめる一本。' },
      ]
    },
    {
      id: 2,
      name: 'カクテル',
      icon: <GlassWater size={20} />,
      items: [
        { id: 4, name: 'ネグローニ', price: 1200, description: 'ジン、カンパリ、ベルモットをブレンドした伝統的なイタリアンカクテル。' },
        { id: 5, name: 'モヒート', price: 1100, description: 'ラム、ミント、ライム、砂糖、ソーダを使った爽やかな味わい。' },
        { id: 6, name: 'マンハッタン', price: 1300, description: 'ウイスキー、スイートベルモット、ビターズを使ったクラシックカクテル。' },
      ]
    },
    {
      id: 3,
      name: 'ビール',
      icon: <Beer size={20} />,
      items: [
        { id: 7, name: 'クラフトIPA', price: 900, description: '豊かなホップの香りと苦味が特徴的なインディアペールエール。' },
        { id: 8, name: 'ベルギーホワイト', price: 950, description: 'コリアンダーとオレンジピールで香り付けされた軽やかな白ビール。' },
        { id: 9, name: '黒ビール', price: 950, description: 'ローストモルトの風味が豊かな深い味わいのスタウト。' },
      ]
    },
    {
      id: 4,
      name: 'ノンアルコール',
      icon: <Coffee size={20} />,
      items: [
        { id: 10, name: 'モクテル各種', price: 800, description: 'アルコール0%のカクテル。フルーツやハーブを使った様々な味わい。' },
        { id: 11, name: 'クラフトコーラ', price: 600, description: '自家製スパイスシロップを使った本格派コーラ。' },
        { id: 12, name: 'スペシャルティコーヒー', price: 700, description: '厳選した豆を使ったハンドドリップコーヒー。' },
      ]
    }
  ];

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>ドリンクメニュー</h3>
      
      <div className={styles.drinkCategories}>
        {drinkCategories.map((category) => (
          <div key={category.id} className={styles.categorySection}>
            <div className={styles.categoryHeader}>
              <div className={styles.categoryIcon}>{category.icon}</div>
              <h4 className={styles.categoryName}>{category.name}</h4>
            </div>
            
            <div className={styles.drinkList}>
              {category.items.map((drink) => (
                <div key={drink.id} className={styles.drinkItem}>
                  <div className={styles.drinkInfo}>
                    <div className={styles.drinkNamePrice}>
                      <h5 className={styles.drinkName}>{drink.name}</h5>
                      <div className={styles.drinkPrice}>¥{drink.price}</div>
                    </div>
                    <p className={styles.drinkDescription}>{drink.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.menuNote}>
        ※表示価格は税込です。<br />
        ※その他多数のドリンクをご用意しております。お気軽にスタッフにお尋ねください。
      </div>
    </div>
  );
};

export default ShopDrinks;
