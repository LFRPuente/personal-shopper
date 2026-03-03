from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet,
    ProductItemViewSet,
    ReceiptViewSet,
    MissionViewSet,
    StoreViewSet,
    RequestViewSet,
    ProductReviewViewSet,
    ReviewAlternativeViewSet,
    scan_receipt,
    register_user,
    me,
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'products', ProductItemViewSet)
router.register(r'receipts', ReceiptViewSet)
router.register(r'missions', MissionViewSet, basename='mission')
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'requests', RequestViewSet, basename='request')
# <-------- seccion 7: rutas de revisiones AV <-> PS
router.register(r'reviews', ProductReviewViewSet, basename='review')
router.register(r'review-alternatives', ReviewAlternativeViewSet, basename='review-alternative')

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', register_user, name='register'),
    path('auth/me/', me, name='me'),
    path('', include(router.urls)),
    path('scan-receipt/', scan_receipt, name='scan-receipt'),
]
