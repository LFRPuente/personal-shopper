from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class Role(models.TextChoices):
    AV = 'AV', 'Agente de Ventas'
    PS = 'PS', 'Personal Shopper'
    BOTH = 'BOTH', 'Ambos (AV y PS)'


class LayoutMode(models.TextChoices):
    MOBILE = 'MOBILE', 'Mobile'
    WEB = 'WEB', 'Web'


class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=4, choices=Role.choices, default=Role.AV)
    layout_mode = models.CharField(
        max_length=6,
        choices=LayoutMode.choices,
        default=LayoutMode.MOBILE,
    )
    last_active = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"

class Client(models.Model):
    name = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default='Pending')
    tags = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    shipping_address = models.TextField(blank=True, null=True)
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='clients_added', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Receipt(models.Model):
    client = models.ForeignKey('Client', on_delete=models.CASCADE, related_name='receipts', null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='uploaded_receipts', blank=True)
    image = models.ImageField(upload_to='receipts/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    # Metadatos extraídos del ticket completo
    total_real_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    total_charged_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=8.00)
    shipping_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"Ticket {self.id}"

class Store(models.Model):
    name = models.CharField(max_length=255)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='stores_created')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class StoreRecommendation(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='store_recommendations',
    )
    store = models.ForeignKey(
        Store,
        on_delete=models.CASCADE,
        related_name='recommendations',
    )
    times_used = models.PositiveIntegerField(default=1)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'store'],
                name='unique_store_recommendation_per_user',
            ),
        ]
        ordering = ['-last_used_at', '-times_used', 'store__name']

    def __str__(self):
        return f"{self.user.username} -> {self.store.name}"


class ShippingCarrierRecommendation(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='shipping_carrier_recommendations',
    )
    name = models.CharField(max_length=120)
    normalized_name = models.CharField(max_length=120)
    times_used = models.PositiveIntegerField(default=1)
    last_used_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'normalized_name'],
                name='unique_shipping_carrier_recommendation_per_user',
            ),
        ]
        ordering = ['-last_used_at', '-times_used', 'name']

    def __str__(self):
        return f"{self.user.username} -> {self.name}"

class ProductItem(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    tags = models.TextField(blank=True, null=True)  # e.g. "Talla:M, Hombre, Nike"
    
    # AV (Agente de Ventas) añade el producto 
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='products_added', blank=True)
    
    # PS (Personal Shopper) sube el ticket y lo vincula
    receipt = models.ForeignKey(Receipt, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    
    # Shopping en el que se agrego/compro el producto
    mission = models.ForeignKey('Mission', on_delete=models.SET_NULL, null=True, blank=True, related_name='products')

    # Tienda donde se encontro/compro el producto
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, blank=True, related_name='products')
    
    # Imagen subida por el Shopper o el AV
    image = models.ImageField(upload_to='products/', null=True, blank=True)
    
    # Precios que se llenan una vez comprado
    charged_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # Precio Shopper
    real_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True) # Precio Tienda
    
    status = models.CharField(max_length=50, choices=[
        ('ANNOTATED', 'Anotado'),
        ('IN_REVIEW', 'En Revision'),
        ('BOUGHT', 'Comprado'),
        ('SHIPPED', 'Enviado'),
        ('REJECTED', 'Rechazado'),
    ], default='ANNOTATED')
    created_at = models.DateTimeField(auto_now_add=True)
    purchase_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.client.name}"

class Mission(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    shopper = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='missions')
    store = models.ForeignKey(Store, on_delete=models.SET_NULL, null=True, blank=True, related_name='missions')
    status = models.CharField(max_length=50, choices=[('ACTIVE', 'Shopping Activo'), ('PAUSED', 'Shopping Pausado'), ('COMPLETED', 'Shopping Finalizado')], default='ACTIVE')
    # <-------- seccion 9: configuracion comercial por shopping
    calc_mode = models.CharField(
        max_length=20,
        choices=[('FACTOR', 'Factor'), ('PERCENTAGE', 'Porcentaje')],
        default='FACTOR',
    )
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=8.00)
    factor_value = models.DecimalField(max_digits=8, decimal_places=4, default=1.5000)
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    exchange_rate = models.DecimalField(max_digits=10, decimal_places=4, default=17.5000)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    ticket_image = models.ImageField(upload_to='mission_tickets/', null=True, blank=True)
    clients = models.ManyToManyField(Client, related_name='missions_history', blank=True)
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'shopping'
        verbose_name_plural = 'shoppings'

    def __str__(self):
        return f"Shopping {self.id} by {self.shopper.username if self.shopper else 'Unknown'}"

class Request(models.Model):
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pendiente'),
            ('ACKNOWLEDGED', 'Enterado'),
            ('NO_STOCK', 'No Existencia'),
            ('DISCARDED', 'Descartado'),
            ('MODIFIED', 'Modificado'),
        ],
        default='PENDING',
    )
    description = models.TextField()
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests_created')
    client = models.ForeignKey('Client', on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    mission = models.ForeignKey(Mission, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    product = models.ForeignKey(ProductItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    image = models.ImageField(upload_to='requests/', null=True, blank=True)
    note = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Request {self.id} - {self.status}"


# <-------- seccion 7: modelo de revision de productos (AV <-> PS)
class ProductReview(models.Model):
    review_type = models.CharField(
        max_length=20,
        choices=[
            ('CHECK_SIZE', 'Verificar talla/tamaño'),
            ('CHECK_STOCK', 'Verificar existencia'),
            ('CHECK_OTHER', 'Otro'),
        ],
        default='CHECK_OTHER',
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('PENDING', 'Pendiente'),
            ('CONFIRMED', 'Confirmado'),
            ('NO_STOCK', 'No existencia'),
            ('ALTERNATIVE_SENT', 'Alternativa enviada'),
            ('REPLACED', 'Reemplazado'),
            ('DISCARDED', 'Descartado'),
        ],
        default='PENDING',
    )
    product = models.ForeignKey(
        ProductItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviews',
    )
    requested_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='product_reviews_requested',
    )
    review_note = models.TextField()
    ps_response = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Review {self.id} - {self.status}"


# <-------- seccion 7: alternativas con imagen para una revision
class ReviewAlternative(models.Model):
    review = models.ForeignKey(
        ProductReview,
        on_delete=models.CASCADE,
        related_name='alternatives',
    )
    image = models.ImageField(upload_to='alternatives/')
    description = models.CharField(max_length=255, blank=True, null=True)
    is_selected = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Alternative {self.id} for review {self.review_id}"


class ProductReviewMessage(models.Model):
    review = models.ForeignKey(
        ProductReview,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='product_review_messages',
    )
    from_status = models.CharField(max_length=32, blank=True, null=True)
    to_status = models.CharField(max_length=32, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return f"Review message {self.id} for review {self.review_id}"


class ProductReviewMessageAttachment(models.Model):
    message = models.ForeignKey(
        ProductReviewMessage,
        on_delete=models.CASCADE,
        related_name='attachments',
    )
    file = models.ImageField(upload_to='review_messages/')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at', 'id']

    def __str__(self):
        return f"Review attachment {self.id} for message {self.message_id}"


class ProductReviewReadState(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='product_review_read_states',
    )
    product = models.ForeignKey(
        ProductItem,
        on_delete=models.CASCADE,
        related_name='review_read_states',
    )
    last_seen_message = models.ForeignKey(
        ProductReviewMessage,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='read_states',
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'product'],
                name='unique_review_read_state_per_user_product',
            ),
        ]
        ordering = ['-updated_at', '-id']

    def __str__(self):
        return f"Review read state {self.user_id}:{self.product_id}"


class ShoppingPayment(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='payments',
    )
    mission = models.ForeignKey(
        Mission,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments',
    )
    products = models.ManyToManyField(
        ProductItem,
        related_name='payments',
        blank=True,
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    note = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shopping_payments_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"Payment {self.id} - client {self.client_id}"


class ShoppingPaymentEntry(models.Model):
    payment = models.ForeignKey(
        ShoppingPayment,
        on_delete=models.CASCADE,
        related_name='entries',
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_after = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shopping_payment_entries_created',
    )
    created_at = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f"Payment entry {self.id} - payment {self.payment_id}"


class ClientHistoryShareLink(models.Model):
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='history_share_links',
    )
    token_hash = models.CharField(max_length=64, unique=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='client_history_share_links_created',
    )
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        constraints = [
            models.UniqueConstraint(
                fields=['client', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_share_link_per_client',
            ),
        ]

    @property
    def is_expired(self):
        return bool(self.expires_at and self.expires_at <= timezone.now())

    def __str__(self):
        return f"Client history share {self.client_id}"


class Shipment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pendiente'
        PREPARING = 'PREPARING', 'Preparando'
        SHIPPED = 'SHIPPED', 'Enviado'
        DELIVERED = 'DELIVERED', 'Entregado'
        CANCELLED = 'CANCELLED', 'Cancelado'

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='shipments',
    )
    mission = models.ForeignKey(
        Mission,
        on_delete=models.CASCADE,
        related_name='shipments',
        null=True,
        blank=True,
    )
    product = models.OneToOneField(
        ProductItem,
        on_delete=models.CASCADE,
        related_name='shipment',
        null=True,
        blank=True,
    )
    products = models.ManyToManyField(
        ProductItem,
        related_name='shipments',
        blank=True,
    )
    carrier = models.CharField(max_length=120, blank=True, null=True)
    tracking_number = models.CharField(max_length=120, blank=True, null=True)
    guide_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    client_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    shipping_address = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipments_created',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at', '-id']
        constraints = [
            models.UniqueConstraint(
                fields=['client', 'mission', 'tracking_number'],
                condition=models.Q(tracking_number__isnull=False),
                name='unique_tracking_per_client_mission_when_present',
            ),
        ]

    def __str__(self):
        return f"Shipment {self.id} - client {self.client_id}"


class ShipmentShareLink(models.Model):
    shipment = models.ForeignKey(
        Shipment,
        on_delete=models.CASCADE,
        related_name='share_links',
    )
    token_hash = models.CharField(max_length=64, unique=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='shipment_share_links_created',
    )
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_accessed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at', '-id']
        constraints = [
            models.UniqueConstraint(
                fields=['shipment', 'is_active'],
                condition=models.Q(is_active=True),
                name='unique_active_share_link_per_shipment',
            ),
        ]

    @property
    def is_expired(self):
        return bool(self.expires_at and self.expires_at <= timezone.now())

    def __str__(self):
        return f"Shipment share {self.shipment_id}"
