from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    UserProfile,
    Client,
    Receipt,
    ProductItem,
    Mission,
    Store,
    StoreRecommendation,
    ShippingCarrierRecommendation,
    Request,
    ProductReview,
    ReviewAlternative,
    ProductReviewMessage,
    ProductReviewMessageAttachment,
    ProductReviewReadState,
    ClientHistoryShareLink,
    ShoppingPayment,
    ShoppingPaymentEntry,
    Shipment,
    ShipmentEvidence,
    ShipmentShareLink,
)

class RelativeImageField(serializers.ImageField):
    def to_representation(self, value):
        if not value:
            return None
        try:
            return value.url
        except Exception:
            return None


class RelativeMediaField(serializers.FileField):
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
        fields = [
            'role',
            'display_name',
            'phone_country_code',
            'phone',
            'layout_mode',
            'theme_mode',
            'home_layout',
            'waha_api_url',
            'waha_api_key',
            'waha_session',
            'waha_phone_prefix',
            'waha_chat_id_suffix',
        ]


class UserManageSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='userprofile.role', required=False)
    display_name = serializers.CharField(source='userprofile.display_name', required=False, allow_blank=True)
    phone_country_code = serializers.CharField(source='userprofile.phone_country_code', required=False, allow_blank=True)
    phone = serializers.CharField(source='userprofile.phone', required=False, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True, allow_blank=True, trim_whitespace=False)

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'is_active',
            'password',
            'role',
            'display_name',
            'phone_country_code',
            'phone',
        ]

    def validate_phone_country_code(self, value):
        raw_value = str(value or '').strip()
        digits = ''.join(ch for ch in raw_value if ch.isdigit())
        if not digits:
            return '+52'
        return f'+{digits[:4]}'

    def validate_phone(self, value):
        raw_value = str(value or '').strip()
        if not raw_value:
            return ''
        digits = ''.join(ch for ch in raw_value if ch.isdigit())
        if len(digits) > 15:
            raise serializers.ValidationError('Phone must contain at most 15 digits.')
        return digits

    def update(self, instance, validated_data):
        profile_data = validated_data.pop('userprofile', {})
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        if validated_data or password:
            instance.save()
        profile, _ = UserProfile.objects.get_or_create(
            user=instance,
            defaults={'role': 'AV'},
        )
        profile_update_fields = []
        for attr, value in profile_data.items():
            normalized_value = value
            if attr == 'role':
                normalized_value = str(value or 'AV').strip().upper()
            elif attr == 'phone_country_code':
                normalized_value = self.validate_phone_country_code(value)
            elif attr == 'phone':
                normalized_value = self.validate_phone(value)
            if getattr(profile, attr) != normalized_value:
                setattr(profile, attr, normalized_value)
                profile_update_fields.append(attr)
        if profile_update_fields:
            profile.save(update_fields=profile_update_fields)
        return instance

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
    payments = serializers.SerializerMethodField()

    class Meta:
        model = Client
        fields = '__all__'

    def validate_phone_country_code(self, value):
        raw_value = str(value or '').strip()
        digits = ''.join(ch for ch in raw_value if ch.isdigit())
        if not digits:
            return '+52'
        return f'+{digits[:4]}'

    def validate_phone(self, value):
        raw_value = str(value or '').strip()
        if not raw_value:
            return ''
        digits = ''.join(ch for ch in raw_value if ch.isdigit())
        if len(digits) != 10:
            raise serializers.ValidationError('Phone must contain exactly 10 digits.')
        return digits

    def validate_shipping_addresses(self, value):
        if value in (None, ''):
            return []
        if not isinstance(value, list):
            raise serializers.ValidationError('Shipping addresses must be a list.')
        normalized = []
        seen = set()
        for entry in value:
            text = str(entry or '').strip()
            if not text:
                continue
            key = text.casefold()
            if key in seen:
                continue
            seen.add(key)
            normalized.append(text)
        return normalized

    def validate(self, attrs):
        attrs = super().validate(attrs)
        primary_address = str(
            attrs.get(
                'shipping_address',
                getattr(self.instance, 'shipping_address', '') if self.instance else '',
            )
            or ''
        ).strip()
        extra_addresses = attrs.get(
            'shipping_addresses',
            getattr(self.instance, 'shipping_addresses', []) if self.instance else [],
        )
        normalized_extra = []
        seen = {primary_address.casefold()} if primary_address else set()
        for entry in extra_addresses or []:
            text = str(entry or '').strip()
            if not text:
                continue
            key = text.casefold()
            if key in seen:
                continue
            seen.add(key)
            normalized_extra.append(text)
        attrs['shipping_address'] = primary_address
        attrs['shipping_addresses'] = normalized_extra
        return attrs

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

    def get_payments(self, obj):
        serializer = ShoppingPaymentSerializer(
            obj.payments.all(), many=True, context=self.context
        )
        return serializer.data


class ProductItemSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    client_name = serializers.CharField(source='client.name', read_only=True, default='')
    store_name = serializers.CharField(source='store.name', read_only=True, default=None)
    payer_username = serializers.CharField(source='payer.username', read_only=True, default=None)
    shopping = serializers.PrimaryKeyRelatedField(
        source='mission',
        queryset=Mission.objects.all(),
        required=False,
        allow_null=True,
    )
    shopping_name = serializers.CharField(
        source='mission.name', read_only=True, default=None
    )
    shopping_date = serializers.DateTimeField(
        source='mission.start_time', read_only=True, default=None
    )
    mission_name = serializers.CharField(
        source='mission.name', read_only=True, default=None
    )
    mission_date = serializers.DateTimeField(
        source='mission.start_time', read_only=True, default=None
    )
    shipment = serializers.SerializerMethodField()

    def get_shipment(self, obj):
        shipment = None
        try:
            shipment = getattr(obj, 'shipment', None)
        except Exception:
            shipment = None
        if shipment:
            return ShipmentSerializer(shipment, context=self.context).data
        related_shipments = getattr(obj, 'shipments', None)
        if related_shipments is None:
            return None
        active_shipment = related_shipments.order_by('-updated_at', '-id').first()
        if not active_shipment:
            return None
        return ShipmentSerializer(active_shipment, context=self.context).data

    class Meta:
        model = ProductItem
        fields = '__all__'


class ShipmentProductSummarySerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    shopping_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    shopping_date = serializers.DateTimeField(
        source='mission.start_time', read_only=True, default=None
    )
    mission_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    mission_date = serializers.DateTimeField(
        source='mission.start_time', read_only=True, default=None
    )
    store_name = serializers.CharField(source='store.name', read_only=True, default=None)
    payer_username = serializers.CharField(source='payer.username', read_only=True, default=None)

    class Meta:
        model = ProductItem
        fields = [
            'id',
            'name',
            'image',
            'charged_price',
            'real_price',
            'payer',
            'payer_username',
            'status',
            'shopping_name',
            'shopping_date',
            'mission_name',
            'mission_date',
            'store_name',
        ]


class ShoppingPaymentProductSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    shopping = serializers.IntegerField(source='mission_id', read_only=True)
    shopping_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    payer_username = serializers.CharField(source='payer.username', read_only=True, default=None)

    class Meta:
        model = ProductItem
        fields = [
            'id',
            'name',
            'image',
            'charged_price',
            'real_price',
            'payer',
            'payer_username',
            'status',
            'shopping',
            'shopping_name',
        ]


class ShoppingPaymentEntrySerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True, default=None
    )
    shopping = serializers.IntegerField(source='payment.mission_id', read_only=True)
    shopping_name = serializers.CharField(
        source='payment.mission.name', read_only=True, default=None
    )

    class Meta:
        model = ShoppingPaymentEntry
        fields = [
            'id',
            'amount',
            'total_after',
            'entry_kind',
            'group_token',
            'shopping',
            'shopping_name',
            'created_by',
            'created_by_username',
            'created_at',
        ]
        read_only_fields = fields


class ShoppingPaymentSerializer(serializers.ModelSerializer):
    shopping = serializers.PrimaryKeyRelatedField(
        source='mission',
        queryset=Mission.objects.all(),
        required=False,
        allow_null=True,
    )
    shopping_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    client_name = serializers.CharField(source='client.name', read_only=True, default=None)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, default=None)
    products_detail = ShoppingPaymentProductSerializer(source='products', many=True, read_only=True)
    entries = ShoppingPaymentEntrySerializer(many=True, read_only=True)
    products_total = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    def get_products_total(self, obj):
        total = 0
        for product in obj.products.all():
            amount = product.charged_price if product.charged_price is not None else product.real_price
            if amount is None:
                continue
            total += float(amount)
        return round(total, 2)

    def get_balance(self, obj):
        return round(self.get_products_total(obj) - float(obj.amount or 0), 2)

    def validate(self, attrs):
        attrs = super().validate(attrs)
        client = attrs.get('client') or getattr(self.instance, 'client', None)
        mission = attrs.get('mission') if 'mission' in attrs else getattr(self.instance, 'mission', None)
        products = attrs.get('products') if 'products' in attrs else (
            self.instance.products.all() if self.instance else []
        )
        existing_product_ids = set()
        if self.instance:
            existing_product_ids = set(
                self.instance.products.values_list('id', flat=True)
            )
        if mission is None:
            raise serializers.ValidationError({'shopping': 'Shopping is required.'})
        if client is None:
            raise serializers.ValidationError({'client': 'Client is required.'})
        conflicting_payment_queryset = ShoppingPayment.objects.filter(
            client=client,
            mission=mission,
        )
        if self.instance:
            conflicting_payment_queryset = conflicting_payment_queryset.exclude(
                id=self.instance.id
            )
        elif conflicting_payment_queryset.exists():
            raise serializers.ValidationError(
                {'shopping': 'This shopping already has a payment. Update the existing payment.'}
            )
        for product in products:
            if product.client_id != client.id:
                raise serializers.ValidationError({'products': 'All selected products must belong to the client.'})
            if product.mission_id != mission.id:
                raise serializers.ValidationError({'products': 'All selected products must belong to the selected shopping.'})
            if (
                str(product.status or '').upper() != 'ANNOTATED'
                and product.id not in existing_product_ids
            ):
                raise serializers.ValidationError(
                    {'products': 'Only annotated products can be added to a payment.'}
                )
        conflicting_product_names = []
        for payment in conflicting_payment_queryset.prefetch_related('products'):
            conflicting_product_names.extend(
                product.name
                for product in payment.products.all()
                if product.id in [selected_product.id for selected_product in products]
            )
        if conflicting_product_names:
            raise serializers.ValidationError(
                {
                    'products': (
                        'These products are already linked to another payment in this shopping: '
                        + ', '.join(sorted(set(conflicting_product_names)))
                    )
                }
            )
        return attrs

    class Meta:
        model = ShoppingPayment
        fields = '__all__'
        read_only_fields = ['created_by']
        extra_kwargs = {
            'mission': {'required': False, 'allow_null': True},
            'products': {'required': False},
            'note': {'required': False, 'allow_null': True, 'allow_blank': True},
        }


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


class StoreRecommendationSerializer(serializers.ModelSerializer):
    store_name = serializers.CharField(source='store.name', read_only=True)

    class Meta:
        model = StoreRecommendation
        fields = [
            'id',
            'store',
            'store_name',
            'times_used',
            'last_used_at',
            'created_at',
        ]


class ShippingCarrierRecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShippingCarrierRecommendation
        fields = [
            'id',
            'name',
            'times_used',
            'last_used_at',
            'created_at',
        ]


class MissionSerializer(serializers.ModelSerializer):
    ticket_image = RelativeImageField(required=False, allow_null=True)
    shopper_name = serializers.CharField(source='shopper.username', read_only=True)
    payer_username = serializers.CharField(source='payer.username', read_only=True, default=None)
    store_name = serializers.CharField(source='store.name', read_only=True, default=None)
    products = ProductItemSerializer(many=True, read_only=True)

    class Meta:
        model = Mission
        fields = '__all__'


class RequestSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    shopping = serializers.PrimaryKeyRelatedField(
        source='mission',
        queryset=Mission.objects.all(),
        required=False,
        allow_null=True,
    )
    created_by_username = serializers.SerializerMethodField()
    created_by_role = serializers.SerializerMethodField()
    client_name = serializers.CharField(source='client.name', read_only=True, default=None)

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
            'client': {'required': False, 'allow_null': True},
            'mission': {'required': False, 'allow_null': True},
            'product': {'required': False, 'allow_null': True},
            'image': {'required': False, 'allow_null': True},
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
    messages = serializers.SerializerMethodField()
    current_user_last_seen_message_id = serializers.SerializerMethodField()
    current_user_last_seen_message_at = serializers.SerializerMethodField()

    def get_alternatives(self, obj):
        serializer = ReviewAlternativeSerializer(
            obj.alternatives.all(), many=True, context=self.context
        )
        return serializer.data

    def get_messages(self, obj):
        serializer = ProductReviewMessageSerializer(
            obj.messages.all(), many=True, context=self.context
        )
        return serializer.data

    def _get_read_state(self, obj):
        product_id = getattr(obj, 'product_id', None)
        if not product_id:
            return None
        state_map = self.context.get('review_read_state_map') or {}
        state = state_map.get(product_id)
        if state is not None:
            return state
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return None
        return (
            ProductReviewReadState.objects.select_related('last_seen_message')
            .filter(user=user, product_id=product_id)
            .first()
        )

    def get_current_user_last_seen_message_id(self, obj):
        state = self._get_read_state(obj)
        return state.last_seen_message_id if state else None

    def get_current_user_last_seen_message_at(self, obj):
        state = self._get_read_state(obj)
        if not state or not state.last_seen_message:
            return None
        return state.last_seen_message.created_at

    class Meta:
        model = ProductReview
        fields = '__all__'
        extra_kwargs = {
            'requested_by': {'read_only': True},
        }


class ReviewAlternativeSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)

    class Meta:
        model = ReviewAlternative
        fields = '__all__'


class ProductReviewMessageAttachmentSerializer(serializers.ModelSerializer):
    file = RelativeImageField(required=False, allow_null=True)

    class Meta:
        model = ProductReviewMessageAttachment
        fields = '__all__'


class ProductReviewMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(
        source='sender.username', read_only=True
    )
    sender_role = serializers.CharField(
        source='sender.userprofile.role', read_only=True, default='AV'
    )
    attachments = ProductReviewMessageAttachmentSerializer(many=True, read_only=True)
    delivery_status = serializers.SerializerMethodField()
    seen_by_other = serializers.SerializerMethodField()

    def get_delivery_status(self, obj):
        return 'sent'

    def get_seen_by_other(self, obj):
        review = getattr(obj, 'review', None)
        product_id = getattr(review, 'product_id', None)
        sender_id = getattr(obj, 'sender_id', None)
        if not product_id or not sender_id:
            return False
        return ProductReviewReadState.objects.filter(
            product_id=product_id,
            last_seen_message_id__gte=obj.id,
        ).exclude(user_id=sender_id).exists()

    class Meta:
        model = ProductReviewMessage
        fields = '__all__'
        extra_kwargs = {
            'sender': {'read_only': True},
        }


class ClientHistoryShareLinkSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)

    class Meta:
        model = ClientHistoryShareLink
        fields = [
            'id',
            'client',
            'client_name',
            'is_active',
            'expires_at',
            'last_accessed_at',
            'created_at',
        ]


class ShipmentShareLinkSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='shipment.client.name', read_only=True)

    class Meta:
        model = ShipmentShareLink
        fields = [
            'id',
            'shipment',
            'client_name',
            'is_active',
            'expires_at',
            'last_accessed_at',
            'created_at',
        ]


class PublicShipmentSummarySerializer(serializers.ModelSerializer):
    evidence = serializers.SerializerMethodField()

    def get_evidence(self, obj):
        return ShipmentEvidenceSerializer(
            obj.evidence.all(),
            many=True,
            context=self.context,
        ).data

    def to_representation(self, instance):
        data = super().to_representation(instance)
        client = getattr(instance, 'client', None)
        data['shipping_address'] = (
            (getattr(client, 'shipping_address', '') or '')
            if client is not None
            else (getattr(instance, 'shipping_address', '') or '')
        )
        return data

    class Meta:
        model = Shipment
        fields = [
            'id',
            'status',
            'carrier',
            'tracking_number',
            'guide_price',
            'client_price',
            'shipping_address',
            'evidence',
            'updated_at',
        ]


class ClientMissionShareProductSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)
    shipment = serializers.SerializerMethodField()
    discount_percentage = serializers.DecimalField(
        source='mission.discount_percentage',
        max_digits=5,
        decimal_places=2,
        read_only=True,
        default=0,
    )

    def get_shipment(self, obj):
        shipment = None
        try:
            shipment = getattr(obj, 'shipment', None)
        except Exception:
            shipment = None
        if shipment:
            return PublicShipmentSummarySerializer(shipment, context=self.context).data
        related_shipments = getattr(obj, 'shipments', None)
        if related_shipments is None:
            return None
        active_shipment = related_shipments.order_by('-updated_at', '-id').first()
        if not active_shipment:
            return None
        return PublicShipmentSummarySerializer(active_shipment, context=self.context).data

    class Meta:
        model = ProductItem
        fields = [
            'id',
            'name',
            'image',
            'status',
            'charged_price',
            'real_price',
            'discount_percentage',
            'created_at',
            'purchase_date',
            'shipment',
        ]


class PublicClientReceiptSerializer(serializers.ModelSerializer):
    image = RelativeImageField(required=False, allow_null=True)

    class Meta:
        model = Receipt
        fields = [
            'id',
            'image',
            'uploaded_at',
            'total_real_price',
            'total_charged_price',
        ]


class ShipmentSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    shopping = serializers.PrimaryKeyRelatedField(
        source='mission',
        queryset=Mission.objects.all(),
        required=False,
        allow_null=True,
    )
    shopping_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    mission_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    products_detail = ShipmentProductSummarySerializer(source='products', many=True, read_only=True)
    product_count = serializers.SerializerMethodField()
    shopping_names = serializers.SerializerMethodField()
    mission_names = serializers.SerializerMethodField()
    evidence = serializers.SerializerMethodField()
    client_shipping_addresses = serializers.SerializerMethodField()

    def get_product_count(self, obj):
        return obj.products.count()

    def get_mission_names(self, obj):
        mission_names = []
        seen = set()
        for product in obj.products.select_related('mission').all():
            mission_name = None
            if product.mission and product.mission.name:
                mission_name = product.mission.name
            elif product.store and product.store.name:
                mission_name = product.store.name
            elif product.mission_id:
                mission_name = f'Shopping #{product.mission_id}'
            if mission_name and mission_name not in seen:
                seen.add(mission_name)
                mission_names.append(mission_name)
        return mission_names

    def get_shopping_names(self, obj):
        return self.get_mission_names(obj)

    def get_evidence(self, obj):
        return ShipmentEvidenceSerializer(
            obj.evidence.all(),
            many=True,
            context=self.context,
        ).data

    def get_client_shipping_addresses(self, obj):
        client = getattr(obj, 'client', None)
        if client is None:
            return []
        addresses = []
        seen = set()

        def append_address(value):
            text = str(value or '').strip()
            if not text:
                return
            key = text.casefold()
            if key in seen:
                return
            seen.add(key)
            addresses.append(text)

        append_address(getattr(client, 'shipping_address', ''))
        for entry in getattr(client, 'shipping_addresses', []) or []:
            append_address(entry)
        return addresses

    def to_representation(self, instance):
        data = super().to_representation(instance)
        client = getattr(instance, 'client', None)
        data['shipping_address'] = (
            (getattr(instance, 'shipping_address', '') or '')
            or (getattr(client, 'shipping_address', '') or '')
            if client is not None
            else (getattr(instance, 'shipping_address', '') or '')
        )
        return data

    def validate(self, attrs):
        attrs = super().validate(attrs)
        client = attrs.get('client') or getattr(self.instance, 'client', None)
        mission = attrs.get('mission') if 'mission' in attrs else getattr(self.instance, 'mission', None)
        tracking_number = attrs.get('tracking_number') if 'tracking_number' in attrs else getattr(self.instance, 'tracking_number', None)
        tracking_number = (tracking_number or '').strip()
        if not client or not tracking_number:
            return attrs
        queryset = Shipment.objects.filter(
            client=client,
            tracking_number=tracking_number,
            mission=mission,
        )
        if self.instance and self.instance.pk:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError(
                {'tracking_number': 'Ya existe una guia igual para este cliente y shopping.'}
            )
        return attrs

    class Meta:
        model = Shipment
        fields = '__all__'
        read_only_fields = ['created_by']
        validators = []
        extra_kwargs = {
            'client': {'required': True},
            'mission': {'required': False, 'allow_null': True},
            'product': {'required': False, 'allow_null': True},
            'carrier': {'required': False, 'allow_null': True, 'allow_blank': True},
            'tracking_number': {'required': False, 'allow_null': True, 'allow_blank': True},
            'guide_price': {'required': False, 'allow_null': True},
            'client_price': {'required': False, 'allow_null': True},
            'shipping_address': {'required': False, 'allow_null': True, 'allow_blank': True},
            'products': {'required': False},
        }


class ShipmentListSerializer(serializers.ModelSerializer):
    client_name = serializers.CharField(source='client.name', read_only=True)
    shopping = serializers.PrimaryKeyRelatedField(
        source='mission',
        queryset=Mission.objects.all(),
        required=False,
        allow_null=True,
    )
    shopping_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    mission_name = serializers.CharField(source='mission.name', read_only=True, default=None)
    product_count = serializers.IntegerField(read_only=True)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        client = getattr(instance, 'client', None)
        data['shipping_address'] = (
            (getattr(instance, 'shipping_address', '') or '')
            or (getattr(client, 'shipping_address', '') or '')
            if client is not None
            else (getattr(instance, 'shipping_address', '') or '')
        )
        return data

    class Meta:
        model = Shipment
        fields = [
            'id',
            'client',
            'client_name',
            'shopping',
            'shopping_name',
            'mission_name',
            'carrier',
            'tracking_number',
            'guide_price',
            'client_price',
            'shipping_address',
            'status',
            'product_count',
            'created_at',
            'updated_at',
        ]


class ShipmentEvidenceSerializer(serializers.ModelSerializer):
    file = RelativeMediaField(required=False, allow_null=True)
    uploaded_by_username = serializers.CharField(
        source='uploaded_by.username',
        read_only=True,
        default=None,
    )

    class Meta:
        model = ShipmentEvidence
        fields = [
            'id',
            'file',
            'media_type',
            'created_at',
            'uploaded_by',
            'uploaded_by_username',
        ]
        read_only_fields = fields
