from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0034_mission_product_payer'),
    ]

    operations = [
        migrations.AddField(
            model_name='shoppingpaymententry',
            name='entry_kind',
            field=models.CharField(
                choices=[
                    ('SHOPPING', 'Abono por shopping'),
                    ('CLIENT_BATCH', 'Abono general de cliente'),
                ],
                default='SHOPPING',
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name='shoppingpaymententry',
            name='group_token',
            field=models.CharField(blank=True, max_length=64, null=True),
        ),
    ]
