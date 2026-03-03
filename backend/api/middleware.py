from urllib.parse import parse_qs

from channels.auth import AuthMiddlewareStack
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.utils import timezone


class UpdateLastActiveMiddleware:
    """Update UserProfile.last_active on every authenticated request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'userprofile'):
                request.user.userprofile.last_active = timezone.now()
                request.user.userprofile.save(update_fields=['last_active'])
        return response


# <-------- seccion 8: middleware jwt para autenticar websocket con token query param
class JWTAuthMiddleware(BaseMiddleware):
    def __init__(self, inner):
        super().__init__(inner)

    async def __call__(self, scope, receive, send):
        query_string = (scope.get('query_string') or b'').decode()
        token = parse_qs(query_string).get('token', [None])[0]
        if token:
            user = await self.get_user_from_token(token)
            if user is not None:
                scope['user'] = user
        return await super().__call__(scope, receive, send)

    @database_sync_to_async
    def get_user_from_token(self, token):
        try:
            from rest_framework_simplejwt.authentication import JWTAuthentication
            jwt_auth = JWTAuthentication()
            validated_token = jwt_auth.get_validated_token(token)
            return jwt_auth.get_user(validated_token)
        except Exception:
            return None


def JWTAuthMiddlewareStack(inner):
    return JWTAuthMiddleware(AuthMiddlewareStack(inner))
