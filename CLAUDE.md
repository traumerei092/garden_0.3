# Claude Code 開発ガイドライン

## API連携の必須パターン

### 認証が必要なAPI
- **必ず** `fetchWithAuth` を使用する
- インポート: `import { fetchWithAuth } from "@/app/lib/fetchWithAuth";`
- `'use server'` は使用しない
- 例: `const res = await fetchWithAuth(url, options);`

### 認証不要なAPI  
- 通常の `fetch` を使用
- 例: `const res = await fetch(url, { cache: 'no-store' });`

### ルール違反例
❌ `'use server'` + fetch
❌ localStorage.getItem('accessToken') を直接使用
❌ 独自の認証ヘッダー作成

### 正しい例
✅ `fetchWithAuth` を使用
✅ エラーハンドリング含む
✅ 既存のパターンを踏襲

## プロジェクト構成
- フロントエンド: Next.js 14 (App Router)
- バックエンド: Django REST Framework
- 認証: JWT トークン
- 状態管理: Zustand

## コマンド
- lint: `npm run lint`  
- typecheck: `npm run typecheck`
- test: `npm test`