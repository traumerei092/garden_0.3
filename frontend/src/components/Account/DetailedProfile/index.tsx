'use client'

import React, { useState } from 'react';
import { Switch, Progress } from '@nextui-org/react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import ChipSelected from '@/components/UI/ChipSelected';

const DetailedProfile = () => {
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
        
        <div className={styles.interestTags}>
          <ChipSelected styleName={styles.interestTag}>
            🍸カクテルバー
          </ChipSelected>
          <ChipSelected styleName={styles.interestTag}>
            🍣立ち飲み屋
          </ChipSelected>
          <ChipSelected styleName={styles.interestTag}>
            🎮オンラインゲーム
          </ChipSelected>
          <ChipSelected styleName={styles.interestTag}>
            🎭アート
          </ChipSelected>
          <ChipSelected styleName={styles.interestTag}>
            🏃ジム、ヨガ
          </ChipSelected>

          <ButtonGradientWrapper anotherStyle={styles.addInterestButton} onClick={() => {}}>
            <Plus size={16} />
            興味を追加する
          </ButtonGradientWrapper>
        </div>
        
        <p className={styles.interestDescription}>
          <span className={styles.infoIcon}>🎵</span> 共通の興味があると、相性の良い人を見つけやすくなります
        </p>
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
          <div className={styles.personalityValue}>例: AB型</div>
          <div className={styles.personalityInfo}>
            <span className={styles.infoIcon}>💡</span>
            <span className={styles.infoText}>血液型を設定すると、相性診断が利用できます</span>
          </div>
        </div>
        
        <div className={styles.personalityItem}>
          <div className={styles.personalityLabel}>MBTI</div>
          <div className={styles.personalityValue}>例: ENFP</div>
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
          <div className={styles.workLabel}>職業</div>
          <div className={styles.workValue}>例: エンジニア</div>
        </div>
        
        <div className={styles.workItem}>
          <div className={styles.workLabel}>業種</div>
          <div className={styles.workValue}>例: IT・インターネット</div>
        </div>
        
        <div className={styles.workItem}>
          <div className={styles.workLabel}>役職</div>
          <div className={styles.workValue}>例: マネージャー</div>
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
          <div className={styles.lifestyleValue}>例: ワイン、日本酒</div>
          <div className={styles.lifestyleInfo}>
            <span className={styles.infoIcon}>🍷</span>
            <span className={styles.infoText}>お酒の好みを設定すると、お店選びの参考になります</span>
          </div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>趣味</div>
          <div className={styles.lifestyleValue}>例: 読書、映画鑑賞</div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>運動</div>
          <div className={styles.lifestyleValue}>例: ジム、ヨガ</div>
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
          <h4 className={styles.socialTitle}>交友関係で求めるもの</h4>
          <div className={styles.socialTags}>
            <span className={styles.socialTag}>友達</span>
            <span className={styles.socialTag}>恋人</span>
            <span className={styles.socialTag}>趣味仲間</span>
            <span className={styles.socialTag}>飲み友達</span>
            <span className={styles.socialTag}>一緒に成長できる人</span>
          </div>
        </div>
        
        <div className={styles.socialPreferences}>
          <h4 className={styles.socialTitle}>理想の関係</h4>
          <div className={styles.socialTags}>
            <span className={styles.socialTag}>お互いを尊重</span>
            <span className={styles.socialTag}>二人に笑える</span>
            <span className={styles.socialTag}>価値観が合う</span>
            <span className={styles.socialTag}>刺激し合える</span>
            <span className={styles.socialTag}>支え合える</span>
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
