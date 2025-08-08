# 店舗関係性管理機能 - Claude Code開発記録

## 📋 実装概要
店舗との関係性管理機能（行きつけ・行った・気になる）の実装。3段階の関係性とそれに対応した専用ページ、統計データ管理システム。

**実装日**: 2025-08-03  
**Claude Code Version**: Sonnet 4  

## 🎯 主要機能

### 1. 3段階の店舗関係性
- 🏆 **行きつけ** (#00ffff) - Crown アイコン
- ⭐ **行った** (#ffc107) - Star アイコン  
- ❤️ **気になる** (#ef4444) - Heart アイコン

### 2. 専用ページシステム
- **FavoritePage** (`/favorite`): 行きつけ店舗一覧
- **VisitedPage** (`/visited`): 行った店舗一覧  
- **WishlistPage** (`/wishlist`): 気になる店舗一覧

### 3. リアルタイム統計管理
- **数値カウント**: 各関係性の店舗数表示
- **ユーザー状態**: 個人の関係性状態管理
- **順序制御**: favorite→visited→interested の一貫した表示順

## 🔧 技術実装詳細

### バックエンド (Django REST Framework)
```python
# 新規エンドポイント
- /api/user-shop-relations/favorite_shops/ (行きつけ店舗一覧)
- /api/user-shop-relations/shop_stats/ (店舗統計 - 順序制御付き)

# 順序制御実装
relation_types = RelationType.objects.all().order_by(
    models.Case(
        models.When(name='favorite', then=models.Value(1)),
        models.When(name='visited', then=models.Value(2)),
        models.When(name='interested', then=models.Value(3)),
        default=models.Value(4),
        output_field=models.IntegerField()
    )
)
```

### フロントエンド (Next.js 14 + TypeScript)
```typescript
// 新規ページ
- FavoritePage: 行きつけ店舗専用ページ
- 統計データ統合: 全ページで一貫したデータ取得

// コンポーネント拡張
- ShopActionButton: Crown アイコン + 順序変更
- ShopCard/ShopGridCard: favorite対応
- 統計データ取得の統一化
```

## 📁 関連ファイル一覧

### バックエンド
- `backend/shops/views.py`: favorite_shops エンドポイント、順序制御
- `backend/shops/models.py`: RelationType拡張

### フロントエンド - コンポーネント
- `frontend/src/components/Shop/ShopActionButton/index.tsx`: Crown アイコン実装
- `frontend/src/components/Shop/ShopActionButton/style.module.scss`: cyan テーマ + glow効果
- `frontend/src/components/Shop/ShopCard/index.tsx`: favorite ボタン追加
- `frontend/src/components/Shop/ShopGridCard/index.tsx`: 3ボタン対応
- `frontend/src/components/Shop/ShopList/index.tsx`: データ統合

### フロントエンド - ページ
- `frontend/src/app/favorite/page.tsx`: 行きつけ店舗ページ
- `frontend/src/app/favorite/style.module.scss`: cyan ベーステーマ
- `frontend/src/app/visited/page.tsx`: 色変更 + データ統合
- `frontend/src/app/visited/style.module.scss`: #ffc107 ベーステーマ
- `frontend/src/app/wishlist/page.tsx`: データ統合
- `frontend/src/app/shops/[id]/page.tsx`: 順序変更 + favorite対応

### フロントエンド - アクション/型定義
- `frontend/src/actions/shop/fetchUserShops.ts`: fetchFavoriteShops 追加
- `frontend/src/actions/shop/relation.ts`: 統計データ取得
- `frontend/src/types/shops.ts`: RelationType 拡張

## 🎨 デザインシステム

### アイコンとカラーテーマ
```typescript
// ShopActionButton アイコン実装
case 'favorite':
  return <Crown
    size={16}
    strokeWidth={isActive ? 0 : 1.5}
    fill={isActive ? '#00ffff' : 'none'}
    color={isActive ? '#00ffff' : 'white'}
  />;

case 'visited':
  return <Star
    size={16}
    strokeWidth={isActive ? 0 : 1.5}
    fill={isActive ? '#ffc107' : 'none'}
    color={isActive ? '#ffc107' : 'white'}
  />;
```

### グロー効果実装
```scss
// favorite ボタンのアクティブ状態
&.favorite {
  &.active {
    background: rgba(0, 255, 255, 0.1) !important;
    border-color: rgba(0, 255, 255, 0.3) !important;
    box-shadow: 0 0 12px rgba(0, 255, 255, 0.2);
    
    &:hover {
      box-shadow: 0 0 16px rgba(0, 255, 255, 0.3);
    }
  }
}
```

### ページテーマカラー
```scss
// FavoritePage
$favorite-gradient: linear-gradient(135deg, #00ffff 0%, #00cccc 100%);
$favorite-glow: rgba(0, 255, 255, 0.3);

// VisitedPage  
$visited-gradient: linear-gradient(135deg, #ffc107 0%, #f59e0b 100%);
$visited-glow: rgba(255, 193, 7, 0.3);

// WishlistPage
$interested-gradient: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
$interested-glow: rgba(239, 68, 68, 0.3);
```

## 🐛 解決した技術課題

### 1. ボタン順序の一貫性
**課題**: バックエンドとフロントエンドでの表示順序の不一致
**解決**: Django ORMの `Case` 文で順序制御
```python
# 一貫した順序: favorite → visited → interested
relation_types = RelationType.objects.all().order_by(
    models.Case(
        models.When(name='favorite', then=models.Value(1)),
        models.When(name='visited', then=models.Value(2)),
        models.When(name='interested', then=models.Value(3)),
        default=models.Value(4),
        output_field=models.IntegerField()
    )
)
```

### 2. ユーザーリレーションの表示ロジック
**課題**: 各ページで異なるボタン色の表示ロジック
**解決**: 統一した `userRelations` 配列処理
```typescript
// 統一された処理ロジック
const userRelations: { [key: number]: boolean } = {};
if (stats?.user_relations) {
  stats.user_relations.forEach((relationTypeId: number) => {
    userRelations[relationTypeId] = true;
  });
}
```

### 3. 統計データの取得タイミング
**課題**: 各専用ページでの統計データ不整合
**解決**: 全ページで `fetchShopStats` を統一実装
```typescript
// 各ページで統一した統計データ取得
const newShopStats: { [key: number]: ShopStats } = {};
for (const shop of shops) {
  try {
    const stats = await fetchShopStats(shop.id.toString());
    newShopStats[shop.id] = stats;
  } catch (error) {
    console.error(`店舗${shop.id}の統計データ取得に失敗:`, error);
  }
}
```

## 🔄 Claude Code相談履歴

### 初回要求: favorite機能追加
- **要求**: 「行きつけのお店」ボタンと専用ページの追加
- **実装**: Crown アイコン、cyan テーマ、バックエンドAPI拡張
- **結果**: 3段階の店舗関係性管理システム

### 追加要求: 順序とデータ整合性
- **要求**: 
  - ボタン順序を「favorite→visited→interested」に統一
  - 全ページでの正確なボタン色表示
  - visitedの色を#ffc107に変更
- **実装**: 
  - バックエンドの順序制御
  - 統計データ取得の統一化
  - テーマカラーの変更
- **結果**: 一貫したユーザー体験の実現

## 🚀 今後の拡張案

### 短期的改善
- [ ] 関係性変更時のアニメーション追加
- [ ] バッジ機能 (行きつけ回数表示)
- [ ] 関係性履歴の表示
- [ ] 一括操作機能

### 中期的機能追加
- [ ] 行きつけ店舗でのスタンプカード機能
- [ ] 行きつけ店舗からの特別オファー
- [ ] 関係性に基づくレコメンデーション
- [ ] 友達との関係性共有機能

### 長期的システム改善
- [ ] 関係性の重み付け機能
- [ ] 時系列での関係性変化分析
- [ ] 店舗オーナー向け顧客関係管理
- [ ] AI による関係性予測

## 📝 メンテナンス情報

### パフォーマンス最適化
- 統計データの効率的な取得・キャッシュ
- リレーション切り替え時の最適化
- ページ読み込み速度の向上

### セキュリティ対策
- 認証必須API endpoints
- ユーザー関係性データの適切な権限管理
- 不正な関係性操作の防止

### テスト推奨箇所
- [ ] 3つの関係性ボタンの表示・動作確認
- [ ] 各専用ページでの統計データ整合性
- [ ] 関係性切り替え時のリアルタイム更新
- [ ] 順序表示の一貫性確認

---

**関連ドキュメント**: 
- [口コミ機能](./CLAUDE_ShopReview.md)
- [UIコンポーネント](./CLAUDE_UIComponents.md)