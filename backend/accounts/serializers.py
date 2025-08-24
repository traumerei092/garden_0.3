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
    ProfileVisibilitySettings,
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
    
    # エリア関連フィールド（詳細情報付き）
    my_areas = serializers.SerializerMethodField()
    primary_area = serializers.SerializerMethodField()
    
    # 書き込み用のフィールド
    blood_type_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    mbti_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    exercise_frequency_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    dietary_preference_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    budget_range_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    primary_area_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

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
            "my_areas",
            "primary_area",
            "primary_area_id",
            "updated_at",
            "created_at",
        )
    
    def update(self, instance, validated_data):
        # birthdateの空文字列をNoneに変換
        if 'birthdate' in validated_data:
            if validated_data['birthdate'] == '' or validated_data['birthdate'] == 'null':
                validated_data['birthdate'] = None
        
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
        
        # primary_area_idが提供された場合、primary_areaを設定
        if 'primary_area_id' in validated_data:
            primary_area_id = validated_data.pop('primary_area_id')
            if primary_area_id:
                try:
                    from shops.models import Area
                    instance.primary_area = Area.objects.get(id=primary_area_id)
                except Area.DoesNotExist:
                    pass
            else:
                instance.primary_area = None
        
        # その他のフィールドを更新
        return super().update(instance, validated_data)
    
    def get_my_areas(self, obj):
        """マイエリアの詳細情報を取得"""
        from shops.serializers import AreaSerializer
        return AreaSerializer(obj.my_areas.all(), many=True).data
    
    def get_primary_area(self, obj):
        """プライマリエリアの詳細情報を取得"""
        if obj.primary_area:
            from shops.serializers import AreaSerializer
            return AreaSerializer(obj.primary_area).data
        return None


class ProfileVisibilitySettingsSerializer(serializers.ModelSerializer):
    """
    プロフィール公開設定のシリアライザー
    """
    class Meta:
        model = ProfileVisibilitySettings
        fields = [
            'age', 'my_area', 'interests', 'blood_type', 'mbti',
            'occupation', 'industry', 'position', 'alcohol_preferences',
            'hobbies', 'exercise_frequency', 'dietary_preference',
            'atmosphere_preferences', 'visit_purposes'
        ]


class PublicUserProfileSerializer(serializers.ModelSerializer):
    """
    他のユーザーから見たプロフィール用のシリアライザー
    公開設定に応じて項目を表示/非表示
    """
    uid = serializers.CharField(read_only=True)
    avatar = Base64ImageField(max_length=None, use_url=True, required=False, allow_null=True)
    age = serializers.SerializerMethodField()
    
    # 関連フィールド
    interests = InterestSerializer(many=True, read_only=True)
    blood_type = BloodTypeSerializer(read_only=True)
    mbti = MBTISerializer(read_only=True)
    alcohol_categories = AlcoholCategorySerializer(many=True, read_only=True)
    alcohol_brands = AlcoholBrandSerializer(many=True, read_only=True)
    drink_styles = DrinkStyleSerializer(many=True, read_only=True)
    hobbies = HobbySerializer(many=True, read_only=True)
    exercise_frequency = ExerciseFrequencySerializer(read_only=True)
    dietary_preference = DietaryPreferenceSerializer(read_only=True)
    visit_purposes = VisitPurposeSerializer(many=True, read_only=True)
    atmosphere_preferences = UserAtmospherePreferenceSerializer(many=True, read_only=True)
    my_areas = serializers.SerializerMethodField()
    primary_area = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'uid', 'name', 'avatar', 'introduction', 'gender', 'age',
            'my_areas', 'primary_area', 'interests', 'blood_type', 'mbti', 'occupation', 'industry', 'position',
            'alcohol_categories', 'alcohol_brands', 'drink_styles', 'hobbies',
            'exercise_frequency', 'dietary_preference', 'atmosphere_preferences',
            'visit_purposes'
        ]
    
    def get_age(self, obj):
        """年齢を計算して返す"""
        if obj.birthdate:
            from datetime import date
            today = date.today()
            age = today.year - obj.birthdate.year - ((today.month, today.day) < (obj.birthdate.month, obj.birthdate.day))
            return age
        return None
    
    def get_my_areas(self, obj):
        """マイエリアを取得して返す"""
        from shops.serializers import AreaSerializer
        my_areas = obj.my_areas.all().select_related('parent').order_by('level', 'name')
        return AreaSerializer(my_areas, many=True).data
    
    def get_primary_area(self, obj):
        """プライマリエリアを取得して返す"""
        from shops.serializers import AreaSerializer
        if obj.primary_area:
            return AreaSerializer(obj.primary_area).data
        return None
    
    def to_representation(self, instance):
        """
        公開設定に応じてフィールドをフィルタリング
        """
        data = super().to_representation(instance)
        
        # 公開設定を取得
        visibility_settings = getattr(instance, 'visibility_settings', None)
        
        if visibility_settings:
            # 非公開に設定されている項目を削除
            if not visibility_settings.age:
                data.pop('age', None)
            if not visibility_settings.my_area:
                data.pop('my_areas', None)
                data.pop('primary_area', None)
            if not visibility_settings.interests:
                data.pop('interests', None)
            if not visibility_settings.blood_type:
                data.pop('blood_type', None)
            if not visibility_settings.mbti:
                data.pop('mbti', None)
            if not visibility_settings.occupation:
                data.pop('occupation', None)
            if not visibility_settings.industry:
                data.pop('industry', None)
            if not visibility_settings.position:
                data.pop('position', None)
            if not visibility_settings.alcohol_preferences:
                data.pop('alcohol_categories', None)
                data.pop('alcohol_brands', None)
                data.pop('drink_styles', None)
            if not visibility_settings.hobbies:
                data.pop('hobbies', None)
            if not visibility_settings.exercise_frequency:
                data.pop('exercise_frequency', None)
            if not visibility_settings.dietary_preference:
                data.pop('dietary_preference', None)
            if not visibility_settings.atmosphere_preferences:
                data.pop('atmosphere_preferences', None)
            if not visibility_settings.visit_purposes:
                data.pop('visit_purposes', None)
        
        return data


class MyAreasUpdateSerializer(serializers.Serializer):
    """
    マイエリア更新用シリアライザー
    """
    my_area_ids = serializers.ListField(
        child=serializers.IntegerField(),
        max_length=10,
        required=False,
        allow_empty=True,
        help_text="マイエリアのIDリスト（最大10個）"
    )
    primary_area_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="プライマリエリアのID"
    )
    
    def validate_my_area_ids(self, value):
        """マイエリアIDの検証"""
        if len(value) > 10:
            raise serializers.ValidationError("マイエリアは最大10個まで選択できます")
        
        # エリアの存在確認
        from shops.models import Area
        valid_ids = Area.objects.filter(id__in=value, is_active=True).values_list('id', flat=True)
        invalid_ids = set(value) - set(valid_ids)
        
        if invalid_ids:
            raise serializers.ValidationError(f"無効なエリアIDが含まれています: {list(invalid_ids)}")
        
        return value
    
    def validate_primary_area_id(self, value):
        """プライマリエリアIDの検証"""
        if value is not None:
            from shops.models import Area
            if not Area.objects.filter(id=value, is_active=True).exists():
                raise serializers.ValidationError("無効なプライマリエリアIDです")
        return value
    
    def validate(self, data):
        """全体の検証"""
        my_area_ids = data.get('my_area_ids', [])
        primary_area_id = data.get('primary_area_id')
        
        # プライマリエリアがマイエリアに含まれているかチェック
        if primary_area_id is not None and primary_area_id not in my_area_ids:
            raise serializers.ValidationError("プライマリエリアはマイエリアの中から選択してください")
        
        return data
    
    def update_user_areas(self, user, validated_data):
        """ユーザーのエリア情報を更新"""
        my_area_ids = validated_data.get('my_area_ids', [])
        primary_area_id = validated_data.get('primary_area_id')
        
        # マイエリアの更新
        if 'my_area_ids' in validated_data:
            from shops.models import Area
            areas = Area.objects.filter(id__in=my_area_ids)
            user.my_areas.set(areas)
        
        # プライマリエリアの更新
        if 'primary_area_id' in validated_data:
            if primary_area_id:
                from shops.models import Area
                user.primary_area = Area.objects.get(id=primary_area_id)
            else:
                user.primary_area = None
            user.save()
        
        return user
