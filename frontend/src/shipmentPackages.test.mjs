import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createShipmentPackage, getPackagesSalePrice, shipmentPackagePayload } from './shipmentPackages.js';

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
