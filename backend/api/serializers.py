from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile,
    Client,
    Receipt,
    ProductItem,
    Mission,
    Store,
    Request,
    ProductReview,
    ReviewAlternative,
)

class RelativeImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None
        try:
            return value.url
        except Exception:
            return None


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(source='userprofile', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'profile']

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class ClientSerializer(serializers.ModelSerializer):
    products = serializers.SerializerMethodField()
    receipts = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = '__all__'

    def get_products(self, obj):
        serializer = ProductItemSerializer(
            obj.products.all(), many=True, context=self.context
        )
        return serializer.data

    def get_receipts(self, obj):
        serializer = ReceiptSerializer(
            obj.receipts.all(), many=True, context=self.context
        )
        return serializer.data


class ProductItemSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    mission_name = serializers.CharField(
        source='mission.name', read_only=True, default=None
    )
    mission_date = serializers.DateTimeField(
        source='mission.start_time', read_only=True, default=None
    )

    class Meta:
        model = ProductItem
        fields = '__all__'


class ReceiptSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    items = ProductItemSerializer(many=True, read_only=True)

    class Meta:
        model = Receipt
        fields = '__all__'


class StoreSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = '__all__'


class MissionSerializer(serializers.ModelSerializer):
    shopper_name = serializers.CharField(source='shopper.username', read_only=True)
    clients_detail = ClientSerializer(source='clients', many=True, read_only=True)
    products = ProductItemSerializer(many=True, read_only=True)

    class Meta:
        model = Mission
        fields = '__all__'


class RequestSerializer(serializers.ModelSerializer):
    created_by_username = serializers.SerializerMethodField()
    created_by_role = serializers.SerializerMethodField()

    def get_created_by_username(self, obj):
        return obj.created_by.username if obj.created_by else None

    def get_created_by_role(self, obj):
        try:
            return obj.created_by.userprofile.role if obj.created_by else 'AV'
        except Exception:
            return 'AV'

    class Meta:
        model = Request
        fields = '__all__'
        extra_kwargs = {
            'created_by': {'read_only': True},
            'mission': {'required': False, 'allow_null': True},
            'product': {'required': False, 'allow_null': True},
            'note': {'required': False, 'allow_null': True},
        }


class ProductReviewSerializer(serializers.ModelSerializer):
    requested_by_username = serializers.CharField(
        source='requested_by.username', read_only=True
    )
    requested_by_role = serializers.CharField(
        source='requested_by.userprofile.role', read_only=True, default='AV'
    )
    alternatives = serializers.SerializerMethodField()

    def get_alternatives(self, obj):
        serializer = ReviewAlternativeSerializer(
            obj.alternatives.all(), many=True, context=self.context
        )
        return serializer.data

    class Meta:
        model = ProductReview
        fields = '__all__'


class ReviewAlternativeSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)

    class Meta:
        model = ReviewAlternative
        fields = '__all__'
