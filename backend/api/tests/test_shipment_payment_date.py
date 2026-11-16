from datetime import date, datetime, timezone as datetime_timezone
from decimal import Decimal
from tempfile import TemporaryDirectory
from unittest.mock import patch

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework.test import APIRequestFactory, force_authenticate

from api.models import Client, Shipment, ShipmentEvidence
from api.serializers import ShipmentListSerializer, ShipmentSerializer
from api.views import ShipmentViewSet


class ShipmentPaymentDateTests(TestCase):
    def setUp(self):
        media = TemporaryDirectory()
        self.addCleanup(media.cleanup)
        self.enterContext(override_settings(MEDIA_ROOT=media.name))
        self.enterContext(patch('api.views.broadcast_update'))
        self.user = User.objects.create_user(username='payment-date-test')
        self.client_record = Client.objects.create(name='Test client')
        self.shipment = Shipment.objects.create(
            client=self.client_record, guide_price=Decimal('80.00'),
            client_price=Decimal('120.00'), insurance_price=Decimal('10.00'),
            insurance_sale_price=Decimal('15.00'),
        )
        self.created_at = self.shipment.created_at
        self.factory = APIRequestFactory()

    def request(self, method, action, data=None, **kwargs):
        request = getattr(self.factory, method)('/', data or {}, format='multipart' if method == 'post' else 'json')
        force_authenticate(request, user=self.user)
        return ShipmentViewSet.as_view({method: action})(request, pk=self.shipment.pk, **kwargs)

    def upload(self):
        return self.request('post', 'upload_evidence', {
            'files': [SimpleUploadedFile('proof.png', b'proof', content_type='image/png')],
        })

    def test_first_evidence_uses_matamoros_date_without_changing_creation_or_amounts(self):
        with patch('django.utils.timezone.now', return_value=datetime(2026, 11, 1, 3, 30, tzinfo=datetime_timezone.utc)):
            response = self.upload()
        self.assertEqual(response.status_code, 201)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.payment_date, date(2026, 10, 31))
        self.assertEqual(self.shipment.created_at, self.created_at)
        self.assertEqual(self.shipment.guide_price, Decimal('80.00'))
        self.assertEqual(self.shipment.client_price, Decimal('120.00'))
        self.assertEqual(self.shipment.insurance_price, Decimal('10.00'))
        self.assertEqual(self.shipment.insurance_sale_price, Decimal('15.00'))
        self.assertEqual(response.data['shipment']['payment_date'], '2026-10-31')
        self.assertEqual(ShipmentListSerializer(self.shipment).data['payment_date'], '2026-10-31')

    def test_manual_date_is_preserved_on_first_and_later_evidence(self):
        self.shipment.payment_date = date(2026, 10, 29)
        self.shipment.save(update_fields=['payment_date'])
        for _ in range(2):
            self.assertEqual(self.upload().status_code, 201)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.payment_date, date(2026, 10, 29))

    def test_first_automatic_date_is_not_replaced_by_later_evidence(self):
        self.assertEqual(self.upload().status_code, 201)
        self.shipment.refresh_from_db()
        original = self.shipment.payment_date
        with patch('django.utils.timezone.now', return_value=datetime(2027, 1, 1, tzinfo=datetime_timezone.utc)):
            self.assertEqual(self.upload().status_code, 201)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.payment_date, original)

    def test_replacing_and_deleting_evidence_preserve_payment_date(self):
        self.upload()
        self.shipment.refresh_from_db()
        original = self.shipment.payment_date
        evidence = self.shipment.evidence.first()
        replacement = SimpleUploadedFile('replacement.png', b'replacement', content_type='image/png')
        self.assertEqual(self.request('post', 'replace_evidence', {'file': replacement}, evidence_id=str(evidence.pk)).status_code, 200)
        self.assertEqual(self.request('delete', 'delete_evidence', evidence_id=str(evidence.pk)).status_code, 200)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.payment_date, original)

    def test_partial_date_update_changes_no_amounts_and_is_locked_after_shipping(self):
        self.assertEqual(self.request('patch', 'partial_update', {'payment_date': '2026-10-28'}).status_code, 200)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.payment_date, date(2026, 10, 28))
        self.assertEqual(self.shipment.client_price, Decimal('120.00'))
        self.shipment.status = Shipment.Status.SHIPPED
        self.shipment.save(update_fields=['status'])
        self.assertEqual(self.request('patch', 'partial_update', {'payment_date': '2026-10-29'}).status_code, 400)
        self.shipment.refresh_from_db()
        self.assertEqual(self.shipment.payment_date, date(2026, 10, 28))

    def test_later_upload_does_not_backfill_historical_evidence(self):
        ShipmentEvidence.objects.create(shipment=self.shipment, file='historic.png')
        self.upload()
        self.shipment.refresh_from_db()
        self.assertIsNone(self.shipment.payment_date)

    def test_invalid_batch_does_not_set_payment_date_or_save_partial_evidence(self):
        response = self.request('post', 'upload_evidence', {'files': [
            SimpleUploadedFile('proof.png', b'proof', content_type='image/png'),
            SimpleUploadedFile('invalid.txt', b'invalid', content_type='text/plain'),
        ]})
        self.assertEqual(response.status_code, 400)
        self.shipment.refresh_from_db()
        self.assertIsNone(self.shipment.payment_date)
        self.assertFalse(self.shipment.evidence.exists())

    def test_invalid_date_is_rejected(self):
        serializer = ShipmentSerializer(self.shipment, data={'payment_date': '2026-02-30'}, partial=True)
        self.assertFalse(serializer.is_valid())
        self.assertIn('payment_date', serializer.errors)
