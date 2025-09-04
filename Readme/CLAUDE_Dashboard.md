# Myダッシュボード機能

## 概要
サードプレイスアプリのユーザー向けダッシュボード機能。ユーザーの店舗体験を包括的に可視化し、「行きつけの店」を中心とした行動を促進する。

## 主要機能

### 1. サマリーセクション（リスト表示）
- **行きつけの店**: 特別ハイライト表示、ウェルカムアクション数、雰囲気ギャップ分析
- **行った店**: 雰囲気フィードバック状況の追跡
- **気になる店**: 基本カウント表示

### 2. インタラクティブアコーディオン
#### 🎉 ウェルカムアコーディオン
- 行きつけの店でのウェルカム状況を一覧表示
- 「ウェルカム済」「未ウェルカム」をチップで色分け表示

#### 📊 雰囲気ギャップ分析
- ユーザーの雰囲気好みと行きつけの店の平均雰囲気を対比
- プログレスバーによる視覚的な差異表示
- -2〜+2スケールでの数値可視化

#### 💡 フィードバック状況追跡
- 行った店の雰囲気フィードバック状況を管理
- 未完了店舗数の警告表示

### 3. 履歴セクション（2列グリッド）
- **閲覧履歴**: 最近見た店舗の履歴
- **口コミ履歴**: 来店目的チップ付きレビュー表示
- **雰囲気フィードバック履歴**: コンパクトなスコア表示
- **印象タグ履歴**: タグ反応の履歴

### 4. アクティビティ追跡
- 最近のユーザーアクション（閲覧・レビュー・お気に入り等）をタイムライン表示

## 技術仕様

### バックエンド
**ファイル**: `backend/accounts/dashboard_views.py`

#### 新規APIエンドポイント
```python
GET /api/accounts/profile/dashboard/summary/
GET /api/accounts/profile/dashboard/view-history/
GET /api/accounts/profile/dashboard/review-history/ 
GET /api/accounts/profile/dashboard/recent-activity/
GET /api/accounts/profile/dashboard/atmosphere-feedback-history/
GET /api/accounts/profile/dashboard/tag-reaction-history/
```

#### 主要なViewクラス
- `DashboardSummaryView`: サマリーデータと詳細情報を提供
- `ViewHistoryView`: 店舗閲覧履歴（重複除去）
- `ReviewHistoryView`: 口コミ履歴（来店目的情報付き）
- `AtmosphereFeedbackHistoryView`: 雰囲気フィードバック履歴
- `TagReactionHistoryView`: 印象タグ反応履歴

#### データモデル拡張
- `ShopViewHistory`: 店舗閲覧履歴の追跡
- `UserAtmospherePreference`: ユーザー雰囲気好み設定
- `ShopAtmosphereAggregate`: 店舗雰囲気平均値キャッシュ
- `WelcomeAction`: ウェルカムアクション記録

### フロントエンド
**ファイル**: 
- `frontend/src/components/Account/Dashboard/index.tsx`
- `frontend/src/components/Account/Dashboard/style.module.scss`
- `frontend/src/components/UI/DarkAccordion/index.tsx` ⭐ **新規作成**
- `frontend/src/components/UI/DarkAccordion/style.module.scss` ⭐ **新規作成**
- `frontend/src/actions/profile/fetchDashboardData.ts`

#### TypeScriptインターフェース
```typescript
interface DashboardSummary {
  favorite_shops_count: number;
  visited_shops_count: number;
  interested_shops_count: number;
  favorite_shops_details: FavoriteShopDetail[];
  visited_shops_details: VisitedShopDetail[];
  total_welcome_count: number;
  user_atmosphere_preferences: Record<string, number>;
  favorite_shops_atmosphere_average: Record<string, number>;
  visited_without_feedback_count: number;
}
```

#### 主要コンポーネント
- `Dashboard`: メインダッシュボードコンポーネント
- `DarkAccordion`: ⭐ **新規** - ダークテーマ対応のAccordionコンポーネント
- `DarkAccordionItem`: NextUIのAccordionItemラッパー
- アコーディオン式UI（開閉アニメーション付き）
- レスポンシブ対応（デスクトップ・タブレット・モバイル）

#### ⭐ 新規 - DarkAccordionコンポーネント仕様
```typescript
// 使用方法
import DarkAccordion, { DarkAccordionItem } from '@/components/UI/DarkAccordion';

<DarkAccordion variant="splitted" className={styles.accordion}>
  <DarkAccordionItem 
    key="example" 
    title="タイトル" 
    subtitle="サブタイトル"
    startContent={<Icon size={16} />}
  >
    コンテンツ
  </DarkAccordionItem>
</DarkAccordion>
```

**特徴**:
- NextUI Accordionの白い背景問題を解決
- JavaScript動的スタイリングによる確実なダークテーマ適用
- CSS変数とインラインスタイルによる多重プロテクション
- ホバーエフェクトの無効化（統一感のあるUI）

### UIデザイン
- **デザインシステム**: Netflix品質のサイバーパンク風
- **カラーパレット**: シアン・マゼンタグラデーション
- **レイアウト**: 
  - サマリー: 縦リスト表示
  - 履歴: 2列グリッド表示（モバイルは1列）
- **アニメーション**: CSS transitionによる滑らかな開閉

## 主要な実装ポイント

### 1. データ安全性
```javascript
// 数値の安全チェック
const safeScore = typeof score === 'number' ? score : 0;
const safeWidth = Math.max(0, Math.min(100, ((safeScore + 2) / 4) * 100));
```

### 2. レイアウト制約
```scss
.dashboardContainer {
  contain: layout style;
  overflow-x: hidden;
}

.scoreValue {
  position: relative;
  max-width: 100%;
  box-sizing: border-box;
}
```

### 3. アコーディオンUI
```javascript
const toggleSection = (sectionId: string) => {
  setExpandedSections(prev => ({
    ...prev,
    [sectionId]: !prev[sectionId]
  }));
};
```

## ビジネス価値

### サードプレイスアプリとしての価值
1. **行きつけの店の促進**: ウェルカム機能と雰囲気分析で深い店舗関係を促進
2. **自己理解の促進**: 雰囲気ギャップ分析でユーザーの潜在的好みを発見
3. **行動促進**: フィードバック未完了の可視化でエンゲージメント向上
4. **包括的体験**: すべての店舗体験を一画面で把握可能

### UXの特徴
- **直感的操作**: アコーディオンによる段階的情報開示
- **視覚的理解**: プログレスバーとチップによる状況の即座理解
- **行動誘導**: 未完了タスクの明確な表示

## 今後の拡張性

### Phase 2候補機能
- 雰囲気レコメンデーション機能
- 店舗体験の詳細分析
- ソーシャル機能（友達の行きつけとの比較）
- 季節性分析（時期による好みの変化）

### 技術的拡張
- リアルタイムデータ更新
- パフォーマンス最適化（仮想スクロール）
- オフライン対応
- エクスポート機能（CSV・PDF）

## 開発ガイドライン

### ⭐ DarkAccordionコンポーネントの使用
他のプロジェクトでNextUI Accordionを使用する際は、必ず `DarkAccordion` を使用してください：

```typescript
// ❌ 避けるべき
import { Accordion, AccordionItem } from '@nextui-org/react';

// ✅ 推奨
import DarkAccordion, { DarkAccordionItem } from '@/components/UI/DarkAccordion';
```

**理由**: NextUIのAccordionは頑固な白い背景を持ち、通常のCSSでは変更困難。

### 新しい履歴セクション追加時
1. バックエンドAPIビューを作成
2. `dashboard_views.py` にViewクラス追加
3. `urls.py` にエンドポイント追加
4. フロントエンドにTypeScriptインターフェース定義
5. `fetchDashboardData.ts` に取得関数追加
6. `Dashboard/index.tsx` にUI実装
7. `style.module.scss` にスタイル追加

### パフォーマンス考慮事項
- 大量データ時の pagination実装
- キャッシュ戦略の検討
- 画像の遅延読み込み
- API呼び出しの最適化

## 関連ドキュメント
- `CLAUDE_WelcomeSystem.md`: ウェルカム機能
- `CLAUDE_AtmosphereFeedback.md`: 雰囲気フィードバック
- `CLAUDE_ShopRelation.md`: 店舗関係管理
- `CLAUDE_DevelopmentGuidelines.md`: 開発ガイドライン