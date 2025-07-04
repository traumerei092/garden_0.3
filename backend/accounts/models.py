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
    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True

    def __str__(self):
        return self.name

# --- Interest Models ---

class InterestCategory(BaseTag):
    class Meta:
        verbose_name = "興味カテゴリ"
        verbose_name_plural = "興味カテゴリ"

class Interest(BaseTag):
    category = models.ForeignKey(InterestCategory, on_delete=models.CASCADE, related_name='interests')

    class Meta:
        verbose_name = "興味"
        verbose_name_plural = "興味"

# --- Personality Models ---

class BloodType(BaseTag):
    class Meta:
        verbose_name = "血液型"
        verbose_name_plural = "血液型"

class MBTI(BaseTag):
    class Meta:
        verbose_name = "MBTI"
        verbose_name_plural = "MBTI"

# --- Lifestyle Models ---

class Alcohol(BaseTag):
    class Meta:
        verbose_name = "好きなお酒・ドリンク"
        verbose_name_plural = "好きなお酒・ドリンク"

class Hobby(BaseTag):
    class Meta:
        verbose_name = "趣味"
        verbose_name_plural = "趣味"

class ExerciseHabit(BaseTag):
    class Meta:
        verbose_name = "運動"
        verbose_name_plural = "運動"

# --- Social Models ---

class SocialPreference(BaseTag):
    class Meta:
        verbose_name = "交友関係"
        verbose_name_plural = "交友関係"


# --- Update UserAccount Model ---

UserAccount.add_to_class(
    'work_info',
    models.TextField("仕事情報", null=True, blank=True)
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

