from django.db.models import Count, Q, Avg
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import timedelta

from .models import UserAccount, ShopViewHistory, UserAtmospherePreference, VisitPurpose
from shops.models import (
    UserShopRelation, ShopReview, ShopAtmosphereFeedback, 
    ShopTagReaction, WelcomeAction, ShopAtmosphereAggregate
)


class DashboardSummaryView(APIView):
    """
    ダッシュボードサマリー情報を取得
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        
        # 行きつけの店 (relation_type_id=1: favorite)
        favorite_shops_count = UserShopRelation.objects.filter(
            user=user, 
            relation_type_id=1
        ).count()
        
        # 行った店 (relation_type_id=2: visited)
        visited_shops_count = UserShopRelation.objects.filter(
            user=user, 
            relation_type_id=2
        ).count()
        
        # 気になる店 (relation_type_id=3: interested)
        interested_shops_count = UserShopRelation.objects.filter(
            user=user, 
            relation_type_id=3
        ).count()
        
        # 行きつけの店の詳細情報
        favorite_shops = UserShopRelation.objects.filter(
            user=user, relation_type_id=1
        ).select_related('shop')
        
        favorite_shops_data = []
        total_welcome_count = 0
        user_preferences = {}
        average_atmosphere = {}
        
        # ユーザーの雰囲気好みを取得
        user_atmosphere_prefs = UserAtmospherePreference.objects.filter(user_profile=user)
        for pref in user_atmosphere_prefs:
            user_preferences[pref.indicator.id] = pref.score
        
        # ユーザーがウェルカムした店舗のIDリスト
        user_welcomed_shop_ids = WelcomeAction.objects.filter(
            user=user
        ).values_list('shop_id', flat=True)
        
        for relation in favorite_shops:
            shop = relation.shop
            is_welcomed_by_user = shop.id in user_welcomed_shop_ids
            if is_welcomed_by_user:
                total_welcome_count += 1
            
            # 店舗の雰囲気集計データを取得
            try:
                atmosphere_aggregate = ShopAtmosphereAggregate.objects.get(shop=shop)
                shop_atmosphere = atmosphere_aggregate.atmosphere_averages
            except ShopAtmosphereAggregate.DoesNotExist:
                shop_atmosphere = {}
            
            favorite_shops_data.append({
                'shop_id': shop.id,
                'shop_name': shop.name,
                'is_welcomed_by_user': is_welcomed_by_user,
                'atmosphere_scores': shop_atmosphere
            })
        
        # 行きつけの店の雰囲気平均値を計算
        if favorite_shops_data:
            for shop_data in favorite_shops_data:
                for indicator_id, score in shop_data['atmosphere_scores'].items():
                    if indicator_id not in average_atmosphere:
                        average_atmosphere[indicator_id] = []
                    average_atmosphere[indicator_id].append(score)
            
            # 平均値を計算
            for indicator_id in average_atmosphere:
                scores = average_atmosphere[indicator_id]
                average_atmosphere[indicator_id] = sum(scores) / len(scores) if scores else 0
        
        # 行った店の詳細情報とフィードバック状況
        visited_shops = UserShopRelation.objects.filter(
            user=user, relation_type_id=2
        ).select_related('shop')
        
        feedback_shop_ids = ShopAtmosphereFeedback.objects.filter(
            user=user, shop_id__in=[vs.shop.id for vs in visited_shops]
        ).values_list('shop_id', flat=True)
        
        visited_shops_data = []
        visited_without_feedback_count = 0
        
        for relation in visited_shops:
            shop = relation.shop
            has_feedback = shop.id in feedback_shop_ids
            if not has_feedback:
                visited_without_feedback_count += 1
            
            visited_shops_data.append({
                'shop_id': shop.id,
                'shop_name': shop.name,
                'has_feedback': has_feedback
            })
        
        return Response({
            'favorite_shops_count': favorite_shops_count,
            'visited_shops_count': visited_shops_count,
            'interested_shops_count': interested_shops_count,
            'favorite_shops_details': favorite_shops_data,
            'visited_shops_details': visited_shops_data,
            'total_welcome_count': total_welcome_count,
            'user_atmosphere_preferences': user_preferences,
            'favorite_shops_atmosphere_average': average_atmosphere,
            'visited_without_feedback_count': visited_without_feedback_count
        })


class ViewHistoryView(APIView):
    """
    閲覧履歴を取得
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        user = request.user
        
        # 最新の閲覧履歴を取得（店舗ごとに最新のもののみ）
        from django.db.models import Max
        
        # 各店舗の最新の閲覧日時を取得
        latest_views = ShopViewHistory.objects.filter(user=user)\
            .values('shop_id')\
            .annotate(latest_viewed=Max('viewed_at'))\
            .order_by('-latest_viewed')[:limit]
        
        # 最新の閲覧履歴のIDを取得
        view_history_ids = []
        for view in latest_views:
            latest_history = ShopViewHistory.objects.filter(
                user=user,
                shop_id=view['shop_id'],
                viewed_at=view['latest_viewed']
            ).first()
            if latest_history:
                view_history_ids.append(latest_history.id)
        
        # 履歴データを取得
        view_history = ShopViewHistory.objects.filter(
            id__in=view_history_ids
        ).select_related('shop').order_by('-viewed_at')
        
        data = []
        for history in view_history:
            data.append({
                'id': history.id,
                'shop_name': history.shop.name,
                'shop_id': history.shop.id,
                'viewed_at': history.viewed_at.isoformat()
            })
        
        return Response(data)


class ReviewHistoryView(APIView):
    """
    口コミ履歴を取得
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        user = request.user
        
        reviews = ShopReview.objects.filter(user=user)\
            .select_related('shop', 'visit_purpose')\
            .order_by('-created_at')[:limit]
        
        data = []
        for review in reviews:
            data.append({
                'id': review.id,
                'shop_name': review.shop.name,
                'shop_id': review.shop.id,
                'content': review.comment,
                'rating': 5,  # ShopReviewにはratingがないため、デフォルト値を設定
                'visit_purpose': {
                    'id': review.visit_purpose.id if review.visit_purpose else None,
                    'name': review.visit_purpose.name if review.visit_purpose else None
                },
                'created_at': review.created_at.isoformat()
            })
        
        return Response(data)


class RecentActivityView(APIView):
    """
    最近のアクティビティを取得
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        user = request.user
        activities = []
        
        # 最近30日のアクティビティを取得
        thirty_days_ago = timezone.now() - timedelta(days=30)
        
        # 閲覧履歴
        recent_views = ShopViewHistory.objects.filter(
            user=user, 
            viewed_at__gte=thirty_days_ago
        ).select_related('shop').order_by('-viewed_at')[:limit//2]
        
        for view in recent_views:
            activities.append({
                'id': f"view_{view.id}",
                'type': 'view',
                'shop_name': view.shop.name,
                'shop_id': view.shop.id,
                'created_at': view.viewed_at.isoformat()
            })
        
        # 口コミ履歴
        recent_reviews = ShopReview.objects.filter(
            user=user,
            created_at__gte=thirty_days_ago
        ).select_related('shop').order_by('-created_at')[:limit//2]
        
        for review in recent_reviews:
            activities.append({
                'id': f"review_{review.id}",
                'type': 'review',
                'shop_name': review.shop.name,
                'shop_id': review.shop.id,
                'content': review.comment[:50] + '...' if len(review.comment) > 50 else review.comment,
                'created_at': review.created_at.isoformat()
            })
        
        # お気に入り追加履歴
        recent_favorites = UserShopRelation.objects.filter(
            user=user,
            relation_type_id=1,  # favorite
            created_at__gte=thirty_days_ago
        ).select_related('shop').order_by('-created_at')[:limit//3]
        
        for favorite in recent_favorites:
            activities.append({
                'id': f"favorite_{favorite.id}",
                'type': 'favorite',
                'shop_name': favorite.shop.name,
                'shop_id': favorite.shop.id,
                'created_at': favorite.created_at.isoformat()
            })
        
        # 時系列でソート
        activities.sort(key=lambda x: x['created_at'], reverse=True)
        
        return Response(activities[:limit])


class AtmosphereFeedbackHistoryView(APIView):
    """
    雰囲気フィードバック履歴を取得
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        user = request.user
        
        feedbacks = ShopAtmosphereFeedback.objects.filter(user=user)\
            .select_related('shop')\
            .order_by('-created_at')[:limit]
        
        data = []
        for feedback in feedbacks:
            data.append({
                'id': feedback.id,
                'shop_name': feedback.shop.name,
                'shop_id': feedback.shop.id,
                'atmosphere_scores': feedback.atmosphere_scores,
                'created_at': feedback.created_at.isoformat()
            })
        
        return Response(data)


class TagReactionHistoryView(APIView):
    """
    印象タグ履歴を取得
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        limit = int(request.query_params.get('limit', 10))
        user = request.user
        
        tag_reactions = ShopTagReaction.objects.filter(user=user)\
            .select_related('shop_tag', 'shop_tag__shop')\
            .order_by('-reacted_at')[:limit]
        
        data = []
        for reaction in tag_reactions:
            data.append({
                'id': reaction.id,
                'shop_name': reaction.shop_tag.shop.name,
                'shop_id': reaction.shop_tag.shop.id,
                'tag_text': reaction.shop_tag.value,
                'tag_id': reaction.shop_tag.id,
                'reacted_at': reaction.reacted_at.isoformat()
            })
        
        return Response(data)


def track_shop_view(user, shop):
    """
    店舗閲覧履歴を記録する関数
    """
    if user.is_authenticated:
        # 同じ店舗を1時間以内に複数回見た場合は記録しない
        one_hour_ago = timezone.now() - timedelta(hours=1)
        
        existing_view = ShopViewHistory.objects.filter(
            user=user,
            shop=shop,
            viewed_at__gte=one_hour_ago
        ).exists()
        
        if not existing_view:
            ShopViewHistory.objects.create(user=user, shop=shop)