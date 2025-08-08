'use client'

import React, { useState } from 'react';
import { User, FileText, LayoutDashboard, View } from 'lucide-react';
import Tabs from '@/components/UI/Tabs';
import BasicInfo from '@/components/Account/BasicInfo';
import DetailedProfile from '@/components/Account/DetailedProfile';
import Dashboard from '@/components/Account/Dashboard';
import styles from './style.module.scss';
import Header from '@/components/Layout/Header';
import LinkDefault from '@/components/UI/LinkDefault';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import useSWR from 'swr';
import { User as UserType } from '@/types/users';
import { fetchUserProfile, fetchProfileOptions } from '@/actions/profile/fetchProfile';
import ProfilePreviewModal from '@/components/Profile/ProfilePreviewModal';

const ProfilePage = () => {
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const { data: userData, error: userError, mutate: mutateUser } = useSWR<UserType>('user-profile', fetchUserProfile);
  const { data: profileOptions, error: optionsError } = useSWR('profile-options', fetchProfileOptions);

  if (userError || optionsError) return <div>データの読み込みに失敗しました。</div>;
  if (!userData || !profileOptions) return <div>データを読み込み中...</div>;

  const handleUserUpdate = (updatedUser: UserType) => {
    mutateUser(updatedUser, false);
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本情報',
      icon: <User size={18} strokeWidth={1} />
    },
    {
      key: 'detailed',
      label: '詳細プロファイル',
      icon: <FileText size={18} strokeWidth={1} />
    },
    {
      key: 'dashboard',
      label: 'Myダッシュボード',
      icon: <LayoutDashboard size={18} strokeWidth={1} />
    }
  ];

  return (
    <div className={styles.profilePageContainer}>
      <Header />
      <div className={styles.profileHeader}>
        <h1 className={styles.pageTitle}>Profile</h1>
        <ButtonGradientWrapper 
          anotherStyle={styles.viewProfileButton} 
          type='button'
          onClick={() => setIsPreviewModalOpen(true)}
        >
          <View size={16} strokeWidth={1} />
          他のユーザーから見たプロフィール
        </ButtonGradientWrapper>
      </div>
      
      <Tabs items={tabItems} defaultActiveKey="basic">
        <BasicInfo onUserUpdate={handleUserUpdate} />
        <DetailedProfile userData={userData} profileOptions={profileOptions} onUserUpdate={handleUserUpdate} />
        <Dashboard />
      </Tabs>
      
      {/* プレビューモーダル */}
      <ProfilePreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
      />
    </div>
  );
};

export default ProfilePage;
