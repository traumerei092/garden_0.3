# Claude Code 開発ガイドライン

## デザイン・UI/UX 基本方針

### 開発者の役割
**NetFlixの優秀なフルスタックエンジニア兼UIUXデザイナーとして、このアプリの思想を前提に持ち、ユーザーによって使いやすさを意識したオシャレ且つモダンなデザインで実装をすること。**

### カラールール
- **ベースカラー**: `rgb(10,11,28)` - 主に背景色
- **第一強調色**: `rgb(0,255,255)` - 通常のコンポーネントや強調部分
- **第二強調色**: `rgba(0,198,255)`と`rgb(235,14,242)`のグラデーション - ボタンやグラデーション、特徴的なコンポーネント
- **通常文字色**: `rgb(255,255,255)` - 通常の文字色
- **サブ文字色**: `rgba(255,255,255,0.2)` - 補足文の文字色や戻るボタンの枠線

### アイコンルール
- **必須**: lucideのアイコンを使用する
- **禁止**: 安っぽい絵文字は絶対に使用しない

### レイアウトルール
- **コンパクト性**: 意味のないpaddingは使用しない
- **ファーストビュー**: 一画面でどれだけコンパクトに伝えたい情報を訴求するかを意識
- **統一感**: アプリ全体のデザインテーマから逸脱しない
- **情報密度**: ユーザーの離脱を防ぐため、余計なスクロールを避ける

### UIコンポーネントルール
- **モーダル**: 必ず `CustomModal` を使用する（NextUI Modalは禁止）
- **ボタン**: `ButtonGradientWrapper` を使用する

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

## データ処理機能の集約・統一化ルール

### データ処理機能集約の原則
- **データ処理機能など集約できるコードは集約する**
- **データ処理機能は `frontend/src/actions/` 配下に機能ごとにファイルを分けて作る**
- **新たにデータ処理機能を実装する際は、`frontend/src/actions/` 配下に同じデータ処理を行う機能がないか確認し、既にあれば必ずそれを活用する**

### データ処理統一化の重要性
同じ役割のコードを別々に書くとそれがエラーの原因になります。特に以下の点で統一化が重要です：
- API呼び出しの統一（エンドポイント、リクエスト形式、レスポンス処理）
- エラーハンドリングの統一
- データ変換ロジックの統一
- 型定義の統一

### 正しい実装例
✅ 雰囲気フィードバック機能:
- `submitShopFeedback` 関数を `actions/shop/feedback.ts` に集約
- ShopFeedbackModal と ShopAtmosphereFeedbackModal の両方で同じ関数を使用
- 統一されたデータ形式 `{ atmosphere_scores: { [key: string]: number } }`

### ルール違反例
❌ 同じ機能を別々のコンポーネントで重複実装
❌ 異なるデータ形式での同じAPI呼び出し
❌ 既存のactions関数を確認せずに新しい関数を作成

## コマンド
- lint: `npm run lint`
- typecheck: `npm run typecheck`
- test: `npm test`