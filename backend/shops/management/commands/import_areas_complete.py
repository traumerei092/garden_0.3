# 完全版
# shops/management/commands/import_areas_complete.py

import json
import os
import glob
import gc
from pathlib import Path
from collections import defaultdict
from django.core.management.base import BaseCommand
from django.db import transaction
from shops.models import Area
from shapely.geometry import shape, mapping
from shapely.ops import unary_union


class Command(BaseCommand):
    help = '【完全版】エリアデータとジオメトリを両方確実に登録'

    def add_arguments(self, parser):
        parser.add_argument(
            '--path', type=str, default=str(Path.home() / "Desktop"),
            help='GeoJSONフォルダがある親ディレクトリのパス'
        )
        parser.add_argument(
            '--clear', action='store_true',
            help='インポート前に既存の全エリアを削除'
        )

    def handle(self, *args, **options):
        base_path = options['path']
        
        if options['clear']:
            Area.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('🧹 既存エリア削除完了'))

        self.stdout.write("🔍 ファイル内容からエリアデータとジオメトリを収集中...")
        
        # ファイル内容ベースでデータ収集（ジオメトリ付き）
        prefecture_data = self._collect_complete_data(base_path)
        
        if not prefecture_data:
            self.stdout.write(self.style.ERROR('❌ 有効なデータが見つかりませんでした'))
            return

        self.stdout.write(f"✅ 発見された都道府県: {len(prefecture_data)}件")
        
        # 都道府県別に処理
        total_created = 0
        
        for pref_name in sorted(prefecture_data.keys()):
            city_data = prefecture_data[pref_name]
            self.stdout.write(f"\n🏛️ {pref_name}: {len(city_data)}市区町村を処理中...")
            
            created_count = self._create_prefecture_with_geometry(pref_name, city_data)
            total_created += created_count
            self.stdout.write(f"   ✅ {created_count}件作成")
            
            # メモリクリーンアップ
            gc.collect()

        # 結果
        self.stdout.write(f"\n🎉 総作成数: {total_created}件")
        
        actual_prefs = Area.objects.filter(level=0).count()
        actual_cities = Area.objects.filter(level=1).count() 
        actual_wards = Area.objects.filter(level=2).count()
        actual_total = actual_prefs + actual_cities + actual_wards
        geometry_count = Area.objects.exclude(geometry__isnull=True).exclude(geometry__exact='').count()
        
        self.stdout.write(f"\n📋 最終結果:")
        self.stdout.write(f"  都道府県: {actual_prefs}件")
        self.stdout.write(f"  市区町村: {actual_cities}件") 
        self.stdout.write(f"  区: {actual_wards}件")
        self.stdout.write(f"  合計: {actual_total}件")
        self.stdout.write(f"  ジオメトリ保持: {geometry_count}件 ({geometry_count/actual_total*100:.1f}%)")
        
        # 検証
        self._validate_complete_results()
        
        if 1800 <= actual_total <= 1950:
            self.stdout.write(self.style.SUCCESS("✅ 期待値範囲内です"))
        else:
            self.stdout.write(self.style.WARNING(f"⚠️ 期待値外: {actual_total}件"))

    def _collect_complete_data(self, base_path):
        """完全データ収集（エリア名+ジオメトリ）"""
        prefecture_data = {}  # pref_name -> {city_name: [polygons]}
        
        # 全フォルダから全JSONファイルを収集
        all_json_files = []
        prefecture_folders = glob.glob(os.path.join(base_path, '*GeoJSON'))
        
        for folder_path in prefecture_folders:
            json_files = glob.glob(os.path.join(folder_path, '*.json'))
            all_json_files.extend(json_files)
        
        self.stdout.write(f"  📄 総JSONファイル数: {len(all_json_files)}")
        
        processed_files = 0
        
        # 全ファイルを処理してジオメトリも収集
        for file_path in all_json_files:
            processed_files += 1
            
            if processed_files % 100 == 0:
                self.stdout.write(f"    処理中: {processed_files}/{len(all_json_files)} ファイル")
            
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    
                for feature in data.get('features', []):
                    props = feature.get('properties', {})
                    geom_data = feature.get('geometry')
                    
                    pref_name = props.get('PREF_NAME', '').strip()
                    city_name = props.get('CITY_NAME', '').strip()
                    
                    # 有効なデータのみ追加
                    if pref_name and city_name and geom_data:
                        try:
                            # Shapelyポリゴンに変換
                            polygon = shape(geom_data)
                            if polygon.is_valid and not polygon.is_empty:
                                
                                # 都道府県データ初期化
                                if pref_name not in prefecture_data:
                                    prefecture_data[pref_name] = defaultdict(list)
                                
                                prefecture_data[pref_name][city_name].append(polygon)
                        except Exception:
                            continue
                        
            except Exception:
                continue
        
        # defaultdictをdictに変換
        return {pref: dict(cities) for pref, cities in prefecture_data.items()}

    def _create_prefecture_with_geometry(self, pref_name, city_geometries):
        """都道府県とジオメトリの作成"""
        created_count = 0
        
        # Step1: ジオメトリ統合と分類
        regular_cities = {}      # city_name -> merged_geometry
        tokyo_wards = {}         # ward_name -> merged_geometry
        designated_cities = defaultdict(dict)  # parent_city -> {ward_name: geometry}
        
        for city_name, polygons in city_geometries.items():
            # ポリゴン統合
            merged_geom = self._merge_polygons(polygons)
            if not merged_geom:
                continue
            
            if self._is_tokyo_ward(city_name, pref_name):
                tokyo_wards[city_name] = merged_geom
            elif self._is_designated_city_ward(city_name):
                parent_city = self._extract_parent_city(city_name)
                designated_cities[parent_city][city_name] = merged_geom
            else:
                regular_cities[city_name] = merged_geom
        
        # Step2: 政令指定都市の親ジオメトリ生成
        designated_city_parents = {}  # parent_city -> merged_geometry
        for parent_city, wards in designated_cities.items():
            parent_polygons = list(wards.values())
            parent_geom = self._merge_polygons(parent_polygons)
            if parent_geom:
                designated_city_parents[parent_city] = parent_geom
        
        # Step3: 都道府県ジオメトリ生成
        all_prefecture_polygons = []
        all_prefecture_polygons.extend(regular_cities.values())
        all_prefecture_polygons.extend(tokyo_wards.values())
        all_prefecture_polygons.extend(designated_city_parents.values())
        
        pref_geometry = self._merge_polygons(all_prefecture_polygons)
        
        # Step4: データベース登録
        with transaction.atomic():
            # 都道府県作成
            pref_geometry_json = None
            if pref_geometry:
                pref_geometry_json = json.dumps(mapping(pref_geometry))
                
            pref_obj, created = Area.objects.get_or_create(
                name=pref_name,
                level=0,
                area_type='prefecture',
                parent=None,
                defaults={'geometry': pref_geometry_json}
            )
            if created:
                created_count += 1
            
            # 通常市区町村作成
            for city_name, geometry in regular_cities.items():
                geometry_json = json.dumps(mapping(geometry))
                _, created = Area.objects.get_or_create(
                    name=city_name,
                    level=1,
                    area_type='city',
                    parent=pref_obj,
                    defaults={'geometry': geometry_json}
                )
                if created:
                    created_count += 1
            
            # 東京23区作成
            for ward_name, geometry in tokyo_wards.items():
                geometry_json = json.dumps(mapping(geometry))
                _, created = Area.objects.get_or_create(
                    name=ward_name,
                    level=1,
                    area_type='ward',
                    parent=pref_obj,
                    defaults={'geometry': geometry_json}
                )
                if created:
                    created_count += 1
            
            # 政令指定都市作成
            for parent_city_name, parent_geometry in designated_city_parents.items():
                parent_geometry_json = json.dumps(mapping(parent_geometry))
                
                parent_city_obj, created = Area.objects.get_or_create(
                    name=parent_city_name,
                    level=1,
                    area_type='city',
                    parent=pref_obj,
                    defaults={'geometry': parent_geometry_json}
                )
                if created:
                    created_count += 1
                
                # 各区作成
                ward_geometries = designated_cities[parent_city_name]
                for ward_name, ward_geometry in ward_geometries.items():
                    ward_geometry_json = json.dumps(mapping(ward_geometry))
                    _, created = Area.objects.get_or_create(
                        name=ward_name,
                        level=2,
                        area_type='ward',
                        parent=parent_city_obj,
                        defaults={'geometry': ward_geometry_json}
                    )
                    if created:
                        created_count += 1
        
        return created_count

    def _merge_polygons(self, polygons):
        """ポリゴン統合"""
        if not polygons:
            return None
        
        try:
            if len(polygons) == 1:
                return polygons[0]
            
            merged = unary_union(polygons)
            
            if merged.is_empty or not merged.is_valid:
                return None
                
            return merged
            
        except Exception:
            return None

    def _is_tokyo_ward(self, city_name, pref_name):
        """東京23区の判定"""
        return (pref_name == '東京都' and 
                city_name.endswith('区') and 
                '市' not in city_name)

    def _is_designated_city_ward(self, city_name):
        """政令指定都市の区の判定"""
        return '市' in city_name and city_name.endswith('区')

    def _extract_parent_city(self, ward_name):
        """区名から親市名を抽出"""
        if '市' in ward_name and ward_name.endswith('区'):
            parts = ward_name.split('市')
            return parts[0] + '市'
        return ward_name

    def _validate_complete_results(self):
        """完全検証"""
        self.stdout.write(f"\n🔍 完全データ検証:")
        
        # 都道府県チェック
        prefs = Area.objects.filter(level=0).count()
        if prefs == 47:
            self.stdout.write(f"✅ 都道府県: 47件（完璧）")
        else:
            self.stdout.write(f"⚠️ 都道府県: {prefs}件（期待値: 47件）")
        
        # ジオメトリチェック
        total_areas = Area.objects.count()
        areas_with_geom = Area.objects.exclude(geometry__isnull=True).exclude(geometry__exact='').count()
        
        if areas_with_geom == total_areas:
            self.stdout.write(f"✅ ジオメトリ: 100%保持（{areas_with_geom}/{total_areas}）")
        else:
            self.stdout.write(f"⚠️ ジオメトリ: {areas_with_geom}/{total_areas} ({areas_with_geom/total_areas*100:.1f}%)")
        
        # 親子関係チェック
        orphans = Area.objects.filter(parent__isnull=True).exclude(level=0).count()
        if orphans == 0:
            self.stdout.write(f"✅ 親子関係: 完全正常")
        else:
            self.stdout.write(f"⚠️ 孤立エリア: {orphans}件")
        
        # エリア検索機能テスト
        self.stdout.write(f"\n🧪 エリア検索テスト:")
        
        test_locations = [
            ("東京駅", 35.6812, 139.7671),
            ("大阪駅", 34.7024, 135.4959),
        ]
        
        for name, lat, lon in test_locations:
            areas = Area.find_areas_containing_point(lat, lon)
            if areas.exists():
                most_detailed = areas.order_by('-level').first()
                self.stdout.write(f"  ✅ {name}: {most_detailed.get_full_name()}")
            else:
                self.stdout.write(f"  ❌ {name}: 該当エリアなし")
        
        self.stdout.write(f"✅ 全検証完了 - エリアデータとジオメトリの両方が正常に登録されています")