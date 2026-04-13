from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ClientViewSet,
    ProductItemViewSet,
    ReceiptViewSet,
    MissionViewSet,
    StoreViewSet,
    RequestViewSet,
    ShipmentViewSet,
    ShoppingPaymentViewSet,
    ProductReviewViewSet,
    ReviewAlternativeViewSet,
    scan_receipt,
    register_user,
    me,
    send_waha_text,
    list_users,
    store_recommendations,
    shipping_carrier_recommendations,
    delete_store_recommendation,
    unread_review_summary,
    create_client_mission_share_link,
    public_client_mission_share_view,
    public_client_build_shipment_view,
    create_shipment_share_link,
    public_shipment_share_view,
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet, basename='client')
router.register(r'products', ProductItemViewSet)
router.register(r'receipts', ReceiptViewSet)
router.register(r'shoppings', MissionViewSet, basename='shopping')
router.register(r'missions', MissionViewSet, basename='mission')
router.register(r'stores', StoreViewSet, basename='store')
router.register(r'requests', RequestViewSet, basename='request')
router.register(r'payments', ShoppingPaymentViewSet, basename='payment')
router.register(r'shipments', ShipmentViewSet, basename='shipment')
# <-------- seccion 7: rutas de revisiones AV <-> PS
router.register(r'reviews', ProductReviewViewSet, basename='review')
router.register(r'review-alternatives', ReviewAlternativeViewSet, basename='review-alternative')

from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/register/', register_user, name='register'),
    path('auth/me/', me, name='me'),
    path('whatsapp/send-text/', send_waha_text, name='send-waha-text'),
    path('users/', list_users, name='users'),
    path('store-recommendations/', store_recommendations, name='store-recommendations'),
    path('shipping-carrier-recommendations/', shipping_carrier_recommendations, name='shipping-carrier-recommendations'),
    path('store-recommendations/<int:recommendation_id>/', delete_store_recommendation, name='delete-store-recommendation'),
    path('reviews/unread-summary/', unread_review_summary, name='unread-review-summary'),
    path('client-shopping-share-links/', create_client_mission_share_link, name='create-client-shopping-share-link'),
    path('client-share-links/', create_client_mission_share_link, name='create-client-mission-share-link'),
    path('public/client-shopping-share/<str:token>/', public_client_mission_share_view, name='public-client-shopping-share-view'),
    path('public/client-share/<str:token>/', public_client_mission_share_view, name='public-client-mission-share-view'),
    path('public/client-shopping-share/<str:token>/build-shipment/', public_client_build_shipment_view, name='public-client-shopping-build-shipment'),
    path('public/client-share/<str:token>/build-shipment/', public_client_build_shipment_view, name='public-client-build-shipment'),
    path('shipment-share-links/', create_shipment_share_link, name='create-shipment-share-link'),
    path('public/shipment-share/<str:token>/', public_shipment_share_view, name='public-shipment-share-view'),
    path('', include(router.urls)),
    path('scan-receipt/', scan_receipt, name='scan-receipt'),
]
