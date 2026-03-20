from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from api.models import Request
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class Command(BaseCommand):
    help = 'Elimina las peticiones enviadas hace más de 30 días que sigan PENDIENTES, y reporta el cambio por websockets'

    def handle(self, *args, **options):
        # 30 days ago
        limit = timezone.now() - timedelta(days=30)
        
        # Requests
        deleted_count, _ = Request.objects.filter(
            status='PENDING', 
            created_at__lt=limit
        ).delete()
        
        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f'Exito: Borradas {deleted_count} peticiones PENDIENTES de mas de 30 dias.'))
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    'updates',
                    {
                        'type': 'send_update',
                        'model': 'requests',
                        'action': 'deleted',
                    }
                )
        else:
            self.stdout.write(self.style.SUCCESS('No habia peticiones antiguas PENDIENTES que borrar.'))
