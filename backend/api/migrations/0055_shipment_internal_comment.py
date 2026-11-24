from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('api', '0054_shipment_second_package')]
    operations = [
        migrations.AddField(
            model_name='shipment',
            name='internal_comment',
            field=models.TextField(blank=True, default='', max_length=1000),
        ),
    ]
