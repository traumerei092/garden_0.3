# 常連客分析機能 (Regulars Analysis)

## 概要
店舗に対して「行きつけ」として登録したユーザーのプロフィールデータを分析し、その店舗の常連客層の傾向を可視化する機能です。Netflix品質のモダンなUIで、店舗の顧客層を理解するためのインサイトを提供します。

## 機能詳細

### 1. 常連客スナップショット (RegularsSnapshot)
店舗詳細ページに表示される、常連客の傾向を要約した概要コンポーネント

**表示項目:**
- **中心層**: 年齢層と性別の最頻値（例: 30代の男性）
- **主な興味**: 常連客の共通の興味・趣味
- **好みの雰囲気**: 雰囲気設定の分析結果（スクロール可能）

**最小サンプル数:** 3人以上の「行きつけ」登録が必要

### 2. 詳細分析モーダル (RegularsAnalysisModal)
「詳しく見る」ボタンから開く、詳細な統計情報を表示するモーダル

**分析軸:**
- 年齢層
- 性別  
- 血液型
- MBTI
- 職業
- 業種
- 運動頻度
- 趣味
- 好きなお酒
- 利用目的

## 技術実装

### バックエンド API

#### 1. スナップショットAPI
```
GET /api/shops/{shop_id}/regulars/snapshot/
```

**レスポンス例:**
```json
{
  "core_group": {
    "age_group": "30代",
    "gender": "男性"
  },
  "atmosphere_summary": "アットホームな雰囲気を好む傾向があります。",
  "top_interests": ["音楽", "料理", "映画鑑賞"],
  "total_regulars": 25
}
```

#### 2. 詳細分析API
```
GET /api/shops/{shop_id}/regulars/analysis/?axis=age_group
```

**レスポンス例:**
```json
{
  "axis": "age_group",
  "distribution": [
    {
      "label": "30代",
      "count": 12,
      "percentage": 48.0
    },
    {
      "label": "40代", 
      "count": 8,
      "percentage": 32.0
    }
  ],
  "total_regulars": 25
}
```

### atmosphere_summary 分析ロジック

#### 分析対象
店舗に「行きつけ」登録したユーザーの`UserAtmospherePreference`データ

#### 処理フロー
1. **データ収集**: 常連客のスコア（-2〜+2）を指標別に取得
2. **平均値計算**: 各雰囲気指標の平均スコアを算出
3. **特徴抽出**: 
   - 平均スコア > 0.5: ポジティブな傾向
   - 平均スコア < -0.5: ネガティブな傾向
   - 絶対値が最も大きい指標を「最も特徴的」として特定
4. **自然言語生成**: 
   - 最高スコア指標に基づく基本文生成
   - 複数の特徴がある場合は組み合わせた表現

#### 実装コード (backend/shops/views.py:1439-1487)
```python
def get_atmosphere_summary(self, regulars):
    from accounts.models import UserAtmospherePreference
    
    # 各指標の平均スコアを計算
    indicator_scores = {}
    for relation in regulars:
        user_prefs = UserAtmospherePreference.objects.filter(user_profile=relation.user)
        for pref in user_prefs:
            indicator_id = pref.indicator.id
            if indicator_id not in indicator_scores:
                indicator_scores[indicator_id] = []
            indicator_scores[indicator_id].append(pref.score)
    
    # 平均スコアを算出し、特徴的な指標を特定
    avg_scores = {}
    for indicator_id, scores in indicator_scores.items():
        avg_scores[indicator_id] = sum(scores) / len(scores)
    
    # 最も特徴的な指標を選択（絶対値が最大）
    if avg_scores:
        max_indicator = max(avg_scores.items(), key=lambda x: abs(x[1]))
        # 自然言語での表現に変換
        return self.generate_atmosphere_description(max_indicator)
    
    return "様々な雰囲気を楽しんでいるようです。"
```

#### 自然言語表現例
- **アットホーム指標が高い**: "アットホームな雰囲気を好む傾向があります。"
- **静か指標が高い**: "落ち着いた雰囲気を求める傾向があります。"  
- **賑やか指標が高い**: "活気のある雰囲気を楽しむ傾向があります。"

### フロントエンド実装

#### コンポーネント構成
```
RegularsSnapshot/
├── index.tsx          # メインコンポーネント
└── style.module.scss  # スタイリング

RegularsAnalysisModal/
├── index.tsx          # 詳細分析モーダル
└── style.module.scss  # モーダルスタイリング
```

#### API連携
- `fetchWithAuth`を使用した認証付きAPI呼び出し
- エラーハンドリングとローディング状態管理
- リアルタイムデータ更新対応

### UI/UX設計

#### Netflix品質のデザイン
- **ガラスモーフィズム**: `backdrop-filter: blur()`
- **グラデーション**: シアン系のアクセントカラー
- **カスタムスクロールバー**: 細いスクロールバー（3-4px）
- **ホバーエフェクト**: `transform: scale(1.05)`

#### レスポンシブ対応
- モバイル表示での2列→1列自動調整
- タッチ操作対応
- 小画面でのフォントサイズ調整

## データ要件

### 必要な関連データ
1. **UserShopRelation**: `relation_type = favorite`（行きつけ関係）
2. **UserAccount**: ユーザーの基本プロフィール
3. **UserAtmospherePreference**: 雰囲気の好み設定
4. **各種マスターデータ**: 興味、趣味、職業等

### サンプルデータ
- 開発・テスト用に50人のサンプルユーザーを作成
- 各店舗に2-8人の「行きつけ」関係を設定
- プロフィール情報を完全に網羅

## パフォーマンス考慮

### データベース最適化
- `select_related('user')`でN+1問題回避
- 事前に`UserShopRelation`でフィルタリング
- Counter使用によるメモリ効率的な集計

### フロントエンド最適化  
- `cache: 'no-store'`でリアルタイム性確保
- ローディング状態とエラー処理
- スクロール領域の最大高制限（40px）

## セキュリティ

### アクセス制御
- `permission_classes = [AllowAny]`（店舗情報は公開）
- 個人特定情報は集計結果のみ表示
- ユーザーの詳細情報は非公開

### プライバシー保護
- 統計的な傾向のみ表示
- 最小サンプル数（3人）による匿名性確保
- 個別ユーザーの特定不可能な表現

## 今後の拡張予定

### 機能拡張
- 時系列分析（月別・年別トレンド）
- 他店舗との比較機能
- レコメンデーション機能との連携

### 分析の高度化
- 機械学習による予測分析
- クラスタリングによる顧客セグメント
- より自然な言語生成（LLM活用）

## 関連ファイル

### フロントエンド
- `frontend/src/components/Shop/RegularsSnapshot/`
- `frontend/src/components/Shop/RegularsAnalysisModal/`
- `frontend/src/actions/shop/regulars.ts`

### バックエンド  
- `backend/shops/views.py` (RegularsAnalysisAPIView関連)
- `backend/shops/models.py` (UserShopRelation)
- `backend/shops/serializers.py` (Shop serializer with area)
- `backend/shops/urls.py` (API routing)

---

*このドキュメントは2025年8月29日時点での実装内容を記載しています。*