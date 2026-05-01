from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import decimal


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0047_shipment_package_fields'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='StockCatalogProduct',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=255)),
                ('description', models.TextField(blank=True, default='')),
                ('tags', models.TextField(blank=True, default='')),
                ('image', models.ImageField(blank=True, null=True, upload_to='stock_catalog/')),
                ('real_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('charged_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('apply_discount', models.BooleanField(default=True)),
                ('discount_percentage', models.DecimalField(decimal_places=2, default=decimal.Decimal('0.00'), max_digits=5)),
                ('discount_uses_global', models.BooleanField(default=True)),
                ('stock_quantity', models.PositiveIntegerField(default=0)),
                ('sold_quantity', models.PositiveIntegerField(default=0)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stock_catalog_products_created', to=settings.AUTH_USER_MODEL)),
                ('payer', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stock_catalog_payments_assigned', to=settings.AUTH_USER_MODEL)),
                ('store', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='stock_catalog_products', to='api.store')),
            ],
            options={
                'ordering': ['-updated_at', '-id'],
            },
        ),
        migrations.CreateModel(
            name='StockCatalogOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('customer_name', models.CharField(max_length=255)),
                ('customer_phone', models.CharField(max_length=30)),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('status', models.CharField(choices=[('REQUESTED', 'Solicitado'), ('WAHA_SENT', 'WAHA enviado'), ('WAHA_FAILED', 'WAHA fallido')], default='REQUESTED', max_length=20)),
                ('waha_detail', models.TextField(blank=True, default='')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('product', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='orders', to='api.stockcatalogproduct')),
            ],
            options={
                'ordering': ['-created_at', '-id'],
            },
        ),
    ]
