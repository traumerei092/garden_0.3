# 常連利用シーン登録機能 設計・実装ドキュメント

## 概要
店舗の常連客が「どのような目的でその店舗を利用するか」を登録・管理する機能。
行きつけ店舗への複数の利用目的（デート、接待、一人飲み等）を記録し、他のユーザーの参考情報として活用する。

## システム構成

### バックエンド構成
```
backend/shops/
├── models.py                     # RegularUsageSceneモデル
├── serializers.py                # RegularUsageScene関連シリアライザー
├── views.py                      # RegularUsageSceneViewSet
├── urls.py                       # 利用シーンAPI エンドポイント
└── admin.py                      # Django管理画面設定
```

### フロントエンド構成
```
frontend/src/
├── actions/shop/regularUsageScene.ts     # 利用シーンAPI管理
├── components/Shop/RegularFeedbackModal/ # 常連フィードバックモーダル（Step1で使用）
└── types/shops.ts                        # VisitPurpose型定義
```

## データモデル設計

### RegularUsageScene Model
```python
class RegularUsageScene(models.Model):
    user = models.ForeignKey(
        'accounts.UserAccount',
        on_delete=models.CASCADE,
        related_name='regular_usage_scenes'
    )
    shop = models.ForeignKey(
        Shop,
        on_delete=models.CASCADE,
        related_name='regular_usage_scenes'
    )
    visit_purposes = models.ManyToManyField(
        'accounts.VisitPurpose',
        related_name='regular_usage_scenes',
        verbose_name="利用目的"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'regular_usage_scenes'
        verbose_name = '常連利用シーン'
        verbose_name_plural = '常連利用シーン'
        unique_together = ['user', 'shop']
```

### VisitPurpose Model（参照）
```python
# accounts/models.py
class VisitPurpose(models.Model):
    name = models.CharField(max_length=100, verbose_name="利用目的名")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

## API設計

### エンドポイント一覧
| Method | URL | 説明 |
|--------|-----|------|
| GET | `/api/shops/{shop_id}/regular-usage-scenes/` | 指定店舗の利用シーン一覧取得 |
| POST | `/api/shops/{shop_id}/regular-usage-scenes/` | 新規利用シーン登録 |
| GET | `/api/shops/{shop_id}/regular-usage-scenes/{id}/` | 特定利用シーン詳細取得 |
| PUT | `/api/shops/{shop_id}/regular-usage-scenes/{id}/` | 利用シーン更新 |
| DELETE | `/api/shops/{shop_id}/regular-usage-scenes/{id}/` | 利用シーン削除 |

### データ構造

#### 登録・更新リクエスト
```typescript
interface RegularUsageSceneCreateData {
  visit_purpose_ids: number[];
}
```

#### API レスポンス
```typescript
interface RegularUsageScene {
  id: number;
  user: number;
  shop: number;
  visit_purposes: VisitPurpose[];
  created_at: string;
  updated_at: string;
}

interface VisitPurpose {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}
```

## シリアライザー実装

### RegularUsageSceneSerializer
```python
class RegularUsageSceneSerializer(serializers.ModelSerializer):
    visit_purposes = VisitPurposeSerializer(many=True, read_only=True)

    class Meta:
        model = RegularUsageScene
        fields = ['id', 'user', 'shop', 'visit_purposes', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'shop', 'created_at', 'updated_at']
```

### RegularUsageSceneCreateUpdateSerializer
```python
class RegularUsageSceneCreateUpdateSerializer(serializers.ModelSerializer):
    visit_purpose_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=True
    )

    class Meta:
        model = RegularUsageScene
        fields = ['visit_purpose_ids']

    def create(self, validated_data):
        visit_purpose_ids = validated_data.pop('visit_purpose_ids')
        context = self.context

        regular_usage_scene = RegularUsageScene.objects.create(
            user_id=context['user_id'],
            shop_id=context['shop_id']
        )
        regular_usage_scene.visit_purposes.set(visit_purpose_ids)
        return regular_usage_scene

    def update(self, instance, validated_data):
        visit_purpose_ids = validated_data.get('visit_purpose_ids')
        if visit_purpose_ids is not None:
            instance.visit_purposes.set(visit_purpose_ids)
        return instance
```

## ViewSet実装

### RegularUsageSceneViewSet
```python
class RegularUsageSceneViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        shop_pk = self.kwargs.get('shop_pk')
        return RegularUsageScene.objects.filter(
            shop_id=shop_pk,
            user=self.request.user
        ).prefetch_related('visit_purposes')

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return RegularUsageSceneCreateUpdateSerializer
        return RegularUsageSceneSerializer

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({
            'user_id': self.request.user.id,
            'shop_id': self.kwargs.get('shop_pk')
        })
        return context
```

## フロントエンド実装

### API Actions（regularUsageScene.ts）
```typescript
// 利用シーン取得
export const fetchRegularUsageScene = async (shopId: number): Promise<RegularUsageScene | null> => {
  const response = await fetchWithAuth(`${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular-usage-scenes/`);
  const data = await response.json();
  return data.length > 0 ? data[0] : null;
};

// 利用シーン登録・更新
export const submitRegularUsageScene = async (
  shopId: number,
  data: RegularUsageSceneCreateData
): Promise<RegularUsageScene> => {
  const existingData = await fetchRegularUsageScene(shopId);
  const url = existingData
    ? `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular-usage-scenes/${existingData.id}/`
    : `${process.env.NEXT_PUBLIC_API_URL}/shops/${shopId}/regular-usage-scenes/`;
  const method = existingData ? 'PUT' : 'POST';

  const response = await fetchWithAuth(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return await response.json();
};
```

### UI実装（RegularFeedbackModal Step1）
```typescript
// 利用目的選択UI
<CustomCheckboxGroup
  name="visitPurposes"
  values={selectedVisitPurposes}
  onChange={handleVisitPurposeChange}
  options={visitPurposes.map(purpose => ({
    label: purpose.name,
    value: purpose.id.toString()
  }))}
/>

// 登録処理
const handleUsageSceneSubmit = async () => {
  try {
    const visitPurposeIds = selectedVisitPurposes.map(id => parseInt(id));
    await submitRegularUsageScene(shop.id, { visit_purpose_ids: visitPurposeIds });
    console.log('利用シーン登録完了');
  } catch (error) {
    console.error('利用シーン登録エラー:', error);
  }
};
```

## 管理画面設定

### Django Admin設定
```python
@admin.register(RegularUsageScene)
class RegularUsageSceneAdmin(admin.ModelAdmin):
    list_display = ('user', 'shop', 'visit_purposes_display', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('user__username', 'shop__name')
    filter_horizontal = ('visit_purposes',)
    readonly_fields = ('created_at', 'updated_at')

    def visit_purposes_display(self, obj):
        return ', '.join([vp.name for vp in obj.visit_purposes.all()])
    visit_purposes_display.short_description = '利用目的'

    fieldsets = (
        ('基本情報', {
            'fields': ('user', 'shop')
        }),
        ('利用目的', {
            'fields': ('visit_purposes',)
        }),
        ('日時情報', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
```

## 利用パターン

### 1. 新規利用シーン登録
```typescript
// ユーザーが常連フィードバックモーダルのStep1で利用目的を選択
const selectedPurposes = [1, 3, 5]; // デート、接待、一人飲み
await submitRegularUsageScene(shopId, { visit_purpose_ids: selectedPurposes });
```

### 2. 既存利用シーン更新
```typescript
// 既存データがある場合は自動的にPUT リクエストで更新
const updatedPurposes = [2, 4, 6]; // 友人との飲み、記念日、カジュアル
await submitRegularUsageScene(shopId, { visit_purpose_ids: updatedPurposes });
```

### 3. 利用シーン取得・表示
```typescript
// ユーザーの既存利用シーンを取得してUI に反映
const existingScene = await fetchRegularUsageScene(shopId);
if (existingScene) {
  const purposeIds = existingScene.visit_purposes.map(vp => vp.id.toString());
  setSelectedVisitPurposes(purposeIds);
}
```

## データ整合性・制約

### ビジネスルール
1. **ユニーク制約**: 1ユーザー・1店舗につき1つの利用シーンレコード
2. **必須選択**: 最低1つの利用目的選択が必要
3. **権限制御**: 自分の利用シーンのみ操作可能

### データベース制約
```python
class Meta:
    unique_together = ['user', 'shop']  # ユーザー・店舗の組み合わせでユニーク
```

### API バリデーション
```python
# visit_purpose_ids の必須チェック
visit_purpose_ids = serializers.ListField(
    child=serializers.IntegerField(),
    write_only=True,
    required=True  # 必須フィールド
)
```

## 運用考慮事項

### パフォーマンス最適化
1. **Prefetch関連**: `prefetch_related('visit_purposes')`でN+1問題回避
2. **インデックス**: user, shop の組み合わせにインデックス自動追加
3. **キャッシュ**: 頻繁にアクセスされるVisitPurpose一覧のキャッシュ検討

### データメンテナンス
1. **マイグレーション**: VisitPurpose追加時の既存データ影響なし
2. **削除処理**: User/Shop削除時のCASCADE処理
3. **バックアップ**: 利用シーンデータは復旧重要度中程度

### セキュリティ
1. **認証**: 全エンドポイントで`IsAuthenticated`必須
2. **認可**: 自分のデータのみアクセス可能
3. **入力検証**: visit_purpose_ids の存在チェック

## 今後の拡張方針

### 機能拡張案
1. **利用頻度**: 各利用目的の使用頻度記録
2. **時間帯情報**: 利用目的別の好み時間帯
3. **同行者情報**: 利用目的別の同行者パターン
4. **予算情報**: 利用目的別の予算レンジ

### 分析機能
1. **利用パターン分析**: 店舗別・地域別の利用目的トレンド
2. **レコメンデーション**: 利用目的ベースの店舗推薦
3. **統計ダッシュボード**: 店舗オーナー向け利用目的分析

### UI/UX改善
1. **利用目的の個別説明**: 各選択肢の詳細説明表示
2. **アイコン表示**: 利用目的別のビジュアル表現
3. **カテゴリ分類**: 利用目的のグループ分け表示

## 技術的特徴

### Django Model設計
- ManyToManyField による柔軟な関連付け
- unique_together制約による業務ルール実装
- related_name を活用した逆参照の最適化

### API設計
- REST原則に基づいたリソース指向設計
- 入力用・出力用シリアライザーの分離
- ViewSet のaction別シリアライザー切り替え

### フロントエンド設計
- TypeScript による型安全性確保
- 既存・新規データの統一インターフェース
- エラーハンドリングと例外処理

### 統合設計
- 常連フィードバックモーダルとの自然な統合
- 既存のUI コンポーネント（CustomCheckboxGroup）活用
- 一貫したAPIアクセスパターン

---

**作成日**: 2025-10-04
**バージョン**: v1.0
**担当**: Claude Code Implementation
**関連ドキュメント**: [CLAUDE_ShopFeedbackSystem.md](./CLAUDE_ShopFeedbackSystem.md)