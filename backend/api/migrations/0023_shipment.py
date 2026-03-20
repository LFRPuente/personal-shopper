from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0022_clientmissionsharelink'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Shipment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('carrier', models.CharField(blank=True, max_length=120, null=True)),
                ('tracking_number', models.CharField(blank=True, max_length=120, null=True)),
                ('guide_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('client_price', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('shipping_address', models.TextField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('client', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shipments', to='api.client')),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shipments_created', to=settings.AUTH_USER_MODEL)),
                ('mission', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='shipments', to='api.mission')),
                ('product', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='shipment', to='api.productitem')),
            ],
            options={
                'ordering': ['-updated_at', '-id'],
            },
        ),
    ]
