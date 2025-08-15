# プロフィールレコメンド機能仕様書

## 概要
BasicInfo（基本情報）画面とDetailedProfile（詳細プロフィール）画面にて、未入力項目を優先度順に表示し、ユーザーのプロフィール完成度向上を促進する機能です。

## 機能仕様

### 表示位置
- **BasicInfo**: プロフィール完成度セクションの直下に配置
- **DetailedProfile**: プロフィール完成度セクションの直下に配置（興味セクションの上）

### 表示条件
- **BasicInfo**: BasicInfo項目に未入力がある場合のみ表示
- **DetailedProfile**: DetailedProfile項目に未入力がある場合のみ表示
- 全項目が入力済みの場合は非表示

### プロフィール完成度の統一
- BasicInfoとDetailedProfileで同じプロフィール完成度を表示
- 共通のProfileCompletionコンポーネントを使用
- 全18項目（BasicInfo 6項目 + DetailedProfile 12項目）の完成度を計算

### レコメンド対象項目と優先度

#### DetailedProfile用レコメンド

| 優先度 | 項目名 | 判定条件 | アクション |
|--------|--------|----------|------------|
| 1 | 雰囲気の好み | `userAtmospherePreferences`が未設定または空配列 | AtmosphereEditModalを表示 |
| 2 | 興味 | 全ての興味カテゴリが設定されていない | InterestsEditModalを表示 |
| 3 | お酒の好み | `alcohol_categories`, `alcohol_brands`, `drink_styles`がすべて未設定または空配列 | AlcoholEditModalを表示 |
| 4 | 利用目的 | `userData.visit_purposes`が未設定または空配列 | VisitPurposesEditModalを表示 |
| 5 | 希望予算 | `userData.budget_range`が未設定 | 該当項目へ自動スクロール |
| 6 | 血液型 | `userData.blood_type`が未設定 | 該当項目へ自動スクロール |
| 7 | MBTI | `userData.mbti`が未設定 | 該当項目へ自動スクロール |
| 8 | 仕事情報（職業） | `userData.occupation`が未設定または空文字 | 該当項目へ自動スクロール |
| 9 | 仕事情報（業種） | `userData.industry`が未設定または空文字 | 該当項目へ自動スクロール |
| 10 | 仕事情報（役職） | `userData.position`が未設定または空文字 | 該当項目へ自動スクロール |
| 11 | 趣味 | `userData.hobbies`が未設定または空配列 | 該当項目へ自動スクロール |
| 12 | 運動頻度 | `userData.exercise_frequency`が未設定 | 該当項目へ自動スクロール |
| 13 | 食事制限・好み | `userData.dietary_preference`が未設定 | 該当項目へ自動スクロール |

#### BasicInfo用レコメンド

| 項目名 | 判定条件 | アクション |
|--------|----------|------------|
| 基本情報 | ユーザー名、自己紹介、性別、生年月日、マイエリア、プロフィール画像のいずれかが未設定 | BasicInfoEditModalを表示 |

**注意**: BasicInfoでは1つのレコメンド枠で未入力項目をまとめて表示し、「○○、○○の入力が完了していません」形式で案内

### 表示ルール
- **DetailedProfile**: 上位3つまでの未入力項目をレコメンドとして表示
- **BasicInfo**: 未入力項目がある場合、1つのレコメンド枠を表示
- 優先度順にソートして表示
- 各レコメンド項目には「追加する」（DetailedProfile）または「編集する」（BasicInfo）ボタンを配置

### アクション仕様

#### モーダル表示（優先度1-4）
- 雰囲気の好み：`AtmosphereEditModal`を開く
- 興味：`InterestsEditModal`を開く  
- お酒の好み：`AlcoholEditModal`を開く
- 利用目的：`VisitPurposesEditModal`を開く

#### 自動スクロール（優先度5-13）
- `data-field`属性を持つ要素まで滑らかにスクロール
- スクロール設定：`{ behavior: 'smooth', block: 'center' }`

### UI構成

```tsx
{topRecommendations.length > 0 && (
  <div className={styles.recommendSection}>
    <h3 className={styles.recommendTitle}>
      <span className={styles.starIcon}>⭐</span> プロフィールを充実させましょう
    </h3>
    
    <div className={styles.recommendGrid}>
      {topRecommendations.map((recommendation) => (
        <div key={recommendation.id} className={styles.recommendItem}>
          <div className={styles.recommendContent}>
            <h4 className={styles.recommendLabel}>{recommendation.title}</h4>
            <p className={styles.recommendDescription}>{recommendation.description}</p>
          </div>
          <ButtonGradientWrapper anotherStyle={styles.addButton} onClick={recommendation.action}>
            <Plus size={14} />
            追加する
          </ButtonGradientWrapper>
        </div>
      ))}
    </div>
  </div>
)}
```

## 技術実装

### 共通コンポーネント構成

#### ProfileCompletionコンポーネント
- **場所**: `/components/UI/ProfileCompletion/`
- **役割**: BasicInfoとDetailedProfileで統一されたプロフィール完成度を表示
- **計算ロジック**: 全18項目の完成度を計算
- **Props**:
  ```typescript
  interface ProfileCompletionProps {
    userData: UserType;
    profileOptions: ProfileOptions;
    userAtmospherePreferences: UserAtmospherePreference[];
    title?: string;
  }
  ```

### データ構造
```typescript
interface RecommendationItem {
  id: string;           // 一意識別子
  title: string;        // 表示タイトル
  description: string;  // 説明文
  priority: number;     // 優先度（DetailedProfileのみ）
  action: () => void;   // クリック時のアクション
}
```

### 判定ロジック
- **DetailedProfile**: `getRecommendations()` 関数内で各項目の入力状況を判定し、未入力項目を収集
- **BasicInfo**: `getBasicInfoRecommendations()` 関数内でBasicInfo項目の入力状況を判定

### レンダリング制御
- **DetailedProfile**: `topRecommendations.length > 0`で表示/非表示を制御、優先度順で最大3つ表示
- **BasicInfo**: `basicInfoRecommendations.length > 0`で表示/非表示を制御、1つのレコメンド枠を表示

## 管理・運用

### 優先度変更
`getRecommendations()`関数内の`priority`値を変更することで優先度を調整可能

### 新規項目追加
1. 該当する判定条件を追加
2. `RecommendationItem`オブジェクトを`recommendations`配列に追加
3. 適切な`priority`値を設定
4. スクロール対象の場合は該当要素に`data-field`属性を追加

### 削除
対象項目の判定処理を`getRecommendations()`から削除

## ファイル構成

### 主要ファイル
- `/frontend/src/components/UI/ProfileCompletion/index.tsx`
  - 共通プロフィール完成度コンポーネント
- `/frontend/src/components/Account/BasicInfo/index.tsx`
  - BasicInfo用レコメンドロジックとUI実装
- `/frontend/src/components/account/DetailedProfile/index.tsx`
  - DetailedProfile用レコメンドロジックとUI実装

### 関連ファイル
- `/frontend/src/types/users.ts`
  - ユーザーデータの型定義
- `/frontend/src/app/profile/page.tsx`
  - プロフィールページでのデータ連携
- 各種モーダルコンポーネント
  - `AtmosphereEditModal`
  - `InterestsEditModal` 
  - `AlcoholEditModal`
  - `VisitPurposesEditModal`
  - `BasicInfoEditModal`

### スタイルファイル
- `/frontend/src/components/UI/ProfileCompletion/style.module.scss`
  - 共通プロフィール完成度のスタイル
- `/frontend/src/components/Account/BasicInfo/style.module.scss`
  - BasicInfoレコメンドのスタイル
- `/frontend/src/components/account/DetailedProfile/style.module.scss`
  - DetailedProfileレコメンドのスタイル

## 仕様変更・拡張時の考慮事項

### パフォーマンス
- `getRecommendations()`は`userData`変更時に再計算されるため、重い処理は避ける
- 必要に応じて`useMemo`でのメモ化を検討

### ユーザビリティ
- スクロール先の要素が確実に表示されるよう、十分な余白を確保
- モーダル表示後の状態更新により、レコメンド表示が即座に更新される

### 拡張性
- 新しいプロフィール項目追加時は、型定義とレコメンドロジックの両方を更新
- 優先度の動的変更機能（管理画面等）の実装も可能な設計