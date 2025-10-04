# 店舗フィードバックシステム 設計・実装ドキュメント

## 概要
「行った」ボタン押下後に表示される3段階フィードバックモーダルシステム。
雰囲気評価と印象タグ追加を通じて、ユーザーの訪問体験を定量・定性的に収集する。

## システム構成

### フロントエンド構成
```
frontend/src/
├── components/Shop/ShopFeedbackModal/          # メインフィードバックモーダル
│   ├── index.tsx                               # 3ステップモーダル実装
│   └── style.module.scss                      # スタイル定義
├── components/UI/AtmosphereSlider/             # 雰囲気評価スライダー
│   ├── index.tsx                               # RadioGroup実装（-2〜+2の5段階）
│   └── style.module.scss                      # スタイル定義
├── components/UI/RowSteps/                     # ステップナビゲーション
├── components/Shop/ShopImpressionTag/          # 印象タグ表示コンポーネント
├── actions/shop/feedback.ts                   # 雰囲気フィードバックAPI
├── actions/shop/impressionTag.ts               # 印象タグAPI（統一版）
├── utils/feedbackStorage.ts                   # localStorageデータ取得
└── utils/feedbackActions.ts                   # localStorageデータ保存
```

### バックエンド構成
```
backend/shops/
├── models.py                                   # ShopAtmosphereFeedback, ShopTag等
├── views.py                                    # ShopViewSet.atmosphere_feedback等
├── serializers.py                             # フィードバック関連シリアライザー
└── urls.py                                     # エンドポイント定義
```

## 機能仕様

### 3ステップフィードバックフロー

#### Step 1: 雰囲気評価
- **UI**: AtmosphereSlider（RadioGroup実装）
- **評価軸**: 双極性特性（静か↔会話が弾む、落ち着く↔活気がある等）
- **スケール**: -2（左極）〜 +2（右極）の5段階
- **データ**: `atmosphere_scores: { indicator_id: score }`形式
- **API**: `POST /api/shops/{id}/atmosphere_feedback/`
- **保存タイミング**: 「更新して次へ」ボタン押下時

#### Step 2: 印象タグ
- **機能**: 既存タグへのリアクション＋新規タグ追加
- **UI**: ShopImpressionTag一覧＋新規追加フォーム
- **データ**: ShopTag形式（id, value, reaction_count等）
- **API**: `POST /api/shop-tags/`（統一版`addImpressionTag`使用）
- **保存タイミング**: タグ追加時即座にサーバー送信

#### Step 3: 完了
- **表示**: 完了メッセージとアイコン
- **処理**: モーダル閉じる＋親コンポーネントの`onDataUpdate`実行

### データフロー

#### 雰囲気データ
```typescript
// 送信データ
FeedbackData {
  atmosphereScores: { indicator_id: number; score: number }[]
  impressionTags: [] // 雰囲気では空
}

// 保存データ（localStorage）
ShopAtmosphereFeedback {
  id: number
  user: number
  shop: number
  atmosphere_scores: { [indicator_id: string]: number }
  created_at: string
  updated_at: string
}
```

#### 印象タグデータ
```typescript
// API応答
ShopTagResponse {
  id: number
  shop: number
  value: string
  created_at: string
  reaction_count: number
  user_has_reacted: boolean
  is_creator: boolean
  created_by?: UserInfo
}

// UI表示用（ShopTag型）
ShopTag {
  id: number
  shop: number
  value: string
  created_at: string
  reaction_count: number
  user_has_reacted: boolean
  is_creator: boolean
  created_by?: UserInfo
}
```

## 技術的実装詳細

### コンポーネント設計

#### ShopFeedbackModal
- **責務**: 3ステップフロー管理、データ統合、API呼び出し
- **状態管理**:
  - `currentStep`: ステップ制御
  - `atmosphereScores`: 雰囲気評価データ
  - `existingTags`: 既存印象タグ
  - `impressionTags`: 新規追加タグリスト
- **プロパティ**: `onDataUpdate`（完了時の親データ更新）

#### AtmosphereSlider
- **実装**: NextUI RadioGroup
- **重要**: 双極性特性評価（星評価ではない）
- **スタイル**: `:global(.radio)`でNextUI要素をターゲット
- **ラベル表示**: 両端のみ、中央は「どちらも楽しめる」

### API設計

#### エンドポイント
- 雰囲気フィードバック: `POST /api/shops/{id}/atmosphere_feedback/`
- 既存データ取得: `GET /api/shops/{id}/my_atmosphere_feedback/`
- 印象タグ追加: `POST /api/shop-tags/`（認証必須）

#### 認証とエラーハンドリング
- **認証**: `fetchWithAuth`使用（開発ガイドライン準拠）
- **エラー時**: localStorageフォールバック
- **404処理**: 既存データなしとして処理

### 統一設計パターン

#### 印象タグ処理の標準化
```typescript
// 必須使用パターン
import { addImpressionTag } from '@/actions/shop/impressionTag';

const apiResult = await addImpressionTag(shopId, tagValue);
const newTag: ShopTag = {
  id: apiResult.id,
  shop: apiResult.shop,
  value: apiResult.value,
  created_at: apiResult.created_at,
  reaction_count: apiResult.reaction_count,
  is_creator: apiResult.is_creator,
  user_has_reacted: apiResult.user_has_reacted,
  created_by: apiResult.created_by
};
```

#### モーダルインターフェース
- **廃止**: `onSubmit`プロパティ
- **使用**: `onDataUpdate`プロパティ（データ更新通知用）

## 使用箇所と連携

### モーダル呼び出し元
- `/app/shops/[id]/page.tsx` - 店舗詳細ページ
- `/app/favorite/page.tsx` - お気に入り一覧
- `/app/visited/page.tsx` - 訪問済み一覧
- `/app/wishlist/page.tsx` - 行きたい一覧
- `/components/Shop/ShopList/index.tsx` - 店舗リスト

### 呼び出しパターン
```tsx
<ShopFeedbackModal
  isOpen={feedbackModalOpen}
  onClose={() => setFeedbackModalOpen(false)}
  shop={shop}
  onDataUpdate={loadShop} // データ再読込関数
/>
```

## パフォーマンス考慮事項

### デフォルト値の高速表示
- 雰囲気データ: localStorageから即座に復元
- 既存タグ: shop.tagsから表示

### データ同期
- 雰囲気: Step1完了時サーバー送信
- 印象タグ: 追加時即座にサーバー送信
- UI更新: 楽観的更新でUX向上

## 今後の拡張方針

### 機能拡張案
1. **写真アップロード**: Step2.5として写真投稿機能追加
2. **詳細コメント**: Step2.5としてフリーテキストコメント
3. **評価軸追加**: 新しい雰囲気指標の動的追加
4. **バッチ処理**: 複数店舗のフィードバック一括入力

### 技術的拡張
1. **オフライン対応**: Service Worker + IndexedDB
2. **リアルタイム更新**: WebSocket for live tag reactions
3. **AI分析**: 印象タグの自動カテゴライズ
4. **レコメンデーション**: フィードバックベースの店舗推薦

### 運用面での拡張
1. **モデレーション**: 不適切タグの自動検出・削除
2. **分析ダッシュボード**: 店舗オーナー向け分析機能
3. **API Rate Limiting**: 大量データ送信の制御
4. **データマイグレーション**: localStorage → サーバーデータ移行

## 既知の制約・注意事項

### 技術的制約
- localStorage: ブラウザストレージ制限（通常5MB）
- 認証: JWT有効期限による再ログイン必要性
- API: 一部エンドポイント未実装時のフォールバック

### UX制約
- モバイル: RowStepsの横スクロール
- 大量タグ: 表示領域の制限
- 通信環境: オフライン時の制限

### 運用制約
- タグ重複: 大文字小文字の違いによる類似タグ
- データ量: 大量フィードバックによるパフォーマンス影響
- 多言語: 現在日本語のみ対応

## 常連フィードバック機能（2025-10-04追加）

### 概要
「行きつけ」ボタン押下時に表示される4段階の常連フィードバックモーダルシステム。
利用シーン選択→雰囲気評価→印象タグ→完了の流れで、常連客としての店舗利用体験を包括的に収集する。

### 常連フィードバックフロー

#### Step 1: 利用シーン選択
- **UI**: CustomCheckboxGroup（VisitPurpose）
- **選択肢**: 来店目的の複数選択（デート、接待、一人飲み等）
- **データ**: `visit_purpose_ids: number[]`形式
- **API**: `POST /api/shops/{id}/regular-usage-scenes/`
- **保存タイミング**: 「登録して次へ」ボタン押下時

#### Step 2-4: 既存フィードバックフロー再利用
- **Step 2**: 雰囲気評価（AtmosphereSlider）
- **Step 3**: 印象タグ（ShopImpressionTag）
- **Step 4**: 完了画面

### システム構成追加

#### 新規ファイル
```
frontend/src/
├── components/Shop/RegularFeedbackModal/        # 常連フィードバックモーダル
│   ├── index.tsx                                # 4ステップモーダル実装
│   └── style.module.scss                       # スタイル定義
├── actions/shop/regularUsageScene.ts            # 利用シーン管理API
backend/shops/
├── models.py                                    # RegularUsageSceneモデル追加
├── serializers.py                              # RegularUsageScene関連シリアライザー
├── views.py                                     # RegularUsageSceneViewSet追加
├── urls.py                                      # 利用シーンエンドポイント追加
└── admin.py                                     # 管理画面設定追加
```

#### データモデル
```python
# RegularUsageScene Model
class RegularUsageScene(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    visit_purposes = models.ManyToManyField(VisitPurpose)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### 呼び出しパターン
```tsx
// 店舗詳細ページでの統合
const handleRelationToggle = async (relationTypeId: number) => {
  if (relationTypeId === DEFAULT_RELATIONS.favorite.id) {
    if (!isFavorite) {
      // 常連フィードバックモーダルを表示
      setRegularFeedbackModalOpen(true);
      return;
    }
  }
  // 通常のリレーション処理...
};

<RegularFeedbackModal
  isOpen={regularFeedbackModalOpen}
  onClose={() => setRegularFeedbackModalOpen(false)}
  shop={shop}
  onDataUpdate={handleRegularFeedbackComplete}
/>
```

### 技術的特徴

#### コード再利用戦略
- **Step 2-4**: 既存ShopFeedbackModalのロジックを完全再利用
- **API統一**: 同一のatmosphere_feedback、impression_tagエンドポイント使用
- **UI統一**: AtmosphereSlider、ShopImpressionTag等を再利用

#### データフロー統合
1. **利用シーン登録**: Step 1完了時にRegularUsageScene作成
2. **行きつけ設定**: 全Step完了時に「行きつけ」リレーション自動設定
3. **データ統合**: 利用シーン + 雰囲気評価 + 印象タグの3層データ

### 管理画面対応

Django管理画面でRegularUsageSceneの確認・編集が可能：
- ユーザー別・店舗別の利用シーン一覧
- 利用目的のManyToManyField管理
- 作成・更新日時の追跡

---

**最終更新**: 2025-10-04
**バージョン**: v1.1（常連フィードバック機能追加）
**担当**: Claude Code Implementation