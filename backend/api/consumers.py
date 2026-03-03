import json

from channels.generic.websocket import AsyncWebsocketConsumer


# <-------- seccion 8: consumer para broadcast de actualizaciones
class UpdatesConsumer(AsyncWebsocketConsumer):
    group_name = 'updates'

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        # Not used for now; frontend only listens.
        return

    async def send_update(self, event):
        payload = {
            'model': event.get('model'),
            'action': event.get('action', 'changed'),
            'id': event.get('id'),
        }
        await self.send(text_data=json.dumps(payload))
