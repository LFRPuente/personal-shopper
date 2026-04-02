from django.db import migrations, models
import secrets


def backfill_client_history_share_tokens(apps, schema_editor):
    ClientHistoryShareLink = apps.get_model('api', 'ClientHistoryShareLink')
    used_tokens = set(
        ClientHistoryShareLink.objects.exclude(public_token__isnull=True)
        .exclude(public_token='')
        .values_list('public_token', flat=True)
    )
    for share_link in ClientHistoryShareLink.objects.all().iterator():
        token = (share_link.public_token or '').strip()
        while not token or token in used_tokens:
            token = secrets.token_urlsafe(32)
        used_tokens.add(token)
        share_link.public_token = token
        share_link.save(update_fields=['public_token'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0037_client_phone_country_code_shipping_addresses'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL(
                    sql=(
                        "ALTER TABLE api_clienthistorysharelink "
                        "ADD COLUMN IF NOT EXISTS public_token varchar(64);"
                    ),
                    reverse_sql=(
                        "ALTER TABLE api_clienthistorysharelink "
                        "DROP COLUMN IF EXISTS public_token;"
                    ),
                ),
                migrations.RunSQL(
                    sql=(
                        "CREATE UNIQUE INDEX IF NOT EXISTS "
                        "api_clienthistorysharelink_public_token_uniq "
                        "ON api_clienthistorysharelink (public_token);"
                    ),
                    reverse_sql=(
                        "DROP INDEX IF EXISTS "
                        "api_clienthistorysharelink_public_token_uniq;"
                    ),
                ),
            ],
            state_operations=[
                migrations.AddField(
                    model_name='clienthistorysharelink',
                    name='public_token',
                    field=models.CharField(blank=True, max_length=64, null=True, unique=True),
                ),
            ],
        ),
        migrations.RunPython(
            backfill_client_history_share_tokens,
            migrations.RunPython.noop,
        ),
    ]
