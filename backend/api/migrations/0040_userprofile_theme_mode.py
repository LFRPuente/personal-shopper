from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0039_userprofile_waha_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='userprofile',
            name='theme_mode',
            field=models.CharField(
                choices=[('LIGHT', 'Dia'), ('DARK', 'Noche')],
                default='LIGHT',
                max_length=5,
            ),
        ),
    ]
