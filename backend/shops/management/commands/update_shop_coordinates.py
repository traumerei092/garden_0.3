from django.core.management.base import BaseCommand
from shops.models import Shop

class Command(BaseCommand):
    help = '既存の店舗データの緯度経度を更新します'

    def handle(self, *args, **options):
        shops = Shop.objects.all()
        updated_count = 0
        
        for shop in shops:
            old_lat = shop.latitude
            old_lng = shop.longitude
            
            # 保存時に緯度経度が自動的に更新される
            shop.save()
            
            # 更新されたかチェック
            if (shop.latitude and shop.longitude) and (old_lat != shop.latitude or old_lng != shop.longitude):
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'更新成功: {shop.name} ({old_lat},{old_lng}) → ({shop.latitude},{shop.longitude})'
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(f'更新完了: {updated_count}件の店舗の緯度経度を更新しました')
        )