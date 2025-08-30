# ウェルカム機能 (Welcome System)

## 概要

店舗に対して「行きつけ」として登録した常連客が、新しいお客様を歓迎するためのウェルカム機能です。常連客が Goodアイコンボタンをクリックすることで、その店舗を初めて訪れるお客様を温かく迎え入れるコミュニティ的な機能を提供します。

## 機能詳細

### 1. ウェルカムメッセージ表示

**表示条件:**
- ウェルカム数が1以上の場合
- 全てのユーザー（ログイン・未ログイン問わず）に表示

**表示内容:**
- `1人の常連さんが初来店のお客様に「ウェルカム！」と言っています。`
- `{X}人の常連さんが初来店のお客様に「ウェルカム！」と言っています。`
- 人数部分（{X}人）は cyan カラーでハイライト表示

### 2. ウェルカムボタン（Goodアイコン）

**表示対象:**
- 「行きつけボタン」（favorite, relation_type_id=1）を押済みの常連客のみ

**ボタン仕様:**
- アイコン: `ThumbsUp` (lucide-react)
- トグル機能: クリックで on/off 切り替え
- 状態表示:
  - ウェルカム済み: `fill="rgba(0, 255, 255, 0.9)"` (塗りつぶしあり)
  - 未ウェルカム: `fill="none"` (塗りつぶしなし)
- ツールチップ: 「初来店のお客さんを歓迎しましょう！」

### 3. 初回ウェルカム時の特別メッセージ

**表示条件:**
- ウェルカム数が0の場合
- かつ、ユーザーが常連客（行きつけ登録済み）の場合
- かつ、まだウェルカムしていない場合

**表示内容:**
- 「ウェルカムボタンを押して新しいお客さんを歓迎しましょう！」

### 4. リアルタイム更新

**更新トリガー:**
- ウェルカムボタンのクリック時（即座に状態反映）
- 行きつけボタンのクリック時（favorite関係性の変更時）
- 全てリロード不要で即座に反映

## UI/UX仕様

### デザインコンセプト
- Netflix品質のモダンなUI
- Glassmorphism エフェクト（背景ぼかし、半透明）
- Cyber punk風のサイアンアクセント
- マイクロインタラクション（hover/active エフェクト）

### 配置場所
- 店舗詳細ページ
- 常連客分析セクション（RegularsSnapshot）の上部に配置

### レスポンシブデザイン
- デスクトップ: 36x36px ボタン
- モバイル: 32x32px ボタン
- タブレット・モバイル対応のレスポンシブ設計

## 技術仕様

### バックエンド (Django)

**モデル:**
```python
class WelcomeAction(models.Model):
    user = models.ForeignKey('accounts.UserAccount', on_delete=models.CASCADE, related_name='welcomed_actions')
    shop = models.ForeignKey('shops.Shop', on_delete=models.CASCADE, related_name='welcome_actions')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('user', 'shop')
```

**API エンドポイント:**
- `GET /shops/{shop_id}/welcome/` - ウェルカムデータ取得
- `POST /shops/{shop_id}/welcome/` - ウェルカム状態トグル

**レスポンス形式:**
```json
{
  "welcome_count": 5,
  "user_welcomed": true,
  "is_regular": true,
  "show_welcome_button": true,
  "message": "ウェルカムしました！"
}
```

### フロントエンド (Next.js + React)

**コンポーネント構成:**
- `WelcomeSection` - メインコンポーネント
- `frontend/src/actions/shop/welcome.ts` - API処理
- `style.module.scss` - Netflix風スタイリング

**主要機能:**
- 認証状態管理（useAuthStore）
- リアルタイムデータ更新
- 外部トリガーによる自動リフレッシュ
- エラーハンドリング

### 関連ファイル

**バックエンド:**
- `/backend/shops/models.py` - WelcomeAction モデル
- `/backend/shops/views.py` - ShopWelcomeAPIView
- `/backend/shops/admin.py` - 管理画面設定

**フロントエンド:**
- `/frontend/src/components/Shop/WelcomeSection/`
  - `index.tsx` - メインコンポーネント
  - `style.module.scss` - スタイル定義
- `/frontend/src/actions/shop/welcome.ts` - API処理
- `/frontend/src/app/shops/[id]/page.tsx` - 店舗ページ統合

## 運用・管理

### Django管理画面
- WelcomeActionAdmin でウェルカム履歴を管理
- ユーザー、店舗、作成日時の一覧表示
- フィルタリング・検索機能

### データ整合性
- ユーザー・店舗ペアでのuniqueキー制約
- 論理削除なし（物理削除でトグル実装）
- リアルタイムカウント更新

## 設計思想

1. **コミュニティ形成**: 常連客と新規客の橋渡し
2. **心理的安全性**: 初来店への不安軽減
3. **店舗価値向上**: 温かいコミュニティの可視化
4. **UX向上**: 直感的なトグル操作
5. **品質重視**: Netflix品質のモダンUI/UX