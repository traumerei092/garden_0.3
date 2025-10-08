# StyledAutocomplete 店舗ソート機能

## 概要
サードプレイスアプリの店舗一覧ページにおいて、ユーザーが店舗を様々な条件でソートできる機能。UI/UXの統一性とダークテーマ対応を重視したStyledAutocompleteコンポーネントを使用して実装。

## 機能の目的・背景

### ビジネス的価値
1. **ユーザーのニーズに応じた発見支援**
   - 「近場で探したい」→ 距離順ソート
   - 「人気の店舗を知りたい」→ ウェルカム数順・常連客数順ソート
   - 「一人時間を楽しみたい」→ 一人向け雰囲気順ソート

2. **サードプレイス概念の具現化**
   - 「ウェルカムが多い順」をデフォルトとし、既存客からの歓迎度を重視
   - コミュニティ形成を促進する「常連客が多い順」ソート
   - 雰囲気による「一人向け」「交流向け」の分類

3. **ユーザーエンゲージメント向上**
   - 多様なソート条件により、店舗探索の楽しさを提供
   - データドリブンな店舗選択をサポート

### 技術的背景
- **NextUIの制約解決**: NextUIのAutocompleteはダークテーマでも頑固に白い背景を持つため、カスタムラッパーが必要
- **レスポンシブ対応**: デスクトップとモバイルで異なる配置でも一貫した操作性を提供
- **パフォーマンス**: フロントエンドでのソート選択肢管理により、高速な応答を実現

## 機能仕様

### ソート条件一覧
| ソートキー | 表示名 | 説明 | ビジネス的意図 |
|---|---|---|---|
| `welcome_count` | ウェルカムが多い順 | 常連客からの歓迎が多い店舗順 | サードプレイスの核となる「受け入れられやすさ」を重視 |
| `distance` | 近い順 | 現在地からの距離順 | 物理的アクセシビリティの重視 |
| `favorite_count` | 常連客が多い順 | 行きつけにしている人が多い順 | コミュニティの成熟度を示す |
| `visited_count` | 行った人が多い順 | 訪問経験者が多い順 | 実際の人気度・認知度の指標 |
| `interested_count` | 気になるが多い順 | 興味を持つ人が多い順 | 潜在的人気度・注目度の指標 |
| `solitude_friendly` | 一人で過ごすのに向いてる順 | 一人の時間を重視する雰囲気の店舗順 | 個人的な「第三の場所」ニーズに対応 |
| `community_friendly` | みんなと交流できるのに向いてる順 | コミュニティ重視の雰囲気の店舗順 | 社交的な「第三の場所」ニーズに対応 |
| `tag_count` | 印象タグが多い順 | 印象タグ数が多い順 | 多様性・特徴の豊富さの指標 |
| `tag_reaction_count` | 印象タグの共感数が多い順 | タグへの共感が多い順 | コミュニティエンゲージメントの指標 |
| `review_count` | 口コミが多い順 | レビュー数が多い順 | ユーザー参加度の指標 |
| `drink_count` | 登録ドリンクが多い順 | 提供中ドリンク数が多い順 | 店舗の充実度・選択肢の豊富さ |

### デフォルト設定
- **デフォルトソート**: `welcome_count`（ウェルカムが多い順）
- **理由**: サードプレイスアプリとして「既存コミュニティからの受け入れやすさ」を最も重要な指標として位置づけ

## 技術仕様

### フロントエンド構成

#### 1. StyledAutocompleteコンポーネント
**ファイル**: `frontend/src/components/UI/StyledAutocomplete/index.tsx`

```typescript
interface StyledAutocompleteProps {
  options: AutocompleteOption[];
  defaultSelectedKey?: string;
  placeholder?: string;
  onSelectionChange?: (key: string | null) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  radius?: 'none' | 'sm' | 'md' | 'lg';
  'aria-label'?: string;
}
```

**特徴**:
- NextUIのAutocompleteをラップしてダークテーマ対応
- カスタムCSSクラス適用によるスタイリング統一
- TypeScript完全対応

#### 2. ソート管理ロジック
**ファイル**: `frontend/src/actions/shop/sort.ts`

```typescript
export const SORT_OPTIONS: SortOption[] = [
  { key: 'welcome_count', label: 'ウェルカムが多い順', description: '常連客からの歓迎が多い店舗順' },
  // ... 他のソートオプション
];

export const getSortOptions = (): SortOption[] => SORT_OPTIONS;
export const getDefaultSortKey = (): string => 'welcome_count';
```

**設計思想**:
- **一元管理**: ソートオプションを単一の定数配列で管理
- **拡張性**: 新しいソート条件の追加が容易
- **型安全性**: TypeScriptインターフェースによる型保証

#### 3. UI統合（ShopListHeader）
**ファイル**: `frontend/src/components/Shop/ShopListHeader/index.tsx`

**実装ポイント**:
- **レスポンシブ対応**: デスクトップとモバイルで異なる位置に配置
- **状態管理**: ソート変更時のコールバック処理
- **動的ラベル**: 選択中のソート条件を動的に表示

### バックエンド構成

#### 1. ShopSortAPIView
**ファイル**: `backend/shops/views.py`

```python
class ShopSortAPIView(APIView):
    """店舗ソート機能API"""
    permission_classes = [AllowAny]

    def get(self, request):
        sort_key = request.GET.get('sort', 'created_at')
        # ソート条件に応じたクエリセット構築
```

**主要ソートロジック**:

##### ウェルカム数順ソート
```python
queryset = queryset.annotate(
    welcome_count=Count('welcome_actions')
).order_by('-welcome_count', '-created_at')
```

##### 雰囲気ベースソート
```python
# 一人向け（雰囲気スコア平均が-2に近い）
queryset = queryset.filter(
    atmosphere_aggregate__isnull=False
).order_by('atmosphere_aggregate__overall_average', '-created_at')

# 交流向け（雰囲気スコア平均が+2に近い）
queryset = queryset.filter(
    atmosphere_aggregate__isnull=False
).order_by('-atmosphere_aggregate__overall_average', '-created_at')
```

##### 距離ソート（高度実装）
```python
# Haversine公式を使用した正確な距離計算
def haversine(lon1, lat1, lon2, lat2):
    # 地球の半径 (km)
    R = 6371
    # 緯度経度をラジアンに変換
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    # Haversine公式
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c
```

### APIエンドポイント

#### GET /api/shops/sort/
**クエリパラメータ**:
- `sort`: ソートキー（必須）
- `page`: ページ番号（オプション、デフォルト: 1）
- その他フィルター条件（オプション）

**レスポンス例**:
```json
{
  "results": [
    {
      "id": 1,
      "name": "カフェ例",
      "welcome_count": 15,
      // ... 店舗詳細
    }
  ],
  "count": 100,
  "page": 1,
  "page_size": 20
}
```

## UIデザイン・UX

### ダークテーマ対応
**課題**: NextUIのAutocompleteコンポーネントは、ダークテーマ設定でも内部的に白い背景を強制適用

**解決策**:
```scss
.autocomplete {
  .nextui-autocomplete-base {
    background: rgba(0, 0, 0, 0.8) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
  }

  .nextui-autocomplete-popover {
    background: rgba(0, 0, 0, 0.9) !important;
    backdrop-filter: blur(8px);
  }
}
```

### レスポンシブ配置
- **デスクトップ**: ヘッダー右側に配置、他の操作ボタンと並列
- **モバイル**: ヘッダー中央部に配置、タブ切り替えと同列

### アクセシビリティ
- **aria-label**: 「並び順を選択」でスクリーンリーダー対応
- **キーボード操作**: 矢印キー・Enterキーでの操作サポート
- **視覚的フィードバック**: ホバー・フォーカス状態の明確な表示

## パフォーマンス最適化

### フロントエンド
1. **静的データ管理**: ソートオプションは定数として定義、ランタイム生成なし
2. **メモ化**: ソートオプション配列の変換処理をメモ化
3. **非同期処理**: ソート変更時のAPI呼び出しはデバウンス処理

### バックエンド
1. **インデックス最適化**:
   - `welcome_actions.shop_id` にインデックス
   - `atmosphere_aggregate.shop_id` にインデックス
   - 地理座標（`latitude`, `longitude`）の複合インデックス

2. **クエリ最適化**:
   - `select_related()` / `prefetch_related()` による N+1 問題の回避
   - 距離計算時の事前フィルタリング（座標データがある店舗のみ）

3. **キャッシング戦略**:
   - 雰囲気集計データの事前計算（`ShopAtmosphereAggregate`モデル）
   - 人気度指標の定期的な再計算バッチ処理

## 開発ルール・ガイドライン

### 新しいソート条件追加時の手順

#### 1. フロントエンド
```typescript
// 1. frontend/src/actions/shop/sort.ts にオプション追加
export const SORT_OPTIONS: SortOption[] = [
  // 既存オプション...
  {
    key: 'new_sort_key',
    label: '新しいソート順',
    description: '新しいソート条件の説明'
  },
];
```

#### 2. バックエンド
```python
# 2. backend/shops/views.py のShopSortAPIView内にロジック追加
elif sort_key == 'new_sort_key':
    queryset = queryset.annotate(
        new_field=Count('related_model')
    ).order_by('-new_field', '-created_at')
```

#### 3. テストケース追加
```python
# 3. テストケースの追加
def test_new_sort_functionality(self):
    response = self.client.get('/api/shops/sort/?sort=new_sort_key')
    self.assertEqual(response.status_code, 200)
    # ソート結果の検証
```

### コーディング規約

#### TypeScript
- **Interface命名**: `SortOption`, `AutocompleteOption` 等、用途が明確な命名
- **Function命名**: `getSortOptions()`, `getDefaultSortKey()` 等、取得系は `get` プレフィックス
- **定数命名**: `SORT_OPTIONS` 等、UPPER_SNAKE_CASE

#### Python
- **View命名**: `ShopSortAPIView` 等、機能が明確な命名
- **クエリ最適化**: 必ず `select_related()` / `prefetch_related()` を使用
- **エラーハンドリング**: try-catch による適切な例外処理

### セキュリティ考慮事項

1. **SQLインジェクション対策**: Django ORMの使用による安全な動的クエリ生成
2. **XSS対策**: ソートキーの検証（ホワイトリスト方式）
3. **DoS攻撃対策**:
   - ページネーション必須（最大page_size制限）
   - 距離計算時の座標妥当性チェック
4. **認証**: ソート機能は `AllowAny` だが、個人情報は含まない公開データのみ

## トラブルシューティング

### よくある問題と解決策

#### 1. ダークテーマで白い背景が表示される
**原因**: NextUIのデフォルトスタイルが優先される
**解決**: CSSの `!important` 指定とラッパーコンポーネントの使用

#### 2. ソート結果が期待と異なる
**原因**:
- データベースのインデックス不足
- アノテーション（集計）ロジックの誤り
**解決**:
- `EXPLAIN ANALYZE` によるクエリ分析
- Django Debug Toolbarでの SQL 確認

#### 3. 距離ソートの精度問題
**原因**: 簡易計算式の使用
**解決**: Haversine公式の適用

#### 4. パフォーマンス劣化
**原因**: 大量データでの非効率なソート
**解決**:
- 事前計算フィールドの活用
- ページネーションの適切な実装
- キャッシュ戦略の見直し

## 今後の拡張予定

### Phase 2 機能候補

#### 1. マルチソート機能
- 複数条件での複合ソート（例：「距離順→ウェルカム数順」）
- ユーザーが優先順位を設定可能

#### 2. パーソナライズドソート
- ユーザーの行動履歴に基づく推奨順序
- 好み学習アルゴリズムの実装

#### 3. リアルタイムソート
- WebSocketを使用したリアルタイム更新
- 新着店舗・ウェルカム更新の即座反映

#### 4. 高度な地理的ソート
- 交通手段を考慮した所要時間ソート
- 経路最適化アルゴリズムの実装

### 技術的改善

#### 1. フロントエンド
- React Suspenseによる遅延読み込み最適化
- Service Workerによるオフライン対応
- PWA化による体験向上

#### 2. バックエンド
- Redis/Elasticsearchによる高速検索
- GraphQLによる効率的なデータ取得
- 機械学習による推奨アルゴリズム

#### 3. インフラ
- CDNによる静的リソース配信
- ロードバランサーによる可用性向上
- 監視・アラートシステムの構築

## 関連ドキュメント

- `CLAUDE_ShopSearch.md`: 店舗検索機能全般
- `CLAUDE_AtmosphereFeedback.md`: 雰囲気評価システム
- `CLAUDE_WelcomeSystem.md`: ウェルカム機能
- `CLAUDE_DevelopmentGuidelines.md`: 開発ガイドライン全般
- `CLAUDE_UIComponents.md`: UIコンポーネント設計方針