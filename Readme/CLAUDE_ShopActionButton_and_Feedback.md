# ShopActionButton とフィードバック機能

## 📋 概要

ShopActionButton（行きつけ・行った・行きたい）とフィードバックモーダルの統一仕様書です。

## 🔑 リレーションタイプID定義

```typescript
export const DEFAULT_RELATIONS = {
  favorite: {
    id: 1,        // 「行きつけ」
    name: 'favorite',
    label: '行きつけ',
    color: '#00ffff'
  },
  visited: {
    id: 2,        // 「行った」
    name: 'visited',
    label: '行った',
    color: '#ffc107'
  },
  interested: {
    id: 3,        // 「行きたい」
    name: 'interested',
    label: '行きたい',
    color: '#ef4444'
  }
}
```

## 🎯 統一された動作仕様

### 「行った」ボタン（visited）の特別動作
- **未訪問状態**でクリック → **色が付く + ShopFeedbackModalが開く**
- **訪問済み状態**でクリック → **色が消える（リレーション解除）のみ**

### その他ボタン（favorite・interested）の通常動作
- **未アクティブ**でクリック → **色が付く（リレーション設定）**
- **アクティブ**でクリック → **色が消える（リレーション解除）**

## 🔧 実装方法

### 1. useShopActionsカスタムフック使用

```typescript
import { useShopActions } from '@/hooks/useShopActions';

const {
  shopStats,
  handleRelationToggle,
  getUserRelations,
  refreshShopStats,
  relations
} = useShopActions({
  shops: memoizedShops,
  onFeedbackModalOpen: setFeedbackModalShopId
});
```

### 2. ShopGridCard/ShopCardでの使用

```typescript
<ShopGridCard
  favoriteRelation={relations.favorite}
  visitedRelation={relations.visited}
  interestedRelation={relations.interested}
  userRelations={getUserRelations(shop.id)}
  onRelationToggle={(relationTypeId) => handleRelationToggle(shop.id, relationTypeId)}
/>
```

### 3. フィードバックモーダルの表示

```typescript
{feedbackModalShopId && (
  <ShopFeedbackModal
    isOpen={!!feedbackModalShopId}
    onClose={() => setFeedbackModalShopId(null)}
    shop={shops.find(s => s.id === feedbackModalShopId)}
    onSubmit={handleFeedbackSubmit}
  />
)}
```

## 📄 ShopFeedbackModal仕様

### RowSteps構成
1. **雰囲気フィードバック** - AtmosphereSlider（5段階評価）
2. **印象タグ** - 既存タグ共感 + 新規タグ登録
3. **完了** - 完了メッセージ

### 動作フロー
1. 「行った」ボタン初回クリック → リレーション設定 + モーダル表示
2. モーダル内でフィードバック入力
3. 完了後モーダル閉じる（リレーションは維持）
4. 再度「行った」ボタンクリック → リレーション解除のみ

## 🗂️ 対象ファイル

### 統一済み
- ✅ `/shops` - ShopList（ShopCard・ShopGridCard両対応）
- ✅ `/favorite` - favoriteページ

### 統一予定
- ⏳ `/visited` - visitedページ
- ⏳ `/wishlist` - wishlistページ
- ⏳ `/shops/[id]` - ShopDetailPage
- ⏳ `/user/[id]` - PublicProfileView

## 🚫 注意事項

- **IDは絶対に変更しないこと**：favorite=1, visited=2, interested=3
- **無限ループ防止**：shopsはuseMemoで必ずメモ化する
- **統一カスタムフック必須**：各ページで個別実装しない

## 🔄 更新履歴

- 2025-09-26: 初版作成、正しいリレーションID定義確定