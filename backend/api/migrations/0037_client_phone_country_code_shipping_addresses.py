from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_userprofile_display_name_phone'),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='phone_country_code',
            field=models.CharField(blank=True, default='+52', max_length=8),
        ),
        migrations.AddField(
            model_name='client',
            name='shipping_addresses',
            field=models.JSONField(blank=True, default=list),
        ),
    ]
