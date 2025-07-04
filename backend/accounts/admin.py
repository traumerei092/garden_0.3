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
        "interests",
        "alcohols",
        "hobbies",
        "exercise_habits",
        "social_preferences",
    )


admin.site.register(User, UserAdminCustom)

# Register new profile models to admin site
admin.site.register(InterestCategory)
admin.site.register(Interest)
admin.site.register(BloodType)
admin.site.register(MBTI)
admin.site.register(Alcohol)
admin.site.register(Hobby)
admin.site.register(ExerciseHabit)
admin.site.register(SocialPreference)
