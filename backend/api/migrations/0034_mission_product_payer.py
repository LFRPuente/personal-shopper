from django.conf import settings
from django.db import migrations, models


def backfill_payers(apps, schema_editor):
    Mission = apps.get_model('api', 'Mission')
    ProductItem = apps.get_model('api', 'ProductItem')

    for mission in Mission.objects.filter(payer__isnull=True).exclude(shopper__isnull=True):
        mission.payer_id = mission.shopper_id
        mission.save(update_fields=['payer'])

    for product in ProductItem.objects.filter(payer__isnull=True).iterator():
        payer_id = None
        if product.mission_id:
            mission = Mission.objects.filter(id=product.mission_id).only('payer_id').first()
            if mission and mission.payer_id:
                payer_id = mission.payer_id
        if payer_id is None and product.added_by_id:
            payer_id = product.added_by_id
        if payer_id is not None:
            product.payer_id = payer_id
            product.save(update_fields=['payer'])


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0033_shipmentevidence'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='mission',
            name='payer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='shopping_payments_assigned',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='productitem',
            name='payer',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.deletion.SET_NULL,
                related_name='product_payments_assigned',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.RunPython(backfill_payers, migrations.RunPython.noop),
    ]
