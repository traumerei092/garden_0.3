from django.contrib.auth import get_user_model
from rest_framework.generics import RetrieveAPIView
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .serializers import UserSerializer, UserTagSerializer, UserUserTagSerializer
from .models import UserTag, UserUserTag

User = get_user_model()


# ユーザー詳細
class UserDetailView(RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (AllowAny,)
    lookup_field = "uid"

# ユーザータグ一覧・作成
class UserTagViewSet(viewsets.ModelViewSet):
    queryset = UserTag.objects.all()
    serializer_class = UserTagSerializer
    permission_classes = (AllowAny,)

# ユーザーとタグの紐付け（追加・削除）
class UserUserTagViewSet(viewsets.ModelViewSet):
    queryset = UserUserTag.objects.all()
    serializer_class = UserUserTagSerializer
    permission_classes = (AllowAny,)