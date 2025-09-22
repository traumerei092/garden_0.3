from rest_framework import serializers
from .models import (
    Shop, ShopImage, ShopType, ShopLayout, ShopOption, BusinessHour, 
    ShopTag, ShopTagReaction, UserShopRelation, PaymentMethod,
    ShopEditHistory, HistoryEvaluation, ShopReview, ShopReviewLike,
    ShopDrink, ShopDrinkReaction, Area,
    AtmosphereIndicator, ShopAtmosphereFeedback, ShopAtmosphereAggregate
)
from accounts.models import VisitPurpose, AlcoholCategory, AlcoholBrand, DrinkStyle
from django.contrib.auth import get_user_model
from django.db.models import Count

User = get_user_model()

class VisitPurposeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VisitPurpose
        fields = ['id', 'name']

class ReviewAuthorSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'uid', 'name', 'avatar_url')

    def get_avatar_url(self, obj):
        if obj.avatar and hasattr(obj.avatar, 'url'):
            return obj.avatar.url
        return None

class ShopReviewSerializer(serializers.ModelSerializer):
    user = ReviewAuthorSerializer(read_only=True)
    visit_purpose = VisitPurposeSerializer(read_only=True)
    visit_purpose_id = serializers.PrimaryKeyRelatedField(
        queryset=VisitPurpose.objects.all(), source='visit_purpose', write_only=True, required=False, allow_null=True
    )
    is_liked = serializers.SerializerMethodField()

    class Meta:
        model = ShopReview
        fields = (
            'id', 'user', 'visit_purpose', 'visit_purpose_id', 'comment',
            'likes_count', 'created_at', 'is_liked'
        )
        read_only_fields = ('likes_count', 'created_at')

    def get_is_liked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ShopReviewLike.objects.filter(review=obj, user=request.user).exists()
        return False

# ドリンク関連のシリアライザー
class AlcoholCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = AlcoholCategory
        fields = ['id', 'name']

class AlcoholBrandSerializer(serializers.ModelSerializer):
    category = AlcoholCategorySerializer(read_only=True)
    
    class Meta:
        model = AlcoholBrand
        fields = ['id', 'name', 'category']

class DrinkStyleSerializer(serializers.ModelSerializer):
    category = AlcoholCategorySerializer(read_only=True)
    
    class Meta:
        model = DrinkStyle
        fields = ['id', 'name', 'category']

class ShopDrinkSerializer(serializers.ModelSerializer):
    alcohol_category = AlcoholCategorySerializer(read_only=True)
    alcohol_brand = AlcoholBrandSerializer(read_only=True)
    drink_style = DrinkStyleSerializer(read_only=True)
    created_by = ReviewAuthorSerializer(read_only=True)
    reaction_count = serializers.SerializerMethodField()
    user_has_reacted = serializers.SerializerMethodField()
    
    # 書き込み用のフィールド
    alcohol_category_id = serializers.PrimaryKeyRelatedField(
        queryset=AlcoholCategory.objects.all(), source='alcohol_category', write_only=True, required=False, allow_null=True
    )
    alcohol_brand_id = serializers.PrimaryKeyRelatedField(
        queryset=AlcoholBrand.objects.all(), source='alcohol_brand', write_only=True, required=False, allow_null=True
    )
    drink_style_id = serializers.PrimaryKeyRelatedField(
        queryset=DrinkStyle.objects.all(), source='drink_style', write_only=True, required=False, allow_null=True
    )

    class Meta:
        model = ShopDrink
        fields = [
            'id', 'name', 'alcohol_category', 'alcohol_brand', 'drink_style',
            'description', 'is_alcohol', 'is_available', 'created_by',
            'reaction_count', 'user_has_reacted', 'created_at',
            'alcohol_category_id', 'alcohol_brand_id', 'drink_style_id'
        ]
        read_only_fields = ['created_at']

    def get_reaction_count(self, obj):
        return obj.reactions.filter(reaction_type='like').count()

    def get_user_has_reacted(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return ShopDrinkReaction.objects.filter(
                drink=obj, user=request.user, reaction_type='like'
            ).exists()
        return False

class ShopDrinkReactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopDrinkReaction
        fields = ['id', 'reaction_type', 'created_at']
        read_only_fields = ['created_at']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class ShopReviewLikeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopReviewLike
        fields = ('id', 'user', 'review', 'created_at')
        read_only_fields = ('user', 'review', 'created_at')

class BusinessHourSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = BusinessHour
        fields = ['weekday', 'weekday_display', 'open_time', 'close_time', 'is_closed']

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = ['id', 'name']

class ShopSerializer(serializers.ModelSerializer):
    business_hours = BusinessHourSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()
    shop_types = serializers.StringRelatedField(many=True)
    shop_layouts = serializers.StringRelatedField(many=True)
    shop_options = serializers.StringRelatedField(many=True)
    payment_methods = PaymentMethodSerializer(many=True, read_only=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    tags = serializers.SerializerMethodField()
    area = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'zip_code', 'address', 'prefecture', 'city',
            'street', 'building', 'area', 'capacity', 'shop_types',
            'shop_layouts', 'shop_options', 'business_hours',
            'images', 'created_by', 'latitude', 'longitude', 'tags',
            'phone_number', 'access', 'payment_methods',
            'budget_weekday_min', 'budget_weekday_max', 'budget_weekend_min', 
            'budget_weekend_max', 'budget_note'
        ]
        
    def get_images(self, obj):
        # すべての画像を配列として返す
        images = obj.images.all()
        result = []
        for image in images:
            if image and image.image:
                result.append({
                    'id': image.id,
                    'image_url': image.image.url,
                    'caption': image.caption or '',
                    'is_icon': image.is_icon or False
                })
        return result
        
    def get_tags(self, obj):
        from django.db.models import Count
        # タグを共感数でソートして取得
        # created_by_id カラムを使用しないようにクエリを修正
        tags = obj.tags.annotate(
            reactions_count=Count('reactions')
        ).order_by('-reactions_count', '-created_at')
        
        # リクエストコンテキストを取得
        request = self.context.get('request')
        
        # ShopTagSerializerでシリアライズ
        # リクエストがない場合でも動作するように修正
        context = {'request': request} if request else {}
        return ShopTagSerializer(
            tags, 
            many=True, 
            context=context
        ).data

class ShopImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = ShopImage
        fields = ['id', 'shop', 'image', 'image_url', 'caption', 'is_icon', 'created_at']
        read_only_fields = ['created_at']
    
    def get_image_url(self, obj):
        if obj.image:
            return obj.image.url
        return None

class ShopImageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopImage
        fields = ['image', 'caption', 'is_icon']

class ShopCreateSerializer(serializers.ModelSerializer):
    images = ShopImageCreateSerializer(many=True, required=False)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    payment_methods = serializers.PrimaryKeyRelatedField(queryset=PaymentMethod.objects.all(), many=True, required=False)

    class Meta:
        model = Shop
        fields = [
            'name', 'zip_code', 'address', 'prefecture', 'city',
            'street', 'building', 'capacity', 'shop_types',
            'shop_layouts', 'shop_options', 'payment_methods',
            'images', 'created_by', 'latitude', 'longitude',
            'phone_number', 'access'
        ]

    def create(self, validated_data):
        # ManyToManyフィールドのデータを取り出す
        shop_types = validated_data.pop('shop_types', [])
        shop_layouts = validated_data.pop('shop_layouts', [])
        shop_options = validated_data.pop('shop_options', [])
        payment_methods = validated_data.pop('payment_methods', [])
        images_data = validated_data.pop('images', [])

        # 基本データで店舗を作成
        shop = Shop.objects.create(**validated_data)

        # ManyToManyフィールドを設定
        if shop_types:
            shop.shop_types.set(shop_types)
        if shop_layouts:
            shop.shop_layouts.set(shop_layouts)
        if shop_options:
            shop.shop_options.set(shop_options)
        if payment_methods:
            shop.payment_methods.set(payment_methods)

        # 画像を保存
        for image_data in images_data:
            ShopImage.objects.create(shop=shop, **image_data)

        return shop


class ShopUpdateSerializer(serializers.ModelSerializer):
    shop_types = serializers.PrimaryKeyRelatedField(queryset=ShopType.objects.all(), many=True, required=False)
    shop_layouts = serializers.PrimaryKeyRelatedField(queryset=ShopLayout.objects.all(), many=True, required=False)
    shop_options = serializers.PrimaryKeyRelatedField(queryset=ShopOption.objects.all(), many=True, required=False)
    payment_methods = serializers.PrimaryKeyRelatedField(queryset=PaymentMethod.objects.all(), many=True, required=False)
    business_hours = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)

    class Meta:
        model = Shop
        fields = [
            'name', 'zip_code', 'address', 'prefecture', 'city',
            'street', 'building', 'capacity', 'shop_types',
            'shop_layouts', 'shop_options', 'payment_methods',
            'phone_number', 'access', 'business_hours',
            'budget_weekday_min', 'budget_weekday_max', 
            'budget_weekend_min', 'budget_weekend_max', 'budget_note'
        ]

    def update(self, instance, validated_data):
        # ManyToManyフィールドのデータを取り出す
        shop_types = validated_data.pop('shop_types', None)
        shop_layouts = validated_data.pop('shop_layouts', None)
        shop_options = validated_data.pop('shop_options', None)
        payment_methods = validated_data.pop('payment_methods', None)
        business_hours_data = validated_data.pop('business_hours', None)

        # 基本フィールドを更新
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # ManyToManyフィールドを更新
        if shop_types is not None:
            instance.shop_types.set(shop_types)
        if shop_layouts is not None:
            instance.shop_layouts.set(shop_layouts)
        if shop_options is not None:
            instance.shop_options.set(shop_options)
        if payment_methods is not None:
            instance.payment_methods.set(payment_methods)

        # 営業時間を更新
        if business_hours_data is not None:
            # 既存の営業時間を削除
            instance.business_hours.all().delete()
            
            # 新しい営業時間を作成
            for hour_data in business_hours_data:
                BusinessHour.objects.create(
                    shop=instance,
                    weekday=hour_data.get('weekday'),
                    open_time=hour_data.get('open_time'),
                    close_time=hour_data.get('close_time'),
                    is_closed=hour_data.get('is_closed', False)
                )

        return instance

# ShopTypeSerializer, ShopLayoutSerializer, ShopOptionSerializer
class ShopTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopType
        fields = '__all__'

class ShopLayoutSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopLayout
        fields = '__all__'

class ShopOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopOption
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'name']

class ShopTagReactionSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = ShopTagReaction
        fields = ['id', 'user', 'reacted_at']
        read_only_fields = ['reacted_at']

class ShopTagSerializer(serializers.ModelSerializer):
    reaction_count = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    user_has_reacted = serializers.SerializerMethodField()
    is_creator = serializers.SerializerMethodField()
    
    class Meta:
        model = ShopTag
        fields = ['id', 'shop', 'value', 'created_at', 'reaction_count', 'user_has_reacted', 'is_creator', 'created_by']
        read_only_fields = ['created_at', 'reaction_count']
        
    def get_reaction_count(self, obj):
        # annotateで追加されたreactions_countフィールドがある場合はそれを使用
        if hasattr(obj, 'reactions_count'):
            return obj.reactions_count
        # なければモデルのプロパティメソッドを使用
        return obj.reactions.count()
    
    def get_user_has_reacted(self, obj):
        request = self.context.get('request')
        print(f"get_user_has_reacted for tag {obj.id} (value={obj.value}): request={request is not None}")
        
        if not request:
            print(f"No request in context for tag {obj.id}")
            return False
            
        if not hasattr(request, 'user'):
            print(f"Request has no user attribute for tag {obj.id}")
            return False
            
        if not request.user.is_authenticated:
            print(f"User not authenticated for tag {obj.id}")
            return False
            
        # 明示的にクエリを実行して結果を取得
        has_reacted = ShopTagReaction.objects.filter(shop_tag=obj, user=request.user).exists()
        print(f"User {request.user.id} ({request.user.email}) has_reacted to tag {obj.id} ({obj.value}): {has_reacted}")
        
        # 明示的にbooleanを返す
        result = bool(has_reacted)
        print(f"Returning user_has_reacted={result} for tag {obj.id}")
        return result
    
    def get_is_creator(self, obj):
        request = self.context.get('request')
        print(f"get_is_creator for tag {obj.id} (value={obj.value}): request={request is not None}")
        
        if not request:
            print(f"No request in context for tag {obj.id}")
            return False
            
        if not hasattr(request, 'user'):
            print(f"Request has no user attribute for tag {obj.id}")
            return False
            
        if not request.user.is_authenticated:
            print(f"User not authenticated for tag {obj.id}")
            return False
            
        if not obj.created_by:
            print(f"Tag {obj.id} has no created_by")
            return False
            
        # 明示的に比較して結果を取得
        is_creator = obj.created_by.id == request.user.id
        print(f"User {request.user.id} ({request.user.email}) is_creator of tag {obj.id} ({obj.value}): {is_creator}, created_by={obj.created_by.id} ({obj.created_by.email})")
        
        # 明示的にbooleanを返す
        result = bool(is_creator)
        print(f"Returning is_creator={result} for tag {obj.id}")
        return result

class ShopTagCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopTag
        fields = ['shop', 'value']


class ShopEditHistorySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    good_count = serializers.SerializerMethodField()
    bad_count = serializers.SerializerMethodField()

    class Meta:
        model = ShopEditHistory
        fields = ('id', 'shop', 'user', 'field_name', 'old_value', 'new_value', 'edited_at', 'good_count', 'bad_count')

    def get_good_count(self, obj):
        return obj.evaluations.filter(evaluation=HistoryEvaluation.EvaluationType.GOOD).count()

    def get_bad_count(self, obj):
        return obj.evaluations.filter(evaluation=HistoryEvaluation.EvaluationType.BAD).count()


class HistoryEvaluationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = HistoryEvaluation
        fields = ('id', 'history', 'user', 'evaluation', 'created_at')
        read_only_fields = ('user', 'created_at')


# UserShopRelationSerializer
class UserShopRelationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    shop = ShopSerializer(read_only=True)

    class Meta:
        model = UserShopRelation
        fields = ['user', 'shop', 'relation_type', 'created_at']
        read_only_fields = ['created_at']


##############################################
# Area関連のSerializer
##############################################

class AreaSerializer(serializers.ModelSerializer):
    """基本的なエリア情報のシリアライザー"""
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Area
        fields = [
            'id', 'name', 'name_kana', 'area_type', 'level',
            'postal_code', 'jis_code', 'is_active', 'full_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class AreaDetailSerializer(serializers.ModelSerializer):
    """詳細なエリア情報のシリアライザー（階層情報含む）"""
    parent = AreaSerializer(read_only=True)
    children = AreaSerializer(many=True, read_only=True)
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    shops_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Area
        fields = [
            'id', 'name', 'name_kana', 'area_type', 'level',
            'parent', 'children', 'postal_code', 'jis_code',
            'is_active', 'full_name', 'shops_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_shops_count(self, obj):
        return obj.shops.filter().count()


class AreaTreeSerializer(serializers.ModelSerializer):
    """エリア階層ツリー表示用のシリアライザー"""
    children = serializers.SerializerMethodField()
    full_name = serializers.CharField(source='get_full_name', read_only=True)
    
    class Meta:
        model = Area
        fields = [
            'id', 'name', 'name_kana', 'area_type', 'level',
            'full_name', 'children'
        ]
    
    def get_children(self, obj):
        children_qs = obj.children.filter(is_active=True)
        
        # 都道府県ごとの市区町村の優先順位を定義
        city_priorities = {
            '東京都': [
                '新宿区', '渋谷区', '港区', '中央区', '千代田区', '品川区', '目黒区',
                '世田谷区', '杉並区', '中野区', '豊島区', '文京区', '台東区', '墨田区',
                '江東区', '荒川区', '足立区', '葛飾区', '江戸川区', '大田区', '練馬区',
                '板橋区', '北区'
            ],
            '大阪府': [
                '大阪市', '堺市', '東大阪市', '枚方市', '豊中市', '高槻市', '吹田市',
                '茨木市', '八尾市', '寝屋川市', '岸和田市'
            ],
            '神奈川県': [
                '横浜市', '川崎市', '相模原市', '横須賀市', '藤沢市', '茅ヶ崎市',
                '厚木市', '大和市', '平塚市'
            ],
            '愛知県': [
                '名古屋市', '豊田市', '岡崎市', '一宮市', '豊橋市', '春日井市',
                '安城市', '豊川市', '西尾市'
            ],
            '福岡県': [
                '福岡市', '北九州市', '久留米市', '大牟田市', '春日市', '糸島市',
                '飯塚市', '大野城市', '宗像市'
            ],
            '北海道': [
                '札幌市', '旭川市', '函館市', '釧路市', '苫小牧市', '帯広市',
                '小樽市', '北見市'
            ],
            '埼玉県': [
                'さいたま市', '川越市', '川口市', '所沢市', '越谷市', '草加市',
                '春日部市', '熊谷市', '上尾市'
            ],
            '千葉県': [
                '千葉市', '船橋市', '松戸市', '市川市', '柏市', '市原市',
                '八千代市', '流山市', '浦安市'
            ]
        }
        
        # 親エリア（都道府県）に応じて子エリア（市区町村）をソート
        parent_name = obj.name
        if parent_name in city_priorities:
            priority_list = city_priorities[parent_name]
            children_list = list(children_qs)
            children_list.sort(key=lambda x: 
                priority_list.index(x.name) if x.name in priority_list else 999
            )
        else:
            children_list = list(children_qs.order_by('name'))
        
        return AreaTreeSerializer(children_list, many=True).data


class AreaGeoJSONSerializer(serializers.ModelSerializer):
    """GeoJSON形式でエリアを出力するシリアライザー"""
    
    class Meta:
        model = Area
        fields = [
            'id', 'name', 'name_kana', 'area_type', 'level',
            'geometry', 'center_point'
        ]
    
    def to_representation(self, instance):
        # GeoJSON形式に変換
        feature = {
            'type': 'Feature',
            'id': instance.id,
            'properties': {
                'name': instance.name,
                'name_kana': instance.name_kana,
                'area_type': instance.area_type,
                'level': instance.level,
                'full_name': instance.get_full_name()
            },
            'geometry': None
        }
        
        if instance.geometry:
            try:
                # 一時的にJSON文字列として保存されている場合の処理
                import json
                feature['geometry'] = json.loads(instance.geometry) if isinstance(instance.geometry, str) else instance.geometry
            except (json.JSONDecodeError, TypeError):
                feature['geometry'] = None
        
        return feature


# 雰囲気フィードバックシステム関連のシリアライザー
class AtmosphereIndicatorSerializer(serializers.ModelSerializer):
    """雰囲気指標のシリアライザー"""
    class Meta:
        model = AtmosphereIndicator
        fields = ['id', 'name', 'description_left', 'description_right']


class ShopAtmosphereFeedbackSerializer(serializers.ModelSerializer):
    """店舗雰囲気フィードバックのシリアライザー"""
    user = serializers.StringRelatedField(read_only=True)
    shop = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = ShopAtmosphereFeedback
        fields = ['id', 'user', 'shop', 'atmosphere_scores', 'created_at', 'updated_at']
        read_only_fields = ['user', 'shop', 'created_at', 'updated_at']


class ShopAtmosphereFeedbackCreateUpdateSerializer(serializers.ModelSerializer):
    """店舗雰囲気フィードバック登録・更新用のシリアライザー"""
    
    class Meta:
        model = ShopAtmosphereFeedback
        fields = ['atmosphere_scores']
    
    def validate_atmosphere_scores(self, value):
        """雰囲気スコアの検証"""
        if not isinstance(value, dict):
            raise serializers.ValidationError("atmosphere_scores must be a dictionary")
        
        # 各スコアが-2から+2の範囲内であることを確認
        for indicator_id, score in value.items():
            if not isinstance(score, int) or score < -2 or score > 2:
                raise serializers.ValidationError(f"Score for indicator {indicator_id} must be an integer between -2 and 2")
        
        # 指標IDが存在することを確認
        indicator_ids = AtmosphereIndicator.objects.values_list('id', flat=True)
        for indicator_id in value.keys():
            try:
                if int(indicator_id) not in indicator_ids:
                    raise serializers.ValidationError(f"Invalid indicator ID: {indicator_id}")
            except ValueError:
                raise serializers.ValidationError(f"Indicator ID must be numeric: {indicator_id}")
        
        return value


class ShopAtmosphereAggregateSerializer(serializers.ModelSerializer):
    """店舗雰囲気集計データのシリアライザー"""
    shop = serializers.StringRelatedField(read_only=True)
    indicators = serializers.SerializerMethodField()
    
    class Meta:
        model = ShopAtmosphereAggregate
        fields = ['shop', 'atmosphere_averages', 'total_feedbacks', 'last_updated', 'indicators']
        read_only_fields = ['shop', 'atmosphere_averages', 'total_feedbacks', 'last_updated']
    
    def get_indicators(self, obj):
        """指標情報と平均値を組み合わせて返す"""
        indicators = AtmosphereIndicator.objects.all()
        result = []
        
        for indicator in indicators:
            indicator_id = str(indicator.id)
            average_score = obj.atmosphere_averages.get(indicator_id, 0.0)
            
            result.append({
                'id': indicator.id,
                'name': indicator.name,
                'description_left': indicator.description_left,
                'description_right': indicator.description_right,
                'average_score': average_score,
                'confidence_level': self._get_confidence_level(obj.total_feedbacks)
            })
        
        return result
    
    def _get_confidence_level(self, total_feedbacks):
        """フィードバック数に基づく信頼度を計算"""
        if total_feedbacks >= 10:
            return 'high'
        elif total_feedbacks >= 5:
            return 'medium'
        else:
            return 'low'
