This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 開発方針とコーディング規約

### コンポーネント設計
- **既存コンポーネントの優先使用**: 新機能開発時は必ず既存のUIコンポーネントを優先して使用すること
  - ボタン: `ButtonGradient` を使用する（NextUIの`Button`コンポーネントを直接使用しない）
  - 入力フィールド: `InputDefault` を使用する
  - その他UIコンポーネントも同様に既存のものを活用する
- **スタイルの統一**: 既存コンポーネントを使用することでアプリケーション全体のスタイル統一を図る
- **再利用性**: コンポーネントは他の箇所でも再利用できるよう汎用的に設計する

### ファイル構成
- **UI コンポーネント**: `/src/components/UI/` 配下に配置
- **機能固有コンポーネント**: `/src/components/[機能名]/` 配下に配置
- **カスタムフック**: `/src/hooks/` 配下に配置し、ロジックの共通化を図る

### コード品質
- **型安全性**: TypeScriptを活用し、適切な型定義を行う
- **レスポンシブ対応**: 全てのUIコンポーネントはモバイルファーストで設計し、レスポンシブ対応を必須とする
- **アクセシビリティ**: WCAG 2.1 AAレベルに準拠したアクセシブルなUIを心がける

### 命名規則
- **コンポーネント**: PascalCaseを使用（例: `ShopFeedbackModal`）
- **ファイル名**: コンポーネント名と一致させる
- **CSS クラス**: camelCaseを使用し、CSS Modulesを活用

### 開発フロー
1. 既存コンポーネントの確認・調査
2. 再利用可能性を考慮した設計
3. レスポンシブ対応の実装
4. 統一されたスタイルの確認
5. TypeScript型チェックの通過確認

この方針に従うことで、保守性が高く統一感のあるアプリケーションの開発を目指します。
