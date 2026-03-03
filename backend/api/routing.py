from django.urls import path

from .consumers import UpdatesConsumer

# <-------- seccion 8: rutas websocket de la app
websocket_urlpatterns = [
    path('ws/updates/', UpdatesConsumer.as_asgi()),
]
