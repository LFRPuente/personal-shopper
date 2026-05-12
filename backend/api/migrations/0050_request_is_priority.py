from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0049_mission_client_balance_snapshots'),
    ]

    operations = [
        migrations.AddField(
            model_name='request',
            name='is_priority',
            field=models.BooleanField(default=False),
        ),
    ]
