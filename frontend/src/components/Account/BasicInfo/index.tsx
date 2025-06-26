'use client'

import React, { useState, useEffect } from 'react';
import { Input, Switch, Progress } from '@nextui-org/react';
import { Eye, EyeOff, Camera, User, Mail, Lock, MapPin, Edit, Info } from 'lucide-react';
import styles from './style.module.scss';
import ButtonGradient from '@/components/UI/ButtonGradient';
import SwitchVisibility from '@/components/UI/SwitchVisibility';
import { useAuthStore } from '@/store/useAuthStore';
import { getUserClient } from '@/actions/auth/getUserClient';

const BasicInfo = () => {
  // ユーザー情報をストアから取得
  const user = useAuthStore(state => state.user);
  
  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      await getUserClient();
    };
    
    if (!user) {
      fetchUser();
    }
  }, [user]);
  
  // 公開設定の状態
  const [visibilitySettings, setVisibilitySettings] = useState({
    email: true,
    name: true,
    location: true,
    introduction: true,
    gender: true,
    birthdate: true
  });
  
  // 公開設定の切り替え
  const toggleVisibility = (key: string) => {
    setVisibilitySettings(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev]
    }));
  };
  
  // プロフィール完成度を計算
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    const fields = [
      user.name,
      user.email,
      user.avatar,
      user.introduction,
      user.gender,
      user.birthdate
    ];
    
    const filledFields = fields.filter(field => field !== null && field !== '').length;
    return Math.round((filledFields / fields.length) * 100);
  };
  
  const profileCompletion = user ? calculateProfileCompletion() : 0;
  
  // ユーザー名を取得（uidをデフォルトとして使用）
  const getUsername = () => {
    if (!user) return '';
    return user.uid || '';
  };
  
  // 名前を姓と名に分割
  const getNameParts = () => {
    if (!user || !user.name) return { lastName: '', firstName: '' };
    
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return {
        lastName: nameParts[0],
        firstName: nameParts.slice(1).join(' ')
      };
    }
    
    return {
      lastName: user.name,
      firstName: ''
    };
  };
  
  const { lastName, firstName } = getNameParts();
  
  // プロフィール画像のイニシャルを取得
  const getInitials = () => {
    if (!user || !user.name) return '';
    
    const nameParts = user.name ? user.name.split(' ') : [];
    if (nameParts.length >= 2) {
      return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0]) {
      return nameParts[0].charAt(0).toUpperCase();
    }
    
    return user.email.charAt(0).toUpperCase();
  };
  
  return (
    <div className={styles.basicInfoContainer}>
      {/* ヘッダー画像とプロフィール画像 */}
      <div className={styles.profileImages}>
        <div className={styles.headerImageContainer}>
          <img
            src="/assets/picture/beach.jpg"
            alt="ヘッダー画像"
            className={styles.headerImage}
          />
          <button className={styles.editHeaderButton}>
            <Camera size={20} />
          </button>
        </div>
        
        <div className={styles.profileImageContainer}>
          <div className={styles.profileImageWrapper}>
            <div className={styles.profileImage}>
              {user && user.avatar ? (
                <img src={user.avatar} alt="プロフィール画像" className={styles.profileImage} />
              ) : (
                <span className={styles.profileInitials}>{getInitials()}</span>
              )}
            </div>
            <button className={styles.editProfileButton}>
              <Camera size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* プロフィール統計 */}
      <div className={styles.profileStats}>
        <div className={styles.statItem}>
          <h3 className={styles.statValue}>{profileCompletion}%</h3>
          <p className={styles.statLabel}>プロフィール完成度</p>
        </div>
        
        <div className={styles.statItem}>
          <h3 className={styles.statValue}>12</h3>
          <p className={styles.statLabel}>行ったお店</p>
        </div>
        
        <div className={styles.statItem}>
          <h3 className={styles.statValue}>8</h3>
          <p className={styles.statLabel}>行きたいお店</p>
        </div>
      </div>
      
      {/* 基本情報フォーム */}
      <div className={styles.basicInfoForm}>
        <h3 className={styles.formTitle}>基本情報 <span className={styles.publicLabel}>(公開設定可能)</span></h3>
        
        {/* ユーザー名 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ユーザー名</label>
          <Input
            value={getUsername()}
            variant="bordered"
            radius="sm"
            startContent={<User size={16} />}
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            readOnly
          />
        </div>
        
        {/* メールアドレス */}
        <div className={styles.formGroup}>
          <div className={styles.formLabelWithVisibility}>
            <label className={styles.formLabel}>メールアドレス</label>
            <SwitchVisibility
              isSelected={visibilitySettings.email}
              onValueChange={() => toggleVisibility('email')}
            />
          </div>
          <Input
            value={user?.email || ''}
            variant="bordered"
            radius="sm"
            startContent={<Mail size={16} />}
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            readOnly
          />
        </div>
        
        {/* パスワード */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>パスワード</label>
          <Input
            value="••••••••••"
            type="password"
            variant="bordered"
            radius="sm"
            startContent={<Lock size={16} />}
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            readOnly
          />
        </div>
        
        {/* 氏名 */}
        <div className={styles.formGroup}>
          <div className={styles.formLabelWithVisibility}>
            <label className={styles.formLabel}>氏名</label>
            <SwitchVisibility
              isSelected={visibilitySettings.name}
              onValueChange={() => toggleVisibility('name')}
            />
          </div>
          <div className={styles.nameInputs}>
            <Input
              value={lastName}
              variant="bordered"
              radius="sm"
              label="姓"
              classNames={{
                base: styles.inputBase,
                inputWrapper: styles.inputWrapper,
                input: styles.input,
                label: styles.inputLabel
              }}
              readOnly
            />
            <Input
              value={firstName}
              variant="bordered"
              radius="sm"
              label="名"
              classNames={{
                base: styles.inputBase,
                inputWrapper: styles.inputWrapper,
                input: styles.input,
                label: styles.inputLabel
              }}
              readOnly
            />
          </div>
        </div>
        
        {/* 自己紹介 */}
        <div className={styles.formGroup}>
          <div className={styles.formLabelWithVisibility}>
            <label className={styles.formLabel}>自己紹介</label>
            <SwitchVisibility
              isSelected={visibilitySettings.introduction}
              onValueChange={() => toggleVisibility('introduction')}
            />
          </div>
          <Input
            value={user?.introduction || ''}
            variant="bordered"
            radius="sm"
            startContent={<Info size={16} />}
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            readOnly
          />
        </div>
        
        {/* 性別 */}
        <div className={styles.formGroup}>
          <div className={styles.formLabelWithVisibility}>
            <label className={styles.formLabel}>性別</label>
            <SwitchVisibility
              isSelected={visibilitySettings.gender}
              onValueChange={() => toggleVisibility('gender')}
            />
          </div>
          <Input
            value={user?.gender || ''}
            variant="bordered"
            radius="sm"
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            readOnly
          />
        </div>
        
        {/* 生年月日 */}
        <div className={styles.formGroup}>
          <div className={styles.formLabelWithVisibility}>
            <label className={styles.formLabel}>生年月日</label>
            <SwitchVisibility
              isSelected={visibilitySettings.birthdate}
              onValueChange={() => toggleVisibility('birthdate')}
            />
          </div>
          <Input
            value={user?.birthdate || ''}
            variant="bordered"
            radius="sm"
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            readOnly
          />
        </div>
        
        {/* マイエリア */}
        <div className={styles.formGroup}>
          <div className={styles.formLabelWithVisibility}>
            <label className={styles.formLabel}>マイエリア</label>
            <SwitchVisibility
              isSelected={visibilitySettings.location}
              onValueChange={() => toggleVisibility('location')}
            />
          </div>
          <Input
            value="東京都渋谷区渋谷1-1-1"
            variant="bordered"
            radius="sm"
            startContent={<MapPin size={16} />}
            classNames={{
              base: styles.inputBase,
              inputWrapper: styles.inputWrapper,
              input: styles.input
            }}
            readOnly
          />
        </div>
      </div>
      <ButtonGradient anotherStyle={styles.editButton} onClick={() => {}}>
        <Edit size={16} strokeWidth={1} />
        編集する
      </ButtonGradient>
    </div>
  );
};

export default BasicInfo;
