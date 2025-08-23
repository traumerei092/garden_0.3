from django.db import models
from django.contrib.gis.db import models as gis_models
from django.contrib.gis.geos import MultiPolygon, Point
from accounts.models import UserAccount, AlcoholCategory, AlcoholBrand, DrinkStyle
from django.conf import settings
import requests

class ShopType(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class ShopLayout(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

class ShopOption(models.Model):
    name = models.CharField(max_length=100)
    def __str__(self):
        return self.name

class ShopDrink(models.Model):
    """店舗が提供するドリンク"""
    shop = models.ForeignKey('Shop', on_delete=models.CASCADE, related_name='drinks')
    name = models.CharField(max_length=100, verbose_name='ドリンク名')
    alcohol_category = models.ForeignKey(AlcoholCategory, on_delete=models.CASCADE, null=True, blank=True, verbose_name='お酒のジャンル')
    alcohol_brand = models.ForeignKey(AlcoholBrand, on_delete=models.CASCADE, null=True, blank=True, verbose_name='お酒の銘柄')
    drink_style = models.ForeignKey(DrinkStyle, on_delete=models.CASCADE, null=True, blank=True, verbose_name='カクテル・飲み方')
    description = models.TextField(blank=True, verbose_name='説明')
    is_alcohol = models.BooleanField(default=True, verbose_name='アルコール含有')
    is_available = models.BooleanField(default=True, verbose_name='提供中')
    created_by = models.ForeignKey(UserAccount, on_delete=models.CASCADE, verbose_name='登録者')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['shop', 'name']  # 同一店舗内でのドリンク名重複防止
        ordering = ['-created_at']
        verbose_name = '店舗ドリンク'
        verbose_name_plural = '店舗ドリンク'

    def __str__(self):
        return f"{self.shop.name} - {self.name}"

class ShopDrinkReaction(models.Model):
    """ドリンクへの反応（いいね等）"""
    REACTION_CHOICES = [
        ('like', 'いいね'),
        ('want_to_try', '飲んでみたい'),
    ]
    
    drink = models.ForeignKey(ShopDrink, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=20, choices=REACTION_CHOICES, default='like')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['drink', 'user', 'reaction_type']
        verbose_name = 'ドリンク反応'
        verbose_name_plural = 'ドリンク反応'

    def __str__(self):
        return f"{self.user.name} - {self.drink.name} ({self.get_reaction_type_display()})"

# 支払方法モデル
class PaymentMethod(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

##############################################
# エリアモデル（地理空間データ対応）
##############################################
class Area(models.Model):
    """
    地理的エリアを管理するモデル
    階層構造をサポートし、ポリゴンジオメトリを保存
    """
    # 基本情報
    name = models.CharField("エリア名", max_length=100)
    name_kana = models.CharField("エリア名（カナ）", max_length=100, blank=True)
    area_type = models.CharField("エリアタイプ", max_length=20, choices=[
        ('prefecture', '都道府県'),
        ('city', '市区町村'),
        ('ward', '区'),
        ('district', '地区'),
        ('neighborhood', '町域'),
        ('custom', 'カスタムエリア'),
    ])
    
    # 階層構造
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='children',
        verbose_name="親エリア"
    )
    level = models.IntegerField("階層レベル", default=0, help_text="0:都道府県, 1:市区町村, 2:区, 3:地区, 4:町域")
    
    # 地理空間データ（SQLite互換・GeoDjango準備完了）
    geometry = models.TextField("ポリゴンジオメトリ", null=True, blank=True, help_text="GeoJSON形式のジオメトリデータ")
    center_point = models.TextField("中心点", null=True, blank=True, help_text="緯度,経度（カンマ区切り）")
    
    # GeoDjango本番用フィールド（PostGIS使用時に有効化）
    # geometry_geo = gis_models.MultiPolygonField("ポリゴンジオメトリ", null=True, blank=True, srid=4326, help_text="MultiPolygon形式の地理データ")
    # center_point_geo = gis_models.PointField("中心点", null=True, blank=True, srid=4326, help_text="エリアの中心座標")
    
    # 追加情報
    postal_code = models.CharField("郵便番号", max_length=10, blank=True)
    jis_code = models.CharField("JISコード", max_length=10, blank=True, help_text="行政区域コード")
    is_active = models.BooleanField("有効", default=True)
    
    # メタデータ
    created_at = models.DateTimeField("作成日", auto_now_add=True)
    updated_at = models.DateTimeField("更新日", auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='created_areas',
        verbose_name="作成者"
    )
    
    class Meta:
        verbose_name = "エリア"
        verbose_name_plural = "エリア"
        ordering = ['level', 'name']
        indexes = [
            models.Index(fields=['area_type', 'level']),
            models.Index(fields=['parent', 'is_active']),
        ]
        
    def __str__(self):
        return self.get_full_name()
    
    def get_full_name(self):
        """階層を含む完全名を取得"""
        if self.parent:
            return f"{self.parent.get_full_name()} > {self.name}"
        return self.name
    
    def get_ancestors(self):
        """祖先エリアのリストを取得"""
        ancestors = []
        current = self.parent
        while current:
            ancestors.insert(0, current)
            current = current.parent
        return ancestors
    
    def get_descendants(self):
        """子孫エリアのQuerySetを取得"""
        return Area.objects.filter(
            models.Q(parent=self) |
            models.Q(parent__parent=self) |
            models.Q(parent__parent__parent=self) |
            models.Q(parent__parent__parent__parent=self)
        )
    
    def contains_point(self, latitude, longitude):
        """指定された緯度経度がこのエリア内に含まれるかチェック"""
        if not self.geometry:
            return False
        
        try:
            import json
            from shapely.geometry import Point as ShapelyPoint, shape
            
            # GeoJSONからポリゴンを作成
            geometry_data = json.loads(self.geometry)
            polygon = shape(geometry_data)
            
            # 点を作成してポリゴンに含まれるかチェック
            point = ShapelyPoint(longitude, latitude)
            return polygon.contains(point)
            
        except Exception as e:
            print(f"Error checking point containment: {e}")
            return False
    
    @classmethod
    def find_areas_containing_point(cls, latitude, longitude):
        """指定された緯度経度を含むエリアを全て取得"""
        try:
            # 全エリアをチェック（最適化可能）
            matching_areas = []
            for area in cls.objects.filter(is_active=True, geometry__isnull=False).exclude(geometry__exact=''):
                if area.contains_point(latitude, longitude):
                    matching_areas.append(area.id)
            
            return cls.objects.filter(id__in=matching_areas).order_by('level')
            
        except Exception as e:
            print(f"Error finding areas containing point: {e}")
            return cls.objects.none()

# 店舗モデル
class Shop(models.Model):

    name = models.CharField(max_length=100)
    zip_code = models.CharField(max_length=10, blank=True, null=True)
    address = models.CharField(max_length=255)
    prefecture = models.CharField(max_length=100, blank=True, null=True)  # 例: 福岡県
    city = models.CharField(max_length=100, blank=True, null=True)        # 例: 福岡市
    street = models.CharField(max_length=100, blank=True, null=True)
    building = models.CharField(max_length=100, blank=True, null=True)
    area = models.CharField(max_length=100, blank=True, null=True)
    capacity = models.IntegerField(null=True, blank=True, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # 新しいフィールド
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    access = models.TextField(blank=True, null=True)  # アクセス情報
    
    # 位置情報フィールドを追加
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # エリア関連フィールド
    area = models.ForeignKey(
        Area, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='shops',
        verbose_name="所属エリア",
        help_text="店舗が所属する地理的エリア"
    )

    shop_types = models.ManyToManyField(ShopType, blank=True)
    shop_layouts = models.ManyToManyField(ShopLayout, blank=True)
    shop_options = models.ManyToManyField(ShopOption, blank=True)
    payment_methods = models.ManyToManyField(PaymentMethod, blank=True, related_name='shops')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_shops"
    )

    # 予算関連フィールド
    budget_weekday_min = models.IntegerField(null=True, blank=True, help_text="平日の最低予算")
    budget_weekday_max = models.IntegerField(null=True, blank=True, help_text="平日の最高予算")
    budget_weekend_min = models.IntegerField(null=True, blank=True, help_text="週末の最低予算")
    budget_weekend_max = models.IntegerField(null=True, blank=True, help_text="週末の最高予算")
    budget_note = models.TextField(blank=True, null=True, help_text="予算に関する補足情報")

    class Meta:
        db_table = 'shops'
        ordering = ['created_at']
        unique_together = (('name', 'address'),)

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # 緯度経度が未設定で、住所情報がある場合のみ実行
        if (self.latitude is None or self.longitude is None) and self.address:
            try:
                # 住所を結合して完全な住所文字列を作成
                full_address = f"{self.prefecture or ''} {self.city or ''} {self.street or ''}"

                # Google Maps Geocoding APIを使用して緯度経度を取得
                api_url = "https://maps.googleapis.com/maps/api/geocode/json"
                params = {
                    'address': full_address,
                    'key': settings.GOOGLE_MAPS_API_KEY,
                    'language': 'ja',
                    'region': 'jp',  # 日本地域を優先
                }

                response = requests.get(api_url, params=params)
                if response.status_code == 200:
                    data = response.json()
                    if data['status'] == 'OK' and data['results']:
                        # 最も関連性の高い結果を使用
                        location = data['results'][0]['geometry']['location']
                        self.latitude = location['lat']
                        self.longitude = location['lng']
                        print(f"Geocoding success for '{self.name}': {self.latitude}, {self.longitude}")
                    else:
                        print(f"Geocoding failed for '{self.name}': {data.get('status', 'Unknown error')}")
            except Exception as e:
                print(f"Geocoding error: {e}")

        # エリアの自動判定（緯度経度が設定されている場合）
        if self.latitude is not None and self.longitude is not None and self.area is None:
            try:
                # 緯度経度を含む最も詳細なエリアを取得
                areas = Area.find_areas_containing_point(self.latitude, self.longitude)
                if areas.exists():
                    # 最も詳細なレベル（最大のlevel値）のエリアを選択
                    self.area = areas.order_by('-level').first()
                    print(f"Shop '{self.name}' assigned to area: {self.area.get_full_name()}")
            except Exception as e:
                print(f"Area auto-detection error: {e}")

        super().save(*args, **kwargs)

# 営業時間
class BusinessHour(models.Model):
    WEEKDAY_CHOICES = [
        ('mon', '月曜日'),
        ('tue', '火曜日'),
        ('wed', '水曜日'),
        ('thu', '木曜日'),
        ('fri', '金曜日'),
        ('sat', '土曜日'),
        ('sun', '日曜日'),
        ('hol', '祝日'),
    ]

    shop = models.ForeignKey(
        Shop, 
        on_delete=models.CASCADE, 
        related_name='business_hours'
    )
    weekday = models.CharField(
        max_length=3, 
        choices=WEEKDAY_CHOICES
    )
    open_time = models.TimeField(null=True, blank=True)
    close_time = models.TimeField(null=True, blank=True)
    is_closed = models.BooleanField(default=False)

    class Meta:
        unique_together = ['shop', 'weekday']
        ordering = ['weekday']

    def __str__(self):
        return f"{self.shop.name} - {self.get_weekday_display()}"

##############################################
# 店舗画像データ
##############################################
class ShopImage(models.Model):
    shop = models.ForeignKey(Shop, related_name="images", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="shop_images/", null=True, blank=True)
    caption = models.CharField(max_length=255, blank=True)
    is_icon = models.BooleanField(default=False)  # 一覧などで使用するアイコン画像用
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.shop.name} - {self.caption or 'No Caption'}"

##############################################
# 店舗編集履歴
##############################################
class ShopEditHistory(models.Model):
    """店舗情報の編集履歴を記録するモデル"""
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='edit_histories')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='shop_edit_histories')
    field_name = models.CharField(max_length=100, help_text="編集されたフィールド名")
    old_value = models.TextField(blank=True, null=True, help_text="変更前の値")
    new_value = models.TextField(blank=True, null=True, help_text="変更後の値")
    edited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-edited_at']

    def __str__(self):
        return f"{self.shop.name} - {self.field_name} edited by {self.user.email if self.user else 'Unknown'}"

##############################################
# 編集履歴への評価
##############################################
class HistoryEvaluation(models.Model):
    """編集履歴に対する評価を記録するモデル"""
    class EvaluationType(models.TextChoices):
        GOOD = 'GOOD', 'Good'
        BAD = 'BAD', 'Bad'

    history = models.ForeignKey(ShopEditHistory, on_delete=models.CASCADE, related_name='evaluations')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='history_evaluations')
    evaluation = models.CharField(max_length=4, choices=EvaluationType.choices)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('history', 'user') # 1ユーザー1評価

    def __str__(self):
        return f"{self.user.email} evaluated {self.history_id} as {self.evaluation}"

##############################################
# 店舗口コミ
##############################################
class ShopReview(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='reviews')
    visit_purpose = models.ForeignKey(
        'accounts.VisitPurpose', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='reviews'
    )
    comment = models.TextField()
    likes_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review by {self.user.name} on {self.shop.name}"

##############################################
# 店舗口コミに対する「役に立った」
##############################################
class ShopReviewLike(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    review = models.ForeignKey(ShopReview, on_delete=models.CASCADE, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'review')

    def __str__(self):
        return f"{self.user.name} liked review {self.review.id}"

##############################################
# ユーザーと店舗とのリレーションオプションテーブル（気になる、行った、閲覧履歴 etc.）
##############################################
class RelationType(models.Model):
    name = models.CharField(max_length=50)
    label = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    sort_order = models.IntegerField(default=0)
    color = models.CharField(max_length=10, blank=True)

##############################################
# ユーザーと店舗とのリレーション
##############################################
class UserShopRelation(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    relation_type = models.ForeignKey(RelationType, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

##############################################
# 店舗への印象／共感タグ
##############################################
class ShopTag(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='tags')
    value = models.CharField(max_length=100)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_tags'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['shop', 'value']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.shop.name} - {self.value}"

    @property
    def reaction_count(self):
        return self.reactions.count()

##############################################
# 店舗タグへの共感ステータス管理
##############################################
class ShopTagReaction(models.Model):
    shop_tag = models.ForeignKey(ShopTag, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='tag_reactions')
    reacted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['shop_tag', 'user']
        ordering = ['-reacted_at']

    def __str__(self):
        return f"{self.user.email} - {self.shop_tag.value}"

##############################################
# 店舗からのメッセージ
##############################################
class ShopMessage(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

##############################################
# 店舗スタッフ紹介
##############################################
class ShopStaff(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=100)
    message = models.TextField(blank=True)
    image = models.ImageField(upload_to='staff_photos/', null=True, blank=True)

##############################################
# 雰囲気マッピングの指標
##############################################
class AtmosphereIndicator(models.Model):
    """
    雰囲気マッピングの指標を管理するマスターモデル
    例：「会話のスタイル」「お店の活気」など
    """
    name = models.CharField("指標名", max_length=100, unique=True)
    description_left = models.CharField("左端の表現", max_length=100, help_text="スコア-2の表現 例：静かに過ごす")
    description_right = models.CharField("右端の表現", max_length=100, help_text="スコア+2の表現 例：会話を楽しむ")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

##############################################
# 店舗の雰囲気評価（ユーザーからの評価を集計）
##############################################
class ShopAtmosphereRating(models.Model):
    """
    店舗の雰囲気評価（ユーザーからの評価を集計）
    """
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE, related_name='atmosphere_ratings')
    indicator = models.ForeignKey(AtmosphereIndicator, on_delete=models.CASCADE)
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    score = models.IntegerField(
        "評価スコア",
        help_text="-2から+2の範囲で評価"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ('shop', 'indicator', 'user')
        verbose_name = "店舗雰囲気評価"
        verbose_name_plural = "店舗雰囲気評価"

    def __str__(self):
        return f"{self.shop.name} - {self.indicator.name}: {self.score}"
