from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0035_shoppingpaymententry_batch_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='display_name',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='phone',
            field=models.CharField(blank=True, default='', max_length=30),
        ),
    ]
