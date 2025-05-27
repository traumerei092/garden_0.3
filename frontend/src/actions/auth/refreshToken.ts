'use client';

import {getUserClient} from "@/actions/auth/getUserClient";
import {useAuthStore} from "@/store/useAuthStore";

export const refreshAccessToken = async () => {
  const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh') : null;

  if (!refresh) {
    console.warn('No refresh token found.');
    return null;
  }

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'omit', // Cookieを送信しない
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) {
      console.error('❌ Failed to refresh token:', await res.text());
      return null;
    }

    const data = await res.json();

    // localStorage + Zustand に保存
    localStorage.setItem('access', data.access);
    useAuthStore.getState().setTokens(data.access, refresh);

    // ✅ 再ログイン後にユーザー情報を取得・保存
    await getUserClient();

    return data.access;
  } catch (error) {
    console.error('🚨 Token refresh error:', error);
    return null;
  }
};
