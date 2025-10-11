'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Crown, Calendar } from 'lucide-react';
import ShopGridCard from '@/components/Shop/ShopGridCard';
import ShopFeedbackModal from '@/components/Shop/ShopFeedbackModal';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { fetchFavoriteShops, UserShop } from '@/actions/shop/fetchUserShops';
import { Shop } from '@/types/shops';
import { useShopActions } from '@/hooks/useShopActions';
import { useAuthSession } from '@/hooks/useAuthSession';
import Header from '@/components/Layout/Header';
import styles from './style.module.scss';

const FavoritePage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthSession();
  const [shops, setShops] = useState<UserShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedbackModalShopId, setFeedbackModalShopId] = useState<number | null>(null);

  // カスタムフックでShopActionButtonのロジックを統一
  const shopsForHook = useMemo(() => shops.map(s => ({ ...s, id: s.id })) as unknown as Shop[], [shops]);
  const {
    handleRelationToggle,
    getUserRelations,
    refreshShopStats,
    relations
  } = useShopActions({
    shops: shopsForHook,
    onFeedbackModalOpen: setFeedbackModalShopId
  });

  useEffect(() => {
    const loadFavoriteShops = async () => {
      try {
        setLoading(true);
        const favoriteShops = await fetchFavoriteShops();
        setShops(favoriteShops);
      } catch (err) {
        console.error('Error loading favorite shops:', err);
        setError('行きつけ店舗の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadFavoriteShops();
  }, []);

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
    <div className={styles.favoritePage}>
      <Header />
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <ArrowLeft size={20} />
          戻る
        </button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <Crown className={styles.titleIcon} />
            行きつけの店舗
          </h1>
          <p className={styles.subtitle}>
            あなたの行きつけ{shops.length}件の店舗
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {shops.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>👑</div>
            <h3 className={styles.emptyTitle}>まだ行きつけの店舗がありません</h3>
            <p className={styles.emptyDescription}>
              気に入った店舗を見つけて「行きつけ」ボタンを押してみましょう
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
                  welcomeCount={0}
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
      {feedbackModalShopId && (
        <ShopFeedbackModal
          isOpen={!!feedbackModalShopId}
          onClose={() => setFeedbackModalShopId(null)}
          shop={shops.find(s => s.id === feedbackModalShopId)! as unknown as Shop}
          onDataUpdate={() => feedbackModalShopId && refreshShopStats(feedbackModalShopId)}
        />
      )}
    </div>
  );
};

export default FavoritePage;