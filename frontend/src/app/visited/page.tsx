'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Calendar } from 'lucide-react';
import ShopGridCard from '@/components/Shop/ShopGridCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { fetchVisitedShops, UserShop } from '@/actions/shop/fetchUserShops';
import { useAuthStore } from '@/store/useAuthStore';
import Header from '@/components/Layout/Header';
import styles from './style.module.scss';

const VisitedPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [shops, setShops] = useState<UserShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const loadVisitedShops = async () => {
      try {
        setLoading(true);
        const visitedShops = await fetchVisitedShops();
        setShops(visitedShops);
      } catch (err) {
        console.error('Error loading visited shops:', err);
        setError('行った店舗の読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    };

    loadVisitedShops();
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
    <div className={styles.visitedPage}>
      <Header />
      <div className={styles.header}>
        <button onClick={handleBackClick} className={styles.backButton}>
          <ArrowLeft size={20} />
          戻る
        </button>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            <MapPin className={styles.titleIcon} />
            行った店舗
          </h1>
          <p className={styles.subtitle}>
            あなたが訪れた{shops.length}件の店舗
          </p>
        </div>
      </div>

      <div className={styles.content}>
        {shops.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏪</div>
            <h3 className={styles.emptyTitle}>まだ行った店舗がありません</h3>
            <p className={styles.emptyDescription}>
              気になる店舗を見つけて「行った」ボタンを押してみましょう
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
            {shops.map((shop) => (
              <div key={shop.id} className={styles.shopCardWrapper}>
                <ShopGridCard
                  id={shop.id}
                  name={shop.name}
                  area={shop.area}
                  imageUrl={shop.image_url}
                />
                {shop.visited_at && (
                  <div className={styles.visitedDate}>
                    <Calendar size={14} />
                    <span>
                      {new Date(shop.visited_at).toLocaleDateString('ja-JP', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitedPage;
