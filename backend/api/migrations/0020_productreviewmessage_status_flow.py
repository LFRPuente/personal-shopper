from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0019_productreviewmessage_and_attachment'),
    ]

    operations = [
        migrations.AddField(
            model_name='productreviewmessage',
            name='from_status',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
        migrations.AddField(
            model_name='productreviewmessage',
            name='to_status',
            field=models.CharField(blank=True, max_length=32, null=True),
        ),
    ]
