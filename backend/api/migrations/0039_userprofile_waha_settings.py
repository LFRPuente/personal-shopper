from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0038_clienthistorysharelink_public_token'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='waha_api_url',
            field=models.URLField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='waha_api_key',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='waha_session',
            field=models.CharField(blank=True, default='', max_length=120),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='waha_phone_prefix',
            field=models.CharField(blank=True, default='521', max_length=12),
        ),
        migrations.AddField(
            model_name='userprofile',
            name='waha_chat_id_suffix',
            field=models.CharField(blank=True, default='@c.us', max_length=30),
        ),
    ]
