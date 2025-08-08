from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Shop, ShopDrink, ShopDrinkReaction
from .serializers import ShopDrinkSerializer, ShopDrinkReactionSerializer


class ShopDrinkViewSet(viewsets.ModelViewSet):
    serializer_class = ShopDrinkSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ShopDrink.objects.select_related(
            'shop', 'alcohol_category', 'alcohol_brand', 'drink_style', 'created_by'
        ).prefetch_related('reactions')

    def get_permissions(self):
        if self.action in ['shop_drinks', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def shop_drinks(self, request):
        """特定店舗のドリンクメニュー取得"""
        shop_id = request.query_params.get('shop_id')
        if not shop_id:
            return Response(
                {"detail": "shop_id は必須です"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            shop = get_object_or_404(Shop, id=shop_id)
            drinks = ShopDrink.objects.filter(
                shop=shop, is_available=True
            ).select_related(
                'alcohol_category', 'alcohol_brand', 'drink_style', 'created_by'
            ).prefetch_related('reactions').order_by('-created_at')

            serializer = ShopDrinkSerializer(drinks, many=True, context={'request': request})
            return Response({"drinks": serializer.data})

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=False, methods=['post'])
    def create_drink(self, request):
        """ドリンクメニュー登録"""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        shop_id = request.data.get('shop_id')
        if not shop_id:
            return Response(
                {"detail": "shop_id は必須です"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            shop = get_object_or_404(Shop, id=shop_id)
            
            # データの準備
            drink_data = request.data.copy()
            drink_data['shop'] = shop.id
            
            serializer = ShopDrinkSerializer(data=drink_data, context={'request': request})
            
            if serializer.is_valid():
                drink = serializer.save(shop=shop, created_by=request.user)
                response_serializer = ShopDrinkSerializer(drink, context={'request': request})
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            else:
                print(f"❌ Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def toggle_reaction(self, request, pk=None):
        """ドリンクへの反応切り替え"""
        if not request.user.is_authenticated:
            return Response(
                {"detail": "認証が必要です"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            drink = self.get_object()
            reaction_type = request.data.get('reaction_type', 'like')

            # 既存の反応を確認
            existing_reaction = ShopDrinkReaction.objects.filter(
                drink=drink, user=request.user, reaction_type=reaction_type
            ).first()

            if existing_reaction:
                # 既存の反応を削除
                existing_reaction.delete()
                status_text = 'removed'
            else:
                # 新しい反応を作成
                ShopDrinkReaction.objects.create(
                    drink=drink, user=request.user, reaction_type=reaction_type
                )
                status_text = 'added'

            # 更新された反応数を取得
            reaction_count = drink.reactions.filter(reaction_type=reaction_type).count()

            return Response({
                'status': status_text,
                'reaction_count': reaction_count
            })

        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )