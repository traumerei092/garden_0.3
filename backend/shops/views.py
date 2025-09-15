from rest_framework import viewsets, status, generics
from rest_framework.views import APIView
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
    ShopDrink, ShopDrinkReaction, Area,
    AtmosphereIndicator, ShopAtmosphereFeedback, ShopAtmosphereAggregate
)
from accounts.dashboard_views import track_shop_view
from .serializers import (
    ShopCreateSerializer, ShopUpdateSerializer, ShopTypeSerializer, ShopLayoutSerializer, ShopOptionSerializer, 
    ShopSerializer, ShopTagSerializer, ShopTagCreateSerializer, ShopTagReactionSerializer, UserShopRelationSerializer, 
    ShopImageSerializer, PaymentMethodSerializer, ShopEditHistorySerializer, HistoryEvaluationSerializer,
    ShopReviewSerializer, ShopReviewLikeSerializer, ShopDrinkSerializer, ShopDrinkReactionSerializer,
    AlcoholCategorySerializer, AlcoholBrandSerializer, DrinkStyleSerializer, AreaSerializer, AreaDetailSerializer,
    AreaTreeSerializer, AreaGeoJSONSerializer,
    AtmosphereIndicatorSerializer, ShopAtmosphereFeedbackSerializer, 
    ShopAtmosphereFeedbackCreateUpdateSerializer, ShopAtmosphereAggregateSerializer
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
        
        # 閲覧履歴を記録
        if hasattr(request, 'user') and request.user.is_authenticated:
            shop = self.get_object()
            track_shop_view(request.user, shop)
        
        # レスポンスデータのタグ情報をログに出力
        if 'tags' in response.data:
            print(f"Response contains {len(response.data['tags'])} tags")
            for tag in response.data['tags']:
                print(f"Tag in response: id={tag.get('id')}, value={tag.get('value')}, user_has_reacted={tag.get('user_has_reacted')}, is_creator={tag.get('is_creator')}")
                
        return response

    @action(detail=True, methods=['get'])
    def atmosphere_indicators(self, request, pk=None):
        """
        雰囲気指標の一覧を取得する
        """
        indicators = AtmosphereIndicator.objects.all().order_by('id')
        serializer = AtmosphereIndicatorSerializer(indicators, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def atmosphere_aggregate(self, request, pk=None):
        """
        店舗の雰囲気評価集計データを取得する
        """
        shop = self.get_object()
        try:
            aggregate = shop.atmosphere_aggregate
            serializer = ShopAtmosphereAggregateSerializer(aggregate)
            return Response(serializer.data)
        except ShopAtmosphereAggregate.DoesNotExist:
            # 集計データがない場合は空のデータを返す
            indicators = AtmosphereIndicator.objects.all()
            empty_data = {
                'shop': shop.name,
                'atmosphere_averages': {},
                'total_feedbacks': 0,
                'last_updated': None,
                'indicators': [
                    {
                        'id': indicator.id,
                        'name': indicator.name,
                        'description_left': indicator.description_left,
                        'description_right': indicator.description_right,
                        'average_score': 0.0,
                        'confidence_level': 'low'
                    }
                    for indicator in indicators
                ]
            }
            return Response(empty_data)

    @action(detail=True, methods=['post'])
    def atmosphere_feedback(self, request, pk=None):
        """
        店舗の雰囲気フィードバックを登録・更新する
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        shop = self.get_object()
        serializer = ShopAtmosphereFeedbackCreateUpdateSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # 既存のフィードバックがあれば更新、なければ作成
                    feedback, created = ShopAtmosphereFeedback.objects.update_or_create(
                        user=request.user,
                        shop=shop,
                        defaults={'atmosphere_scores': serializer.validated_data['atmosphere_scores']}
                    )
                    
                    # 集計データを更新
                    aggregate, _ = ShopAtmosphereAggregate.objects.get_or_create(shop=shop)
                    aggregate.update_aggregates()
                    
                    # レスポンス用のシリアライザー
                    response_serializer = ShopAtmosphereFeedbackSerializer(feedback)
                    return Response({
                        'message': '更新しました' if not created else '登録しました',
                        'data': response_serializer.data
                    }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)
                    
            except Exception as e:
                return Response(
                    {"detail": f"エラーが発生しました: {str(e)}"}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'])
    def my_atmosphere_feedback(self, request, pk=None):
        """
        ログイン中のユーザーの店舗に対する雰囲気フィードバックを取得する
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"}, 
                status=status.HTTP_401_UNAUTHORIZED
            )

        shop = self.get_object()
        try:
            feedback = ShopAtmosphereFeedback.objects.get(user=request.user, shop=shop)
            serializer = ShopAtmosphereFeedbackSerializer(feedback)
            return Response(serializer.data)
        except ShopAtmosphereFeedback.DoesNotExist:
            return Response(
                {"detail": "フィードバックが見つかりません"}, 
                status=status.HTTP_404_NOT_FOUND
            )

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
            reaction_count_db=models.Count('reactions')
        ).order_by('-reaction_count_db', '-created_at')
        
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
        if self.action in ['shop_stats']:
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
    
    @action(detail=False, methods=['get'])
    def visited_shops(self, request):
        """
        ユーザーが訪れた店舗の一覧を取得する
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # 'visited' リレーションタイプを取得
            visited_relation_type = RelationType.objects.get(name='visited')
            
            # ユーザーの訪問した店舗を取得
            relations = UserShopRelation.objects.filter(
                user=request.user,
                relation_type=visited_relation_type
            ).select_related('shop', 'shop__area').order_by('-created_at')
            
            shops = []
            for relation in relations:
                shop = relation.shop
                # メイン画像を取得（is_icon=Trueまたは最初の画像）
                main_image = shop.images.filter(is_icon=True).first() or shop.images.first()
                
                shops.append({
                    'id': shop.id,
                    'name': shop.name,
                    'prefecture': shop.prefecture,
                    'city': shop.city,
                    'area': shop.area.name if shop.area else '',
                    'image_url': main_image.image.url if main_image and main_image.image else None,
                    'visited_at': relation.created_at.isoformat()
                })
            
            return Response({'shops': shops})
            
        except RelationType.DoesNotExist:
            return Response(
                {"detail": "訪問リレーションタイプが見つかりません"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def wishlist_shops(self, request):
        """
        ユーザーが行きたいと思っている店舗の一覧を取得する
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # 'interested' リレーションタイプを取得
            interested_relation_type = RelationType.objects.get(name='interested')
            
            # ユーザーの興味のある店舗を取得
            relations = UserShopRelation.objects.filter(
                user=request.user,
                relation_type=interested_relation_type
            ).select_related('shop', 'shop__area').order_by('-created_at')
            
            shops = []
            for relation in relations:
                shop = relation.shop
                # メイン画像を取得（is_icon=Trueまたは最初の画像）
                main_image = shop.images.filter(is_icon=True).first() or shop.images.first()
                
                shops.append({
                    'id': shop.id,
                    'name': shop.name,
                    'prefecture': shop.prefecture,
                    'city': shop.city,
                    'area': shop.area.name if shop.area else '',
                    'image_url': main_image.image.url if main_image and main_image.image else None,
                    'added_at': relation.created_at.isoformat()
                })
            
            return Response({'shops': shops})
            
        except RelationType.DoesNotExist:
            return Response(
                {"detail": "興味リレーションタイプが見つかりません"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def favorite_shops(self, request):
        """
        ユーザーのお気に入り（行きつけ）店舗の一覧を取得する
        """
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # 'favorite' リレーションタイプを取得
            favorite_relation_type = RelationType.objects.get(name='favorite')
            
            # ユーザーのお気に入り店舗を取得
            relations = UserShopRelation.objects.filter(
                user=request.user,
                relation_type=favorite_relation_type
            ).select_related('shop', 'shop__area').order_by('-created_at')
            
            shops = []
            for relation in relations:
                shop = relation.shop
                # メイン画像を取得（is_icon=Trueまたは最初の画像）
                main_image = shop.images.filter(is_icon=True).first() or shop.images.first()
                
                shops.append({
                    'id': shop.id,
                    'name': shop.name,
                    'prefecture': shop.prefecture,
                    'city': shop.city,
                    'area': shop.area.name if shop.area else '',
                    'image_url': main_image.image.url if main_image and main_image.image else None,
                    'added_at': relation.created_at.isoformat()
                })
            
            return Response({'shops': shops})
            
        except RelationType.DoesNotExist:
            return Response(
                {"detail": "お気に入りリレーションタイプが見つかりません"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
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


# === 常連客分析API ===

from django.db.models import Count, Avg, Q
from datetime import date, datetime
from collections import Counter
import json


class RegularsAnalysisAPIView(generics.GenericAPIView):
    """
    店舗の常連客分析API
    """
    permission_classes = [AllowAny]

    def get_regulars_queryset(self, shop_id):
        """
        指定店舗の常連客（行きつけ登録した人）を取得
        """
        # RelationType で name='favorite' のものを取得
        try:
            favorite_relation = RelationType.objects.get(name='favorite')
        except RelationType.DoesNotExist:
            return None
            
        return UserShopRelation.objects.filter(
            shop_id=shop_id,
            relation_type=favorite_relation
        ).select_related('user')

    def calculate_age_group(self, birthdate):
        """
        生年月日から年代を計算
        """
        if not birthdate:
            return None
            
        today = date.today()
        age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
        
        if age < 20:
            return "10代"
        elif age < 30:
            return "20代"
        elif age < 40:
            return "30代"  
        elif age < 50:
            return "40代"
        elif age < 60:
            return "50代"
        else:
            return "60代以上"

    def get_welcome_count(self, shop_id):
        """
        店舗のウェルカム数を取得（常連客分析とは独立）
        """
        from .models import WelcomeAction
        
        # 全てのウェルカムアクション数を取得（常連客に限定しない）
        welcome_count = WelcomeAction.objects.filter(shop_id=shop_id).count()
        
        return welcome_count

    def get_top_interests(self, regulars, top_n=3):
        """
        常連客の興味Top N を取得
        """
        interests_counter = Counter()
        
        for relation in regulars:
            user = relation.user
            if hasattr(user, 'interests') and user.interests:
                # interests が JSON文字列の場合はパース、リストの場合はそのまま使用
                try:
                    if isinstance(user.interests, str):
                        interests_list = json.loads(user.interests)
                    elif isinstance(user.interests, list):
                        interests_list = user.interests
                    else:
                        continue
                        
                    for interest in interests_list:
                        if interest and interest.strip():
                            interests_counter[interest.strip()] += 1
                except (json.JSONDecodeError, TypeError):
                    continue
        
        # Top N を取得
        return [interest for interest, count in interests_counter.most_common(top_n)]


class RegularsSnapshotAPIView(RegularsAnalysisAPIView):
    """
    常連客のスナップショット情報を取得
    """
    
    def get(self, request, shop_id):
        # 常連客を取得
        regulars = self.get_regulars_queryset(shop_id)
        if regulars is None:
            return Response({
                "detail": "関係タイプが見つかりません"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        regulars_list = list(regulars)
        total_regulars = len(regulars_list)

        # データ不足の場合
        if total_regulars == 0:
            return Response({
                "core_group": {"age_group": "データなし", "gender": "データなし"},
                "top_interests": [],
                "total_regulars": 0
            })

        # 1. 中心層の計算（年齢層・性別）
        age_groups = []
        genders = []
        
        for relation in regulars_list:
            user = relation.user
            
            # 年齢層
            if user.birthdate:
                age_group = self.calculate_age_group(user.birthdate)
                if age_group:
                    age_groups.append(age_group)
            
            # 性別
            if user.gender:
                genders.append(user.gender)

        # 最頻値を取得
        most_common_age = Counter(age_groups).most_common(1)[0][0] if age_groups else "データ不足"
        most_common_gender = Counter(genders).most_common(1)[0][0] if genders else "データ不足"

        # 2. 興味のTop3
        top_interests = self.get_top_interests(regulars_list, 3)

        return Response({
            "core_group": {
                "age_group": most_common_age,
                "gender": most_common_gender
            },
            "top_interests": top_interests,
            "total_regulars": total_regulars
        })


class RegularsDetailedAnalysisAPIView(RegularsAnalysisAPIView):
    """
    常連客の詳細分析API - 指定された軸での分布を取得
    """
    
    def get(self, request, shop_id):
        # 分析軸を取得
        axis = request.GET.get('axis', 'age_group')
        
        # 常連客を取得
        regulars = self.get_regulars_queryset(shop_id)
        if regulars is None:
            return Response({
                "detail": "関係タイプが見つかりません"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        regulars_list = list(regulars)
        total_regulars = len(regulars_list)

        # データ不足の場合
        if total_regulars == 0:
            return Response({
                "axis": axis,
                "distribution": [],
                "total_regulars": 0
            })

        # 軸ごとの分析処理
        distribution_data = self.analyze_by_axis(axis, regulars_list)

        return Response({
            "axis": axis,
            "distribution": distribution_data,
            "total_regulars": total_regulars
        })

    def analyze_by_axis(self, axis, regulars_list):
        """
        指定された軸での分析を実行
        """
        if axis == 'age_group':
            return self.analyze_age_group(regulars_list)
        elif axis == 'gender':
            return self.analyze_gender(regulars_list)
        elif axis == 'occupation':
            return self.analyze_occupation(regulars_list)
        elif axis == 'industry':
            return self.analyze_industry(regulars_list)
        elif axis == 'mbti':
            return self.analyze_mbti(regulars_list)
        elif axis == 'primary_area':
            return self.analyze_primary_area(regulars_list)
        elif axis == 'interests':
            return self.analyze_interests(regulars_list)
        elif axis == 'hobbies':
            return self.analyze_hobbies(regulars_list)
        elif axis == 'alcohols':
            return self.analyze_alcohols(regulars_list)
        elif axis == 'visit_purposes':
            return self.analyze_visit_purposes(regulars_list)
        else:
            return []

    def analyze_age_group(self, regulars_list):
        """年齢層分析"""
        age_groups = []
        for relation in regulars_list:
            if relation.user.birthdate:
                age_group = self.calculate_age_group(relation.user.birthdate)
                if age_group:
                    age_groups.append(age_group)
        
        return self.create_distribution(age_groups)

    def analyze_gender(self, regulars_list):
        """性別分析"""
        genders = []
        for relation in regulars_list:
            if relation.user.gender:
                genders.append(relation.user.gender)
        
        return self.create_distribution(genders)

    def analyze_occupation(self, regulars_list):
        """職業分析"""
        occupations = []
        for relation in regulars_list:
            if relation.user.occupation:
                occupations.append(relation.user.occupation)
        
        return self.create_distribution(occupations)

    def analyze_industry(self, regulars_list):
        """業種分析"""
        industries = []
        for relation in regulars_list:
            if relation.user.industry:
                industries.append(relation.user.industry)
        
        return self.create_distribution(industries)

    def analyze_mbti(self, regulars_list):
        """MBTI分析"""
        mbtis = []
        for relation in regulars_list:
            if relation.user.mbti:
                mbtis.append(relation.user.mbti)
        
        return self.create_distribution(mbtis)

    def analyze_primary_area(self, regulars_list):
        """メインエリア分析"""
        areas = []
        for relation in regulars_list:
            if relation.user.my_area:
                areas.append(relation.user.my_area)
        
        return self.create_distribution(areas)

    def analyze_interests(self, regulars_list):
        """興味分析"""
        interests_list = []
        for relation in regulars_list:
            user = relation.user
            if hasattr(user, 'interests') and user.interests:
                try:
                    if isinstance(user.interests, str):
                        interests = json.loads(user.interests)
                    elif isinstance(user.interests, list):
                        interests = user.interests
                    else:
                        continue
                        
                    for interest in interests:
                        if interest and interest.strip():
                            interests_list.append(interest.strip())
                except (json.JSONDecodeError, TypeError):
                    continue
        
        return self.create_distribution(interests_list)

    def analyze_hobbies(self, regulars_list):
        """趣味分析"""
        hobbies_list = []
        for relation in regulars_list:
            user = relation.user
            if hasattr(user, 'hobbies') and user.hobbies:
                try:
                    if isinstance(user.hobbies, str):
                        hobbies = json.loads(user.hobbies)
                    elif isinstance(user.hobbies, list):
                        hobbies = user.hobbies
                    else:
                        continue
                        
                    for hobby in hobbies:
                        if hobby and hobby.strip():
                            hobbies_list.append(hobby.strip())
                except (json.JSONDecodeError, TypeError):
                    continue
        
        return self.create_distribution(hobbies_list)

    def analyze_alcohols(self, regulars_list):
        """好きなお酒分析"""
        alcohols_list = []
        for relation in regulars_list:
            user = relation.user
            if hasattr(user, 'favorite_alcohols') and user.favorite_alcohols:
                try:
                    if isinstance(user.favorite_alcohols, str):
                        alcohols = json.loads(user.favorite_alcohols)
                    elif isinstance(user.favorite_alcohols, list):
                        alcohols = user.favorite_alcohols
                    else:
                        continue
                        
                    for alcohol in alcohols:
                        if alcohol and alcohol.strip():
                            alcohols_list.append(alcohol.strip())
                except (json.JSONDecodeError, TypeError):
                    continue
        
        return self.create_distribution(alcohols_list)

    def analyze_visit_purposes(self, regulars_list):
        """利用目的分析"""
        purposes_list = []
        for relation in regulars_list:
            user = relation.user
            if hasattr(user, 'visit_purposes') and user.visit_purposes:
                try:
                    if isinstance(user.visit_purposes, str):
                        purposes = json.loads(user.visit_purposes)
                    elif isinstance(user.visit_purposes, list):
                        purposes = user.visit_purposes
                    else:
                        continue
                        
                    for purpose in purposes:
                        if purpose and purpose.strip():
                            purposes_list.append(purpose.strip())
                except (json.JSONDecodeError, TypeError):
                    continue
        
        return self.create_distribution(purposes_list)

    def create_distribution(self, data_list):
        """
        データリストから分布情報を作成
        """
        if not data_list:
            return []
            
        # カウントして分布を作成
        counter = Counter(data_list)
        total_count = len(data_list)
        
        distribution = []
        for label, count in counter.most_common():
            percentage = (count / total_count) * 100
            distribution.append({
                "label": label,
                "count": count,
                "percentage": round(percentage, 1)
            })
        
        return distribution


class CommonalitiesAPIView(RegularsAnalysisAPIView):
    """
    ユーザーと常連客の共通点分析API
    Phase 1: 年齢・性別、雰囲気の好み、来店目的
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, shop_id):
        # 店舗の存在確認
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({
                "detail": "店舗が見つかりません"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # ログインユーザーの取得
        user = request.user
        
        # 常連客を取得
        regulars = self.get_regulars_queryset(shop_id)
        if regulars is None:
            return Response({
                "detail": "関係タイプが見つかりません"
            }, status=status.HTTP_400_BAD_REQUEST)
            
        regulars_list = list(regulars)
        total_regulars = len(regulars_list)

        # 常連数が少ない場合
        if total_regulars < 3:
            return Response({
                "age_gender": {"category": "age_gender", "commonalities": [], "total_count": 0},
                "atmosphere_preferences": {"category": "atmosphere_preferences", "commonalities": [], "total_count": 0},
                "visit_purposes": {"category": "visit_purposes", "commonalities": [], "total_count": 0},
                "total_regulars": total_regulars,
                "has_commonalities": False
            })

        # 各カテゴリーの共通点を分析
        age_gender_commonalities = self.analyze_age_gender_commonalities(user, regulars_list)
        atmosphere_commonalities = self.analyze_atmosphere_commonalities(user, regulars_list)
        visit_purpose_commonalities = self.analyze_visit_purpose_commonalities(user, regulars_list)
        
        # 共通点があるかどうかを判定
        has_commonalities = (
            bool(age_gender_commonalities["commonalities"]) or
            bool(atmosphere_commonalities["commonalities"]) or
            bool(visit_purpose_commonalities["commonalities"])
        )

        return Response({
            "age_gender": age_gender_commonalities,
            "atmosphere_preferences": atmosphere_commonalities,
            "visit_purposes": visit_purpose_commonalities,
            "total_regulars": total_regulars,
            "has_commonalities": has_commonalities
        })

    def analyze_age_gender_commonalities(self, user, regulars_list):
        """年齢・性別の共通点を分析"""
        commonalities = []
        matching_count = 0
        
        # ユーザーの年齢層と性別を取得
        user_age_group = None
        if user.birthdate:
            user_age_group = self.calculate_age_group(user.birthdate)
        
        user_gender = user.gender
        
        # 常連客との比較
        for relation in regulars_list:
            regular = relation.user
            is_match = False
            
            # 年齢層の比較
            if user_age_group and regular.birthdate:
                regular_age_group = self.calculate_age_group(regular.birthdate)
                if user_age_group == regular_age_group:
                    is_match = True
            
            # 性別の比較
            if user_gender and regular.gender:
                if user_gender == regular.gender:
                    is_match = True
            
            if is_match:
                matching_count += 1
        
        # 共通点のメッセージを作成
        if matching_count > 0:
            details = []
            if user_age_group:
                details.append(f"{user_age_group}")
            if user_gender:
                # 性別を日本語に変換
                gender_map = {
                    'male': '男性',
                    'female': '女性',
                    'other': 'その他',
                    '男性': '男性',
                    '女性': '女性'
                }
                gender_jp = gender_map.get(user_gender.lower(), user_gender)
                details.append(f"{gender_jp}")
            
            if details:
                commonalities.append("・".join(details))
        
        return {
            "category": "age_gender",
            "commonalities": commonalities,
            "total_count": matching_count
        }

    def analyze_atmosphere_commonalities(self, user, regulars_list):
        """雰囲気の好みの共通点を分析"""
        commonalities = []
        matching_count = 0
        
        # ユーザーの雰囲気評価を取得
        try:
            from .models import ShopAtmosphereFeedback
            user_feedback = ShopAtmosphereFeedback.objects.filter(user=user).first()
            if not user_feedback or not user_feedback.atmosphere_scores:
                return {
                    "category": "atmosphere_preferences",
                    "commonalities": [],
                    "total_count": 0
                }
            
            user_scores = user_feedback.atmosphere_scores
            common_preferences = []
            
            # 各常連客と比較
            for relation in regulars_list:
                regular = relation.user
                regular_feedback = ShopAtmosphereFeedback.objects.filter(user=regular).first()
                
                if regular_feedback and regular_feedback.atmosphere_scores:
                    regular_scores = regular_feedback.atmosphere_scores
                    
                    # 雰囲気指標ごとに比較（±1.0の範囲で類似とみなす）
                    similar_indicators = []
                    for indicator_id, user_score in user_scores.items():
                        if indicator_id in regular_scores:
                            regular_score = regular_scores[indicator_id]
                            if abs(user_score - regular_score) <= 1.0:
                                # 類似する指標の名前を取得
                                try:
                                    indicator = AtmosphereIndicator.objects.get(id=indicator_id)
                                    similar_indicators.append(indicator.name)
                                except AtmosphereIndicator.DoesNotExist:
                                    continue
                    
                    if similar_indicators:
                        matching_count += 1
                        common_preferences.extend(similar_indicators)
            
            # 最も共通する雰囲気指標を抽出（重複を除去し、頻度順）
            if common_preferences:
                from collections import Counter
                preference_counter = Counter(common_preferences)
                top_preferences = [pref for pref, count in preference_counter.most_common(3)]
                commonalities = top_preferences
                
        except Exception as e:
            print(f"Error analyzing atmosphere commonalities: {e}")
            return {
                "category": "atmosphere_preferences",
                "commonalities": [],
                "total_count": 0
            }
        
        return {
            "category": "atmosphere_preferences",
            "commonalities": commonalities,
            "total_count": matching_count
        }

    def analyze_visit_purpose_commonalities(self, user, regulars_list):
        """来店目的の共通点を分析"""
        commonalities = []
        matching_count = 0
        
        # ユーザーの来店目的を取得
        user_purposes = []
        if hasattr(user, 'visit_purposes') and user.visit_purposes.exists():
            user_purposes = list(user.visit_purposes.values_list('name', flat=True))
        
        if not user_purposes:
            return {
                "category": "visit_purposes",
                "commonalities": [],
                "total_count": 0
            }
        
        common_purposes = []
        
        # 常連客との比較
        for relation in regulars_list:
            regular = relation.user
            if hasattr(regular, 'visit_purposes') and regular.visit_purposes.exists():
                regular_purposes = list(regular.visit_purposes.values_list('name', flat=True))
                
                # 共通する来店目的を探す
                shared_purposes = set(user_purposes) & set(regular_purposes)
                if shared_purposes:
                    matching_count += 1
                    common_purposes.extend(shared_purposes)
        
        # 最も共通する来店目的を抽出（重複を除去し、頻度順）
        if common_purposes:
            from collections import Counter
            purpose_counter = Counter(common_purposes)
            top_purposes = [purpose for purpose, count in purpose_counter.most_common(3)]
            commonalities = top_purposes
        
        return {
            "category": "visit_purposes",
            "commonalities": commonalities,
            "total_count": matching_count
        }


##############################################
# ウェルカム機能API
##############################################

class ShopWelcomeAPIView(APIView):
    """
    店舗のウェルカム機能 - ウェルカム数取得とウェルカムボタン
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, shop_id):
        """
        ウェルカム数を取得
        """
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({
                "detail": "店舗が見つかりません"
            }, status=status.HTTP_404_NOT_FOUND)

        from .models import WelcomeAction, UserShopRelation
        
        # ウェルカム数を取得
        welcome_count = WelcomeAction.objects.filter(shop_id=shop_id).count()
        
        # 現在のユーザーが既にウェルカムしているかチェック
        user_welcomed = WelcomeAction.objects.filter(
            shop_id=shop_id,
            user=request.user
        ).exists()
        
        # 現在のユーザーがこの店舗の常連（favorite=1）かチェック
        is_regular = UserShopRelation.objects.filter(
            user=request.user,
            shop_id=shop_id,
            relation_type_id=1  # favorite
        ).exists()

        return Response({
            "welcome_count": welcome_count,
            "user_welcomed": user_welcomed,
            "is_regular": is_regular,
            "show_welcome_button": is_regular  # 常連なら常に表示
        })

    def post(self, request, shop_id):
        """
        ウェルカムボタンを押す（常連のみ）
        """
        try:
            shop = Shop.objects.get(id=shop_id)
        except Shop.DoesNotExist:
            return Response({
                "detail": "店舗が見つかりません"
            }, status=status.HTTP_404_NOT_FOUND)

        from .models import WelcomeAction, UserShopRelation
        
        # 常連（favorite=1）かチェック
        is_regular = UserShopRelation.objects.filter(
            user=request.user,
            shop_id=shop_id,
            relation_type_id=1  # favorite
        ).exists()
        
        if not is_regular:
            return Response({
                "detail": "この機能は常連のお客様のみご利用いただけます"
            }, status=status.HTTP_403_FORBIDDEN)
        
        # ウェルカム状態をトグル
        welcome_action = WelcomeAction.objects.filter(
            user=request.user,
            shop=shop
        ).first()
        
        if welcome_action:
            # 既存のウェルカムを削除（トグルオフ）
            welcome_action.delete()
            user_welcomed = False
            message = "ウェルカムを取り消しました"
        else:
            # 新しいウェルカムを作成（トグルオン）
            WelcomeAction.objects.create(
                user=request.user,
                shop=shop
            )
            user_welcomed = True
            message = "ウェルカムしました！"
        
        # 更新されたウェルカム数を返す
        welcome_count = WelcomeAction.objects.filter(shop_id=shop_id).count()
        
        return Response({
            "welcome_count": welcome_count,
            "user_welcomed": user_welcomed,
            "message": message,
            "show_welcome_button": True  # 常連は常にボタンを表示
        })


##############################################
# 店舗検索API
##############################################

class ShopSearchAPIView(APIView):
    """
    こだわり条件での店舗検索API
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        検索条件に基づいて店舗を検索
        """
        print(f"=== ShopSearchAPIView.get() 呼び出し ===")
        print(f"リクエストパラメータ: {request.GET.dict()}")

        # 基本的なクエリセット
        queryset = Shop.objects.all().select_related('area').prefetch_related(
            'shop_types', 'shop_layouts', 'shop_options', 'images',
            'business_hours', 'tags', 'atmosphere_aggregate'
        )
        
        # 検索条件を適用
        queryset = self.apply_regulars_filters(request, queryset)
        queryset = self.apply_atmosphere_filters(request, queryset)
        queryset = self.apply_scene_filters(request, queryset)
        queryset = self.apply_basic_filters(request, queryset)
        queryset = self.apply_feature_filters(request, queryset)
        queryset = self.apply_drink_filters(request, queryset)
        
        # count_onlyパラメーターのチェック
        count_only = request.GET.get('count_only', 'false').lower() == 'true'
        
        if count_only:
            # 件数のみを返す
            return Response({
                'count': queryset.distinct().count()
            })
        else:
            # 結果をシリアライズ
            serializer = ShopSerializer(queryset.distinct(), many=True, context={'request': request})
            
            return Response({
                'shops': serializer.data,
                'count': queryset.distinct().count()
            })
    
    def apply_regulars_filters(self, request, queryset):
        """常連さんで探すフィルター"""

        initial_count = queryset.count()
        print(f"=== 常連さんフィルター開始 ===")
        print(f"初期クエリセット件数: {initial_count}")
        print(f"リクエストパラメータ: {request.GET.dict()}")
        
        # 常連さんの歓迎度
        welcome_min = request.GET.get('welcome_min')
        if welcome_min:
            try:
                from .models import WelcomeAction
                welcome_min_threshold = int(welcome_min)
                print(f"Welcome filter: welcome_min_threshold={welcome_min_threshold}")

                # WelcomeActionの全データを確認
                all_welcome_actions = WelcomeAction.objects.all().count()
                print(f"WelcomeAction総数: {all_welcome_actions}")

                # 各店舗の歓迎アクション数を確認
                shop_welcome_counts = WelcomeAction.objects.values('shop_id').annotate(
                    welcome_count=Count('id')
                ).order_by('-welcome_count')
                print(f"店舗別歓迎数: {list(shop_welcome_counts)}")

                shop_ids = WelcomeAction.objects.values('shop_id').annotate(
                    welcome_count=Count('id')
                ).filter(welcome_count__gte=welcome_min_threshold).values_list('shop_id', flat=True)

                print(f"Welcome filter result (threshold >= {welcome_min_threshold}): shop_ids={list(shop_ids)}")
                queryset = queryset.filter(id__in=shop_ids)
            except Exception as e:
                print(f"Welcome filter error: {e}")
                import traceback
                traceback.print_exc()
        
        # 常連さんの属性（年齢・性別）
        regular_age_groups = request.GET.getlist('regular_age_groups')
        regular_genders = request.GET.getlist('regular_genders')
        
        # 最も多い年代（単一選択）- その年代が最多の店舗のみ
        dominant_age_group = request.GET.get('dominant_age_group')
        if dominant_age_group:
            try:
                from collections import Counter
                
                favorite_relation = RelationType.objects.get(name='favorite')
                
                # 各店舗で最も多い年代を計算
                shops_with_dominant_age = []
                
                for shop in queryset:
                    # その店舗の常連の年代を取得
                    regulars = UserShopRelation.objects.filter(
                        shop=shop,
                        relation_type=favorite_relation,
                        user__birthdate__isnull=False
                    ).select_related('user')
                    
                    age_groups = []
                    for relation in regulars:
                        age_group = self.calculate_age_group(relation.user.birthdate)
                        if age_group:
                            age_groups.append(age_group)
                    
                    if age_groups:
                        # 最頻出の年代を取得
                        age_counter = Counter(age_groups)
                        most_common_age = age_counter.most_common(1)[0][0]
                        
                        # 指定された年代が最多の場合のみ追加
                        if most_common_age == dominant_age_group:
                            shops_with_dominant_age.append(shop.id)
                
                queryset = queryset.filter(id__in=shops_with_dominant_age)
                
            except RelationType.DoesNotExist:
                pass
        
        # 通常の年齢層フィルター（OR条件）
        elif regular_age_groups or regular_genders:
            # favoriteのrelation_typeを取得
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                regular_relations = UserShopRelation.objects.filter(
                    relation_type=favorite_relation
                ).select_related('user')
                
                # 年齢層フィルター
                if regular_age_groups:
                    filtered_user_ids = []
                    for relation in regular_relations:
                        user = relation.user
                        if user.birthdate:
                            age_group = self.calculate_age_group(user.birthdate)
                            if age_group in regular_age_groups:
                                filtered_user_ids.append(user.id)
                    
                    regular_relations = regular_relations.filter(user_id__in=filtered_user_ids)
                
                # 性別フィルター
                if regular_genders:
                    regular_relations = regular_relations.filter(user__gender__in=regular_genders)
                
                shop_ids = regular_relations.values_list('shop_id', flat=True).distinct()
                queryset = queryset.filter(id__in=shop_ids)
                
            except RelationType.DoesNotExist:
                pass
        
        # 常連さんの数でフィルタリング
        regular_count_min = request.GET.get('regular_count_min')
        if regular_count_min:
            try:
                print(f"Regular count filter: regular_count_min={regular_count_min}")
                favorite_relation = RelationType.objects.get(name='favorite')
                min_count = int(regular_count_min)
                print(f"Regular count filter: min_count={min_count}")

                shop_ids = UserShopRelation.objects.filter(
                    relation_type=favorite_relation
                ).values('shop_id').annotate(
                    regular_count=Count('id')
                ).filter(regular_count__gte=min_count).values_list('shop_id', flat=True)

                print(f"Regular count filter result: shop_ids={list(shop_ids)}")
                queryset = queryset.filter(id__in=shop_ids)
            except Exception as e:
                print(f"Regular count filter error: {e}")
                import traceback
                traceback.print_exc()

        # 職業・業種
        occupation = request.GET.get('occupation')
        industry = request.GET.get('industry')
        
        if occupation or industry:
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                regular_relations = UserShopRelation.objects.filter(
                    relation_type=favorite_relation
                ).select_related('user')
                
                if occupation:
                    regular_relations = regular_relations.filter(user__occupation__icontains=occupation)
                if industry:
                    regular_relations = regular_relations.filter(user__industry__icontains=industry)
                
                shop_ids = regular_relations.values_list('shop_id', flat=True).distinct()
                queryset = queryset.filter(id__in=shop_ids)
            except RelationType.DoesNotExist:
                pass

        # 趣味・興味でフィルタリング
        regular_interests = request.GET.getlist('regular_interests')
        print(f"興味フィルター: regular_interests={regular_interests}")
        if regular_interests:
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                interest_ids = [int(id) for id in regular_interests if id.isdigit()]

                # デバッグ用ログ
                print(f"興味フィルター: interest_ids={interest_ids}")

                # AND条件: 全ての指定興味を持つユーザーのみ
                base_relations = UserShopRelation.objects.filter(relation_type=favorite_relation)
                for interest_id in interest_ids:
                    base_relations = base_relations.filter(user__interests__id=interest_id)
                regular_relations = base_relations.distinct()

                shop_ids = regular_relations.values_list('shop_id', flat=True)
                print(f"興味フィルター結果: shop_ids={list(shop_ids)}")

                queryset = queryset.filter(id__in=shop_ids)
            except (RelationType.DoesNotExist, ValueError):
                pass

        # お酒の好みでフィルタリング
        regular_alcohol_preferences = request.GET.getlist('regular_alcohol_preferences')
        if regular_alcohol_preferences:
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                alcohol_ids = [int(id) for id in regular_alcohol_preferences if id.isdigit()]
                # AND条件: 全ての指定お酒の好みを持つユーザーのみ
                base_relations = UserShopRelation.objects.filter(relation_type=favorite_relation)
                for alcohol_id in alcohol_ids:
                    base_relations = base_relations.filter(user__alcohol_categories__id=alcohol_id)
                regular_relations = base_relations.distinct()
                
                shop_ids = regular_relations.values_list('shop_id', flat=True)
                queryset = queryset.filter(id__in=shop_ids)
            except (RelationType.DoesNotExist, ValueError):
                pass

        # 血液型でフィルタリング
        regular_blood_types = request.GET.getlist('regular_blood_types')
        if regular_blood_types:
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                blood_type_ids = [int(id) for id in regular_blood_types if id.isdigit()]
                # AND条件: 全ての指定血液型を持つユーザーのみ
                base_relations = UserShopRelation.objects.filter(relation_type=favorite_relation)
                for blood_type_id in blood_type_ids:
                    base_relations = base_relations.filter(user__blood_type__id=blood_type_id)
                regular_relations = base_relations.distinct()
                
                shop_ids = regular_relations.values_list('shop_id', flat=True)
                queryset = queryset.filter(id__in=shop_ids)
            except (RelationType.DoesNotExist, ValueError):
                pass

        # MBTIでフィルタリング
        regular_mbti_types = request.GET.getlist('regular_mbti_types')
        if regular_mbti_types:
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                mbti_ids = [int(id) for id in regular_mbti_types if id.isdigit()]

                # デバッグ用ログ
                print(f"MBTIフィルター: mbti_ids={mbti_ids}")

                # AND条件: 全ての指定MBTIを持つユーザーのみ
                base_relations = UserShopRelation.objects.filter(relation_type=favorite_relation)
                for mbti_id in mbti_ids:
                    base_relations = base_relations.filter(user__mbti__id=mbti_id)
                regular_relations = base_relations.distinct()

                shop_ids = regular_relations.values_list('shop_id', flat=True)
                print(f"MBTIフィルター結果: shop_ids={list(shop_ids)}")

                queryset = queryset.filter(id__in=shop_ids)
            except (RelationType.DoesNotExist, ValueError):
                pass

        # 運動頻度でフィルタリング
        regular_exercise_frequency = request.GET.getlist('regular_exercise_frequency')
        if regular_exercise_frequency:
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                frequency_ids = [int(id) for id in regular_exercise_frequency if id.isdigit()]
                # AND条件: 全ての指定運動頻度を持つユーザーのみ
                base_relations = UserShopRelation.objects.filter(relation_type=favorite_relation)
                for frequency_id in frequency_ids:
                    base_relations = base_relations.filter(user__exercise_frequency__id=frequency_id)
                regular_relations = base_relations.distinct()
                
                shop_ids = regular_relations.values_list('shop_id', flat=True)
                queryset = queryset.filter(id__in=shop_ids)
            except (RelationType.DoesNotExist, ValueError):
                pass

        # 食事制限・好みでフィルタリング
        regular_dietary_preferences = request.GET.getlist('regular_dietary_preferences')
        if regular_dietary_preferences:
            try:
                favorite_relation = RelationType.objects.get(name='favorite')
                dietary_ids = [int(id) for id in regular_dietary_preferences if id.isdigit()]
                # AND条件: 全ての指定食事制限を持つユーザーのみ
                base_relations = UserShopRelation.objects.filter(relation_type=favorite_relation)
                for dietary_id in dietary_ids:
                    base_relations = base_relations.filter(user__dietary_preference__id=dietary_id)
                regular_relations = base_relations.distinct()
                
                shop_ids = regular_relations.values_list('shop_id', flat=True)
                queryset = queryset.filter(id__in=shop_ids)
            except (RelationType.DoesNotExist, ValueError):
                pass
                
            except RelationType.DoesNotExist:
                pass
        
        # 共通の好み
        common_interests = request.GET.get('common_interests') == 'true'
        if common_interests and request.user.is_authenticated:
            # ログインユーザーと共通の興味を持つ常連がいる店舗を検索
            user_interests = []
            if hasattr(request.user, 'interests') and request.user.interests:
                try:
                    import json
                    if isinstance(request.user.interests, str):
                        user_interests = json.loads(request.user.interests)
                    elif isinstance(request.user.interests, list):
                        user_interests = request.user.interests
                except (json.JSONDecodeError, TypeError):
                    pass
            
            if user_interests:
                try:
                    favorite_relation = RelationType.objects.get(name='favorite')
                    matching_shop_ids = set()
                    
                    for shop_id in queryset.values_list('id', flat=True):
                        regulars = UserShopRelation.objects.filter(
                            shop_id=shop_id,
                            relation_type=favorite_relation
                        ).select_related('user')
                        
                        for relation in regulars:
                            regular = relation.user
                            if hasattr(regular, 'interests') and regular.interests:
                                try:
                                    if isinstance(regular.interests, str):
                                        regular_interests = json.loads(regular.interests)
                                    elif isinstance(regular.interests, list):
                                        regular_interests = regular.interests
                                    else:
                                        continue
                                    
                                    # 共通の興味があるかチェック
                                    if set(user_interests) & set(regular_interests):
                                        matching_shop_ids.add(shop_id)
                                        break
                                        
                                except (json.JSONDecodeError, TypeError):
                                    continue
                    
                    queryset = queryset.filter(id__in=matching_shop_ids)
                    
                except RelationType.DoesNotExist:
                    pass

        final_count = queryset.count()
        print(f"=== 常連さんフィルター終了 ===")
        print(f"最終クエリセット件数: {final_count}")
        print(f"フィルタリング後のshop_ids: {list(queryset.values_list('id', flat=True))}")

        return queryset
    
    def apply_atmosphere_filters(self, request, queryset):
        """雰囲気・利用シーンフィルター"""
        
        # 雰囲気スライダー
        atmosphere_filters = {}
        for key in request.GET.keys():
            if key.startswith('atmosphere_'):
                parts = key.split('_')
                if len(parts) >= 3 and parts[-1] in ['min', 'max']:
                    indicator_id = '_'.join(parts[1:-1])
                    range_type = parts[-1]
                    try:
                        value = float(request.GET.get(key))
                        if indicator_id not in atmosphere_filters:
                            atmosphere_filters[indicator_id] = {}
                        atmosphere_filters[indicator_id][range_type] = value
                    except (ValueError, TypeError):
                        pass
        
        if atmosphere_filters:
            from django.db.models import Q
            atmosphere_conditions = Q()
            
            for indicator_id, range_values in atmosphere_filters.items():
                min_val = range_values.get('min', -2.0)
                max_val = range_values.get('max', 2.0)
                
                # JSONFieldでの範囲検索
                atmosphere_conditions &= Q(
                    **{f'atmosphere_aggregate__atmosphere_averages__{indicator_id}__gte': min_val,
                       f'atmosphere_aggregate__atmosphere_averages__{indicator_id}__lte': max_val}
                )
            
            queryset = queryset.filter(atmosphere_conditions)
        
        # 利用シーン
        visit_purposes = request.GET.getlist('visit_purposes')
        if visit_purposes:
            from accounts.models import VisitPurpose
            purpose_objects = VisitPurpose.objects.filter(name__in=visit_purposes)
            shop_ids = ShopReview.objects.filter(
                visit_purpose__in=purpose_objects
            ).values_list('shop_id', flat=True).distinct()
            queryset = queryset.filter(id__in=shop_ids)
        
        # 印象タグ
        impression_tags = request.GET.get('impression_tags')
        if impression_tags:
            queryset = queryset.filter(tags__value__icontains=impression_tags).distinct()
        
        return queryset
    
    def apply_scene_filters(self, request, queryset):
        """利用シーンフィルター（追加の詳細条件）"""
        # 将来の拡張用 - 現在は基本フィルターとして実装済み
        return queryset
    
    def apply_basic_filters(self, request, queryset):
        """基本条件フィルター"""
        
        # エリア
        area_ids = request.GET.getlist('area_ids')
        if area_ids:
            try:
                area_ids = [int(aid) for aid in area_ids if aid.isdigit()]
                queryset = queryset.filter(area_id__in=area_ids)
            except (ValueError, TypeError):
                pass
        
        # 予算
        budget_min = request.GET.get('budget_min')
        budget_max = request.GET.get('budget_max')
        budget_type = request.GET.get('budget_type', 'weekday')  # weekday or weekend
        
        if budget_min or budget_max:
            try:
                budget_conditions = Q()
                if budget_type == 'weekend':
                    if budget_min:
                        budget_conditions &= Q(budget_weekend_min__gte=int(budget_min))
                    if budget_max:
                        budget_conditions &= Q(budget_weekend_max__lte=int(budget_max))
                else:
                    if budget_min:
                        budget_conditions &= Q(budget_weekday_min__gte=int(budget_min))
                    if budget_max:
                        budget_conditions &= Q(budget_weekday_max__lte=int(budget_max))
                
                queryset = queryset.filter(budget_conditions)
            except (ValueError, TypeError):
                pass
        
        # 現在地からの距離
        user_lat = request.GET.get('user_lat')
        user_lng = request.GET.get('user_lng')
        distance_km = request.GET.get('distance_km')
        
        if all([user_lat, user_lng, distance_km]):
            try:
                from math import radians, cos, sin, asin, sqrt
                
                def haversine(lon1, lat1, lon2, lat2):
                    """2点間の距離を計算（km）"""
                    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
                    dlon = lon2 - lon1
                    dlat = lat2 - lat1
                    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
                    c = 2 * asin(sqrt(a))
                    r = 6371  # 地球の半径（km）
                    return c * r
                
                user_lat = float(user_lat)
                user_lng = float(user_lng)
                max_distance = float(distance_km)
                
                # 距離フィルタリング
                nearby_shop_ids = []
                for shop in queryset.filter(latitude__isnull=False, longitude__isnull=False):
                    distance = haversine(user_lng, user_lat, shop.longitude, shop.latitude)
                    if distance <= max_distance:
                        nearby_shop_ids.append(shop.id)
                
                queryset = queryset.filter(id__in=nearby_shop_ids)
                
            except (ValueError, TypeError):
                pass
        
        # 今すぐ入れるお店（営業中）
        open_now = request.GET.get('open_now') == 'true'
        if open_now:
            from datetime import datetime
            now = datetime.now()
            current_weekday = now.strftime('%a').lower()
            current_time = now.time()
            
            # 営業中の店舗を取得
            open_shop_ids = BusinessHour.objects.filter(
                weekday=current_weekday,
                is_closed=False,
                open_time__lte=current_time,
                close_time__gte=current_time
            ).values_list('shop_id', flat=True)
            
            queryset = queryset.filter(id__in=open_shop_ids)
        
        # 座席数
        seat_count_min = request.GET.get('seat_count_min')
        seat_count_max = request.GET.get('seat_count_max')
        
        if seat_count_min:
            try:
                min_seats = int(seat_count_min)
                queryset = queryset.filter(seat_count__gte=min_seats)
            except (ValueError, TypeError):
                pass
        
        if seat_count_max:
            try:
                max_seats = int(seat_count_max)
                queryset = queryset.filter(seat_count__lte=max_seats)
            except (ValueError, TypeError):
                pass
        
        return queryset
    
    def apply_feature_filters(self, request, queryset):
        """お店の特徴フィルター"""
        
        # タイプ（AND条件）
        shop_types = request.GET.getlist('shop_types')
        if shop_types:
            try:
                type_ids = [int(tid) for tid in shop_types if tid.isdigit()]
                # AND条件: 選択された全ての店舗タイプを持つ店舗のみ
                for type_id in type_ids:
                    queryset = queryset.filter(shop_types__id=type_id)
            except (ValueError, TypeError):
                pass
        
        # 座席（AND条件）
        shop_layouts = request.GET.getlist('shop_layouts')
        if shop_layouts:
            try:
                layout_ids = [int(lid) for lid in shop_layouts if lid.isdigit()]
                # AND条件: 選択された全てのレイアウトを持つ店舗のみ
                for layout_id in layout_ids:
                    queryset = queryset.filter(shop_layouts__id=layout_id)
            except (ValueError, TypeError):
                pass
        
        # 設備（AND条件）
        shop_options = request.GET.getlist('shop_options')
        if shop_options:
            try:
                option_ids = [int(oid) for oid in shop_options if oid.isdigit()]
                # AND条件: 選択された全ての設備を持つ店舗のみ
                for option_id in option_ids:
                    queryset = queryset.filter(shop_options__id=option_id)
            except (ValueError, TypeError):
                pass
        
        return queryset
    
    def apply_drink_filters(self, request, queryset):
        """ドリンクフィルター"""
        
        # ドリンクジャンル
        alcohol_categories = request.GET.getlist('alcohol_categories')
        if alcohol_categories:
            try:
                category_ids = [int(cid) for cid in alcohol_categories if cid.isdigit()]
                shop_ids = ShopDrink.objects.filter(
                    alcohol_category_id__in=category_ids
                ).values_list('shop_id', flat=True).distinct()
                queryset = queryset.filter(id__in=shop_ids)
            except (ValueError, TypeError):
                pass
        
        # ドリンク銘柄ID
        alcohol_brands = request.GET.getlist('alcohol_brands')
        if alcohol_brands:
            try:
                brand_ids = [int(bid) for bid in alcohol_brands if bid.isdigit()]
                shop_ids = ShopDrink.objects.filter(
                    alcohol_brand_id__in=brand_ids
                ).values_list('shop_id', flat=True).distinct()
                queryset = queryset.filter(id__in=shop_ids)
            except (ValueError, TypeError):
                pass
        
        # ドリンク名リスト（selectedDrinksから）
        drink_names = request.GET.getlist('drink_names')
        if drink_names:
            from django.db.models import Q
            from accounts.models import AlcoholBrand
            
            # ShopDrinkとAlcoholBrandの両方から検索
            drink_conditions = Q()
            
            for drink_name in drink_names:
                # ShopDrinkのname
                drink_conditions |= Q(name__iexact=drink_name)
                # AlcoholBrandのname経由
                drink_conditions |= Q(alcohol_brand__name__iexact=drink_name)
            
            shop_ids = ShopDrink.objects.filter(
                drink_conditions
            ).values_list('shop_id', flat=True).distinct()
            
            queryset = queryset.filter(id__in=shop_ids)
        
        # 単一ドリンク名検索（後方互換）
        drink_name = request.GET.get('drink_name')
        if drink_name:
            shop_ids = ShopDrink.objects.filter(
                models.Q(name__icontains=drink_name) |
                models.Q(alcohol_brand__name__icontains=drink_name)
            ).values_list('shop_id', flat=True).distinct()
            queryset = queryset.filter(id__in=shop_ids)
        
        # いいね数フィルター
        drink_likes_min = request.GET.get('drink_likes_min')
        if drink_likes_min:
            try:
                min_likes = int(drink_likes_min)
                shop_ids = ShopDrink.objects.annotate(
                    likes_count=Count('reactions', filter=models.Q(reactions__reaction_type='like'))
                ).filter(likes_count__gte=min_likes).values_list('shop_id', flat=True).distinct()
                queryset = queryset.filter(id__in=shop_ids)
            except (ValueError, TypeError):
                pass
        
        return queryset
    
    def calculate_age_group(self, birthdate):
        """生年月日から年代を計算"""
        if not birthdate:
            return None
            
        from datetime import date
        today = date.today()
        age = today.year - birthdate.year - ((today.month, today.day) < (birthdate.month, birthdate.day))
        
        if age < 20:
            return "10代"
        elif age < 30:
            return "20代"
        elif age < 40:
            return "30代"  
        elif age < 50:
            return "40代"
        elif age < 60:
            return "50代"
        else:
            return "60代以上"


class AtmosphereIndicatorViewSet(viewsets.ReadOnlyModelViewSet):
    """雰囲気指標のマスターデータを提供するAPI"""
    queryset = AtmosphereIndicator.objects.all().order_by('id')
    serializer_class = AtmosphereIndicatorSerializer
    permission_classes = [AllowAny]
