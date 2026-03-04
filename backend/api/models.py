from django.db import models
from django.contrib.auth.models import User

class Role(models.TextChoices):
    AV = 'AV', 'Agente de Ventas'
    PS = 'PS', 'Personal Shopper'
    BOTH = 'BOTH', 'Ambos (AV y PS)'

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    role = models.CharField(max_length=4, choices=Role.choices, default=Role.AV)
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

class ProductItem(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    tags = models.TextField(blank=True, null=True)  # e.g. "Talla:M, Hombre, Nike"
    
    # AV (Agente de Ventas) añade el producto 
    added_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='products_added', blank=True)
    
    # PS (Personal Shopper) sube el ticket y lo vincula
    receipt = models.ForeignKey(Receipt, on_delete=models.SET_NULL, null=True, blank=True, related_name='items')
    
    # Misión en la que se agregó/compró el producto
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
    status = models.CharField(max_length=50, choices=[('ACTIVE', 'Misión Activa'), ('PAUSED', 'Misión Pausada'), ('COMPLETED', 'Misión Finalizada')], default='ACTIVE')
    # <-------- seccion 9: configuracion comercial por mision
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

    def __str__(self):
        return f"Mission {self.id} by {self.shopper.username if self.shopper else 'Unknown'}"

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
    mission = models.ForeignKey(Mission, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
    product = models.ForeignKey(ProductItem, on_delete=models.SET_NULL, null=True, blank=True, related_name='requests')
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
