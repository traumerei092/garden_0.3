#!/usr/bin/env python
import os
import sys
import django

# プロジェクトルートディレクトリを追加
sys.path.append('/Users/daisuke/Documents/Django/drf_next_practice3/backend')

# Django設定をセットアップ
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'garden.settings')
django.setup()

from shops.models import Area

def create_test_areas():
    """テスト用のエリアを作成する"""
    
    # 既存のエリアを削除
    Area.objects.all().delete()
    
    # 北海道を作成
    hokkaido = Area.objects.create(
        name='北海道',
        name_kana='ホッカイドウ',
        area_type='prefecture',
        level=0,
        is_active=True
    )
    print(f'✓ {hokkaido.name} を作成しました')
    
    # 札幌市を作成
    sapporo = Area.objects.create(
        name='札幌市',
        name_kana='サッポロシ',
        area_type='city',
        parent=hokkaido,
        level=1,
        is_active=True
    )
    print(f'✓ {sapporo.get_full_name()} を作成しました')
    
    # 中央区を作成
    chuo = Area.objects.create(
        name='中央区',
        name_kana='チュウオウク',
        area_type='ward',
        parent=sapporo,
        level=2,
        is_active=True
    )
    print(f'✓ {chuo.get_full_name()} を作成しました')
    
    # 宮ケ丘地区を作成
    miyagaoka = Area.objects.create(
        name='宮ケ丘',
        name_kana='ミヤガオカ',
        area_type='neighborhood',
        parent=chuo,
        level=3,
        is_active=True
    )
    print(f'✓ {miyagaoka.get_full_name()} を作成しました')
    
    # 東京都も作成
    tokyo = Area.objects.create(
        name='東京都',
        name_kana='トウキョウト',
        area_type='prefecture',
        level=0,
        is_active=True
    )
    print(f'✓ {tokyo.name} を作成しました')
    
    # 福岡県も作成
    fukuoka = Area.objects.create(
        name='福岡県',
        name_kana='フクオカケン',
        area_type='prefecture',
        level=0,
        is_active=True
    )
    print(f'✓ {fukuoka.name} を作成しました')
    
    print(f'\n作成されたエリア数: {Area.objects.count()}')
    print('\nエリア階層:')
    for area in Area.objects.all().order_by('level', 'name'):
        indent = '  ' * area.level
        print(f'{indent}- {area.get_full_name()} (レベル: {area.level}, タイプ: {area.area_type})')

if __name__ == '__main__':
    create_test_areas()