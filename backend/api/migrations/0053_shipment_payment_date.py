from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('api', '0052_shipment_primary_product_set_null')]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='payment_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
