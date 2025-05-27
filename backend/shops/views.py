from rest_framework import viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db import transaction, models
from django.db.models import Count
from .models import (
    Shop, ShopType, ShopLayout, ShopOption,
    ShopUpdateLog, ShopUpdateReaction, ShopReview,
    ShopReviewReaction, RelationType, UserShopRelation,
    ShopTag, ShopTagReaction, ShopMessage, ShopStaff, ShopImage,
    BusinessHour
)
from .serializers import ShopCreateSerializer, ShopTypeSerializer, ShopLayoutSerializer, ShopOptionSerializer, \
    ShopSerializer, ShopTagSerializer, ShopTagCreateSerializer, ShopTagReactionSerializer, UserShopRelationSerializer
from .utils.geocode import get_coordinates_from_address


class ShopViewSet(viewsets.ModelViewSet):
    queryset = Shop.objects.all()
    serializer_class = ShopSerializer
    permission_classes = [AllowAny]

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
        return context

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

                # 住所から緯度・経度を取得
                address = request.data.get('address', '')
                if address:
                    coordinates = get_coordinates_from_address(address)
                    if coordinates:  # Noneでない場合のみアンパック
                        latitude, longitude = coordinates
                        serializer.validated_data['latitude'] = latitude
                        serializer.validated_data['longitude'] = longitude

                # 店舗を保存
                shop = serializer.save(created_by=request.user)

                # ManyToManyフィールドの設定
                shop_types = request.data.getlist('shop_types', [])
                shop_layouts = request.data.getlist('shop_layouts', [])
                shop_options = request.data.getlist('shop_options', [])

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

class ShopUpdateLogViewSet(viewsets.ModelViewSet):
    queryset = ShopUpdateLog.objects.all()
    permission_classes = [IsAuthenticated]

class ShopUpdateReactionViewSet(viewsets.ModelViewSet):
    queryset = ShopUpdateReaction.objects.all()
    permission_classes = [IsAuthenticated]

class ShopReviewViewSet(viewsets.ModelViewSet):
    queryset = ShopReview.objects.all()
    permission_classes = [IsAuthenticated]

class ShopReviewReactionViewSet(viewsets.ModelViewSet):
    queryset = ShopReviewReaction.objects.all()
    permission_classes = [IsAuthenticated]

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

class ShopMessageViewSet(viewsets.ModelViewSet):
    queryset = ShopMessage.objects.all()
    permission_classes = [IsAuthenticated]

class ShopStaffViewSet(viewsets.ModelViewSet):
    queryset = ShopStaff.objects.all()
    permission_classes = [IsAuthenticated]

# UserShopRelationViewSet
class UserShopRelationViewSet(viewsets.ModelViewSet):
    serializer_class = UserShopRelationSerializer
    def get_permissions(self):
        if self.action == 'shop_stats':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_queryset(self):
        return UserShopRelation.objects.filter(user=self.request.user)
    
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
    def shop_stats(self, request):
        """
        特定の店舗に対する関係性の統計情報を取得
        """
        shop_id = request.query_params.get('shop_id')
        if not shop_id:
            return Response(
                {"detail": "shop_id は必須です"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # 各関係タイプのカウントを取得
            relation_counts = UserShopRelation.objects.filter(
                shop_id=shop_id
            ).values('relation_type').annotate(
                count=Count('id')
            )

            # カウント情報を整形
            counts_by_type = {
                str(count['relation_type']): count['count']
                for count in relation_counts
            }

            # ログインユーザーの関係性を取得
            user_relations = []
            if request.user.is_authenticated:
                user_relations = list(
                    UserShopRelation.objects.filter(
                        user=request.user,
                        shop_id=shop_id
                    ).values_list('relation_type_id', flat=True)
                )

            # 全ての関係タイプ情報を取得
            relation_types = RelationType.objects.all()

            response_data = {
                "counts": [
                    {
                        "id": rt.id,
                        "name": rt.name,
                        "label": rt.label,
                        "count": counts_by_type.get(str(rt.id), 0),
                        "color": rt.color
                    }
                    for rt in relation_types
                ],
                "user_relations": user_relations
            }

            return Response(response_data)
        except Exception as e:
            return Response(
                {"detail": f"統計情報の取得に失敗しました: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)