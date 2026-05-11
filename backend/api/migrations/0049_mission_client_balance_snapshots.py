from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0048_stock_catalog'),
    ]

    operations = [
        migrations.AddField(
            model_name='mission',
            name='client_balance_snapshots',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
