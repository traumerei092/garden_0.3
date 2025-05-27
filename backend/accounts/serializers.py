from rest_framework import serializers
from django.contrib.auth import get_user_model
from garden.utils import Base64ImageField
from .models import UserTag, UserUserTag

User = get_user_model()


# ユーザー情報のシリアライザ
class UserSerializer(serializers.ModelSerializer):
    # uidフィールドは読み取り専用
    uid = serializers.CharField(read_only=True)
    # Base64エンコードされた画像を受け入れるカスタムフィールド
    avatar = Base64ImageField(
        max_length=None, use_url=True, required=False, allow_null=True
    )

    class Meta:
        model = User
        fields = "__all__"

class UserTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserTag
        fields = "__all__"

class UserUserTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserUserTag
        fields = "__all__"