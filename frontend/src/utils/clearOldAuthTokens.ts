/**
 * 旧認証システム（localStorage）のトークンをクリアする
 * NextAuth.js移行時に実行する
 */
export const clearOldAuthTokens = () => {
  if (typeof window === 'undefined') return;

  const oldKeys = [
    'access',
    'refresh',
    'accessToken',
    'refreshToken',
    'token',
    'authToken',
    'user',
    'authUser'
  ];

  console.log('🧹 Clearing old authentication tokens from localStorage...');

  oldKeys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      console.log(`🗑️ Removing old token: ${key}`);
      localStorage.removeItem(key);
    }
  });

  console.log('✅ Old authentication tokens cleared');
};