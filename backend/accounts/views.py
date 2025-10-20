from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags
from django.conf import settings
import random
import string
from datetime import timedelta
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
    OccupationSerializer,
    IndustrySerializer,
    PositionSerializer,
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
    MyAreasUpdateSerializer,
)
from .models import (
    Interest,
    BloodType,
    MBTI,
    Occupation,
    Industry,
    Position,
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
    EmailChangeOTP,
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
            "occupations": OccupationSerializer(Occupation.objects.all().order_by('order'), many=True).data,
            "industries": IndustrySerializer(Industry.objects.all().order_by('order'), many=True).data,
            "positions": PositionSerializer(Position.objects.all().order_by('order'), many=True).data,
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

        # パスワード変更通知メールを送信
        try:
            context = {
                'user': user
            }

            html_message = render_to_string('accounts/reset_password.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject='パスワード変更のお知らせ',
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=True,  # パスワード変更は成功したので、メール送信失敗でもエラーにしない
            )
        except Exception:
            pass  # 通知メール送信失敗は無視

        return Response(
            {'message': 'パスワードを変更しました'},
            status=status.HTTP_200_OK
        )


def generate_otp():
    """6桁のOTPコードを生成"""
    return ''.join(random.choices(string.digits, k=6))


# メールアドレス変更OTP送信
class SendEmailChangeOTPView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        current_password = request.data.get('current_password')
        new_email = request.data.get('new_email')

        if not current_password or not new_email:
            return Response(
                {'error': '現在のパスワードと新しいメールアドレスを入力してください'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 現在のパスワードを確認
        if not user.check_password(current_password):
            return Response(
                {'error': '現在のパスワードが正しくありません'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 新しいメールアドレスが現在のものと同じかチェック
        if user.email == new_email:
            return Response(
                {'error': '現在のメールアドレスと同じメールアドレスは使用できません'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 新しいメールアドレスが既に使用されているかチェック
        if User.objects.filter(email=new_email).exists():
            return Response(
                {'error': 'このメールアドレスは既に使用されています'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 既存のOTPを削除
        EmailChangeOTP.objects.filter(user=user).delete()

        # 新しいOTPを生成
        otp_code = generate_otp()
        expires_at = timezone.now() + timedelta(minutes=10)  # 10分間有効

        otp = EmailChangeOTP.objects.create(
            user=user,
            new_email=new_email,
            otp_code=otp_code,
            expires_at=expires_at
        )

        # OTPをメールで送信
        try:
            context = {
                'user': user,
                'otp_code': otp_code,
                'new_email': new_email,
                'expires_minutes': 10
            }

            html_message = render_to_string('accounts/email_change_otp.html', context)
            plain_message = strip_tags(html_message)

            send_mail(
                subject='メールアドレス変更の確認コード',
                message=plain_message,
                html_message=html_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[new_email],
                fail_silently=False,
            )

            return Response(
                {'message': 'OTPコードを新しいメールアドレスに送信しました'},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            # OTPレコードを削除
            otp.delete()
            return Response(
                {'error': 'メール送信に失敗しました'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# メールアドレス変更OTP検証
class VerifyEmailChangeOTPView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        user = request.user
        new_email = request.data.get('new_email')
        otp = request.data.get('otp')

        if not new_email or not otp:
            return Response(
                {'error': 'メールアドレスとOTPコードを入力してください'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # OTPを取得
            otp_record = EmailChangeOTP.objects.get(
                user=user,
                new_email=new_email,
                otp_code=otp,
                is_verified=False
            )

            # OTPが期限切れかチェック
            if otp_record.is_expired():
                otp_record.delete()
                return Response(
                    {'error': 'OTPコードの有効期限が切れています'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # メールアドレスを更新
            old_email = user.email
            user.email = new_email
            user.save()

            # OTPを認証済みに変更
            otp_record.is_verified = True
            otp_record.save()

            # 古いメールアドレスに変更通知を送信
            try:
                context = {
                    'user': user,
                    'old_email': old_email,
                    'new_email': new_email
                }

                html_message = render_to_string('accounts/email_change_notification.html', context)
                plain_message = strip_tags(html_message)

                send_mail(
                    subject='メールアドレス変更のお知らせ',
                    message=plain_message,
                    html_message=html_message,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[old_email],
                    fail_silently=True,  # 古いメールアドレスへの送信は失敗してもエラーにしない
                )
            except Exception:
                pass  # 通知メール送信失敗は無視

            return Response(
                {'message': 'メールアドレスを変更しました'},
                status=status.HTTP_200_OK
            )

        except EmailChangeOTP.DoesNotExist:
            return Response(
                {'error': 'OTPコードが正しくありません'},
                status=status.HTTP_400_BAD_REQUEST
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
        print(f"プロフィール画像更新リクエスト - ユーザー: {request.user.email}")
        print(f"受信ファイル: {request.FILES}")
        
        user = request.user
        avatar = request.FILES.get('avatar')

        if not avatar:
            print("エラー: 画像ファイルが見つかりません")
            return Response(
                {'error': '画像ファイルが必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"アップロード画像情報: name={avatar.name}, size={avatar.size}, content_type={avatar.content_type}")

        try:
            # アバター画像を更新
            user.avatar = avatar
            user.save()
            print(f"画像更新成功: {user.avatar.url if user.avatar else 'None'}")
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"プロフィール画像更新エラー: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'画像の更新に失敗しました: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


# ヘッダー画像更新
class UpdateHeaderImageView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        print(f"ヘッダー画像更新リクエスト - ユーザー: {request.user.email}")
        print(f"受信ファイル: {request.FILES}")
        
        user = request.user
        header_image = request.FILES.get('header_image')

        if not header_image:
            print("エラー: ヘッダー画像ファイルが見つかりません")
            return Response(
                {'error': 'ヘッダー画像ファイルが必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        print(f"アップロードヘッダー画像情報: name={header_image.name}, size={header_image.size}, content_type={header_image.content_type}")

        try:
            # ヘッダー画像を更新
            user.header_image = header_image
            user.save()
            print(f"ヘッダー画像更新成功: {user.header_image.url if user.header_image else 'None'}")
            
            # 更新されたユーザー情報を返す
            serializer = UserSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"ヘッダー画像更新エラー: {e}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'ヘッダー画像の更新に失敗しました: {str(e)}'},
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
                'exercise_frequency', 'dietary_preference', 'primary_area'
            ).prefetch_related(
                'interests__category', 'alcohol_categories', 'alcohol_brands__category',
                'drink_styles__category', 'hobbies', 'visit_purposes',
                'atmosphere_preferences__indicator', 'my_areas'
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
            # ProfileVisibilitySettingsが存在しない場合は作成
            from .models import ProfileVisibilitySettings
            visibility_settings, created = ProfileVisibilitySettings.objects.get_or_create(
                user=request.user
            )
            
            user = User.objects.select_related(
                'visibility_settings', 'blood_type', 'mbti', 
                'exercise_frequency', 'dietary_preference', 'primary_area'
            ).prefetch_related(
                'interests__category', 'alcohol_categories', 'alcohol_brands__category',
                'drink_styles__category', 'hobbies', 'visit_purposes',
                'atmosphere_preferences__indicator', 'my_areas'
            ).get(id=request.user.id)
            
            serializer = PublicUserProfileSerializer(user)
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            print(f"PreviewUserProfileView error: {str(e)}")
            print(f"PreviewUserProfileView traceback: {traceback.format_exc()}")
            return Response(
                {'error': 'プレビューの取得に失敗しました'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# マイエリア管理API
class MyAreasManagementView(APIView):
    """
    マイエリア管理（取得・更新）API
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        """現在のマイエリア情報を取得"""
        try:
            user = request.user
            from shops.serializers import AreaSerializer
            
            # マイエリアを取得
            my_areas = user.my_areas.all().select_related('parent').order_by('level', 'name')
            my_areas_data = AreaSerializer(my_areas, many=True).data
            
            # プライマリエリアを取得
            primary_area_data = None
            if user.primary_area:
                primary_area_data = AreaSerializer(user.primary_area).data
            
            return Response({
                'my_areas': my_areas_data,
                'primary_area': primary_area_data,
                'total_areas': len(my_areas_data)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': 'マイエリア情報の取得に失敗しました'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request, *args, **kwargs):
        """マイエリア情報を更新"""
        try:
            user = request.user
            serializer = MyAreasUpdateSerializer(data=request.data)
            
            if serializer.is_valid():
                # エリア情報を更新
                updated_user = serializer.update_user_areas(user, serializer.validated_data)
                
                # 更新後の情報を返す
                from shops.serializers import AreaSerializer
                my_areas = updated_user.my_areas.all().select_related('parent').order_by('level', 'name')
                my_areas_data = AreaSerializer(my_areas, many=True).data
                
                primary_area_data = None
                if updated_user.primary_area:
                    primary_area_data = AreaSerializer(updated_user.primary_area).data
                
                return Response({
                    'my_areas': my_areas_data,
                    'primary_area': primary_area_data,
                    'total_areas': len(my_areas_data),
                    'message': 'マイエリア情報を更新しました'
                }, status=status.HTTP_200_OK)
            else:
                return Response(
                    {'errors': serializer.errors}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            import traceback
            print(f"MyAreasManagementView error: {str(e)}")
            print(f"MyAreasManagementView traceback: {traceback.format_exc()}")
            return Response(
                {'error': 'マイエリア情報の更新に失敗しました'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


# アカウント認証 + 自動ログインAPI
class ActivateAndAutoLoginView(APIView):
    """
    メール認証トークンを検証し、アカウントをアクティブ化
    同時にJWTトークンを発行して自動ログインを実現
    /api/auth/activate-and-login/
    """
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        from djoser.utils import decode_uid
        from rest_framework_simplejwt.tokens import RefreshToken
        from django.contrib.auth.tokens import default_token_generator

        uid = request.data.get('uid')
        token = request.data.get('token')

        print(f"🔐 ActivateAndAutoLoginView called - uid: {uid}")

        if not uid or not token:
            return Response(
                {'error': 'uidとtokenが必要です'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # uidからユーザーID取得
            user_id = decode_uid(uid)
            print(f"✅ Decoded user_id: {user_id}")

            user = User.objects.get(pk=user_id)
            print(f"✅ User found: {user.email}")

            # トークン検証（Djoserのactivation tokenチェック）
            if not default_token_generator.check_token(user, token):
                print(f"❌ Invalid token for user: {user.email}")
                return Response(
                    {'error': '無効なトークンです'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            print(f"✅ Token verified for user: {user.email}")

            # ユーザーをアクティブ化
            if not user.is_active:
                user.is_active = True
                user.save()
                print(f"✅ User activated: {user.email}")
            else:
                print(f"ℹ️ User already active: {user.email}")

            # JWTトークン生成
            refresh = RefreshToken.for_user(user)
            print(f"✅ JWT tokens generated for user: {user.email}")

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': {
                    'id': user.id,
                    'uid': user.uid,
                    'email': user.email,
                    'name': user.name,
                    'avatar': user.avatar.url if user.avatar else None,
                }
            }, status=status.HTTP_200_OK)

        except (User.DoesNotExist, ValueError, TypeError) as e:
            print(f"❌ Error in ActivateAndAutoLoginView: {str(e)}")
            return Response(
                {'error': 'ユーザーが見つかりません'},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            print(f"💥 Unexpected error in ActivateAndAutoLoginView: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response(
                {'error': 'アカウント認証に失敗しました'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
