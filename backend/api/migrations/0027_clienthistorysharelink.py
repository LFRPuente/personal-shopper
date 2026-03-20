from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0026_shipment_status_and_sharelink'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RenameModel(
            old_name='ClientMissionShareLink',
            new_name='ClientHistoryShareLink',
        ),
        migrations.RemoveConstraint(
            model_name='clienthistorysharelink',
            name='unique_active_share_link_per_client_mission',
        ),
        migrations.RemoveField(
            model_name='clienthistorysharelink',
            name='mission',
        ),
        migrations.AlterField(
            model_name='clienthistorysharelink',
            name='client',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='history_share_links', to='api.client'),
        ),
        migrations.AlterField(
            model_name='clienthistorysharelink',
            name='created_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='client_history_share_links_created', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddConstraint(
            model_name='clienthistorysharelink',
            constraint=models.UniqueConstraint(
                condition=models.Q(('is_active', True)),
                fields=('client', 'is_active'),
                name='unique_active_share_link_per_client',
            ),
        ),
    ]
