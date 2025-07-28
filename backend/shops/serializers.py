from rest_framework import serializers
from .models import (
    Shop, ShopImage, ShopType, ShopLayout, ShopOption, BusinessHour, 
    ShopTag, ShopTagReaction, UserShopRelation, PaymentMethod,
    ShopEditHistory, HistoryEvaluation
)
from django.contrib.auth import get_user_model
from django.db.models import Count

User = get_user_model()

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

    class Meta:
        model = Shop
        fields = [
            'id', 'name', 'zip_code', 'address', 'prefecture', 'city',
            'street', 'building', 'capacity', 'shop_types',
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
