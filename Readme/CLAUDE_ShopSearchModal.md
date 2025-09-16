# こだわり検索機能 (Advanced Shop Search) - 仕様書

## 概要
店舗の詳細な条件検索を可能にするモーダル機能。6つのカテゴリータブで多角的な検索条件を設定し、リアルタイムで該当店舗数を表示する。

## 主要機能

### 1. モーダル表示・操作
- **開閉制御**: `isOpen`, `onClose` propsで制御
- **条件保持**: モーダルを閉じても検索条件を保持
- **URLパラメータ連携**: 条件をURLに反映し、ページ遷移で状態保持

### 2. リアルタイム店舗数表示
- **カウンターアップアニメーション**: 0.4秒間で数値をアニメーション表示
- **API連携**: 条件変更時に`/shops/search/count/`APIを呼び出し
- **レスポンシブ表示**: 該当店舗数とフィルター適用数を表示

### 3. 6つの検索カテゴリータブ

#### タブ1: みんなの常連 (Regulars)
- **目的**: 人気店舗の絞り込み
- **条件**: 
  - 常連レベル選択 (ラジオボタン)
  - 最低人数設定 (10人以上, 20人以上, etc.)

#### タブ2: 雰囲気 (Atmosphere)  
- **目的**: 店舗の雰囲気による絞り込み
- **条件**:
  - 雰囲気評価スライダー (1-5段階)
  - 評価項目別フィルター

#### タブ3: エリア (Area)
- **目的**: 地理的な絞り込み
- **条件**:
  - 都道府県選択
  - 市区町村選択  
  - 距離範囲指定

#### タブ4: 基本条件 (Basic Conditions)
- **目的**: 基本的な店舗条件の絞り込み
- **条件**:
  - 距離 (1km以内, 3km以内, 5km以内, 10km以内)
  - 最小席数 (10席以上, 20席以上, 30席以上, 50席以上)
  - 営業時間
  - 予算範囲 (プリセットボタン: 2000円以下, 2000〜4000円, 4000〜6000円, 6000〜8000円, 8000円以上)

#### タブ5: 特徴 (Features)
- **目的**: 店舗の特徴・サービスによる絞り込み  
- **条件**:
  - 店舗タイプ (チェックボックス複数選択)
  - レイアウト (チェックボックス複数選択)
  - オプション・サービス (チェックボックス複数選択)

#### タブ6: お酒 (Drinks)
- **目的**: 取り扱い酒類による絞り込み
- **条件**:
  - 興味カテゴリー (デフォルト: 'SNS・プラットフォーム')
  - ドリンク検索 (オートコンプリート機能)
  - 年代選択 (CustomRadioGroup)

### 4. 条件タグ表示機能
- **表示位置**: モーダル下部
- **機能**: 
  - 選択中の条件をタグ形式で一覧表示
  - 個別削除ボタン (×) で条件を個別に解除
  - タグクリックで該当タブに移動

### 5. 検索実行・リセット
- **検索ボタン**: 条件を適用して店舗一覧ページ(/shops)に遷移
- **リセットボタン**: 全条件をクリア
- **条件変更時**: 自動で店舗数を更新

## 技術仕様

### API連携
- **認証**: `fetchWithAuth`を使用 (JWT認証必須)
- **エンドポイント**: 
  - 検索: `POST /shops/search/`
  - 件数取得: `GET /shops/search/count/`
- **パラメータ形式**: URLSearchParams + JSON文字列

### 状態管理
```typescript
interface SearchFilters {
  regulars?: RegularsFilter;
  atmosphere?: AtmosphereFilter; 
  area?: AreaFilter;
  basic?: BasicFilter;
  features?: FeaturesFilter;
  drinks?: DrinksFilter;
}
```

### URLパラメータ
- 検索条件をURLエンコードして保存
- ページリロード時に条件復元
- `/shops?search=encodedFilters` 形式

### アニメーション
```typescript
const animateCountUp = (start: number, end: number) => {
  const duration = 400; // 0.4秒
  const steps = Math.min(Math.abs(end - start), 50);
  // 段階的に数値を更新
};
```

## 修正済み課題 ✅

### 1. pcSortButtonエラーの修正 (2025/09/15修正)
- **問題**: 検索条件設定後にpcSortButtonを押すとエラーが発生
- **修正**: `alcohol_categories`と`regular_alcohol_preferences`のパラメータ名不一致を解消
- **対応内容**:
  - fetchShopCount関数で正しいパラメータ名を使用
  - SearchFilters型定義に`regular_alcohol_preferences`を追加
  - プロフィールデータのマッピング修正
  - URLパラメータ解析の改良

### 2. プロフィール反映時の件数表示問題 (2025/09/15修正)
- **問題**: プロフィール反映ON/OFF時に正しい件数が表示されない
- **修正**: プロフィール切り替え時の店舗数更新処理を追加
- **対応内容**:
  - プロフィール反映ON/OFF時にfetchShopCountを呼び出し
  - プロフィールフィルターの適用ロジックを改善
  - アルコールカテゴリのマッピング追加

### 3. 検索条件タグ消失問題 (2025/09/15修正)
- **問題**: pcSortButtonから再度ShopSearchModalを開く際に条件タグが消える
- **修正**: UI状態の初期化とprofileOptions依存関係を解消
- **対応内容**:
  - selectedDrinks, selectedTagsの同期処理追加
  - profileOptions未ロード時のタグ生成にフォールバック処理
  - generateConditionTags関数の堅牢化（ID表示でのフォールバック）

### 4. 型安全性の向上 (2025/09/15修正)
- **問題**: URLパラメータ解析でのTypeScript型エラー
- **修正**: 型アサーション使用とイテレータ互換性対応
- **対応内容**:
  - SearchFiltersのインデックスアクセスに型アサーション
  - URLSearchParamsの.forEach()使用でイテレータ問題解決

## 現在の課題 (未解決)

### 1. ドリンク検索の制限
- **問題**: 検索候補が「ラフロイグ」のみ表示、他ブランドが出ない
- **影響**: ウイスキー以外の検索ができない
- **原因**: オートコンプリートAPIの検索ロジック不備

### 2. 基本条件の無効化
- **問題**: 距離・席数条件がAPI呼び出しに含まれない
- **影響**: 基本条件タブでの絞り込みが無効
- **原因**: APIパラメータ構築時の条件漏れ

## 期待される動作

### 正常なワークフロー
1. モーダルを開く
2. 各タブで条件を設定
3. リアルタイムで店舗数が更新される
4. 条件タグが表示される
5. 検索ボタンで/shopsページに遷移
6. URLパラメータで条件が保持される
7. 検索結果が正しく表示される
8. ソートボタンから条件付きでモーダル再表示

### UI/UX要件
- **レスポンシブ**: モバイル/デスクトップ対応
- **アクセシビリティ**: キーボード操作、スクリーンリーダー対応
- **パフォーマンス**: API呼び出し最適化、デバウンス処理
- **直感的操作**: 明確なフィードバック、分かりやすいUI

## ファイル構成
```
ShopSearchModal/
├── index.tsx          # メインコンポーネント (1000+ lines)
├── style.module.scss  # スタイル定義
└── README.md         # 本ドキュメント
```

## 関連コンポーネント
- `ShopListHeader` - ソートボタン統合
- `ShopList` - 検索結果表示
- `/shops/page.tsx` - 検索結果ページ

## 修正優先度 (更新: 2025/09/15)
### 完了済み ✅
- **高優先度**: pcSortButtonエラー、プロフィール反映時の件数表示
- **高優先度**: 検索条件タグ消失問題
- **中優先度**: 型安全性の向上

### 未対応 🔄
1. **中**: 基本条件の動作修正 (距離・席数条件)
2. **低**: ドリンク検索機能の拡張
3. **低**: UI/UX改善

## 技術的改善点 (2025/09/15追加)

### 1. 状態同期の強化
- `initialFilters` → UI状態の双方向同期を実装
- `profileOptions`の非同期ロードに対応したタグ生成

### 2. エラーハンドリングの改善
- データ未ロード時のフォールバック処理
- 型安全性を保ったパラメータ処理

### 3. パフォーマンス最適化
- プロフィールデータ読み込み後の適切な再レンダリング
- デバウンス処理による無駄なAPI呼び出しの削減

---

## 最新の大型修正 (2025/09/15 夜間作業)

### 🎯 実装完了項目

#### 1. 雰囲気検索システムの完全刷新 ✅
**問題**: 既存の5段階スライダーはユーザーの意図と乖離し、操作が直感的でない
**解決**: Netflix式UXを適用した3択ラジオボタンシステムに変更

- **旧システム**: `atmosphere_filters` (1-5段階スライダー)
- **新システム**: `atmosphere_simple` (3択ラジオボタン)
  - `'quiet'` - 静かな/落ち着いた（一人の時間を重視）
  - `'neutral'` - どちらでもOK（フレキシブル）
  - `'social'` - 賑やか/社交的（コミュニティを重視）

**技術変更点**:
```typescript
// 新しい型定義
export type AtmospherePreference = 'quiet' | 'neutral' | 'social';
export interface AtmosphereChoice {
  key: AtmospherePreference;
  label: string;
  description: string;
}

// AtmosphereSliderコンポーネントの完全リニューアル
interface AtmosphereSliderProps {
  indicator: AtmosphereIndicator;
  value: AtmospherePreference | null;
  onChange: (value: AtmospherePreference | null) => void;
  disabled?: boolean;
}
```

#### 2. マイエリア検索機能の実装 ✅
**要求**: プロフィール設定のマイエリア内のみで検索する機能
**実装**: プロフィール反映スイッチの下に「マイエリアで検索する」スイッチを追加

**機能詳細**:
- ユーザーのマイエリア設定時のみ表示
- 動的ラベル表示: 「○○エリア内のお店のみ表示」
- `use_my_area_only: boolean`フラグでAPI連携
- プロフィール反映との適切な相互作用

**実装コード**:
```typescript
// マイエリア検索の切り替え処理
useEffect(() => {
  if (useMyAreaOnly && userProfile?.my_area) {
    let areaId: number;
    if (typeof userProfile.my_area === 'object' && userProfile.my_area?.id) {
      areaId = userProfile.my_area.id;
    } else if (typeof userProfile.my_area === 'number') {
      areaId = userProfile.my_area;
    }
    setFilters(prev => ({
      ...prev,
      use_my_area_only: true,
      area_ids: [areaId]
    }));
  }
}, [useMyAreaOnly, userProfile?.my_area]);
```

#### 3. レスポンシブ最適化（モバイルUI改善） ✅
**問題**: モバイルでのUIスペースが限られており、2つのスイッチが窮屈
**解決**: モバイル専用スタイルでコンパクト化

**改善内容**:
- **トグルスイッチサイズ**: `44px×20px` → `36px×18px` (モバイル時)
- **フォントサイズ最適化**:
  - メインテキスト: `0.9rem` → `0.85rem`
  - 説明テキスト: `0.7rem` → `0.65rem`
- **マージン・パディング調整**: より密なレイアウト
- **profileToggleクラス**: 適切な間隔設定（1.5rem → 1rem）

```scss
@media (max-width: 768px) {
  .profileSection {
    padding: 0.8rem;
    margin-bottom: 1.5rem;

    .profileToggle {
      margin-bottom: 1rem;
      &:last-child { margin-bottom: 0; }
    }
  }

  .toggleSlider {
    width: 36px; height: 18px;
    &::before { width: 14px; height: 14px; }
  }
}
```

#### 4. SearchFilters型定義の拡張 ✅
**追加フィールド**:
```typescript
interface SearchFilters {
  // 既存フィールド...

  // 新規追加
  use_my_area_only?: boolean;  // マイエリア検索フラグ
  atmosphere_simple?: { [key: string]: AtmospherePreference };  // 3択雰囲気
}
```

#### 5. API連携の完全対応 ✅
**対応内容**:
- `atmosphere_simple`パラメータの送信対応
- `use_my_area_only`フラグの送信対応
- 条件タグ生成の新システム対応
- 個別条件削除機能の更新

### 🔄 残存課題（継続対応が必要）

#### 1. 細かいUI調整
- 条件タグの表示文言の最適化
- 雰囲気選択肢のアイコン追加検討
- エラー状態時の適切なフィードバック

#### 2. バックエンドAPI対応
- `atmosphere_simple`パラメータの受信・処理実装
- `use_my_area_only`による適切な店舗絞り込み実装
- 既存の`atmosphere_filters`からの移行期間対応

#### 3. テスト・検証
- モバイル実機でのUI確認
- 各雰囲気選択肢の検索精度確認
- マイエリア検索の動作確認

### 📊 変更影響範囲

#### 修正ファイル
1. **`/frontend/src/types/search.ts`**
   - AtmospherePreference, AtmosphereChoice型追加
   - SearchFiltersインターフェース拡張

2. **`/frontend/src/components/UI/AtmosphereSlider/`**
   - index.tsx: 完全リニューアル（3択ラジオボタン）
   - style.module.scss: 新UIに対応したスタイル

3. **`/frontend/src/components/shop/ShopSearchModal/`**
   - index.tsx: 雰囲気処理ロジック刷新、マイエリア機能追加
   - style.module.scss: レスポンシブ最適化

### 🚀 UX改善の成果

#### Netflix式アプローチの適用
- **認知負荷の軽減**: 5段階 → 3択で選択が簡単
- **意図ベース設計**: ユーザーの求める体験に直結
- **即座の理解**: 「静か」「どちらでも」「賑やか」で一目瞭然

#### モバイルファーストの実現
- **限られたスペースの最大活用**
- **タッチ操作に最適化されたUI**
- **可読性を保った情報密度の向上**

---

## 次回対応予定項目

### 🎯 明日の作業計画
1. **細かいUI調整**: 条件タグの日本語表示改善
2. **バックエンド連携確認**: 新パラメータの動作テスト
3. **実機確認**: iOS/Androidでの表示・操作確認
4. **パフォーマンス計測**: API応答時間とレンダリング最適化

### 💡 将来の機能拡張案
- 雰囲気選択肢にアイコン追加（視覚的直感性向上）
- マイエリア複数設定対応
- 検索条件のプリセット保存機能
- AI推奨機能との連携