from rest_framework import serializers
from .models import Shop, ShopImage, ShopType, ShopLayout, ShopOption, BusinessHour, ShopTag, ShopTagReaction, UserShopRelation
from django.contrib.auth import get_user_model

User = get_user_model()

class BusinessHourSerializer(serializers.ModelSerializer):
    weekday_display = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = BusinessHour
        fields = ['weekday', 'weekday_display', 'open_time', 'close_time', 'is_closed']

class ShopSerializer(serializers.ModelSerializer):
    business_hours = BusinessHourSerializer(many=True, read_only=True)
    images = serializers.SerializerMethodField()
    shop_types = serializers.StringRelatedField(many=True)
    shop_layouts = serializers.StringRelatedField(many=True)
    shop_options = serializers.StringRelatedField(many=True)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)
    tags = serializers.SerializerMethodField()

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'zip_code', 'address', 'prefecture', 'city',
            'street', 'building', 'capacity', 'shop_types',
            'shop_layouts', 'shop_options', 'business_hours',
            'images', 'created_by', 'latitude', 'longitude', 'tags'
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

class ShopImageCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopImage
        fields = ['image', 'caption', 'is_icon']

class ShopCreateSerializer(serializers.ModelSerializer):
    images = ShopImageCreateSerializer(many=True, required=False)
    created_by = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Shop
        fields = [
            'name', 'zip_code', 'address', 'prefecture', 'city',
            'street', 'building', 'capacity', 'shop_types',
            'shop_layouts', 'shop_options',
            'images', 'created_by', 'latitude', 'longitude'
        ]

    def create(self, validated_data):
        # ManyToManyフィールドのデータを取り出す
        shop_types = validated_data.pop('shop_types', [])
        shop_layouts = validated_data.pop('shop_layouts', [])
        shop_options = validated_data.pop('shop_options', [])
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

        # 画像を保存
        for image_data in images_data:
            ShopImage.objects.create(shop=shop, **image_data)

        return shop

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
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return ShopTagReaction.objects.filter(shop_tag=obj, user=request.user).exists()
        return False
    
    def get_is_creator(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated and obj.created_by:
            return obj.created_by.id == request.user.id
        return False

class ShopTagCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShopTag
        fields = ['shop', 'value']

# UserShopRelationSerializer
class UserShopRelationSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    shop = ShopSerializer(read_only=True)

    class Meta:
        model = UserShopRelation
        fields = ['user', 'shop', 'relation_type', 'created_at']
        read_only_fields = ['created_at']
