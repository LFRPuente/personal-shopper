from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('api', '0053_shipment_payment_date')]
    operations = [
        migrations.AddField(
            model_name='shipment', name='second_package',
            field=models.JSONField(blank=True, null=True),
        ),
    ]
