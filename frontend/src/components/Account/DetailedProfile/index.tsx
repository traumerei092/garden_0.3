'use client'

import React, { useState } from 'react';
import { Switch, Progress } from '@nextui-org/react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import ChipSelected from '@/components/UI/ChipSelected';
import { User as UserType } from '@/types/users';

interface DetailedProfileProps {
  userData: UserType;
  profileOptions: any; // TODO: 型を正確に定義する
}

const DetailedProfile: React.FC<DetailedProfileProps> = ({ userData, profileOptions }) => {
  // 公開設定の状態
  const [visibilitySettings, setVisibilitySettings] = useState({
    personality: true,
    mbti: true,
    favorites: true,
    work: false,
    lifestyle: true,
    social: false
  });
  
  // 公開設定の切り替え
  const toggleVisibility = (key: string) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };
  
  // プロフィール完成度
  const profileCompletion = 45;
  
  return (
    <div className={styles.detailedProfileContainer}>
      {/* プロフィール完成度 */}
      <div className={styles.completionSection}>
        <h2 className={styles.completionTitle}>プロフィール完成度</h2>
        <p className={styles.completionDescription}>45%完成 - あと少しで魅力的なプロフィールに！</p>
        
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
            size="md"
            showValueLabel={true}
            label=""
          />
          <div className={styles.progressValue}>{profileCompletion}%</div>
        </div>
      </div>
      
      {/* 興味 */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>興味</h3>
          <div className={styles.visibilityControl}>
            <SwitchVisibility
              isSelected={visibilitySettings.favorites}
              onValueChange={() => toggleVisibility('favorites')}
            />
          </div>
        </div>
        
        <div className={styles.interestCategories}>
          {userData.interests && userData.interests.length > 0 ? (
            (() => {
              // 興味をカテゴリ別にグループ化
              const groupedInterests = userData.interests.reduce((acc, interest) => {
                const categoryName = interest.category.name;
                if (!acc[categoryName]) {
                  acc[categoryName] = [];
                }
                acc[categoryName].push(interest);
                return acc;
              }, {} as Record<string, typeof userData.interests>);

              return Object.entries(groupedInterests).map(([categoryName, interests]) => (
                <div key={categoryName} className={styles.interestCategory}>
                  <h4 className={styles.categoryTitle}>{categoryName}</h4>
                  <div className={styles.interestTags}>
                    {interests.map((interest) => (
                      <ChipSelected key={interest.id} styleName={styles.interestTag}>
                        {interest.name}
                      </ChipSelected>
                    ))}
                  </div>
                </div>
              ));
            })()
          ) : (
            <div className={styles.noDataMessage}>
              興味が設定されていません
            </div>
          )}

          <ButtonGradientWrapper anotherStyle={styles.addInterestButton} onClick={() => {}}>
            <Plus size={16} />
            興味を追加する
          </ButtonGradientWrapper>
        </div>
      </div>
      
      {/* パーソナリティ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>パーソナリティ</h3>
          <div className={styles.visibilityControl}>
            <SwitchVisibility
              isSelected={visibilitySettings.personality}
              onValueChange={() => toggleVisibility('personality')}
            />
          </div>
        </div>
        
        <div className={styles.personalityItem}>
          <div className={styles.personalityLabel}>血液型</div>
          <div className={styles.personalityValue}>
            {userData.blood_type ? userData.blood_type.name : '未設定'}
          </div>
          <div className={styles.personalityInfo}>
            <span className={styles.infoIcon}>💡</span>
            <span className={styles.infoText}>血液型を設定すると、相性診断が利用できます</span>
          </div>
        </div>
        
        <div className={styles.personalityItem}>
          <div className={styles.personalityLabel}>MBTI</div>
          <div className={styles.personalityValue}>
            {userData.mbti ? userData.mbti.name : '未設定'}
          </div>
          <div className={styles.personalityInfo}>
            <span className={styles.infoIcon}>💡</span>
            <span className={styles.infoText}>性格タイプを設定すると、相性の良い人を見つけやすくなります</span>
          </div>
        </div>
      </div>
      
      {/* 仕事情報 */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>仕事情報</h3>
          <div className={styles.visibilityControl}>
            <SwitchVisibility
              isSelected={visibilitySettings.work}
              onValueChange={() => toggleVisibility('work')}
            />
          </div>
        </div>
        
        <div className={styles.workItem}>
          <div className={styles.workLabel}>仕事情報</div>
          <div className={styles.workValue}>
            {userData.work_info || '未設定'}
          </div>
        </div>
      </div>
      
      {/* ライフスタイル */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>ライフスタイル</h3>
          <div className={styles.visibilityControl}>
            <SwitchVisibility
              isSelected={visibilitySettings.lifestyle}
              onValueChange={() => toggleVisibility('lifestyle')}
            />
          </div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>好きなお酒</div>
          <div className={styles.lifestyleValue}>
            {userData.alcohols && userData.alcohols.length > 0 
              ? userData.alcohols.map(alcohol => alcohol.name).join('、') 
              : '未設定'}
          </div>
          <div className={styles.lifestyleInfo}>
            <span className={styles.infoIcon}>🍷</span>
            <span className={styles.infoText}>お酒の好みを設定すると、お店選びの参考になります</span>
          </div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>趣味</div>
          <div className={styles.lifestyleValue}>
            {userData.hobbies && userData.hobbies.length > 0 
              ? userData.hobbies.map(hobby => hobby.name).join('、') 
              : '未設定'}
          </div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>運動</div>
          <div className={styles.lifestyleValue}>
            {userData.exercise_habits && userData.exercise_habits.length > 0 
              ? userData.exercise_habits.map(habit => habit.name).join('、') 
              : '未設定'}
          </div>
        </div>
      </div>
      
      {/* 交友関係 */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>交友関係</h3>
          <div className={styles.visibilityControl}>
            <SwitchVisibility
              isSelected={visibilitySettings.social}
              onValueChange={() => toggleVisibility('social')}
            />
          </div>
        </div>
        
        <div className={styles.socialPreferences}>
          <h4 className={styles.socialTitle}>交友関係の好み</h4>
          <div className={styles.socialTags}>
            {userData.social_preferences && userData.social_preferences.length > 0 ? (
              userData.social_preferences.map((pref) => (
                <span key={pref.id} className={styles.socialTag}>{pref.name}</span>
              ))
            ) : (
              <div className={styles.noDataMessage}>
                交友関係の好みが設定されていません
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 登録していない項目のレコメンド */}
      <div className={styles.recommendSection}>
        <h3 className={styles.recommendTitle}>
          <span className={styles.starIcon}>⭐</span> プロフィールを充実させましょう
        </h3>
        
        <div className={styles.recommendGrid}>
          <div className={styles.recommendItem}>
            <div className={styles.recommendContent}>
              <h4 className={styles.recommendLabel}>血液型</h4>
              <p className={styles.recommendDescription}>相性診断が利用できます</p>
            </div>
            <ButtonGradientWrapper anotherStyle={styles.addButton} onClick={() => {}}>
              <Plus size={14} />
              追加する
            </ButtonGradientWrapper>
          </div>
          
          <div className={styles.recommendItem}>
            <div className={styles.recommendContent}>
              <h4 className={styles.recommendLabel}>MBTI</h4>
              <p className={styles.recommendDescription}>性格マッチングの精度が向上します</p>
            </div>
            <ButtonGradientWrapper anotherStyle={styles.addButton} onClick={() => {}}>
              <Plus size={14} />
              追加する
            </ButtonGradientWrapper>
          </div>
          
          <div className={styles.recommendItem}>
            <div className={styles.recommendContent}>
              <h4 className={styles.recommendLabel}>職業</h4>
              <p className={styles.recommendDescription}>同業者との出会いが増えます</p>
            </div>
            <ButtonGradientWrapper anotherStyle={styles.addButton} onClick={() => {}}>
              <Plus size={14} />
              追加する
            </ButtonGradientWrapper>
          </div>
        </div>
        
        <ButtonGradientWrapper anotherStyle={styles.editButton} onClick={() => {}}>
          編集する
        </ButtonGradientWrapper>
      </div>
    </div>
  );
};

export default DetailedProfile;
