from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0041_productitem_apply_discount'),
    ]

    operations = [
        migrations.AddField(
            model_name='productitem',
            name='discount_percentage',
            field=models.DecimalField(decimal_places=2, default=0.00, max_digits=5),
        ),
        migrations.AddField(
            model_name='productitem',
            name='discount_uses_global',
            field=models.BooleanField(default=True),
        ),
    ]
