'use client'

import React from 'react';
import { User, FileText, MapPin, Heart, LayoutDashboard, View } from 'lucide-react';
import Tabs from '@/components/UI/Tabs';
import BasicInfo from '@/components/Account/BasicInfo';
import DetailedProfile from '@/components/Account/DetailedProfile';
import VisitedShops from '@/components/Account/VisitedShops';
import WishlistShops from '@/components/Account/WishlistShops';
import Dashboard from '@/components/Account/Dashboard';
import styles from './style.module.scss';
import Header from '@/components/Layout/Header';
import LinkDefault from '@/components/UI/LinkDefault';
import ButtonGradientWrapper from '@/components/UI/ButtonGradientWrapper';
import useSWR from 'swr';
import { User as UserType } from '@/types/users';
import { fetchUserProfile, fetchProfileOptions } from '@/actions/profile/fetchProfile';

const ProfilePage = () => {
  const { data: userData, error: userError } = useSWR<UserType>('user-profile', fetchUserProfile);
  const { data: profileOptions, error: optionsError } = useSWR('profile-options', fetchProfileOptions);

  if (userError || optionsError) return <div>データの読み込みに失敗しました。</div>;
  if (!userData || !profileOptions) return <div>データを読み込み中...</div>;

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
      key: 'visited',
      label: '行った',
      icon: <MapPin size={18} strokeWidth={1} />
    },
    {
      key: 'wishlist',
      label: '行きたい',
      icon: <Heart size={18} strokeWidth={1} />
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
        <ButtonGradientWrapper anotherStyle={styles.viewProfileButton} type='button'>
          <View size={16} strokeWidth={1} />
          他のユーザーから見たプロフィール
        </ButtonGradientWrapper>
      </div>
      
      <Tabs items={tabItems} defaultActiveKey="basic">
        <BasicInfo />
        <DetailedProfile userData={userData} profileOptions={profileOptions} />
        <VisitedShops />
        <WishlistShops />
        <Dashboard />
      </Tabs>
    </div>
  );
};

export default ProfilePage;
