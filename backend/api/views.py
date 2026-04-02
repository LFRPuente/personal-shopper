from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from django.core.files.base import ContentFile
from django.http import Http404
from collections import defaultdict
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from decimal import Decimal
import hashlib
import secrets
from .models import (
    Client,
    ProductItem,
    Receipt,
    Mission,
    UserProfile,
    LayoutMode,
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
from .serializers import (
    ClientSerializer,
    ProductItemSerializer,
    ReceiptSerializer,
    MissionSerializer,
    UserSerializer,
    StoreSerializer,
    StoreRecommendationSerializer,
    ShippingCarrierRecommendationSerializer,
    RequestSerializer,
    ProductReviewSerializer,
    ReviewAlternativeSerializer,
    ClientHistoryShareLinkSerializer,
    ClientMissionShareProductSerializer,
    ShoppingPaymentSerializer,
    ShipmentSerializer,
    ShipmentEvidenceSerializer,
    ShipmentShareLinkSerializer,
    PublicClientReceiptSerializer,
)
import random
from datetime import date, timedelta
import os


# <-------- seccion 8: helper de broadcast para websocket group "updates"
def broadcast_update(model, action='changed', object_id=None):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    async_to_sync(channel_layer.group_send)(
        'updates',
        {
            'type': 'send_update',
            'model': model,
            'action': action,
            'id': object_id,
        },
    )


def create_payment_entry(payment, amount, total_after, user=None, entry_kind='SHOPPING', group_token=None):
    amount_decimal = Decimal(amount or 0)
    if amount_decimal == Decimal('0'):
        return None
    return ShoppingPaymentEntry.objects.create(
        payment=payment,
        amount=amount_decimal,
        total_after=Decimal(total_after or 0),
        entry_kind=entry_kind or 'SHOPPING',
        group_token=(str(group_token).strip() or None) if group_token is not None else None,
        created_by=user,
    )


def recalculate_payment_entry_totals(payment):
    running_total = Decimal('0')
    for entry in payment.entries.order_by('created_at', 'id'):
        running_total += Decimal(entry.amount or 0)
        if Decimal(entry.total_after or 0) != running_total:
            entry.total_after = running_total
            entry.save(update_fields=['total_after'])
    if Decimal(payment.amount or 0) != running_total:
        payment.amount = running_total
        payment.save(update_fields=['amount', 'updated_at'])
    return payment


def broadcast_shopping_update(action='changed', object_id=None):
    broadcast_update('shoppings', action=action, object_id=object_id)
    broadcast_update('missions', action=action, object_id=object_id)


def get_shopping_query_param(request):
    return request.query_params.get('shopping') or request.query_params.get('mission')


def get_shopping_data_value(request):
    return request.data.get('shopping', request.data.get('mission'))


def hash_share_token(raw_token):
    return hashlib.sha256(raw_token.encode('utf-8')).hexdigest()


def build_public_client_share_url(request, raw_token):
    base_url = os.getenv('PUBLIC_SHARE_BASE_URL', 'https://ps.servidorfs.com').rstrip('/')
    return f'{base_url}/share/client/{raw_token}/'


def build_public_shipment_share_url(request, raw_token):
    base_url = os.getenv('PUBLIC_SHARE_BASE_URL', 'https://ps.servidorfs.com').rstrip('/')
    return f'{base_url}/share/shipment/{raw_token}/'


PUBLIC_CLIENT_SHARE_PRODUCT_STATUSES = ['ANNOTATED', 'BOUGHT', 'SHIPPED']


def calculate_client_credit_total(client):
    if not client:
        return 0
    credit_total = 0
    payments = (
        ShoppingPayment.objects.filter(client=client)
        .prefetch_related('products')
        .order_by('-created_at', '-id')
    )
    for payment in payments:
        products_total = 0
        for product in payment.products.all():
            products_total += float(product.charged_price or product.real_price or 0)
        credit_total += float(payment.amount or 0) - products_total
    return round(max(credit_total, 0), 2)


def calculate_client_share_balance_total(client):
    if not client:
        return 0
    def get_discounted_product_amount(product, discount_percentage=0):
        discount_multiplier = max(0, 1 - float(discount_percentage or 0) / 100)
        charged_price = product.charged_price
        if charged_price is not None:
            return float(charged_price) * discount_multiplier
        real_price = product.real_price
        return float(real_price or 0)

    products = list(
        ProductItem.objects.filter(client=client)
        .exclude(status__in=['IN_REVIEW', 'REJECTED'])
        .select_related('mission')
        .order_by('-created_at', '-id')
    )
    payments = list(
        ShoppingPayment.objects.filter(client=client, mission__isnull=False)
        .select_related('mission')
        .prefetch_related('products')
        .order_by('-updated_at', '-created_at', '-id')
    )

    products_by_shopping = {}
    for product in products:
        shopping_id = product.mission_id
        if not shopping_id:
            continue
        products_by_shopping.setdefault(shopping_id, []).append(product)

    latest_payments_by_shopping = {}
    for payment in payments:
        shopping_id = payment.mission_id
        if not shopping_id or shopping_id in latest_payments_by_shopping:
            continue
        latest_payments_by_shopping[shopping_id] = payment

    shopping_ids = set(products_by_shopping.keys()) | set(latest_payments_by_shopping.keys())
    balance_total = 0
    for shopping_id in shopping_ids:
        latest_payment = latest_payments_by_shopping.get(shopping_id)
        selected_product_ids = set()
        payment_amount = 0
        discount_percentage = 0
        if latest_payment is not None:
            selected_product_ids = set(latest_payment.products.values_list('id', flat=True))
            payment_amount = float(latest_payment.amount or 0)
            discount_percentage = float(
                getattr(latest_payment.mission, 'discount_percentage', 0) or 0
            )
        elif products_by_shopping.get(shopping_id):
            mission = products_by_shopping[shopping_id][0].mission
            discount_percentage = float(
                getattr(mission, 'discount_percentage', 0) or 0
            )

        products_total = 0
        for product in products_by_shopping.get(shopping_id, []):
            product_status = str(product.status or '').upper()
            if product_status == 'ANNOTATED' or product.id in selected_product_ids:
                products_total += get_discounted_product_amount(product, discount_percentage)

        balance_total += products_total - payment_amount
    return round(balance_total, 2)


def deactivate_empty_client_share_links(client_id=None, mission_id=None):
    if not client_id:
        return
    still_shareable = ProductItem.objects.filter(client_id=client_id).exists()
    if still_shareable:
        return
    ClientHistoryShareLink.objects.filter(
        client_id=client_id,
        is_active=True,
    ).update(is_active=False)


def deactivate_empty_shipment_share_links(shipment):
    if not shipment:
        return
    if shipment.products.exists():
        return
    ShipmentShareLink.objects.filter(
        shipment=shipment,
        is_active=True,
    ).update(is_active=False)


def product_has_any_shipment(product):
    if not product:
        return False
    try:
        if getattr(product, 'shipment', None):
            return True
    except Exception:
        pass
    try:
        return product.shipments.exists()
    except Exception:
        return False


def validate_products_ready_for_shipment(products):
    invalid_products = [
        product
        for product in (products or [])
        if getattr(product, 'mission_id', None)
        and getattr(getattr(product, 'mission', None), 'status', None) != 'COMPLETED'
    ]
    if invalid_products:
        raise serializers.ValidationError(
            {
                'products': (
                    'Only products from completed shoppings can be added to a shipment.'
                )
            }
        )


def mark_product_as_shipped(product):
    if not product:
        return
    if product.status != 'SHIPPED':
        product.status = 'SHIPPED'
        product.save(update_fields=['status'])


def sync_detached_product_status(product):
    if not product:
        return
    if product_has_any_shipment(product):
        return
    if product.status == 'SHIPPED':
        product.status = 'ANNOTATED'
        product.save(update_fields=['status'])


def attach_products_to_shipment(shipment, products):
    if not shipment:
        return
    validate_products_ready_for_shipment(products)
    desired_ids = [product.id for product in products]
    current_ids = list(shipment.products.values_list('id', flat=True))
    remove_ids = [product_id for product_id in current_ids if product_id not in desired_ids]
    if remove_ids:
        removed_products = list(ProductItem.objects.filter(id__in=remove_ids))
        shipment.products.remove(*remove_ids)
        for product in removed_products:
            sync_detached_product_status(product)
            broadcast_update('products', action='updated', object_id=product.id)
    if not desired_ids:
        deactivate_empty_shipment_share_links(shipment)
    for product in products:
        was_attached_to_this_shipment = product.id in current_ids
        for other in Shipment.objects.filter(products=product).exclude(id=shipment.id):
            other.products.remove(product)
            if other.product_id == product.id:
                fallback_product_id = other.products.order_by('id').values_list('id', flat=True).first()
                other.product_id = fallback_product_id
                other.save(update_fields=['product'])
            deactivate_empty_shipment_share_links(other)
            broadcast_update('shipments', action='updated', object_id=other.id)
        shipment.products.add(product)
        if not was_attached_to_this_shipment:
            mark_product_as_shipped(product)
        broadcast_update('products', action='updated', object_id=product.id)
    primary_product_id = desired_ids[0] if desired_ids else None
    mission_ids = list(
        {
            product.mission_id
            for product in products
            if getattr(product, 'mission_id', None)
        }
    )
    derived_mission_id = mission_ids[0] if len(mission_ids) == 1 else None
    update_fields = []
    if shipment.product_id != primary_product_id:
        shipment.product_id = primary_product_id
        update_fields.append('product')
    if shipment.mission_id != derived_mission_id:
        shipment.mission_id = derived_mission_id
        update_fields.append('mission')
    if update_fields:
        shipment.save(update_fields=update_fields)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    Endpoint para registrar usuarios desde el front.
    Espera username, password, email y role (AV, PS, BOTH).
    """
    data = request.data
    username = data.get('username')
    password = data.get('password')
    email = data.get('email', '')
    role = data.get('role', 'AV')
    
    if not username or not password:
        return Response({'error': 'Please provide username and password'}, status=status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
        
    user = User.objects.create_user(username=username, email=email, password=password)
    UserProfile.objects.create(user=user, role=role)
    
    return Response({'message': 'User created successfully', 'username': username, 'role': role}, status=status.HTTP_201_CREATED)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Devuelve los datos del usuario actual.
    """
    default_home_layout = {
        'left_width_percent': 62,
        'top_height': 232,
    }
    profile, _ = UserProfile.objects.get_or_create(
        user=request.user,
        defaults={'role': 'AV'},
    )
    if request.method == 'PATCH':
        update_fields = []
        display_name = request.data.get('display_name')
        if display_name is not None:
            normalized_display_name = str(display_name).strip()
            if profile.display_name != normalized_display_name:
                profile.display_name = normalized_display_name
                update_fields.append('display_name')
        phone = request.data.get('phone')
        if phone is not None:
            normalized_phone = str(phone).strip()
            if profile.phone != normalized_phone:
                profile.phone = normalized_phone
                update_fields.append('phone')
        layout_mode = request.data.get('layout_mode')
        if layout_mode is not None:
            normalized_layout_mode = str(layout_mode).strip().upper()
            valid_layout_modes = {choice[0] for choice in LayoutMode.choices}
            if normalized_layout_mode not in valid_layout_modes:
                return Response(
                    {'error': 'Invalid layout mode.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if profile.layout_mode != normalized_layout_mode:
                profile.layout_mode = normalized_layout_mode
                update_fields.append('layout_mode')
        home_layout = request.data.get('home_layout')
        if home_layout is not None:
            if not isinstance(home_layout, dict):
                return Response(
                    {'error': 'Invalid home layout.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            base_home_layout = profile.home_layout or {}
            try:
                normalized_home_layout = {
                    'left_width_percent': int(
                        max(
                            44,
                            min(
                                72,
                                float(
                                    home_layout.get(
                                        'left_width_percent',
                                        base_home_layout.get(
                                            'left_width_percent',
                                            default_home_layout['left_width_percent'],
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                    'top_height': int(
                        max(
                            188,
                            min(
                                360,
                                float(
                                    home_layout.get(
                                        'top_height',
                                        base_home_layout.get(
                                            'top_height',
                                            default_home_layout['top_height'],
                                        ),
                                    ),
                                ),
                            ),
                        ),
                    ),
                }
            except (TypeError, ValueError):
                return Response(
                    {'error': 'Invalid home layout.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if profile.home_layout != normalized_home_layout:
                profile.home_layout = normalized_home_layout
                update_fields.append('home_layout')
        if update_fields:
            profile.save(update_fields=update_fields)
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users(request):
    queryset = User.objects.select_related('userprofile').filter(
        is_active=True
    ).order_by('username')
    serializer = UserSerializer(queryset, many=True)
    return Response(serializer.data)


def touch_store_recommendation(user, store):
    if not user or not store:
        return None
    recommendation, created = StoreRecommendation.objects.get_or_create(
        user=user,
        store=store,
        defaults={'times_used': 1},
    )
    if not created:
        StoreRecommendation.objects.filter(id=recommendation.id).update(
            times_used=F('times_used') + 1,
            last_used_at=timezone.now(),
        )
    return recommendation


def normalize_shipping_carrier_name(name):
    return " ".join(str(name or "").strip().split()).lower()


def touch_shipping_carrier_recommendation(user, carrier_name):
    cleaned_name = " ".join(str(carrier_name or "").strip().split())
    normalized_name = normalize_shipping_carrier_name(cleaned_name)
    if not user or not normalized_name:
        return None
    recommendation, created = ShippingCarrierRecommendation.objects.get_or_create(
        user=user,
        normalized_name=normalized_name,
        defaults={'name': cleaned_name, 'times_used': 1},
    )
    if not created:
        ShippingCarrierRecommendation.objects.filter(id=recommendation.id).update(
            name=cleaned_name,
            times_used=F('times_used') + 1,
            last_used_at=timezone.now(),
        )
    return recommendation


def sync_shipment_shipping_address(shipment, validated_data=None):
    if not shipment or not shipment.client_id:
        return False
    client = shipment.client
    explicit_address = (
        validated_data is not None and 'shipping_address' in validated_data
    )
    primary_address = str(getattr(client, 'shipping_address', '') or '').strip()
    next_address = str(shipment.shipping_address or '').strip() if explicit_address else primary_address
    normalized_address = next_address or primary_address
    client_updated = False
    current_extra_addresses = list(getattr(client, 'shipping_addresses', []) or [])
    normalized_extra_addresses = []
    seen = {primary_address.casefold()} if primary_address else set()
    for entry in current_extra_addresses:
        text = str(entry or '').strip()
        if not text:
            continue
        key = text.casefold()
        if key in seen:
            continue
        seen.add(key)
        normalized_extra_addresses.append(text)
    update_fields = []
    if explicit_address and normalized_address:
        if not primary_address:
            client.shipping_address = normalized_address
            primary_address = normalized_address
            client_updated = True
            update_fields.append('shipping_address')
        elif normalized_address.casefold() != primary_address.casefold():
            key = normalized_address.casefold()
            if key not in seen:
                normalized_extra_addresses.append(normalized_address)
                seen.add(key)
                client_updated = True
    if normalized_extra_addresses != list(getattr(client, 'shipping_addresses', []) or []):
        client.shipping_addresses = normalized_extra_addresses
        client_updated = True
        update_fields.append('shipping_addresses')
    if update_fields:
        client.save(update_fields=update_fields)
    if str(shipment.shipping_address or '').strip() != normalized_address:
        shipment.shipping_address = normalized_address
        shipment.save(update_fields=['shipping_address'])
    return client_updated


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def store_recommendations(request):
    queryset = (
        StoreRecommendation.objects.select_related('store')
        .filter(user=request.user)
        .order_by('-last_used_at', '-times_used', 'store__name')
    )
    serializer = StoreRecommendationSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_store_recommendation(request, recommendation_id):
    deleted, _ = StoreRecommendation.objects.filter(
        id=recommendation_id,
        user=request.user,
    ).delete()
    if deleted == 0:
        return Response(
            {'error': 'Store recommendation not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shipping_carrier_recommendations(request):
    queryset = (
        ShippingCarrierRecommendation.objects.filter(user=request.user)
        .order_by('-last_used_at', '-times_used', 'name')
    )
    serializer = ShippingCarrierRecommendationSerializer(queryset, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unread_review_summary(request):
    mission_id = get_shopping_query_param(request)
    queryset = ProductReview.objects.select_related(
        'product', 'product__client'
    ).prefetch_related(
        'messages',
    ).exclude(product_id__isnull=True)
    if mission_id:
        queryset = queryset.filter(product__mission_id=mission_id)
    else:
        queryset = queryset.filter(product__mission__status__in=['ACTIVE', 'PAUSED'])
    latest_by_product = {}
    for review in queryset:
        product_id = review.product_id
        if not product_id:
            continue
        latest_message = None
        for message in review.messages.all():
            if latest_message is None:
                latest_message = message
                continue
            if (
                message.created_at > latest_message.created_at
                or (
                    message.created_at == latest_message.created_at
                    and message.id > latest_message.id
                )
            ):
                latest_message = message
        if latest_message is None:
            continue
        current = latest_by_product.get(product_id)
        if current is None:
            latest_by_product[product_id] = (review, latest_message)
            continue
        _, current_message = current
        if (
            latest_message.created_at > current_message.created_at
            or (
                latest_message.created_at == current_message.created_at
                and latest_message.id > current_message.id
            )
        ):
            latest_by_product[product_id] = (review, latest_message)
    read_state_map = {
        state.product_id: state.last_seen_message_id
        for state in ProductReviewReadState.objects.filter(
            user=request.user,
            product_id__in=list(latest_by_product.keys()),
        )
    }
    by_client = defaultdict(lambda: {'product_ids': [], 'latest_activity_at': None})
    for product_id, (review, latest_message) in latest_by_product.items():
        last_seen_message_id = read_state_map.get(product_id)
        if last_seen_message_id and last_seen_message_id >= latest_message.id:
            continue
        client_id = getattr(review.product, 'client_id', None)
        if not client_id:
            continue
        by_client[client_id]['product_ids'].append(product_id)
        latest_iso = latest_message.created_at.isoformat()
        if (
            by_client[client_id]['latest_activity_at'] is None
            or latest_iso > by_client[client_id]['latest_activity_at']
        ):
            by_client[client_id]['latest_activity_at'] = latest_iso
    return Response({
        str(client_id): value
        for client_id, value in by_client.items()
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_client_mission_share_link(request):
    client_id = request.data.get('client')
    if not client_id:
        return Response(
            {'error': 'client is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    client = Client.objects.filter(id=client_id).first()
    if not client:
        return Response(
            {'error': 'Client not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    ClientHistoryShareLink.objects.filter(
        client=client,
        is_active=True,
    ).update(is_active=False)
    raw_token = secrets.token_urlsafe(32)
    share_link = ClientHistoryShareLink.objects.create(
        client=client,
        token_hash=hash_share_token(raw_token),
        created_by=request.user,
    )
    serializer = ClientHistoryShareLinkSerializer(share_link)
    return Response(
        {
            'share_url': build_public_client_share_url(request, raw_token),
            'share_path': f'/share/client/{raw_token}/',
            'link': serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_shipment_share_link(request):
    shipment_id = request.data.get('shipment')
    if not shipment_id:
        return Response(
            {'error': 'Shipment is required.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    shipment = (
        Shipment.objects.select_related('client')
        .prefetch_related('products')
        .filter(id=shipment_id)
        .first()
    )
    if not shipment:
        return Response(
            {'error': 'Shipment not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )
    if not shipment.products.exists():
        return Response(
            {'error': 'This shipment has no products to share.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    ShipmentShareLink.objects.filter(
        shipment=shipment,
        is_active=True,
    ).update(is_active=False)
    raw_token = secrets.token_urlsafe(32)
    share_link = ShipmentShareLink.objects.create(
        shipment=shipment,
        token_hash=hash_share_token(raw_token),
        created_by=request.user,
    )
    serializer = ShipmentShareLinkSerializer(share_link)
    return Response(
        {
            'share_url': build_public_shipment_share_url(request, raw_token),
            'share_path': f'/share/shipment/{raw_token}/',
            'link': serializer.data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_client_mission_share_view(request, token):
    token_hash = hash_share_token(token)
    share_link = (
        ClientHistoryShareLink.objects.select_related('client')
        .filter(token_hash=token_hash, is_active=True)
        .first()
    )
    if not share_link or share_link.is_expired:
        raise Http404('Shared link not found.')
    products = ProductItem.objects.filter(
        client=share_link.client,
    ).select_related(
        'shipment', 'mission', 'store'
    ).prefetch_related(
        'shipments'
    ).order_by('-created_at', '-id')
    shipments = Shipment.objects.filter(
        client=share_link.client,
    ).prefetch_related('products', 'evidence').order_by('-updated_at', '-id')
    share_link.last_accessed_at = timezone.now()
    share_link.save(update_fields=['last_accessed_at'])
    serializer = ClientMissionShareProductSerializer(products, many=True)
    shipment_serializer = ShipmentSerializer(shipments, many=True)
    total = sum(
        float(product.charged_price or product.real_price or 0)
        for product in products
    )
    return Response(
        {
            'share_type': 'client_history',
            'client_name': share_link.client.name,
            'products': serializer.data,
            'receipts': [],
            'shipments': shipment_serializer.data,
            'client_credit': calculate_client_credit_total(share_link.client),
            'client_balance': calculate_client_share_balance_total(share_link.client),
            'total': total,
        }
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def public_client_build_shipment_view(request, token):
    token_hash = hash_share_token(token)
    share_link = (
        ClientHistoryShareLink.objects.select_related('client', 'created_by')
        .filter(token_hash=token_hash, is_active=True)
        .first()
    )
    if not share_link or share_link.is_expired:
        raise Http404('Shared link not found.')

    raw_product_ids = request.data.get('products') or []
    if not isinstance(raw_product_ids, list):
        return Response(
            {'error': 'Products must be provided as a list.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    cleaned_ids = []
    seen_ids = set()
    for product_id in raw_product_ids:
        try:
            parsed_id = int(product_id)
        except (TypeError, ValueError):
            continue
        if parsed_id in seen_ids:
            continue
        seen_ids.add(parsed_id)
        cleaned_ids.append(parsed_id)

    if not cleaned_ids:
        return Response(
            {'error': 'Select at least one product to build a shipment.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    products = list(
        ProductItem.objects.filter(
            id__in=cleaned_ids,
            client=share_link.client,
        ).select_related('mission', 'client')
    )
    product_map = {product.id: product for product in products}
    ordered_products = [product_map[product_id] for product_id in cleaned_ids if product_id in product_map]

    if len(ordered_products) != len(cleaned_ids):
        return Response(
            {'error': 'One or more selected products were not found.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    invalid_status_products = [
        product.id
        for product in ordered_products
        if str(product.status or '').upper() != 'ANNOTATED'
    ]
    if invalid_status_products:
        return Response(
            {'error': 'Only annotated products can be added to a new shipment.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    already_assigned_products = [
        product.id
        for product in ordered_products
        if product.shipments.exists() or getattr(product, 'shipment_id', None)
    ]
    if already_assigned_products:
        return Response(
            {'error': 'One or more selected products are already assigned to a shipment.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    with transaction.atomic():
        shipment = Shipment.objects.create(
            client=share_link.client,
            mission=None,
            product=None,
            carrier='',
            tracking_number='',
            shipping_address=share_link.client.shipping_address or '',
            status=Shipment.Status.PENDING,
            created_by=share_link.created_by if share_link.created_by_id else None,
        )
        attach_products_to_shipment(shipment, ordered_products)
        shipment.refresh_from_db()

    share_link.last_accessed_at = timezone.now()
    share_link.save(update_fields=['last_accessed_at'])
    broadcast_update('shipments', action='created', object_id=shipment.id)
    broadcast_update('clients', action='updated', object_id=share_link.client_id)

    return Response(
        {
            'message': 'Shipment created successfully.',
            'shipment': ShipmentSerializer(shipment, context={'request': request}).data,
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def public_shipment_share_view(request, token):
    token_hash = hash_share_token(token)
    share_link = (
        ShipmentShareLink.objects.select_related(
            'shipment',
            'shipment__client',
        )
        .prefetch_related(
            'shipment__products',
        )
        .filter(token_hash=token_hash, is_active=True)
        .first()
    )
    if not share_link or share_link.is_expired:
        raise Http404('Shared link not found.')
    shipment = share_link.shipment
    products = shipment.products.all().order_by('created_at', 'id')
    if not products.exists():
        share_link.is_active = False
        share_link.save(update_fields=['is_active'])
        raise Http404('Shared link not found.')
    share_link.last_accessed_at = timezone.now()
    share_link.save(update_fields=['last_accessed_at'])
    products = ProductItem.objects.filter(
        client=shipment.client,
    ).select_related(
        'shipment', 'mission', 'store'
    ).prefetch_related(
        'shipments'
    ).order_by('-created_at', '-id')
    receipts = Receipt.objects.filter(
        client=shipment.client,
    ).order_by('-uploaded_at', '-id')
    shipments = Shipment.objects.filter(
        client=shipment.client,
    ).prefetch_related('products', 'evidence').order_by('-updated_at', '-id')
    serializer = ClientMissionShareProductSerializer(products, many=True)
    receipt_serializer = PublicClientReceiptSerializer(receipts, many=True)
    shipment_serializer = ShipmentSerializer(shipments, many=True)
    total = sum(
        float(product.charged_price or product.real_price or 0)
        for product in products
    )
    return Response(
        {
            'share_type': 'shipment_history',
            'client_name': shipment.client.name,
            'products': serializer.data,
            'receipts': receipt_serializer.data,
            'shipments': shipment_serializer.data,
            'focus_shipment_id': shipment.id,
            'client_credit': calculate_client_credit_total(shipment.client),
            'total': total,
        }
    )

class MissionViewSet(viewsets.ModelViewSet):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Mission.objects.select_related('store', 'payer').prefetch_related(
            'clients',
            'clients__products',
            'clients__receipts',
            'clients__payments',
            'clients__payments__products',
        ).all().order_by('-start_time')

    def perform_create(self, serializer):
        store = serializer.validated_data.get('store')
        mission_name = serializer.validated_data.get('name') or (store.name if store else None)
        payer = serializer.validated_data.get('payer') or self.request.user
        mission = serializer.save(
            shopper=self.request.user,
            payer=payer,
            name=mission_name,
        )
        touch_store_recommendation(self.request.user, store)
        # Auto-link currently active clients to this shopping
        active_clients = Client.objects.filter(status__iexact='active')
        mission.clients.set(active_clients)
        # <-------- seccion 8: notificar cambios de shoppings
        broadcast_shopping_update(action='created', object_id=mission.id)

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        previous_store_id = serializer.instance.store_id
        store = serializer.validated_data.get('store', serializer.instance.store)
        mission_name = serializer.validated_data.get('name')
        if not mission_name and store:
            mission_name = store.name
        elif mission_name is None:
            mission_name = serializer.instance.name
        mission = serializer.save(name=mission_name)
        if store and mission.store_id != previous_store_id:
            touch_store_recommendation(self.request.user, store)
        if mission.status == 'COMPLETED':
            if not mission.end_time:
                mission.end_time = timezone.now()
                mission.save(update_fields=['end_time'])
            # Ensure every active client returns to idle when shopping ends.
            Client.objects.filter(status__iexact='active').update(status='Pending')
            mission.clients.all().update(status='Pending')
            # <-------- seccion 9: limpiar productos rechazados al cerrar shopping
            if previous_status != 'COMPLETED':
                ProductItem.objects.filter(
                    mission=mission,
                    status='REJECTED',
                ).delete()
                broadcast_update('products', action='updated')
            # <-------- seccion 8: cambios masivos en clientes
            broadcast_update('clients', action='updated')
        # Whenever an active shopping is saved, sync active clients into it
        elif mission.status == 'ACTIVE':
            active_clients = Client.objects.filter(status__iexact='active')
            for c in active_clients:
                mission.clients.add(c)
        # <-------- seccion 8: notificar cambios de shoppings
        broadcast_shopping_update(action='updated', object_id=mission.id)

    def perform_destroy(self, instance):
        mission_id = instance.id
        # Evita basura cuando se elimina un shopping historico.
        ProductItem.objects.filter(mission=instance, status='REJECTED').delete()
        super().perform_destroy(instance)
        # <-------- seccion 8: notificar borrado de shoppings
        broadcast_shopping_update(action='deleted', object_id=mission_id)

    # <-------- seccion 9: subir ticket de tienda para todo el shopping
    @action(
        detail=True,
        methods=['post'],
        url_path='upload-ticket',
        parser_classes=[MultiPartParser, FormParser],
    )
    def upload_ticket(self, request, pk=None):
        mission = self.get_object()
        image_file = request.FILES.get('image') or request.FILES.get('ticket')
        if not image_file:
            return Response(
                {'error': 'No ticket image provided.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        products = ProductItem.objects.filter(mission=mission).select_related('client')
        if not products.exists():
            return Response(
                {'error': 'Shopping has no products to link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_bytes = image_file.read()
        if not image_bytes:
            return Response(
                {'error': 'Ticket image is empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Keep a shopping-level ticket preview.
        mission.ticket_image.save(image_file.name, ContentFile(image_bytes), save=False)
        mission.save(update_fields=['ticket_image'])

        client_ids = sorted(set(products.values_list('client_id', flat=True)))
        linked_products = 0
        created_receipts = 0

        for client_id in client_ids:
            client = Client.objects.filter(id=client_id).first()
            if not client:
                continue
            receipt = Receipt(
                client=client,
                uploaded_by=request.user,
                tax_percentage=mission.tax_percentage,
            )
            receipt.image.save(image_file.name, ContentFile(image_bytes), save=False)
            receipt.save()
            linked_products += ProductItem.objects.filter(
                mission=mission,
                client_id=client_id,
            ).update(receipt=receipt)
            created_receipts += 1

        broadcast_shopping_update(action='updated', object_id=mission.id)
        broadcast_update('receipts', action='updated')
        broadcast_update('products', action='updated')
        broadcast_update('clients', action='updated')

        return Response(
            {
                'message': 'Shopping ticket uploaded and linked.',
                'mission_id': mission.id,
                'shopping_id': mission.id,
                'receipts_created': created_receipts,
                'products_linked': linked_products,
            },
            status=status.HTTP_200_OK,
        )

class StoreViewSet(viewsets.ModelViewSet):
    queryset = Store.objects.all().order_by('name')
    serializer_class = StoreSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        store = serializer.save(created_by=self.request.user)
        # <-------- seccion 8: notificar cambios de tiendas
        broadcast_update('stores', action='created', object_id=store.id)

    def perform_update(self, serializer):
        store = serializer.save()
        broadcast_update('stores', action='updated', object_id=store.id)

    def perform_destroy(self, instance):
        store_id = instance.id
        super().perform_destroy(instance)
        broadcast_update('stores', action='deleted', object_id=store_id)

class RequestViewSet(viewsets.ModelViewSet):
    serializer_class = RequestSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Request.objects.select_related(
            'created_by', 'client', 'mission', 'product'
        ).all().order_by('-updated_at')
        mission_id = get_shopping_query_param(self.request)
        client_id = self.request.query_params.get('client')
        status_value = self.request.query_params.get('status')
        if mission_id:
            queryset = queryset.filter(mission_id=mission_id)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if status_value:
            queryset = queryset.filter(status=status_value)
        return queryset

    def perform_create(self, serializer):
        mission_id = get_shopping_data_value(self.request)
        mission_obj = None
        if mission_id not in [None, '', 'null']:
            mission_obj = Mission.objects.filter(id=mission_id).first()
            if mission_obj and mission_obj.status not in ['ACTIVE', 'PAUSED']:
                mission_obj = None

        request_obj = serializer.save(
            created_by=self.request.user,
            mission=mission_obj,
        )
        broadcast_update('requests', action='created', object_id=request_obj.id)

    def perform_update(self, serializer):
        request_obj = serializer.save()
        broadcast_update('requests', action='updated', object_id=request_obj.id)

    def perform_destroy(self, instance):
        request_id = instance.id
        super().perform_destroy(instance)
        broadcast_update('requests', action='deleted', object_id=request_id)

    @action(detail=False, methods=['post'], url_path='cleanup')
    def cleanup(self, request):
        limit = timezone.now() - timedelta(days=30)
        # Limpiar peticiones PENDING con más de 30 días
        deleted_count, _ = Request.objects.filter(status='PENDING', created_at__lt=limit).delete()
        if deleted_count > 0:
            broadcast_update('requests', action='deleted')
        return Response({'message': f'{deleted_count} peticiones antiguas borradas'})


# <-------- seccion 7: endpoints de revision de productos
class ProductReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = ProductReview.objects.select_related(
            'product', 'requested_by'
        ).prefetch_related(
            'alternatives',
            'messages__attachments',
            'messages__sender__userprofile',
        ).all().order_by('-updated_at')
        product_id = self.request.query_params.get('product')
        client_id = self.request.query_params.get('client')
        mission_id = get_shopping_query_param(self.request)
        status_value = self.request.query_params.get('status')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        if client_id:
            queryset = queryset.filter(product__client_id=client_id)
        if mission_id:
            queryset = queryset.filter(product__mission_id=mission_id)
        if status_value:
            queryset = queryset.filter(status=status_value)
        return queryset

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = getattr(self.request, 'user', None)
        if not user or not user.is_authenticated:
            return context
        product_ids = list(
            self.get_queryset()
            .exclude(product_id__isnull=True)
            .values_list('product_id', flat=True)
            .distinct()
        )
        if not product_ids:
            context['review_read_state_map'] = {}
            return context
        context['review_read_state_map'] = {
            state.product_id: state
            for state in ProductReviewReadState.objects.select_related(
                'last_seen_message'
            ).filter(user=user, product_id__in=product_ids)
        }
        return context

    def perform_create(self, serializer):
        review = serializer.save(requested_by=self.request.user)
        if review.product:
            review.product.status = 'IN_REVIEW'
            review.product.save(update_fields=['status'])
            broadcast_update('products', action='updated')
        # <-------- seccion 8: notificar cambios de revisiones
        broadcast_update('reviews', action='created', object_id=review.id)

    def perform_update(self, serializer):
        review = serializer.save()
        broadcast_update('reviews', action='updated', object_id=review.id)

    def perform_destroy(self, instance):
        review_id = instance.id
        super().perform_destroy(instance)
        broadcast_update('reviews', action='deleted', object_id=review_id)

    # <-------- seccion 7: PS confirma existencia
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        review = self.get_object()
        review.status = 'CONFIRMED'
        response_note = request.data.get('ps_response')
        if response_note is not None:
            review.ps_response = response_note
        review.save()
        if review.product:
            review.product.status = 'ANNOTATED'
            review.product.save(update_fields=['status'])
            broadcast_update('products', action='updated')
        broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)

    # <-------- seccion 7: PS marca sin existencia
    @action(detail=True, methods=['post'], url_path='no-stock')
    def no_stock(self, request, pk=None):
        review = self.get_object()
        review.status = 'NO_STOCK'
        response_note = request.data.get('ps_response')
        if response_note is not None:
            review.ps_response = response_note
        review.save()
        if review.product:
            review.product.status = 'REJECTED'
            review.product.save(update_fields=['status'])
            broadcast_update('products', action='updated')
        broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)

    # <-------- seccion 7: PS envia alternativas con fotos
    @action(
        detail=True,
        methods=['post'],
        url_path='send-alternative',
        parser_classes=[MultiPartParser, FormParser],
    )
    def send_alternative(self, request, pk=None):
        review = self.get_object()
        images = request.FILES.getlist('images')
        single_image = request.FILES.get('image')
        if single_image and not images:
            images = [single_image]
        if not images:
            return Response(
                {'error': 'At least one image is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        descriptions = request.data.getlist('descriptions')
        fallback_description = request.data.get('description', '')
        for idx, image_obj in enumerate(images):
            description = (
                descriptions[idx]
                if idx < len(descriptions)
                else fallback_description
            )
            ReviewAlternative.objects.create(
                review=review,
                image=image_obj,
                description=description,
            )

        review.status = 'ALTERNATIVE_SENT'
        response_note = request.data.get('ps_response')
        if response_note is not None:
            review.ps_response = response_note
        review.save()
        broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)

    @action(
        detail=True,
        methods=['post'],
        url_path='send-message',
        parser_classes=[MultiPartParser, FormParser],
    )
    def send_message(self, request, pk=None):
        review = self.get_object()
        message_text = (
            request.data.get('message')
            or request.data.get('description')
            or ''
        ).strip()
        from_status = (request.data.get('from_status') or '').strip() or None
        to_status = (request.data.get('to_status') or '').strip() or None
        files = request.FILES.getlist('files')
        if not files:
            single_file = request.FILES.get('file') or request.FILES.get('image')
            if single_file:
                files = [single_file]

        message_obj = None
        if message_text or files:
            message_obj = ProductReviewMessage.objects.create(
                review=review,
                sender=request.user,
                from_status=from_status,
                to_status=to_status,
                message=message_text or '',
            )
            for file_obj in files:
                ProductReviewMessageAttachment.objects.create(
                    message=message_obj,
                    file=file_obj,
                )
            if review.product_id:
                ProductReviewReadState.objects.update_or_create(
                    user=request.user,
                    product_id=review.product_id,
                    defaults={'last_seen_message': message_obj},
                )
        broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)

    @action(detail=True, methods=['post'], url_path='mark-seen')
    def mark_seen(self, request, pk=None):
        review = self.get_object()
        if not review.product_id:
            return Response(self.get_serializer(review).data)
        latest_message = (
            ProductReviewMessage.objects.filter(review__product_id=review.product_id)
            .order_by('-created_at', '-id')
            .first()
        )
        if latest_message:
            ProductReviewReadState.objects.update_or_create(
                user=request.user,
                product_id=review.product_id,
                defaults={'last_seen_message': latest_message},
            )
            broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)

    # <-------- seccion 7: AV selecciona alternativa y reemplaza producto
    @action(
        detail=True,
        methods=['post'],
        url_path=r'select-alternative/(?P<alt_id>[^/.]+)',
    )
    def select_alternative(self, request, pk=None, alt_id=None):
        review = self.get_object()
        alternative = review.alternatives.filter(id=alt_id).first()
        if not alternative:
            return Response(
                {'error': 'Alternative not found for this review.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not review.product:
            return Response(
                {'error': 'Review has no linked product to replace.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        with transaction.atomic():
            review.alternatives.update(is_selected=False)
            alternative.is_selected = True
            alternative.save(update_fields=['is_selected'])

            original = review.product
            replacement_name = (
                alternative.description.strip()
                if alternative.description
                else f"{original.name} (Alternative)"
            )
            replacement = ProductItem.objects.create(
                client=original.client,
                payer=original.payer,
                name=replacement_name,
                description=original.description,
                tags=original.tags,
                added_by=request.user,
                receipt=original.receipt,
                mission=original.mission,
                store=original.store,
                image=alternative.image,
                charged_price=original.charged_price,
                real_price=original.real_price,
                status='ANNOTATED',
                purchase_date=original.purchase_date,
            )
            review.product = replacement
            review.status = 'REPLACED'
            response_note = request.data.get('ps_response')
            if response_note is not None:
                review.ps_response = response_note
            review.save()
            original.delete()

        broadcast_update('products', action='updated')
        broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)

    # <-------- seccion 7: AV descarta el producto revisado
    @action(detail=True, methods=['post'], url_path='discard')
    def discard(self, request, pk=None):
        review = self.get_object()
        target_product = review.product
        review.status = 'DISCARDED'
        response_note = request.data.get('ps_response')
        if response_note is not None:
            review.ps_response = response_note
        review.save()
        if target_product:
            target_product.status = 'REJECTED'
            target_product.save(update_fields=['status'])
            broadcast_update('products', action='updated')
        broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)

    # <-------- seccion 7: AV conserva producto original
    @action(detail=True, methods=['post'], url_path='keep-original')
    def keep_original(self, request, pk=None):
        review = self.get_object()
        review.status = 'CONFIRMED'
        response_note = request.data.get('ps_response')
        if response_note is not None:
            review.ps_response = response_note
        review.save()
        if review.product:
            review.product.status = 'ANNOTATED'
            review.product.save(update_fields=['status'])
            broadcast_update('products', action='updated')
        broadcast_update('reviews', action='updated', object_id=review.id)
        return Response(self.get_serializer(review).data)


# <-------- seccion 7: CRUD de alternativas (soporte)
class ReviewAlternativeViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewAlternativeSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = ReviewAlternative.objects.select_related(
            'review'
        ).all().order_by('-created_at')
        review_id = self.request.query_params.get('review')
        if review_id:
            queryset = queryset.filter(review_id=review_id)
        return queryset

    def perform_create(self, serializer):
        alternative = serializer.save()
        broadcast_update('reviews', action='updated', object_id=alternative.review_id)

    def perform_update(self, serializer):
        alternative = serializer.save()
        broadcast_update('reviews', action='updated', object_id=alternative.review_id)

    def perform_destroy(self, instance):
        review_id = instance.review_id
        super().perform_destroy(instance)
        broadcast_update('reviews', action='updated', object_id=review_id)

class ClientViewSet(viewsets.ModelViewSet):
    """
    Agente de Ventas (AV) crea los clientes aquí.
    Si eres AV: solo ves a los clientes que TÚ agregaste. (Requerimiento)
    """
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        base_queryset = Client.objects.prefetch_related(
            'products',
            'receipts',
            'payments',
            'payments__products',
        ).order_by('created_at', 'id')
        # Si la persona autenticada tiene perfil de AV, solo ve a sus clientes
        if hasattr(user, 'userprofile'):
            if user.userprofile.role == 'AV':
                return base_queryset.filter(added_by=user)
            elif user.userprofile.role in ['PS', 'BOTH']:
                # Si es PS (Shopper) o Ambos, ve todos para poder comprar
                return base_queryset.all()
        # Fallback en caso de que no tenga profile
        return base_queryset.all()

    def perform_create(self, serializer):
        # Asigna el Agente automáticamente
        client = serializer.save(added_by=self.request.user)
        # <-------- seccion 8: notificar cambios de clientes
        broadcast_update('clients', action='created', object_id=client.id)

    def perform_update(self, serializer):
        client = serializer.save()
        status_value = (client.status or '').strip().lower()
        if status_value == 'active' and client.status != 'Active':
            client.status = 'Active'
            client.save(update_fields=['status'])
        # Keep active shopping membership in sync with client toggles.
        if status_value == 'active':
            active_mission = Mission.objects.filter(
                status__in=['ACTIVE', 'PAUSED']
            ).order_by('-start_time').first()
            if active_mission:
                active_mission.clients.add(client)
        broadcast_update('clients', action='updated', object_id=client.id)

    def perform_destroy(self, instance):
        client_id = instance.id
        super().perform_destroy(instance)
        broadcast_update('clients', action='deleted', object_id=client_id)

class ProductItemViewSet(viewsets.ModelViewSet):
    """
    Agente de Ventas (AV) anade los productos a la lista del cliente (status=ANNOTATED).
    Personal Shopper (PS) puede actualizar status=IN_REVIEW, precios y asignar un receipt.
    """
    queryset = ProductItem.objects.all()
    serializer_class = ProductItemSerializer
    filterset_fields = ['client', 'status', 'receipt']

    def get_queryset(self):
        queryset = super().get_queryset()
        client_id = self.request.query_params.get('client_id')
        receipt_id = self.request.query_params.get('receipt_id')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if receipt_id:
            queryset = queryset.filter(receipt=receipt_id)
        return queryset

    def perform_create(self, serializer):
        mission = serializer.validated_data.get('mission')
        if mission is None:
            mission = Mission.objects.filter(
                status__in=['ACTIVE', 'PAUSED']
            ).order_by('-start_time').first()
        payer = serializer.validated_data.get('payer')
        store = serializer.validated_data.get('store')
        if mission is not None and mission.store_id:
            store = mission.store
        save_kwargs = {}
        if mission is not None:
            save_kwargs['mission'] = mission
        if payer is None and mission is not None and mission.payer_id:
            save_kwargs['payer'] = mission.payer
        if mission is not None or store is not None:
            save_kwargs['store'] = store
        product = serializer.save(**save_kwargs)
        if product.mission_id and product.client_id:
            product.mission.clients.add(product.client)
        # <-------- seccion 8: notificar cambios de productos
        broadcast_update('products', action='created', object_id=product.id)

    def perform_update(self, serializer):
        previous_client_id = serializer.instance.client_id
        previous_mission_id = serializer.instance.mission_id
        mission = serializer.validated_data.get('mission', serializer.instance.mission)
        store = serializer.validated_data.get('store', serializer.instance.store)
        if mission is not None and mission.store_id:
            store = mission.store
        product = serializer.save(mission=mission, store=store)
        if product.mission_id and product.client_id:
            product.mission.clients.add(product.client)
        deactivate_empty_client_share_links(previous_client_id, previous_mission_id)
        deactivate_empty_client_share_links(product.client_id, product.mission_id)
        broadcast_update('products', action='updated', object_id=product.id)

    def perform_destroy(self, instance):
        client_id = instance.client_id
        mission_id = instance.mission_id
        product_id = instance.id
        super().perform_destroy(instance)
        deactivate_empty_client_share_links(client_id, mission_id)
        broadcast_update('products', action='deleted', object_id=product_id)

class ReceiptViewSet(viewsets.ModelViewSet):
    """
    Contenedor de todos los tickets subidos.
    """
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def perform_create(self, serializer):
        receipt = serializer.save()
        # <-------- seccion 8: notificar cambios de tickets
        broadcast_update('receipts', action='created', object_id=receipt.id)

    def perform_update(self, serializer):
        receipt = serializer.save()
        broadcast_update('receipts', action='updated', object_id=receipt.id)

    def perform_destroy(self, instance):
        receipt_id = instance.id
        super().perform_destroy(instance)
        broadcast_update('receipts', action='deleted', object_id=receipt_id)

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def scan_receipt(request):
    """
    Simula escaneo de ticket por parte del Personal Shopper (PS).
    Extraerá algunos metadatos y creará un registro de tipo Receipt.
    """
    file_obj = request.data.get('receipt')
    
    # En desarrollo a veces podemos mandar strings si sólo queremos probar
    if not file_obj:
        return Response({"error": "No receipt image provided."}, status=status.HTTP_400_BAD_REQUEST)
    
    # Simulación de OCR - metadatos estandar
    real_price = round(random.uniform(10.0, 150.0), 2)
    markup = random.uniform(1.1, 1.2)
    charged_price = round(real_price * markup, 2)
    
    receipt = Receipt.objects.create(
        image=file_obj,
        total_real_price=real_price,
        total_charged_price=charged_price,
    )
    
    return Response({
        "message": "Ticket escaneado correctamente, ahora puedes vincular los items al ticket",
        "receipt_id": receipt.id,
        "scanned_data": {
            "total_real_price": real_price,
            "total_charged_price": charged_price,
            "tax_percentage": 8.00,
            "date": date.today().isoformat()
        }
    })


class ShoppingPaymentViewSet(viewsets.ModelViewSet):
    serializer_class = ShoppingPaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = ShoppingPayment.objects.select_related(
            'client', 'mission', 'created_by'
        ).prefetch_related('products', 'entries', 'entries__created_by').all().order_by('-created_at', '-id')
        client_id = self.request.query_params.get('client')
        shopping_id = get_shopping_query_param(self.request)
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if shopping_id:
            queryset = queryset.filter(mission_id=shopping_id)
        return queryset

    def perform_create(self, serializer):
        payment = serializer.save(created_by=self.request.user)
        entry_kind = str(self.request.data.get('entry_kind') or 'SHOPPING').strip().upper()
        if entry_kind not in {'SHOPPING', 'CLIENT_BATCH'}:
            entry_kind = 'SHOPPING'
        group_token = self.request.data.get('entry_group_token')
        create_payment_entry(
            payment,
            payment.amount,
            payment.amount,
            self.request.user,
            entry_kind=entry_kind,
            group_token=group_token,
        )
        broadcast_update('payments', action='created', object_id=payment.id)
        broadcast_update('clients', action='updated', object_id=payment.client_id)

    def perform_update(self, serializer):
        previous_amount = Decimal(serializer.instance.amount or 0)
        payment = serializer.save()
        entry_kind = str(self.request.data.get('entry_kind') or 'SHOPPING').strip().upper()
        if entry_kind not in {'SHOPPING', 'CLIENT_BATCH'}:
            entry_kind = 'SHOPPING'
        group_token = self.request.data.get('entry_group_token')
        create_payment_entry(
            payment,
            Decimal(payment.amount or 0) - previous_amount,
            payment.amount,
            self.request.user,
            entry_kind=entry_kind,
            group_token=group_token,
        )
        broadcast_update('payments', action='updated', object_id=payment.id)
        broadcast_update('clients', action='updated', object_id=payment.client_id)

    def perform_destroy(self, instance):
        payment_id = instance.id
        client_id = instance.client_id
        super().perform_destroy(instance)
        broadcast_update('payments', action='deleted', object_id=payment_id)
        broadcast_update('clients', action='updated', object_id=client_id)

    @action(
        detail=True,
        methods=['patch', 'delete'],
        url_path=r'entries/(?P<entry_id>[^/.]+)',
    )
    def manage_entry(self, request, pk=None, entry_id=None):
        payment = self.get_object()
        entry = payment.entries.filter(id=entry_id).first()
        if not entry:
            return Response(
                {'error': 'Payment entry not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if request.method.lower() == 'patch':
            raw_amount = request.data.get('amount')
            try:
                amount = Decimal(str(raw_amount))
            except Exception:
                return Response(
                    {'error': 'A valid amount is required.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            entry.amount = amount
            entry.save(update_fields=['amount'])
        else:
            entry.delete()
        payment = recalculate_payment_entry_totals(payment)
        payment.refresh_from_db()
        broadcast_update('payments', action='updated', object_id=payment.id)
        broadcast_update('clients', action='updated', object_id=payment.client_id)
        return Response(self.get_serializer(payment).data)


class ShipmentViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = Shipment.objects.select_related(
            'client', 'product', 'mission', 'created_by'
        ).prefetch_related('products', 'evidence', 'evidence__uploaded_by').all().order_by('-updated_at', '-id')
        client_id = self.request.query_params.get('client')
        mission_id = get_shopping_query_param(self.request)
        product_id = self.request.query_params.get('product')
        if client_id:
            queryset = queryset.filter(client_id=client_id)
        if mission_id:
            queryset = queryset.filter(mission_id=mission_id)
        if product_id:
            queryset = queryset.filter(products__id=product_id)
        return queryset

    def perform_create(self, serializer):
        client = serializer.validated_data.get('client')
        if not client:
            raise serializers.ValidationError({'detail': 'Client is required.'})
        shipment = serializer.save(created_by=self.request.user, product=None)
        client_updated = sync_shipment_shipping_address(
            shipment,
            serializer.validated_data,
        )
        touch_shipping_carrier_recommendation(
            self.request.user,
            shipment.carrier,
        )
        broadcast_update('shipments', action='created', object_id=shipment.id)
        if client_updated:
            broadcast_update('clients', action='updated', object_id=client.id)

    def perform_update(self, serializer):
        client = serializer.validated_data.get('client', serializer.instance.client)
        if not client:
            raise serializers.ValidationError({'detail': 'Client is required.'})
        shipment = serializer.save(product=serializer.instance.product)
        client_updated = sync_shipment_shipping_address(
            shipment,
            serializer.validated_data,
        )
        touch_shipping_carrier_recommendation(
            self.request.user,
            shipment.carrier,
        )
        broadcast_update('shipments', action='updated', object_id=shipment.id)
        if client_updated:
            broadcast_update('clients', action='updated', object_id=client.id)

    def perform_destroy(self, instance):
        shipment_id = instance.id
        shipment_products = list(instance.products.all())
        product_ids = [product.id for product in shipment_products]
        evidence_files = list(
            instance.evidence.exclude(file='').values_list('file', flat=True)
        )
        ShipmentShareLink.objects.filter(shipment=instance).update(is_active=False)
        super().perform_destroy(instance)
        for evidence_file in evidence_files:
            try:
                default_storage = ShipmentEvidence._meta.get_field('file').storage
                default_storage.delete(evidence_file)
            except Exception:
                pass
        for product in shipment_products:
            sync_detached_product_status(product)
        for product_id in product_ids:
            broadcast_update('products', action='updated', object_id=product_id)
        broadcast_update('shipments', action='deleted', object_id=shipment_id)

    @action(detail=True, methods=['post'], url_path='assign-product')
    def assign_product(self, request, pk=None):
        shipment = self.get_object()
        product_id = request.data.get('product')
        product = ProductItem.objects.filter(id=product_id).first()
        if not product:
            return Response({'error': 'Product not found.'}, status=status.HTTP_404_NOT_FOUND)
        if product.client_id != shipment.client_id:
            return Response({'error': 'Product belongs to a different client.'}, status=status.HTTP_400_BAD_REQUEST)
        current_products = list(shipment.products.all())
        if product.id not in [item.id for item in current_products]:
            current_products.append(product)
        attach_products_to_shipment(shipment, current_products)
        broadcast_update('shipments', action='updated', object_id=shipment.id)
        return Response(self.get_serializer(shipment).data)

    @action(detail=True, methods=['post'], url_path='set-products')
    def set_products(self, request, pk=None):
        shipment = self.get_object()
        product_ids = request.data.get('products') or []
        if not isinstance(product_ids, list):
            return Response(
                {'error': 'Products must be provided as a list.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cleaned_ids = []
        for product_id in product_ids:
            try:
                cleaned_ids.append(int(product_id))
            except (TypeError, ValueError):
                continue
        products = list(
            ProductItem.objects.filter(id__in=cleaned_ids).select_related('mission', 'client')
        )
        product_map = {product.id: product for product in products}
        products = [product_map[product_id] for product_id in cleaned_ids if product_id in product_map]
        found_ids = set(product_map.keys())
        missing_ids = [product_id for product_id in cleaned_ids if product_id not in found_ids]
        if missing_ids:
            return Response(
                {'error': 'One or more products were not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if any(product.client_id != shipment.client_id for product in products):
            return Response(
                {'error': 'All products must belong to the same client as the shipment.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        attach_products_to_shipment(shipment, products)
        broadcast_update('shipments', action='updated', object_id=shipment.id)
        return Response(self.get_serializer(shipment).data)

    @action(detail=True, methods=['post'], url_path='upload-evidence')
    def upload_evidence(self, request, pk=None):
        shipment = self.get_object()
        uploaded_files = request.FILES.getlist('files')
        if not uploaded_files:
            single_file = request.FILES.get('file')
            if single_file:
                uploaded_files = [single_file]
        if not uploaded_files:
            return Response(
                {'error': 'At least one file is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_items = []
        for uploaded_file in uploaded_files:
            content_type = str(getattr(uploaded_file, 'content_type', '') or '').lower()
            if content_type.startswith('image/'):
                media_type = ShipmentEvidence.MediaType.IMAGE
            elif content_type.startswith('video/'):
                media_type = ShipmentEvidence.MediaType.VIDEO
            else:
                return Response(
                    {'error': 'Only image or video files are allowed.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            created_items.append(
                ShipmentEvidence.objects.create(
                    shipment=shipment,
                    uploaded_by=request.user,
                    file=uploaded_file,
                    media_type=media_type,
                )
            )
        shipment = Shipment.objects.prefetch_related('products', 'evidence', 'evidence__uploaded_by').get(id=shipment.id)
        broadcast_update('shipments', action='updated', object_id=shipment.id)
        return Response(
            {
                'shipment': self.get_serializer(shipment).data,
                'evidence': ShipmentEvidenceSerializer(
                    created_items,
                    many=True,
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path=r'evidence/(?P<evidence_id>[^/.]+)/replace')
    def replace_evidence(self, request, pk=None, evidence_id=None):
        shipment = self.get_object()
        evidence = shipment.evidence.filter(id=evidence_id).first()
        if not evidence:
            return Response(
                {'error': 'Evidence not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        uploaded_file = request.FILES.get('file')
        if uploaded_file is None:
            uploaded_files = request.FILES.getlist('files')
            uploaded_file = uploaded_files[0] if uploaded_files else None
        if uploaded_file is None:
            return Response(
                {'error': 'A file is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        content_type = str(getattr(uploaded_file, 'content_type', '') or '').lower()
        if content_type.startswith('image/'):
            media_type = ShipmentEvidence.MediaType.IMAGE
        elif content_type.startswith('video/'):
            media_type = ShipmentEvidence.MediaType.VIDEO
        else:
            return Response(
                {'error': 'Only image or video files are allowed.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        previous_file = evidence.file.name
        evidence.file = uploaded_file
        evidence.media_type = media_type
        evidence.uploaded_by = request.user
        evidence.save(update_fields=['file', 'media_type', 'uploaded_by'])
        if previous_file and previous_file != evidence.file.name:
            try:
                ShipmentEvidence._meta.get_field('file').storage.delete(previous_file)
            except Exception:
                pass
        shipment = Shipment.objects.prefetch_related('products', 'evidence', 'evidence__uploaded_by').get(id=shipment.id)
        broadcast_update('shipments', action='updated', object_id=shipment.id)
        return Response(
            {
                'shipment': self.get_serializer(shipment).data,
                'evidence': ShipmentEvidenceSerializer(
                    evidence,
                    context={'request': request},
                ).data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['delete'], url_path=r'evidence/(?P<evidence_id>[^/.]+)')
    def delete_evidence(self, request, pk=None, evidence_id=None):
        shipment = self.get_object()
        evidence = shipment.evidence.filter(id=evidence_id).first()
        if not evidence:
            return Response(
                {'error': 'Evidence not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        evidence_file = evidence.file.name
        evidence.delete()
        if evidence_file:
            try:
                ShipmentEvidence._meta.get_field('file').storage.delete(evidence_file)
            except Exception:
                pass
        shipment = Shipment.objects.prefetch_related('products', 'evidence', 'evidence__uploaded_by').get(id=shipment.id)
        broadcast_update('shipments', action='updated', object_id=shipment.id)
        return Response(self.get_serializer(shipment).data)
