import { refreshAccessToken } from '@/actions/auth/refreshToken';

export const fetchWithAuth = async (
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> => {
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access') : null;
  
  // 相対パスの場合はベースURLを追加
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const url = typeof input === 'string' && input.startsWith('/') 
    ? `${baseUrl}${input}` 
    : input;

  const mergedInit: RequestInit = {
    ...init,
    headers: {
      ...(init.headers as Record<string, string>), // 既存のヘッダー
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `JWT ${accessToken}` } : {}),
    },
    credentials: 'include', // Cookieを送信する
  };

  let res = await fetch(url, mergedInit);

  // アクセストークンが失効していたらリフレッシュして再試行
  if (res.status === 401) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      const retryHeaders = {
        ...(init.headers as Record<string, string>),
        'Content-Type': 'application/json',
        Authorization: `JWT ${newAccessToken}`,
      };

      res = await fetch(url, {
        ...init,
        headers: retryHeaders,
        credentials: 'include', // Cookieを送信する
      });
    }
  }

  return res;
};
