# 常連客分析システム（RegularsCommunitySection）

## 機能の本質的目的

この機能は、ユーザーがお店を選ぶ際の心理的ハードルを下げ、お店への興味を強めることを目的としています：

### 1. 心理的ハードル軽減
**常連がどれくらい歓迎しているのか**を可視化することで、「自分が行ってもいい店なのか」という不安を軽減し、来店のハードルを下げます。

### 2. 店舗特徴の把握
**どういう客が行っているのか**を明確にすることで、お店の雰囲気や客層を事前に把握でき、期待値の調整ができます。

### 3. 親近感の醸成
**自分と共通している人がどれくらいいるか**を示すことで親近感を持たせ、「自分にとって居心地の良い場所かもしれない」という期待を醸成します。

## システム構成

### バックエンド実装

#### 1. 統計計算サービス（services.py）
```python
class RegularCommunityStatsService:
    """常連コミュニティの統計計算サービス"""

    # 雰囲気傾向計算
    # UserAtmospherePreferenceの4指標平均値から傾向を決定
    # -2≦x<-0.5: "一人の時間を重視"
    # -0.5≦x≦0.5: "フレキシブル"
    # 0.5<x≦2: "コミュニティを重視"

    # 利用シーン計算
    # RegularUsageSceneモデルから最頻利用シーンを取得

    # 共通点計算
    # ユーザーとの年代・性別、雰囲気好み、利用シーンの共通点を％で算出
```

#### 2. API エンドポイント
- **GET** `/api/shops/{shop_id}/regular_community_stats/`
- レスポンス形式：
```json
{
  "summary": {
    "age_gender_summary": "40代・男性が中心",
    "atmosphere_tendency": {
      "tag": "一人の時間を楽しみたい方が多い",
      "tendency": "solitude",
      "percentage": 66.7
    },
    "popular_visit_purpose": {
      "purpose_name": "仕事終わりの一杯"
    }
  },
  "commonalities": {
    "age_gender": {"percentage": 25, "text": "..."},
    "atmosphere": {"percentage": 30, "text": "..."},
    "visit_purpose": {"percentage": 28, "text": "..."}
  }
}
```

### フロントエンド実装

#### 1. コンポーネント構成
**RegularsCommunitySection** は以下の2つのセクションで構成：

##### A. 常連サマリー（割合表示なし）
```jsx
<div className={styles.regularsSummary}>
  <div className={styles.summaryTitle}>常連客の特徴</div>
  <div className={styles.summaryTags}>
    <div className={styles.ageGenderTag}>40代・男性が中心</div>
    <div className={styles.atmosphereTag}>一人の時間を楽しみたい方が多い</div>
    <div className={styles.visitPurposeTag}>仕事終わりの一杯で利用する方が多いです</div>
  </div>
</div>
```

##### B. 共通点（割合表示あり）
```jsx
<div className={styles.personalConnection}>
  <div className={styles.connectionTitle}>あなたとの共通点</div>
  <div className={styles.commonalityTags}>
    <div className={styles.commonalityTag}>同じ年代・性別の方は (25%)</div>
    <div className={styles.commonalityTag}>同じ雰囲気好みの方は (30%)</div>
    <div className={styles.commonalityTag}>同じ利用シーンの方は (28%)</div>
  </div>
</div>
```

#### 2. デザイン仕様
- **レイアウト**: 横一列タグ表示（flex-wrap対応）
- **カラー**: Development Guidelinesのカラールール準拠
  - 年代・性別: `rgb(0,255,255)` (第一強調色)
  - 利用シーン: `rgb(0,198,255)` (第二強調色-青)
  - 共通点: `rgba(235,14,242)` (第二強調色-紫)
- **レスポンシブ**: モバイル対応済み

## 技術的特徴

### 1. パフォーマンス最適化
- 統計データのキャッシュ機能（ShopRegularStatistics model）
- 効率的なクエリ最適化
- フォールバック機能（新API→従来API）

### 2. ユーザビリティ
- データ不足時の適切な表示
- ログイン状態による表示切り替え
- リアルタイム更新対応

### 3. 拡張性
- 新しい統計指標の追加が容易
- 計算ロジックの変更に対応
- 将来のスケール要件を考慮した設計

## データフロー

1. **データ収集**: UserAtmospherePreference, RegularUsageScene
2. **統計計算**: RegularCommunityStatsService
3. **キャッシュ**: ShopRegularStatistics（パフォーマンス向上）
4. **API提供**: regular_community_stats エンドポイント
5. **UI表示**: RegularsCommunitySection コンポーネント

## プライバシー配慮

### 人数表示の禁止
プライバシー保護の観点から、常連客分析において**一切の人数表示を禁止**しています：

- **円グラフ**: 割合（パーセンテージ）のみ表示
- **詳細データ**: 割合（パーセンテージ）のみ表示
- **API レスポンス**: `count`フィールドを削除し、`percentage`のみ提供
- **ユーザー固有情報**: 「あなたと同じ営業の人は25%います」形式

### 表示制限
- **詳細データ**: 上位3位まで + その他でまとめて表示
- **円グラフ**: 上位3セグメント + その他で視覚化
- **総数**: 表示しない（プライバシー配慮）

これらの措置により、個人を特定できる可能性を最小化し、ユーザーのプライバシーを保護しています。

このシステムにより、ユーザーは店舗選択時により多くの有用な情報を得られ、安心して来店できる環境を提供しています。

---

# 常連詳細分析モーダル（RegularsAnalysisModal）

## 概要
RegularsCommunitySectionの「詳しく見る」ボタンから起動される詳細分析モーダル。円グラフと詳細データで常連客の特徴を視覚的に分析します。

## 開発方針

### 1. APIエンドポイント統一
**重要**: RegularsCommunitySectionと同じAPIエンドポイントを使用
- **使用API**: `/api/shops/{shop_id}/regular_community_stats/`
- **理由**: データの一貫性確保とメンテナンス性向上
- **非推奨**: `/api/shops/{shop_id}/regulars/analysis/` (旧API)

### 2. データ表示仕様

#### タブ構成
```typescript
// 実装済みタブ
- 年齢構成: RegularCommunityStatsのサマリー情報から年代分布を推定
- 好みの雰囲気: atmosphere_tendencyの実データを使用
- 利用シーン: popular_visit_purposeの実データを使用

// 仮データタブ（APIデータ不足のため）
- 職業分布: 固定の仮データ
- 趣味・関心: 固定の仮データ
```

#### データ処理ロジック
```typescript
// 雰囲気データの処理例
const processAtmosphereData = (stats: RegularCommunityStatsResponse) => {
  const { tendency, percentage } = stats.summary.atmosphere_tendency;

  // 傾向に基づいて分布を動的生成
  const distributions = {
    'solitude': [
      { category: '一人の時間を重視', percentage: percentage },
      { category: 'フレキシブル', percentage: (100 - percentage) * 0.6 },
      // ...
    ]
    // ...
  };
};
```

### 3. プライバシー保護仕様

#### 表示制限
- **人数表示**: 完全禁止
- **割合表示**: 小数点以下1桁まで（`toFixed(1)`）
- **詳細データ**: 上位3位まで + その他
- **円グラフ**: 上位3セグメント + その他

#### 共通点表示
```typescript
// ユーザー固有情報の表示
user_specific_info: {
  percentage: number;  // 共通点の割合
  text: string;       // "あなたと同じ雰囲気好みの方は (X%)"
}
```

## 技術実装

### コンポーネント構造
```
RegularsAnalysisModal/
├── index.tsx              // メインコンポーネント
├── style.module.scss      // スタイル定義
└── types/                 // 型定義
```

### 重要な関数
- `loadCommunityStats()`: 初回データ取得
- `processAtmosphereData()`: 雰囲気データ処理
- `processUsageScenesData()`: 利用シーン処理
- `getChartData()`: 円グラフ用データ変換

### エラーハンドリング
```typescript
// 500エラー対策: 正しいAPIエンドポイント使用
try {
  const statsData = await fetchRegularCommunityStats(shopId);
  setCommunityStats(statsData);
} catch (err) {
  setError('データの取得に失敗しました');
}
```

## 今後の拡張指針

### 1. 新しいタブ追加時
1. `regular_community_stats` APIに新データ追加
2. 対応する`process[TabName]Data()`関数を実装
3. タブ配列に新エントリ追加

### 2. データ精度向上
- 職業分布・趣味関心の実データAPI実装時
- RegularCommunityStatsServiceに新統計指標追加

### 3. パフォーマンス最適化
- データキャッシュ機能の活用
- 遅延ローディングの実装
- メモ化による再計算防止

## 注意事項

### 開発時の留意点
1. **API変更時**: RegularsCommunitySectionとの同期が必要
2. **プライバシー**: 新機能でも人数表示は厳禁
3. **データ一貫性**: サマリーと詳細の数値の整合性確保
4. **エラー処理**: フォールバック機能の充実

### デバッグ時
- ネットワークタブで正しいAPIが呼ばれているか確認
- コンソールログで`RegularsDetailedAnalysisAPIView`ではなく`RegularCommunityStatsAPIView`が呼ばれることを確認
- 円グラフの割合合計が100%になることを確認
