'use client';

import React from 'react';
import { Shop } from '@/types/shops';
import { Star, MessageCircle, ThumbsUp, Calendar } from 'lucide-react';
import { Avatar } from '@nextui-org/react';
import styles from './style.module.scss';

interface ShopReviewsProps {
  shop: Shop;
}

const ShopReviews: React.FC<ShopReviewsProps> = ({ shop }) => {
  // サンプルレビューデータ
  const reviews = [
    {
      id: 1,
      user: {
        name: 'ユーザー1',
        avatar: '/assets/user/icon_user.png',
      },
      rating: 4.5,
      date: '2025/05/15',
      content: 'とても雰囲気が良く、お酒の種類も豊富でした。マスターの対応も素晴らしく、また行きたいと思います。カクテルの種類が豊富で、好みに合わせて作ってくれました。',
      likes: 12,
    },
    {
      id: 2,
      user: {
        name: 'ユーザー2',
        avatar: '/assets/user/icon_user.png',
      },
      rating: 5,
      date: '2025/05/10',
      content: '初めて行きましたが、スタッフの方々がとても親切で居心地が良かったです。お酒も美味しく、特にウイスキーのセレクションが素晴らしかったです。',
      likes: 8,
    },
    {
      id: 3,
      user: {
        name: 'ユーザー3',
        avatar: '/assets/user/icon_user.png',
      },
      rating: 4,
      date: '2025/05/05',
      content: '静かな雰囲気で落ち着いて飲めるバーです。カウンター席からの眺めも良く、一人でも気軽に入れる雰囲気でした。ただ、少し混んでいたので次回は予約していこうと思います。',
      likes: 5,
    },
  ];

  // 星評価を表示する関数
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`full-${i}`} fill="#FFD700" color="#FFD700" size={16} />);
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className={styles.halfStar}>
          <Star fill="#FFD700" color="#FFD700" size={16} />
          <Star color="#FFD700" size={16} />
        </div>
      );
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} color="#FFD700" size={16} />);
    }

    return <div className={styles.stars}>{stars}</div>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.reviewHeader}>
        <h3 className={styles.sectionTitle}>口コミ</h3>
        <button className={styles.writeReviewButton}>
          <MessageCircle size={16} />
          口コミを書く
        </button>
      </div>

      {reviews.length > 0 ? (
        <div className={styles.reviewList}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.userInfo}>
                  <Avatar src={review.user.avatar} className={styles.avatar} />
                  <div className={styles.nameAndRating}>
                    <div className={styles.userName}>{review.user.name}</div>
                    <div className={styles.ratingContainer}>
                      {renderStars(review.rating)}
                      <span className={styles.ratingValue}>{review.rating}</span>
                    </div>
                  </div>
                </div>
                <div className={styles.reviewDate}>
                  <Calendar size={14} />
                  <span>{review.date}</span>
                </div>
              </div>
              <div className={styles.reviewContent}>{review.content}</div>
              <div className={styles.reviewFooter}>
                <button className={styles.likeButton}>
                  <ThumbsUp size={14} />
                  <span>役に立った ({review.likes})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noReviews}>
          まだ口コミはありません。最初の口コミを投稿してみませんか？
        </div>
      )}
    </div>
  );
};

export default ShopReviews;
