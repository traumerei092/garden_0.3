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

# ユーザータグ
class UserTag(models.Model):
    name = models.CharField(max_length=100)

# ユーザーとユーザータグの紐付けテーブル
class UserUserTag(models.Model):
    user = models.ForeignKey(UserAccount, on_delete=models.CASCADE)
    user_tag = models.ForeignKey(UserTag, on_delete=models.CASCADE)

# Create your models here.

