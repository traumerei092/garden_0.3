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

  // FormDataの場合はContent-Typeを設定しない（ブラウザが自動設定）
  const isFormData = init.body instanceof FormData;
  
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>), // 既存のヘッダー
    ...(accessToken ? { Authorization: `JWT ${accessToken}` } : {}),
  };

  // FormDataでない場合のみContent-Typeを設定
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const mergedInit: RequestInit = {
    ...init,
    headers,
    credentials: 'include', // Cookieを送信する
  };

  let res = await fetch(url, mergedInit);

  // アクセストークンが失効していたらリフレッシュして再試行
  if (res.status === 401) {
    const newAccessToken = await refreshAccessToken();
    if (newAccessToken) {
      const retryHeaders: Record<string, string> = {
        ...(init.headers as Record<string, string>),
        Authorization: `JWT ${newAccessToken}`,
      };

      // FormDataでない場合のみContent-Typeを設定
      if (!isFormData) {
        retryHeaders['Content-Type'] = 'application/json';
      }

      res = await fetch(url, {
        ...init,
        headers: retryHeaders,
        credentials: 'include', // Cookieを送信する
      });
    }
  }

  return res;
};
