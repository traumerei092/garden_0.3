'use client'

import React, { useState, useEffect } from 'react';
import { Switch, Button } from '@nextui-org/react';
import { Eye, EyeOff, MapPin, Plus, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import ShopGridCard from '@/components/Shop/ShopGridCard';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { fetchVisitedShops, UserShop } from '@/actions/shop/fetchUserShops';

const VisitedShops = () => {
  const router = useRouter();
  const [isPublic, setIsPublic] = useState(true);
  const [shops, setShops] = useState<UserShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, []);

  const handleViewAll = () => {
    router.push('/visited');
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
        <p>{error}</p>
        <button onClick={() => window.location.reload()} className={styles.retryButton}>
          再試行
        </button>
      </div>
    );
  }

  return (
    <div className={styles.visitedShopsContainer}>
      <div className={styles.headerSection}>
        <div className={styles.titleRow}>
          <div>
            <h2 className={styles.sectionTitle}>行ったお店</h2>
            <p className={styles.sectionDescription}>
              あなたが訪れた{shops.length}件のお店
            </p>
          </div>
          
          {shops.length > 0 && (
            <button onClick={handleViewAll} className={styles.viewAllButton}>
              <ExternalLink size={16} />
              すべて見る
            </button>
          )}
        </div>
        
        <div className={styles.controlsRow}>
          <div className={styles.visibilityControl}>
            <span>公開設定</span>
            <SwitchVisibility
              isSelected={isPublic}
              onValueChange={setIsPublic}
            />
          </div>
          
          <ButtonGradientWrapper anotherStyle={styles.addButton} onClick={() => router.push('/shops')}>
            <Plus size={16} />
            お店を探す
          </ButtonGradientWrapper>
        </div>
      </div>
      
      <div className={styles.shopsGrid}>
        {shops.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🏪</div>
            <h3>まだ行った店舗がありません</h3>
            <p>気になる店舗を見つけて「行った」ボタンを押してみましょう</p>
            <ButtonGradientWrapper anotherStyle={styles.exploreButton} onClick={() => router.push('/shops')}>
              店舗を探す
            </ButtonGradientWrapper>
          </div>
        ) : (
          <>
            {shops.slice(0, 6).map((shop) => (
              <ShopGridCard
                key={shop.id}
                id={shop.id}
                name={shop.name}
                area={shop.area}
                imageUrl={shop.image_url}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default VisitedShops;
