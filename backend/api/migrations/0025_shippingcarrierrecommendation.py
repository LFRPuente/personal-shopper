from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0024_shipment_products'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ShippingCarrierRecommendation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=120)),
                ('normalized_name', models.CharField(max_length=120)),
                ('times_used', models.PositiveIntegerField(default=1)),
                ('last_used_at', models.DateTimeField(auto_now=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='shipping_carrier_recommendations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-last_used_at', '-times_used', 'name'],
            },
        ),
        migrations.AddConstraint(
            model_name='shippingcarrierrecommendation',
            constraint=models.UniqueConstraint(fields=('user', 'normalized_name'), name='unique_shipping_carrier_recommendation_per_user'),
        ),
    ]
