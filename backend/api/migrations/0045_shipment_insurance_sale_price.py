from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0044_shipment_insurance_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='insurance_sale_price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
