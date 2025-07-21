from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.contrib.auth import get_user_model
from .models import (
    InterestCategory,
    Interest,
    BloodType,
    MBTI,
    Alcohol,
    Hobby,
    ExerciseHabit,
    SocialPreference,
    AlcoholCategory,
    AlcoholBrand,
    DrinkStyle,
    UserAtmospherePreference,
    ExerciseFrequency,
    DietaryPreference,
    BudgetRange,
    VisitPurpose,
)

User = get_user_model()


class UserAdminCustom(UserAdmin):
    # 詳細
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "uid",
                    "name",
                    "email",
                    "password",
                    "avatar",
                    "introduction",
                    "gender",
                    "birthdate",
                    "work_info",
                    "occupation",
                    "industry",
                    "position",
                    "exercise_frequency",
                    "dietary_preference",
                    "budget_range",
                    "visit_purposes",
                    "interests",
                    "blood_type",
                    "mbti",
                    "alcohols",
                    "hobbies",
                    "exercise_habits",
                    "social_preferences",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "updated_at",
                    "created_at",
                )
            },
        ),
    )

    # 追加
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "name",
                    "email",
                    "password1",
                    "password2",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                ),
            },
        ),
    )

    # 一覧
    list_display = (
        "uid",
        "name",
        "email",
        "is_active",
        "updated_at",
        "created_at",
    )

    list_filter = ()
    # 検索
    search_fields = (
        "uid",
        "email",
    )
    # 順番
    ordering = ("updated_at",)
    # リンク
    list_display_links = ("uid", "name", "email")
    # 編集不可
    readonly_fields = ("updated_at", "created_at", "uid")
    # ManyToMany
    filter_horizontal = (
        "visit_purposes",
        "interests",
        "alcohols",
        "hobbies",
        "exercise_habits",
        "social_preferences",
    )


admin.site.register(User, UserAdminCustom)

# ユーザー雰囲気好みの管理画面設定
@admin.register(UserAtmospherePreference)
class UserAtmospherePreferenceAdmin(admin.ModelAdmin):
    list_display = ('user_profile', 'indicator', 'score')
    list_filter = ('indicator', 'score')
    search_fields = ('user_profile__name', 'user_profile__email', 'indicator__name')

# Register new profile models to admin site
admin.site.register(InterestCategory)
admin.site.register(Interest)
admin.site.register(BloodType)
admin.site.register(MBTI)
admin.site.register(Alcohol)
admin.site.register(Hobby)
admin.site.register(ExerciseHabit)
admin.site.register(SocialPreference)

# お酒関連のモデルを管理画面に登録
admin.site.register(AlcoholCategory)
admin.site.register(AlcoholBrand)
admin.site.register(DrinkStyle)

# 新しいプロフィール関連のモデルを管理画面に登録
admin.site.register(ExerciseFrequency)
admin.site.register(DietaryPreference)
admin.site.register(BudgetRange)
admin.site.register(VisitPurpose)
