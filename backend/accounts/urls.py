from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserDetailView,
    ProfileDataView,
    ChangePasswordView,
    UpdateInterestsView,
    UpdateSocialPreferencesView,
    UpdateAlcoholCategoriesView,
    UpdateAlcoholBrandsView,
    UpdateDrinkStylesView,
    AtmosphereIndicatorsView,
    UserAtmospherePreferencesView,
    UpdateVisitPurposesView,
)

router = DefaultRouter()


urlpatterns = [
    # プロフィール選択肢データ
    path("profile-data/", ProfileDataView.as_view(), name="profile-data"),
    # 認証済みユーザーのプロフィール詳細・更新
    path("users/me/", UserDetailView.as_view(), name="user-me-detail"),
    # ユーザー詳細（uidで検索）
    path("users/<str:uid>/", UserDetailView.as_view(), name="user-detail"),
    # パスワード変更
    path("change-password/", ChangePasswordView.as_view(), name="change-password"),
    # 興味更新
    path("update-interests/", UpdateInterestsView.as_view(), name="update-interests"),
    # 交友関係の好み更新
    path("update-social-preferences/", UpdateSocialPreferencesView.as_view(), name="update-social-preferences"),
    # お酒のジャンル更新
    path("update-alcohol-categories/", UpdateAlcoholCategoriesView.as_view(), name="update-alcohol-categories"),
    # お酒の銘柄更新
    path("update-alcohol-brands/", UpdateAlcoholBrandsView.as_view(), name="update-alcohol-brands"),
    # 飲み方・カクテル更新
    path("update-drink-styles/", UpdateDrinkStylesView.as_view(), name="update-drink-styles"),
    # 雰囲気指標一覧取得
    path("atmosphere-indicators/", AtmosphereIndicatorsView.as_view(), name="atmosphere-indicators"),
    # ユーザーの雰囲気好み取得・更新
    path("atmosphere-preferences/", UserAtmospherePreferencesView.as_view(), name="atmosphere-preferences"),
    # 来店目的更新
    path("update-visit-purposes/", UpdateVisitPurposesView.as_view(), name="update-visit-purposes"),
    # ViewSet のルーティング
    path("", include(router.urls)),
]
