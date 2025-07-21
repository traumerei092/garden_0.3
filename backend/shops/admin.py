from django.contrib import admin
from .models import (
    Shop, ShopType, ShopLayout, ShopOption, 
    BusinessHour, ShopImage, ShopTag, ShopTagReaction,
    UserShopRelation, RelationType, PaymentMethod,
    AtmosphereIndicator, ShopAtmosphereRating
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

# Register your models here.
admin.site.register(Shop)
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
