# 店舗雰囲気フィードバック機能実装 - Claude Code開発記録

## 📋 実装概要
店舗の雰囲気をユーザーがフィードバックし、そのデータを集計・可視化する包括的システム。新規客が事前に店舗の雰囲気を把握できる環境を提供し、安心して訪問できるサードプレイス発見を支援。

**実装日**: 2025-08-25 → **最終更新**: 2025-10-03
**Claude Code Version**: Sonnet 4  

## 🎯 主要機能

### 1. 雰囲気フィードバック収集システム
- **「行った」ボタン連動**: 店舗詳細ページで「行った」ボタン押下時のモーダル表示
- **ステップ式入力**: 雰囲気評価 → 印象タグ入力の2段階プロセス
- **雰囲気指標の統一化**: 6指標から4指標への統合（お店の活気、お客さん同士の距離感、スタッフとの距離感、お店の空間）
- **スコア範囲**: -2から+2の5段階評価による直感的な入力
- **データ処理統一化**: `actions/shop/feedback.ts`による一元的なフィードバック処理

### 2. 雰囲気データ集計・可視化機能
- **平均値計算**: 全ユーザーのフィードバックから各指標の平均値を算出
- **AtmosphereVisualization**: グラデーション表示による視覚的な雰囲気マッピング
- **表示テキスト統一化**: `utils/atmosphere.ts`の`getScoreText`関数による一貫した表示
- **リアルタイム更新**: 新規フィードバック投稿時の即座な集計データ反映
- **色彩設計**: シアン系（左側）からピンク系（右側）への段階的グラデーション
- **データ取得統一**: `fetchAtmosphereIndicators`による中央化されたデータ取得

### 3. 訪問履歴管理機能
- **ShopVisitedModal**: 訪問記録の詳細入力モーダル
- **日時記録**: 自動日時記録とユーザーによる手動調整機能
- **次回フィードバック**: 一定期間後のリマインダー機能（実装予定）

## 🔧 技術実装詳細

### バックエンド (Django REST Framework)
```python
# 新規モデル
- ShopAtmosphereRating: 雰囲気評価データ
- ShopAtmosphereIndicator: 評価指標定義

# 主要エンドポイント
- /api/shops/{id}/atmosphere-ratings/ (POST: 雰囲気評価投稿)
- /api/shops/{id}/aggregated-atmosphere/ (GET: 集計データ取得)

# 集計ロジック
- Avg() 関数による各指標の平均値計算
- null値除外による正確な統計データ
```

### フロントエンド (Next.js 14 + TypeScript)
```typescript
// 新規コンポーネント
- ShopAtmosphereFeedbackModal: 雰囲気フィードバック入力
- ShopVisitedModal: 訪問記録入力
- AtmosphereVisualization: 雰囲気データ可視化
- AtmosphereInput: 雰囲気評価入力UI
- AtmosphereSlider: -2〜+2のスライダー入力

// 主要機能
- ステップ管理による段階的入力
- リアルタイムデータ更新
- グラデーション可視化
```

## 📁 関連ファイル一覧

### バックエンド
- `backend/shops/models.py`: ShopAtmosphereRating, ShopAtmosphereIndicator モデル追加
- `backend/shops/serializers.py`: AtmosphereRating関連シリアライザ
- `backend/shops/views.py`: atmosphere-ratings, aggregated-atmosphere エンドポイント
- `backend/shops/admin.py`: 管理画面での雰囲気データ管理
- `backend/shops/migrations/0004_alter_shopatmosphererating_options_and_more.py`: DB スキーマ

### フロントエンド - コンポーネント
- `frontend/src/components/Shop/ShopAtmosphereFeedbackModal/index.tsx`: **新規作成**
- `frontend/src/components/Shop/ShopAtmosphereFeedbackModal/style.module.scss`: モーダルスタイル
- `frontend/src/components/Shop/ShopVisitedModal/index.tsx`: **新規作成**  
- `frontend/src/components/Shop/ShopVisitedModal/style.module.scss`: 訪問記録モーダル
- `frontend/src/components/UI/AtmosphereVisualization/index.tsx`: **新規作成**
- `frontend/src/components/UI/AtmosphereInput/index.tsx`: **新規作成**
- `frontend/src/components/UI/AtmosphereInput/style.module.scss`: 雰囲気入力UI
- `frontend/src/components/UI/AtmosphereSlider/index.tsx`: スライダーコンポーネント拡張

### フロントエンド - ページ・統合
- `frontend/src/app/shops/[id]/page.tsx`: モーダル統合、データ取得
- `frontend/src/components/shop/ShopTagModal/index.tsx`: 印象タグ入力機能
- `frontend/src/components/shop/ShopTagModal/style.module.scss`: タグ入力スタイル

### フロントエンド - アクション/型定義/ユーティリティ
- `frontend/src/actions/shop/feedback.ts`: **統一化** - 雰囲気フィードバック処理の集約
- `frontend/src/actions/profile/fetchAtmosphereData.ts`: 雰囲気指標データ取得の中央化
- `frontend/src/utils/atmosphere.ts`: **新規作成** - 雰囲気表示ロジックの共通化
- `frontend/src/types/shops.ts`: 雰囲気関連型定義追加

## 🎨 デザインシステム

### 雰囲気可視化カラーパレット（2025-10-03更新）
```typescript
// utils/atmosphere.ts - 統一化されたカラーシステム
export const getScoreColor = (score: number): string => {
  if (score === 0) return 'rgba(255, 255, 255, 0.8)';
  const rightPercentage = scoreToRightPercentage(score);
  if (rightPercentage > 50) {
    // 右側（ピンク）が優勢
    return 'rgba(235, 14, 242, 0.8)';
  } else {
    // 左側（シアン）が優勢
    return 'rgba(0, 194, 255, 0.8)';
  }
};

// 統一されたグラデーション生成
background: linear-gradient(90deg,
  rgba(0,194,255,1) 0%,
  rgba(0,194,255,0.6) ${Math.max(0, leftPercentage - 8)}%,
  rgba(117,104,249,0.4) ${leftPercentage}%,
  rgba(235,14,242,0.6) ${Math.min(100, leftPercentage + 8)}%,
  rgba(235,14,242,1) 100%
);
```

### モーダルデザイン
```scss
// グラスモーフィズム + Netflix風
.modal {
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

// ステップインジケーター
.stepIndicator {
  .step.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
  }
}
```

### スライダーUI
```scss
// AtmosphereSlider カスタムスタイル
.slider {
  // -2〜+2 の視覚的表現
  &::-webkit-slider-thumb {
    background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
    box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
  }
  
  // 負の値は赤系、正の値は青系
  background: linear-gradient(90deg, 
    #dc2626 0%, 
    #6b7280 50%, 
    #1e40af 100%
  );
}
```

## 🔄 雰囲気指標統一化・データ処理集約化（2025-10-03）

### 統一化の背景と課題
- **指標数変更**: 雰囲気指標を6個から4個に統合
- **データ処理分散**: ShopFeedbackModalとShopAtmosphereFeedbackModalで重複する雰囲気フィードバック処理
- **表示ロジック分散**: 各コンポーネントでスコア表示テキストが重複実装

### 実施した統一化作業

#### 1. 共通ユーティリティ関数の作成
```typescript
// frontend/src/utils/atmosphere.ts
export const getScoreText = (score: number, leftLabel: string, rightLabel: string): string => {
  // 統一されたスコア表示ロジック
}
export const getScoreColor = (score: number): string => {
  // 統一されたカラーマッピング
}
```

#### 2. データ取得の統一化
- 全コンポーネントで`fetchAtmosphereIndicators`関数を使用
- 直接API呼び出しの排除
- エラーハンドリングの統一

#### 3. データ処理機能の集約
```typescript
// frontend/src/actions/shop/feedback.ts - 統一化後
export interface FeedbackData {
  atmosphere_scores: { [key: string]: number };  // 統一されたデータ形式
  impressionTags?: string[];
}

export async function submitShopFeedback(shopId: number, feedbackData: FeedbackData): Promise<void>
```

#### 4. コンポーネント間の統一
- ShopFeedbackModal: `submitShopFeedback`関数を使用
- ShopAtmosphereFeedbackModal: 同じく`submitShopFeedback`関数を使用
- AtmosphereSlider: 共通の`getScoreText`と`getScoreColor`を使用

### 統一化による効果
- **保守性向上**: 指標変更時の影響範囲最小化
- **バグ防止**: データ形式の不整合によるエラー解消
- **コード品質**: 重複ロジックの排除
- **将来対応**: 新しい雰囲気指標追加時の変更箇所最小化

## 🐛 解決した技術課題

### 1. モーダルの段階的表示制御
**課題**: 「行った」ボタン → 雰囲気評価 → 印象タグ の流れの管理
**解決**: 状態管理による段階的モーダル制御
```typescript
const [currentModal, setCurrentModal] = useState<'visited' | 'atmosphere' | 'tag' | null>(null);

// 段階的遷移
const handleVisitedSubmit = () => {
  setCurrentModal('atmosphere');
};

const handleAtmosphereSubmit = () => {
  setCurrentModal('tag');
};
```

### 2. 雰囲気データの集計と可視化
**課題**: -2〜+2のスコアデータの視覚的表現
**解決**: 動的グラデーション生成による直感的表示
```typescript
const generateGradient = (score: number) => {
  const normalizedScore = (score + 2) / 4; // 0-1に正規化
  const hue = normalizedScore * 240; // 赤(0) から 青(240)
  return `hsl(${hue}, 70%, 50%)`;
};
```

### 3. API データの型安全性
**課題**: 雰囲気データの複雑な型定義と型安全性
**解決**: 包括的なTypeScript型定義
```typescript
interface ShopAtmosphereRating {
  id: number;
  shop: number;
  user: number;
  conversation_style: number;  // -2 to 2
  volume_level: number;
  lighting: number;
  customer_age_range: number;
  created_at: string;
}

interface AggregatedAtmosphere {
  conversation_style: number | null;
  volume_level: number | null;
  lighting: number | null;
  customer_age_range: number | null;
}
```

### 4. リアルタイムデータ更新
**課題**: フィードバック投稿後の即座なUI反映
**解決**: API呼び出し後の状態更新とデータ再取得

### 5. 雰囲気フィードバック登録の不整合（2025-10-03解決）
**課題**: ShopFeedbackModalで雰囲気フィードバックが正しく登録されない
**原因**: データ形式の不整合
- ShopAtmosphereFeedbackModal: `{ atmosphere_scores: { [key: string]: number } }`
- submitShopFeedback: `{ atmosphereScores: { indicator_id: number; score: number }[] }`

**解決**:
- FeedbackDataインターフェースの統一
- 両コンポーネントでsubmitShopFeedback関数を共通使用
- データ処理ロジックの一元化
```typescript
const handleAtmosphereSubmit = async (data: AtmosphereData) => {
  try {
    await submitAtmosphereRating(shopId, data);
    // 集計データを即座に更新
    const newAggregatedData = await fetchAggregatedAtmosphere(shopId);
    setAggregatedAtmosphere(newAggregatedData);
    setCurrentModal('tag');
  } catch (error) {
    console.error('雰囲気評価の投稿に失敗:', error);
  }
};
```

## 🔄 Claude Code相談履歴

### Phase 1: 基本システム設計
**要求内容**:
- 店舗の「行った」ボタン押下時に雰囲気フィードバックを収集
- -2〜+2のスコアによる多軸評価システム
- 集計データの可視化機能

**実装プロセス**:
1. **データモデル設計**: ShopAtmosphereRating, ShopAtmosphereIndicator
2. **API エンドポイント**: POST/GET 両方向のデータフロー
3. **フロントエンド**: ステップ式モーダルシステム
4. **可視化**: AtmosphereVisualization コンポーネント

### Phase 2: UI/UX 改善・統合
**要求内容**:
- ステップ式入力による良好なユーザー体験
- Netflix風デザインによる洗練されたUI
- 店舗詳細ページへの自然な統合

**実装結果**:
- 直感的な雰囲気評価入力システム
- 視覚的に分かりやすい雰囲気データ表示
- シームレスなユーザーフロー実現

### Phase 3: データ可視化最適化
**要求内容**:
- 雰囲気データの効果的な視覚化
- 色彩による直感的な情報伝達
- レスポンシブ対応

**技術的成果**:
- 動的グラデーション生成システム
- スコアベースの色彩マッピング
- 全デバイス対応の可視化コンポーネント

### Phase 4: 統一化・データ処理集約化（2025-10-03）
**要求内容**:
- 雰囲気指標の6→4への統合対応
- 重複するデータ処理機能の集約
- 表示ロジックの統一化
- AtmosphereSliderでgetScoreText未使用問題の修正

**実装プロセス**:
1. **共通ユーティリティ作成**: `utils/atmosphere.ts`による表示ロジック統一
2. **データ取得統一**: 全コンポーネントで`fetchAtmosphereIndicators`使用
3. **フィードバック処理統一**: `submitShopFeedback`関数の集約
4. **開発ガイドライン策定**: データ処理集約ルールの明文化

**技術的成果**:
- 指標数変更時の影響範囲最小化
- ShopFeedbackModalの雰囲気フィードバック登録問題解決
- 重複コードの排除による保守性向上
- データ形式統一によるバグ防止

## 🚀 今後の拡張案

### 短期的改善
- [ ] フィードバック投稿後のリマインダー機能
- [ ] 雰囲気データの時系列変化表示
- [ ] ユーザー個人の雰囲気好み学習機能
- [ ] 雰囲気データの詳細分析ページ

### 中期的機能追加
- [ ] 常連客/新規客の重み付け機能
- [ ] 時間帯別雰囲気データ収集
- [ ] 雰囲気ベースの店舗レコメンデーション
- [ ] 雰囲気データのエクスポート機能

### 長期的システム改善
- [ ] AI による雰囲気予測モデル
- [ ] 雰囲気データのクラスタリング分析
- [ ] 店舗オーナー向け雰囲気分析ダッシュボード
- [ ] 地域別雰囲気トレンド分析

## 📝 メンテナンス情報

### パフォーマンス考慮事項
- 雰囲気データの効率的な集計クエリ
- 可視化コンポーネントのレンダリング最適化
- 大量データ対応のページネーション実装

### セキュリティ対策
- 認証必須のフィードバック投稿API
- スコア範囲の厳密な検証 (-2〜+2)
- 重複投稿防止機能

### テスト推奨箇所
- [ ] 雰囲気フィードバックの段階的投稿フロー
- [ ] 集計データの正確性確認
- [ ] 可視化コンポーネントの表示確認
- [ ] モーダルの状態管理テスト
- [ ] レスポンシブデザインの動作確認

---

**関連ドキュメント**: 
- [店舗関係性管理](./CLAUDE_ShopRelation.md)
- [口コミ機能](./CLAUDE_ShopReview.md)
- [UIコンポーネント](./CLAUDE_UIComponents.md)