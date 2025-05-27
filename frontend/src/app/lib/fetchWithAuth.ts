'use client';

import { refreshAccessToken } from '@/actions/auth/refreshToken';

export const fetchWithAuth = async (
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> => {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access') : null;

  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>), // 既存のヘッダー
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `JWT ${accessToken}` } : {}),
    },
    credentials: 'omit', // Cookieを送信しない
  };

  let res = await fetch(input, mergedInit);

  // アクセストークンが失効していたらリフレッシュして再試行
  if (res.status === 401) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      const retryHeaders = {
        ...(init.headers as Record<string, string>),
        'Content-Type': 'application/json',
        Authorization: `JWT ${newAccessToken}`,
      };

      res = await fetch(input, {
        ...init,
        headers: retryHeaders,
        credentials: 'omit', // Cookieを送信しない
      });
    }
  }

  return res;
};
