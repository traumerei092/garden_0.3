from django.contrib import admin
from .models import *

models_to_register = [
    ShopType, ShopLayout, ShopOption, Shop,
    ShopUpdateLog, ShopUpdateReaction, ShopReview, ShopReviewReaction,
    RelationType, UserShopRelation, ShopTag, ShopTagReaction,
    ShopMessage, ShopStaff, ShopImage, BusinessHour,
]

for model in models_to_register:
    admin.site.register(model)