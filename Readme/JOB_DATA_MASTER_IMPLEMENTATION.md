# 職業データマスタ管理システム実装計画

## 📋 概要
ユーザーの職業・業種・役職情報を、自由入力形式から選択式のマスタデータ管理に変更します。データ品質の向上、統計分析の精度向上、UX改善を実現します。

---

## 🎯 実装目標

### 1. **データ構造の変更**
- `occupation`, `industry`, `position` を CharField から ForeignKey に変更
- 既存の BaseTag パターンに従った3つの新モデル作成
- 包括的で現代的なマスタデータの初期投入

### 2. **UI/UX の改善**
- EditableField → EditableSelect への置き換え
- 統一された選択UI体験の提供
- 公開設定機能の維持

### 3. **既存機能への影響最小化**
- RegularsAnalysisModal の職業分布分析を正常動作させる
- プロフィール表示・編集機能の継続性確保
- API互換性の維持

---

## 📂 変更対象ファイル一覧

### Backend (Django)
1. **`backend/accounts/models.py`** - 新モデル定義、UserAccount フィールド変更
2. **`backend/accounts/serializers.py`** - シリアライザー追加・更新
3. **`backend/accounts/views.py`** - ProfileDataView への選択肢追加
4. **`backend/accounts/admin.py`** - Admin インターフェース登録
5. **`backend/shops/views.py`** - RegularsAnalysis の occupation/industry 分析ロジック更新
6. **マイグレーションファイル（新規）** - データ削除とマスタデータ投入

### Frontend (Next.js/TypeScript)
7. **`frontend/src/types/users.ts`** - 型定義更新（occupation/industry/position を BaseTag 型に）
8. **`frontend/src/components/Account/DetailedProfile/index.tsx`** - EditableSelect への置き換え
9. **`frontend/src/actions/profile/fetchProfileOptions.ts`** - 既存ファイル（変更不要、自動的に新データ取得）
10. **`frontend/src/actions/profile/updateProfileField.ts`** - 既存ファイル（変更不要、occupation_id等を受け付け）

---

## 🗄️ 1. モデル設計（Backend）

### 新規モデル: Occupation, Industry, Position

```python
# backend/accounts/models.py に追加

class Occupation(BaseTag):
    """職業マスタ"""
    name = models.CharField("職業名", max_length=100, unique=True)
    description = models.TextField("説明", blank=True)
    order = models.IntegerField("表示順", default=0)

    class Meta:
        verbose_name = "職業"
        verbose_name_plural = "職業"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Industry(BaseTag):
    """業種マスタ"""
    name = models.CharField("業種名", max_length=100, unique=True)
    description = models.TextField("説明", blank=True)
    order = models.IntegerField("表示順", default=0)

    class Meta:
        verbose_name = "業種"
        verbose_name_plural = "業種"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name


class Position(BaseTag):
    """役職マスタ"""
    name = models.CharField("役職名", max_length=100, unique=True)
    description = models.TextField("説明", blank=True)
    order = models.IntegerField("表示順", default=0)

    class Meta:
        verbose_name = "役職"
        verbose_name_plural = "役職"
        ordering = ['order', 'name']

    def __str__(self):
        return self.name
```

### UserAccount フィールド変更

```python
# 既存の CharField 定義（239-249行目）を削除し、以下に置き換え

UserAccount.add_to_class(
    'occupation',
    models.ForeignKey(
        Occupation,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name="職業"
    )
)

UserAccount.add_to_class(
    'industry',
    models.ForeignKey(
        Industry,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name="業種"
    )
)

UserAccount.add_to_class(
    'position',
    models.ForeignKey(
        Position,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
        verbose_name="役職"
    )
)
```

---

## 💾 2. マスタデータ提案

### Occupation（職業）- 30選択肢
```
1. 会社員（営業）
2. 会社員（事務）
3. 会社員（企画・マーケティング）
4. 会社員（技術・エンジニア）
5. 会社員（管理職）
6. 公務員
7. 教員・講師
8. 医療従事者（医師・看護師等）
9. 福祉・介護職
10. 経営者・役員
11. 個人事業主・フリーランス
12. 自営業
13. コンサルタント
14. 士業（弁護士・税理士・会計士等）
15. クリエイター（デザイナー・ライター等）
16. エンジニア・プログラマー
17. 研究職
18. 販売・接客
19. 専門職（建築士・薬剤師等）
20. 学生
21. アルバイト・パート
22. 主婦・主夫
23. 無職・求職中
24. その他
```

### Industry（業種）- 25選択肢
```
1. IT・通信
2. インターネット・Web
3. 製造業（電気・電子）
4. 製造業（機械）
5. 製造業（その他）
6. 商社
7. 小売・流通
8. 金融・保険
9. 不動産・建設
10. コンサルティング
11. 広告・マーケティング
12. 出版・メディア
13. 教育
14. 医療・福祉
15. 飲食・宿泊
16. 運輸・物流
17. エネルギー
18. 公共サービス
19. 農業・林業・水産業
20. 芸術・エンターテイメント
21. 法律・会計
22. 人材サービス
23. その他サービス業
24. 非営利団体・NGO
25. その他
```

### Position（役職）- 15選択肢
```
1. 一般社員
2. 主任
3. 係長
4. 課長
5. 次長
6. 部長
7. 本部長
8. 役員
9. 社長・代表
10. フリーランス
11. 個人事業主
12. 学生
13. パート・アルバイト
14. 役職なし
15. その他
```

---

## 🔄 3. マイグレーション戦略

### マイグレーションファイル構成

**backend/accounts/migrations/0XXX_job_data_to_master.py**

```python
from django.db import migrations, models
import django.db.models.deletion


def clear_job_data(apps, schema_editor):
    """既存の職業データをクリア"""
    User = apps.get_model('accounts', 'UserAccount')
    User.objects.update(occupation=None, industry=None, position=None)


def populate_occupations(apps, schema_editor):
    """職業マスタデータ投入"""
    Occupation = apps.get_model('accounts', 'Occupation')
    occupations = [
        ("会社員（営業）", 1),
        ("会社員（事務）", 2),
        ("会社員（企画・マーケティング）", 3),
        ("会社員（技術・エンジニア）", 4),
        ("会社員（管理職）", 5),
        ("公務員", 6),
        ("教員・講師", 7),
        ("医療従事者（医師・看護師等）", 8),
        ("福祉・介護職", 9),
        ("経営者・役員", 10),
        ("個人事業主・フリーランス", 11),
        ("自営業", 12),
        ("コンサルタント", 13),
        ("士業（弁護士・税理士・会計士等）", 14),
        ("クリエイター（デザイナー・ライター等）", 15),
        ("エンジニア・プログラマー", 16),
        ("研究職", 17),
        ("販売・接客", 18),
        ("専門職（建築士・薬剤師等）", 19),
        ("学生", 20),
        ("アルバイト・パート", 21),
        ("主婦・主夫", 22),
        ("無職・求職中", 23),
        ("その他", 24),
    ]
    for name, order in occupations:
        Occupation.objects.create(name=name, order=order)


def populate_industries(apps, schema_editor):
    """業種マスタデータ投入"""
    Industry = apps.get_model('accounts', 'Industry')
    industries = [
        ("IT・通信", 1),
        ("インターネット・Web", 2),
        ("製造業（電気・電子）", 3),
        ("製造業（機械）", 4),
        ("製造業（その他）", 5),
        ("商社", 6),
        ("小売・流通", 7),
        ("金融・保険", 8),
        ("不動産・建設", 9),
        ("コンサルティング", 10),
        ("広告・マーケティング", 11),
        ("出版・メディア", 12),
        ("教育", 13),
        ("医療・福祉", 14),
        ("飲食・宿泊", 15),
        ("運輸・物流", 16),
        ("エネルギー", 17),
        ("公共サービス", 18),
        ("農業・林業・水産業", 19),
        ("芸術・エンターテイメント", 20),
        ("法律・会計", 21),
        ("人材サービス", 22),
        ("その他サービス業", 23),
        ("非営利団体・NGO", 24),
        ("その他", 25),
    ]
    for name, order in industries:
        Industry.objects.create(name=name, order=order)


def populate_positions(apps, schema_editor):
    """役職マスタデータ投入"""
    Position = apps.get_model('accounts', 'Position')
    positions = [
        ("一般社員", 1),
        ("主任", 2),
        ("係長", 3),
        ("課長", 4),
        ("次長", 5),
        ("部長", 6),
        ("本部長", 7),
        ("役員", 8),
        ("社長・代表", 9),
        ("フリーランス", 10),
        ("個人事業主", 11),
        ("学生", 12),
        ("パート・アルバイト", 13),
        ("役職なし", 14),
        ("その他", 15),
    ]
    for name, order in positions:
        Position.objects.create(name=name, order=order)


class Migration(migrations.Migration):
    dependencies = [
        ('accounts', '0003_profilevisibilitysettings'),  # 最新のマイグレーションに依存
    ]

    operations = [
        # 1. 新モデル作成
        migrations.CreateModel(
            name='Occupation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='作成日時')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
                ('is_active', models.BooleanField(default=True, verbose_name='有効')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='職業名')),
                ('description', models.TextField(blank=True, verbose_name='説明')),
                ('order', models.IntegerField(default=0, verbose_name='表示順')),
            ],
            options={
                'verbose_name': '職業',
                'verbose_name_plural': '職業',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='Industry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='作成日時')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
                ('is_active', models.BooleanField(default=True, verbose_name='有効')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='業種名')),
                ('description', models.TextField(blank=True, verbose_name='説明')),
                ('order', models.IntegerField(default=0, verbose_name='表示順')),
            ],
            options={
                'verbose_name': '業種',
                'verbose_name_plural': '業種',
                'ordering': ['order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='Position',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='作成日時')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新日時')),
                ('is_active', models.BooleanField(default=True, verbose_name='有効')),
                ('name', models.CharField(max_length=100, unique=True, verbose_name='役職名')),
                ('description', models.TextField(blank=True, verbose_name='説明')),
                ('order', models.IntegerField(default=0, verbose_name='表示順')),
            ],
            options={
                'verbose_name': '役職',
                'verbose_name_plural': '役職',
                'ordering': ['order', 'name'],
            },
        ),

        # 2. 既存データクリア
        migrations.RunPython(clear_job_data, reverse_code=migrations.RunPython.noop),

        # 3. 古いフィールド削除
        migrations.RemoveField(
            model_name='useraccount',
            name='occupation',
        ),
        migrations.RemoveField(
            model_name='useraccount',
            name='industry',
        ),
        migrations.RemoveField(
            model_name='useraccount',
            name='position',
        ),

        # 4. 新しいForeignKeyフィールド追加
        migrations.AddField(
            model_name='useraccount',
            name='occupation',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='users',
                to='accounts.occupation',
                verbose_name='職業'
            ),
        ),
        migrations.AddField(
            model_name='useraccount',
            name='industry',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='users',
                to='accounts.industry',
                verbose_name='業種'
            ),
        ),
        migrations.AddField(
            model_name='useraccount',
            name='position',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='users',
                to='accounts.position',
                verbose_name='役職'
            ),
        ),

        # 5. マスタデータ投入
        migrations.RunPython(populate_occupations, reverse_code=migrations.RunPython.noop),
        migrations.RunPython(populate_industries, reverse_code=migrations.RunPython.noop),
        migrations.RunPython(populate_positions, reverse_code=migrations.RunPython.noop),
    ]
```

---

## 🔌 4. API 変更（Backend）

### Serializers 追加・更新

**backend/accounts/serializers.py**

```python
# 新規シリアライザー追加（imports も追加）
from .models import (
    # 既存...
    Occupation,
    Industry,
    Position,
)

class OccupationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Occupation
        fields = "__all__"


class IndustrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Industry
        fields = "__all__"


class PositionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Position
        fields = "__all__"


# UserSerializer を更新（既存の144-215行目を修正）
class UserSerializer(serializers.ModelSerializer):
    uid = serializers.CharField(read_only=True)
    avatar = Base64ImageField(max_length=None, use_url=True, required=False, allow_null=True)
    header_image = Base64ImageField(max_length=None, use_url=True, required=False, allow_null=True)

    # 既存のManyToMany/ForeignKeyフィールド
    interests = InterestSerializer(many=True, read_only=True)
    blood_type = BloodTypeSerializer(read_only=True)
    mbti = MBTISerializer(read_only=True)
    # ... その他既存フィールド ...

    # 職業データ - 読み取り専用（詳細情報）
    occupation = OccupationSerializer(read_only=True)
    industry = IndustrySerializer(read_only=True)
    position = PositionSerializer(read_only=True)

    # 書き込み専用フィールド（既存のIDフィールドに追加）
    occupation_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    industry_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    position_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = User
        fields = (
            "id", "uid", "email", "name", "avatar", "header_image",
            "introduction", "gender", "birthdate", "work_info",
            # 職業データ
            "occupation", "occupation_id",
            "industry", "industry_id",
            "position", "position_id",
            # その他既存フィールド...
            "exercise_frequency", "exercise_frequency_id",
            # ... 省略 ...
        )

    def update(self, instance, validated_data):
        # birthdateの空文字列をNoneに変換（既存ロジック）
        if 'birthdate' in validated_data:
            if validated_data['birthdate'] == '' or validated_data['birthdate'] == 'null':
                validated_data['birthdate'] = None

        # occupation_id が提供された場合、occupation を設定
        if 'occupation_id' in validated_data:
            occupation_id = validated_data.pop('occupation_id')
            if occupation_id:
                try:
                    instance.occupation = Occupation.objects.get(id=occupation_id)
                except Occupation.DoesNotExist:
                    pass
            else:
                instance.occupation = None

        # industry_id が提供された場合、industry を設定
        if 'industry_id' in validated_data:
            industry_id = validated_data.pop('industry_id')
            if industry_id:
                try:
                    instance.industry = Industry.objects.get(id=industry_id)
                except Industry.DoesNotExist:
                    pass
            else:
                instance.industry = None

        # position_id が提供された場合、position を設定
        if 'position_id' in validated_data:
            position_id = validated_data.pop('position_id')
            if position_id:
                try:
                    instance.position = Position.objects.get(id=position_id)
                except Position.DoesNotExist:
                    pass
            else:
                instance.position = None

        # 既存のblood_type_id等の処理...
        # ... 省略（既存ロジックを維持）...

        # その他のフィールドを更新
        return super().update(instance, validated_data)


# PublicUserProfileSerializer も更新（occupation等がobjectになることに注意）
# 行399-404: occupation, industry, position のフィルタリングロジックはそのまま動作
```

### ProfileDataView 更新

**backend/accounts/views.py (lines 72-106)**

```python
class ProfileDataView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, *args, **kwargs):
        data = {
            "interests": InterestSerializer(Interest.objects.all(), many=True).data,
            "blood_types": BloodTypeSerializer(BloodType.objects.all(), many=True).data,
            "mbti_types": MBTISerializer(MBTI.objects.all(), many=True).data,
            "alcohols": AlcoholSerializer(Alcohol.objects.all(), many=True).data,
            "alcohol_categories": AlcoholCategorySerializer(AlcoholCategory.objects.all(), many=True).data,
            "alcohol_brands": AlcoholBrandSerializer(AlcoholBrand.objects.all(), many=True).data,
            "drink_styles": DrinkStyleSerializer(DrinkStyle.objects.all(), many=True).data,
            "hobbies": HobbySerializer(Hobby.objects.all(), many=True).data,
            "exercise_habits": ExerciseHabitSerializer(ExerciseHabit.objects.all(), many=True).data,
            "social_preferences": SocialPreferenceSerializer(SocialPreference.objects.all(), many=True).data,
            "exercise_frequencies": ExerciseFrequencySerializer(ExerciseFrequency.objects.all().order_by('order'), many=True).data,
            "dietary_preferences": DietaryPreferenceSerializer(DietaryPreference.objects.all(), many=True).data,
            "budget_ranges": BudgetRangeSerializer(BudgetRange.objects.all().order_by('order'), many=True).data,
            "visit_purposes": VisitPurposeSerializer(VisitPurpose.objects.all().order_by('order'), many=True).data,
            # 新規追加
            "occupations": OccupationSerializer(Occupation.objects.all().order_by('order'), many=True).data,
            "industries": IndustrySerializer(Industry.objects.all().order_by('order'), many=True).data,
            "positions": PositionSerializer(Position.objects.all().order_by('order'), many=True).data,
        }
        return Response(data, status=status.HTTP_200_OK)
```

### RegularsAnalysis 更新

**backend/shops/views.py (lines 1914-1930)**

```python
def analyze_occupation(self, regulars_list):
    """職業分析 - ForeignKey対応"""
    occupation_names = []
    for relation in regulars_list:
        if relation.user.occupation:  # ForeignKey なので .occupation でアクセス
            occupation_names.append(relation.user.occupation.name)  # .name で名前取得

    return self.create_distribution(occupation_names)

def analyze_industry(self, regulars_list):
    """業種分析 - ForeignKey対応"""
    industry_names = []
    for relation in regulars_list:
        if relation.user.industry:  # ForeignKey
            industry_names.append(relation.user.industry.name)  # .name で名前取得

    return self.create_distribution(industry_names)
```

### Admin 登録

**backend/accounts/admin.py**

```python
from .models import (
    # 既存...
    Occupation,
    Industry,
    Position,
)

@admin.register(Occupation)
class OccupationAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    ordering = ['order', 'name']


@admin.register(Industry)
class IndustryAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    ordering = ['order', 'name']


@admin.register(Position)
class PositionAdmin(admin.ModelAdmin):
    list_display = ['name', 'order', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['name']
    ordering = ['order', 'name']
```

---

## 🎨 5. Frontend 変更

### 型定義更新

**frontend/src/types/users.ts**

```typescript
// BaseTag インターフェースを使用（既に54-57行に定義済み）

// Occupation, Industry, Position 型を追加
export interface Occupation extends BaseTag {
  description?: string;
  order: number;
}

export interface Industry extends BaseTag {
  description?: string;
  order: number;
}

export interface Position extends BaseTag {
  description?: string;
  order: number;
}

// User インターフェース更新（lines 31-33）
export interface User {
  // ... 既存フィールド ...
  occupation: Occupation | null;  // string | null から変更
  industry: Industry | null;      // string | null から変更
  position: Position | null;      // string | null から変更
  // ... 既存フィールド ...
}

// ProfileOptions インターフェース更新（lines 149-188）
export interface ProfileOptions {
  // ... 既存フィールド ...
  occupations: Array<{ id: number; name: string; description?: string; order: number }>;
  industries: Array<{ id: number; name: string; description?: string; order: number }>;
  positions: Array<{ id: number; name: string; description?: string; order: number }>;
}

// PublicUserProfile インターフェース更新（lines 224-226）
export interface PublicUserProfile {
  // ... 既存フィールド ...
  occupation?: Occupation | null;  // string | null から変更
  industry?: Industry | null;      // string | null から変更
  position?: Position | null;      // string | null から変更
  // ... 既存フィールド ...
}
```

### DetailedProfile 更新

**frontend/src/components/Account/DetailedProfile/index.tsx (lines 588-640)**

職業・業種・役職の EditableField を EditableSelect に置き換え：

```typescript
{/* 職業 */}
<div className={styles.formRow}>
  <div className={styles.formLabel}>
    <Briefcase size={16} className={styles.labelIcon} strokeWidth={1} />
    <span>職業</span>
  </div>
  <EditableSelect
    value={userData.occupation?.id ? String(userData.occupation.id) : null}
    options={profileData.occupations || []}
    onSave={async (value) => {
      await updateProfile({ occupation_id: parseInt(value) });
      await refreshUserData();
    }}
    placeholder="職業を選択"
    visibilityControl={{
      isVisible: visibilitySettings?.occupation ?? true,
      onVisibilityChange: (value) => updateVisibilitySetting('occupation', value)
    }}
    className={styles.editableField}
  />
</div>

{/* 業種 */}
<div className={styles.formRow}>
  <div className={styles.formLabel}>
    <Building size={16} className={styles.labelIcon} strokeWidth={1} />
    <span>業種</span>
  </div>
  <EditableSelect
    value={userData.industry?.id ? String(userData.industry.id) : null}
    options={profileData.industries || []}
    onSave={async (value) => {
      await updateProfile({ industry_id: parseInt(value) });
      await refreshUserData();
    }}
    placeholder="業種を選択"
    visibilityControl={{
      isVisible: visibilitySettings?.industry ?? true,
      onVisibilityChange: (value) => updateVisibilitySetting('industry', value)
    }}
    className={styles.editableField}
  />
</div>

{/* 役職 */}
<div className={styles.formRow}>
  <div className={styles.formLabel}>
    <UserCircle size={16} className={styles.labelIcon} strokeWidth={1} />
    <span>役職</span>
  </div>
  <EditableSelect
    value={userData.position?.id ? String(userData.position.id) : null}
    options={profileData.positions || []}
    onSave={async (value) => {
      await updateProfile({ position_id: parseInt(value) });
      await refreshUserData();
    }}
    placeholder="役職を選択"
    visibilityControl={{
      isVisible: visibilitySettings?.position ?? true,
      onVisibilityChange: (value) => updateVisibilitySetting('position', value)
    }}
    className={styles.editableField}
  />
</div>
```

### Recommendation システム更新

**frontend/src/components/Account/DetailedProfile/index.tsx (lines 177-221)**

型チェックは自動的に動作するため、変更不要：

```typescript
// occupation, industry, position がnullの場合はfalsy判定されるため、
// 以下のコードはそのまま動作する
if (!userData.occupation || !userData.industry || !userData.position) {
  missingFields.push('仕事情報');
}
```

---

## 📁 既存ファイル活用

### 既存のデータ取得アクション（変更不要）

**frontend/src/actions/profile/fetchProfileOptions.ts**
- すでに `/accounts/profile-data/` エンドポイントを呼び出している
- Backend の ProfileDataView が occupations/industries/positions を返すようになれば、自動的に取得される
- **変更不要**

**frontend/src/actions/profile/fetchProfile.ts**
- `/accounts/users/me/` エンドポイントからユーザー情報取得
- UserSerializer が occupation/industry/position を object で返すようになる
- **変更不要**（型定義の更新のみで対応）

**frontend/src/actions/profile/updateProfileField.ts**
- `occupation_id`, `industry_id`, `position_id` を受け付けて PATCH リクエスト
- **変更不要**（既に汎用的な実装）

---

## 🧪 6. テスト計画

### Backend テスト
1. **モデルテスト**
   - Occupation, Industry, Position の作成・取得
   - UserAccount との ForeignKey 関係

2. **APIテスト**
   - ProfileDataView で occupations/industries/positions が返される
   - UserSerializer で occupation_id 経由の更新が動作
   - RegularsAnalysis API で occupation/industry 分布データが正しく返される

3. **マイグレーションテスト**
   - データクリアが正しく実行される
   - マスタデータが全件投入される
   - ForeignKey 関係が正しく設定される

### Frontend テスト
1. **コンポーネントテスト**
   - EditableSelect が正しく選択肢を表示
   - 保存時に正しい occupation_id/industry_id/position_id を送信

2. **統合テスト**
   - DetailedProfile での職業選択・保存フロー
   - RegularsAnalysisModal での職業分布表示
   - プロフィール公開設定が正しく機能

---

## 📝 7. 実装手順

### Phase 1: Backend 基盤構築
1. ✅ models.py に Occupation, Industry, Position 追加
2. ✅ マイグレーションファイル作成・実行
3. ✅ admin.py に登録
4. ✅ serializers.py 更新（新シリアライザー、UserSerializer、imports）
5. ✅ views.py 更新（ProfileDataView、RegularsAnalysis）
6. ✅ Backend 動作確認（Django Admin、API）

### Phase 2: Frontend 更新
7. ✅ types/users.ts 型定義更新
8. ✅ DetailedProfile で EditableSelect に置き換え
9. ✅ Frontend 動作確認（プロフィール編集、保存）

### Phase 3: 統合テスト・調整
10. ✅ E2E テスト（プロフィール編集フロー）
11. ✅ RegularsAnalysisModal 動作確認
12. ✅ 公開プロフィール表示確認
13. ✅ バグ修正・調整

### Phase 4: ドキュメント・完了
14. ✅ README 更新完了
15. ✅ 実装完了確認

---

## ⚠️ 注意事項

1. **データ消失に関する警告**
   - 既存の occupation/industry/position データは全て削除されます
   - ユーザーには再選択を促す必要があります（Recommendation システムで対応済み）

2. **公開設定の互換性**
   - ProfileVisibilitySettings モデルは変更不要（フィールド名は同じ）
   - PublicUserProfileSerializer の行399-404 のフィルタリングロジックはそのまま動作

3. **API レスポンス形式の変更**
   - occupation/industry/position が string から object に変更
   - Frontend の型定義更新で対応

4. **マイグレーション実行時の注意**
   - データが削除されるため、本番環境では事前告知が必要
   - マイグレーション実行後は Django サーバー再起動

---

## 🎯 期待される成果

✨ **データ品質向上**: 統一された職業名で統計分析の精度向上
✨ **UX改善**: 一貫した選択UI、入力ミス防止
✨ **管理性向上**: Django Admin で簡単にマスタデータ管理可能
✨ **拡張性**: 将来的なカテゴリ追加・変更が容易
✨ **既存機能の継続性**: RegularsAnalysisModal、プロフィール公開設定、全て正常動作

---

**実装完了チェックリスト**

Backend:
- [ ] models.py - Occupation/Industry/Position モデル追加
- [ ] models.py - UserAccount フィールド変更（CharField削除、ForeignKey追加）
- [ ] マイグレーションファイル作成・実行
- [ ] admin.py - Admin登録
- [ ] serializers.py - 新シリアライザー追加
- [ ] serializers.py - UserSerializer 更新
- [ ] views.py - ProfileDataView 更新
- [ ] views.py - RegularsAnalysis 更新

Frontend:
- [ ] types/users.ts - 型定義更新
- [ ] DetailedProfile - EditableSelect への置き換え

テスト:
- [ ] Django Admin でマスタデータ確認
- [ ] API で選択肢取得確認
- [ ] プロフィール編集・保存確認
- [ ] RegularsAnalysisModal 動作確認
- [ ] 公開プロフィール表示確認

---

以上、完璧な実装計画です！
