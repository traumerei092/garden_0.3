'use client';

import React from 'react';
import { Avatar, Button, Chip, Link } from '@nextui-org/react';
import { ThumbsUp, Calendar, Tag, ArrowUpDown, Link2 } from 'lucide-react';
import { ShopReview } from '@/types/shops';
import styles from './style.module.scss';

interface ReviewCardProps {
  review: ShopReview;
  allReviews: ShopReview[];
  isExpanded?: boolean;
  showUserLink?: boolean;
  showShopLink?: boolean;
  onLike?: (reviewId: number) => void;
  onToggleExpansion?: (reviewId: number) => void;
}

const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  allReviews,
  isExpanded = false,
  showUserLink = true,
  showShopLink = false,
  onLike,
  onToggleExpansion,
}) => {
  // ユーザーの過去のレビューを検索
  const findUserPreviousReviews = (currentUserId: number) => {
    return allReviews.filter(r => 
      r.user.id === currentUserId
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const userPrevReviews = findUserPreviousReviews(review.user.id);
  const reviewIndex = userPrevReviews.findIndex(r => r.id === review.id);
  const isFirstReview = reviewIndex === 0;
  const hasMultipleReviews = userPrevReviews.length > 1;

  const handleLike = () => {
    if (onLike) {
      onLike(review.id);
    }
  };

  const handleToggleExpansion = () => {
    if (onToggleExpansion) {
      onToggleExpansion(review.id);
    }
  };

  return (
    <div className={`${styles.reviewCard} ${isExpanded ? styles.expanded : ''}`}>
      <div className={styles.reviewHeader}>
        <div className={styles.userInfo}>
          <Link href={`/user/${review.user.uid}`} className={styles.userName}>
            <Avatar 
              src={review.user.avatar_url || '/assets/user/icon_user.png'} 
              className={styles.avatar} 
            />
          </Link>
          <div className={styles.userDetails}>
            {showUserLink ? (
              <Link href={`/user/${review.user.uid}`} className={styles.userName}>
                {review.user.name}
              </Link>
            ) : (
              <span className={styles.userName}>{review.user.name}</span>
            )}
            {hasMultipleReviews && (
              <div className={styles.reviewSequence}>
                <Link2 size={12} strokeWidth={1}/>
                <span>{isFirstReview ? '初回' : `${reviewIndex + 1}回目の口コミ`}</span>
              </div>
            )}
          </div>
        </div>
        <div className={styles.reviewMeta}>
          <div className={styles.reviewDate}>
            <Calendar size={14} />
            <span>{new Date(review.created_at).toLocaleDateString()}</span>
          </div>
          {hasMultipleReviews && onToggleExpansion && (
            <Button
              size="sm"
              variant="light"
              className={styles.expandButton}
              onPress={handleToggleExpansion}
            >
              <ArrowUpDown size={14} />
              {isExpanded ? '折りたたむ' : 'このユーザーの他の口コミ'}
            </Button>
          )}
        </div>
      </div>
      
      {/* ショップリンク（プロフィールページ用） */}
      {showShopLink && review.shop && (
        <div className={styles.shopLink}>
          <Link href={`/shops/${review.shop.id}`} className={styles.shopName}>
            {review.shop.name}
          </Link>
        </div>
      )}
      
      {review.visit_purpose && (
        <div className={styles.visitPurpose}>
          <Tag size={14} />
          <span>{review.visit_purpose.name}</span>
        </div>
      )}
      
      <p className={styles.reviewContent}>{review.comment}</p>
      
      {isExpanded && hasMultipleReviews && (
        <div className={styles.relatedReviews}>
          <h4 className={styles.relatedTitle}>この方の他の口コミ</h4>
          <div className={styles.relatedList}>
            {userPrevReviews
              .filter(r => r.id !== review.id)
              .map((relatedReview) => (
                <div key={relatedReview.id} className={styles.relatedReviewItem}>
                  <div className={styles.relatedHeader}>
                    <span className={styles.relatedDate}>
                      {new Date(relatedReview.created_at).toLocaleDateString()}
                    </span>
                    {relatedReview.visit_purpose && (
                      <Chip size="sm" variant="flat" className={styles.relatedPurpose}>
                        {relatedReview.visit_purpose.name}
                      </Chip>
                    )}
                  </div>
                  <p className={styles.relatedContent}>{relatedReview.comment}</p>
                </div>
              ))
            }
          </div>
        </div>
      )}
      
      {onLike && (
        <div className={styles.reviewFooter}>
          <Button 
            size="sm" 
            variant={review.is_liked ? "flat" : "ghost"}
            color={review.is_liked ? "primary" : "default"}
            startContent={<ThumbsUp size={14} fill={review.is_liked ? "currentColor" : "none"} />}
            onPress={handleLike}
            className={`${styles.likeButton} ${review.is_liked ? styles.liked : ''}`}
          >
            役に立った ({review.likes_count})
          </Button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;