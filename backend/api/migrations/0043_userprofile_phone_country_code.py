from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0042_productitem_discount_percentage_and_uses_global'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='phone_country_code',
            field=models.CharField(blank=True, default='+52', max_length=8),
        ),
    ]
