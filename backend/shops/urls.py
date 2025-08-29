from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ShopViewSet, ShopTypeViewSet, ShopLayoutViewSet, ShopOptionViewSet, 
    PaymentMethodViewSet, ShopReviewViewSet, ShopCreateViewSet, 
    ShopTagViewSet, ShopTagReactionViewSet, ShopImageViewSet,
    ShopUpdateAPIView, ShopEditHistoryListAPIView, HistoryEvaluationAPIView,
    ReviewLikeAPIView, UserShopRelationViewSet, RelationTypeViewSet,
    AreaViewSet, RegularsSnapshotAPIView, RegularsDetailedAnalysisAPIView
)
from .views_drink import ShopDrinkViewSet

router = DefaultRouter()
router.register(r'shops', ShopViewSet, basename='shop')
router.register(r'shop-types', ShopTypeViewSet)
router.register(r'shop-layouts', ShopLayoutViewSet)
router.register(r'shop-options', ShopOptionViewSet)
router.register(r'payment-methods', PaymentMethodViewSet)
router.register(r'shop-create', ShopCreateViewSet, basename='shop-create')
router.register(r'shop-tags', ShopTagViewSet, basename='shoptag')
router.register(r'shop-tag-reactions', ShopTagReactionViewSet)
router.register(r'shop-images', ShopImageViewSet)
router.register(r'relation-types', RelationTypeViewSet)
router.register(r'user-shop-relations', UserShopRelationViewSet, basename='user-shop-relation')
router.register(r'shop-drinks', ShopDrinkViewSet, basename='shop-drink')
router.register(r'areas', AreaViewSet, basename='area')

urlpatterns = [
    path('', include(router.urls)),
    path('shops/<int:shop_pk>/reviews/', ShopReviewViewSet.as_view({'get': 'list', 'post': 'create'}), name='shop-reviews'),
    path('shops/<int:shop_pk>/reviews/<int:pk>/', ShopReviewViewSet.as_view({'get': 'retrieve', 'put': 'update', 'delete': 'destroy'}), name='shop-review-detail'),
    path('reviews/<int:review_pk>/like/', ReviewLikeAPIView.as_view(), name='review-like'),
    path('shops/<int:pk>/update/', ShopUpdateAPIView.as_view(), name='shop-update'),
    path('shops/<int:pk>/history/', ShopEditHistoryListAPIView.as_view(), name='shop-history-list'),
    path('history/<int:pk>/evaluate/', HistoryEvaluationAPIView.as_view(), name='history-evaluate'),
    
    # 常連客分析API
    path('shops/<int:shop_id>/regulars/snapshot/', RegularsSnapshotAPIView.as_view(), name='regulars-snapshot'),
    path('shops/<int:shop_id>/regulars/analysis/', RegularsDetailedAnalysisAPIView.as_view(), name='regulars-analysis'),
]
