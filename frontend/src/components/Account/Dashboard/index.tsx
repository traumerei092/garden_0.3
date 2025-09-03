'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Link, Chip, Accordion, AccordionItem } from '@nextui-org/react';
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

  // NextUI Accordionの白い背景を強制的に変更
  useEffect(() => {
    const timer = setTimeout(() => {
      const accordionItems = document.querySelectorAll('[data-slot="base"]');
      accordionItems.forEach(item => {
        if (item instanceof HTMLElement) {
          item.style.setProperty('background', 'rgba(255, 255, 255, 0.05)', 'important');
          item.style.setProperty('background-color', 'rgba(255, 255, 255, 0.05)', 'important');
          item.style.setProperty('border', '1px solid rgba(255, 255, 255, 0.1)', 'important');
          item.style.setProperty('border-radius', '12px', 'important');
          item.style.setProperty('box-shadow', 'none', 'important');
        }
      });

      const triggers = document.querySelectorAll('[data-slot="trigger"]');
      triggers.forEach(trigger => {
        if (trigger instanceof HTMLElement) {
          trigger.style.setProperty('background', 'transparent', 'important');
          trigger.style.setProperty('color', '#fff', 'important');
          // ホバーエフェクトを無効化
          trigger.addEventListener('mouseenter', () => {
            trigger.style.setProperty('background', 'transparent', 'important');
          });
          trigger.addEventListener('mouseleave', () => {
            trigger.style.setProperty('background', 'transparent', 'important');
          });
        }
      });

      const titles = document.querySelectorAll('[data-slot="title"]');
      titles.forEach(title => {
        if (title instanceof HTMLElement) {
          title.style.setProperty('color', '#fff', 'important');
        }
      });

      const subtitles = document.querySelectorAll('[data-slot="subtitle"]');
      subtitles.forEach(subtitle => {
        if (subtitle instanceof HTMLElement) {
          subtitle.style.setProperty('color', 'rgba(255, 255, 255, 0.7)', 'important');
        }
      });

      const indicators = document.querySelectorAll('[data-slot="indicator"]');
      indicators.forEach(indicator => {
        if (indicator instanceof HTMLElement) {
          indicator.style.setProperty('color', '#00C2FF', 'important');
        }
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [summary]);

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
              <Accordion 
                variant="splitted" 
                className={styles.accordion}
                style={{
                  '--nextui-background': 'rgba(255, 255, 255, 0.05)',
                  '--nextui-default-50': 'rgba(255, 255, 255, 0.05)',
                  '--nextui-default-100': 'rgba(255, 255, 255, 0.05)',
                  '--nextui-content1': 'rgba(255, 255, 255, 0.05)',
                  '--nextui-content2': 'rgba(255, 255, 255, 0.05)',
                } as React.CSSProperties}
              >
                <AccordionItem
                  key="welcome"
                  aria-label="ウェルカム状況"
                  startContent={<HeartHandshake size={16} strokeWidth={1} className={styles.accordionIcon} />}
                  title={`行きつけの店舗：${summary.favorite_shops_count}件　そのうち${summary.total_welcome_count}件でウェルカム済み`}
                  subtitle={`行きつけの店でのウェルカム状況を確認しましょう`}
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
                </AccordionItem>

                <AccordionItem
                  key="atmosphere-gap"
                  aria-label="雰囲気ギャップ分析"
                  startContent={<ChartBar size={16} strokeWidth={1} className={styles.accordionIcon} />}
                  title="あなたの好みと実際のギャップ"
                  subtitle="行きつけの店があなたの理想と合っているかチェック"
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
                </AccordionItem>
              </Accordion>
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
              <Accordion 
                variant="splitted" 
                className={styles.accordion}
                style={{
                  '--nextui-background': 'rgba(0, 0, 0, 0.8)',
                  '--nextui-default-50': 'rgba(255, 255, 255, 0.05)',
                  '--nextui-default-100': 'rgba(255, 255, 255, 0.05)',
                  '--nextui-content1': 'rgba(255, 255, 255, 0.05)',
                  '--nextui-content2': 'rgba(255, 255, 255, 0.05)',
                } as React.CSSProperties}
              >
                <AccordionItem
                  key="feedback-status"
                  aria-label="フィードバック状況"
                  startContent={<ClipboardList size={16} strokeWidth={1} className={styles.accordionIcon} />}
                  title={`雰囲気フィードバック完了率: ${Math.round(((summary.visited_shops_count - summary.visited_without_feedback_count) / summary.visited_shops_count) * 100)}%`}
                  subtitle={`${summary.visited_shops_count - summary.visited_without_feedback_count}/${summary.visited_shops_count}店でフィードバック完了`}
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
                            <Chip size="sm" color="success" variant="flat">
                              ✅ 完了
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
                </AccordionItem>
              </Accordion>
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
                      <Chip size="sm" className={styles.reviewChip}>
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
