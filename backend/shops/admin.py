from django.contrib import admin
from django.forms import ModelForm, CharField, Textarea, ValidationError
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
import json
from .models import (
    Shop, ShopType, ShopLayout, ShopOption,
    BusinessHour, ShopImage, ShopTag, ShopTagReaction,
    UserShopRelation, RelationType, PaymentMethod,
    AtmosphereIndicator, ShopAtmosphereRating, ShopAtmosphereFeedback, ShopAtmosphereAggregate,
    ShopDrink, ShopDrinkReaction, Area, WelcomeAction, RegularUsageScene
)

# AreaモデルのカスタムフォームでGeoJSON編集機能を追加
class AreaAdminForm(ModelForm):
    geometry_json = CharField(
        widget=Textarea(attrs={
            'rows': 10, 
            'cols': 80,
            'placeholder': 'GeoJSON形式でジオメトリを入力してください（例: {"type": "Polygon", "coordinates": [[[...]]])',
            'style': 'font-family: monospace; font-size: 12px;'
        }),
        required=False,
        label='ジオメトリ (GeoJSON)',
        help_text='ポリゴンまたはポイントのGeoJSON形式でジオメトリを入力してください。<br>'
                  '<strong>参考サイト:</strong> <a href="https://geojson.io/" target="_blank">geojson.io</a> で地図上で作成可能'
    )
    
    class Meta:
        model = Area
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # 既存のジオメトリをGeoJSON形式で表示
        if self.instance and self.instance.pk and self.instance.geometry:
            try:
                if isinstance(self.instance.geometry, str):
                    geometry_data = json.loads(self.instance.geometry)
                else:
                    geometry_data = self.instance.geometry
                self.fields['geometry_json'].initial = json.dumps(geometry_data, ensure_ascii=False, indent=2)
            except (json.JSONDecodeError, TypeError):
                self.fields['geometry_json'].initial = self.instance.geometry
    
    def clean_geometry_json(self):
        geometry_json = self.cleaned_data.get('geometry_json')
        if geometry_json:
            try:
                # GeoJSONの形式を検証
                geometry_data = json.loads(geometry_json)
                
                # 基本的なGeoJSONの構造を確認
                if not isinstance(geometry_data, dict):
                    raise ValidationError('GeoJSONは辞書形式である必要があります')
                
                if 'type' not in geometry_data:
                    raise ValidationError('GeoJSONには"type"フィールドが必要です')
                
                valid_types = ['Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon']
                if geometry_data['type'] not in valid_types:
                    raise ValidationError(f'GeoJSONのtypeは{valid_types}のいずれかである必要があります')
                
                if 'coordinates' not in geometry_data:
                    raise ValidationError('GeoJSONには"coordinates"フィールドが必要です')
                
                return json.dumps(geometry_data, ensure_ascii=False)
            except json.JSONDecodeError:
                raise ValidationError('有効なJSON形式で入力してください')
        return geometry_json
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        
        # GeoJSONフィールドからgeometryを更新
        geometry_json = self.cleaned_data.get('geometry_json')
        if geometry_json:
            instance.geometry = geometry_json
        
        if commit:
            instance.save()
        return instance

# エリア管理の管理画面設定
@admin.register(Area)
class AreaAdmin(admin.ModelAdmin):
    form = AreaAdminForm
    list_display = ('name', 'area_type', 'level', 'parent_display', 'has_geometry', 'is_active', 'created_at')
    list_filter = ('area_type', 'level', 'is_active', 'parent', 'created_at')
    search_fields = ('name', 'name_kana', 'jis_code', 'postal_code', 'parent__name')
    readonly_fields = ('created_at', 'updated_at', 'geometry_preview', 'full_path')
    autocomplete_fields = ('parent',)
    list_per_page = 50
    date_hierarchy = 'created_at'
    ordering = ('level', 'name')
    
    # Areaモデルの検索可能性を有効化
    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        if search_term:
            # 階層検索も可能にする
            queryset |= self.model.objects.filter(parent__name__icontains=search_term)
        return queryset, use_distinct
    
    fieldsets = (
        ('基本情報', {
            'fields': ('name', 'name_kana', 'area_type', 'parent', 'level')
        }),
        ('地理情報', {
            'fields': ('geometry_json', 'geometry_preview', 'center_point'),
            'description': 'GeoJSONエディタサイト（geojson.io）を使用して地図上でエリアを作成・編集できます。'
        }),
        ('詳細情報', {
            'fields': ('postal_code', 'jis_code', 'is_active'),
            'classes': ('collapse',)
        }),
        ('システム情報', {
            'fields': ('full_path', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def parent_display(self, obj):
        """親エリアの表示"""
        if obj.parent:
            url = reverse('admin:shops_area_change', args=[obj.parent.pk])
            return format_html('<a href="{}">{}</a>', url, obj.parent.get_full_name())
        return '---'
    parent_display.short_description = '親エリア'
    parent_display.admin_order_field = 'parent'
    
    def has_geometry(self, obj):
        """ジオメトリの有無を表示"""
        if obj.geometry:
            try:
                if isinstance(obj.geometry, str):
                    geometry_data = json.loads(obj.geometry)
                else:
                    geometry_data = obj.geometry
                geometry_type = geometry_data.get('type', 'Unknown')
                return format_html('<span style="color: green;">✓ {}</span>', geometry_type)
            except:
                return format_html('<span style="color: red;">✗ 無効</span>')
        return format_html('<span style="color: gray;">---</span>')
    has_geometry.short_description = 'ジオメトリ'
    
    def full_path(self, obj):
        """フルパスの表示"""
        return obj.get_full_name()
    full_path.short_description = 'フルパス'
    
    def geometry_preview(self, obj):
        """ジオメトリのプレビュー表示"""
        if obj.geometry:
            try:
                if isinstance(obj.geometry, str):
                    geometry_data = json.loads(obj.geometry)
                else:
                    geometry_data = obj.geometry
                
                geometry_type = geometry_data.get('type', 'Unknown')
                
                # 座標の数を計算
                coordinates = geometry_data.get('coordinates', [])
                coord_info = ''
                if geometry_type == 'Point':
                    coord_info = f'座標: ({coordinates[0]:.6f}, {coordinates[1]:.6f})'
                elif geometry_type == 'Polygon' and coordinates:
                    coord_info = f'ポリゴン: {len(coordinates[0])}点'
                
                preview_json = json.dumps(geometry_data, ensure_ascii=False, indent=2)[:500]
                if len(preview_json) == 500:
                    preview_json += '...'
                
                return format_html(
                    '<div style="max-width: 400px;">'
                    '<strong>タイプ:</strong> {}<br>'
                    '<strong>情報:</strong> {}<br>'
                    '<details><summary>GeoJSON詳細</summary>'
                    '<pre style="background: #f8f8f8; padding: 10px; max-height: 200px; overflow: auto;">{}</pre>'
                    '</details>'
                    '</div>',
                    geometry_type, coord_info, preview_json
                )
            except (json.JSONDecodeError, TypeError, KeyError):
                return format_html('<span style="color: red;">無効なジオメトリデータ</span>')
        return '---'
    geometry_preview.short_description = 'ジオメトリプレビュー'
    
    def get_queryset(self, request):
        """クエリセットの最適化"""
        return super().get_queryset(request).select_related('parent')
    
    def save_model(self, request, obj, form, change):
        """保存時の処理"""
        # レベルの自動設定
        if obj.parent and not obj.level:
            obj.level = obj.parent.level + 1
        elif not obj.parent and not obj.level:
            obj.level = 0
        
        super().save_model(request, obj, form, change)

# 雰囲気指標の管理画面設定
@admin.register(AtmosphereIndicator)
class AtmosphereIndicatorAdmin(admin.ModelAdmin):
    list_display = ('name', 'description_left', 'description_right', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('name', 'description_left', 'description_right')
    readonly_fields = ('created_at', 'updated_at')

# 店舗雰囲気評価の管理画面設定（DEPRECATED）
@admin.register(ShopAtmosphereRating)
class ShopAtmosphereRatingAdmin(admin.ModelAdmin):
    list_display = ('shop', 'indicator', 'user', 'score', 'created_at')
    list_filter = ('indicator', 'score')
    search_fields = ('shop__name', 'indicator__name', 'user__name')
    readonly_fields = ('created_at',)

# 新しい雰囲気フィードバックシステムの管理画面
@admin.register(ShopAtmosphereFeedback)
class ShopAtmosphereFeedbackAdmin(admin.ModelAdmin):
    list_display = ('user', 'shop', 'formatted_scores', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at')
    search_fields = ('shop__name', 'user__name', 'user__email')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('user', 'shop')
    
    def formatted_scores(self, obj):
        """雰囲気スコアを見やすく表示"""
        if not obj.atmosphere_scores:
            return "未設定"
        
        indicators = AtmosphereIndicator.objects.all()
        result = []
        for indicator in indicators:
            score = obj.atmosphere_scores.get(str(indicator.id))
            if score is not None:
                result.append(f"{indicator.name}: {score}")
        
        return ", ".join(result) if result else "データなし"
    formatted_scores.short_description = '雰囲気スコア'

@admin.register(ShopAtmosphereAggregate)
class ShopAtmosphereAggregateAdmin(admin.ModelAdmin):
    list_display = ('shop', 'total_feedbacks', 'formatted_averages', 'last_updated')
    list_filter = ('total_feedbacks', 'last_updated')
    search_fields = ('shop__name',)
    readonly_fields = ('last_updated',)
    autocomplete_fields = ('shop',)
    
    def formatted_averages(self, obj):
        """平均値を見やすく表示"""
        if not obj.atmosphere_averages:
            return "データなし"
        
        indicators = AtmosphereIndicator.objects.all()
        result = []
        for indicator in indicators:
            avg = obj.atmosphere_averages.get(str(indicator.id))
            if avg is not None:
                result.append(f"{indicator.name}: {avg:.2f}")
        
        return ", ".join(result) if result else "データなし"
    formatted_averages.short_description = '平均スコア'
    
    actions = ['update_aggregates']
    
    def update_aggregates(self, request, queryset):
        """選択された集計データを手動更新"""
        count = 0
        for aggregate in queryset:
            aggregate.update_aggregates()
            count += 1
        
        self.message_user(request, f'{count}件の集計データを更新しました。')
    update_aggregates.short_description = '集計データを更新'

# 店舗ドリンクの管理画面設定
@admin.register(ShopDrink)
class ShopDrinkAdmin(admin.ModelAdmin):
    list_display = ('name', 'shop', 'is_alcohol', 'alcohol_category', 'alcohol_brand', 'drink_style', 'is_available', 'created_by', 'created_at')
    list_filter = ('is_alcohol', 'is_available', 'alcohol_category', 'alcohol_brand', 'drink_style', 'created_at')
    search_fields = ('name', 'shop__name', 'description', 'created_by__username')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('shop', 'created_by', 'alcohol_category', 'alcohol_brand', 'drink_style')
    
    fieldsets = (
        ('基本情報', {
            'fields': ('name', 'shop', 'description', 'created_by')
        }),
        ('ドリンク詳細', {
            'fields': ('is_alcohol', 'alcohol_category', 'alcohol_brand', 'drink_style')
        }),
        ('ステータス', {
            'fields': ('is_available',)
        }),
        ('日時情報', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

# ドリンクリアクションの管理画面設定
@admin.register(ShopDrinkReaction)
class ShopDrinkReactionAdmin(admin.ModelAdmin):
    list_display = ('drink', 'user', 'reaction_type', 'created_at')
    list_filter = ('reaction_type', 'created_at')
    search_fields = ('drink__name', 'user__username')
    readonly_fields = ('created_at',)
    autocomplete_fields = ('drink', 'user')
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('drink', 'user')

# 店舗の管理画面設定を改善
@admin.register(Shop)
class ShopAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'area_display', 'capacity', 'created_at')
    list_filter = ('created_at', 'capacity', 'area')
    search_fields = ('name', 'address', 'prefecture', 'city', 'area__name')
    readonly_fields = ('created_at',)
    filter_horizontal = ('shop_types', 'shop_layouts', 'shop_options', 'payment_methods')
    autocomplete_fields = ('area',)
    
    def area_display(self, obj):
        """エリアの表示"""
        if obj.area:
            url = reverse('admin:shops_area_change', args=[obj.area.pk])
            return format_html('<a href="{}">{}</a>', url, obj.area.get_full_name())
        return '---'
    area_display.short_description = 'エリア'
    area_display.admin_order_field = 'area'

# ウェルカムアクションの管理画面設定
@admin.register(WelcomeAction)
class WelcomeActionAdmin(admin.ModelAdmin):
    list_display = ('user', 'shop', 'created_at')
    list_filter = ('created_at', 'shop')
    search_fields = ('user__name', 'user__email', 'shop__name')
    readonly_fields = ('created_at',)
    autocomplete_fields = ('user', 'shop')
    date_hierarchy = 'created_at'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'shop')


# 常連利用シーンの管理画面設定
@admin.register(RegularUsageScene)
class RegularUsageSceneAdmin(admin.ModelAdmin):
    list_display = ('user', 'shop', 'visit_purposes_display', 'created_at', 'updated_at')
    list_filter = ('created_at', 'updated_at', 'visit_purposes')
    search_fields = ('user__name', 'user__email', 'shop__name')
    readonly_fields = ('created_at', 'updated_at')
    autocomplete_fields = ('user', 'shop')
    filter_horizontal = ('visit_purposes',)
    date_hierarchy = 'created_at'

    def visit_purposes_display(self, obj):
        """利用目的を見やすく表示"""
        purposes = obj.visit_purposes.all()
        if purposes:
            return ", ".join([purpose.name for purpose in purposes])
        return "未設定"
    visit_purposes_display.short_description = '利用目的'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'shop').prefetch_related('visit_purposes')

    fieldsets = (
        ('基本情報', {
            'fields': ('user', 'shop')
        }),
        ('利用シーン', {
            'fields': ('visit_purposes',),
            'description': '常連として利用する目的やシーンを選択してください。'
        }),
        ('システム情報', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


# Register your models here.
admin.site.register(ShopType)
admin.site.register(ShopLayout)
admin.site.register(ShopOption)
admin.site.register(BusinessHour)
admin.site.register(ShopImage)
admin.site.register(ShopTag)
admin.site.register(ShopTagReaction)
admin.site.register(UserShopRelation)
admin.site.register(RelationType)
admin.site.register(PaymentMethod)
