'use client';

import React from 'react';
import { Shop } from '@/types/shops';
import { Clock, Phone, MapPin, Users, Train, CreditCard, Store, LayoutDashboard, OptionIcon, Coins, Edit, FileClock } from 'lucide-react';
import ChipCondition from '@/components/UI/ChipCondition';
import { ScrollShadow, Link } from '@nextui-org/react';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import styles from './style.module.scss';
import { useShopModalStore } from '@/store/useShopModalStore';

interface ShopBasicInfoProps {
  shop: Shop;
}

const ShopBasicInfo: React.FC<ShopBasicInfoProps> = ({ shop }) => {
  const { openEditModal, openHistoryModal } = useShopModalStore();
  // ChipConditionを表示するための関数
  const renderChips = (items: any[], category: 'type' | 'layout' | 'option') => {
    if (!items || items.length === 0) return null;
    
    // データが文字列の配列の場合とオブジェクトの配列の場合を両方対応
    return items.map((item, index) => {
      const displayName = typeof item === 'string' ? item : item.name;
      const key = typeof item === 'string' ? `${category}-${index}` : `${category}-${item.id}`;
      
      return (
        <ChipCondition key={key} category={category}>
          {displayName}
        </ChipCondition>
      );
    });
  };

  // 営業時間を曜日ごとにグループ化する関数
  const formatBusinessHours = () => {
    if (!shop.business_hours || shop.business_hours.length === 0) {
      return null;
    }

    // 曜日の表示順序を定義
    const weekdayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'hol'];
    
    // 営業時間を曜日でソート
    const sortedHours = [...shop.business_hours].sort((a, b) => {
      return weekdayOrder.indexOf(a.weekday) - weekdayOrder.indexOf(b.weekday);
    });

    // 同じ営業時間のグループを作成
    const hourGroups: { [key: string]: string[] } = {};
    
    sortedHours.forEach(hour => {
      if (hour.is_closed) {
        // 定休日の場合
        const key = 'closed';
        if (!hourGroups[key]) hourGroups[key] = [];
        hourGroups[key].push(hour.weekday);
      } else if (hour.open_time && hour.close_time) {
        // 営業時間がある場合
        const key = `${hour.open_time}-${hour.close_time}`;
        if (!hourGroups[key]) hourGroups[key] = [];
        hourGroups[key].push(hour.weekday);
      }
    });

    // 曜日の表示名を取得
    const getWeekdayDisplay = (weekday: string) => {
      const weekdayMap: { [key: string]: string } = {
        mon: '月', tue: '火', wed: '水', thu: '木', 
        fri: '金', sat: '土', sun: '日', hol: '祝'
      };
      return weekdayMap[weekday] || weekday;
    };

    // 連続する曜日をまとめる
    const formatWeekdays = (weekdays: string[]) => {
      if (weekdays.length === 0) return '';
      
      // 曜日を表示順にソート
      weekdays.sort((a, b) => weekdayOrder.indexOf(a) - weekdayOrder.indexOf(b));
      
      const result: string[] = [];
      let start = 0;
      
      for (let i = 1; i <= weekdays.length; i++) {
        // 連続していない場合またはループ終了時
        if (i === weekdays.length || 
            weekdayOrder.indexOf(weekdays[i]) !== weekdayOrder.indexOf(weekdays[i-1]) + 1) {
          
          if (start === i - 1) {
            // 単一の曜日
            result.push(getWeekdayDisplay(weekdays[start]));
          } else {
            // 連続した曜日
            result.push(`${getWeekdayDisplay(weekdays[start])}〜${getWeekdayDisplay(weekdays[i-1])}`);
          }
          start = i;
        }
      }
      
      return result.join('・');
    };

    // 結果を表示用に整形
    return Object.entries(hourGroups).map(([key, weekdays]) => {
      const weekdayText = formatWeekdays(weekdays);
      
      if (key === 'closed') {
        return { days: weekdayText, time: '定休日' };
      } else {
        const [open, close] = key.split('-');
        return { days: weekdayText, time: `${open}-${close}` };
      }
    });
  };

  const businessHours = formatBusinessHours();

  return (
    <div className={styles.container}>
      <div className={styles.sectionTitle}>
        基本情報
        <div className={styles.editActions}>
          <Link 
            className={styles.editBasicInfoLink}
            onPress={openHistoryModal}
          >
            <FileClock size={16} strokeWidth={1} />
            <span className={styles.editBasicInfo}>編集履歴</span>
          </Link>
          <ButtonGradientWrapper
            onClick={openEditModal}
            anotherStyle={styles.editButton}
          >
            <Edit size={16} />
            基本情報を修正する
          </ButtonGradientWrapper>
        </div>
      </div>
      
      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <Clock size={18} strokeWidth={1}/>
            <h4>営業時間</h4>
          </div>
          <div className={styles.infoContent}>
            {businessHours && businessHours.length > 0 ? (
              <div>
                {businessHours.map((hour, index) => (
                  <div key={index} className={styles.businessHourRow}>
                    <div className={styles.days}>{hour.days}:</div>
                    <div className={styles.time}>{hour.time}</div>
                  </div>
                ))}
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
            <p>{shop.phone_number || '情報がありません'}</p>
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <MapPin size={18} strokeWidth={1}/>
            <h4>住所</h4>
          </div>
          <div className={styles.infoContent}>
            <div>
              {shop.zip_code && `〒${shop.zip_code}`}<br />
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
            {shop.payment_methods && shop.payment_methods.length > 0 ? (
              <p>
                {shop.payment_methods.map(method => method.name).join('・')}
              </p>
            ) : (
              <p>情報がありません</p>
            )}
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <Users size={18} strokeWidth={1}/>
            <h4>座席数</h4>
          </div>
          <div className={styles.infoContent}>
            <p>{shop.capacity ? `${shop.capacity}席` : '情報がありません'}</p>
          </div>
        </div>
        
        <div className={styles.infoItem}>
          <div className={styles.infoHeader}>
            <Train size={18} strokeWidth={1}/>
            <h4>アクセス</h4>
          </div>
          <div className={styles.infoContent}>
            <p>{shop.access || '情報がありません'}</p>
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
            <div className={styles.budgetValue}>
              {shop.budget_weekday_min && shop.budget_weekday_max 
                ? `¥${shop.budget_weekday_min.toLocaleString()} - ¥${shop.budget_weekday_max.toLocaleString()}`
                : '情報がありません'
              }
            </div>
          </div>
          <div className={styles.budgetRow}>
            <div className={styles.budgetLabel}>週末</div>
            <div className={styles.budgetValue}>
              {shop.budget_weekend_min && shop.budget_weekend_max 
                ? `¥${shop.budget_weekend_min.toLocaleString()} - ¥${shop.budget_weekend_max.toLocaleString()}`
                : '情報がありません'
              }
            </div>
          </div>
          {shop.budget_note && (
            <div className={styles.budgetNote}>
              {shop.budget_note}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopBasicInfo;
