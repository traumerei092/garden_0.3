'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link, Chip } from '@nextui-org/react';
import DarkAccordion, { DarkAccordionItem } from '@/components/UI/DarkAccordion';
import { Crown, Star, Heart, Eye, MessageSquare, Clock, ChevronRight, ChevronDown, ChevronUp, BarChart3, Tag, ChartBar, HeartHandshake, ClipboardList } from 'lucide-react';
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
  
  // Expandable sections states
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Data fetching
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [summaryData, viewData, reviewData, activityData, atmosphereData, tagData] = await Promise.all([
        fetchDashboardSummary(),
        fetchViewHistory(220),
        fetchReviewHistory(20), 
        fetchRecentActivity(20),
        fetchAtmosphereFeedbackHistory(20),
        fetchTagReactionHistory(20)
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

  // Section toggle handler
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Remove duplicates from recent activity
  const uniqueRecentActivity = recentActivity.filter((item, index, self) => 
    index === self.findIndex(t => (
      t.type === item.type && 
      t.shop_id === item.shop_id && 
      t.content === item.content
    ))
  );

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
              <h3 className={styles.statValue}>行きつけの店舗数：
                <span className={styles.statFavoriteCount}>{summary?.favorite_shops_count || 0}</span>
              </h3>
            </div>
            <ButtonGradientWrapper 
              anotherStyle={styles.detailButton} 
              onClick={() => handleViewMoreClick('favorite')}
            >
              詳しく見る
              <ChevronRight size={12} />
            </ButtonGradientWrapper>
          </div>
          
          {summary && summary.favorite_shops_count > 0 && (
            <div className={styles.favoriteDetails}>
              <DarkAccordion variant="splitted" className={styles.accordion}>
                <DarkAccordionItem
                  key="welcome"
                  aria-label="ウェルカム状況"
                  startContent={<HeartHandshake size={16} strokeWidth={1} className={styles.accordionIcon} />}
                  title={`行きつけの店舗：${summary.favorite_shops_count}件　そのうち${summary.total_welcome_count}件でウェルカム済み`}
                  className={styles.accordionItem}
                >
                  <div className={styles.shopList}>
                    {summary.favorite_shops_details.map(shop => (
                      <div key={shop.shop_id} className={styles.shopItem}>
                        <Link href={`/shops/${shop.shop_id}`} className={styles.shopName}>
                          {shop.shop_name}
                        </Link>
                        <div className={styles.shopStatus}>
                          {shop.is_welcomed_by_user ? (
                            <Chip size="sm" variant="flat" className={styles.welcomedChip}>
                              ウェルカム済
                            </Chip>
                          ) : (
                            <Chip size="sm" variant="flat" className={styles.unWelcomedChip}>
                              未ウェルカム
                            </Chip>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </DarkAccordionItem>

                <DarkAccordionItem
                  key="atmosphere-gap"
                  aria-label="雰囲気ギャップ分析"
                  startContent={<ChartBar size={16} strokeWidth={1} className={styles.accordionIcon} />}
                  title="あなたの好みと実際のギャップ"
                  className={styles.accordionItem}
                >
                  <div className={styles.atmosphereComparisonNew}>
                    <div className={styles.comparisonGrid}>
                      <div className={styles.comparisonColumn}>
                        <h4 className={styles.sectionHeading}>設定した好みの雰囲気</h4>
                        <div className={styles.atmosphereGrid}>
                          {Object.entries(summary.user_atmosphere_preferences || {}).map(([indicatorId, score]) => {
                            const safeScore = typeof score === 'number' ? score : 0;
                            const intensity = Math.abs(safeScore) / 2;
                            const isPositive = safeScore > 0;
                            return (
                              <div key={indicatorId} className={styles.atmosphereItem}>
                                <div className={styles.atmosphereLabel}>指標{indicatorId}</div>
                                <div 
                                  className={`${styles.atmosphereIndicator} ${isPositive ? styles.positive : styles.negative}`}
                                  style={{ 
                                    opacity: Math.max(0.3, intensity),
                                    transform: `scale(${0.8 + intensity * 0.4})`
                                  }}
                                >
                                  {safeScore > 0 ? '+' : ''}{safeScore}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className={styles.comparisonColumn}>
                        <h4 className={styles.sectionHeading}>行きつけの店舗の平均</h4>
                        <div className={styles.atmosphereGrid}>
                          {Object.entries(summary.favorite_shops_atmosphere_average || {}).map(([indicatorId, score]) => {
                            const safeScore = typeof score === 'number' ? score : 0;
                            const intensity = Math.abs(safeScore) / 2;
                            const isPositive = safeScore > 0;
                            const userScore = summary.user_atmosphere_preferences?.[indicatorId] || 0;
                            const gap = Math.abs(safeScore - userScore);
                            const hasLargeGap = gap > 1;
                            return (
                              <div key={indicatorId} className={styles.atmosphereItem}>
                                <div className={styles.atmosphereLabel}>
                                  指標{indicatorId}
                                  {hasLargeGap && <span className={styles.gapWarning}>⚠️</span>}
                                </div>
                                <div 
                                  className={`${styles.atmosphereIndicator} ${isPositive ? styles.positive : styles.negative} ${hasLargeGap ? styles.hasGap : ''}`}
                                  style={{ 
                                    opacity: Math.max(0.3, intensity),
                                    transform: `scale(${0.8 + intensity * 0.4})`
                                  }}
                                >
                                  {safeScore > 0 ? '+' : ''}{safeScore.toFixed(1)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className={styles.gapInsight}>
                      <p className={styles.insightText}>
                        💡 ⚠️マークがある項目は大きなギャップあり！新しい発見のチャンスかも
                      </p>
                    </div>
                  </div>
                </DarkAccordionItem>
              </DarkAccordion>
            </div>
          )}
        </div>
        
        {/* 行った店 */}
        <div className={`${styles.summaryCard} ${styles.favoriteCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.statIcon}>
              <Star size={18} fill='#ffc107' strokeWidth={0}/>
            </div>
            <div className={styles.statInfo}>
              <h3 className={styles.statValue}>行った店舗数：
                <span className={styles.statVisitedCount}>{summary?.visited_shops_count || 0}</span>
              </h3>
            </div>
            <ButtonGradientWrapper 
              anotherStyle={styles.detailButton} 
              onClick={() => handleViewMoreClick('visited')}
            >
              詳しく見る
              <ChevronRight size={12} />
            </ButtonGradientWrapper>
          </div>
          
          {summary && summary.visited_shops_count > 0 && (
            <div className={styles.visitedDetails}>
              <DarkAccordion variant="splitted" className={styles.accordion}>
                <DarkAccordionItem
                  key="feedback-status"
                  aria-label="フィードバック状況"
                  startContent={<ClipboardList size={16} strokeWidth={1} className={styles.accordionIcon} />}
                  title={`雰囲気フィードバック完了率: ${Math.round(((summary.visited_shops_count - summary.visited_without_feedback_count) / summary.visited_shops_count) * 100)}%`}
                  className={styles.accordionItem}
                >
                  <div className={styles.feedbackStats}>
                    <div className={styles.progressBar}>
                      <div 
                        className={styles.progressFill}
                        style={{ 
                          width: `${((summary.visited_shops_count - summary.visited_without_feedback_count) / summary.visited_shops_count) * 100}%` 
                        }}
                      />
                    </div>
                    <p className={styles.progressText}>
                      あと{summary.visited_without_feedback_count}店でフィードバック完了！
                    </p>
                  </div>

                  <div className={styles.shopList}>
                    {summary.visited_shops_details.map(shop => (
                      <div key={shop.shop_id} className={styles.shopItem}>
                        <Link href={`/shops/${shop.shop_id}`} className={styles.shopName}>
                          {shop.shop_name}
                        </Link>
                        <div className={styles.shopStatus}>
                          {shop.has_feedback ? (
                            <Chip size="sm" variant="flat" className={styles.welcomedChip}>
                              フィードバック済
                            </Chip>
                          ) : (
                            <ButtonGradientWrapper 
                              anotherStyle={styles.feedbackButton}
                              onClick={() => router.push(`/shops/${shop.shop_id}?action=feedback`)}
                            >
                              フィードバックする
                            </ButtonGradientWrapper>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </DarkAccordionItem>
              </DarkAccordion>
            </div>
          )}
        </div>
        
        {/* 気になる店 */}
        <div className={`${styles.summaryCard} ${styles.favoriteCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.statIcon}>
              <Heart size={18} fill='#ef4444' strokeWidth={0}/>
            </div>
            <div className={styles.statInfo}>
              <h3 className={styles.statValue}>気になる店舗数：
                <span className={styles.statInterestedCount}>{summary?.interested_shops_count || 0}</span>
              </h3>
            </div>
            <ButtonGradientWrapper 
              anotherStyle={styles.detailButton} 
              onClick={() => handleViewMoreClick('wishlist')}
            >
              詳しく見る
              <ChevronRight size={12} />
            </ButtonGradientWrapper>
          </div>
        </div>
      </div>
      
      {/* 履歴セクション - 2列グリッド */}
      <div className={styles.historyGrid}>
        {/* 閲覧履歴 */}
        <div className={styles.modernHistorySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <Eye size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>閲覧履歴</h3>
          </div>
          
          {viewHistory.length > 0 ? (
            <>
              {!expandedSections.view ? (
                <>
                  <div className={styles.previewList}>
                    {viewHistory.slice(0, 3).map(item => (
                      <div key={item.id} className={styles.historyItem}>
                        <Link href={`/shops/${item.shop_id}`} className={styles.historyName}>{item.shop_name}</Link>
                        <p className={styles.historyTime}>{formatTimeAgo(item.viewed_at)}</p>
                      </div>
                    ))}
                  </div>
                  {viewHistory.length > 3 && (
                    <button 
                      className={styles.expandButton}
                      onClick={() => toggleSection('view')}
                    >
                      <ChevronDown size={20} strokeWidth={1} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.scrollableList}>
                    {viewHistory.map(item => (
                      <div key={item.id} className={styles.historyItem}>
                        <Link href={`/shops/${item.shop_id}`} className={styles.historyName}>{item.shop_name}</Link>
                        <p className={styles.historyTime}>{formatTimeAgo(item.viewed_at)}</p>
                      </div>
                    ))}
                  </div>
                  <button 
                    className={styles.collapseButton}
                    onClick={() => toggleSection('view')}
                  >
                    <ChevronUp size={20} strokeWidth={1} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>まだ閲覧履歴がありません</p>
            </div>
          )}
        </div>
      
        {/* 口コミ履歴 */}
        <div className={styles.modernHistorySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <MessageSquare size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>口コミ履歴</h3>
          </div>
          
          {reviewHistory.length > 0 ? (
            <>
              {!expandedSections.review ? (
                <>
                  <div className={styles.previewList}>
                    {reviewHistory.slice(0, 3).map(item => (
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
                            <Chip size="sm" className={styles.reviewChip}>
                              {item.visit_purpose.name}
                            </Chip>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {reviewHistory.length > 3 && (
                    <button 
                      className={styles.expandButton}
                      onClick={() => toggleSection('review')}
                    >
                      <ChevronDown size={20} strokeWidth={1} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.scrollableList}>
                    {reviewHistory.map(item => (
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
                            <Chip size="sm" className={styles.reviewChip}>
                              {item.visit_purpose.name}
                            </Chip>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <button 
                    className={styles.collapseButton}
                    onClick={() => toggleSection('review')}
                  >
                    <ChevronUp size={20} strokeWidth={1} />
                  </button>
                </>
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>まだ口コミがありません</p>
            </div>
          )}
        </div>
      
        {/* 雰囲気フィードバック履歴 */}
        <div className={styles.modernHistorySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <BarChart3 size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>雰囲気フィードバック履歴</h3>
          </div>
          
          <div className={styles.previewList}>
            {atmosphereFeedbackHistory.length > 0 ? (
              atmosphereFeedbackHistory.slice(0, 3).map(item => (
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
          </div>
          
          {atmosphereFeedbackHistory.length > 3 && (
            <>
              {!expandedSections.atmosphere ? (
                <button 
                  className={styles.expandButton}
                  onClick={() => toggleSection('atmosphere')}
                >
                  <ChevronDown size={20} strokeWidth={1} />
                </button>
              ) : (
                <>
                  <div className={styles.scrollableList}>
                    {atmosphereFeedbackHistory.slice(3).map(item => (
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
                    ))}
                  </div>
                  <button 
                    className={styles.collapseButton}
                    onClick={() => toggleSection('atmosphere')}
                  >
                    <ChevronUp size={20} strokeWidth={1} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
        
        {/* 印象タグ履歴 */}
        <div className={styles.modernHistorySection}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionIcon}>
              <Tag size={18} strokeWidth={1}/>
            </div>
            <h3 className={styles.sectionTitle}>印象タグ履歴</h3>
          </div>
          
          <div className={styles.previewList}>
            {tagReactionHistory.length > 0 ? (
              tagReactionHistory.slice(0, 3).map(item => (
                <div key={item.id} className={styles.tagItem}>
                  <div className={styles.tagHeader}>
                    <Link href={`/shops/${item.shop_id}`} className={styles.tagShop}>{item.shop_name}</Link>
                    <p className={styles.tagTime}>{formatTimeAgo(item.reacted_at)}</p>
                  </div>
                  <div className={styles.tagContent}>
                    <Chip size="sm" className={styles.tagChip}>
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
          </div>
          
          {tagReactionHistory.length > 3 && (
            <>
              {!expandedSections.tags ? (
                <button 
                  className={styles.expandButton}
                  onClick={() => toggleSection('tags')}
                >
                  <ChevronDown size={20} strokeWidth={1} />
                </button>
              ) : (
                <>
                  <div className={styles.scrollableList}>
                    {tagReactionHistory.slice(3).map(item => (
                      <div key={item.id} className={styles.tagItem}>
                        <div className={styles.tagHeader}>
                          <Link href={`/shops/${item.shop_id}`} className={styles.tagShop}>{item.shop_name}</Link>
                          <p className={styles.tagTime}>{formatTimeAgo(item.reacted_at)}</p>
                        </div>
                        <div className={styles.tagContent}>
                          <Chip size="sm" className={styles.tagChip}>
                            {item.tag_text}
                          </Chip>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button 
                    className={styles.collapseButton}
                    onClick={() => toggleSection('tags')}
                  >
                    <ChevronUp size={20} strokeWidth={1} />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* 最近のアクティビティ */}
      <div className={styles.modernActivitySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Clock size={18} strokeWidth={1}/>
          </div>
          <h3 className={styles.sectionTitle}>最近のアクティビティ</h3>
        </div>
        
        {uniqueRecentActivity.length > 0 ? (
          <>
            {!expandedSections.activity ? (
              <>
                <div className={styles.previewList}>
                  {uniqueRecentActivity.slice(0, 3).map(item => (
                    <div key={`${item.type}-${item.shop_id}-${item.id}`} className={styles.activityItem}>
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
                  ))}
                </div>
                {uniqueRecentActivity.length > 3 && (
                  <button 
                    className={styles.expandButton}
                    onClick={() => toggleSection('activity')}
                  >
                    <ChevronDown size={20} strokeWidth={1} />
                  </button>
                )}
              </>
            ) : (
              <>
                <div className={styles.scrollableList}>
                  {uniqueRecentActivity.map(item => (
                    <div key={`${item.type}-${item.shop_id}-${item.id}`} className={styles.activityItem}>
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
                  ))}
                </div>
                <button 
                  className={styles.collapseButton}
                  onClick={() => toggleSection('activity')}
                >
                  <ChevronUp size={20} strokeWidth={1} />
                </button>
              </>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>まだアクティビティがありません</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
