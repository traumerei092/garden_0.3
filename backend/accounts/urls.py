from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserDetailView,
    
    ProfileDataView,
)

router = DefaultRouter()


urlpatterns = [
    # プロフィール選択肢データ
    path("profile-data/", ProfileDataView.as_view(), name="profile-data"),
    # 認証済みユーザーのプロフィール詳細・更新
    path("users/me/", UserDetailView.as_view(), name="user-me-detail"),
    # ユーザー詳細（uidで検索）
    path("users/<str:uid>/", UserDetailView.as_view(), name="user-detail"),
    # ViewSet のルーティング
    path("", include(router.urls)),
]
