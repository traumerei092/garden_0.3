# 🍺 お酒・ドリンク登録機能 README

サードプレイス探しアプリの店舗ドリンクメニュー管理機能のドキュメントです。

## 📋 目次

- [機能概要](#機能概要)
- [システム構成](#システム構成)
- [フロントエンド実装](#フロントエンド実装)
- [バックエンド実装](#バックエンド実装)
- [データ構造](#データ構造)
- [UI/UX設計](#uiux設計)
- [使用方法](#使用方法)
- [技術仕様](#技術仕様)
- [トラブルシューティング](#トラブルシューティング)

## 🎯 機能概要

### 主な機能

1. **ドリンク登録** - アルコール・ノンアルコール両対応
2. **カテゴリ別管理** - ウイスキー、ビール、ワインなど10カテゴリ
3. **ブランド・スタイル管理** - 各カテゴリに応じた詳細情報
4. **Netflix風フィルタリング** - 高度な検索・絞り込み機能
5. **リアクション機能** - ドリンクへの反応・評価
6. **レスポンシブ対応** - モバイル・デスクトップ両対応

### 対応データ

- **アルコールカテゴリ**: 10種類（ウイスキー、ジン、テキーラ、ブランデー、焼酎、日本酒、ビール、ワイン、ラム、ウォッカ）
- **ブランド**: 54種類（カテゴリ別に整理）
- **飲み方・スタイル**: 49種類（ハイボール、水割り、カクテルなど）

## 🏗️ システム構成

```
frontend/
├── src/
│   ├── components/
│   │   └── Shop/
│   │       ├── DrinkRegisterModal/     # 登録モーダル
│   │       ├── DrinkCard/              # ドリンクカード表示
│   │       └── ShopDrinks/             # ドリンク一覧管理
│   ├── actions/
│   │   └── shop/
│   │       └── drinks.ts               # API通信ロジック
│   └── types/
│       └── shops.ts                    # TypeScript型定義

backend/
├── shops/
│   ├── models.py                       # ドリンクモデル定義
│   ├── views_drink.py                  # ドリンクAPI
│   └── serializers.py                  # シリアライザー
└── accounts/
    ├── models.py                       # マスターデータモデル
    └── management/commands/            # データ投入コマンド
```

## 💻 フロントエンド実装

### DrinkRegisterModal コンポーネント

**場所**: `frontend/src/components/Shop/DrinkRegisterModal/index.tsx`

```typescript
interface DrinkRegisterModalProps {
  shopId: number
  isOpen: boolean
  onClose: () => void
  onSuccess: (newDrink: ShopDrink) => void
}
```

#### 主要機能

1. **バリデーション**: Zod + React Hook Form
2. **マスターデータ取得**: アルコールカテゴリ・ブランド・スタイル
3. **動的フィルタリング**: カテゴリ選択に応じてブランド・スタイルを絞り込み
4. **レスポンシブUI**: NextUI + SCSS modules

#### フォーム構成

```typescript
const drinkFormSchema = z.object({
  name: z.string().min(1, 'ドリンク名は必須です').max(100, 'ドリンク名は100文字以内で入力してください'),
  description: z.string().max(500, '説明は500文字以内で入力してください'),
  isAlcohol: z.boolean(),
  alcoholCategoryId: z.number().optional(),
  alcoholBrandId: z.number().optional(),
  drinkStyleId: z.number().optional()
})
```

### ShopDrinks コンポーネント

**場所**: `frontend/src/components/Shop/ShopDrinks/index.tsx`

#### Netflix風フィルタリング機能

```typescript
interface ActiveFilters {
  searchQuery: string;
  categories: number[];
  brands: number[];
  styles: number[];
  isAlcohol: boolean | null;
}
```

1. **検索機能**: 名前、カテゴリ、ブランド、スタイルで横断検索
2. **フィルター**: タイプ、カテゴリ、ブランド、スタイルで詳細絞り込み
3. **ソート**: 人気順、最新順、名前順、カテゴリ順
4. **表示モード**: グリッド表示・カテゴリ別表示

## 🔧 バックエンド実装

### Django モデル

**場所**: `backend/shops/models.py`

```python
class ShopDrink(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='drinks')
    name = models.CharField(max_length=100, verbose_name='ドリンク名')
    description = models.TextField(blank=True, verbose_name='説明')
    is_alcohol = models.BooleanField(default=True, verbose_name='アルコール')
    alcohol_category = models.ForeignKey('accounts.AlcoholCategory', on_delete=models.SET_NULL, null=True, blank=True)
    alcohol_brand = models.ForeignKey('accounts.AlcoholBrand', on_delete=models.SET_NULL, null=True, blank=True)
    drink_style = models.ForeignKey('accounts.DrinkStyle', on_delete=models.SET_NULL, null=True, blank=True)
    reaction_count = models.PositiveIntegerField(default=0, verbose_name='リアクション数')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### API エンドポイント

**場所**: `backend/shops/views_drink.py`

```python
# 主要エンドポイント
GET    /api/shop-drinks/shop_drinks/?shop_id={id}    # ドリンク一覧取得
POST   /api/shop-drinks/create_drink/                # ドリンク登録
GET    /api/shop-drinks/{id}/                        # ドリンク詳細取得
PUT    /api/shop-drinks/{id}/                        # ドリンク更新
DELETE /api/shop-drinks/{id}/                        # ドリンク削除
POST   /api/shop-drinks/{id}/toggle_reaction/        # リアクション切り替え
```

### マスターデータ管理

**場所**: `backend/accounts/management/commands/populate_profile_data.py`

10種類のアルコールカテゴリに対応:

```python
alcohol_data = {
    "ウイスキー": {
        "brands": ["サントリー角", "ジャックダニエル", "ジェムソン", "マッカラン", "山崎", "白州", "響"],
        "drink_styles": ["ハイボール", "水割り", "ロック", "ストレート", "ウイスキーソーダ"]
    },
    # ... 他9カテゴリ
}
```

## 📊 データ構造

### TypeScript 型定義

**場所**: `frontend/src/types/shops.ts`

```typescript
export interface ShopDrink {
  id: number
  name: string
  description: string
  is_alcohol: boolean
  alcohol_category?: AlcoholCategory
  alcohol_brand?: AlcoholBrand
  drink_style?: DrinkStyle
  reaction_count: number
  user_has_reacted: boolean
  created_at: string
  updated_at: string
}

export interface AlcoholCategory {
  id: number
  name: string
}

export interface AlcoholBrand {
  id: number
  name: string
  category: AlcoholCategory
}

export interface DrinkStyle {
  id: number
  name: string
  category: AlcoholCategory
}

export interface DrinkMasterData {
  alcohol_categories: AlcoholCategory[]
  alcohol_brands: AlcoholBrand[]
  drink_styles: DrinkStyle[]
}
```

## 🎨 UI/UX設計

### デザインシステム

1. **カラーパレット**:
   - アルコール: シアン→マゼンタのグラデーション
   - ノンアルコール: グリーン→ブルーのグラデーション
   - アクセント: ネオンブルー (`rgba(76, 201, 240, 1)`)

2. **レイアウト**:
   - モーダル: 大型サイズ (lg)
   - カード: コンパクトデザイン
   - フィルター: Netflix風の多層構造

3. **アニメーション**:
   - Framer Motion使用
   - スムーズなトランジション
   - ローディング状態の視覚化

### レスポンシブ対応

```scss
// モバイル最適化
@media (max-width: 768px) {
  .searchFilterBar {
    padding: 1rem;
  }
  
  .controlButtons {
    flex-direction: column;
    align-items: stretch;
  }
  
  .categoryDrinksGrid {
    grid-template-columns: 1fr;
  }
}
```

## 📱 使用方法

### 1. ドリンク登録

1. 店舗詳細ページでドリンクメニューセクションを表示
2. 「ドリンク登録」ボタンをクリック
3. アルコール/ノンアルコールを選択
4. ドリンク名を入力（必須）
5. アルコールの場合：カテゴリ→ブランド→スタイルを選択
6. 説明を入力（任意）
7. 「登録する」ボタンで完了

### 2. ドリンク検索・フィルタリング

1. 検索バーでキーワード検索
2. 「フィルター」ボタンで詳細絞り込み
3. ソート選択で表示順序変更
4. 表示モード切り替え（グリッド/カテゴリ別）

### 3. リアクション機能

1. ドリンクカードのハートアイコンをクリック
2. リアクション数がリアルタイム更新
3. 人気順ソートに反映

## ⚙️ 技術仕様

### フロントエンド

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **UI**: NextUI + SCSS Modules
- **Animation**: Framer Motion
- **Forms**: React Hook Form + Zod
- **State**: React Hooks (useState, useEffect, useMemo)

### バックエンド

- **Framework**: Django 4.x + Django REST Framework
- **Database**: SQLite (開発) / PostgreSQL (本番想定)
- **Authentication**: JWT Token
- **Validation**: Django Serializers

### 開発ツール

- **Linting**: ESLint + TypeScript ESLint
- **Formatting**: Prettier
- **Package Manager**: npm
- **Build Tool**: Next.js built-in

## 🐛 トラブルシューティング

### よくある問題

#### 1. マスターデータが表示されない

```bash
# マスターデータの確認
python manage.py shell -c "
from accounts.models import AlcoholCategory
print(f'Categories: {AlcoholCategory.objects.count()}')
"

# データ再投入
python manage.py populate_profile_data
```

#### 2. TypeScriptエラー

```typescript
// よくあるエラーと解決法
// Error: 'possibly undefined'
const category = availableFilters.categories.find(c => c?.id === catId);

// Error: Type mismatch
selectedKeys={value ? [value.toString()] : []}
```

#### 3. APIエラー

```javascript
// デバッグ用ログの確認
console.log('🚀 Creating drink:', { url, payload })
console.log('📡 Response status:', res.status)
```

### デバッグコマンド

```bash
# フロントエンド
npm run dev              # 開発サーバー起動
npm run build           # プロダクションビルド
npm run lint            # ESLintチェック

# バックエンド
python manage.py runserver                    # サーバー起動
python manage.py shell                        # Djangoシェル
python manage.py populate_profile_data        # マスターデータ投入
```

### パフォーマンス最適化

1. **useMemo使用**: 重い計算のメモ化
2. **画像最適化**: Next.js Image コンポーネント
3. **コード分割**: 動的インポート
4. **キャッシュ戦略**: SWR / React Query 検討

## 📈 今後の拡張予定

1. **ドリンク画像アップロード機能**
2. **価格情報管理**
3. **在庫状況表示**
4. **レビュー・コメント機能**
5. **おすすめ機能（AI活用）**
6. **SNS連携（Instagram等）**

---

## 📞 サポート

技術的な質問や改善提案がございましたら、開発チームまでお気軽にお声がけください。

**最終更新**: 2025年8月4日