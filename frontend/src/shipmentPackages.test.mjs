import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShipmentPackage, getPackagesSalePrice, shipmentPackagePayload, getShipmentPackages, getPublicPackageSalePriceLabel } from './shipmentPackages.js';

test('single box retains fallback, free price, and two boxes sum only their shipping prices', () => {
  assert.equal(getPackagesSalePrice({ guide_price: '80.50', client_price: null }), 80.50);
  assert.equal(getPackagesSalePrice({ guide_price: '80.50', client_price: '0.00' }), 0);
  assert.equal(getPackagesSalePrice({ client_price: '120.75', insurance_sale_price: '15.00', second_package: { client_price: '150.25', insurance_sale_price: '18.00' } }), 271);
});

test('optional package payload retains exact decimal input and excludes shared parent data', () => {
  const form = createShipmentPackage({ carrier: 'DHL', status: 'SHIPPED', product_ids: [1] });
  assert.equal('status' in form, false);
  assert.equal('product_ids' in form, false);
  const payload = shipmentPackagePayload({ ...form, tracking_number: ' SECOND ', client_price: '150.25', package_weight: '2.75' });
  assert.equal(payload.tracking_number, 'SECOND');
  assert.equal(payload.client_price, '150.25');
  assert.equal(payload.package_weight, '2.75');
  assert.equal(payload.guide_price, null);
  assert.equal(shipmentPackagePayload(null), null);
});

test('public prices use sale values for either box without revealing purchase costs', () => {
  const formatAmount = (value) => value.toFixed(2);
  for (const box of getShipmentPackages({ guide_price: '100.00', client_price: '180.50',
    second_package: { guide_price: '332.00', client_price: '450.25' } })) {
    assert.equal(getPublicPackageSalePriceLabel(box, formatAmount), `$${Number(box.client_price).toFixed(2)}`);
  }
  for (const missing of [null, undefined, '', ' ', 'invalid']) {
    assert.equal(getPublicPackageSalePriceLabel({ guide_price: '332.00', client_price: missing }, formatAmount), '');
  }
});

test('public zero sale prices say GRATIS for both boxes even with nonzero purchase costs', () => {
  for (const zero of [0, '0', '0.00', '0.0']) {
    for (const box of getShipmentPackages({ guide_price: '332.00', client_price: zero,
      second_package: { guide_price: '450.00', client_price: zero } })) {
      assert.equal(getPublicPackageSalePriceLabel(box, (value) => value.toFixed(2)), 'GRATIS');
    }
  }
});
