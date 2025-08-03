'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, ScrollShadow, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner } from '@nextui-org/react'
import { ChevronLeft, Plus, MapPin, MapPinPlusInside, Heart, Info, MessageCircle, Wine, Divide, DoorOpen, DoorClosed } from 'lucide-react';
import { fetchShopById } from "@/actions/shop/fetchShop";
import { toggleShopRelation, fetchShopStats, toggleTagReaction } from '@/actions/shop/relation';
import { Shop, ShopTag, ShopStats } from "@/types/shops";
import Header from "@/components/Layout/Header";
import ChipCondition from "@/components/UI/ChipCondition";
import ShopActionButton from '@/components/Shop/ShopActionButton';
import ShopImpressionTag from '@/components/Shop/ShopImpressionTag';
import ShopRatingBar from '@/components/Shop/ShopRatingBar';
import ShopMatchRate from '@/components/Shop/ShopMatchRate';
import ShopActionLink from '@/components/Shop/ShopActionLink';
import ShopTagModal from '@/components/Shop/ShopTagModal';
import { ShopImageModal } from '@/components/Shop/ShopImageModal';
import ShopBasicInfo from '@/components/Shop/ShopBasicInfo';
import ShopReviews from '@/components/Shop/ShopReviews';
import ShopDrinks from '@/components/Shop/ShopDrinks';
import CustomTabs from '@/components/UI/CustomTabs';
import { getCurrentPosition, calculateDistance, formatDistance } from '@/utils/location';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';
import LinkDefault from '@/components/UI/LinkDefault';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';
import ShopEditModal from '@/components/Shop/ShopEditModal';
import ShopHistoryModal from '@/components/Shop/ShopHistoryModal';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';

// サンプルの雰囲気データ
const SAMPLE_ATMOSPHERE_RATINGS = [
  { id: 1, label: '話しかけ度', value: 75 },
  { id: 2, label: '盛り上がり度', value: 60 },
  { id: 3, label: 'コミュニティ性', value: 85 },
  { id: 4, label: '他のお客さんとの距離感', value: 70 },
  { id: 5, label: 'マスターのキャラクター', value: 90 },
];

const ShopDetailPage = ({ params }: { params: { id: string } }) => {
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [isVisited, setIsVisited] = useState(false);
  const [isInterested, setIsInterested] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [showAddTagModal, setShowAddTagModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showShopImageModal, setShowShopImageModal] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [relationStats, setRelationStats] = useState<ShopStats | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const { user } = useAuthStore();
  const isLoggedIn = !!user;

  // 店舗情報を取得
  const loadShop = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 店舗データを取得
      const shopData = await fetchShopById(params.id);
      setShop(shopData);
      
      // デフォルトの統計データを設定
      setRelationStats({
        counts: [
          { id: 3, name: 'favorite', label: '行きつけ', count: 0, color: 'success' },
          { id: 1, name: 'visited', label: '行った', count: 0, color: 'primary' },
          { id: 2, name: 'interested', label: '行きたい', count: 0, color: 'secondary' }
        ],
        user_relations: []
      });
      
      try {
        // 統計データを取得（失敗しても続行）
        const statsData = await fetchShopStats(params.id);
        setRelationStats(statsData);
      } catch (statsErr) {
        console.error('統計データの取得に失敗しましたが、処理を続行します:', statsErr);
      }
      
      // 位置情報の取得を試みる
      if (shopData.latitude && shopData.longitude) {
        try {
          await loadLocationData(shopData.latitude, shopData.longitude);
        } catch (locErr) {
          console.error('位置情報の取得に失敗しましたが、処理を続行します:', locErr);
        }
      }
    } catch (err) {
      console.error('店舗データ取得エラー:', err);
      setError('店舗情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // リレーションの切り替え処理
  const handleRelationToggle = async (relationTypeId: number) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    setIsActionLoading(true);
    try {
      await toggleShopRelation(params.id, relationTypeId);
      try {
        const newStats = await fetchShopStats(params.id);
        setRelationStats(newStats);
      } catch (statsErr) {
        console.error('統計データの更新に失敗:', statsErr);
      }
    } catch (error) {
      console.error('リレーションの切り替えに失敗:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  // 位置情報を取得して距離を計算
  const loadLocationData = async (shopLat: number, shopLng: number) => {
    try {
      setIsLocationLoading(true);
      const position = await getCurrentPosition();
      const dist = calculateDistance(
        position.coords.latitude,
        position.coords.longitude,
        shopLat,
        shopLng
      );
      setDistance(dist);
    } catch (locError) {
      console.error('位置情報の取得に失敗しました:', locError);
    } finally {
      setIsLocationLoading(false);
    }
  };

  // 位置情報の再取得
  const handleRefreshLocation = async () => {
    if (!shop?.latitude || !shop?.longitude) return;
    await loadLocationData(shop.latitude, shop.longitude);
  };

  useEffect(() => {
    loadShop();
  }, [params.id]);

  // デバッグ用のログ追加
  useEffect(() => {
    if (shop) {
      console.log('Shop data loaded successfully:', shop);
    }
  }, [shop]);

  // タグに共感する
  const handleTagReaction = async (tagId: number) => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const originalTags = shop?.tags;
    if (!shop || !originalTags) return;

    const targetTag = originalTags.find(tag => tag.id === tagId);
    if (!targetTag) return;

    // 自分が共感済みで、共感数が1の場合、削除フローに移行
    if (targetTag.user_has_reacted && targetTag.reaction_count === 1) {
      if (window.confirm('このタグを削除しますか？')) {
        await handleTagDelete(tagId);
      }
      return;
    }

    // 通常の共感・共感取り消し処理（楽観的更新）
    const updatedTags = originalTags.map(tag => {
      if (tag.id === tagId) {
        const newUserHasReacted = !tag.user_has_reacted;
        const newReactionCount = newUserHasReacted
          ? tag.reaction_count + 1
          : tag.reaction_count - 1;
        return {
          ...tag,
          user_has_reacted: newUserHasReacted,
          reaction_count: newReactionCount >= 0 ? newReactionCount : 0,
        };
      }
      return tag;
    });

    setShop(prevShop => {
      if (!prevShop) return null;
      return { ...prevShop, tags: updatedTags };
    });

    // バックエンドと同期
    try {
      await toggleTagReaction(tagId);
    } catch (err) {
      console.error('タグ共感のAPI連携に失敗しました:', err);
      // エラー時は元の状態に戻す
      setShop(prevShop => {
        if (!prevShop) return null;
        return { ...prevShop, tags: originalTags };
      });
    }
  };

  // タグを削除
  const handleTagDelete = async (tagId: number) => {
    if (!isLoggedIn) return;

    const originalTags = shop?.tags;
    if (!shop || !originalTags) return;

    // 楽観的更新: UIから即座にタグを削除
    const updatedTags = originalTags.filter(tag => tag.id !== tagId);
    setShop(prevShop => {
      if (!prevShop) return null;
      return { ...prevShop, tags: updatedTags };
    });

    // バックエンドと同期
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shop-tags/${tagId}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('タグの削除に失敗しました');
      }
    } catch (err) {
      console.error('タグ削除中にエラーが発生しました:', err);
      // エラー時は元の状態に戻す
      setShop(prevShop => {
        if (!prevShop) return null;
        return { ...prevShop, tags: originalTags };
      });
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}><Spinner className={styles.loading}/></div>;
  }

  if (error || !shop) {
    return <div className={styles.errorContainer}>{error || '店舗情報が見つかりませんでした'}</div>;
  }

  const renderChips = (items: string[], category: 'type' | 'layout' | 'option') => {
    return items.map((item, index) => (
      <ChipCondition key={`${category}-${index}`} category={category}>
        {item}
      </ChipCondition>
    ));
  };

  // 画像追加の処理を行う関数
  const handleAddImage = async (file: File, caption: string) => {
      if (!isLoggedIn) {
          setShowLoginModal(true);
          return;
      }

      try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('caption', caption);
          formData.append('shop', params.id);

          // fetchWithAuthは FormData には使えないので、通常のfetchを使用
          const accessToken = localStorage.getItem('access');
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/shop-images/`, {
              method: 'POST',
              headers: {
                  'Authorization': `JWT ${accessToken}`
              },
              body: formData
          });

          if (!response.ok) {
              throw new Error('画像のアップロードに失敗しました');
          }

          // 店舗情報を再取得して最新の画像一覧を表示
          await loadShop();
      } catch (error) {
          console.error('画像のアップロード中にエラーが発生しました:', error);
      }
  };

  return (
    <div className={styles.container}>
      <Header />

      <div className={styles.detailHeader}>
        <LinkDefault href="/shops" styleName=''>
          <ChevronLeft size={18} />
          一覧に戻る
        </LinkDefault>
        <div className={styles.actionButtons}>
          {relationStats?.counts.map((relationType) => (
            <ShopActionButton
              key={relationType.id}
              type={relationType}
              count={relationType.count}
              isActive={relationStats.user_relations.includes(relationType.id)}
              onClick={() => handleRelationToggle(relationType.id)}
              loading={isActionLoading}
            />
          ))}
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.shopImageContainer}>
          <div className={styles.shopImageWrapper}>
            <Image
              src={shop?.images && Array.isArray(shop.images) && shop.images.length > 0
                ? shop.images[activeImageIndex].image_url.startsWith('http')
                  ? shop.images[activeImageIndex].image_url
                  : `${process.env.NEXT_PUBLIC_API_URL}${shop.images[activeImageIndex].image_url}`
                : typeof shop?.images === 'string'
                  ? shop.images
                  : '/assets/picture/no-image.jpg'}
              alt={shop?.name || '店舗画像'}
              className={styles.shopImage}
              fill
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <ScrollShadow orientation="horizontal" hideScrollBar className={styles.subImageWrapper}>
            {shop?.images && Array.isArray(shop.images) && shop.images.length > 0 ? (
              <>
                {shop.images.map((image, index) => (
                  <div
                    key={image.id || index}
                    className={`${styles.thumbnailImage} ${activeImageIndex === index ? styles.activeThumbnail : ''}`}
                    onClick={() => setActiveImageIndex(index)}
                  >
                    <Image
                      src={image.image_url.startsWith('http')
                        ? image.image_url
                        : `${process.env.NEXT_PUBLIC_API_URL}${image.image_url}`}
                      alt={`${shop?.name}の画像 ${index + 1}`}
                      fill
                      sizes="100px"
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ))}
              </>
            ) : null}
            <button className={styles.addImageButton} onClick={() => setShowShopImageModal(true)}>
              <Plus size={24} strokeWidth={1} />
            </button>
          </ScrollShadow>
        </div>

        <div className={styles.shopInfoContainer}>
          <div className={styles.shopNameAndMatch}>
            <div>
              <h1 className={styles.shopName}>{shop.name}</h1>
              <div className={styles.locationInfo}>
                {distance !== null && (
                  <div className={styles.distance}>
                    <MapPin size={16} />
                    現在地から {formatDistance(distance)}
                  </div>
                )}
                <div className={styles.address}>
                  {shop.prefecture} {shop.city} {shop.area && `${shop.area}`} {shop.street} {shop.building}
                </div>
              </div>
            </div>
            <div className={styles.matchRateSection}>
              <ShopMatchRate rate={70} />
            </div>
          </div>
          

          <div className={styles.atmosphereSection}>
            <div className={styles.sectionTitle}>
              雰囲気
              <ButtonGradientWrapper
                type='button'
                anotherStyle={styles.addTagButton}
                onClick={() => setShowAddTagModal(true)}
              >
                <Plus size={16} />
                お店に行った方はこちら
              </ButtonGradientWrapper>
            </div>
            
            <div className={styles.ratingBars}>
              {SAMPLE_ATMOSPHERE_RATINGS.map((rating) => (
                <ShopRatingBar
                  key={rating.id}
                  label={rating.label}
                  value={rating.value}
                />
              ))}
            </div>
          </div>

          <div className={styles.tagSection}>
            <div className={styles.sectionTitle}>
              雰囲気・印象
              <ButtonGradientWrapper
                type='button'
                anotherStyle={styles.addTagButton}
                onClick={() => setShowAddTagModal(true)}
              >
                <Plus size={16} />
                印象タグを追加する
              </ButtonGradientWrapper>
            </div>
            <div className={styles.impressionTags}>
              {shop.tags && Array.isArray(shop.tags) && shop.tags.length > 0 ? (
                shop.tags.map((tag) => (
                  <ShopImpressionTag
                    key={tag.id}
                    id={tag.id}
                    label={tag.value}
                    count={tag.reaction_count}
                    isCreator={tag.is_creator}
                    userHasReacted={tag.user_has_reacted}
                    onClick={() => handleTagReaction(tag.id)}
                    onDelete={() => handleTagDelete(tag.id)}
                  />
                ))
              ) : (
                <p className={styles.noTags}>まだ印象タグがありません。最初のタグを追加しましょう！</p>
              )}
            </div>
          </div>

          <div className={styles.actionSection}>
            
          </div>
        </div>
      </div>

      <Divide className={styles.divider} />
      
      <div className={styles.shopDetailsSection}>
        <div className={styles.tabsContainer}>
          <CustomTabs
            variant="underlined"
            size="md"
            className={styles.tabs}
            items={[
              {
                key: "basic",
                title: (
                  <div className={styles.tabTitle}>
                    <Info size={18} strokeWidth={1}/>
                    <span>基本情報</span>
                  </div>
                ),
                content: <ShopBasicInfo shop={shop} />
              },
              {
                key: "reviews",
                title: (
                  <div className={styles.tabTitle}>
                    <MessageCircle size={18} strokeWidth={1}/>
                    <span>口コミ</span>
                  </div>
                ),
                content: <ShopReviews shopId={shop.id} />
              },
              {
                key: "drinks",
                title: (
                  <div className={styles.tabTitle}>
                    <Wine size={18} strokeWidth={1}/>
                    <span>お酒メニュー</span>
                  </div>
                ),
                content: <ShopDrinks shop={shop} />
              }
            ]}
          />
        </div>
      </div>
      
      {/* タグ追加モーダル */}
      <ShopTagModal
        isOpen={showAddTagModal}
        onClose={() => setShowAddTagModal(false)}
        shopId={shop.id}
        onTagAdded={loadShop}
        existingTags={shop.tags && Array.isArray(shop.tags) ? shop.tags.map(tag => ({ id: tag.id, value: tag.value })) : []}
      />

      {/* 画像追加モーダル */}
      <ShopImageModal
          isOpen={showShopImageModal}
          onClose={() => setShowShopImageModal(false)}
          onSubmit={handleAddImage}
          shopId={params.id}
      />
      
      {/* ログインモーダル */}
      <Modal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                <h3>ログインが必要です</h3>
              </ModalHeader>
              <ModalBody>
                <p>タグに共感するにはログインが必要です。</p>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" variant="light" onPress={onClose}>
                  閉じる
                </Button>
                <Button color="primary" as={Link} href="/login">
                  ログイン
                </Button>
                <Button color="primary" as={Link} href="/auth/signup">
                  新規登録
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* 店舗情報編集モーダル */}
      <ShopEditModal shop={shop} onUpdate={loadShop} />

      {/* 編集履歴モーダル */}
      <ShopHistoryModal shop={shop} />
    </div>
  );
};

export default ShopDetailPage;