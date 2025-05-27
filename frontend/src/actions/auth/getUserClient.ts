'use client';

import { useAuthStore } from '@/store/useAuthStore';

export const getUserClient = async () => {
  const accessToken = typeof window !== 'undefined'
    ? localStorage.getItem('access') // 保存されているトークンを取得
    : null;

  if (!accessToken) {
    console.warn('🟡 No access token found.');
    return null;
  }

  try {
    // JWT認証で現在のユーザー情報を取得
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/users/me/`, {
      method: 'GET',
      headers: {
        'Authorization': `JWT ${accessToken}`,
        'Content-Type': 'application/json',
      },
      credentials: 'omit', // Cookieを送信しない
    });

    if (!res.ok) {
      console.error('❌ Failed to fetch user info:', await res.text());
      return null;
    }

    const user = await res.json();
    useAuthStore.getState().setUser(user); // Zustand に保存
    return user; // 呼び出し元で必要に応じて再利用できるよう返却
  } catch (error) {
    console.error('🚨 Error fetching user info:', error);
    return null;
  }
};
