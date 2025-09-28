'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Heart, Calendar } from 'lucide-react';
import ShopGridCard from '@/components/Shop/ShopGridCard';
import ShopFeedbackModal from '@/components/Shop/ShopFeedbackModal';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { fetchWishlistShops, UserShop } from '@/actions/shop/fetchUserShops';
import { fetchShopStats } from '@/actions/shop/relation';
import { ShopStats, Shop } from '@/types/shops';
import { useAuthStore } from '@/store/useAuthStore';
import { useShopActions } from '@/hooks/useShopActions';
import Header from '@/components/Layout/Header';
import styles from './style.module.scss';

const WishlistPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shops, setShops] = useState<UserShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackModalOpen, setFeedbackModalOpen] = useState<number | null>(null);

  // カスタムフックでShopActionButtonのロジックを統一
  const shopsForHook = useMemo(() => shops.map(s => ({ ...s, id: s.id } as any)), [shops]);
  const {
    shopStats,
    handleRelationToggle,
    getUserRelations,
    refreshShopStats,
    relations
  } = useShopActions({
    shops: shopsForHook,
    onFeedbackModalOpen: setFeedbackModalOpen
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadWishlistShops = async () => {
      try {
        setLoading(true);
        const wishlistShops = await fetchWishlistShops();
        setShops(wishlistShops);
        
      } catch (err) {
        console.error('Error loading wishlist shops:', err);
        setError('行きたい店舗の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadWishlistShops();
  }, [user, router]);

  const handleBackClick = () => {
    router.back();
  };


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className={styles.retryButton}>
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wishlistPage}>
      <Header />
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <ArrowLeft size={20} />
          戻る
        </button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <Heart className={styles.titleIcon} />
            行きたい店舗
          </h1>
          <p className={styles.subtitle}>
            あなたが気になる{shops.length}件の店舗
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {shops.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💝</div>
            <h3 className={styles.emptyTitle}>まだ行きたい店舗がありません</h3>
            <p className={styles.emptyDescription}>
              気になる店舗を見つけて「行きたい」ボタンを押してみましょう
            </p>
            <button 
              onClick={() => router.push('/shops')} 
              className={styles.exploreButton}
            >
              店舗を探す
            </button>
          </div>
        ) : (
          <div className={styles.shopsGrid}>
            {shops.map((shop) => {
              const userRelations = getUserRelations(shop.id);

              return (
              <div key={shop.id} className={styles.shopCardWrapper}>
                <ShopGridCard
                  id={shop.id}
                  name={shop.name}
                  area={shop.area}
                  imageUrl={shop.image_url}
                  distance="1.2km"
                  matchRate={75}
                  favoriteRelation={relations.favorite}
                  visitedRelation={relations.visited}
                  interestedRelation={relations.interested}
                  userRelations={userRelations}
                  onRelationToggle={(relationTypeId) => handleRelationToggle(shop.id, relationTypeId)}
                />
                {shop.added_at && (
                  <div className={styles.addedDate}>
                    <Calendar size={14} />
                    <span>
                      {new Date(shop.added_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* フィードバックモーダル */}
      {feedbackModalOpen && (
        <ShopFeedbackModal
          isOpen={!!feedbackModalOpen}
          onClose={() => setFeedbackModalOpen(null)}
          shop={shops.find(s => s.id === feedbackModalOpen) as any}
          onDataUpdate={() => feedbackModalOpen && refreshShopStats(feedbackModalOpen)}
        />
      )}
    </div>
  );
};

export default WishlistPage;
