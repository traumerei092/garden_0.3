# NextAuth.js + Django Djoser 認証システム トラブルシューティングガイド

## 概要
localStorage+Zustand から NextAuth.js+JWT 認証システムへの移行時に発生した問題とその解決策をまとめています。

## 発生した問題

### 1. JWTトークンの期限切れとリフレッシュ機能不備
**症状**: 15分後にAPIリクエストが401エラーになる

**原因**: NextAuth.jsでJWTトークンの自動リフレッシュが実装されていなかった

**解決策**:
```typescript
// /app/api/auth/[...nextauth]/route.ts
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/auth/jwt/refresh/`;
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      body: JSON.stringify({ refresh: token.refreshToken }),
    });

    const refreshedTokens = await response.json();
    if (!response.ok) throw refreshedTokens;

    return {
      ...token,
      accessToken: refreshedTokens.access,
      accessTokenExpires: Date.now() + 15 * 60 * 1000, // 15分
    };
  } catch (error) {
    return { ...token, error: "RefreshAccessTokenError" };
  }
}
```

### 2. 認証ヘッダー形式の不一致
**症状**: 正しいトークンでも401エラーが発生

**原因**: Django Djoserは`JWT ${token}`形式を期待するが、`Bearer ${token}`を送信していた

**解決策**:
```typescript
// /app/lib/fetchWithSession.ts
const headers: HeadersInit = {
  'Content-Type': 'application/json',
  ...(accessToken && { Authorization: `JWT ${accessToken}` }) // "JWT"形式に修正
};
```

### 3. session.user.id が null になる問題
**症状**: useAuthSession()で`user?.id`がnullになり、データ取得が失敗

**原因**: NextAuth.jsのsessionにuser.idが含まれていなかった

**解決策**:
```typescript
// /app/api/auth/[...nextauth]/route.ts
callbacks: {
  async jwt({ token, user, account }) {
    if (account && user) {
      token.id = user.id; // user.idを明示的に設定
      // ...other properties
    }
    return token;
  },
  async session({ session, token }) {
    session.user.id = token.id as string; // sessionにuser.idを設定
    // ...other properties
    return session;
  },
}
```

### 4. 401エラー時の自動リトライ機能不備
**症状**: トークン期限切れ時に手動でページリロードが必要

**解決策**:
```typescript
// /app/lib/fetchWithSession.ts
// 401エラー時の自動リトライロジック
if (res.status === 401 && accessToken) {
  const newSession = await getSession();
  if (newSession?.accessToken && newSession.accessToken !== accessToken) {
    const retryInit: RequestInit = {
      ...init,
      headers: {
        ...headers,
        Authorization: `JWT ${newSession.accessToken}`,
      },
    };
    return await fetch(url, retryInit);
  }
}
```

### 5. モーダルコンポーネントでのデータ読み込み失敗
**症状**: ShopFeedbackModalとRegularFeedbackModalが空のコンテンツを表示

**原因**:
- 認証状態の不備によるAPI呼び出し失敗
- データ取得失敗時のエラーハンドリング不足

**解決策**:
```typescript
// 認証状態チェック強化
useEffect(() => {
  if (isOpen && isLoggedIn && user?.id) {
    console.log('🔍 Modal - Loading data with user:', user.id);
    loadInitialData();
  } else if (isOpen && !isLoggedIn) {
    console.error('🚨 Modal - User not logged in!');
  } else if (isOpen && !user?.id) {
    console.error('🚨 Modal - User ID missing!', { user, isLoggedIn });
  }
}, [isOpen, isLoggedIn, user?.id]);

// エラーハンドリング強化
{isLoading ? (
  <div className={styles.loading}>読み込み中...</div>
) : data.length > 0 ? (
  <div className={styles.dataList}>
    {/* データ表示 */}
  </div>
) : (
  <div className={styles.noData}>
    <p>データの取得に失敗しました。</p>
    <p>ページを再読み込みしてください。</p>
  </div>
)}
```

## 重要なチェックポイント

### 1. 認証フロー確認
- [ ] JWTトークンの自動リフレッシュが実装されているか
- [ ] 認証ヘッダー形式が正しいか（`JWT ${token}`）
- [ ] session.user.idが正しく設定されているか

### 2. API呼び出し確認
- [ ] fetchWithSessionを使用しているか
- [ ] 401エラー時のリトライロジックが動作するか
- [ ] エラーハンドリングが適切に実装されているか

### 3. デバッグ方法
```typescript
// 認証状態のデバッグ
console.log('🔍 Auth Debug:', {
  isLoggedIn,
  userId: user?.id,
  token: session?.accessToken?.substring(0, 20) + '...'
});

// API呼び出しのデバッグ
console.log('🔍 API Request:', { url, headers, method });
console.log('🔍 API Response:', { status: response.status, ok: response.ok });
```

### 4. トラブルシューティング手順
1. ブラウザのNetworkタブで401エラーを確認
2. sessionとtokenの状態をコンソールで確認
3. 認証ヘッダー形式を確認
4. トークンリフレッシュ機能をテスト
5. コンポーネントレベルでの認証状態チェック

## 今後の改善点
- より詳細なエラーログとモニタリング
- 認証状態の可視化（開発時）
- 自動テストによる認証フローの検証
- ユーザー向けのより分かりやすいエラーメッセージ

## 関連ファイル
- `/app/api/auth/[...nextauth]/route.ts` - NextAuth.js設定
- `/app/lib/fetchWithSession.ts` - 認証付きFetch関数
- `/hooks/useAuthSession.ts` - 認証状態管理Hook
- `/components/Shop/*Modal/index.tsx` - モーダルコンポーネント