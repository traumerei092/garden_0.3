'use client'

import React, { useState, useEffect } from 'react';
import { Switch, Progress } from '@nextui-org/react';
import { Eye, EyeOff, Plus } from 'lucide-react';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import ChipSelected from '@/components/UI/ChipSelected';
import EditableField from '@/components/UI/EditableField';
import EditableSelect from '@/components/UI/EditableSelect';
import { User as UserType, ProfileOptions, AtmosphereIndicator, UserAtmospherePreference } from '@/types/users';
import { updateProfileField } from '@/actions/profile/updateProfileField';
import { showProfileUpdateToast, showErrorToast } from '@/utils/toasts';
import { fetchAtmosphereIndicators, fetchUserAtmospherePreferences } from '@/actions/profile/fetchAtmosphereData';
import InterestsEditModal from '@/components/Account/InterestsEditModal';
import SocialPreferencesEditModal from '@/components/Account/SocialPreferencesEditModal';
import AlcoholEditModal from '@/components/Account/AlcoholEditModal';
import AtmosphereEditModal from '@/components/Account/AtmosphereEditModal';
import VisitPurposesEditModal from '@/components/Account/VisitPurposesEditModal';

interface DetailedProfileProps {
  userData: UserType;
  profileOptions: ProfileOptions;
  onUserUpdate: (updatedUser: UserType) => void;
}

const DetailedProfile: React.FC<DetailedProfileProps> = ({ userData, profileOptions, onUserUpdate }) => {
  // モーダルの状態管理
  const [isInterestsModalOpen, setIsInterestsModalOpen] = useState(false);
  const [isSocialPreferencesModalOpen, setIsSocialPreferencesModalOpen] = useState(false);
  const [isAlcoholModalOpen, setIsAlcoholModalOpen] = useState(false);
  const [isAtmosphereModalOpen, setIsAtmosphereModalOpen] = useState(false);
  const [isVisitPurposesModalOpen, setIsVisitPurposesModalOpen] = useState(false);
  
  // 雰囲気データの状態管理
  const [atmosphereIndicators, setAtmosphereIndicators] = useState<AtmosphereIndicator[]>([]);
  const [userAtmospherePreferences, setUserAtmospherePreferences] = useState<UserAtmospherePreference[]>([]);
  const [isLoadingAtmosphere, setIsLoadingAtmosphere] = useState(true);
  
  // 編集モードの状態管理
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());
  
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
  
  // プロフィール完成度を動的に計算
  const calculateProfileCompletion = (): number => {
    const fields = [
      userData.introduction,
      userData.gender,
      userData.birthdate,
      userData.my_area,
      userData.work_info,
      userData.blood_type,
      userData.mbti,
      userData.interests && userData.interests.length > 0,
      userData.alcohols && userData.alcohols.length > 0,
      userData.hobbies && userData.hobbies.length > 0,
      userData.exercise_habits && userData.exercise_habits.length > 0,
      userData.social_preferences && userData.social_preferences.length > 0,
    ];
    
    const completedFields = fields.filter(field => field).length;
    return Math.round((completedFields / fields.length) * 100);
  };
  
  const profileCompletion = calculateProfileCompletion();
  
  // 雰囲気データを取得
  useEffect(() => {
    const loadAtmosphereData = async () => {
      setIsLoadingAtmosphere(true);
      try {
        const [indicatorsResult, preferencesResult] = await Promise.all([
          fetchAtmosphereIndicators(),
          fetchUserAtmospherePreferences()
        ]);

        if (indicatorsResult.success && indicatorsResult.data) {
          setAtmosphereIndicators(indicatorsResult.data);
        }

        if (preferencesResult.success && preferencesResult.data) {
          setUserAtmospherePreferences(preferencesResult.data);
        }
      } catch (error) {
        console.error('雰囲気データの取得に失敗しました:', error);
      } finally {
        setIsLoadingAtmosphere(false);
      }
    };

    loadAtmosphereData();
  }, []);

  // プロフィール更新ハンドラー
  const handleProfileUpdate = async (field: string, value: string | number) => {
    try {
      const updateData = { [field]: value };
      const result = await updateProfileField(updateData);
      
      if (result.success && result.data) {
        onUserUpdate(result.data);
        showProfileUpdateToast();
      } else {
        showErrorToast(result.error || 'プロフィールの更新に失敗しました');
      }
    } catch (error) {
      showErrorToast('ネットワークエラーが発生しました');
    }
  };

  // 雰囲気の好みを更新後にデータを再取得
  const handleAtmosphereUpdate = async () => {
    try {
      const preferencesResult = await fetchUserAtmospherePreferences();
      if (preferencesResult.success && preferencesResult.data) {
        setUserAtmospherePreferences(preferencesResult.data);
      }
    } catch (error) {
      console.error('雰囲気データの再取得に失敗しました:', error);
    }
  };

  // スコアに基づいて説明テキストを取得
  const getScoreDescription = (indicator: AtmosphereIndicator, score: number): string => {
    switch (score) {
      case -2:
        return indicator.description_left;
      case -1:
        return `やや${indicator.description_left}`;
      case 0:
        return 'どちらでも';
      case 1:
        return `やや${indicator.description_right}`;
      case 2:
        return indicator.description_right;
      default:
        return 'どちらでも';
    }
  };
  
  return (
    <>
      <div className={styles.detailedProfileContainer}>
      {/* プロフィール完成度 */}
      <div className={styles.completionSection}>
        <h2 className={styles.completionTitle}>プロフィール完成度</h2>
        <p className={styles.completionDescription}>{profileCompletion}%完成 - あと少しで魅力的なプロフィールに！</p>
        
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
          {editingFields.has('interests') && (
            <div className={styles.visibilityControl}>
              <SwitchVisibility
                isSelected={visibilitySettings.favorites}
                onValueChange={() => toggleVisibility('favorites')}
              />
            </div>
          )}
          <ButtonGradientWrapper anotherStyle={styles.addInterestButton} onClick={() => setIsInterestsModalOpen(true)}>
            <Plus size={16} />
            興味を編集する
          </ButtonGradientWrapper>
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

          
        </div>
      </div>
      
      {/* パーソナリティ */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>パーソナリティ</h3>
          {(editingFields.has('blood_type') || editingFields.has('mbti')) && (
            <div className={styles.visibilityControl}>
              <SwitchVisibility
                isSelected={visibilitySettings.personality}
                onValueChange={() => toggleVisibility('personality')}
              />
            </div>
          )}
        </div>
        
        <div className={styles.personalityItem}>
          <div className={styles.personalityLabel}>血液型</div>
          <div className={styles.personalityValue}>
            <EditableSelect
              value={userData.blood_type?.id ? String(userData.blood_type.id) : null}
              options={profileOptions.blood_types}
              onSave={(value) => handleProfileUpdate('blood_type_id', parseInt(value))}
              placeholder="血液型を選択"
              className={styles.editableField}
            />
          </div>
          <div className={styles.personalityInfo}>
            <span className={styles.infoIcon}>💡</span>
            <span className={styles.infoText}>血液型を設定すると、相性診断が利用できます</span>
          </div>
        </div>
        
        <div className={styles.personalityItem}>
          <div className={styles.personalityLabel}>MBTI</div>
          <div className={styles.personalityValue}>
            <EditableSelect
              value={userData.mbti?.id ? String(userData.mbti.id) : null}
              options={profileOptions.mbti_types}
              onSave={(value) => handleProfileUpdate('mbti_id', parseInt(value))}
              placeholder="MBTIを選択"
              className={styles.editableField}
            />
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
          {editingFields.has('work_info') && (
            <div className={styles.visibilityControl}>
              <SwitchVisibility
                isSelected={visibilitySettings.work}
                onValueChange={() => toggleVisibility('work')}
              />
            </div>
          )}
        </div>
        
        <div className={styles.workItem}>
          <div className={styles.workLabel}>職業</div>
          <div className={styles.workValue}>
            <EditableField
              value={userData.occupation || ''}
              onSave={(value) => handleProfileUpdate('occupation', value)}
              placeholder="職業を入力"
              className={styles.editableField}
            />
          </div>
        </div>
        
        <div className={styles.workItem}>
          <div className={styles.workLabel}>業種</div>
          <div className={styles.workValue}>
            <EditableField
              value={userData.industry || ''}
              onSave={(value) => handleProfileUpdate('industry', value)}
              placeholder="業種を入力"
              className={styles.editableField}
            />
          </div>
        </div>
        
        <div className={styles.workItem}>
          <div className={styles.workLabel}>役職</div>
          <div className={styles.workValue}>
            <EditableField
              value={userData.position || ''}
              onSave={(value) => handleProfileUpdate('position', value)}
              placeholder="役職を入力"
              className={styles.editableField}
            />
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
        
        <div className={styles.alcoholSection}>
          <div className={styles.alcoholHeader}>
            <h4 className={styles.alcoholTitle}>お酒の好み</h4>
            <ButtonGradientWrapper anotherStyle={styles.editAlcoholButton} onClick={() => setIsAlcoholModalOpen(true)}>
              <Plus size={16} />
              お酒の好みを編集
            </ButtonGradientWrapper>
          </div>
          
          {/* お酒のジャンル */}
          <div className={styles.alcoholCategory}>
            <div className={styles.alcoholLabel}>好きなジャンル</div>
            <div className={styles.alcoholTags}>
              {userData.alcohol_categories && userData.alcohol_categories.length > 0 ? (
                userData.alcohol_categories.map((category) => (
                  <ChipSelected key={category.id} styleName={styles.alcoholTag}>
                    {category.name}
                  </ChipSelected>
                ))
              ) : (
                <span className={styles.noDataText}>未設定</span>
              )}
            </div>
          </div>

          {/* お酒の銘柄 */}
          <div className={styles.alcoholCategory}>
            <div className={styles.alcoholLabel}>好きな銘柄</div>
            <div className={styles.alcoholTags}>
              {userData.alcohol_brands && userData.alcohol_brands.length > 0 ? (
                userData.alcohol_brands.map((brand) => (
                  <ChipSelected key={brand.id} styleName={styles.alcoholTag}>
                    {brand.name}
                  </ChipSelected>
                ))
              ) : (
                <span className={styles.noDataText}>未設定</span>
              )}
            </div>
          </div>

          {/* 飲み方・カクテル */}
          <div className={styles.alcoholCategory}>
            <div className={styles.alcoholLabel}>好きな飲み方・カクテル</div>
            <div className={styles.alcoholTags}>
              {userData.drink_styles && userData.drink_styles.length > 0 ? (
                userData.drink_styles.map((style) => (
                  <ChipSelected key={style.id} styleName={styles.alcoholTag}>
                    {style.name}
                  </ChipSelected>
                ))
              ) : (
                <span className={styles.noDataText}>未設定</span>
              )}
            </div>
          </div>

          <div className={styles.lifestyleInfo}>
            <span className={styles.infoIcon}>🍷</span>
            <span className={styles.infoText}>お酒の好みを詳しく設定すると、より良いお店とのマッチングが可能になります</span>
          </div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>趣味</div>
          <div className={styles.lifestyleValue}>
            <EditableField
              value={userData.hobbies && userData.hobbies.length > 0 
                ? userData.hobbies.map(hobby => hobby.name).join('、') 
                : ''}
              onSave={(value) => handleProfileUpdate('hobby_text', value)}
              placeholder="趣味を入力"
              className={styles.editableField}
            />
          </div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>運動頻度</div>
          <div className={styles.lifestyleValue}>
            <EditableSelect
              value={userData.exercise_frequency?.id ? String(userData.exercise_frequency.id) : null}
              options={profileOptions.exercise_frequencies}
              onSave={(value) => handleProfileUpdate('exercise_frequency_id', parseInt(value))}
              placeholder="運動頻度を選択"
              className={styles.editableField}
            />
          </div>
        </div>
        
        <div className={styles.lifestyleItem}>
          <div className={styles.lifestyleLabel}>食事制限・好み</div>
          <div className={styles.lifestyleValue}>
            <EditableSelect
              value={userData.dietary_preference?.id ? String(userData.dietary_preference.id) : null}
              options={profileOptions.dietary_preferences}
              onSave={(value) => handleProfileUpdate('dietary_preference_id', parseInt(value))}
              placeholder="食事制限・好みを選択"
              className={styles.editableField}
            />
          </div>
        </div>
      </div>
      
      {/* 好みの店舗 */}
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>好みの店舗</h3>
          <div className={styles.visibilityControl}>
            <SwitchVisibility
              isSelected={visibilitySettings.social}
              onValueChange={() => toggleVisibility('social')}
            />
          </div>
        </div>
        
        <div className={styles.shopPreferences}>
          <div className={styles.atmosphereSection}>
            <div className={styles.atmosphereSectionHeader}>
              <h4 className={styles.atmosphereTitle}>どういった雰囲気が好みですか？</h4>
              <ButtonGradientWrapper anotherStyle={styles.editAlcoholButton} onClick={() => setIsAtmosphereModalOpen(true)}>
                <Plus size={16} />
                好みの店舗を編集する
              </ButtonGradientWrapper>
            </div>
            <p className={styles.atmosphereDescription}>
              あなたの好みの店舗の雰囲気を設定することで、よりマッチした店舗を見つけやすくなります。
            </p>
            
            <div className={styles.atmospherePreferences}>
              {isLoadingAtmosphere ? (
                <div className={styles.loadingMessage}>
                  雰囲気データを読み込み中...
                </div>
              ) : userAtmospherePreferences.length > 0 ? (
                <div className={styles.atmosphereList}>
                  {atmosphereIndicators.map((indicator) => {
                    const preference = userAtmospherePreferences.find(
                      p => p.indicator.id === indicator.id
                    );
                    
                    if (!preference) return null;
                    
                    return (
                      <div key={indicator.id} className={styles.atmosphereItem}>
                        <div className={styles.atmosphereHeader}>
                          <h5 className={styles.atmosphereName}>{indicator.name}</h5>
                          <div className={styles.atmosphereScore}>
                            <span className={styles.scoreValue}>
                              {getScoreDescription(indicator, preference.score)}
                            </span>
                            <div className={styles.scoreIndicator}>
                              <div className={styles.scoreBar}>
                                <div 
                                  className={styles.scoreGradient}
                                  style={{
                                    background: `linear-gradient(90deg, 
                                      rgba(0, 194, 255, 0.8) 0%, 
                                      rgba(0, 194, 255, 0.1) ${((preference.score + 2) / 4) * 100}%, 
                                      rgba(235, 14, 242, 0.1) ${((preference.score + 2) / 4) * 100}%, 
                                      rgba(235, 14, 242, 0.8) 100%)`
                                  }}
                                />
                                <div 
                                  className={styles.scorePosition}
                                  style={{
                                    left: `${((preference.score + 2) / 4) * 100}%`
                                  }}
                                />
                              </div>
                              <div className={styles.scoreLabels}>
                                <span className={styles.leftLabel}>
                                  {indicator.description_left}
                                </span>
                                <span className={styles.rightLabel}>
                                  {indicator.description_right}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={styles.noDataMessage}>
                  雰囲気の好みが設定されていません
                </div>
              )}
            </div>
            
            
            
            
          </div>
          <div className={styles.budgetSection}>
            <h4 className={styles.budgetTitle}>希望予算</h4>
            <div className={styles.budgetItem}>
              <div className={styles.budgetValue}>
                <EditableSelect
                  value={userData.budget_range?.id ? String(userData.budget_range.id) : null}
                  options={profileOptions.budget_ranges}
                  onSave={(value) => handleProfileUpdate('budget_range_id', parseInt(value))}
                  placeholder="希望予算を選択"
                  className={styles.editableField}
                />
              </div>
            </div>
            <div className={styles.budgetInfo}>
              <span className={styles.infoIcon}>💰</span>
              <span className={styles.infoText}>予算を設定すると、価格帯に合ったお店を見つけやすくなります</span>
            </div>
          </div>
          
          <div className={styles.visitPurposeSection}>
            <div className={styles.visitPurposeHeader}>
              <h4 className={styles.visitPurposeTitle}>利用目的</h4>
              <ButtonGradientWrapper anotherStyle={styles.editAlcoholButton} onClick={() => setIsVisitPurposesModalOpen(true)}>
                <Plus size={16} />
                利用目的を編集
              </ButtonGradientWrapper>
            </div>
            <p className={styles.visitPurposeDescription}>
              どのような目的でお店を利用することが多いですか？複数選択可能です。
            </p>
            <div className={styles.visitPurposeTags}>
              {userData.visit_purposes && userData.visit_purposes.length > 0 ? (
                userData.visit_purposes.map((purpose) => (
                  <ChipSelected key={purpose.id} styleName={styles.visitPurposeTag}>
                    {purpose.name}
                  </ChipSelected>
                ))
              ) : (
                <span className={styles.noDataText}>未設定</span>
              )}
            </div>
            <div className={styles.visitPurposeInfo}>
              <span className={styles.infoIcon}>🎯</span>
              <span className={styles.infoText}>利用目的を設定すると、シーンに合ったお店を見つけやすくなります</span>
            </div>
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
    
    {/* モーダルコンポーネント */}
    {/* 興味編集モーダル */}
    <InterestsEditModal
      isOpen={isInterestsModalOpen}
      onClose={() => setIsInterestsModalOpen(false)}
      user={userData}
      profileOptions={profileOptions}
      onUpdate={onUserUpdate}
    />
    
    {/* 交友関係編集モーダル */}
    <SocialPreferencesEditModal
      isOpen={isSocialPreferencesModalOpen}
      onClose={() => setIsSocialPreferencesModalOpen(false)}
      user={userData}
      profileOptions={profileOptions}
      onUpdate={onUserUpdate}
    />
    
    {/* お酒編集モーダル */}
    <AlcoholEditModal
      isOpen={isAlcoholModalOpen}
      onClose={() => setIsAlcoholModalOpen(false)}
      user={userData}
      profileOptions={profileOptions}
      onUpdate={onUserUpdate}
    />
    
    {/* 雰囲気編集モーダル */}
    <AtmosphereEditModal
      isOpen={isAtmosphereModalOpen}
      onClose={() => setIsAtmosphereModalOpen(false)}
      onUpdate={handleAtmosphereUpdate}
    />
    
    {/* 利用目的編集モーダル */}
    <VisitPurposesEditModal
      isOpen={isVisitPurposesModalOpen}
      onClose={() => setIsVisitPurposesModalOpen(false)}
      user={userData}
      profileOptions={profileOptions}
      onUpdate={onUserUpdate}
    />
    </>
  );
};

export default DetailedProfile;
