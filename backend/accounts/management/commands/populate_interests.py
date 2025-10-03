import json
import random
from django.core.management.base import BaseCommand
from accounts.models import UserAccount, Interest, InterestCategory

class Command(BaseCommand):
    help = 'Populate user interests for existing users'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update all users, even if they already have interests',
        )

    SAMPLE_INTERESTS = [
        'コーヒー', 'お酒', '読書', '映画鑑賞', '音楽鑑賞', 'ゲーム', 'アニメ',
        '旅行', '写真', '料理', 'スポーツ', 'ヨガ', 'ランニング', '筋トレ',
        'カラオケ', 'ダンス', 'アート', 'デザイン', 'プログラミング', 'AI',
        '起業', 'マーケティング', '投資', '副業', 'キャリア', '語学学習',
        'ファッション', '美容', '健康', 'メンタルヘルス', '自己啓発',
        'ボードゲーム', 'アウトドア', 'キャンプ', '釣り', 'サイクリング',
        'グルメ', 'カフェ巡り', 'バー巡り', 'ワイン', '日本酒', 'クラフトビール'
    ]

    def handle(self, *args, **options):
        users = UserAccount.objects.all()
        updated_count = 0

        # デフォルトカテゴリを取得または作成
        default_category, created = InterestCategory.objects.get_or_create(
            name='一般'
        )

        for user in users:
            # 強制更新フラグがない場合、既にinterestsがあるかチェック
            if not options['force']:
                if user.interests.exists():
                    continue

            # 3-7個のランダムな興味を選択
            num_interests = random.randint(3, 7)
            selected_interests = random.sample(self.SAMPLE_INTERESTS, num_interests)

            # Interestオブジェクトを取得または作成してユーザーに追加
            interest_objects = []
            for interest_name in selected_interests:
                interest_obj, created = Interest.objects.get_or_create(
                    name=interest_name,
                    category=default_category
                )
                interest_objects.append(interest_obj)

            # ManyToManyフィールドに設定
            user.interests.set(interest_objects)
            updated_count += 1

            self.stdout.write(
                f'Updated user {user.email} with interests: {", ".join(selected_interests)}'
            )

        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {updated_count} users with interests.')
        )