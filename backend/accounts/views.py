from django.contrib.auth import get_user_model
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
    HobbySerializer,
    ExerciseHabitSerializer,
    SocialPreferenceSerializer,
)
from .models import (
    Interest,
    BloodType,
    MBTI,
    Alcohol,
    Hobby,
    ExerciseHabit,
    SocialPreference,
)

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
            "hobbies": HobbySerializer(Hobby.objects.all(), many=True).data,
            "exercise_habits": ExerciseHabitSerializer(
                ExerciseHabit.objects.all(), many=True
            ).data,
            "social_preferences": SocialPreferenceSerializer(
                SocialPreference.objects.all(), many=True
            ).data,
        }
        return Response(data, status=status.HTTP_200_OK)