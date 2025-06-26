'use client'

import React from 'react';
import { Button } from '@nextui-org/react';
import { Eye, MessageSquare, Edit, Clock, ChevronRight } from 'lucide-react';
import styles from './style.module.scss';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';

const Dashboard = () => {
  // サンプルデータ
  const stats = {
    views: 156,
    actions: 23,
    reviews: 12,
    edits: 8
  };
  
  const viewHistory = [
    {
      id: 1,
      name: 'Bar Lupin',
      time: '2時間前'
    },
    {
      id: 2,
      name: 'すし次郎',
      time: '1日前'
    },
    {
      id: 3,
      name: 'The SG Club',
      time: '2日前'
    }
  ];
  
  const actionHistory = [
    {
      id: 1,
      action: 'お気に入り追加',
      time: '3時間前'
    },
    {
      id: 2,
      action: '予約リクエスト',
      time: '1日前'
    },
    {
      id: 3,
      action: 'シェア',
      time: '2日前'
    }
  ];
  
  const reviewHistory = [
    {
      id: 1,
      shop: 'すし次郎',
      content: '素晴らしいお寿司でした。ネタが新鮮で...',
      rating: 5,
      time: '1日前'
    },
    {
      id: 2,
      shop: 'Bar Lupin',
      content: '雰囲気が最高で、カクテルも美味しい...',
      rating: 5,
      time: '3日前'
    }
  ];
  
  const editHistory = [
    {
      id: 1,
      type: 'プロフィール画像更新',
      time: '2日前'
    },
    {
      id: 2,
      type: '自己紹介文編集',
      time: '1週間前'
    },
    {
      id: 3,
      type: '趣味情報追加',
      time: '2週間前'
    }
  ];
  
  const recentActivity = [
    {
      id: 1,
      type: '閲覧',
      shop: 'Bar Lupin',
      time: '2時間前'
    },
    {
      id: 2,
      type: '口コミ投稿',
      shop: 'すし次郎',
      time: '1日前'
    },
    {
      id: 3,
      type: 'アクション',
      shop: 'The SG Club',
      time: '2日前'
    },
    {
      id: 4,
      type: '編集',
      content: 'プロフィール更新',
      time: '3日前'
    }
  ];

  return (
    <div className={styles.dashboardContainer}>
      {/* 統計情報 */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Eye className={styles.statIcon} size={24} />
          <div className={styles.statInfo}>
            <h3 className={styles.statValue}>{stats.views}</h3>
            <p className={styles.statLabel}>閲覧履歴</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12L13 4V8C13 8.55228 12.5523 9 12 9H4C3.44772 9 3 9.44772 3 10V14C3 14.5523 3.44772 15 4 15H12C12.5523 15 13 15.4477 13 16V20L21 12Z" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className={styles.statInfo}>
            <h3 className={styles.statValue}>{stats.actions}</h3>
            <p className={styles.statLabel}>アクション</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <MessageSquare className={styles.statIcon} size={24} />
          <div className={styles.statInfo}>
            <h3 className={styles.statValue}>{stats.reviews}</h3>
            <p className={styles.statLabel}>口コミ</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <Edit className={styles.statIcon} size={24} />
          <div className={styles.statInfo}>
            <h3 className={styles.statValue}>{stats.edits}</h3>
            <p className={styles.statLabel}>編集履歴</p>
          </div>
        </div>
      </div>
      
      {/* 閲覧履歴 */}
      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Eye size={18} />
          </div>
          <h3 className={styles.sectionTitle}>閲覧履歴</h3>
          <ButtonGradientWrapper anotherStyle={styles.viewMoreButton} onClick={() => {}}>
            詳しく見る <ChevronRight size={16} />
          </ButtonGradientWrapper>
        </div>
        
        <div className={styles.historyList}>
          {viewHistory.map(item => (
            <div key={item.id} className={styles.historyItem}>
              <p className={styles.historyName}>{item.name}</p>
              <p className={styles.historyTime}>{item.time}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* アクション履歴 */}
      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 12L13 4V8C13 8.55228 12.5523 9 12 9H4C3.44772 9 3 9.44772 3 10V14C3 14.5523 3.44772 15 4 15H12C12.5523 15 13 15.4477 13 16V20L21 12Z" stroke="#00C2FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h3 className={styles.sectionTitle}>アクション履歴</h3>
          <ButtonGradientWrapper anotherStyle={styles.viewMoreButton} onClick={() => {}}>
            詳しく見る <ChevronRight size={16} />
          </ButtonGradientWrapper>
        </div>
        
        <div className={styles.historyList}>
          {actionHistory.map(item => (
            <div key={item.id} className={styles.historyItem}>
              <p className={styles.historyName}>{item.action}</p>
              <p className={styles.historyTime}>{item.time}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* 口コミ履歴 */}
      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <MessageSquare size={18} />
          </div>
          <h3 className={styles.sectionTitle}>口コミ履歴</h3>
          <ButtonGradientWrapper anotherStyle={styles.viewMoreButton} onClick={() => {}}>
            詳しく見る <ChevronRight size={16} />
          </ButtonGradientWrapper>
        </div>
        
        <div className={styles.reviewList}>
          {reviewHistory.map(item => (
            <div key={item.id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <h4 className={styles.reviewShop}>{item.shop}</h4>
                <p className={styles.reviewTime}>{item.time}</p>
              </div>
              <p className={styles.reviewContent}>{item.content}</p>
              <div className={styles.reviewRating}>
                {'★'.repeat(item.rating)}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* 編集履歴 */}
      <div className={styles.historySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Edit size={18} />
          </div>
          <h3 className={styles.sectionTitle}>編集履歴</h3>
          <ButtonGradientWrapper anotherStyle={styles.viewMoreButton} onClick={() => {}}>
            詳しく見る <ChevronRight size={16} />
          </ButtonGradientWrapper>
        </div>
        
        <div className={styles.historyList}>
          {editHistory.map(item => (
            <div key={item.id} className={styles.historyItem}>
              <p className={styles.historyName}>{item.type}</p>
              <p className={styles.historyTime}>{item.time}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* 最近のアクティビティ */}
      <div className={styles.activitySection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>
            <Clock size={18} />
          </div>
          <h3 className={styles.sectionTitle}>最近のアクティビティ</h3>
        </div>
        
        <div className={styles.activityList}>
          {recentActivity.map(item => (
            <div key={item.id} className={styles.activityItem}>
              <div className={styles.activityDot}></div>
              <div className={styles.activityContent}>
                {item.shop ? (
                  <p className={styles.activityText}>
                    <span className={styles.activityType}>{item.shop}</span> {item.type}
                  </p>
                ) : (
                  <p className={styles.activityText}>
                    <span className={styles.activityType}>{item.content}</span> {item.type}
                  </p>
                )}
                <p className={styles.activityTime}>{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
