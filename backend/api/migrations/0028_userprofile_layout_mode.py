from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0027_clienthistorysharelink'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='layout_mode',
            field=models.CharField(
                choices=[
                    ('MOBILE', 'Mobile'),
                    ('WEB', 'Web'),
                ],
                default='MOBILE',
                max_length=6,
            ),
        ),
    ]
