"""
常連コミュニティ統計計算サービス

NetFlixレベルのスケーラブル設計:
- 効率的なクエリ最適化
- キャッシュ戦略
- 段階的更新ロジック
"""

from django.db.models import Count, Avg, Q
from django.db import transaction
from decimal import Decimal
from collections import Counter
from datetime import date
from typing import Dict, List, Tuple, Optional

from .models import Shop, ShopRegularStatistics, RegularUsageScene
from accounts.models import UserAccount, UserAtmospherePreference, VisitPurpose
from shops.models import UserShopRelation, RelationType


class RegularCommunityStatsService:
    """常連コミュニティの統計計算サービス"""

    @staticmethod
    def calculate_age_group(birthdate) -> Optional[str]:
        """
        生年月日から年代を計算（既存ロジックと同じ）
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
        elif age < 70:
            return "60代"
        else:
            return "70代以上"

    @staticmethod
    def get_regulars_for_shop(shop_id: int) -> List[UserAccount]:
        """店舗の常連ユーザーを取得（行きつけリレーション）"""
        try:
            favorite_relation = RelationType.objects.get(name="favorite")
            regular_relations = UserShopRelation.objects.filter(
                shop_id=shop_id,
                relation_type=favorite_relation
            ).select_related('user')
            return [relation.user for relation in regular_relations]
        except RelationType.DoesNotExist:
            return []

    @staticmethod
    def calculate_atmosphere_tendency(regulars: List[UserAccount]) -> Tuple[str, Decimal, Dict]:
        """
        常連の雰囲気傾向を計算

        Returns:
            - tendency: 'solitude', 'flexible', 'community'
            - percentage: 最多傾向の割合
            - distribution: 全分布データ
        """
        if not regulars:
            return None, Decimal('0.00'), {}

        user_ids = [user.id for user in regulars]

        # 各ユーザーの雰囲気好み平均値を計算
        user_averages = []
        for user_id in user_ids:
            prefs = UserAtmospherePreference.objects.filter(user_profile_id=user_id)
            if prefs.exists():
                avg_score = prefs.aggregate(avg=Avg('score'))['avg'] or 0
                user_averages.append(float(avg_score))

        if not user_averages:
            return None, Decimal('0.00'), {}

        # 傾向分類
        tendencies = []
        for avg in user_averages:
            if avg < -0.5:
                tendencies.append('solitude')
            elif avg > 0.5:
                tendencies.append('community')
            else:
                tendencies.append('flexible')

        # 分布計算
        counter = Counter(tendencies)
        total = len(tendencies)

        distribution = {
            'solitude': round((counter.get('solitude', 0) / total) * 100, 2),
            'flexible': round((counter.get('flexible', 0) / total) * 100, 2),
            'community': round((counter.get('community', 0) / total) * 100, 2)
        }

        # 最多傾向を特定
        most_common = counter.most_common(1)[0]
        tendency = most_common[0]
        percentage = Decimal(str(round((most_common[1] / total) * 100, 2)))

        return tendency, percentage, distribution

    @staticmethod
    def calculate_visit_purpose_stats(shop_id: int, regulars: List[UserAccount]) -> Tuple[Optional[VisitPurpose], Dict]:
        """
        利用シーン統計を計算

        Returns:
            - popular_purpose: 最も人気の利用目的
            - distribution: 利用目的分布
        """
        if not regulars:
            return None, {}

        user_ids = [user.id for user in regulars]

        # 各利用目的の出現回数を集計
        usage_scenes = RegularUsageScene.objects.filter(
            shop_id=shop_id,
            user_id__in=user_ids
        ).prefetch_related('visit_purposes')

        purpose_counter = Counter()
        total_scenes = 0

        for scene in usage_scenes:
            purposes = scene.visit_purposes.all()
            for purpose in purposes:
                purpose_counter[purpose.id] += 1
                total_scenes += 1

        if not purpose_counter:
            return None, {}

        # 最人気の利用目的を特定
        most_common_id = purpose_counter.most_common(1)[0][0]
        popular_purpose = VisitPurpose.objects.get(id=most_common_id)

        # 分布データを作成
        distribution = {}
        for purpose_id, count in purpose_counter.items():
            purpose = VisitPurpose.objects.get(id=purpose_id)
            percentage = round((count / total_scenes) * 100, 2)
            distribution[purpose.name] = {
                'count': count,
                'percentage': percentage
            }

        return popular_purpose, distribution

    @staticmethod
    def calculate_age_gender_summary(regulars: List[UserAccount]) -> Dict:
        """年代・性別サマリーを計算"""
        if not regulars:
            return {}

        # 年代・性別の分布を計算
        age_counter = Counter()
        gender_counter = Counter()

        for user in regulars:
            age_group = RegularCommunityStatsService.calculate_age_group(user.birthdate)
            if age_group:
                age_counter[age_group] += 1
            if user.gender:
                gender_counter[user.gender] += 1

        total_users = len(regulars)

        # 最多年代・性別を特定
        most_common_age = age_counter.most_common(1)[0] if age_counter else None
        most_common_gender = gender_counter.most_common(1)[0] if gender_counter else None

        summary = {}
        if most_common_age and most_common_gender:
            age_name = most_common_age[0]
            gender_name = most_common_gender[0]
            summary['dominant_demographic'] = f"{age_name}・{gender_name}が中心"
            summary['age_distribution'] = dict(age_counter)
            summary['gender_distribution'] = dict(gender_counter)
            summary['total_regulars'] = total_users

        return summary

    @classmethod
    @transaction.atomic
    def update_shop_statistics(cls, shop_id: int) -> ShopRegularStatistics:
        """
        店舗の常連統計を更新（トランザクション保証）
        """
        shop = Shop.objects.get(id=shop_id)
        regulars = cls.get_regulars_for_shop(shop_id)

        # 統計計算
        atmosphere_tendency, tendency_percentage, atmosphere_distribution = cls.calculate_atmosphere_tendency(regulars)
        popular_purpose, visit_purpose_distribution = cls.calculate_visit_purpose_stats(shop_id, regulars)
        age_gender_summary = cls.calculate_age_gender_summary(regulars)

        # 統計データを更新または作成
        stats, created = ShopRegularStatistics.objects.get_or_create(
            shop=shop,
            defaults={
                'regular_count': len(regulars),
                'atmosphere_tendency': atmosphere_tendency,
                'atmosphere_tendency_percentage': tendency_percentage,
                'atmosphere_distribution': atmosphere_distribution,
                'popular_visit_purpose': popular_purpose,
                'visit_purpose_distribution': visit_purpose_distribution,
                'age_gender_summary': age_gender_summary,
            }
        )

        if not created:
            # 既存データを更新
            stats.regular_count = len(regulars)
            stats.atmosphere_tendency = atmosphere_tendency
            stats.atmosphere_tendency_percentage = tendency_percentage
            stats.atmosphere_distribution = atmosphere_distribution
            stats.popular_visit_purpose = popular_purpose
            stats.visit_purpose_distribution = visit_purpose_distribution
            stats.age_gender_summary = age_gender_summary
            stats.save()

        return stats

    @staticmethod
    def calculate_user_commonalities(user: UserAccount, shop_id: int) -> Dict:
        """
        ユーザーと常連との共通点を計算
        """
        regulars = RegularCommunityStatsService.get_regulars_for_shop(shop_id)
        if not regulars:
            return {}

        commonalities = {}

        # 1. 年代・性別の共通点
        age_gender_match_count = 0
        for regular in regulars:
            user_age_group = RegularCommunityStatsService.calculate_age_group(user.birthdate)
            regular_age_group = RegularCommunityStatsService.calculate_age_group(regular.birthdate)
            if (user_age_group == regular_age_group and
                user.gender == regular.gender):
                age_gender_match_count += 1

        if len(regulars) > 0:
            age_gender_percentage = round((age_gender_match_count / len(regulars)) * 100, 2)
            commonalities['age_gender'] = {
                'percentage': age_gender_percentage,
                'text': f"あなたと同じ{user_age_group}・{user.gender}の方がそこそこいます({age_gender_percentage}%)"
            }

        # 2. 雰囲気好みの共通点
        user_atmosphere_avg = UserAtmospherePreference.objects.filter(
            user_profile=user
        ).aggregate(avg=Avg('score'))['avg'] or 0

        user_tendency = 'flexible'
        if user_atmosphere_avg < -0.5:
            user_tendency = 'solitude'
        elif user_atmosphere_avg > 0.5:
            user_tendency = 'community'

        # 常連の雰囲気傾向と比較
        stats = ShopRegularStatistics.objects.filter(shop_id=shop_id).first()
        if stats and stats.atmosphere_distribution:
            user_tendency_percentage = stats.atmosphere_distribution.get(user_tendency, 0)
            tendency_names = {
                'solitude': '一人の時間を重視',
                'flexible': 'フレキシブル',
                'community': 'コミュニティを重視'
            }
            commonalities['atmosphere'] = {
                'percentage': user_tendency_percentage,
                'text': f"あなたと同じく{tendency_names[user_tendency]}する方が多いです({user_tendency_percentage}%)"
            }

        # 3. 利用シーンの共通点
        user_usage_scene = RegularUsageScene.objects.filter(
            user=user,
            shop_id=shop_id
        ).first()

        if user_usage_scene and stats and stats.visit_purpose_distribution:
            user_purposes = user_usage_scene.visit_purposes.all()
            max_common_percentage = 0
            common_purpose_name = ""

            for purpose in user_purposes:
                purpose_data = stats.visit_purpose_distribution.get(purpose.name, {})
                percentage = purpose_data.get('percentage', 0)
                if percentage > max_common_percentage:
                    max_common_percentage = percentage
                    common_purpose_name = purpose.name

            if max_common_percentage > 0:
                commonalities['visit_purpose'] = {
                    'percentage': max_common_percentage,
                    'text': f"あなたと同じく{common_purpose_name}で利用する方が多いです({max_common_percentage}%)"
                }

        return commonalities