from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0031_shoppingpaymententry'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='home_layout',
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
