'use client';

import React from 'react';
import { Shop } from '@/types/shops';
import { Clock, Phone, MapPin, Users, Train, CreditCard, Store, LayoutDashboard, OptionIcon, Coins } from 'lucide-react';
import ChipCondition from '@/components/UI/ChipCondition';
import { ScrollShadow } from '@nextui-org/react';
import styles from './style.module.scss';

interface ShopBasicInfoProps {
  shop: Shop;
}

const ShopBasicInfo: React.FC<ShopBasicInfoProps> = ({ shop }) => {
  // 設備・サービスのサンプルデータ
  const facilities = [
    { id: 1, name: 'Free WiFi' },
    { id: 2, name: '喫煙可' },
    { id: 3, name: 'カード決済' },
    { id: 4, name: '貸切可' },
  ];

  // ChipConditionを表示するための関数
  const renderChips = (items: any[], category: 'type' | 'layout' | 'option') => {
    return items.map((item) => (
      <ChipCondition key={`${category}-${item.id}`} category={category}>
        {item.name}
      </ChipCondition>
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.sectionTitle}>基本情報</div>
      
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <Clock size={18} strokeWidth={1}/>
            <h4>営業時間</h4>
          </div>
          <div className={styles.infoContent}>
            {shop.business_hours ? (
              <div>
                <div className={styles.businessHourRow}>
                  <div className={styles.days}>月〜木:</div>
                  <div className={styles.time}>18:00-02:00</div>
                </div>
                <div className={styles.businessHourRow}>
                  <div className={styles.days}>金・土:</div>
                  <div className={styles.time}>18:00-03:00</div>
                </div>
                <div className={styles.businessHourRow}>
                  <div className={styles.days}>日:</div>
                  <div className={styles.time}>18:00-00:00</div>
                </div>
              </div>
            ) : (
              <p className={styles.noData}>営業時間情報がありません</p>
            )}
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <Phone size={18} strokeWidth={1}/>
            <h4>電話番号</h4>
          </div>
          <div className={styles.infoContent}>
            <p>092-751-8888</p>
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <MapPin size={18} strokeWidth={1}/>
            <h4>住所</h4>
          </div>
          <div className={styles.infoContent}>
            <div>
              〒810-0021<br />
              {shop.prefecture} {shop.city} {shop.area} {shop.street} {shop.building}
            </div>
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <CreditCard size={18} strokeWidth={1}/>
            <h4>支払い方法</h4>
          </div>
          <div className={styles.infoContent}>
            <p>
              現金・クレジットカード<br />
              PayPay・楽天Pay対応
            </p>
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <Users size={18} strokeWidth={1}/>
            <h4>座数</h4>
          </div>
          <div className={styles.infoContent}>
            <p>
              カウンター: 8席<br />
              テーブル: 2席（4名様）
            </p>
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <Train size={18} strokeWidth={1}/>
            <h4>アクセス</h4>
          </div>
          <div className={styles.infoContent}>
            <p>
              西鉄天神大牟田線<br />
              西鉄福岡（天神）駅より徒歩5分
            </p>
          </div>
        </div>
      </div>

      <div className={styles.facilitiesSection}>
        <div className={styles.infoHeader}>
          <Store size={18} strokeWidth={1}/>
          <h4>店舗タイプ</h4>
        </div>
        <ScrollShadow className={styles.chipWrapper}>
          {shop.shop_types && shop.shop_types.length > 0 ? (
            renderChips(shop.shop_types, 'type')
          ) : (
            <div className={styles.noFacilities}>設備・サービス情報がありません</div>
          )}
        </ScrollShadow>
      </div>

      <div className={styles.facilitiesSection}>
        <div className={styles.infoHeader}>
          <LayoutDashboard size={18} strokeWidth={1}/>
          <h4>レイアウト</h4>
        </div>
        <ScrollShadow className={styles.chipWrapper}>
          {shop.shop_layouts && shop.shop_layouts.length > 0 ? (
            renderChips(shop.shop_layouts, 'layout')
          ) : (
            <div className={styles.noFacilities}>設備・サービス情報がありません</div>
          )}
        </ScrollShadow>
      </div>
      
      <div className={styles.facilitiesSection}>
        <div className={styles.infoHeader}>
          <OptionIcon size={18} strokeWidth={1}/>
          <h4>オプション</h4>
        </div>
        <ScrollShadow className={styles.chipWrapper}>
          {shop.shop_options && shop.shop_options.length > 0 ? (
            renderChips(shop.shop_options, 'option')
          ) : (
            <div className={styles.noFacilities}>登録されていません</div>
          )}
        </ScrollShadow>
      </div>
      
      <div className={styles.budgetSection}>
        <div className={styles.infoHeader}>
          <Coins size={18} strokeWidth={1}/>
          <h4>予算目安</h4>
        </div>
        <div className={styles.budgetContent}>
          <div className={styles.budgetRow}>
            <div className={styles.budgetLabel}>平日</div>
            <div className={styles.budgetValue}>¥3,000 - ¥5,000</div>
          </div>
          <div className={styles.budgetRow}>
            <div className={styles.budgetLabel}>週末</div>
            <div className={styles.budgetValue}>¥4,000 - ¥6,000</div>
          </div>
          <div className={styles.budgetNote}>
            ※お一人様あたりの目安料金（お酒3-4杯程度）
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopBasicInfo;
