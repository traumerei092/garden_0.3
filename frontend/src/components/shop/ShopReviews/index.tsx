'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShopReview, VisitPurpose } from '@/types/shops';
import { fetchShopReviews, createShopReview, toggleReviewLike, fetchVisitPurposes } from '@/actions/shop/reviews';
import { Avatar, Button, Chip, Textarea, Spinner } from '@nextui-org/react';
import { ThumbsUp, MessageCircle, Send, Calendar, Users, Star, Tag, Filter, ArrowUpDown, Link2 } from 'lucide-react';
import { showToast } from '@/utils/toasts';
import CustomModal from '@/components/UI/Modal';
import CheckboxGroup from '@/components/UI/CheckboxGroup';
import ButtonGradient from '@/components/UI/ButtonGradient';
import ModalButtons from '@/components/UI/ModalButtons';
import styles from './style.module.scss';

interface ShopReviewsProps {
  shopId: number;
}

const ShopReviews: React.FC<ShopReviewsProps> = ({ shopId }) => {
  const [reviews, setReviews] = useState<ShopReview[]>([]);
  const [visitPurposes, setVisitPurposes] = useState<VisitPurpose[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<{ visit_purpose_id?: number; status?: string }>({});
  const [activeStatusFilter, setActiveStatusFilter] = useState<string>('all');
  const [selectedPurposeIds, setSelectedPurposeIds] = useState<string[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReview, setNewReview] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      // 複数の来店目的IDがある場合は最初のものを使用（バックエンドが複数対応していない場合）
      const purposeFilter = selectedPurposeIds.length > 0 ? { visit_purpose_id: parseInt(selectedPurposeIds[0]) } : {};
      const currentFilters = {
        ...filters,
        ...purposeFilter
      };
      
      const fetchedReviews = await fetchShopReviews(shopId, currentFilters);
      setReviews(fetchedReviews);
      setError(null);
    } catch (err) {
      console.error('口コミの読み込みエラー:', err);
      setError('口コミの読み込みに失敗しました。');
      showToast('口コミの読み込みに失敗しました。', 'error');
    } finally {
      setLoading(false);
    }
  }, [shopId, filters, selectedPurposeIds]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    const loadVisitPurposes = async () => {
      try {
        const purposes = await fetchVisitPurposes();
        setVisitPurposes(purposes);
      } catch (err) {
        console.error('来店目的リストの取得エラー:', err);
        showToast('来店目的リストの取得に失敗しました。', 'error');
      }
    };
    loadVisitPurposes();
  }, []);

  const handleLike = async (reviewId: number) => {
    try {
      const response = await toggleReviewLike(reviewId);
      setReviews(reviews.map(r => r.id === reviewId ? { ...r, is_liked: response.status === 'liked', likes_count: response.likes_count } : r));
    } catch (err) {
      console.error('いいね操作エラー:', err);
      showToast('操作に失敗しました。', 'error');
    }
  };

  const handleStatusFilterChange = (status: string) => {
    setActiveStatusFilter(status);
    setFilters(prev => ({ ...prev, status: status === 'all' ? undefined : status }));
  };

  const handlePurposeFilterChange = (purposeIds: string[]) => {
    setSelectedPurposeIds(purposeIds);
  };

  const handlePostReview = async () => {
    if (newReview.trim() === '') {
      showToast('口コミを入力してください。', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createShopReview(shopId, newReview, selectedPurpose);
      showToast('口コミを投稿しました！', 'success');
      setNewReview('');
      setSelectedPurpose(null);
      setIsModalOpen(false);
      loadReviews();
    } catch (err) {
      console.error('口コミ投稿エラー:', err);
      showToast('口コミの投稿に失敗しました。', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleReviewExpansion = (reviewId: number) => {
    const newExpandedReviews = new Set(expandedReviews);
    if (expandedReviews.has(reviewId)) {
      newExpandedReviews.delete(reviewId);
    } else {
      newExpandedReviews.add(reviewId);
    }
    setExpandedReviews(newExpandedReviews);
  };

  const findUserPreviousReviews = (currentUserId: number) => {
    return reviews.filter(review => 
      review.user.id === currentUserId
    ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  };

  const renderReviewCard = (review: ShopReview) => {
    const isExpanded = expandedReviews.has(review.id);
    const userPrevReviews = findUserPreviousReviews(review.user.id);
    const reviewIndex = userPrevReviews.findIndex(r => r.id === review.id);
    const isFirstReview = reviewIndex === 0;
    const hasMultipleReviews = userPrevReviews.length > 1;
    
    return (
      <div key={review.id} className={`${styles.reviewCard} ${isExpanded ? styles.expanded : ''}`}>
        <div className={styles.reviewHeader}>
          <div className={styles.userInfo}>
            <Avatar 
              src={review.user.avatar_url || '/assets/user/icon_user.png'} 
              className={styles.avatar} 
            />
            <div className={styles.userDetails}>
              <span className={styles.userName}>{review.user.name}</span>
              {hasMultipleReviews && (
                <div className={styles.reviewSequence}>
                  <Link2 size={12} />
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
            {hasMultipleReviews && (
              <Button
                size="sm"
                variant="light"
                className={styles.expandButton}
                onPress={() => toggleReviewExpansion(review.id)}
              >
                <ArrowUpDown size={14} />
                {isExpanded ? '折りたたむ' : 'このユーザーの他の口コミ'}
              </Button>
            )}
          </div>
        </div>
        
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
        
        <div className={styles.reviewFooter}>
          <Button 
            size="sm" 
            variant={review.is_liked ? "flat" : "ghost"}
            color={review.is_liked ? "primary" : "default"}
            startContent={<ThumbsUp size={14} fill={review.is_liked ? "currentColor" : "none"} />}
            onPress={() => handleLike(review.id)}
            className={`${styles.likeButton} ${review.is_liked ? styles.liked : ''}`}
          >
            役に立った ({review.likes_count})
          </Button>
        </div>
      </div>
    );
  };

  // CheckboxGroupのオプション形式に変換
  const purposeOptions = visitPurposes.map(purpose => ({
    label: purpose.name,
    value: purpose.id.toString()
  }));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>口コミ</h3>
        <ButtonGradient 
          onClick={() => setIsModalOpen(true)}
          anotherStyle={styles.writeReviewButton}
        >
          <MessageCircle size={16} style={{ marginRight: '8px' }} />
          口コミを投稿
        </ButtonGradient>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterSection}>
          <div className={styles.filterHeader}>
            <Filter size={16} />
            <span>フィルター</span>
          </div>
          
          <div className={styles.statusFilters}>
            <span className={styles.filterLabel}>来店頻度で絞り込み</span>
            <div className={styles.filterButtons}>
              <Button 
                size="sm" 
                variant={activeStatusFilter === 'all' ? 'solid' : 'bordered'} 
                onPress={() => handleStatusFilterChange('all')} 
                startContent={<Users size={14}/>}
                className={`${styles.statusFilterButton} ${activeStatusFilter === 'all' ? styles.active : ''}`}
              >
                すべて
              </Button>
              <Button 
                size="sm" 
                variant={activeStatusFilter === 'favorite' ? 'solid' : 'bordered'} 
                onPress={() => handleStatusFilterChange('favorite')} 
                startContent={<Star size={14}/>}
                className={`${styles.statusFilterButton} ${activeStatusFilter === 'favorite' ? styles.active : ''}`}
              >
                行きつけ
              </Button>
              <Button 
                size="sm" 
                variant={activeStatusFilter === 'visited' ? 'solid' : 'bordered'} 
                onPress={() => handleStatusFilterChange('visited')} 
                startContent={<Tag size={14}/>}
                className={`${styles.statusFilterButton} ${activeStatusFilter === 'visited' ? styles.active : ''}`}
              >
                ビギナー
              </Button>
            </div>
          </div>
          
          <div className={styles.purposeFilters}>
            <span className={styles.filterLabel}>来店目的で絞り込み（複数選択可）</span>
            <CheckboxGroup
              name="visit-purposes"
              values={selectedPurposeIds}
              onChange={handlePurposeFilterChange}
              options={purposeOptions}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.centered}><Spinner label="読み込み中..." /></div>
      ) : error ? (
        <div className={styles.centered}>{error}</div>
      ) : reviews.length > 0 ? (
        <div className={styles.reviewList}>
          {reviews.map(renderReviewCard)}
        </div>
      ) : (
        <div className={styles.noReviews}>まだ口コミはありません。</div>
      )}

      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="口コミを投稿"
        size="lg"
        footer={
          <ModalButtons
            onCancel={() => setIsModalOpen(false)}
            onSave={handlePostReview}
            isLoading={isSubmitting}
            isDisabled={newReview.trim() === ''}
            saveText="投稿する"
            cancelText="キャンセル"
          />
        }
      >
        <div className={styles.modalContent}>
          <div className={styles.textareaContainer}>
            <Textarea
              label="口コミ"
              placeholder="お店の感想を共有しましょう。

例：
・一人でも気軽に入れる雰囲気でした
・カウンター席で常連さんとの会話も楽しめました
・マスターの人柄が素晴らしく、また来たいと思える場所です"
              value={newReview}
              onValueChange={setNewReview}
              minRows={6}
              maxRows={12}
              className={styles.reviewTextarea}
            />
          </div>
          
          <div className={styles.purposeSelection}>
            <h4 className={styles.purposeTitle}>
              <Tag size={16} />
              来店目的（任意）
            </h4>
            <div className={styles.purposeChipsContainer}>
              {visitPurposes.map(p => (
                <Chip 
                  key={p.id} 
                  variant={selectedPurpose === p.id ? 'shadow' : 'flat'} 
                  color={selectedPurpose === p.id ? 'primary' : 'default'} 
                  onClick={() => setSelectedPurpose(selectedPurpose === p.id ? null : p.id)}
                  className={`${styles.purposeSelectChip} ${selectedPurpose === p.id ? styles.selected : ''}`}
                >
                  {p.name}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </CustomModal>
    </div>
  );
};

export default ShopReviews;