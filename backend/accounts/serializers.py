from rest_framework import serializers
from django.contrib.auth import get_user_model
from garden.utils import Base64ImageField
from .models import (
    InterestCategory,
    Interest,
    BloodType,
    MBTI,
    Alcohol,
    Hobby,
    ExerciseHabit,
    SocialPreference,
)

User = get_user_model()


# --- Profile Tag Serializers ---

class InterestCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = InterestCategory
        fields = "__all__"


class InterestSerializer(serializers.ModelSerializer):
    category = InterestCategorySerializer(read_only=True)
    
    class Meta:
        model = Interest
        fields = "__all__"


class BloodTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BloodType
        fields = "__all__"


class MBTISerializer(serializers.ModelSerializer):
    class Meta:
        model = MBTI
        fields = "__all__"


class AlcoholSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alcohol
        fields = "__all__"


class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobby
        fields = "__all__"


class ExerciseHabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseHabit
        fields = "__all__"


class SocialPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialPreference
        fields = "__all__"


# ユーザー情報のシリアライザ
class UserSerializer(serializers.ModelSerializer):
    uid = serializers.CharField(read_only=True)
    avatar = Base64ImageField(max_length=None, use_url=True, required=False, allow_null=True)
    interests = InterestSerializer(many=True, read_only=True)
    blood_type = BloodTypeSerializer(read_only=True)
    mbti = MBTISerializer(read_only=True)
    alcohols = AlcoholSerializer(many=True, read_only=True)
    hobbies = HobbySerializer(many=True, read_only=True)
    exercise_habits = ExerciseHabitSerializer(many=True, read_only=True)
    social_preferences = SocialPreferenceSerializer(many=True, read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "uid",
            "email",
            "name",
            "avatar",
            "introduction",
            "gender",
            "birthdate",
            "work_info",
            "interests",
            "blood_type",
            "mbti",
            "alcohols",
            "hobbies",
            "exercise_habits",
            "social_preferences",
            "updated_at",
            "created_at",
        )
