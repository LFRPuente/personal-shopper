from django.core.management.base import BaseCommand
from django.db import transaction

from api.models import Mission, ProductItem


class Command(BaseCommand):
    help = (
        "Assigns a mission to products without mission and syncs mission<->client links."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Preview changes without writing to the database.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        orphan_products = (
            ProductItem.objects.filter(mission__isnull=True)
            .select_related("client")
            .order_by("created_at")
        )
        total = orphan_products.count()
        if total == 0:
            self.stdout.write(self.style.SUCCESS("No orphan products found."))
            return

        active_mission = (
            Mission.objects.filter(status__in=["ACTIVE", "PAUSED"])
            .order_by("-start_time")
            .first()
        )
        latest_mission = Mission.objects.order_by("-start_time").first()

        assigned = 0
        skipped = 0

        for product in orphan_products:
            mission = product.client.missions_history.order_by("-start_time").first()
            if mission is None:
                mission = active_mission
            if mission is None:
                mission = latest_mission
            if mission is None:
                skipped += 1
                continue

            assigned += 1
            if dry_run:
                self.stdout.write(
                    f"[dry-run] product={product.id} client={product.client_id} -> mission={mission.id}"
                )
                continue

            with transaction.atomic():
                product.mission = mission
                product.save(update_fields=["mission"])
                mission.clients.add(product.client)

        summary = (
            f"Processed orphan products={total}, assigned={assigned}, skipped={skipped}, dry_run={dry_run}"
        )
        self.stdout.write(self.style.SUCCESS(summary))
