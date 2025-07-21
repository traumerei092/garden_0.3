from django.core.management.base import BaseCommand
from accounts.models import ExerciseFrequency, DietaryPreference, BudgetRange, VisitPurpose


class Command(BaseCommand):
    help = '新しいプロフィールデータを作成します'

    def handle(self, *args, **options):
        self.stdout.write('新しいプロフィールデータを作成中...')

        # 運動頻度データ
        exercise_frequencies = [
            {'name': '毎日', 'order': 1},
            {'name': '週に5-6回', 'order': 2},
            {'name': '週に3-4回', 'order': 3},
            {'name': '週に1-2回', 'order': 4},
            {'name': 'たまに', 'order': 5},
            {'name': '全くしない', 'order': 6},
        ]

        for freq_data in exercise_frequencies:
            freq, created = ExerciseFrequency.objects.get_or_create(
                name=freq_data['name'],
                defaults={'order': freq_data['order']}
            )
            if created:
                self.stdout.write(f'運動頻度「{freq.name}」を作成しました')

        # 食事制限・好みデータ
        dietary_preferences = [
            {'name': 'なし', 'description': '特に制限や好みはありません'},
            {'name': 'ヴィーガン', 'description': '動物性食品を一切摂取しません'},
            {'name': 'ベジタリアン', 'description': '肉類を摂取しません'},
            {'name': '肉中心', 'description': '肉料理を好みます'},
            {'name': '魚介中心', 'description': '魚介類を好みます'},
            {'name': 'グルテンフリー', 'description': 'グルテンを含む食品を避けます'},
            {'name': '低糖質', 'description': '糖質を控えめにしています'},
            {'name': 'ハラル', 'description': 'イスラム教の食事規定に従います'},
            {'name': 'コーシャ', 'description': 'ユダヤ教の食事規定に従います'},
            {'name': '辛い物好き', 'description': 'スパイシーな料理を好みます'},
            {'name': '甘い物好き', 'description': 'デザートや甘い料理を好みます'},
        ]

        for pref_data in dietary_preferences:
            pref, created = DietaryPreference.objects.get_or_create(
                name=pref_data['name'],
                defaults={'description': pref_data['description']}
            )
            if created:
                self.stdout.write(f'食事制限・好み「{pref.name}」を作成しました')

        # 希望予算データ
        budget_ranges = [
            {'name': '〜1,000円', 'min_price': None, 'max_price': 1000, 'order': 1},
            {'name': '1,000円〜2,000円', 'min_price': 1000, 'max_price': 2000, 'order': 2},
            {'name': '2,000円〜3,000円', 'min_price': 2000, 'max_price': 3000, 'order': 3},
            {'name': '3,000円〜4,000円', 'min_price': 3000, 'max_price': 4000, 'order': 4},
            {'name': '4,000円〜5,000円', 'min_price': 4000, 'max_price': 5000, 'order': 5},
            {'name': '5,000円〜7,000円', 'min_price': 5000, 'max_price': 7000, 'order': 6},
            {'name': '7,000円〜10,000円', 'min_price': 7000, 'max_price': 10000, 'order': 7},
            {'name': '10,000円〜15,000円', 'min_price': 10000, 'max_price': 15000, 'order': 8},
            {'name': '15,000円〜', 'min_price': 15000, 'max_price': None, 'order': 9},
            {'name': '予算は気にしない', 'min_price': None, 'max_price': None, 'order': 10},
        ]

        for budget_data in budget_ranges:
            budget, created = BudgetRange.objects.get_or_create(
                name=budget_data['name'],
                defaults={
                    'min_price': budget_data['min_price'],
                    'max_price': budget_data['max_price'],
                    'order': budget_data['order']
                }
            )
            if created:
                self.stdout.write(f'希望予算「{budget.name}」を作成しました')

        # 利用目的データ
        visit_purposes = [
            {'name': '一人で飲む', 'description': '一人の時間を楽しみたい', 'order': 1},
            {'name': '友人と飲む', 'description': '友人との時間を楽しみたい', 'order': 2},
            {'name': 'デート', 'description': '恋人や気になる人との時間', 'order': 3},
            {'name': '仕事の打ち合わせ', 'description': 'ビジネス関連の会合', 'order': 4},
            {'name': '接待', 'description': 'お客様をもてなす', 'order': 5},
            {'name': '記念日・お祝い', 'description': '特別な日を祝う', 'order': 6},
            {'name': '新しい出会い', 'description': '新しい人との出会いを求める', 'order': 7},
            {'name': 'ストレス発散', 'description': '日頃の疲れを癒したい', 'order': 8},
            {'name': '趣味の話', 'description': '共通の趣味について語り合う', 'order': 9},
            {'name': '情報収集', 'description': '業界の情報や人脈作り', 'order': 10},
        ]

        for purpose_data in visit_purposes:
            purpose, created = VisitPurpose.objects.get_or_create(
                name=purpose_data['name'],
                defaults={
                    'description': purpose_data['description'],
                    'order': purpose_data['order']
                }
            )
            if created:
                self.stdout.write(f'利用目的「{purpose.name}」を作成しました')

        self.stdout.write(self.style.SUCCESS('新しいプロフィールデータの作成が完了しました'))
