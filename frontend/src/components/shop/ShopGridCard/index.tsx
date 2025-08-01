'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Card, CardBody } from '@nextui-org/react';
import ShopMatchRate from '@/components/Shop/ShopMatchRate';
import ShopActionButton from '@/components/Shop/ShopActionButton';
import { RelationType } from '@/types/shops';
import { toggleShopRelation } from '@/actions/shop/relation';
import styles from './style.module.scss';

interface ShopGridCardProps {
  id: number;
  name: string;
  area: string;
  imageUrl?: string | null;
  distance?: string;
  matchRate?: number;
  onClick?: () => void;
  visitedRelation?: RelationType;
  interestedRelation?: RelationType;
  userRelations?: { [key: number]: boolean };
  onRelationToggle?: (relationTypeId: number) => void;
}

const ShopGridCard: React.FC<ShopGridCardProps> = ({
  id,
  name,
  area,
  imageUrl,
  distance,
  matchRate = 75,
  onClick,
  visitedRelation,
  interestedRelation,
  userRelations = {},
  onRelationToggle
}) => {
  const router = useRouter();
  const [loadingRelations, setLoadingRelations] = useState<{ [key: number]: boolean }>({});
  const [currentUserRelations, setCurrentUserRelations] = useState(userRelations);

  // デバッグ用：リレーション状態をログ出力
  console.log(`ShopGridCard ${name} (ID: ${id}):`, {
    userRelations,
    currentUserRelations,
    visitedRelation,
    interestedRelation
  });

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/shops/${id}`);
    }
  };

  const handleRelationToggle = async (relationType: RelationType) => {
    if (loadingRelations[relationType.id]) return;

    setLoadingRelations(prev => ({ ...prev, [relationType.id]: true }));

    try {
      if (onRelationToggle) {
        onRelationToggle(relationType.id);
      } else {
        await toggleShopRelation(id.toString(), relationType.id);
      }
      setCurrentUserRelations(prev => ({
        ...prev,
        [relationType.id]: !prev[relationType.id]
      }));
    } catch (error) {
      console.error('関係の切り替えに失敗しました:', error);
    } finally {
      setLoadingRelations(prev => ({ ...prev, [relationType.id]: false }));
    }
  };

  return (
    <Card 
      className={styles.shopGridCard} 
      isPressable
      onPress={handleClick}
      radius="lg"
    >
      <CardBody className={styles.cardBody}>
        <div className={styles.imageContainer}>
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={name}
              className={styles.shopImage}
            />
          ) : (
            <div className={styles.placeholderImage}>
              <div className={styles.placeholderIcon}>🏪</div>
            </div>
          )}
          
          {/* ShopActionButtons - 右上に配置 */}
          <div className={styles.actionButtons}>
            {visitedRelation && (
              <div className="shop-action-button">
                <ShopActionButton
                  type={visitedRelation}
                  count={0}
                  isActive={currentUserRelations[visitedRelation.id] || false}
                  onClick={() => handleRelationToggle(visitedRelation)}
                  loading={loadingRelations[visitedRelation.id] || false}
                  showCount={false}
                />
              </div>
            )}
            {interestedRelation && (
              <div className="shop-action-button">
                <ShopActionButton
                  type={interestedRelation}
                  count={0}
                  isActive={currentUserRelations[interestedRelation.id] || false}
                  onClick={() => handleRelationToggle(interestedRelation)}
                  loading={loadingRelations[interestedRelation.id] || false}
                  showCount={false}
                />
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.footer}>
          <div className={styles.shopInfo}>
            <h3 className={styles.shopName}>{name}</h3>
            <div className={styles.locationInfo}>
              <div className={styles.areaInfo}>
                <MapPin size={10} className={styles.locationIcon} />
                <span className={styles.areaText}>{area}</span>
              </div>
              {distance && (
                <div className={styles.distanceInfo}>
                  <span className={styles.distanceText}>{distance}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.matchRateContainer}>
            <ShopMatchRate 
              rate={matchRate} 
              showTitle={false} 
              size="sm"
              className={styles.compactMatchRate}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ShopGridCard;
