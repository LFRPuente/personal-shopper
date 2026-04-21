from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0043_userprofile_phone_country_code'),
    ]

    operations = [
        migrations.AddField(
            model_name='shipment',
            name='includes_insurance',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='shipment',
            name='insurance_price',
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True),
        ),
    ]
