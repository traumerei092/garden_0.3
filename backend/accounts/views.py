from django.contrib.auth import get_user_model, authenticate
from rest_framework.generics import RetrieveUpdateAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import (
    UserSerializer,
    InterestSerializer,
    BloodTypeSerializer,
    MBTISerializer,
    AlcoholSerializer,
    AlcoholCategorySerializer,
    AlcoholBrandSerializer,
    DrinkStyleSerializer,
    HobbySerializer,
    ExerciseHabitSerializer,
    SocialPreferenceSerializer,
    AtmosphereIndicatorSerializer,
    UserAtmospherePreferenceSerializer,
    ExerciseFrequencySerializer,
    DietaryPreferenceSerializer,
    BudgetRangeSerializer,
    VisitPurposeSerializer,
    ProfileVisibilitySettingsSerializer,
    PublicUserProfileSerializer,
)
from .models import (
    Interest,
    BloodType,
    MBTI,
    Alcohol,
    AlcoholCategory,
    AlcoholBrand,
    DrinkStyle,
    Hobby,
    ExerciseHabit,
    SocialPreference,
    UserAtmospherePreference,
    ExerciseFrequency,
    DietaryPreference,
    BudgetRange,
    VisitPurpose,
    ProfileVisibilitySettings,
)
from shops.models import AtmosphereIndicator

User = get_user_model()


# ユーザー詳細・更新
class UserDetailView(RetrieveUpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        # 認証されているユーザーのオブジェクトを返す
        return self.request.user


# プロフィール選択肢データ
class ProfileDataView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, *args, **kwargs):
        data = {
            "interests": InterestSerializer(Interest.objects.all(), many=True).data,
            "blood_types": BloodTypeSerializer(BloodType.objects.all(), many=True).data,
            "mbti_types": MBTISerializer(MBTI.objects.all(), many=True).data,
            "alcohols": AlcoholSerializer(Alcohol.objects.all(), many=True).data,
            "alcohol_categories": AlcoholCategorySerializer(AlcoholCategory.objects.all(), many=True).data,
            "alcohol_brands": AlcoholBrandSerializer(AlcoholBrand.objects.all(), many=True).data,
            "drink_styles": DrinkStyleSerializer(DrinkStyle.objects.all(), many=True).data,
            "hobbies": HobbySerializer(Hobby.objects.all(), many=True).data,
            "exercise_habits": ExerciseHabitSerializer(
                ExerciseHabit.objects.all(), many=True
            ).data,
            "social_preferences": SocialPreferenceSerializer(
                SocialPreference.objects.all(), many=True
            ).data,
            "exercise_frequencies": ExerciseFrequencySerializer(
                ExerciseFrequency.objects.all().order_by('order'), many=True
            ).data,
            "dietary_preferences": DietaryPreferenceSerializer(
                DietaryPreference.objects.all(), many=True
            ).data,
            "budget_ranges": BudgetRangeSerializer(
                BudgetRange.objects.all().order_by('order'), many=True
            ).data,
            "visit_purposes": VisitPurposeSerializer(
                VisitPurpose.objects.all().order_by('order'), many=True
            ).data,
        }
        return Response(data, status=status.HTTP_200_OK)


# パスワード変更
class ChangePasswordView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')

        if not current_password or not new_password:
            return Response(
                {'error': '現在のパスワードと新しいパスワードを入力してください'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 現在のパスワードを確認
        if not user.check_password(current_password):
            return Response(
                {'error': '現在のパスワードが正しくありません'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 新しいパスワードを設定
        user.set_password(new_password)
        user.save()

        return Response(
            {'message': 'パスワードを変更しました'},
            status=status.HTTP_200_OK
        )


# 興味更新
class UpdateInterestsView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        print("--- UpdateInterestsView received data:", request.data)  # この行を追加
        user = request.user
        interest_ids = request.data.get('interests', [])

        try:
            # 既存の興味をクリア
            user.interests.clear()
            
            # 新しい興味を設定
            if interest_ids:
                interests = Interest.objects.filter(id__in=interest_ids)
                user.interests.set(interests)
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': '興味の更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# 交友関係の好み更新
class UpdateSocialPreferencesView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        preference_ids = request.data.get('social_preferences', [])

        try:
            # 既存の交友関係の好みをクリア
            user.social_preferences.clear()
            
            # 新しい交友関係の好みを設定
            if preference_ids:
                preferences = SocialPreference.objects.filter(id__in=preference_ids)
                user.social_preferences.set(preferences)
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': '交友関係の好みの更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# お酒のジャンル更新
class UpdateAlcoholCategoriesView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        category_ids = request.data.get('alcohol_categories', [])

        try:
            # 既存のお酒のジャンルをクリア
            user.alcohol_categories.clear()
            
            # 新しいお酒のジャンルを設定
            if category_ids:
                categories = AlcoholCategory.objects.filter(id__in=category_ids)
                user.alcohol_categories.set(categories)
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'お酒のジャンルの更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# お酒の銘柄更新
class UpdateAlcoholBrandsView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        brand_ids = request.data.get('alcohol_brands', [])

        try:
            # 既存のお酒の銘柄をクリア
            user.alcohol_brands.clear()
            
            # 新しいお酒の銘柄を設定
            if brand_ids:
                brands = AlcoholBrand.objects.filter(id__in=brand_ids)
                user.alcohol_brands.set(brands)
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'お酒の銘柄の更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# 飲み方・カクテル更新
class UpdateDrinkStylesView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        style_ids = request.data.get('drink_styles', [])

        try:
            # 既存の飲み方・カクテルをクリア
            user.drink_styles.clear()
            
            # 新しい飲み方・カクテルを設定
            if style_ids:
                styles = DrinkStyle.objects.filter(id__in=style_ids)
                user.drink_styles.set(styles)
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': '飲み方・カクテルの更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# 雰囲気指標一覧取得
class AtmosphereIndicatorsView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, *args, **kwargs):
        indicators = AtmosphereIndicator.objects.all()
        serializer = AtmosphereIndicatorSerializer(indicators, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


# ユーザーの雰囲気好み取得・更新
class UserAtmospherePreferencesView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        """ユーザーの雰囲気好みを取得"""
        user = request.user
        preferences = UserAtmospherePreference.objects.filter(user_profile=user)
        serializer = UserAtmospherePreferenceSerializer(preferences, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, *args, **kwargs):
        """ユーザーの雰囲気好みを更新"""
        user = request.user
        preferences_data = request.data.get('preferences', [])

        try:
            # 既存の雰囲気好みをクリア
            UserAtmospherePreference.objects.filter(user_profile=user).delete()
            
            # 新しい雰囲気好みを作成
            for pref_data in preferences_data:
                indicator_id = pref_data.get('indicator_id')
                score = pref_data.get('score')
                
                if indicator_id is not None and score is not None:
                    try:
                        indicator = AtmosphereIndicator.objects.get(id=indicator_id)
                        UserAtmospherePreference.objects.create(
                            user_profile=user,
                            indicator=indicator,
                            score=score
                        )
                    except AtmosphereIndicator.DoesNotExist:
                        continue
            
            # 更新された雰囲気好みを返す
            preferences = UserAtmospherePreference.objects.filter(user_profile=user)
            serializer = UserAtmospherePreferenceSerializer(preferences, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': '雰囲気好みの更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# 来店目的一覧取得
class VisitPurposesListView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, *args, **kwargs):
        """来店目的一覧を取得"""
        try:
            visit_purposes = VisitPurpose.objects.all().order_by('order')
            serializer = VisitPurposeSerializer(visit_purposes, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': '来店目的リストの取得に失敗しました'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# 来店目的更新
class UpdateVisitPurposesView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        purpose_ids = request.data.get('visit_purposes', [])

        try:
            # 既存の来店目的をクリア
            user.visit_purposes.clear()
            
            # 新しい来店目的を設定
            if purpose_ids:
                purposes = VisitPurpose.objects.filter(id__in=purpose_ids)
                user.visit_purposes.set(purposes)
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': '来店目的の更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# 趣味更新
class UpdateHobbiesView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        hobby_names = request.data.get('hobby_names', [])

        try:
            # 既存の趣味をクリア
            user.hobbies.clear()
            
            # 新しい趣味を設定
            if hobby_names:
                hobbies = []
                for name in hobby_names:
                    if name.strip():  # 空文字列をチェック
                        hobby, created = Hobby.objects.get_or_create(name=name.strip())
                        hobbies.append(hobby)
                user.hobbies.set(hobbies)
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"趣味更新エラー: {e}")
            return Response(
                {'error': '趣味の更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# プロフィール画像更新
class UpdateProfileImageView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        avatar = request.FILES.get('avatar')

        if not avatar:
            return Response(
                {'error': '画像ファイルが必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # アバター画像を更新
            user.avatar = avatar
            user.save()
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"プロフィール画像更新エラー: {e}")
            return Response(
                {'error': '画像の更新に失敗しました'},
                status=status.HTTP_400_BAD_REQUEST
            )


# 公開ユーザープロフィール取得
class PublicUserProfileView(APIView):
    """
    他のユーザーから見たプロフィール情報を取得するAPI
    公開設定に応じて項目をフィルタリング
    """
    permission_classes = (AllowAny,)

    def get(self, request, uid, *args, **kwargs):
        """指定されたUIDのユーザーの公開プロフィールを取得"""
        try:
            user = User.objects.select_related(
                'visibility_settings', 'blood_type', 'mbti', 
                'exercise_frequency', 'dietary_preference'
            ).prefetch_related(
                'interests__category', 'alcohol_categories', 'alcohol_brands__category',
                'drink_styles__category', 'hobbies', 'visit_purposes',
                'atmosphere_preferences__indicator'
            ).get(uid=uid)
            
            serializer = PublicUserProfileSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            return Response(
                {'error': 'ユーザーが見つかりません'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'プロフィールの取得に失敗しました'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# プロフィール公開設定取得・更新
class ProfileVisibilitySettingsView(APIView):
    """
    プロフィール公開設定の取得・更新API
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        """現在のプロフィール公開設定を取得"""
        try:
            settings, created = ProfileVisibilitySettings.objects.get_or_create(
                user=request.user
            )
            serializer = ProfileVisibilitySettingsSerializer(settings)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': '公開設定の取得に失敗しました'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, *args, **kwargs):
        """プロフィール公開設定を更新"""
        try:
            settings, created = ProfileVisibilitySettings.objects.get_or_create(
                user=request.user
            )
            serializer = ProfileVisibilitySettingsSerializer(
                settings, data=request.data, partial=True
            )
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(
                    serializer.errors, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return Response(
                {'error': '公開設定の更新に失敗しました'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# プレビュー用プロフィール取得
class PreviewUserProfileView(APIView):
    """
    自分のプロフィールが他のユーザーからどう見えるかをプレビューするAPI
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        """自分のプロフィールをプレビュー"""
        try:
            user = User.objects.select_related(
                'visibility_settings', 'blood_type', 'mbti', 
                'exercise_frequency', 'dietary_preference'
            ).prefetch_related(
                'interests__category', 'alcohol_categories', 'alcohol_brands__category',
                'drink_styles__category', 'hobbies', 'visit_purposes',
                'atmosphere_preferences__indicator'
            ).get(id=request.user.id)
            
            serializer = PublicUserProfileSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'プレビューの取得に失敗しました'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
