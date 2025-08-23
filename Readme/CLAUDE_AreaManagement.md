# エリア管理機能 - CLAUDE_AreaManagement.md

## 概要
全国47都道府県の市区町村データをGeoJSONから取得し、ジオメトリ情報付きでDjangoデータベースに格納する機能です。店舗登録時の緯度経度から該当エリアを自動判定する機能も提供します。

## 機能一覧

### 1. エリアデータインポート機能
- **目的**: 全国の行政区分データ（都道府県・市区町村・区）をデータベースに登録
- **データ源**: e-Stat提供のGeoJSONファイル（47都道府県分）
- **登録件数**: 約1,963件（都道府県47件 + 市区町村1,741件 + 区175件）

### 2. エリア自動判定機能  
- **目的**: 店舗の緯度経度から該当エリアを自動特定
- **使用場面**: 店舗登録・編集時の自動エリア設定
- **精度**: ポリゴン内包含判定による正確な地理的特定

## データ構造

### Areaモデル (shops/models.py)
```python
class Area(models.Model):
    name = models.CharField("エリア名", max_length=100)
    name_kana = models.CharField("エリア名（カナ）", max_length=100, blank=True)
    area_type = models.CharField("エリアタイプ", max_length=20, choices=[
        ('prefecture', '都道府県'),
        ('city', '市区町村'), 
        ('ward', '区'),
    ])
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                              related_name='children', verbose_name="親エリア")
    level = models.IntegerField("階層レベル", default=0)
    geometry = models.TextField("ポリゴンジオメトリ", null=True, blank=True)
```

### 階層構造
```
レベル0: 都道府県（47件）
├── レベル1: 市区町村・東京23区（1,741件）
    └── レベル2: 政令指定都市の区（175件）
```

**例**:
- 東京都 (レベル0) 
  - 千代田区 (レベル1) ← 東京23区は都道府県直下
  - 八王子市 (レベル1)
- 神奈川県 (レベル0)
  - 横浜市 (レベル1)
    - 横浜市中区 (レベル2) ← 政令指定都市の区
    - 横浜市西区 (レベル2)

## コマンド使用方法

### エリアデータインポート
```bash
# 基本実行（既存データ削除してインポート）
python manage.py import_areas_complete --clear

# パス指定実行  
python manage.py import_areas_complete --path /path/to/geojson --clear
```

**前提条件**:
- GeoJSONフォルダ群が指定パス（デフォルト: ~/Desktop）に配置済み
- フォルダ命名例: `東京都GeoJSON`, `大阪府GeoJSON`, etc.
- Shapelyライブラリがインストール済み

**処理フロー**:
1. 全1,055個のGeoJSONファイルから内容ベースでデータ収集
2. 都道府県別にポリゴンデータを統合（unary_union）
3. ボトムアップ方式で親エリアのジオメトリを生成
4. トップダウン方式でデータベースに階層的に保存

## API使用方法

### エリア検索機能
```python
# 緯度経度からエリア検索
areas = Area.find_areas_containing_point(latitude, longitude)

# 最も詳細なエリアを取得
most_detailed_area = areas.order_by('-level').first()

# 店舗との関連付け例
if most_detailed_area:
    shop.area = most_detailed_area
    shop.save()
```

### エリア内包含判定
```python
# 特定エリア内での座標判定
area = Area.objects.get(name='千代田区')
is_inside = area.contains_point(35.6812, 139.7671)  # 東京駅の座標
```

### 階層取得メソッド
```python
area = Area.objects.get(name='横浜市中区') 

# 完全階層パス取得
full_name = area.get_full_name()  # "神奈川県 > 横浜市 > 横浜市中区"

# 祖先エリア取得
ancestors = area.get_ancestors()  # [神奈川県, 横浜市]

# 子孫エリア取得  
descendants = area.get_descendants()
```

## 店舗登録での活用

### 自動エリア設定 (shops/models.py)
```python
class Shop(models.Model):
    # ... 他のフィールド ...
    area = models.ForeignKey(Area, on_delete=models.SET_NULL, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        # 緯度経度からエリア自動判定
        if self.latitude and self.longitude and not self.area:
            areas = Area.find_areas_containing_point(self.latitude, self.longitude)
            if areas.exists():
                self.area = areas.order_by('-level').first()  # 最詳細エリア選択
        
        super().save(*args, **kwargs)
```

## データ品質管理

### 検証項目
- ✅ 都道府県数: 47件（完全）
- ✅ ジオメトリ保持率: 100%（全エリア）
- ✅ 親子関係: 0件の孤立エリア
- ✅ 階層整合性: レベル違反なし

### 動作テスト例
```python
# 主要都市での検索テスト
test_locations = [
    ("東京駅", 35.6812, 139.7671),      # → 東京都 > 千代田区
    ("大阪駅", 34.7024, 135.4959),      # → 大阪府 > 大阪市 > 大阪市北区  
    ("横浜駅", 35.4659, 139.6201),      # → 神奈川県 > 横浜市 > 横浜市西区
]

for name, lat, lon in test_locations:
    areas = Area.find_areas_containing_point(lat, lon)
    if areas.exists():
        result = areas.order_by('-level').first()
        print(f"{name}: {result.get_full_name()}")
```

## トラブルシューティング

### よくある問題

**Q: インポートが途中で止まる**  
A: メモリ不足の可能性。処理を分割して段階実行

**Q: ジオメトリが登録されない**  
A: Shapelyライブラリの確認。`pip install shapely`でインストール

**Q: エリア検索で結果が0件**  
A: 座標系の確認（WGS84前提）、ポリゴンの有効性チェック

**Q: 親子関係が不正**  
A: `import_areas_complete.py`での再インポート推奨

### ログ確認
```bash
# インポート実行時の詳細ログ確認
python manage.py import_areas_complete --clear --verbosity=2
```

## パフォーマンス最適化

### データベース最適化
- エリアテーブルにインデックス作成済み
- 空間検索用の最適化実装
- 大量データ処理時のメモリ管理

### 検索最適化
```python
# 効率的なエリア検索（推奨）
areas = Area.objects.filter(
    is_active=True,
    geometry__isnull=False
).exclude(geometry__exact='')
```

## 関連ファイル

### 主要ファイル
- `shops/models.py` - Areaモデル定義
- `shops/management/commands/import_areas_complete.py` - インポートコマンド
- `shops/utils/area_detection.py` - エリア検索ユーティリティ（存在する場合）

### 管理画面
- Django Adminでエリア階層の確認・編集可能
- ジオメトリデータの可視化（管理画面拡張時）

## 更新履歴
- 2025-08-23: 完全版エリア管理機能実装
- データ整合性問題を全て解決
- ジオメトリ付きエリアデータの完全実装
- エリア自動判定機能の動作確認完了