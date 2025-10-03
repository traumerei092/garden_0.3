# 常連分析機能 設計・実装ドキュメント

## 現状の実装サマリー（v1.0）

### 既存コンポーネント構成

```
frontend/src/components/Shop/
├── WelcomeSection/                    # ウェルカムメッセージ
├── RegularsSnapshot/                  # 常連概要表示
├── CommonalitiesSection/              # 共通点分析表示
└── RegularsAnalysisModal/             # 詳細分析モーダル
    ├── index.tsx                      # メインコンポーネント
    └── style.module.scss              # スタイル定義
```

### 現状の表示内容

1. **RegularsSnapshot**: 常連の基本統計（年代、職業、エリア）
2. **CommonalitiesSection**: ユーザーとの共通点分析
3. **RegularsAnalysisModal**: StyledAutocomplete での軸選択 + 詳細データ表示

### 現状の課題

- 情報が 3 セクションに分散し、訴求点が不明確
- 具体的人数表示によるプライバシーリスク
- データ羅列的で感情的訴求が不足
- StyledAutocomplete による UX 摩擦

---

## 新方針・設計（v2.0）

### ビジョン

「サードプレイスを誰しもが見つけられる」ために、データの機械的表示から「人の温かみ」「コミュニティの魅力」を感じられる表現への転換。

### 改良方針

1. **情報統合**: RegularsSnapshot + CommonalitiesSection → RegularsCommunitySection
2. **感情訴求強化**: データ + 解釈・感想の組み合わせ
3. **プライバシー配慮**: 人数表示廃止、割合表示（5%刻み）
4. **UX 改善**: ドロップダウン → タブ式ナビゲーション
5. **ビジュアル改良**: 円グラフ + アバター表現

### 新コンポーネント設計

#### RegularsCommunitySection（統合コンポーネント）

```tsx
<RegularsCommunitySection>
  {/* メインビジュアル - コミュニティの第一印象 */}
  <CommunityPreview>
    <AvatarGroup /> {/* 常連のアバター群 */}
    <CommunityDescription>
      "30代中心の落ち着いたコミュニティ"
    </CommunityDescription>
    <EmotionalCopy>"仕事帰りにほっと一息つける場所"</EmotionalCopy>
  </CommunityPreview>

  {/* パーソナル接続 - 最重要要素 */}
  <PersonalConnection>
    <ConnectionHighlight>
      "あなたと同じ渋谷エリア在住の方が40%います"
    </ConnectionHighlight>
    <AdditionalConnections>
      "同年代: 35% | IT関係: 25% | カフェ好き: 60%"
    </AdditionalConnections>
  </PersonalConnection>

  {/* 詳細分析へのCTA */}
  <AnalysisButton onClick={openModal}>
    "コミュニティの詳しい分析を見る"
  </AnalysisButton>
</RegularsCommunitySection>
```

#### RegularsAnalysisModal（改良版）

```tsx
<RegularsAnalysisModal>
  {/* タブナビゲーション */}
  <TabNavigation>
    <Tab active>年代構成</Tab>
    <Tab>職業分布</Tab>
    <Tab>エリア分布</Tab>
    <Tab>趣味・関心</Tab>
  </TabNavigation>

  {/* タブコンテンツ */}
  <TabContent>
    <CircularChart data={ageDistribution} />
    <InsightPanel>
      <Insight>
        "30代が中心のコミュニティ。同世代の仲間と出会えそうです"
      </Insight>
      <PersonalMatch>"あなたと同年代: 35%"</PersonalMatch>
    </InsightPanel>
  </TabContent>
</RegularsAnalysisModal>
```

### データ変換ロジック

#### プライバシー配慮の数値変換

```typescript
// 人数 → 割合変換（5%刻み）
const convertToPercentage = (count: number, total: number): number => {
  const exactPercentage = (count / total) * 100;
  return Math.round(exactPercentage / 5) * 5;
};

// 割合 → 感情的表現変換
const getEmotionalExpression = (percentage: number): string => {
  if (percentage >= 40) return "多く";
  if (percentage >= 20) return "そこそこ";
  if (percentage >= 10) return "少し";
  return "わずかに";
};
```

#### 感情的解釈生成ロジック

```typescript
const generateCommunityInsight = (data: RegularData): string => {
  const dominantAge = getDominantCategory(data.ageDistribution);
  const dominantOccupation = getDominantCategory(data.occupationDistribution);

  const ageDescriptions = {
    "20代": "活気ある若い",
    "30代": "落ち着いた働き盛りの",
    "40代": "経験豊富な大人の",
    "50代": "落ち着きのある成熟した",
  };

  const occupationDescriptions = {
    IT関係: "テック系",
    営業: "コミュニケーション上手な",
    クリエイター: "クリエイティブな",
    会社員: "様々な業界の",
  };

  return `${ageDescriptions[dominantAge]}${occupationDescriptions[dominantOccupation]}空間`;
};
```

### ビジュアル設計

#### カラーパレット戦略

```scss
// 温かみのあるコミュニティ
$warm-community: #ff6b6b, #ffe66d, #ff8e53;

// クールなコミュニティ
$cool-community: #4ecdc4, #45b7d1, #a8e6cf;

// バランス型コミュニティ
$balanced-community: #ffa07a, #98d8c8, #f7dc6f;
```

#### アニメーション表現

```scss
.avatarGroup {
  .avatar {
    transition: transform 0.3s ease;

    &:hover {
      transform: scale(1.1);
    }
  }

  .communityPulse {
    animation: gentlePulse 3s infinite;
  }
}

@keyframes gentlePulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}
```

### 実装フェーズ

#### Phase 1: 統合コンポーネント実装

1. RegularsCommunitySection 作成
2. 既存データの統合表示
3. 基本的な感情的コピー追加
4. プライバシー配慮の数値変換

#### Phase 2: モーダル改良

1. タブ式ナビゲーション実装
2. 円グラフコンポーネント作成
3. InsightPanel 実装
4. アニメーション・ビジュアル改良

#### Phase 3: 高度化

1. 感情的解釈ロジックの精密化
2. パーソナライゼーション強化
3. A/B テスト準備
4. パフォーマンス最適化

### API・データ構造

#### 既存 API 活用

```typescript
// /api/shops/{id}/regulars/snapshot/
interface RegularsSnapshot {
  total_regulars: number;
  age_distribution: Record<string, number>;
  occupation_distribution: Record<string, number>;
  area_distribution: Record<string, number>;
  visit_frequency: Record<string, number>;
}

// /api/shops/{id}/commonalities/
interface CommonalitiesData {
  user_matches: {
    age_match: boolean;
    area_match: boolean;
    occupation_match: boolean;
    interests_match: string[];
  };
  similarity_score: number;
}
```

#### 新しいフロントエンド型定義

```typescript
interface CommunityInsight {
  description: string; // "30代中心の落ち着いた"
  emotionalCopy: string; // "仕事帰りにほっと一息"
  dominantCharacteristics: {
    age: string;
    occupation: string;
    area: string;
  };
}

interface PersonalConnection {
  primaryMatch: string; // "同じ渋谷エリア在住: 40%"
  secondaryMatches: string[]; // ["同年代: 35%", "IT関係: 25%"]
  overallScore: number; // 0-100の親和性スコア
}
```

### 成功指標・KPI

#### エンゲージメント指標

- モーダル開封率（詳細分析クリック率）
- タブ切り替え回数（関心の深さ）
- ページ滞在時間の延長

#### 行動指標

- お気に入り登録率
- 訪問予定登録率
- 実際の来店率（可能であれば）

#### 感情指標

- "行きたい"感情の向上（アンケート等）
- "親しみやすさ"の向上
- "不安感"の軽減

### 技術的考慮事項

#### パフォーマンス

- 円グラフレンダリングの最適化
- アニメーションのフレームレート管理
- データ変換処理のメモ化

#### アクセシビリティ

- 色だけに依存しない情報伝達
- スクリーンリーダー対応
- キーボードナビゲーション

#### レスポンシブ対応

- モバイルでのタブ表示
- 円グラフのサイズ調整
- アバター表示の最適化

---

## 実装状況 (2025-09-29)

### ✅ 完了済み

1. **RegularsCommunitySection の統合実装**
   - 既存の RegularsSnapshot + CommonalitiesSection を統合
   - 統一デザインシステムの適用（color scheme: rgb(10,11,28), rgb(0,255,255)）
   - コンパクトレイアウトの実装（「一画面でどれだけコンパクトに伝えたい情報を訴求するか」対応）
   - Lucide アイコンの採用（絵文字の完全除去）

2. **RegularsAnalysisModal の改良実装**
   - CustomModal への移行（NextUI Modal から脱却）
   - **プライバシー配慮の人数表示廃止**（✅重要）
   - タブ式ナビゲーションの実装
   - 統一カラーパレットの適用

3. **バックエンド改修**
   - `get_top_interests()` メソッドの ManyToManyField 対応
   - `analyze_interests()` メソッドの ManyToManyField 対応
   - 60ユーザーへの興味データ投入完了

4. **バグ修正**
   - renderPersonalConnection の `[object Object]` 表示問題を解決
   - 興味情報が表示されない問題を解決

### ⚠️ 重要な方針遵守

- **人数表示の完全廃止**: RegularsAnalysisModal で人数（例：「対象: 12人」）を表示しない
- **割合表示（5%刻み）**: プライバシー配慮による数値変換の徹底
- **感情的表現**: generateEmotionalCopy の削除（精度不足のため）

### 🎯 現在の表示内容

1. **RegularsCommunitySection**
   - 年代・性別情報（「40代の女性が中心」）✅
   - 興味情報（「コーヒー・読書が人気」）✅
   - パーソナル接続（共通点の%表示）✅

2. **RegularsAnalysisModal**
   - 年代構成タブ ✅
   - 職業分布タブ ✅
   - エリア分布タブ ✅
   - 趣味・関心タブ ✅
   - 人数非表示（プライバシー配慮）✅

---

**最終更新**: 2025-09-29
**バージョン**: v2.0 Implementation Complete
**担当**: Claude Code Implementation

## 実装前の確認事項

この設計に基づいて実装を進める前に、以下の点について確認・調整が必要：

1. **Copy Writing 方針の詳細化**（現在は基本方針のみ）
2. **既存 API データとの整合性確認**
3. **ビジュアルデザインの詳細仕様**
4. **A/B テスト対象の具体化**

実装結果が期待と異なる場合は、このドキュメントの現状サマリー（v1.0）に基づいて元の実装に戻すことが可能です。
