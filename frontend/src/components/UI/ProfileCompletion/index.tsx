'use client'

import React from 'react';
import { Progress } from '@nextui-org/react';
import { ChartPie } from 'lucide-react';
import styles from './style.module.scss';
import { User as UserType, ProfileOptions, UserAtmospherePreference } from '@/types/users';

interface ProfileCompletionProps {
  userData: UserType;
  profileOptions: ProfileOptions;
  userAtmospherePreferences: UserAtmospherePreference[];
  title?: string;
}

const ProfileCompletion: React.FC<ProfileCompletionProps> = ({ 
  userData, 
  profileOptions, 
  userAtmospherePreferences,
  title = 'プロフィール完成度'
}) => {
  // 全体のプロフィール完成度を計算
  const calculateProfileCompletion = (): number => {
    const fields = [
      // BasicInfo項目
      userData.name,
      userData.introduction,
      userData.gender,
      userData.birthdate,
      userData.my_area,
      userData.avatar,
      
      // 興味（カテゴリ別チェック）
      (() => {
        if (!profileOptions.interests || profileOptions.interests.length === 0) {
          return false;
        }
        const availableCategories = Array.from(new Set(profileOptions.interests.map(interest => interest.category.name)));
        const userCategories = userData.interests 
          ? Array.from(new Set(userData.interests.map(interest => interest.category.name)))
          : [];
        return availableCategories.length > 0 && availableCategories.every(category => userCategories.includes(category));
      })(),
      
      // パーソナリティ
      userData.blood_type,
      userData.mbti,
      
      // 仕事情報
      userData.occupation,
      userData.industry,
      userData.position,
      
      // ライフスタイル
      (() => {
        // お酒の好み（いずれかが設定されていればOK）
        return (userData.alcohol_categories && userData.alcohol_categories.length > 0) ||
               (userData.alcohol_brands && userData.alcohol_brands.length > 0) ||
               (userData.drink_styles && userData.drink_styles.length > 0);
      })(),
      userData.hobbies && userData.hobbies.length > 0,
      userData.exercise_frequency,
      userData.dietary_preference,
      
      // 好みの店舗
      (() => {
        // 雰囲気の好み
        return userAtmospherePreferences && userAtmospherePreferences.length > 0;
      })(),
      userData.budget_range,
      userData.visit_purposes && userData.visit_purposes.length > 0,
    ];
    
    const completedFields = fields.filter(field => field).length;
    return Math.round((completedFields / fields.length) * 100);
  };

  const profileCompletion = calculateProfileCompletion();
  
  // プロフィール完成度に応じたメッセージを取得
  const getCompletionMessage = (completion: number): string => {
    if (completion <= 20) {
      return 'プロフィールの基本情報から始めましょう！';
    } else if (completion <= 40) {
      return '良いスタートです！さらに情報を追加してみましょう';
    } else if (completion <= 60) {
      return '順調に進んでいます！半分以上完成しました';
    } else if (completion <= 80) {
      return 'もう少しです！魅力的なプロフィールに近づいています';
    } else if (completion < 100) {
      return 'あと少しで完璧なプロフィールの完成です！';
    } else {
      return '完璧なプロフィールが完成しました！';
    }
  };

  return (
    <div className={styles.completionSection}>
      <h2 className={styles.completionTitle}>
        <span className={styles.starIcon}>
          <ChartPie strokeWidth={1} />
        </span>
        {title}
      </h2>
      <p className={styles.completionDescription}>
        {profileCompletion}%完成 - {getCompletionMessage(profileCompletion)}
      </p>
      
      <div className={styles.progressContainer}>
        <Progress 
          value={profileCompletion}
          classNames={{
            base: styles.progressBase,
            indicator: styles.progressIndicator,
            label: styles.progressLabel,
            value: styles.progressValue,
            track: styles.progressTrack
          }}
          size="sm"
          showValueLabel={false}
          label=""
        />
        <div className={styles.progressValue}>{profileCompletion}%</div>
      </div>
    </div>
  );
};

export default ProfileCompletion;