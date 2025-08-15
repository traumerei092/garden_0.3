from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    PermissionsMixin,
    BaseUserManager,
)
from django.db.models.signals import post_save
from django.dispatch import receiver
from hashids import Hashids


# カスタムユーザーマネージャークラス
class UserManager(BaseUserManager):
    # 通常ユーザー作成メソッド
    def create_user(self, email, password=None, **extra_fields):
        # メールアドレスの検証
        if not email:
            raise ValueError("メールアドレスは必須です")

        # メールアドレスの正規化
        email = self.normalize_email(email).lower()

        # ユーザーオブジェクトの作成と保存
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()

        return user

    # スーパーユーザー作成メソッド
    def create_superuser(self, email, password=None, **extra_fields):
        user = self.create_user(email, password, **extra_fields)
        user.is_superuser = True
        user.is_staff = True
        user.save()

        return user


# カスタムユーザーアカウントモデル
class UserAccount(AbstractBaseUser, PermissionsMixin):
    uid = models.CharField("uid", max_length=30, unique=True)
    email = models.EmailField("メールアドレス", max_length=255, unique=True)
    name = models.CharField("名前", max_length=255, blank=True, null=True)
    avatar = models.ImageField(
        upload_to="avatar", verbose_name="プロフィール画像", null=True, blank=True
    )
    introduction = models.TextField("自己紹介", null=True, blank=True)
    gender = models.CharField(max_length=20, blank=True)
    birthdate = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField("更新日", auto_now=True)
    created_at = models.DateTimeField("作成日", auto_now_add=True)

    # アクティブ状態とスタッフ権限フィールド
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    # ユーザーマネージャーと認証フィールドの設定
    objects = UserManager()
    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["name"]

    class Meta:
        verbose_name = "ユーザーアカウント"
        verbose_name_plural = "ユーザーアカウント"

    def __str__(self):
        return self.name if self.name else "No Name"

    def get_short_name(self):
        """Returns the short name for the user."""
        return self.name or self.email

    def get_full_name(self):
        """Returns the full name for the user."""
        return self.name or self.email

# アカウントが作成された後に実行されるシグナルレシーバー
@receiver(post_save, sender=UserAccount)
def generate_random_user_uid(sender, instance, created, **kwargs):
    # 新規作成時にランダムUIDを生成
    if created and not instance.uid:
        hashids = Hashids(salt="xRXSMT8XpzdUbDNM9qkv6JzUezU64D4Z", min_length=8)
        instance.uid = hashids.encode(instance.id)
        instance.save()

# Create your models here.

# --- Profile Models ---

class BaseTag(models.Model):
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.name

# --- Interest Models ---

class InterestCategory(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "興味カテゴリ"
        verbose_name_plural = "興味カテゴリ"

class Interest(BaseTag):
    category = models.ForeignKey(InterestCategory, on_delete=models.CASCADE, related_name='interests')

    class Meta:
        verbose_name = "興味"
        verbose_name_plural = "興味"
        unique_together = ['name', 'category']

# --- Personality Models ---

class BloodType(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "血液型"
        verbose_name_plural = "血液型"

class MBTI(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "MBTI"
        verbose_name_plural = "MBTI"

# --- Lifestyle Models ---

class Alcohol(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "好きなお酒・ドリンク"
        verbose_name_plural = "好きなお酒・ドリンク"

class AlcoholCategory(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "お酒のジャンル"
        verbose_name_plural = "お酒のジャンル"

class AlcoholBrand(BaseTag):
    category = models.ForeignKey(AlcoholCategory, on_delete=models.CASCADE, related_name='brands')

    class Meta:
        verbose_name = "お酒の銘柄"
        verbose_name_plural = "お酒の銘柄"
        unique_together = ['name', 'category']

class DrinkStyle(BaseTag):
    category = models.ForeignKey(AlcoholCategory, on_delete=models.CASCADE, related_name='drink_styles')

    class Meta:
        verbose_name = "カクテル・飲み方"
        verbose_name_plural = "カクテル・飲み方"
        unique_together = ['name', 'category']

class Hobby(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "趣味"
        verbose_name_plural = "趣味"

class ExerciseHabit(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "運動"
        verbose_name_plural = "運動"

class ExerciseFrequency(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = "運動頻度"
        verbose_name_plural = "運動頻度"
        ordering = ['order']

class DietaryPreference(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    
    class Meta:
        verbose_name = "食事制限・好み"
        verbose_name_plural = "食事制限・好み"

class BudgetRange(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    min_price = models.IntegerField(null=True, blank=True)
    max_price = models.IntegerField(null=True, blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = "希望予算"
        verbose_name_plural = "希望予算"
        ordering = ['order']

class VisitPurpose(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    order = models.IntegerField(default=0)
    
    class Meta:
        verbose_name = "利用目的"
        verbose_name_plural = "利用目的"
        ordering = ['order']

# --- Social Models ---

class SocialPreference(BaseTag):
    name = models.CharField(max_length=100, unique=True)
    
    class Meta:
        verbose_name = "交友関係"
        verbose_name_plural = "交友関係"


# --- Update UserAccount Model ---

UserAccount.add_to_class(
    'work_info',
    models.TextField("仕事情報", null=True, blank=True)
)
UserAccount.add_to_class(
    'occupation',
    models.CharField("職業", max_length=100, blank=True, null=True)
)
UserAccount.add_to_class(
    'industry',
    models.CharField("業種", max_length=100, blank=True, null=True)
)
UserAccount.add_to_class(
    'position',
    models.CharField("役職", max_length=100, blank=True, null=True)
)
UserAccount.add_to_class(
    'exercise_frequency',
    models.ForeignKey(ExerciseFrequency, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'dietary_preference',
    models.ForeignKey(DietaryPreference, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'budget_range',
    models.ForeignKey(BudgetRange, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'visit_purposes',
    models.ManyToManyField(VisitPurpose, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'interests',
    models.ManyToManyField(Interest, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'blood_type',
    models.ForeignKey(BloodType, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'mbti',
    models.ForeignKey(MBTI, on_delete=models.SET_NULL, null=True, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'alcohols',
    models.ManyToManyField(Alcohol, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'alcohol_categories',
    models.ManyToManyField(AlcoholCategory, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'alcohol_brands',
    models.ManyToManyField(AlcoholBrand, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'drink_styles',
    models.ManyToManyField(DrinkStyle, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'hobbies',
    models.ManyToManyField(Hobby, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'exercise_habits',
    models.ManyToManyField(ExerciseHabit, blank=True, related_name='users')
)
UserAccount.add_to_class(
    'social_preferences',
    models.ManyToManyField(SocialPreference, blank=True, related_name='users')
)

# --- Atmosphere Preference Models ---

class UserAtmospherePreference(models.Model):
    """
    ユーザーが設定した雰囲気の「好み」を指標ごとに保存する中間テーブル
    """
    user_profile = models.ForeignKey(UserAccount, on_delete=models.CASCADE, related_name='atmosphere_preferences')
    # 下の行は、shopsアプリのAtmosphereIndicatorモデルを参照します。
    # 実際のコードでは、_上のコメントアウトを削除して有効にしてください。
    indicator = models.ForeignKey('shops.AtmosphereIndicator', on_delete=models.CASCADE)
    score = models.IntegerField(
        "好みのスコア",
        help_text="-2から+2の範囲で設定"
    )
    
    class Meta:
        unique_together = ('user_profile', 'indicator')
        verbose_name = "ユーザー雰囲気好み"
        verbose_name_plural = "ユーザー雰囲気好み"

    def __str__(self):
        return f"{self.user_profile.name} - {self.indicator.name}: {self.score}"


# --- Profile Visibility Settings Model ---

class ProfileVisibilitySettings(models.Model):
    """
    ユーザーのプロフィール公開/非公開設定を管理するモデル
    各項目ごとに公開設定を制御できます
    """
    user = models.OneToOneField(
        UserAccount, 
        on_delete=models.CASCADE, 
        related_name='visibility_settings',
        verbose_name="ユーザー"
    )
    
    # 常に公開される項目: header_image, avatar, introduction, name, gender
    # 以下は設定可能な項目
    age = models.BooleanField("年齢公開", default=True)
    interests = models.BooleanField("興味公開", default=True)
    blood_type = models.BooleanField("血液型公開", default=True)
    mbti = models.BooleanField("MBTI公開", default=True)
    occupation = models.BooleanField("職業公開", default=True)
    industry = models.BooleanField("業種公開", default=True)
    position = models.BooleanField("役職公開", default=True)
    alcohol_preferences = models.BooleanField("お酒の好み公開", default=True)
    hobbies = models.BooleanField("趣味公開", default=True)
    exercise_frequency = models.BooleanField("運動頻度公開", default=True)
    dietary_preference = models.BooleanField("食事制限・好み公開", default=True)
    atmosphere_preferences = models.BooleanField("雰囲気の好み公開", default=True)
    visit_purposes = models.BooleanField("利用目的公開", default=True)
    
    created_at = models.DateTimeField("作成日", auto_now_add=True)
    updated_at = models.DateTimeField("更新日", auto_now=True)
    
    class Meta:
        verbose_name = "プロフィール公開設定"
        verbose_name_plural = "プロフィール公開設定"
    
    def __str__(self):
        return f"{self.user.name}の公開設定"


# プロフィール公開設定の自動作成シグナル
@receiver(post_save, sender=UserAccount)
def create_profile_visibility_settings(sender, instance, created, **kwargs):
    """
    ユーザー作成時にデフォルトのプロフィール公開設定を作成
    """
    if created:
        ProfileVisibilitySettings.objects.create(user=instance)
