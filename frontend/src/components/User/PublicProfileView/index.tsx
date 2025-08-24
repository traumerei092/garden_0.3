'use client'

import React from 'react';
import Image from 'next/image';
import { PublicUserProfile } from '@/types/users';
import ChipSelected from '@/components/UI/ChipSelected';
import { MapPin, Star } from 'lucide-react';
import styles from './style.module.scss';

interface PublicProfileViewProps {
  userProfile: PublicUserProfile;
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ userProfile }) => {
  // スコアに基づいて雰囲気の説明テキストを取得
  const getAtmosphereScoreDescription = (score: number, leftDesc: string, rightDesc: string): string => {
    switch (score) {
      case -2:
        return leftDesc;
      case -1:
        return `やや${leftDesc}`;
      case 0:
        return 'どちらでも';
      case 1:
        return `やや${rightDesc}`;
      case 2:
        return rightDesc;
      default:
        return 'どちらでも';
    }
  };

  // スコアに基づいてスタイルを取得
  const getAtmosphereScoreStyles = (score: number) => {
    switch (score) {
      case -2:
        return {
          borderColor: 'rgba(0, 194, 255, 0.8)',
          color: 'rgba(0, 194, 255, 0.8)',
          backgroundColor: 'rgba(0, 194, 255, 0.1)'
        };
      case -1:
        return {
          borderColor: 'rgba(0, 194, 255, 0.5)',
          color: 'rgba(0, 194, 255, 0.5)',
          backgroundColor: 'rgba(0, 194, 255, 0.1)'
        };
      case 0:
        return {
          color: 'rgba(0, 194, 255, 0.5)',
          backgroundColor: 'linear-gradient(90deg, rgba(0, 194, 255, 0.1) 0%, rgba(235, 14, 242, 0.1) 100%)'
        };
      case 1:
        return {
          borderColor: 'rgba(235, 14, 242, 0.5)',
          color: 'rgba(235, 14, 242, 0.5)',
          backgroundColor: 'rgba(235, 14, 242, 0.1)'
        };
      case 2:
        return {
          borderColor: 'rgba(235, 14, 242, 0.8)',
          color: 'rgba(235, 14, 242, 0.8)',
          backgroundColor: 'rgba(235, 14, 242, 0.1)'
        };
      default:
        return {
          borderColor: 'rgba(0, 194, 255, 0.5)',
          color: 'rgba(0, 194, 255, 0.5)',
          backgroundColor: 'rgba(0, 194, 255, 0.1)'
        };
    }
  };

  return (
    <div className={styles.publicProfileContainer}>
      {/* ヒーローセクション */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGradient} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.avatarContainer}>
            {userProfile.avatar ? (
              <Image
                src={userProfile.avatar}
                alt={`${userProfile.name}のプロフィール画像`}
                width={150}
                height={150}
                className={styles.avatarImage}
                priority
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <span className={styles.avatarInitial}>
                  {userProfile.name?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            )}
          </div>
          <div className={styles.userInfo}>
            <h1 className={styles.userName}>{userProfile.name}</h1>
            <div className={styles.userMeta}>
              {userProfile.age && (
                <span className={styles.metaItem}>
                  {userProfile.age}歳
                </span>
              )}
              {userProfile.gender && (
                <span className={styles.metaItem}>
                  {userProfile.gender}
                </span>
              )}
            </div>
            {userProfile.my_areas && userProfile.my_areas.length > 0 && (
              <div className={styles.heroMyAreas}>
                <div className={styles.heroAreasLabel}>
                  <MapPin size={16} />
                  <span>マイエリア</span>
                </div>
                <div className={styles.heroAreasList}>
                  {userProfile.my_areas.map(area => (
                    <div key={area.id} className={styles.heroAreaChipWrapper}>
                      <span className={styles.heroAreaChip}>
                        {area.get_full_name || area.name}
                      </span>
                      {userProfile.primary_area?.id === area.id && (
                        <Star size={12} className={styles.heroPrimaryIcon} />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {userProfile.introduction && (
              <p className={styles.userIntroduction}>
                {userProfile.introduction}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* プロフィール詳細セクション */}
      <section className={styles.profileContent}>
        <div className={styles.profileGrid}>

          {/* パーソナリティ */}
          {(userProfile.blood_type?.name || userProfile.mbti?.name) && (
            <div className={styles.profileCard}>
              <h3 className={styles.cardTitle}>パーソナリティ</h3>
              <div className={styles.cardContent}>
                {userProfile.blood_type?.name && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>血液型</span>
                    <span className={styles.infoValue}>{userProfile.blood_type.name}</span>
                  </div>
                )}
                {userProfile.mbti?.name && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>MBTI</span>
                    <span className={styles.infoValue}>{userProfile.mbti.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 職業情報 */}
          {(userProfile.occupation || userProfile.industry || userProfile.position) && (
            <div className={styles.profileCard}>
              <h3 className={styles.cardTitle}>職業</h3>
              <div className={styles.cardContent}>
                {userProfile.occupation && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>職業</span>
                    <span className={styles.infoValue}>{userProfile.occupation}</span>
                  </div>
                )}
                {userProfile.industry && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>業種</span>
                    <span className={styles.infoValue}>{userProfile.industry}</span>
                  </div>
                )}
                {userProfile.position && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>役職</span>
                    <span className={styles.infoValue}>{userProfile.position}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 興味 */}
          {userProfile.interests && userProfile.interests.length > 0 && (
            <div className={styles.profileCard}>
              <h3 className={styles.cardTitle}>興味</h3>
              <div className={styles.cardContent}>
                <div className={styles.tagsContainer}>
                  {userProfile.interests
                    .filter(interest => interest?.name)
                    .map((interest) => (
                      <ChipSelected 
                        key={interest.id} 
                        styleName={styles.interestTag}
                      >
                        {interest.name}
                      </ChipSelected>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ライフスタイル */}
          {(userProfile.hobbies?.length > 0 || userProfile.exercise_frequency?.name || userProfile.dietary_preference?.name) && (
            <div className={styles.profileCard}>
              <h3 className={styles.cardTitle}>ライフスタイル</h3>
              <div className={styles.cardContent}>
                {userProfile.hobbies && userProfile.hobbies.length > 0 && (
                  <div className={styles.lifestyleSection}>
                    <h4 className={styles.sectionTitle}>趣味</h4>
                    <div className={styles.tagsContainer}>
                      {userProfile.hobbies
                        .filter(hobby => hobby?.name)
                        .map((hobby) => (
                          <ChipSelected 
                            key={hobby.id} 
                            styleName={styles.hobbyTag}
                          >
                            {hobby.name}
                          </ChipSelected>
                        ))}
                    </div>
                  </div>
                )}
                {userProfile.exercise_frequency?.name && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>運動頻度</span>
                    <span className={styles.infoValue}>{userProfile.exercise_frequency.name}</span>
                  </div>
                )}
                {userProfile.dietary_preference?.name && (
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>食事制限・好み</span>
                    <span className={styles.infoValue}>{userProfile.dietary_preference.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* お酒の好み */}
          {(userProfile.alcohol_categories || userProfile.alcohol_brands || userProfile.drink_styles) && 
           (userProfile.alcohol_categories?.length || userProfile.alcohol_brands?.length || userProfile.drink_styles?.length) && (
            <div className={styles.profileCard}>
              <h3 className={styles.cardTitle}>お酒の好み</h3>
              <div className={styles.cardContent}>
                {userProfile.alcohol_categories && userProfile.alcohol_categories.length > 0 && (
                  <div className={styles.alcoholSection}>
                    <h4 className={styles.sectionTitle}>好きなジャンル</h4>
                    <div className={styles.tagsContainer}>
                      {userProfile.alcohol_categories
                        .filter(category => category?.name)
                        .map((category) => (
                          <ChipSelected 
                            key={category.id} 
                            styleName={styles.alcoholTag}
                          >
                            {category.name}
                          </ChipSelected>
                        ))}
                    </div>
                  </div>
                )}
                {userProfile.alcohol_brands && userProfile.alcohol_brands.length > 0 && (
                  <div className={styles.alcoholSection}>
                    <h4 className={styles.sectionTitle}>好きな銘柄</h4>
                    <div className={styles.tagsContainer}>
                      {userProfile.alcohol_brands
                        .filter(brand => brand?.name)
                        .map((brand) => (
                          <ChipSelected 
                            key={brand.id} 
                            styleName={styles.alcoholTag}
                          >
                            {brand.name}
                          </ChipSelected>
                        ))}
                    </div>
                  </div>
                )}
                {userProfile.drink_styles && userProfile.drink_styles.length > 0 && (
                  <div className={styles.alcoholSection}>
                    <h4 className={styles.sectionTitle}>好きな飲み方・カクテル</h4>
                    <div className={styles.tagsContainer}>
                      {userProfile.drink_styles
                        .filter(style => style?.name)
                        .map((style) => (
                          <ChipSelected 
                            key={style.id} 
                            styleName={styles.alcoholTag}
                          >
                            {style.name}
                          </ChipSelected>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 好みの店舗の雰囲気 */}
          {userProfile.atmosphere_preferences && userProfile.atmosphere_preferences.length > 0 && (
            <div className={styles.profileCard}>
              <h3 className={styles.cardTitle}>好みの店舗の雰囲気</h3>
              <div className={styles.cardContent}>
                <div className={styles.atmosphereGrid}>
                  {userProfile.atmosphere_preferences.map((preference) => (
                    preference.indicator?.name && (
                      <div key={preference.id} className={styles.atmosphereItem}>
                        <h5 className={styles.atmosphereName}>{preference.indicator.name}</h5>
                        <div 
                          className={`${styles.atmosphereScore} ${preference.score === 0 ? styles.gradientBorder : ''}`}
                          style={{
                            ...getAtmosphereScoreStyles(preference.score),
                            ...(preference.score !== 0 
                              ? {
                                  border: `1px solid ${getAtmosphereScoreStyles(preference.score).borderColor}`,
                                  background: getAtmosphereScoreStyles(preference.score).backgroundColor
                                }
                              : {
                                  background: getAtmosphereScoreStyles(preference.score).backgroundColor
                                }
                            )
                          }}
                        >
                          <span 
                            className={styles.scoreValue}
                            style={{
                              color: getAtmosphereScoreStyles(preference.score).color
                            }}
                          >
                            {getAtmosphereScoreDescription(
                              preference.score,
                              preference.indicator?.description_left || '',
                              preference.indicator?.description_right || ''
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 利用目的 */}
          {userProfile.visit_purposes && userProfile.visit_purposes.length > 0 && (
            <div className={styles.profileCard}>
              <h3 className={styles.cardTitle}>利用目的</h3>
              <div className={styles.cardContent}>
                <div className={styles.tagsContainer}>
                  {userProfile.visit_purposes
                    .filter(purpose => purpose?.name)
                    .map((purpose) => (
                      <ChipSelected 
                        key={purpose.id} 
                        styleName={styles.visitPurposeTag}
                      >
                        {purpose.name}
                      </ChipSelected>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default PublicProfileView;