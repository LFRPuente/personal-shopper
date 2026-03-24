from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0029_shoppingpayment"),
    ]

    operations = [
        migrations.AlterModelOptions(
            name="mission",
            options={
                "verbose_name": "shopping",
                "verbose_name_plural": "shoppings",
            },
        ),
        migrations.AlterField(
            model_name="mission",
            name="status",
            field=models.CharField(
                choices=[
                    ("ACTIVE", "Shopping Activo"),
                    ("PAUSED", "Shopping Pausado"),
                    ("COMPLETED", "Shopping Finalizado"),
                ],
                default="ACTIVE",
                max_length=50,
            ),
        ),
    ]
