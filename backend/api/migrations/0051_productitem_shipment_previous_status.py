from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0050_request_is_priority'),
    ]

    operations = [
        migrations.AddField(
            model_name='productitem',
            name='shipment_previous_status',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]
