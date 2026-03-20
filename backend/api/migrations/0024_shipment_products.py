from django.db import migrations, models
import django.db.models.deletion


def copy_existing_shipment_product_to_m2m(apps, schema_editor):
    Shipment = apps.get_model('api', 'Shipment')
    for shipment in Shipment.objects.exclude(product_id__isnull=True).iterator():
        shipment.products.add(shipment.product_id)


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0023_shipment'),
    ]

    operations = [
        migrations.AlterField(
            model_name='shipment',
            name='product',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='shipment', to='api.productitem'),
        ),
        migrations.AddField(
            model_name='shipment',
            name='products',
            field=models.ManyToManyField(blank=True, related_name='shipments', to='api.productitem'),
        ),
        migrations.RunPython(copy_existing_shipment_product_to_m2m, migrations.RunPython.noop),
        migrations.AddConstraint(
            model_name='shipment',
            constraint=models.UniqueConstraint(condition=models.Q(('tracking_number__isnull', False)), fields=('client', 'mission', 'tracking_number'), name='unique_tracking_per_client_mission_when_present'),
        ),
    ]
