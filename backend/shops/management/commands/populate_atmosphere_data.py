from django.core.management.base import BaseCommand
from shops.models import AtmosphereIndicator


class Command(BaseCommand):
    help = '雰囲気指標の初期データを作成します'

    def handle(self, *args, **options):
        # 5つの雰囲気指標を作成
        indicators = [
            {
                'name': '会話のスタイル',
                'description_left': '静かに過ごす',
                'description_right': '会話を楽しむ'
            },
            {
                'name': 'お店の活気',
                'description_left': '落ち着いた雰囲気',
                'description_right': '賑やかな雰囲気'
            },
            {
                'name': 'お客さんとの距離感',
                'description_left': '自分の時間を尊重',
                'description_right': '交流が生まれる'
            },
            {
                'name': '常連さんの雰囲気',
                'description_left': '干渉されない',
                'description_right': '輪に入りやすい'
            },
            {
                'name': 'お店の利用シーン',
                'description_left': '特別な時間に',
                'description_right': '日常の延長で'
            }
        ]

        for indicator_data in indicators:
            indicator, created = AtmosphereIndicator.objects.get_or_create(
                name=indicator_data['name'],
                defaults={
                    'description_left': indicator_data['description_left'],
                    'description_right': indicator_data['description_right']
                }
            )
            
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'雰囲気指標「{indicator.name}」を作成しました')
                )
            else:
                self.stdout.write(
                    self.style.WARNING(f'雰囲気指標「{indicator.name}」は既に存在します')
                )

        self.stdout.write(
            self.style.SUCCESS('雰囲気指標の初期データ作成が完了しました')
        )
