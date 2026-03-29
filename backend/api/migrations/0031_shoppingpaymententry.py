from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


def backfill_payment_entries(apps, schema_editor):
    ShoppingPayment = apps.get_model('api', 'ShoppingPayment')
    ShoppingPaymentEntry = apps.get_model('api', 'ShoppingPaymentEntry')
    entries = []
    for payment in ShoppingPayment.objects.exclude(amount=0):
        entries.append(
            ShoppingPaymentEntry(
                payment_id=payment.id,
                amount=payment.amount,
                total_after=payment.amount,
                created_by_id=payment.created_by_id,
                created_at=payment.updated_at or payment.created_at,
            )
        )
    if entries:
        ShoppingPaymentEntry.objects.bulk_create(entries)


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('api', '0030_alter_mission_options_alter_mission_status'),
    ]

    operations = [
        migrations.CreateModel(
            name='ShoppingPaymentEntry',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('total_after', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, editable=False)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shopping_payment_entries_created', to=settings.AUTH_USER_MODEL)),
                ('payment', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='entries', to='api.shoppingpayment')),
            ],
            options={
                'ordering': ['-created_at', '-id'],
            },
        ),
        migrations.RunPython(backfill_payment_entries, migrations.RunPython.noop),
    ]
