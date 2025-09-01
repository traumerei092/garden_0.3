# 店舗画像カルーセル機能 (Shop Image Carousel)

## 概要

店舗詳細ページにおける画像表示システムを、静的な単一画像表示からSwiper.jsベースの高機能カルーセルシステムにアップグレード。Netflix品質のモダンなUI/UXを提供し、画像の閲覧体験を大幅に向上させる機能です。

## 機能詳細

### 1. メインカルーセル表示

**基本仕様:**
- Swiper.jsを使用した高品質なカルーセル機能
- 画像サイズ: デスクトップ 500px、モバイル 280px
- スムーズなスライドアニメーション
- タッチ・スワイプ操作対応

**ナビゲーション:**
- 左右矢印ボタン（画像上にオーバーレイ表示）
- 2枚以上の画像がある場合のみ表示
- ホバー時の拡大エフェクト
- Glassmorphismデザイン

**画像インジケーター:**
- 現在位置表示（例: "1 / 5"）
- 左下に半透明表示
- リアルタイム更新

### 2. サムネイルギャラリー

**表示仕様:**
- メインカルーセル下部に配置
- サムネイルサイズ: 120x100px（モバイル: 80x56px）
- 横スクロール可能
- アクティブ画像のハイライト表示

**インタラクション:**
- サムネイルクリックでメインカルーセル連動
- ホバーエフェクト（上方向移動）
- アクティブ状態の視覚的フィードバック

### 3. 画像管理機能

**画像追加:**
- 控えめなカメラアイコンボタン（左上配置）
- ShopImageModalとの連携
- アップロード後の自動リフレッシュ

**画像一覧表示:**
- 「すべて表示」ボタン（右下配置）
- ShopImageGalleryModalの起動
- Masonry風レイアウトでの一覧表示

### 4. レスポンシブデザイン

**ブレークポイント:**
- デスクトップ: 500px高さ、120px幅サムネイル
- タブレット: 400px高さ、100px幅サムネイル  
- モバイル: 280px高さ、80px幅サムネイル
- 小型モバイル: 240px高さ、64px幅サムネイル

## UI/UX仕様

### デザインコンセプト
- **Netflix品質**: 高品質なビジュアル体験
- **Glassmorphism**: 半透明・背景ぼかしエフェクト
- **Cyber punk**: サイアンアクセントカラー
- **マイクロインタラクション**: 滑らかなアニメーション

### 色彩設計
```scss
// アクセントカラー
$cyan-primary: rgba(0, 255, 255, 0.9);
$cyan-secondary: rgba(0, 255, 255, 0.6);
$cyan-tertiary: rgba(0, 255, 255, 0.3);

// 背景・オーバーレイ
$overlay-dark: rgba(0, 0, 0, 0.6);
$overlay-light: rgba(0, 0, 0, 0.4);
$glass-bg: rgba(0, 0, 0, 0.1);
```

## 技術仕様

### フロントエンド実装

**主要コンポーネント:**
```
/components/Shop/ShopImageCarousel/
├── index.tsx              # メインコンポーネント
├── style.module.scss      # スタイル定義
└── README.md             # 本ドキュメント
```

**依存関係:**
```json
{
  "swiper": "^latest",
  "@nextui-org/react": "^latest",
  "lucide-react": "^latest"
}
```

**Swiperモジュール:**
- `Thumbs`: サムネイル連動機能
- カスタムナビゲーション実装（Controllerは使用せず）

### コンポーネント仕様

**Props Interface:**
```typescript
interface ShopImageCarouselProps {
  images: ShopImage[];           // 画像配列
  shopName: string;              // 店舗名
  onImageUpload?: () => void;    // 画像追加コールバック
  onViewAll?: () => void;        // 一覧表示コールバック
  className?: string;            // 追加スタイル
}

interface ShopImage {
  id: number;
  image_url: string;
  caption?: string;
}
```

**State Management:**
```typescript
const [activeIndex, setActiveIndex] = useState(0);
const [mainSwiper, setMainSwiper] = useState<SwiperType | null>(null);
const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
```

### 画像一覧モーダル (ShopImageGalleryModal)

**技術仕様:**
- CustomModalコンポーネント使用（NextUIベース）
- Masonry風グリッドレイアウト
- 動的高さ計算アルゴリズム
- 拡大表示機能（Lightbox）

**レイアウト計算:**
```typescript
const getGridItemHeight = (index: number) => {
  const heights = [200, 250, 180, 220, 190, 240, 210, 170, 230, 200];
  return heights[index % heights.length];
};
```

### 画像追加機能 (ShopImageModal)

**主要機能:**
- アイコン設定機能完全実装
- PictureUploadコンポーネント連携
- アップロード進行状況表示
- エラーハンドリング

**アイコン設定ロジック:**
```typescript
const [isIconSelected, setIsIconSelected] = useState(false);

// onSubmitでアイコン設定状態を渡す
onSubmit?.(file, caption, isIconSelected);
```

## パフォーマンス最適化

### 画像読み込み最適化
- Next.js Imageコンポーネント使用
- 適切なsizes属性設定
- 遅延読み込み（初回画像以外）

### Swiper最適化
- 必要最小限のモジュールのみ読み込み
- CSSは必要な分のみインポート
- 循環参照によるメモリリーク防止

### アニメーション最適化
- CSS Transform使用（GPU加速）
- will-change プロパティ活用
- 60fps維持のため軽量アニメーション

## トラブルシューティング

### よくある問題と解決策

**1. "Maximum call stack size exceeded"**
- 原因: SwiperのControllerモジュールによる循環参照
- 解決: Controllerを削除し、手動制御に変更

**2. サムネイル同期が動作しない**
- 原因: Swiper参照のnullチェック不足
- 解決: 適切なnullチェックと条件分岐

**3. ナビゲーションボタンが機能しない**
- 原因: Swiperインスタンス取得のタイミング問題
- 解決: onSwiperコールバックでの確実な参照取得

### デバッグ方法
```javascript
// Swiperインスタンスの状態確認
console.log('Main Swiper:', mainSwiper);
console.log('Thumbs Swiper:', thumbsSwiper);
console.log('Active Index:', activeIndex);
```

## 今後の拡張予定

### Phase 1: 基本機能強化
- 画像の並び順変更機能
- 一括画像アップロード
- 画像メタデータ管理

### Phase 2: 高度な表示機能
- 画像フィルター・検索
- 360度画像対応
- 動画コンテンツ対応

### Phase 3: ソーシャル機能
- 口コミからの画像投稿
- 画像への「いいね」機能
- ユーザー投稿画像の承認フロー

## 運用・保守

### 定期メンテナンス
- Swiper.jsバージョンアップデート
- 画像最適化処理の見直し
- パフォーマンス指標の監視

### 監視項目
- 画像読み込み時間
- カルーセル操作の応答性
- モバイルでのタッチ操作精度
- メモリ使用量（特に大量画像時）

---

## 関連ファイル

**フロントエンド:**
- `/components/Shop/ShopImageCarousel/` - メインカルーセル
- `/components/Shop/ShopImageGalleryModal/` - 画像一覧モーダル  
- `/components/Shop/ShopImageModal/` - 画像追加モーダル
- `/components/UI/Modal/` - カスタムモーダル
- `/components/UI/PictureUpload/` - 画像アップロード

**統合:**
- `/app/shops/[id]/page.tsx` - 店舗詳細ページ統合