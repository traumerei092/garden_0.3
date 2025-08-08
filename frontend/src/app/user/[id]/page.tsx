'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { fetchPublicUserProfile } from '@/actions/user/fetchPublicProfile';
import { PublicUserProfile } from '@/types/users';
import Header from '@/components/Layout/Header';
import PublicProfileView from '@/components/User/PublicProfileView';
import styles from './style.module.scss';

/**
 * 他のユーザーのプロフィールページ
 * 公開設定に応じてプロフィール情報を表示
 */
const PublicUserProfilePage = () => {
  const params = useParams();
  const uid = params.id as string;

  const { data: userProfile, error, isLoading } = useSWR<PublicUserProfile | null>(
    uid ? `public-profile-${uid}` : null,
    uid ? () => fetchPublicUserProfile(uid) : null,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      shouldRetryOnError: false
    }
  );

  if (isLoading) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}>
            <div className={styles.spinner} />
          </div>
          <p className={styles.loadingText}>プロフィールを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <h2 className={styles.errorTitle}>プロフィールが見つかりません</h2>
            <p className={styles.errorMessage}>
              {error.message === 'ユーザーが見つかりません' 
                ? 'このユーザーは存在しないか、プロフィールを削除している可能性があります。'
                : 'プロフィールの読み込み中にエラーが発生しました。しばらくしてから再度お試しください。'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.errorContainer}>
          <div className={styles.errorContent}>
            <h2 className={styles.errorTitle}>プロフィールが見つかりません</h2>
            <p className={styles.errorMessage}>
              このユーザーのプロフィールは現在利用できません。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <Header />
      <PublicProfileView userProfile={userProfile} />
    </div>
  );
};

export default PublicUserProfilePage;