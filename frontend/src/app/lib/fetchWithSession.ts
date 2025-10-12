import { getSession, signIn } from 'next-auth/react';

export const fetchWithSession = async (
    input: RequestInfo | URL,
    init: RequestInit = {}
): Promise<Response> => {
  // Get session data
  const session = await getSession();
  const accessToken = session?.accessToken || null;


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

  const res = await fetch(url, mergedInit);

  // 401エラーの場合、セッション更新を試行
  if (res.status === 401 && accessToken) {
    console.log('🔄 401 error detected, attempting to refresh session...');

    // セッションを強制的に更新
    const newSession = await getSession();

    if (newSession?.accessToken && newSession.accessToken !== accessToken) {
      console.log('✅ Session refreshed, retrying request...');

      // 新しいトークンでリトライ
      const retryHeaders: Record<string, string> = {
        ...(init.headers as Record<string, string>),
        Authorization: `JWT ${newSession.accessToken}`,
      };

      if (!isFormData) {
        retryHeaders['Content-Type'] = 'application/json';
      }

      const retryInit: RequestInit = {
        ...init,
        headers: retryHeaders,
        credentials: 'include',
      };

      return await fetch(url, retryInit);
    }
  }

  return res;
};

// Hook版も提供（コンポーネントで使いやすい）
export const useFetchWithSession = () => {
  return fetchWithSession;
};