'use client'

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { PublicUserProfile } from '@/types/users';
import ChipSelected from '@/components/UI/ChipSelected';
import CustomTabs from '@/components/UI/CustomTabs';
import ShopGridCard from '@/components/Shop/ShopGridCard';
import ReviewCard from '@/components/Shop/ReviewCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { MapPin, Star, MessageCircle, User, Store, Crown } from 'lucide-react';
import { UserShop } from '@/actions/shop/fetchUserShops';
import { ShopReview, RelationType, ShopStats } from '@/types/shops';
import { fetchShopStats, toggleShopRelation } from '@/actions/shop/relation';
import { useAuthStore } from '@/store/useAuthStore';
import { fetchPublicUserFavoriteShops, fetchPublicUserVisitedShops, fetchPublicUserReviews } from '@/actions/user/fetchPublicUserData';
import styles from './style.module.scss';

interface PublicProfileViewProps {
  userProfile: PublicUserProfile;
}

const PublicProfileView: React.FC<PublicProfileViewProps> = ({ userProfile }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const user = useAuthStore((state) => state.user);
  const [favoriteShops, setFavoriteShops] = useState<UserShop[]>([]);
  const [visitedShops, setVisitedShops] = useState<UserShop[]>([]);
  const [userReviews, setUserReviews] = useState<ShopReview[]>([]);
  const [shopStats, setShopStats] = useState<{ [key: number]: ShopStats }>({});
  const [loadingShops, setLoadingShops] = useState<{[key: string]: boolean}>({
    favorites: false,
    visited: false,
    reviews: false
  });
  const loadingRef = useRef<{[key: string]: boolean}>({
    favorites: false,
    visited: false,
    reviews: false
  });
  const dataLoadedRef = useRef<{[key: string]: boolean}>({
    favorites: false,
    visited: false,
    reviews: false
  });
  const [expandedReviews, setExpandedReviews] = useState<{[key: number]: boolean}>({});

  // デフォルトのリレーションタイプ
  const favoriteRelation: RelationType = {
    id: 1,
    name: 'favorite',
    label: '行きつけ',
    count: 0,
    color: '#00ffff'
  };

  const visitedRelation: RelationType = {
    id: 2,
    name: 'visited',
    label: '行った',
    count: 0,
    color: '#ffc107'
  };

  const interestedRelation: RelationType = {
    id: 3,
    name: 'interested',
    label: '行きたい',
    count: 0,
    color: '#ef4444'
  };

  // リレーションの切り替え処理
  const handleRelationToggle = async (shopId: number, relationTypeId: number) => {
    if (!user) return;

    try {
      await toggleShopRelation(shopId.toString(), relationTypeId);
      // 統計データを更新
      const updatedStats = await fetchShopStats(shopId.toString());
      setShopStats(prev => ({
        ...prev,
        [shopId]: updatedStats
      }));
    } catch (error) {
      console.error('リレーションの切り替えに失敗:', error);
    }
  };
  // ユーザーデータの取得
  useEffect(() => {
    const loadUserShopsAndReviews = async () => {
      if (!userProfile.uid) return;

      // 行きつけ店舗を取得
      if (activeTab === 'favorites' && !loadingRef.current.favorites && !dataLoadedRef.current.favorites) {
        loadingRef.current.favorites = true;
        setLoadingShops(prev => ({ ...prev, favorites: true }));
        try {
          const shops = await fetchPublicUserFavoriteShops(userProfile.uid);
          setFavoriteShops(shops);

          // 各店舗の統計データを取得
          const newShopStats: { [key: number]: ShopStats } = {};
          for (const shop of shops) {
            try {
              const stats = await fetchShopStats(shop.id.toString());
              newShopStats[shop.id] = stats;
            } catch (error) {
              console.error(`店舗${shop.id}の統計データ取得に失敗:`, error);
            }
          }
          setShopStats(prev => ({ ...prev, ...newShopStats }));

          dataLoadedRef.current.favorites = true;
        } catch (error) {
          // エラーは無視（API未実装のため）
        } finally {
          loadingRef.current.favorites = false;
          setLoadingShops(prev => ({ ...prev, favorites: false }));
        }
      }

      // 行った店舗を取得
      if (activeTab === 'visited' && !loadingRef.current.visited && !dataLoadedRef.current.visited) {
        loadingRef.current.visited = true;
        setLoadingShops(prev => ({ ...prev, visited: true }));
        try {
          const shops = await fetchPublicUserVisitedShops(userProfile.uid);
          setVisitedShops(shops);

          // 各店舗の統計データを取得
          const newShopStats: { [key: number]: ShopStats } = {};
          for (const shop of shops) {
            try {
              const stats = await fetchShopStats(shop.id.toString());
              newShopStats[shop.id] = stats;
            } catch (error) {
              console.error(`店舗${shop.id}の統計データ取得に失敗:`, error);
            }
          }
          setShopStats(prev => ({ ...prev, ...newShopStats }));

          dataLoadedRef.current.visited = true;
        } catch (error) {
          // エラーは無視（API未実装のため）
        } finally {
          loadingRef.current.visited = false;
          setLoadingShops(prev => ({ ...prev, visited: false }));
        }
      }

      // 口コミを取得
      if (activeTab === 'reviews' && !loadingRef.current.reviews && !dataLoadedRef.current.reviews) {
        loadingRef.current.reviews = true;
        setLoadingShops(prev => ({ ...prev, reviews: true }));
        try {
          const reviews = await fetchPublicUserReviews(userProfile.uid);
          setUserReviews(reviews);
          dataLoadedRef.current.reviews = true;
        } catch (error) {
          // エラーは無視（API未実装のため）
        } finally {
          loadingRef.current.reviews = false;
          setLoadingShops(prev => ({ ...prev, reviews: false }));
        }
      }
    };

    loadUserShopsAndReviews();
  }, [activeTab, userProfile.uid]);

  // 口コミ展開の切り替え
  const handleToggleReviewExpansion = (reviewId: number) => {
    setExpandedReviews(prev => ({
      ...prev,
      [reviewId]: !prev[reviewId]
    }));
  };

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

  // プロフィール詳細コンテンツ
  const renderProfileContent = () => (
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
      {((userProfile.hobbies && userProfile.hobbies.length > 0) || userProfile.exercise_frequency?.name || userProfile.dietary_preference?.name) && (
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
  );

  // 行きつけ店舗コンテンツをレンダリング
  const renderFavoriteShopsContent = () => {
    if (loadingShops.favorites) {
      return (
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      );
    }

    if (favoriteShops.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Crown size={48} strokeWidth={0.5} fill='rgba(0, 255, 255, 0.2)' className={styles.emptyIcon} />
          </div>
          <h3>行きつけのお店がありません</h3>
          <p>まだ行きつけに登録された店舗がありません</p>
        </div>
      );
    }

    return (
      <div>
        <div className={styles.sectionHeader}>
          <h3>サードプレイス ({favoriteShops.length}件)</h3>
        </div>
        <div className={styles.shopsGrid}>
          {favoriteShops.map((shop) => {
            const stats = shopStats[shop.id] || {
              counts: [
                { id: 1, name: 'favorite', label: '行きつけ', count: 0, color: '#00ffff' },
                { id: 2, name: 'visited', label: '行った', count: 0, color: '#ffc107' },
                { id: 3, name: 'interested', label: '行きたい', count: 0, color: '#ef4444' }
              ],
              user_relations: []
            };

            const userRelations: { [key: number]: boolean } = {};
            if (stats?.user_relations) {
              stats.user_relations.forEach((relationTypeId: number) => {
                userRelations[relationTypeId] = true;
              });
            }

            return (
              <ShopGridCard
                key={shop.id}
                id={shop.id}
                name={shop.name}
                area={shop.area}
                imageUrl={shop.image_url}
                matchRate={75}
                favoriteRelation={favoriteRelation}
                visitedRelation={visitedRelation}
                interestedRelation={interestedRelation}
                userRelations={userRelations}
                onRelationToggle={user ? (relationTypeId) => handleRelationToggle(shop.id, relationTypeId) : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // 行った店舗コンテンツをレンダリング
  const renderVisitedShopsContent = () => {
    if (loadingShops.visited) {
      return (
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      );
    }

    if (visitedShops.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <Store size={48}  strokeWidth={0.5} fill='rgba(0, 255, 255, 0.2)' className={styles.emptyIcon} />
          </div>
          <h3>行った店舗がありません</h3>
          <p>まだ行った店舗がありません</p>
        </div>
      );
    }

    return (
      <div>
        <div className={styles.sectionHeader}>
          <h3>行った店 ({visitedShops.length}件)</h3>
        </div>
        <div className={styles.shopsGrid}>
          {visitedShops.map((shop) => {
            const stats = shopStats[shop.id] || {
              counts: [
                { id: 1, name: 'favorite', label: '行きつけ', count: 0, color: '#00ffff' },
                { id: 2, name: 'visited', label: '行った', count: 0, color: '#ffc107' },
                { id: 3, name: 'interested', label: '行きたい', count: 0, color: '#ef4444' }
              ],
              user_relations: []
            };

            const userRelations: { [key: number]: boolean } = {};
            if (stats?.user_relations) {
              stats.user_relations.forEach((relationTypeId: number) => {
                userRelations[relationTypeId] = true;
              });
            }

            return (
              <ShopGridCard
                key={shop.id}
                id={shop.id}
                name={shop.name}
                area={shop.area}
                imageUrl={shop.image_url}
                matchRate={75}
                favoriteRelation={favoriteRelation}
                visitedRelation={visitedRelation}
                interestedRelation={interestedRelation}
                userRelations={userRelations}
                onRelationToggle={user ? (relationTypeId) => handleRelationToggle(shop.id, relationTypeId) : undefined}
              />
            );
          })}
        </div>
      </div>
    );
  };

  // 口コミコンテンツをレンダリング
  const renderReviewsContent = () => {
    if (loadingShops.reviews) {
      return (
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
        </div>
      );
    }

    if (userReviews.length === 0) {
      return (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <MessageCircle size={48} strokeWidth={0.5} fill='rgba(0, 255, 255, 0.2)' className={styles.emptyIcon} />
          </div>
          <h3>口コミがありません</h3>
          <p>まだ口コミが投稿されていません</p>
        </div>
      );
    }

    return (
      <div>
        <div className={styles.sectionHeader}>
          <h3>口コミ ({userReviews.length}件)</h3>
        </div>
        <div className={styles.reviewsContainer}>
          {userReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              allReviews={userReviews}
              isExpanded={expandedReviews[review.id] || false}
              showUserLink={false}
              showShopLink={true}
              onToggleExpansion={handleToggleReviewExpansion}
            />
          ))}
        </div>
      </div>
    );
  };

  // タブアイテムを作成
  const tabItems = [
    {
      key: 'favorites',
      title: (
        <div className={styles.tabTitle}>
          <Crown className={styles.tabIcon} size={18} strokeWidth={1}/>
          <span className={styles.tabLabel}>サードプレイス</span>
        </div>
      ),
      content: renderFavoriteShopsContent()
    },
    {
      key: 'visited',
      title: (
        <div className={styles.tabTitle}>
          <Star className={styles.tabIcon} size={18} strokeWidth={1}/>
          <span className={styles.tabLabel}>行った店</span>
        </div>
      ),
      content: renderVisitedShopsContent()
    },
    {
      key: 'reviews',
      title: (
        <div className={styles.tabTitle}>
          <MessageCircle className={styles.tabIcon} size={18}  strokeWidth={1}/>
          <span className={styles.tabLabel}>口コミ</span>
        </div>
      ),
      content: renderReviewsContent()
    },
    {
      key: 'profile',
      title: (
        <div className={styles.tabTitle}>
          <User className={styles.tabIcon} size={18} strokeWidth={1} />
          <span className={styles.tabLabel}>プロフィール</span>
        </div>
      ),
      content: renderProfileContent()
    }
  ];

  return (
    <div className={styles.publicProfileContainer}>
      {/* ヒーローセクション */}
      <section className={styles.heroSection}>
        <div className={styles.heroBackground}>
          {userProfile.header_image ? (
            <Image
              src={userProfile.header_image}
              alt={`${userProfile.name}のヘッダー画像`}
              fill
              className={styles.headerImage}
              style={{ objectFit: 'cover' }}
              priority
            />
          ) : (
            <div className={styles.headerImagePlaceholder} />
          )}
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
            <div className={styles.userInfoCard}>
              <div className={styles.userInfoHeader}>
                <h1 className={styles.userName}>{userProfile.name}</h1>
                <div className={styles.userMeta}>
                  {userProfile.age && (
                    <span className={styles.metaItem}>
                      {userProfile.age}歳
                    </span>
                  )}
                  {userProfile.gender && (
                    <span className={styles.metaItem}>
                      {userProfile.gender === 'male' ? '男性' : userProfile.gender === 'female' ? '女性' : userProfile.gender === 'other' ? 'その他' : userProfile.gender}
                    </span>
                  )}
                  {userProfile.favorite_shops_count !== undefined && (
                    <span className={styles.metaItem}>
                      <Crown size={12} />
                      行きつけ {userProfile.favorite_shops_count}店
                    </span>
                  )}
                  {userProfile.visited_shops_count !== undefined && (
                    <span className={styles.metaItem}>
                      <Star size={12} />
                      行った店 {userProfile.visited_shops_count}店
                    </span>
                  )}
                </div>
              </div>
              {userProfile.my_areas && userProfile.my_areas.length > 0 && (
                <div className={styles.heroMyAreas}>
                  <div className={styles.heroAreasLabel}>
                    <MapPin size={16} strokeWidth={1}/>
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
        </div>
      </section>

      {/* プロフィール詳細セクション */}
      <section className={styles.profileContent}>
        <CustomTabs
          items={tabItems}
          selectedKey={activeTab}
          onSelectionChange={setActiveTab}
          variant="bordered"
          size="md"
          color="primary"
          className={styles.profileTabs}
        />
      </section>
    </div>
  );
};

export default PublicProfileView;