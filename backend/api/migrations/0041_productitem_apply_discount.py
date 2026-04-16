from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0040_userprofile_theme_mode'),
    ]

    operations = [
        migrations.AddField(
            model_name='productitem',
            name='apply_discount',
            field=models.BooleanField(default=True),
        ),
    ]
