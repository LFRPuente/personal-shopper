from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0046_expense'),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='package_height',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
        migrations.AddField(
            model_name='shipment',
            name='package_length',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
        migrations.AddField(
            model_name='shipment',
            name='package_weight',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
        migrations.AddField(
            model_name='shipment',
            name='package_width',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=8, null=True),
        ),
    ]
