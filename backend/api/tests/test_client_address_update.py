from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.db import connection
from django.test import TestCase
from django.test.utils import CaptureQueriesContext
from rest_framework.test import APIRequestFactory, force_authenticate

from api.models import Client, Mission, ProductItem, Receipt, Shipment, Store
from api.serializers import ClientSerializer, ShipmentSerializer
from api.views import ClientViewSet


class ClientAddressUpdateTests(TestCase):
    def setUp(self):
        self.enterContext(patch('api.views.broadcast_update'))
        self.user = User.objects.create_user(username='address-test')
        self.customer = Client.objects.create(name='Address test', shipping_address='Old address')
        self.mission = Mission.objects.create(name='Completed test', status='COMPLETED')
        self.store = Store.objects.create(name='Test store')
        self.receipts = [Receipt.objects.create(client=self.customer) for _ in range(2)]
        self.products = ProductItem.objects.bulk_create([
            ProductItem(client=self.customer, mission=self.mission, store=self.store,
                        payer=self.user, receipt=self.receipts[index % 2], name=f'Item {index}',
                        charged_price='120.50', real_price='80.25', status='BOUGHT')
            for index in range(61)
        ])
        self.shipment = Shipment.objects.create(
            client=self.customer, mission=self.mission, carrier='DHL', tracking_number='FIRST',
            shipping_address='', guide_price='80.50', client_price='120.75', status='PENDING',
            second_package={'carrier': 'Estafeta', 'tracking_number': 'SECOND', 'client_price': '150.25'},
        )
        self.shipment.products.add(*self.products)

    def update_address(self, address):
        request = APIRequestFactory().patch('/', {'shipping_address': address}, format='json')
        force_authenticate(request, user=self.user)
        return ClientViewSet.as_view({'patch': 'partial_update'})(request, pk=self.customer.pk)

    def test_large_client_address_patch_preserves_complete_response_and_business_values(self):
        expected_shipment = dict(ShipmentSerializer(self.shipment).data)
        with CaptureQueriesContext(connection) as queries:
            response = self.update_address('New address')
        self.assertEqual(response.status_code, 200)
        self.assertLess(len(queries), 800, 'Repeated shipment expansion must not grow quadratically')
        self.customer.refresh_from_db()
        self.shipment.refresh_from_db()
        self.assertEqual(self.customer.shipping_address, 'New address')
        self.assertEqual(len(response.data['products']), 61)
        self.assertEqual(len(response.data['receipts']), 2)
        self.assertEqual(sum(len(row['items']) for row in response.data['receipts']), 61)
        expected_shipment['shipping_address'] = 'New address'
        expected_shipment['client_shipping_addresses'] = ['New address']
        for product in response.data['products']:
            self.assertEqual(product['shipment'], expected_shipment)
        self.assertEqual(self.shipment.guide_price, Decimal('80.50'))
        self.assertEqual(self.shipment.client_price, Decimal('120.75'))
        self.assertEqual(self.shipment.status, 'PENDING')
        self.assertEqual(self.shipment.products.count(), 61)
        self.assertEqual(self.shipment.second_package['client_price'], '150.25')
        self.assertEqual(set(ProductItem.objects.values_list('charged_price', 'real_price', 'status')),
                         {(Decimal('120.50'), Decimal('80.25'), 'BOUGHT')})

    def test_shared_shipment_is_expanded_once_across_products_and_receipt_items(self):
        original = ShipmentSerializer.to_representation
        with patch.object(ShipmentSerializer, 'to_representation', autospec=True, side_effect=original) as serialize:
            response = self.update_address('Another address')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(serialize.call_count, 1)
        for receipt in response.data['receipts']:
            for product in receipt['items']:
                self.assertEqual(product['shipment']['products_detail'], response.data['products'][0]['shipment']['products_detail'])

    def test_later_request_gets_current_address_without_cached_previous_response(self):
        self.assertEqual(self.update_address('First correction').status_code, 200)
        response = self.update_address('Second correction')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['shipping_address'], 'Second correction')
        self.assertEqual(response.data['products'][0]['shipment']['shipping_address'], 'Second correction')

    def test_distinct_shipments_keep_their_own_detail(self):
        second = Shipment.objects.create(client=self.customer, tracking_number='OTHER', client_price='99.00')
        self.shipment.products.remove(self.products[-1])
        second.products.add(self.products[-1])
        data = ClientSerializer(self.customer).data
        by_id = {product['id']: product['shipment'] for product in data['products']}
        self.assertEqual(by_id[self.products[0].pk]['id'], self.shipment.pk)
        self.assertEqual(by_id[self.products[-1].pk]['id'], second.pk)
        self.assertEqual(by_id[self.products[-1].pk]['client_price'], '99.00')
