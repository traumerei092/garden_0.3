from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserDetailView, UserTagViewSet, UserUserTagViewSet

router = DefaultRouter()
router.register(r"user-tags", UserTagViewSet, basename="user-tag")
router.register(r"user-user-tags", UserUserTagViewSet, basename="user-user-tag")

urlpatterns = [
    # ユーザー詳細（uidで検索）
    path("users/<str:uid>/", UserDetailView.as_view(), name="user-detail"),

    # ViewSet のルーティング
    path("", include(router.urls)),
]
