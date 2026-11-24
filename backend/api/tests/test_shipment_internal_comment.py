import hashlib

from django.contrib.auth.models import User
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from api.models import Client, ClientHistoryShareLink, ProductItem, Shipment, ShipmentShareLink


class ShipmentInternalCommentTests(TestCase):
    @override_settings(CHANNEL_LAYERS={})
    def test_comment_saved_and_exportable_but_absent_from_public_links(self):
        user = User.objects.create_user(username='comment-test')
        client = Client.objects.create(name='Test')
        shipment = Shipment.objects.create(client=client)
        shipment.products.add(ProductItem.objects.create(client=client, name='Test item'))
        token = 'test-private-note-token'
        token_hash = hashlib.sha256(token.encode()).hexdigest()
        ClientHistoryShareLink.objects.create(client=client, public_token=token, token_hash=token_hash)
        ShipmentShareLink.objects.create(shipment=shipment, token_hash=token_hash)
        path = f'/api/shipments/{shipment.pk}/'

        api = APIClient()
        api.force_authenticate(user)
        response = api.patch(path, {'internal_comment': 'Internal note'}, format='json')
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(api.get(path).data['internal_comment'], 'Internal note')
        self.assertEqual(api.get('/api/shipments/').data[0]['internal_comment'], 'Internal note')

        api.force_authenticate(None)
        self.assertIn(api.get(path).status_code, (401, 403))
        for variant in ('client', 'shipment'):
            with self.subTest(variant=variant):
                response = api.get(f'/api/public/{variant}-share/{token}/')
                self.assertEqual(response.status_code, 200)
                self.assertNotContains(response, 'internal_comment')
                self.assertNotContains(response, 'Internal note')
