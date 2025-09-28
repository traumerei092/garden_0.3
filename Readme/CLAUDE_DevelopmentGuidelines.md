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

## 型定義の管理方針

### 型定義の集約ルール
- **必ず** `frontend/src/types/` ディレクトリに型定義を集約する
- ユーザー関連: `types/users.ts`
- 店舗関連: `types/shops.ts`
- エリア関連: `types/areas.ts`

### ルール違反例
❌ コンポーネント内での独自型定義
❌ `useAuthStore.ts` 内での`UserInfo`定義
❌ 同じ型の重複定義

### 正しい例
✅ `import { User } from '@/types/users'`
✅ 型定義の一元管理
✅ 既存型の再利用

## 印象タグ機能の統一パターン

### タグ追加処理の標準化
- **必ず** `actions/shop/impressionTag.ts` の `addImpressionTag` 関数を使用する
- 複数コンポーネント間で同じ機能を実装する場合は、共通関数に集約する
- API結果を受け取って適切な型変換を行い、UIに反映する

### ルール違反例
❌ コンポーネント内での独自API呼び出し
❌ 同じ機能の重複実装
❌ API結果の適切な型変換なし

### 正しい例
✅ `import { addImpressionTag } from '@/actions/shop/impressionTag'`
✅ API結果をShopTag型に変換してリストに追加
✅ 既存の動作するコンポーネントの処理を参考にする

### モーダルのインターフェース統一
- ShopFeedbackModalは `onDataUpdate` プロパティでデータ更新を行う
- `onSubmit` プロパティは廃止
- コンポーネント修正時は使用箇所への影響を必ず確認する

## コマンド
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm test`