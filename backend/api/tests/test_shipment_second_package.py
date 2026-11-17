from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from api.models import Client, ProductItem, Shipment
from api.serializers import (ShipmentSerializer, ShipmentListSerializer,
                             ShipmentNestedSummarySerializer, PublicShipmentSummarySerializer)
from api.views import ShipmentViewSet


class ShipmentSecondPackageTests(TestCase):
    def setUp(self):
        self.enterContext(patch('api.views.broadcast_update'))
        self.user = User.objects.create_user(username='two-box-test')
        self.customer = Client.objects.create(name='Test customer')
        self.shipment = Shipment.objects.create(
            client=self.customer, carrier='DHL', tracking_number='BOX-ONE',
            guide_price='80.50', client_price='120.75', includes_insurance=True,
            insurance_price='10.00', insurance_sale_price='15.00',
            package_length='20.00', package_weight='1.50',
            status='PREPARING', payment_date=date(2026, 11, 2),
        )
        self.product = ProductItem.objects.create(client=self.customer, name='Test item', charged_price='50.00')
        self.shipment.products.add(self.product)
        self.original = self.shipment.created_at
        self.second = {
            'carrier': 'ESTAFETA', 'tracking_number': 'BOX-TWO',
            'guide_price': '90.10', 'client_price': '150.25',
            'includes_insurance': True, 'insurance_price': '12.50',
            'insurance_sale_price': '18.00', 'package_length': '30.00',
            'package_width': '25.00', 'package_height': '15.00', 'package_weight': '2.75',
        }

    def update(self, data):
        request = APIRequestFactory().patch('/', data, format='json')
        force_authenticate(request, user=self.user)
        return ShipmentViewSet.as_view({'patch': 'partial_update'})(request, pk=self.shipment.pk)

    def assert_original_unchanged(self):
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.created_at, self.original)
        self.assertEqual(self.shipment.status, 'PREPARING')
        self.assertEqual(self.shipment.payment_date, date(2026, 11, 2))
        self.assertEqual(self.shipment.tracking_number, 'BOX-ONE')
        self.assertEqual(self.shipment.guide_price, Decimal('80.50'))
        self.assertEqual(self.shipment.client_price, Decimal('120.75'))
        self.assertEqual(self.shipment.insurance_price, Decimal('10.00'))
        self.assertEqual(self.shipment.insurance_sale_price, Decimal('15.00'))
        self.assertEqual(self.shipment.package_weight, Decimal('1.50'))
        self.assertEqual(list(self.shipment.products.values_list('id', flat=True)), [self.product.id])

    def test_second_package_round_trip_preserves_first_box_shared_state_and_products(self):
        response = self.update({'second_package': self.second})
        self.assertEqual(response.status_code, 200, response.data)
        self.assert_original_unchanged()
        self.assertEqual(self.shipment.second_package, self.second)
        for serializer in [ShipmentSerializer, ShipmentListSerializer, ShipmentNestedSummarySerializer, PublicShipmentSummarySerializer]:
            with self.subTest(serializer=serializer.__name__):
                self.assertEqual(serializer(self.shipment).data['second_package'], self.second)

    def test_omitted_and_partial_second_box_edits_preserve_existing_values(self):
        self.assertEqual(self.update({'second_package': self.second}).status_code, 200)
        self.assertEqual(self.update({'shipping_address': 'New address'}).status_code, 200)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.second_package, self.second)
        self.assertEqual(self.update({'second_package': {'client_price': '160.30'}}).status_code, 200)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.second_package, {**self.second, 'client_price': '160.30'})
        self.assert_original_unchanged()

    def test_can_remove_second_box_and_keep_single_box_unchanged(self):
        self.assertEqual(self.update({'second_package': self.second}).status_code, 200)
        self.assertEqual(self.update({'second_package': None}).status_code, 200)
        self.assert_original_unchanged()
        self.assertIsNone(self.shipment.second_package)

    def test_blank_optional_box_and_zero_prices_are_allowed(self):
        response = self.update({'second_package': {'carrier': '', 'tracking_number': '', 'client_price': '0.00', 'guide_price': None}})
        self.assertEqual(response.status_code, 200, response.data)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.second_package['client_price'], '0.00')
        self.assertIsNone(self.shipment.second_package['guide_price'])

    def test_invalid_shape_negative_or_excess_precision_is_rejected_atomically(self):
        for invalid in [[], 'bad', {'guide_price': '-1.00'}, {'client_price': '1.123'},
                        {'package_weight': 'abc'}, {'client_price': '123456789.00'}]:
            with self.subTest(invalid=invalid):
                response = self.update({'second_package': invalid})
                self.assertEqual(response.status_code, 400, response.data)
                self.assert_original_unchanged()
                self.assertIsNone(self.shipment.second_package)

    def test_search_finds_second_tracking_without_duplicating_shipments(self):
        self.shipment.second_package = self.second
        self.shipment.save(update_fields=['second_package'])
        request = APIRequestFactory().get('/', {'search': 'BOX-TWO'})
        force_authenticate(request, user=self.user)
        response = ShipmentViewSet.as_view({'get': 'list'})(request)
        self.assertEqual(response.status_code, 200, response.data)
        data = response.data.get('results', []) if isinstance(response.data, dict) else response.data
        self.assertEqual([row['id'] for row in data], [self.shipment.id])
