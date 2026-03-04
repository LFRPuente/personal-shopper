from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, parser_classes, permission_classes
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from django.core.files.base import ContentFile
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from .models import (
    Client,
    ProductItem,
    Receipt,
    Mission,
    UserProfile,
    Store,
    Request,
    ProductReview,
    ReviewAlternative,
)
from .serializers import (
    ClientSerializer,
    ProductItemSerializer,
    ReceiptSerializer,
    MissionSerializer,
    UserSerializer,
    StoreSerializer,
    RequestSerializer,
    ProductReviewSerializer,
    ReviewAlternativeSerializer,
)
import random
from datetime import date


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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    """
    Devuelve los datos del usuario actual.
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

class MissionViewSet(viewsets.ModelViewSet):
    serializer_class = MissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Mission.objects.prefetch_related('clients', 'clients__products', 'clients__receipts').all().order_by('-start_time')

    def perform_create(self, serializer):
        mission = serializer.save(shopper=self.request.user)
        # Auto-link currently active clients to this mission
        active_clients = Client.objects.filter(status__iexact='active')
        mission.clients.set(active_clients)
        # <-------- seccion 8: notificar cambios de misiones
        broadcast_update('missions', action='created', object_id=mission.id)

    def perform_update(self, serializer):
        previous_status = serializer.instance.status
        mission = serializer.save()
        if mission.status == 'COMPLETED':
            if not mission.end_time:
                mission.end_time = timezone.now()
                mission.save(update_fields=['end_time'])
            # Ensure every active client returns to idle when mission ends.
            Client.objects.filter(status__iexact='active').update(status='Pending')
            mission.clients.all().update(status='Pending')
            # <-------- seccion 9: limpiar productos rechazados al cerrar mision
            if previous_status != 'COMPLETED':
                ProductItem.objects.filter(
                    mission=mission,
                    status='REJECTED',
                ).delete()
                broadcast_update('products', action='updated')
            # <-------- seccion 8: cambios masivos en clientes
            broadcast_update('clients', action='updated')
        # Whenever active mission is saved, sync active clients into it
        elif mission.status == 'ACTIVE':
            active_clients = Client.objects.filter(status__iexact='active')
            for c in active_clients:
                mission.clients.add(c)
        # <-------- seccion 8: notificar cambios de misiones
        broadcast_update('missions', action='updated', object_id=mission.id)

    def perform_destroy(self, instance):
        mission_id = instance.id
        # Evita basura cuando se elimina una mision historica.
        ProductItem.objects.filter(mission=instance, status='REJECTED').delete()
        super().perform_destroy(instance)
        # <-------- seccion 8: notificar borrado de misiones
        broadcast_update('missions', action='deleted', object_id=mission_id)

    # <-------- seccion 9: subir ticket de tienda para toda la mision
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
                {'error': 'Mission has no products to link.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        image_bytes = image_file.read()
        if not image_bytes:
            return Response(
                {'error': 'Ticket image is empty.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Keep a mission-level ticket preview.
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

        broadcast_update('missions', action='updated', object_id=mission.id)
        broadcast_update('receipts', action='updated')
        broadcast_update('products', action='updated')
        broadcast_update('clients', action='updated')

        return Response(
            {
                'message': 'Mission ticket uploaded and linked.',
                'mission_id': mission.id,
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

    def get_queryset(self):
        queryset = Request.objects.select_related(
            'created_by', 'mission', 'product'
        ).all().order_by('-updated_at')
        # <-------- seccion 8: para detalle/update/destroy no acotar solo a mision activa
        if self.action in ['retrieve', 'update', 'partial_update', 'destroy']:
            return queryset
        mission_id = self.request.query_params.get('mission')
        if mission_id:
            # <-------- seccion 9: incluir pendientes fuera de mision
            return queryset.filter(Q(mission_id=mission_id) | Q(mission__isnull=True))
        active_mission = Mission.objects.filter(
            status__in=['ACTIVE', 'PAUSED']
        ).order_by('-start_time').first()
        if active_mission:
            return queryset.filter(Q(mission=active_mission) | Q(mission__isnull=True))
        return queryset.filter(mission__isnull=True)

    def perform_create(self, serializer):
        mission_id = self.request.data.get('mission')
        mission_obj = None
        if mission_id not in [None, '', 'null']:
            mission_obj = Mission.objects.filter(id=mission_id).first()
            # Evita ligar nuevas peticiones a misiones cerradas.
            if mission_obj and mission_obj.status not in ['ACTIVE', 'PAUSED']:
                mission_obj = None

        if mission_obj is None:
            mission_obj = Mission.objects.filter(
                status__in=['ACTIVE', 'PAUSED']
            ).order_by('-start_time').first()

        request_obj = serializer.save(
            created_by=self.request.user,
            mission=mission_obj if mission_obj else None,
        )
        broadcast_update('requests', action='created', object_id=request_obj.id)

    def perform_update(self, serializer):
        request_obj = serializer.save()
        broadcast_update('requests', action='updated', object_id=request_obj.id)

    def perform_destroy(self, instance):
        request_id = instance.id
        super().perform_destroy(instance)
        broadcast_update('requests', action='deleted', object_id=request_id)


# <-------- seccion 7: endpoints de revision de productos
class ProductReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ProductReviewSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        queryset = ProductReview.objects.select_related(
            'product', 'requested_by'
        ).prefetch_related('alternatives').all().order_by('-updated_at')
        product_id = self.request.query_params.get('product')
        client_id = self.request.query_params.get('client')
        mission_id = self.request.query_params.get('mission')
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
        # Si la persona autenticada tiene perfil de AV, solo ve a sus clientes
        if hasattr(user, 'userprofile'):
            if user.userprofile.role == 'AV':
                return Client.objects.filter(added_by=user)
            elif user.userprofile.role in ['PS', 'BOTH']:
                # Si es PS (Shopper) o Ambos, ve todos para poder comprar
                return Client.objects.all()
        # Fallback en caso de que no tenga profile
        return Client.objects.all()

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
        # Keep active mission membership in sync with client toggles.
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
        if mission is not None:
            product = serializer.save(mission=mission)
        else:
            product = serializer.save()
        if product.mission_id and product.client_id:
            product.mission.clients.add(product.client)
        # <-------- seccion 8: notificar cambios de productos
        broadcast_update('products', action='created', object_id=product.id)

    def perform_update(self, serializer):
        product = serializer.save()
        if product.mission_id and product.client_id:
            product.mission.clients.add(product.client)
        broadcast_update('products', action='updated', object_id=product.id)

    def perform_destroy(self, instance):
        product_id = instance.id
        super().perform_destroy(instance)
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
