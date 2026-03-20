from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0025_shippingcarrierrecommendation'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='status',
            field=models.CharField(
                choices=[
                    ('PENDING', 'Pendiente'),
                    ('PREPARING', 'Preparando'),
                    ('SHIPPED', 'Enviado'),
                    ('DELIVERED', 'Entregado'),
                    ('CANCELLED', 'Cancelado'),
                ],
                default='PENDING',
                max_length=20,
            ),
        ),
        migrations.CreateModel(
            name='ShipmentShareLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('token_hash', models.CharField(max_length=64, unique=True)),
                ('is_active', models.BooleanField(default=True)),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('last_accessed_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shipment_share_links_created', to=settings.AUTH_USER_MODEL)),
                ('shipment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='share_links', to='api.shipment')),
            ],
            options={
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.AddConstraint(
            model_name='shipmentsharelink',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_active', True)),
                fields=('shipment', 'is_active'),
                name='unique_active_share_link_per_shipment',
            ),
        ),
    ]
