from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0051_productitem_shipment_previous_status'),
    ]

    operations = [
        migrations.AlterField(
            model_name='shipment',
            name='product',
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=models.SET_NULL,
                related_name='shipment',
                to='api.productitem',
            ),
        ),
    ]
