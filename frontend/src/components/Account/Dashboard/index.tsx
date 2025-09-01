'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link, Chip } from '@nextui-org/react';
import { Crown, Star, Heart, Eye, MessageSquare, Clock, ChevronRight, ChevronDown, BarChart3, Tag, ChartBar, HeartHandshake, ClipboardList } from 'lucide-react';
import { 
  fetchDashboardSummary, 
  fetchViewHistory, 
  fetchReviewHistory, 
  fetchRecentActivity,
  fetchAtmosphereFeedbackHistory,
  fetchTagReactionHistory,
  type DashboardSummary,
  type ViewHistoryItem,
  type ReviewHistoryItem,
  type RecentActivityItem,
  type AtmosphereFeedbackHistoryItem,
  type TagReactionHistoryItem,
  type FavoriteShopDetail,
  type VisitedShopDetail
} from '@/actions/profile/fetchDashboardData';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import styles from './style.module.scss';

const Dashboard = () => {
  const router = useRouter();
  
  // State for dashboard data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [viewHistory, setViewHistory] = useState<ViewHistoryItem[]>([]);
  const [reviewHistory, setReviewHistory] = useState<ReviewHistoryItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [atmosphereFeedbackHistory, setAtmosphereFeedbackHistory] = useState<AtmosphereFeedbackHistoryItem[]>([]);
  const [tagReactionHistory, setTagReactionHistory] = useState<TagReactionHistoryItem[]>([]);
  
  // Accordion states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Data fetching
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, viewData, reviewData, activityData, atmosphereData, tagData] = await Promise.all([
        fetchDashboardSummary(),
        fetchViewHistory(5),
        fetchReviewHistory(5), 
        fetchRecentActivity(5),
        fetchAtmosphereFeedbackHistory(5),
        fetchTagReactionHistory(5)
      ]);

      setSummary(summaryData);
      setViewHistory(viewData);
      setReviewHistory(reviewData);
      setRecentActivity(activityData);
      setAtmosphereFeedbackHistory(atmosphereData);
      setTagReactionHistory(tagData);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Format time helper
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}分前`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}時間前`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}日前`;
    }
  };

  // Navigation handlers
  const handleViewMoreClick = (type: string) => {
    switch (type) {
      case 'favorite':
        router.push('/favorite');
        break;
      case 'visited':
        router.push('/visited');
        break;
      case 'wishlist':
        router.push('/wishlist');
        break;
      case 'view':
        router.push('/profile?tab=view-history');
        break;
      case 'review':
        router.push('/profile?tab=review-history');
        break;
      case 'activity':
        router.push('/profile?tab=activity-history');
        break;
    }
  };

  // Accordion toggle handler
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  if (loading) {
    return (
      <div className={styles.dashboardContainer}>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.dashboardContainer}>
        <div className={styles.errorMessage}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      {/* サマリーエリア - リスト表示 */}
      <div className={styles.summaryList}>
        {/* 行きつけの店 - 特別にハイライト */}
        <div className={`${styles.summaryCard} ${styles.favoriteCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.statIcon}>
              <Crown size={18} fill='#00ffff' strokeWidth={0}/>
            </div>
            <div className={styles.statInfo}>
              <h3 className={styles.statValue}>{summary?.favorite_shops_count || 0}</h3>
              <p className={styles.statLabel}>行きつけの店</p>
            </div>
            <ButtonGradientWrapper 
              anotherStyle={styles.detailButton} 
              onClick={() => handleViewMoreClick('favorite')}
            >
              詳しく見る
            </ButtonGradientWrapper>
          </div>
          
          {summary && summary.favorite_shops_count > 0 && (
            <div className={styles.favoriteDetails}>
              {/* ウェルカムアコーディオン */}
              <div className={styles.accordionSection}>
                <div 
                  className={styles.accordionHeader}
                  onClick={() => toggleSection('welcome')}
                >
                  <span className={styles.accordionTitle}>
                    <HeartHandshake size={16} strokeWidth={1} className={styles.accordionIcon} />
                    {summary.total_welcome_count}件のお店でウェルカム
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections.welcome ? styles.rotated : ''}
                  />
                </div>
                {expandedSections.welcome && (
                  <div className={styles.accordionContent}>
                    <div className={styles.shopList}>
                      {summary.favorite_shops_details.map(shop => (
                        <div key={shop.shop_id} className={styles.shopItem}>
                          <Link href={`/shops/${shop.shop_id}`} className={styles.shopName}>
                            {shop.shop_name}
                          </Link>
                          <div className={styles.shopStatus}>
                            {shop.is_welcomed_by_user ? (
                              <Chip size="sm" color="success" variant="flat">
                                ウェルカム済
                              </Chip>
                            ) : (
                              <Chip size="sm" color="default" variant="flat">
                                未ウェルカム
                              </Chip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* 雰囲気ギャップ分析アコーディオン */}
              <div className={styles.accordionSection}>
                <div 
                  className={styles.accordionHeader}
                  onClick={() => toggleSection('atmosphere-gap')}
                >
                  <span className={styles.accordionTitle}>
                    <ChartBar size={16} strokeWidth={1} className={styles.accordionIcon} />
                    雰囲気ギャップ分析
                  </span>
                  <ChevronDown 
                    size={16} 
                    className={expandedSections['atmosphere-gap'] ? styles.rotated : ''}
                  />
                </div>
                {expandedSections['atmosphere-gap'] && (
                  <div className={styles.accordionContent}>
                    <div className={styles.atmosphereComparison}>
                      <div className={styles.comparisonSection}>
                        <h4 className={styles.comparisonTitle}>あなたの好み</h4>
                        <div className={styles.preferenceBars}>
                          {Object.entries(summary.user_atmosphere_preferences || {}).map(([indicatorId, score]) => {
                            const safeScore = typeof score === 'number' ? score : 0;
                            const safeWidth = Math.max(0, Math.min(100, ((safeScore + 2) / 4) * 100));
                            return (
                              <div key={indicatorId} className={styles.preferenceBar}>
                                <span className={styles.indicatorLabel}>指標{indicatorId}</span>
                                <div className={styles.scoreBar}>
                                  <div 
                                    className={styles.scoreValue}
                                    style={{ width: `${safeWidth}%` }}
                                  >
                                    {safeScore}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className={styles.comparisonSection}>
                        <h4 className={styles.comparisonTitle}>行きつけの店平均</h4>
                        <div className={styles.preferenceBars}>
                          {Object.entries(summary.favorite_shops_atmosphere_average || {}).map(([indicatorId, score]) => {
                            const safeScore = typeof score === 'number' ? score : 0;
                            const safeWidth = Math.max(0, Math.min(100, ((safeScore + 2) / 4) * 100));
                            return (
                              <div key={indicatorId} className={styles.preferenceBar}>
                                <span className={styles.indicatorLabel}>指標{indicatorId}</span>
                                <div className={styles.scoreBar}>
                                  <div 
                                    className={styles.scoreValue}
                                    style={{ width: `${safeWidth}%` }}
                                  >
                                    {safeScore.toFixed(1)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 行った店 */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <div className={styles.statIcon}>
              <Star size={18} fill='#ffc107' strokeWidth={0}/>
            </div>
            <div className={styles.statInfo}>
              <h3 className={styles.statValue}>{summary?.visited_shops_count || 0}</h3>
              <p className={styles.statLabel}>行った店</p>
            </div>
            <ButtonGradientWrapper 
              anotherStyle={styles.detailButton} 
              onClick={() => handleViewMoreClick('visited')}
            >
              詳しく見る
            </ButtonGradientWrapper>
          </div>
          
          {summary && summary.visited_shops_count > 0 && (
            <div className={styles.visitedDetails}>
              {/* フィードバック状況アコーディオン */}
              <div className={styles.accordionSection}>
                <div 
                  className={styles.accordionHeader}
                  onClick={() => toggleSection('feedback-status')}
                >
                  <span className={styles.accordionTitle}>
                    <ClipboardList size={16} strokeWidth={1} className={styles.accordionIcon} />
                    行った店のフィードバック状況
                  </span>
                  {summary.visited_without_feedback_count > 0 && (
                    <Chip size="sm" color="warning" variant="flat">
                      {summary.visited_without_feedback_count}店未完了
                    </Chip>
                  )}
                  <ChevronDown 
                    size={16} 
                    className={expandedSections['feedback-status'] ? styles.rotated : ''}
                  />
                </div>
                {expandedSections['feedback-status'] && (
                  <div className={styles.accordionContent}>
                    <div className={styles.shopList}>
                      {summary.visited_shops_details.map(shop => (
                        <div key={shop.shop_id} className={styles.shopItem}>
                          <Link href={`/shops/${shop.shop_id}`} className={styles.shopName}>
                            {shop.shop_name}
                          </Link>
                          <div className={styles.shopStatus}>
                            {shop.has_feedback ? (
                              <Chip size="sm" color="success" variant="flat">
                                フィードバック済
                              </Chip>
                            ) : (
                              <Chip size="sm" color="warning" variant="flat">
                                未フィードバック
                              </Chip>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* 気になる店 */}
        <div className={styles.summaryCard}>
          <div className={styles.cardHeader}>
            <div className={styles.statIcon}>
              <Heart size={18} fill='#ef4444' strokeWidth={0}/>
            </div>
            <div className={styles.statInfo}>
              <h3 className={styles.statValue}>{summary?.interested_shops_count || 0}</h3>
              <p className={styles.statLabel}>気になる店</p>
            </div>
            <ButtonGradientWrapper 
              anotherStyle={styles.detailButton} 
              onClick={() => handleViewMoreClick('wishlist')}
            >
              詳しく見る
            </ButtonGradientWrapper>
          </div>
        </div>
      </div>
      
      {/* 履歴セクション - 2列グリッド */}
      <div className={styles.historyGrid}>
        {/* 閲覧履歴 */}
        <div className={styles.historySection}>
          <div 
            className={styles.sectionHeader}
            onClick={() => toggleSection('view')}
          >
            <div className={styles.sectionIcon}>
              <Eye size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>閲覧履歴</h3>
            <div className={styles.headerActions}>
              <span className={styles.toggleIcon}>
                <ChevronDown 
                  size={16} 
                  className={expandedSections.view ? styles.rotated : ''}
                />
              </span>
            </div>
          </div>
          
          <div className={`${styles.historyList} ${!expandedSections.view ? styles.collapsed : ''}`}>
            {viewHistory.length > 0 ? (
              viewHistory.slice(0, expandedSections.view ? viewHistory.length : 3).map(item => (
                <div key={item.id} className={styles.historyItem}>
                  <Link href={`/shops/${item.shop_id}`} className={styles.historyName}>{item.shop_name}</Link>
                  <p className={styles.historyTime}>{formatTimeAgo(item.viewed_at)}</p>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>まだ閲覧履歴がありません</p>
              </div>
            )}
            
            {!expandedSections.view && viewHistory.length > 3 && (
              <div className={styles.moreIndicator}>
                <span>他 {viewHistory.length - 3}件</span>
              </div>
            )}
          </div>
        </div>
      
        {/* 口コミ履歴 */}
        <div className={styles.historySection}>
          <div 
            className={styles.sectionHeader}
            onClick={() => toggleSection('review')}
          >
            <div className={styles.sectionIcon}>
              <MessageSquare size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>口コミ履歴</h3>
            <div className={styles.headerActions}>
              <span className={styles.toggleIcon}>
                <ChevronDown 
                  size={16} 
                  className={expandedSections.review ? styles.rotated : ''}
                />
              </span>
            </div>
          </div>
          
          <div className={`${styles.reviewList} ${!expandedSections.review ? styles.collapsed : ''}`}>
            {reviewHistory.length > 0 ? (
              reviewHistory.slice(0, expandedSections.review ? reviewHistory.length : 3).map(item => (
                <div key={item.id} className={styles.reviewItem}>
                  <div className={styles.reviewHeader}>
                    <Link href={`/shops/${item.shop_id}`} className={styles.reviewShop}>{item.shop_name}</Link>
                    <p className={styles.reviewTime}>{formatTimeAgo(item.created_at)}</p>
                  </div>
                  <p className={styles.reviewContent}>
                    {item.content.length > 50 ? `${item.content.slice(0, 50)}...` : item.content}
                  </p>
                  {item.visit_purpose && item.visit_purpose.name && (
                    <div className={styles.reviewPurpose}>
                      <Chip size="sm" variant="flat" color="primary">
                        {item.visit_purpose.name}
                      </Chip>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>まだ口コミがありません</p>
              </div>
            )}
            
            {!expandedSections.review && reviewHistory.length > 3 && (
              <div className={styles.moreIndicator}>
                <span>他 {reviewHistory.length - 3}件</span>
              </div>
            )}
          </div>
        </div>
      
        {/* 雰囲気フィードバック履歴 */}
        <div className={styles.historySection}>
          <div 
            className={styles.sectionHeader}
            onClick={() => toggleSection('atmosphere')}
          >
            <div className={styles.sectionIcon}>
              <BarChart3 size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>雰囲気フィードバック履歴</h3>
            <div className={styles.headerActions}>
              <span className={styles.toggleIcon}>
                <ChevronDown 
                  size={16} 
                  className={expandedSections.atmosphere ? styles.rotated : ''}
                />
              </span>
            </div>
          </div>
          
          <div className={`${styles.atmosphereList} ${!expandedSections.atmosphere ? styles.collapsed : ''}`}>
            {atmosphereFeedbackHistory.length > 0 ? (
              atmosphereFeedbackHistory.slice(0, expandedSections.atmosphere ? atmosphereFeedbackHistory.length : 3).map(item => (
                <div key={item.id} className={styles.atmosphereItem}>
                  <div className={styles.atmosphereHeader}>
                    <Link href={`/shops/${item.shop_id}`} className={styles.atmosphereShop}>{item.shop_name}</Link>
                    <p className={styles.atmosphereTime}>{formatTimeAgo(item.created_at)}</p>
                  </div>
                  <div className={styles.atmosphereScores}>
                    {Object.entries(item.atmosphere_scores).slice(0, 3).map(([key, value]) => (
                      <div key={key} className={styles.scoreChip}>
                        <span className={styles.scoreValue}>{value}</span>
                      </div>
                    ))}
                    {Object.keys(item.atmosphere_scores).length > 3 && (
                      <span className={styles.moreScores}>+{Object.keys(item.atmosphere_scores).length - 3}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>まだ雰囲気フィードバックがありません</p>
              </div>
            )}
            
            {!expandedSections.atmosphere && atmosphereFeedbackHistory.length > 3 && (
              <div className={styles.moreIndicator}>
                <span>他 {atmosphereFeedbackHistory.length - 3}件</span>
              </div>
            )}
          </div>
        </div>
        
        {/* 印象タグ履歴 */}
        <div className={styles.historySection}>
          <div 
            className={styles.sectionHeader}
            onClick={() => toggleSection('tags')}
          >
            <div className={styles.sectionIcon}>
              <Tag size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>印象タグ履歴</h3>
            <div className={styles.headerActions}>
              <span className={styles.toggleIcon}>
                <ChevronDown 
                  size={16} 
                  className={expandedSections.tags ? styles.rotated : ''}
                />
              </span>
            </div>
          </div>
          
          <div className={`${styles.tagsList} ${!expandedSections.tags ? styles.collapsed : ''}`}>
            {tagReactionHistory.length > 0 ? (
              tagReactionHistory.slice(0, expandedSections.tags ? tagReactionHistory.length : 3).map(item => (
                <div key={item.id} className={styles.tagItem}>
                  <div className={styles.tagHeader}>
                    <Link href={`/shops/${item.shop_id}`} className={styles.tagShop}>{item.shop_name}</Link>
                    <p className={styles.tagTime}>{formatTimeAgo(item.reacted_at)}</p>
                  </div>
                  <div className={styles.tagContent}>
                    <Chip size="sm" variant="flat" color="secondary">
                      {item.tag_text}
                    </Chip>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <p>まだタグ反応がありません</p>
              </div>
            )}
            
            {!expandedSections.tags && tagReactionHistory.length > 3 && (
              <div className={styles.moreIndicator}>
                <span>他 {tagReactionHistory.length - 3}件</span>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 最近のアクティビティ */}
      <div className={styles.activitySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Clock size={18} strokeWidth={1}/>
          </div>
          <h3 className={styles.sectionTitle}>最近のアクティビティ</h3>
          <ButtonGradientWrapper 
            anotherStyle={styles.viewMoreButton} 
            onClick={() => handleViewMoreClick('activity')}
          >
            詳しく見る <ChevronRight size={16} />
          </ButtonGradientWrapper>
        </div>
        
        <div className={styles.activityList}>
          {recentActivity.length > 0 ? (
            recentActivity.map(item => (
              <div key={item.id} className={styles.activityItem}>
                <div className={styles.activityDot}></div>
                <div className={styles.activityContent}>
                  {item.shop_name ? (
                    <p className={styles.activityText}>
                      <span className={styles.activityType}>{item.shop_name}</span>を
                      {item.type === 'view' && '閲覧'}
                      {item.type === 'review' && 'レビュー投稿'}
                      {item.type === 'favorite' && 'お気に入り追加'}
                      {item.type === 'visited' && '訪問記録'}
                      {item.type === 'interested' && '気になるリスト追加'}
                    </p>
                  ) : (
                    <p className={styles.activityText}>
                      <span className={styles.activityType}>{item.content}</span>
                    </p>
                  )}
                  <p className={styles.activityTime}>{formatTimeAgo(item.created_at)}</p>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <p>まだアクティビティがありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
