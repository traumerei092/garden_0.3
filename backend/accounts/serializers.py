from rest_framework import serializers
from django.contrib.auth import get_user_model
from garden.utils import Base64ImageField
from .models import (
    InterestCategory,
    Interest,
    BloodType,
    MBTI,
    Alcohol,
    AlcoholCategory,
    AlcoholBrand,
    DrinkStyle,
    Hobby,
    ExerciseHabit,
    SocialPreference,
    UserAtmospherePreference,
    ExerciseFrequency,
    DietaryPreference,
    BudgetRange,
    VisitPurpose,
)
from shops.models import AtmosphereIndicator

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


class AlcoholCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AlcoholCategory
        fields = "__all__"


class AlcoholBrandSerializer(serializers.ModelSerializer):
    category = AlcoholCategorySerializer(read_only=True)
    
    class Meta:
        model = AlcoholBrand
        fields = "__all__"


class DrinkStyleSerializer(serializers.ModelSerializer):
    category = AlcoholCategorySerializer(read_only=True)
    
    class Meta:
        model = DrinkStyle
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


class ExerciseFrequencySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExerciseFrequency
        fields = "__all__"


class DietaryPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = DietaryPreference
        fields = "__all__"


class BudgetRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetRange
        fields = "__all__"


class VisitPurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitPurpose
        fields = "__all__"


# --- Atmosphere Serializers ---

class AtmosphereIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = AtmosphereIndicator
        fields = "__all__"


class UserAtmospherePreferenceSerializer(serializers.ModelSerializer):
    indicator = AtmosphereIndicatorSerializer(read_only=True)
    indicator_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = UserAtmospherePreference
        fields = ["id", "indicator", "indicator_id", "score"]


# ユーザー情報のシリアライザ
class UserSerializer(serializers.ModelSerializer):
    uid = serializers.CharField(read_only=True)
    avatar = Base64ImageField(max_length=None, use_url=True, required=False, allow_null=True)
    interests = InterestSerializer(many=True, read_only=True)
    blood_type = BloodTypeSerializer(read_only=True)
    mbti = MBTISerializer(read_only=True)
    alcohols = AlcoholSerializer(many=True, read_only=True)
    alcohol_categories = AlcoholCategorySerializer(many=True, read_only=True)
    alcohol_brands = AlcoholBrandSerializer(many=True, read_only=True)
    drink_styles = DrinkStyleSerializer(many=True, read_only=True)
    hobbies = HobbySerializer(many=True, read_only=True)
    exercise_habits = ExerciseHabitSerializer(many=True, read_only=True)
    social_preferences = SocialPreferenceSerializer(many=True, read_only=True)
    exercise_frequency = ExerciseFrequencySerializer(read_only=True)
    dietary_preference = DietaryPreferenceSerializer(read_only=True)
    budget_range = BudgetRangeSerializer(read_only=True)
    visit_purposes = VisitPurposeSerializer(many=True, read_only=True)
    
    # 書き込み用のフィールド
    blood_type_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    mbti_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    exercise_frequency_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    dietary_preference_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    budget_range_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

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
            "occupation",
            "industry",
            "position",
            "exercise_frequency",
            "exercise_frequency_id",
            "dietary_preference",
            "dietary_preference_id",
            "budget_range",
            "budget_range_id",
            "visit_purposes",
            "interests",
            "blood_type",
            "blood_type_id",
            "mbti",
            "mbti_id",
            "alcohols",
            "alcohol_categories",
            "alcohol_brands",
            "drink_styles",
            "hobbies",
            "exercise_habits",
            "social_preferences",
            "updated_at",
            "created_at",
        )
    
    def update(self, instance, validated_data):
        # blood_type_idが提供された場合、blood_typeを設定
        if 'blood_type_id' in validated_data:
            blood_type_id = validated_data.pop('blood_type_id')
            if blood_type_id:
                try:
                    instance.blood_type = BloodType.objects.get(id=blood_type_id)
                except BloodType.DoesNotExist:
                    pass
            else:
                instance.blood_type = None
        
        # mbti_idが提供された場合、mbtiを設定
        if 'mbti_id' in validated_data:
            mbti_id = validated_data.pop('mbti_id')
            if mbti_id:
                try:
                    instance.mbti = MBTI.objects.get(id=mbti_id)
                except MBTI.DoesNotExist:
                    pass
            else:
                instance.mbti = None
        
        # exercise_frequency_idが提供された場合、exercise_frequencyを設定
        if 'exercise_frequency_id' in validated_data:
            exercise_frequency_id = validated_data.pop('exercise_frequency_id')
            if exercise_frequency_id:
                try:
                    instance.exercise_frequency = ExerciseFrequency.objects.get(id=exercise_frequency_id)
                except ExerciseFrequency.DoesNotExist:
                    pass
            else:
                instance.exercise_frequency = None
        
        # dietary_preference_idが提供された場合、dietary_preferenceを設定
        if 'dietary_preference_id' in validated_data:
            dietary_preference_id = validated_data.pop('dietary_preference_id')
            if dietary_preference_id:
                try:
                    instance.dietary_preference = DietaryPreference.objects.get(id=dietary_preference_id)
                except DietaryPreference.DoesNotExist:
                    pass
            else:
                instance.dietary_preference = None
        
        # budget_range_idが提供された場合、budget_rangeを設定
        if 'budget_range_id' in validated_data:
            budget_range_id = validated_data.pop('budget_range_id')
            if budget_range_id:
                try:
                    instance.budget_range = BudgetRange.objects.get(id=budget_range_id)
                except BudgetRange.DoesNotExist:
                    pass
            else:
                instance.budget_range = None
        
        # その他のフィールドを更新
        return super().update(instance, validated_data)
