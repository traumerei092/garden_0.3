from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'shop-types', ShopTypeViewSet)
router.register(r'shop-layouts', ShopLayoutViewSet)
router.register(r'shop-options', ShopOptionViewSet)
router.register(r'payment-methods', PaymentMethodViewSet)

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
    path('shops/<int:pk>/update/', ShopUpdateAPIView.as_view(), name='shop-update'),
    path('shops/<int:pk>/history/', ShopEditHistoryListAPIView.as_view(), name='shop-history-list'),
    path('history/<int:pk>/evaluate/', HistoryEvaluationAPIView.as_view(), name='history-evaluate'),
]
