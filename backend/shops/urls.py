from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'shop-types', ShopTypeViewSet)
router.register(r'shop-layouts', ShopLayoutViewSet)
router.register(r'shop-options', ShopOptionViewSet)
router.register(r'shop-update-logs', ShopUpdateLogViewSet)
router.register(r'shop-update-reactions', ShopUpdateReactionViewSet)
router.register(r'shop-reviews', ShopReviewViewSet)
router.register(r'shop-review-reactions', ShopReviewReactionViewSet)
router.register(r'relation-types', RelationTypeViewSet)
router.register(r'user-shop-relations', UserShopRelationViewSet, basename='user-shop-relation')
router.register(r'shop-create', ShopCreateViewSet, basename='shop-create')
router.register(r'shop-tags', ShopTagViewSet)
router.register(r'shop-tag-reactions', ShopTagReactionViewSet)
router.register(r'shop-images', ShopImageViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
