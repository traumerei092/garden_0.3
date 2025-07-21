from django.db import models
from accounts.models import UserAccount
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

class DrinkCategory(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name

def get_default_category():
    # マイグレーション後、"未分類" を自動作成してそのIDを返す
    from .models import DrinkCategory  # ここでimport（循環インポート防止）
    return DrinkCategory.objects.get_or_create(name="未分類")[0].id

class ShopDrink(models.Model):
    name = models.CharField(max_length=100)
    category = models.ForeignKey(
        DrinkCategory,
        on_delete=models.CASCADE,
        related_name='drinks',
        default=get_default_category,  # 未分類が自動セットされる
    )

    def __str__(self):
        return self.name

# 支払方法モデル
class PaymentMethod(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

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

    shop_types = models.ManyToManyField(ShopType, blank=True)
    shop_layouts = models.ManyToManyField(ShopLayout, blank=True)
    shop_options = models.ManyToManyField(ShopOption, blank=True)
    payment_methods = models.ManyToManyField(PaymentMethod, blank=True, related_name='shops')

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="created_shops"
    )

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

                # OpenCage Geocoding APIを使用して緯度経度を取得
                api_url = "https://api.opencagedata.com/geocode/v1/json"
                params = {
                    'q': full_address,
                    'key': settings.OPENCAGE_API_KEY,
                    'language': 'ja',
                }

                response = requests.get(api_url, params=params)
                if response.status_code == 200:
                    results = response.json().get('results', [])
                    if results:
                        # 最も関連性の高い結果を使用
                        location = results[0]['geometry']
                        self.latitude = location['lat']
                        self.longitude = location['lng']
            except Exception as e:
                print(f"Geocoding error: {e}")

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
# 店舗データの履歴管理
##############################################
class ShopUpdateLog(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    updated_column = models.CharField(max_length=100)
    old_value = models.TextField()
    new_value = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

##############################################
# 店舗履歴データに対するリアクション
##############################################
class ShopUpdateReaction(models.Model):
    shop_update_log = models.ForeignKey(ShopUpdateLog, on_delete=models.CASCADE)
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10)  # GOOD or BAD
    reacted_at = models

##############################################
# 店舗口コミ
##############################################
class ShopReview(models.Model):
    shop = models.ForeignKey(Shop, on_delete=models.CASCADE)
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    comment = models.TextField()
    rating = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

##############################################
# 店舗口コミに対するリアクション
##############################################
class ShopReviewReaction(models.Model):
    shop_review = models.ForeignKey(ShopReview, on_delete=models.CASCADE)
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    reaction_type = models.CharField(max_length=10)  # GOOD or BAD
    reacted_at = models.DateTimeField(auto_now_add=True)

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
