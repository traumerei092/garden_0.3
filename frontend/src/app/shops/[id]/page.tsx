'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button, ScrollShadow, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Spinner, Tabs, Tab } from '@nextui-org/react'
import { ChevronLeft, Plus, MapPin, Star, Heart, Info, MessageCircle, Wine, Divide } from 'lucide-react';
import { fetchShopById } from "@/actions/shop/fetchShop";
import { toggleShopRelation, fetchShopStats } from '@/actions/shop/relation';
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
import { getCurrentPosition, calculateDistance, formatDistance } from '@/utils/location';
import { useAuthStore } from '@/store/useAuthStore';
import styles from './style.module.scss';
import LinkDefault from '@/components/UI/LinkDefault';
import { fetchWithAuth } from '@/app/lib/fetchWithAuth';

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
    console.log(`handleTagReaction called with tagId: ${tagId}`);
    
    if (!isLoggedIn) {
      console.log('User not logged in, showing login modal');
      setShowLoginModal(true);
      return;
    }

    try {
      console.log('Processing tag reaction...');
      // タグに既に共感しているかどうかを確認
      const targetTag = shop?.tags.find(tag => tag.id === tagId);
      console.log('Target tag:', targetTag);
      
      // 明示的にbooleanに変換して確実に比較する
      const hasReacted = Boolean(targetTag?.user_has_reacted);
      console.log(`User has reacted to tag ${tagId}: ${hasReacted}`);
      
      // ローカルでタグの状態を更新（即時フィードバック用）
      if (shop && targetTag) {
        // 新しい状態を計算
        const newUserHasReacted = !hasReacted;
        const newReactionCount = newUserHasReacted 
          ? targetTag.reaction_count + 1 
          : targetTag.reaction_count - 1;
        
        console.log(`Updating tag ${tagId} locally: user_has_reacted=${newUserHasReacted}, reaction_count=${newReactionCount}`);
        
        // 更新されたタグの配列を作成
        const updatedTags = shop.tags.map(tag => {
          if (tag.id === tagId) {
            return {
              ...tag,
              user_has_reacted: newUserHasReacted,
              reaction_count: newReactionCount >= 0 ? newReactionCount : 0
            };
          }
          return tag;
        });
        
        // ローカルの店舗データを更新（関数形式を使用して確実に最新の状態を反映）
        setShop(prevShop => {
          if (!prevShop) return null;
          console.log('Updating shop data with new tags');
          
          // 更新後の状態をログに出力
          const newShop = {...prevShop, tags: updatedTags};
          console.log('Updated shop data:', newShop);
          
          return newShop;
        });
        
        // 更新後の状態を確認するためのタイムアウト
        setTimeout(() => {
          console.log('Current shop state after update:', shop);
        }, 0);
      }
      
      // バックエンドへのリクエスト
      try {
        if (hasReacted) {
          console.log('User already reacted, removing reaction');
          // 共感を取り消す
          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shop-tag-reactions/by-tag/${tagId}/`, {
            method: 'DELETE',
            cache: 'no-store', // キャッシュを無効化
            headers: {
              'Cache-Control': 'no-cache', // キャッシュを無効化
              'Pragma': 'no-cache' // 古いブラウザ用
            }
          });
          
          console.log('Delete reaction response status:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`共感の取り消しに失敗しました: ${response.status} ${errorText}`);
          }
        } else {
          console.log('Adding new reaction');
          // 共感する
          const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shop-tag-reactions/`, {
            method: 'POST',
            cache: 'no-store', // キャッシュを無効化
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache', // キャッシュを無効化
              'Pragma': 'no-cache' // 古いブラウザ用
            },
            body: JSON.stringify({
              shop_tag: tagId
            })
          });
          
          console.log('Add reaction response status:', response.status);
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`共感の追加に失敗しました: ${response.status} ${errorText}`);
          }
        }
        
        console.log('Reaction processed successfully, reloading shop data');
        // 店舗情報を再取得して最新のタグ情報を表示（キャッシュを無効化）
        await loadShop();
      } catch (apiErr) {
        console.error('API呼び出し中にエラーが発生しました:', apiErr);
        // エラーが発生した場合も店舗情報を再取得
        await loadShop();
      }
    } catch (err) {
      console.error('タグ共感の処理中にエラーが発生しました:', err);
      // エラーが発生した場合も店舗情報を再取得
      await loadShop();
    }
  };

  // タグを削除
  const handleTagDelete = async (tagId: number) => {
    if (!isLoggedIn) return;
    
    try {
      const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shop-tags/${tagId}/`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('タグの削除に失敗しました');
      }
      
      // 店舗情報を再取得して最新のタグ情報を表示
      await loadShop();
    } catch (err) {
      console.error('タグ削除中にエラーが発生しました:', err);
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

          <div className={styles.matchSection}>
            <div className={styles.matchRateSection}>
              <ShopMatchRate rate={70} />
            </div>
            <div className={styles.atmosphereSection}>
              <div className={styles.sectionTitle}>雰囲気</div>
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
          </div>

          <div className={styles.tagSection}>
            <div className={styles.sectionTitle}>
              雰囲気・印象
              <Button
                type='button'
                className={styles.addTagButton}
                color='primary'
                size="sm"
                onClick={() => setShowAddTagModal(true)}
              >
                <Plus size={16} />
                印象タグを追加する
              </Button>
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
            <ShopActionLink label="お店からのメッセージを見る" />
            <ShopActionLink label="紹介動画" />
            <ShopActionLink label="スタッフ紹介" />
          </div>
        </div>
      </div>

      <Divide className={styles.divider} />
      
      <div className={styles.shopDetailsSection}>
        <div className={styles.tabsContainer}>
          <Tabs
            aria-label="店舗詳細タブ"
            className={styles.tabs}
            variant="underlined"
            classNames={{
              tabList: styles.tabList,
              cursor: styles.tabCursor,
              tabContent: styles.tabContent,
            }}
          >
            <Tab
              key="basic"
              className={styles.tab}
              title={
                <div className={styles.tabTitle}>
                  <Info size={18} strokeWidth={1}/>
                  <span>基本情報</span>
                </div>
              }
            >
              <ShopBasicInfo shop={shop} />
            </Tab>
            <Tab
              key="reviews"
              className={styles.tab}
              title={
                <div className={styles.tabTitle}>
                  <MessageCircle size={18} strokeWidth={1}/>
                  <span>口コミ</span>
                </div>
              }
            >
              <ShopReviews shop={shop} />
            </Tab>
            <Tab
              key="drinks"
              className={styles.tab}
              title={
                <div className={styles.tabTitle}>
                  <Wine size={18} strokeWidth={1}/>
                  <span>お酒メニュー</span>
                </div>
              }
            >
              <ShopDrinks shop={shop} />
            </Tab>
          </Tabs>
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
    </div>
  );
};

export default ShopDetailPage;
