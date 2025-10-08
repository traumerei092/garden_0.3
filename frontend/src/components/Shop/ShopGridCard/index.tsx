'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { Card, CardBody } from '@nextui-org/react';
import ShopWelcomeCount from '@/components/Shop/ShopWelcomeCount';
import ShopActionButton from '@/components/Shop/ShopActionButton';
import { RelationType } from '@/types/shops';
import styles from './style.module.scss';

interface ShopGridCardProps {
  id: number;
  name: string;
  area: string;
  imageUrl?: string | null;
  distance?: string;
  welcomeCount?: number;
  onClick?: () => void;
  favoriteRelation?: RelationType;
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
  welcomeCount = 0,
  onClick,
  favoriteRelation,
  visitedRelation,
  interestedRelation,
  userRelations = {},
  onRelationToggle
}) => {
  const router = useRouter();

  // userRelationsは{ [relationTypeId]: boolean }形式
  const isFavorite = userRelations[favoriteRelation?.id || 0] || false;
  const isVisited = userRelations[visitedRelation?.id || 0] || false;
  const isInterested = userRelations[interestedRelation?.id || 0] || false;

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      router.push(`/shops/${id}`);
    }
  };

  const handleRelationClick = (relationType: RelationType) => {
    if (onRelationToggle) {
      onRelationToggle(relationType.id);
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
            {favoriteRelation && (
              <div className="shop-action-button">
                <ShopActionButton
                  type={favoriteRelation}
                  count={0}
                  isActive={isFavorite}
                  onClick={() => handleRelationClick(favoriteRelation)}
                  loading={false}
                  showCount={false}
                />
              </div>
            )}
            {visitedRelation && (
              <div className="shop-action-button">
                <ShopActionButton
                  type={visitedRelation}
                  count={0}
                  isActive={isVisited}
                  onClick={() => handleRelationClick(visitedRelation)}
                  loading={false}
                  showCount={false}
                />
              </div>
            )}
            {interestedRelation && (
              <div className="shop-action-button">
                <ShopActionButton
                  type={interestedRelation}
                  count={0}
                  isActive={isInterested}
                  onClick={() => handleRelationClick(interestedRelation)}
                  loading={false}
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
          
          <div className={styles.welcomeCountContainer}>
            <ShopWelcomeCount
              count={welcomeCount}
              showTitle={false}
              variant="grid"
              className={styles.compactWelcomeCount}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default ShopGridCard;
