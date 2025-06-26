from django.contrib import admin
from .models import (
    Shop, ShopType, ShopLayout, ShopOption, 
    BusinessHour, ShopImage, ShopTag, ShopTagReaction,
    UserShopRelation, RelationType, PaymentMethod
)

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
