from rest_framework import viewsets, status, generics
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction, models
from django.db.models import Count, F
from django.shortcuts import get_object_or_404
from .models import (
    Shop, ShopType, ShopLayout, ShopOption, ShopReview, ShopReviewLike,
    RelationType, UserShopRelation,
    ShopTag, ShopTagReaction, ShopMessage, ShopStaff, ShopImage,
    BusinessHour, PaymentMethod, ShopEditHistory, HistoryEvaluation,
    ShopDrink, ShopDrinkReaction, Area
)
from .serializers import (
    ShopCreateSerializer, ShopUpdateSerializer, ShopTypeSerializer, ShopLayoutSerializer, ShopOptionSerializer, 
    ShopSerializer, ShopTagSerializer, ShopTagCreateSerializer, ShopTagReactionSerializer, UserShopRelationSerializer, 
    ShopImageSerializer, PaymentMethodSerializer, ShopEditHistorySerializer, HistoryEvaluationSerializer,
    ShopReviewSerializer, ShopReviewLikeSerializer, ShopDrinkSerializer, ShopDrinkReactionSerializer,
    AlcoholCategorySerializer, AlcoholBrandSerializer, DrinkStyleSerializer, AreaSerializer, AreaDetailSerializer,
    AreaTreeSerializer, AreaGeoJSONSerializer
)
from .views_drink import ShopDrinkViewSet


class ShopUpdateAPIView(generics.UpdateAPIView):
    queryset = Shop.objects.all()
    serializer_class = ShopUpdateSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        # 変更前のインスタンスの状態を保持
        old_instance_dict = {field.name: str(getattr(instance, field.name)) for field in instance._meta.fields}

        response = super().update(request, *args, **kwargs)

        # 変更後のインスタンス
        instance.refresh_from_db()
        new_instance_dict = {field.name: str(getattr(instance, field.name)) for field in instance._meta.fields}

        # 変更点を履歴に保存
        for field_name, old_value in old_instance_dict.items():
            new_value = new_instance_dict.get(field_name)
            if old_value != new_value:
                ShopEditHistory.objects.create(
                    shop=instance,
                    user=request.user,
                    field_name=field_name,
                    old_value=old_value,
                    new_value=new_value
                )
        return response


class ShopEditHistoryListAPIView(generics.ListAPIView):
    serializer_class = ShopEditHistorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        shop_id = self.kwargs.get('pk')
        return ShopEditHistory.objects.filter(shop_id=shop_id)


class HistoryEvaluationAPIView(generics.CreateAPIView):
    serializer_class = HistoryEvaluationSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        history_id = self.kwargs.get('pk')
        history = ShopEditHistory.objects.get(id=history_id)
        evaluation_type = serializer.validated_data.get('evaluation')

        # ユーザーが既に評価しているか確認
        evaluation, created = HistoryEvaluation.objects.update_or_create(
            history=history,
            user=self.request.user,
            defaults={'evaluation': evaluation_type}
        )
        serializer.instance = evaluation


class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [AllowAny]
    # authentication_classes = [] を削除して、デフォルトの認証クラスを使用

    def get_queryset(self):
        return Shop.objects.all().prefetch_related(
            'business_hours',
            'shop_types',
            'shop_layouts',
            'shop_options',
            'images',
            'tags',
            'tags__reactions',
            'tags__created_by'
        ).annotate(
            tags_with_count=models.Exists(
                ShopTag.objects.filter(
                    shop=models.OuterRef('pk')
                ).annotate(
                    reactions_count=models.Count('reactions')
                )
            )
        )
        
    def get_serializer_context(self):
        context = super().get_serializer_context()
        # リクエストオブジェクトをコンテキストに追加
        context['request'] = self.request
        print(f"ShopViewSet.get_serializer_context: request={self.request}, authenticated={self.request.user.is_authenticated if hasattr(self.request, 'user') else 'No user'}")
        return context
        
    def retrieve(self, request, *args, **kwargs):
        print(f"ShopViewSet.retrieve: request={request}, authenticated={request.user.is_authenticated if hasattr(request, 'user') else 'No user'}")
        
        # リクエストユーザーの詳細情報をログに出力
        if hasattr(request, 'user') and request.user.is_authenticated:
            print(f"Authenticated user: id={request.user.id}, email={request.user.email}")
            
            # JWTトークンの確認
            auth_header = request.headers.get('Authorization', '')
            print(f"Authorization header: {auth_header}")
            
            # セッション情報の確認
            print(f"Session: {request.session.items() if hasattr(request, 'session') else 'No session'}")
        else:
            print("User is not authenticated")
            
        response = super().retrieve(request, *args, **kwargs)
        
        # レスポンスデータのタグ情報をログに出力
        if 'tags' in response.data:
            print(f"Response contains {len(response.data['tags'])} tags")
            for tag in response.data['tags']:
                print(f"Tag in response: id={tag.get('id')}, value={tag.get('value')}, user_has_reacted={tag.get('user_has_reacted')}, is_creator={tag.get('is_creator')}")
                
        return response

class ShopCreateViewSet(viewsets.GenericViewSet):
    """
    店舗情報の登録用ViewSet
    """
    queryset = Shop.objects.none()
    serializer_class = ShopCreateSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def create(self, request, *args, **kwargs):
        try:
            with transaction.atomic():
                # 画像データの準備
                images_data = []
                for key, value in request.FILES.items():
                    if key.startswith('image_'):
                        index = key.split('_')[1]
                        images_data.append({
                            'image': value,
                            'caption': request.data.get(f'caption_{index}', ''),
                            'is_icon': request.data.get(f'is_icon_{index}', 'false').lower() == 'true'
                        })

                # 店舗基本情報の保存
                serializer = self.get_serializer(data=request.data)
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                # 店舗を保存（Geocoding処理はmodelのsave()メソッドで自動実行）
                shop = serializer.save(created_by=request.user)

                # ManyToManyフィールドの設定
                shop_types = request.data.getlist('shop_types', [])
                shop_layouts = request.data.getlist('shop_layouts', [])
                shop_options = request.data.getlist('shop_options', [])
                payment_methods = request.data.getlist('payment_methods', [])

                try:
                    if shop_types:
                        shop.shop_types.set([int(x) for x in shop_types])
                except ValueError as e:
                    return Response({
                        'success': False,
                        'message': f'shop_typesの値が不正です: {e}',
                        'error': str(e)
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    if shop_layouts:
                        shop.shop_layouts.set([int(x) for x in shop_layouts])
                except ValueError as e:
                    return Response({
                        'success': False,
                        'message': f'shop_layoutsの値が不正です: {e}',
                        'error': str(e)
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    if shop_options:
                        shop.shop_options.set([int(x) for x in shop_options])
                except ValueError as e:
                    return Response({
                        'success': False,
                        'message': f'shop_optionsの値が不正です: {e}',
                        'error': str(e)
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                try:
                    if payment_methods:
                        shop.payment_methods.set([int(x) for x in payment_methods])
                except ValueError as e:
                    return Response({
                        'success': False,
                        'message': f'payment_methodsの値が不正です: {e}',
                        'error': str(e)
                    }, status=status.HTTP_400_BAD_REQUEST)

                # 営業時間の設定
                # business_hoursフィールドを削除（シリアライザで処理しない）
                if 'business_hours' in request.data:
                    request.data.pop('business_hours')
                
                # 既存の営業時間データを削除（念のため）
                BusinessHour.objects.filter(shop=shop).delete()
                
                # 営業時間データを直接処理
                weekdays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'hol']
                
                # デフォルト値を設定
                default_hours = {
                    weekday: {
                        'open_time': '18:00' if weekday not in ['sun', 'hol'] else None,
                        'close_time': '23:00' if weekday not in ['sun', 'hol'] else None,
                        'is_closed': weekday in ['sun', 'hol']
                    } for weekday in weekdays
                }
                
                # フロントエンドから送信された営業時間データを取得
                try:
                    # FormDataからbusiness_hoursを取得
                    business_hours_data = {}
                    
                    for key in request.data.keys():
                        if key.startswith('business_hour_'):
                            parts = key.split('_')
                            if len(parts) >= 3:
                                weekday = parts[2]
                                field = '_'.join(parts[3:])
                                if weekday not in business_hours_data:
                                    business_hours_data[weekday] = {}
                                business_hours_data[weekday][field] = request.data.get(key)
                    
                    # 送信されたデータがある場合は使用、なければデフォルト値を使用
                    for weekday in weekdays:
                        data = business_hours_data.get(weekday, default_hours[weekday])
                        is_closed = data.get('is_closed', 'false').lower() == 'true' if isinstance(data.get('is_closed'), str) else data.get('is_closed', False)
                        
                        # 定休日の場合は時間をNoneに
                        open_time = None if is_closed else data.get('open_time', default_hours[weekday]['open_time'])
                        close_time = None if is_closed else data.get('close_time', default_hours[weekday]['close_time'])
                        
                        # 営業時間を作成
                        BusinessHour.objects.create(
                            shop=shop,
                            weekday=weekday,
                            open_time=open_time,
                            close_time=close_time,
                            is_closed=is_closed
                        )
                        
                except Exception as e:
                    print(f"営業時間の処理中にエラーが発生しました: {e}")
                    # エラーが発生した場合はデフォルト値を設定
                    for weekday in weekdays:
                        BusinessHour.objects.create(
                            shop=shop,
                            weekday=weekday,
                            open_time=default_hours[weekday]['open_time'],
                            close_time=default_hours[weekday]['close_time'],
                            is_closed=default_hours[weekday]['is_closed']
                        )

                # 画像の保存
                for image_data in images_data:
                    ShopImage.objects.create(shop=shop, **image_data)

                return Response({
                    'success': True,
                    'message': '店舗を登録しました',
                    'shop_id': shop.id,
                    'created_by': request.user.id,
                    'images_count': len(images_data)
                }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            import traceback
            error_trace = traceback.format_exc()
            print("=== エラーの詳細 ===")
            print(error_trace)
            
            # エラーメッセージをより詳細に
            error_message = '店舗の登録に失敗しました'
            if 'unique constraint' in str(e).lower() and 'shops_shop_name_address' in str(e).lower():
                error_message = '同じ名前と住所の店舗が既に登録されています'
            elif 'serializer' in str(e).lower():
                error_message = 'データの検証に失敗しました'
            elif 'business_hour' in str(e).lower():
                error_message = '営業時間データの処理中にエラーが発生しました'
            elif 'image' in str(e).lower():
                error_message = '画像データの処理中にエラーが発生しました'
            
            return Response({
                'success': False,
                'message': error_message,
                'error': str(e),
                'error_type': e.__class__.__name__
            }, status=status.HTTP_400_BAD_REQUEST)
    

class ShopTypeViewSet(viewsets.ModelViewSet):
    queryset = ShopType.objects.all()
    serializer_class = ShopTypeSerializer
    permission_classes = [AllowAny]

class ShopLayoutViewSet(viewsets.ModelViewSet):
    queryset = ShopLayout.objects.all()
    serializer_class = ShopLayoutSerializer
    permission_classes = [AllowAny]

class ShopOptionViewSet(viewsets.ModelViewSet):
    queryset = ShopOption.objects.all()
    serializer_class = ShopOptionSerializer
    permission_classes = [AllowAny]

class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [AllowAny]



class ShopReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ShopReviewSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        shop_id = self.kwargs.get('shop_pk')
        queryset = ShopReview.objects.filter(shop_id=shop_id)

        # 来店目的による絞り込み
        visit_purpose_id = self.request.query_params.get('visit_purpose_id')
        if visit_purpose_id:
            queryset = queryset.filter(visit_purpose_id=visit_purpose_id)

        # 来店ステータスによる絞り込み
        status = self.request.query_params.get('status')
        if status:
            try:
                # "favorite" (行きつけ) または "visited" (行った) のRelationTypeを取得
                relation_type = RelationType.objects.get(name=status)
                # そのリレーションを持つユーザーを取得
                user_ids = UserShopRelation.objects.filter(
                    shop_id=shop_id,
                    relation_type=relation_type
                ).values_list('user_id', flat=True)
                queryset = queryset.filter(user_id__in=user_ids)
            except RelationType.DoesNotExist:
                # 該当するRelationTypeがなければ、空のクエリセットを返す
                return queryset.none()

        return queryset.select_related('user', 'visit_purpose').order_by('-created_at')

    def perform_create(self, serializer):
        shop = get_object_or_404(Shop, pk=self.kwargs.get('shop_pk'))
        serializer.save(user=self.request.user, shop=shop)

    def get_serializer_context(self):
        return {'request': self.request}


class ReviewLikeAPIView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        review_id = self.kwargs.get('review_pk')
        review = get_object_or_404(ShopReview, pk=review_id)
        like, created = ShopReviewLike.objects.get_or_create(user=request.user, review=review)

        if created:
            # いいねを追加
            review.likes_count = F('likes_count') + 1
            review.save(update_fields=['likes_count'])
            review.refresh_from_db()  # F()クエリ後にDBから最新値を取得
            return Response({"status": "liked", "likes_count": review.likes_count}, status=status.HTTP_201_CREATED)
        else:
            # いいねを削除
            like.delete()
            review.likes_count = F('likes_count') - 1
            review.save(update_fields=['likes_count'])
            review.refresh_from_db()  # F()クエリ後にDBから最新値を取得
            return Response({"status": "unliked", "likes_count": review.likes_count}, status=status.HTTP_200_OK)



class RelationTypeViewSet(viewsets.ModelViewSet):
    queryset = RelationType.objects.all()
    permission_classes = [IsAuthenticated]

class UserShopRelationViewSet(viewsets.ModelViewSet):
    queryset = UserShopRelation.objects.all()
    permission_classes = [IsAuthenticated]

class ShopTagViewSet(viewsets.ModelViewSet):
    queryset = ShopTag.objects.all()
    permission_classes = [AllowAny]  # 未ログインでも閲覧可能
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ShopTagCreateSerializer
        return ShopTagSerializer
    
    def get_queryset(self):
        queryset = ShopTag.objects.all().annotate(
            reaction_count=models.Count('reactions')
        ).order_by('-reaction_count', '-created_at')
        
        # 店舗IDでフィルタリング
        shop_id = self.request.query_params.get('shop_id')
        if shop_id:
            queryset = queryset.filter(shop_id=shop_id)
            
        # タグ名で検索（部分一致）
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(value__icontains=search)
            
        return queryset
    
    def create(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です。"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # 同じ店舗に同じ値のタグが既に存在するか確認
        shop_id = serializer.validated_data.get('shop').id
        value = serializer.validated_data.get('value')
        
        existing_tag = ShopTag.objects.filter(
            shop_id=shop_id, 
            value__iexact=value
        ).first()
        
        if existing_tag:
            # 既存のタグが見つかった場合、そのタグに対するリアクションを作成
            reaction, created = ShopTagReaction.objects.get_or_create(
                shop_tag=existing_tag,
                user=request.user
            )
            
            tag_serializer = ShopTagSerializer(
                existing_tag, 
                context={'request': request}
            )
            
            return Response(
                tag_serializer.data, 
                status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED
            )
        
        try:
            # 新しいタグを作成（created_by フィールドがあれば設定）
            tag = serializer.save()
            if hasattr(ShopTag, 'created_by'):
                tag.created_by = request.user
                tag.save()
            
            # 作成者自身のリアクションを自動的に追加
            ShopTagReaction.objects.create(
                shop_tag=tag,
                user=request.user
            )
            
            # 作成したタグを返す
            output_serializer = ShopTagSerializer(
                tag, 
                context={'request': request}
            )
            
            return Response(
                output_serializer.data, 
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response(
                {"detail": f"タグの作成に失敗しました: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def destroy(self, request, *args, **kwargs):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です。"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        tag = self.get_object()
        
        # タグの作成者かどうか確認
        if tag.created_by != request.user:
            return Response(
                {"detail": "このタグを削除する権限がありません。"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # タグの共感数が1（自分のみ）かどうか確認
        if tag.reactions.count() > 1:
            return Response(
                {"detail": "他のユーザーが共感しているタグは削除できません。"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # タグを削除
        tag.delete()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

class ShopTagReactionViewSet(viewsets.ModelViewSet):
    queryset = ShopTagReaction.objects.all()
    serializer_class = ShopTagReactionSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        shop_tag_id = request.data.get('shop_tag')
        
        if not shop_tag_id:
            return Response(
                {"detail": "shop_tag は必須フィールドです。"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            shop_tag = ShopTag.objects.get(id=shop_tag_id)
        except ShopTag.DoesNotExist:
            return Response(
                {"detail": "指定されたタグが見つかりません。"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # 既に共感しているか確認
        reaction = ShopTagReaction.objects.filter(
            shop_tag=shop_tag,
            user=request.user
        ).first()
        
        if reaction:
            return Response(
                {"detail": "既にこのタグに共感しています。"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 共感を作成
        reaction = ShopTagReaction.objects.create(
            shop_tag=shop_tag,
            user=request.user
        )
        
        serializer = self.get_serializer(reaction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    def destroy(self, request, *args, **kwargs):
        reaction = self.get_object()
        
        # 自分の共感かどうか確認
        if reaction.user != request.user:
            return Response(
                {"detail": "この共感を削除する権限がありません。"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # タグの作成者かつ共感数が1の場合、タグも削除
        shop_tag = reaction.shop_tag
        is_creator = shop_tag.created_by == request.user
        reaction_count = shop_tag.reactions.count()
        
        # 共感を削除
        reaction.delete()
        
        # 作成者の共感が削除され、共感数が0になった場合、タグも削除
        if is_creator and reaction_count == 1:
            shop_tag.delete()
            return Response(
                {"detail": "タグと共感が削除されました。"},
                status=status.HTTP_204_NO_CONTENT
            )
            
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    # タグIDから共感を削除するためのカスタムエンドポイント
    @action(detail=False, methods=['delete'], url_path='by-tag/(?P<tag_id>[^/.]+)')
    def delete_by_tag(self, request, tag_id=None):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です。"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        try:
            # タグIDとユーザーで共感を検索
            reaction = ShopTagReaction.objects.get(
                shop_tag_id=tag_id,
                user=request.user
            )
            
            # タグの作成者かつ共感数が1の場合、タグも削除
            shop_tag = reaction.shop_tag
            is_creator = shop_tag.created_by == request.user
            reaction_count = shop_tag.reactions.count()
            
            # 共感を削除
            reaction.delete()
            
            # 作成者の共感が削除され、共感数が0になった場合、タグも削除
            if is_creator and reaction_count == 1:
                shop_tag.delete()
                return Response(
                    {"detail": "タグと共感が削除されました。"},
                    status=status.HTTP_204_NO_CONTENT
                )
                
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except ShopTagReaction.DoesNotExist:
            return Response(
                {"detail": "指定されたタグに対する共感が見つかりません。"},
                status=status.HTTP_404_NOT_FOUND
            )
    
    # タグの反応を切り替えるためのカスタムエンドポイント
    @action(detail=False, methods=['post'], url_path='toggle/(?P<tag_id>[^/.]+)')
    def toggle_reaction(self, request, tag_id=None):
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です。"},
                status=status.HTTP_401_UNAUTHORIZED
            )
            
        try:
            shop_tag = ShopTag.objects.get(id=tag_id)
        except ShopTag.DoesNotExist:
            return Response(
                {"detail": "指定されたタグが見つかりません。"},
                status=status.HTTP_404_NOT_FOUND
            )
            
        # 既存の反応を確認
        reaction = ShopTagReaction.objects.filter(
            shop_tag=shop_tag,
            user=request.user
        ).first()
        
        if reaction:
            # 反応が存在する場合は削除
            is_creator = shop_tag.created_by == request.user
            reaction_count = shop_tag.reactions.count()
            
            reaction.delete()
            
            # 作成者の反応が削除され、反応数が0になった場合、タグも削除
            if is_creator and reaction_count == 1:
                shop_tag.delete()
                return Response({
                    "action": "removed",
                    "tag_deleted": True,
                    "detail": "タグと反応が削除されました。"
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    "action": "removed",
                    "tag_deleted": False,
                    "detail": "反応が削除されました。"
                }, status=status.HTTP_200_OK)
        else:
            # 反応が存在しない場合は作成
            ShopTagReaction.objects.create(
                shop_tag=shop_tag,
                user=request.user
            )
            return Response({
                "action": "added",
                "tag_deleted": False,
                "detail": "反応が追加されました。"
            }, status=status.HTTP_200_OK)

class ShopMessageViewSet(viewsets.ModelViewSet):
    queryset = ShopMessage.objects.all()
    permission_classes = [IsAuthenticated]

class ShopStaffViewSet(viewsets.ModelViewSet):
    queryset = ShopStaff.objects.all()
    permission_classes = [IsAuthenticated]

class ShopImageViewSet(viewsets.ModelViewSet):
    """
    店舗画像の管理用ViewSet
    """
    queryset = ShopImage.objects.all()
    serializer_class = ShopImageSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def perform_create(self, serializer):
        serializer.save(shop_id=self.request.data.get('shop'))

# UserShopRelationViewSet
class UserShopRelationViewSet(viewsets.ModelViewSet):
    serializer_class = UserShopRelationSerializer
    def get_permissions(self):
        if self.action in ['shop_stats', 'list', 'retrieve', 'visited_shops', 'wishlist_shops', 'favorite_shops']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return UserShopRelation.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def shop_stats(self, request):
        """
        店舗の統計情報を取得する
        """
        shop_id = request.query_params.get('shop_id')
        if not shop_id:
            return Response(
                {"detail": "shop_id は必須です"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        # 各リレーションタイプの数をカウント
        relation_counts = UserShopRelation.objects.filter(
            shop_id=shop_id
        ).values('relation_type').annotate(
            count=models.Count('id')
        )
        
        # リレーションタイプの情報を取得（favorite → visited → interested の順）
        relation_types = RelationType.objects.all().order_by(
            models.Case(
                models.When(name='favorite', then=models.Value(1)),
                models.When(name='visited', then=models.Value(2)),
                models.When(name='interested', then=models.Value(3)),
                default=models.Value(4),
                output_field=models.IntegerField()
            )
        )
        
        # レスポンス用のデータを構築
        counts = []
        for relation_type in relation_types:
            count = 0
            for rel_count in relation_counts:
                if rel_count['relation_type'] == relation_type.id:
                    count = rel_count['count']
                    break
                    
            counts.append({
                'id': relation_type.id,
                'name': relation_type.name,
                'label': relation_type.label,
                'count': count,
                'color': relation_type.color
            })
        
        # ユーザーのリレーション情報
        user_relations = []
        if request.user.is_authenticated:
            user_relations = list(UserShopRelation.objects.filter(
                user=request.user,
                shop_id=shop_id
            ).values_list('relation_type_id', flat=True))
        
        return Response({
            'counts': counts,
            'user_relations': user_relations
        })
    
    @action(detail=False, methods=['post'])
    def toggle(self, request):
        """
        店舗とユーザーの関係を切り替える（作成/削除）
        """
        shop_id = request.data.get('shop_id')
        relation_type_id = request.data.get('relation_type_id')

        if not all([shop_id, relation_type_id]):
            return Response(
                {"detail": "shop_id と relation_type_id は必須です"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            relation = UserShopRelation.objects.filter(
                user=request.user,
                shop_id=shop_id,
                relation_type_id=relation_type_id
            ).first()

            if relation:
                # 既存の関係を削除
                relation.delete()
                return Response({
                    "status": "removed",
                    "message": "関係を削除しました"
                })
            else:
                # 新しい関係を作成
                relation = UserShopRelation.objects.create(
                    user=request.user,
                    shop_id=shop_id,
                    relation_type_id=relation_type_id
                )
                serializer = self.get_serializer(relation)
                return Response({
                    "status": "added",
                    "message": "関係を作成しました",
                    "data": serializer.data
                })

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


##############################################
# Area関連のViewSet
##############################################

class AreaViewSet(viewsets.ModelViewSet):
    """エリア情報のCRUD操作"""
    queryset = Area.objects.filter(is_active=True).order_by('level', 'name')
    permission_classes = [AllowAny]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return AreaDetailSerializer
        return AreaSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # エリアタイプでフィルタ
        area_type = self.request.query_params.get('area_type')
        if area_type:
            queryset = queryset.filter(area_type=area_type)
        
        # 階層レベルでフィルタ
        level = self.request.query_params.get('level')
        if level is not None:
            try:
                queryset = queryset.filter(level=int(level))
            except ValueError:
                pass
        
        # 親エリアでフィルタ
        parent_id = self.request.query_params.get('parent')
        if parent_id:
            try:
                queryset = queryset.filter(parent_id=int(parent_id))
            except ValueError:
                pass
        
        # ルートエリア（親なし）のみ取得
        if self.request.query_params.get('root_only') == 'true':
            queryset = queryset.filter(parent__isnull=True)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """エリアの子エリア一覧を取得"""
        area = self.get_object()
        children = area.children.filter(is_active=True).order_by('name')
        serializer = AreaSerializer(children, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def ancestors(self, request, pk=None):
        """エリアの祖先エリア一覧を取得"""
        area = self.get_object()
        ancestors = area.get_ancestors()
        serializer = AreaSerializer(ancestors, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def shops(self, request, pk=None):
        """エリア内の店舗一覧を取得"""
        area = self.get_object()
        shops = area.shops.all()
        
        # 子エリアの店舗も含める場合
        if request.query_params.get('include_children') == 'true':
            descendant_areas = area.get_descendants()
            descendant_shop_ids = []
            for desc_area in descendant_areas:
                descendant_shop_ids.extend(list(desc_area.shops.values_list('id', flat=True)))
            shops = shops.union(Shop.objects.filter(id__in=descendant_shop_ids))
        
        from .serializers import ShopSerializer
        serializer = ShopSerializer(shops, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """エリア階層ツリーを取得（都市圏順）"""
        # 主要都市圏順で都道府県を並び替え
        prefecture_priority = [
            '東京都', '大阪府', '神奈川県', '愛知県', '埼玉県', '千葉県', '兵庫県',
            '福岡県', '北海道', '京都府', '宮城県', '広島県', '静岡県', '茨城県',
            '岐阜県', '栃木県', '群馬県', '新潟県', '長野県', '三重県', '岡山県',
            '熊本県', '鹿児島県', '沖縄県', '滋賀県', '奈良県', '愛媛県', '長崎県',
            '青森県', '岩手県', '秋田県', '山形県', '福島県', '山梨県', '富山県',
            '石川県', '福井県', '和歌山県', '鳥取県', '島根県', '山口県', '徳島県',
            '香川県', '高知県', '佐賀県', '大分県', '宮崎県'
        ]
        
        # ルートエリア（都道府県）を人口・都市圏順で取得
        root_areas = Area.objects.filter(
            parent__isnull=True, 
            is_active=True
        )
        
        # カスタム順序でソート
        root_areas = sorted(root_areas, key=lambda x: 
            prefecture_priority.index(x.name) if x.name in prefecture_priority else 999
        )
        
        serializer = AreaTreeSerializer(root_areas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def geojson(self, request):
        """GeoJSON形式でエリア情報を取得"""
        queryset = self.get_queryset()
        
        # ジオメトリが設定されているエリアのみ
        queryset = queryset.exclude(geometry__isnull=True)
        
        serializer = AreaGeoJSONSerializer(queryset, many=True)
        
        # FeatureCollectionとして返す
        geojson = {
            'type': 'FeatureCollection',
            'features': serializer.data
        }
        
        return Response(geojson)
    
    @action(detail=False, methods=['post'])
    def detect_by_coordinates(self, request):
        """緯度経度からエリアを検出"""
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        
        if latitude is None or longitude is None:
            return Response(
                {"error": "latitude and longitude are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .utils.area_detection import AreaDetectionService
            areas = AreaDetectionService.find_areas_by_point(
                float(latitude), float(longitude)
            )
            serializer = AreaSerializer(areas, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {"error": "Invalid latitude or longitude format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def detect_by_address(self, request):
        """住所からエリアを検出"""
        address = request.data.get('address')
        
        if not address:
            return Response(
                {"error": "address is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from .utils.area_detection import AreaDetectionService
        area = AreaDetectionService.detect_area_from_address(address)
        
        if area:
            serializer = AreaDetailSerializer(area)
            return Response(serializer.data)
        else:
            return Response(
                {"error": "No area found for the given address"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=False, methods=['get'])
    def nearby(self, request):
        """指定地点の近くのエリアを検索"""
        latitude = request.query_params.get('latitude')
        longitude = request.query_params.get('longitude')
        radius = request.query_params.get('radius', '5.0')  # デフォルト5km
        
        if not latitude or not longitude:
            return Response(
                {"error": "latitude and longitude are required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from .utils.area_detection import AreaDetectionService
            areas = AreaDetectionService.find_nearby_areas(
                float(latitude), float(longitude), float(radius)
            )
            serializer = AreaSerializer(areas, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {"error": "Invalid parameter format"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """主要都市エリアを取得"""
        # 主要都市の都道府県・市区町村を定義
        popular_prefectures = [
            '東京都', '大阪府', '愛知県', '福岡県', '北海道', '宮城県', '広島県',
            '京都府', '神奈川県', '埼玉県', '千葉県', '兵庫県'
        ]
        
        popular_cities = [
            '渋谷区', '新宿区', '港区', '中央区', '千代田区',  # 東京
            '大阪市北区', '大阪市中央区', '大阪市浪速区',      # 大阪
            '名古屋市中区', '名古屋市東区',                    # 名古屋
            '福岡市中央区', '福岡市博多区',                    # 福岡
            '札幌市中央区', '札幌市北区',                      # 札幌
            '仙台市青葉区',                                    # 仙台
            '広島市中区',                                      # 広島
            '京都市中京区', '京都市下京区',                    # 京都
            '横浜市西区', '横浜市中区',                        # 横浜
        ]
        
        # 主要エリアを優先順で取得
        popular_areas = Area.objects.filter(
            models.Q(name__in=popular_prefectures, level=0) |
            models.Q(name__in=popular_cities, level__in=[1, 2]),
            is_active=True
        ).select_related('parent').order_by(
            models.Case(
                models.When(name__in=['東京都'], then=models.Value(1)),
                models.When(name__in=['大阪府'], then=models.Value(2)),
                models.When(name__in=['愛知県'], then=models.Value(3)),
                models.When(name__in=['福岡県'], then=models.Value(4)),
                models.When(name__in=popular_cities, then=models.Value(5)),
                default=models.Value(10),
                output_field=models.IntegerField()
            ),
            'name'
        )[:20]  # 最大20件
        
        serializer = AreaSerializer(popular_areas, many=True)
        return Response({
            'popular_areas': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """エリア名での検索（マイエリア選択用）"""
        query = request.query_params.get('q', '').strip()
        
        if not query or len(query) < 1:
            return Response({
                'results': [],
                'total': 0
            })
        
        # 検索クエリに対する部分一致検索
        areas = Area.objects.filter(
            name__icontains=query,
            is_active=True
        ).select_related('parent').order_by(
            'level', 'name'
        )[:50]  # 最大50件
        
        # より詳細な情報を含むシリアライザーを使用
        serializer = AreaDetailSerializer(areas, many=True)
        
        return Response({
            'results': serializer.data,
            'total': areas.count(),
            'query': query
        })
