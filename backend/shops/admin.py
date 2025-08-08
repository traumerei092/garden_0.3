from django.contrib import admin
from .models import (
    Shop, ShopType, ShopLayout, ShopOption, 
    BusinessHour, ShopImage, ShopTag, ShopTagReaction,
    UserShopRelation, RelationType, PaymentMethod,
    AtmosphereIndicator, ShopAtmosphereRating,
    ShopDrink, ShopDrinkReaction
)

# 雰囲気指標の管理画面設定
@admin.register(AtmosphereIndicator)
class AtmosphereIndicatorAdmin(admin.ModelAdmin):
    list_display = ('name', 'description_left', 'description_right', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description_left', 'description_right')
    readonly_fields = ('created_at', 'updated_at')

# 店舗雰囲気評価の管理画面設定
@admin.register(ShopAtmosphereRating)
class ShopAtmosphereRatingAdmin(admin.ModelAdmin):
    list_display = ('shop', 'indicator', 'user', 'score', 'created_at')
    list_filter = ('indicator', 'score')
    search_fields = ('shop__name', 'indicator__name', 'user__name')
    readonly_fields = ('created_at',)

# 店舗ドリンクの管理画面設定
@admin.register(ShopDrink)
class ShopDrinkAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'is_alcohol', 'alcohol_category', 'alcohol_brand', 'drink_style', 'is_available', 'created_by', 'created_at')
    list_filter = ('is_alcohol', 'is_available', 'alcohol_category', 'alcohol_brand', 'drink_style', 'created_at')
    search_fields = ('name', 'shop__name', 'description', 'created_by__username')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('shop', 'created_by', 'alcohol_category', 'alcohol_brand', 'drink_style')
    
    fieldsets = (
        ('基本情報', {
            'fields': ('name', 'shop', 'description', 'created_by')
        }),
        ('ドリンク詳細', {
            'fields': ('is_alcohol', 'alcohol_category', 'alcohol_brand', 'drink_style')
        }),
        ('ステータス', {
            'fields': ('is_available',)
        }),
        ('日時情報', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

# ドリンクリアクションの管理画面設定
@admin.register(ShopDrinkReaction)
class ShopDrinkReactionAdmin(admin.ModelAdmin):
    list_display = ('drink', 'user', 'reaction_type', 'created_at')
    list_filter = ('reaction_type', 'created_at')
    search_fields = ('drink__name', 'user__username')
    readonly_fields = ('created_at',)
    autocomplete_fields = ('drink', 'user')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('drink', 'user')

# 店舗の管理画面設定を改善
@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'capacity', 'created_at')
    list_filter = ('created_at', 'capacity')
    search_fields = ('name', 'address', 'prefecture', 'city')
    readonly_fields = ('created_at',)
    filter_horizontal = ('shop_types', 'shop_layouts', 'shop_options', 'payment_methods')

# Register your models here.
admin.site.register(ShopType)
admin.site.register(ShopLayout)
admin.site.register(ShopOption)
admin.site.register(BusinessHour)
admin.site.register(ShopImage)
admin.site.register(ShopTag)
admin.site.register(ShopTagReaction)
admin.site.register(UserShopRelation)
admin.site.register(RelationType)
admin.site.register(PaymentMethod)
