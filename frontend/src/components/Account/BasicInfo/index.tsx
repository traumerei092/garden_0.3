'use client'

import React, { useState, useEffect } from 'react';
import { Input, Button, Link, Textarea } from '@nextui-org/react';
import { Camera, User, Mail, Lock, MapPin, Edit, Eye, EyeOff } from 'lucide-react';
import styles from './style.module.scss';
import PasswordChangeModal from '@/components/Account/PasswordChangeModal';
import ImageEditModal from '@/components/Account/ImageEditModal';
import BasicInfoEditModal from '@/components/Account/BasicInfoEditModal';
import IntroductionEditModal from '@/components/Account/IntroductionEditModal';
import { useAuthStore } from '@/store/useAuthStore';
import { getUserClient } from '@/actions/auth/getUserClient';
import { useProfileVisibility } from '@/hooks/useProfileVisibility';

// UserInfo型をuseAuthStoreから取得
interface UserInfo {
  id: number;
  uid: string;
  email: string;
  name: string | null;
  avatar: string | null;
  introduction: string | null;
  gender: string | null;
  birthdate: string | null;
  my_area: string | null;
}

interface BasicInfoProps {
  onUserUpdate?: (updatedUser: any) => void;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ onUserUpdate }) => {
  // ユーザー情報をストアから取得
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  
  // モーダルの状態
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isIntroductionModalOpen, setIsIntroductionModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isHeaderModalOpen, setIsHeaderModalOpen] = useState(false);
  
  // 公開設定フック
  const { visibilitySettings, updateVisibilitySetting } = useProfileVisibility();
  
  // ユーザー情報を取得
  useEffect(() => {
    const fetchUser = async () => {
      await getUserClient();
    };
    
    if (!user) {
      fetchUser();
    }
  }, [user]);
  
  // プロフィール完成度を計算
  const calculateProfileCompletion = () => {
    if (!user) return 0;
    
    const fields = [
      user.uid,
      user.email,
      user.name,
      user.introduction,
      user.gender,
      user.birthdate,
      user.my_area,
      user.avatar
    ];
    
    const filledFields = fields.filter(field => field !== null && field !== '' && field !== undefined).length;
    return Math.round((filledFields / fields.length) * 100);
  };
  
  const profileCompletion = user ? calculateProfileCompletion() : 0;
  
  // プロフィール画像のイニシャルを取得
  const getInitials = () => {
    if (!user) return '';
    
    if (user.name) {
      const nameParts = user.name.split(' ');
      if (nameParts.length >= 2) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
      } else {
        return user.name.charAt(0).toUpperCase();
      }
    }
    
    return user.email.charAt(0).toUpperCase();
  };

  // ユーザー情報更新ハンドラー
  const handleUserUpdate = (updatedUser: UserInfo) => {
    setUser(updatedUser);
  };

  // UserInfo型からUser型への変換（編集モーダル用）
  const convertUserInfoToUser = (userInfo: UserInfo): any => {
    if (!userInfo) return null;
    return {
      ...userInfo,
      username: userInfo.name || '',
      first_name: '',
      last_name: '',
      bio: userInfo.introduction,
      work_info: null,
      occupation: null,
      industry: null,
      position: null,
      exercise_frequency: null,
      dietary_preference: null,
      budget_range: null,
      visit_purposes: [],
      is_profile_public: true,
      interests: [],
      blood_type: null,
      mbti: null,
      alcohols: [],
      alcohol_categories: [],
      alcohol_brands: [],
      drink_styles: [],
      hobbies: [],
      exercise_habits: [],
      social_preferences: [],
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
  };

  // 性別の表示名を取得
  const getGenderDisplay = (gender?: string | null) => {
    switch (gender) {
      case 'male':
        return '男性';
      case 'female':
        return '女性';
      case 'other':
        return 'その他';
      default:
        return '';
    }
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

  // const { lastName, firstName } = getNameParts(); // 一時的に無効化
  
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
          <button 
            className={styles.editHeaderButton}
            onClick={() => setIsHeaderModalOpen(true)}
          >
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
            <button 
              className={styles.editProfileButton}
              onClick={() => setIsAvatarModalOpen(true)}
            >
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

      {/* 自己紹介 */}
      <div className={styles.basicInfoForm}>
        <div className={styles.introductionHeader}>
          <h3 className={styles.formTitle}>自己紹介</h3>
          <Link 
            className={styles.editIntroductionLink}
            onPress={() => setIsIntroductionModalOpen(true)}
          >
              <Edit size={16} strokeWidth={1} />
              <span className={styles.editIntroduction}>編集する</span>
          </Link>
        </div>
        <Textarea
          value={user?.introduction || ''}
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
      
      {/* 基本情報フォーム */}
      <div className={styles.basicInfoForm}>
        <div className={styles.basicInfoHeader}>
          <h3 className={styles.formTitle}>基本情報</h3>
          <Link 
            className={styles.editBasicInfoLink}
            onPress={() => setIsEditModalOpen(true)}
          >
            <Edit size={16} strokeWidth={1} />
            <span className={styles.editBasicInfo}>編集する</span>
          </Link>
        </div>
        
        {/* ユーザー名 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>ユーザー名</label>
          <Input
            value={user?.name || ''}
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
          <label className={styles.formLabel}>メールアドレス</label>
          <div className={styles.passwordGroup}>
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
            <Button
              size="sm"
              variant="light"
              onPress={() => setIsPasswordModalOpen(true)}
              className={styles.changePasswordButton}
            >
              変更
            </Button>
          </div>
        </div>
        
        {/* パスワード */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>パスワード</label>
          <div className={styles.passwordGroup}>
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
            <Button
              size="sm"
              variant="light"
              onPress={() => setIsPasswordModalOpen(true)}
              className={styles.changePasswordButton}
            >
              変更
            </Button>
          </div>
        </div>
        
        {/* 性別 */}
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>性別</label>
          <Input
            value={getGenderDisplay(user?.gender)}
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
            <div className={styles.visibilityIcon}>
              {visibilitySettings?.age ? (
                <Eye size={16} className={styles.visibilityIconPublic} />
              ) : (
                <EyeOff size={16} className={styles.visibilityIconPrivate} />
              )}
            </div>
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
            <div className={styles.visibilityIcon}>
              {visibilitySettings?.my_area ? (
                <Eye size={16} className={styles.visibilityIconPublic} />
              ) : (
                <EyeOff size={16} className={styles.visibilityIconPrivate} />
              )}
            </div>
          </div>
          <Input
            value={user?.my_area || ''}
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
      
      {/* 基本情報編集モーダル */}
      {user && (
        <BasicInfoEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={convertUserInfoToUser(user)}
          onUpdate={(updatedUser) => {
            // User型からUserInfo型への変換
            const userInfo: UserInfo = {
              id: updatedUser.id,
              uid: updatedUser.uid,
              email: updatedUser.email,
              name: updatedUser.name,
              avatar: updatedUser.avatar,
              introduction: updatedUser.introduction,
              gender: updatedUser.gender,
              birthdate: updatedUser.birthdate,
              my_area: updatedUser.my_area
            };
            handleUserUpdate(userInfo);
          }}
        />
      )}

      {/* 自己紹介編集モーダル */}
      {user && (
        <IntroductionEditModal
          isOpen={isIntroductionModalOpen}
          onClose={() => setIsIntroductionModalOpen(false)}
          user={convertUserInfoToUser(user)}
          onUpdate={(updatedUser) => {
            // User型からUserInfo型への変換
            const userInfo: UserInfo = {
              id: updatedUser.id,
              uid: updatedUser.uid,
              email: updatedUser.email,
              name: updatedUser.name,
              avatar: updatedUser.avatar,
              introduction: updatedUser.introduction,
              gender: updatedUser.gender,
              birthdate: updatedUser.birthdate,
              my_area: updatedUser.my_area
            };
            handleUserUpdate(userInfo);
          }}
        />
      )}

      {/* パスワード変更モーダル */}
      <PasswordChangeModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* プロフィール画像編集モーダル */}
      {user && (
        <ImageEditModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
          user={user}
          onUpdate={handleUserUpdate}
        />
      )}

      {/* ヘッダー画像編集モーダル */}
      {user && (
        <ImageEditModal
          isOpen={isHeaderModalOpen}
          onClose={() => setIsHeaderModalOpen(false)}
          user={user}
          onUpdate={handleUserUpdate}
        />
      )}
    </div>
  );
};

export default BasicInfo;
