import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadGeneralCsv, downloadGeneralWorkbook, getShipmentReportDate, isShipmentInReportRange } from './reportWorkbook.js';

const shipment = {
  id: 1, client_name: 'Paid in November', created_at: '2026-10-28T12:00:00Z',
  payment_date: '2026-11-01', carrier: 'DHL', guide_price: '80.00',
  client_price: '120.00', insurance_price: '10.00', insurance_sale_price: '15.00',
};

test('payment date selects the report month, including its first and last day', () => {
  assert.equal(getShipmentReportDate(shipment), '2026-11-01');
  assert.equal(isShipmentInReportRange(shipment, '2026-10-01', '2026-10-31'), false);
  assert.equal(isShipmentInReportRange(shipment, '2026-11-01', '2026-11-30'), true);
  assert.equal(isShipmentInReportRange({ ...shipment, payment_date: '2026-11-30' }, '2026-11-01', '2026-11-30'), true);
  assert.equal(isShipmentInReportRange({ ...shipment, payment_date: '2026-12-01' }, '2026-11-01', '2026-11-30'), false);
});

test('historical shipments without payment date retain their creation date', () => {
  const historic = { ...shipment, payment_date: null };
  assert.equal(getShipmentReportDate(historic), '2026-10-28');
  assert.equal(isShipmentInReportRange(historic, '2026-10-01', '2026-10-31'), true);
});

test('CSV and workbook export the payment date with identical shipping amounts', async () => {
  const originalDocument = globalThis.document;
  const originalCreate = URL.createObjectURL;
  const originalRevoke = URL.revokeObjectURL;
  const blobs = [];
  globalThis.document = { createElement: () => ({ click() {} }), body: { appendChild() {}, removeChild() {} } };
  URL.createObjectURL = (blob) => { blobs.push(blob); return 'blob:test'; };
  URL.revokeObjectURL = () => {};
  const initial = JSON.stringify(shipment);
  try {
    const args = { shipments: [{ ...shipment, internal_comment: '=1+1' }], startDate: '2026-11-01', endDate: '2026-11-30' };
    downloadGeneralCsv(args);
    downloadGeneralWorkbook(args);
    const csv = await blobs[0].text();
    const workbook = await blobs[1].text();
    assert.ok(csv.includes('"2026-11-01","Paid in November","DHL","80","120","10","15"'));
    assert.ok(workbook.includes('2026-11-01'));
    assert.ok(csv.includes('"Comentario interno"'));
    assert.ok(csv.includes(`"'=1+1"`));
    assert.ok(workbook.includes('<Data ss:Type="String">=1+1</Data>'));
    for (const value of [80, 120, 10, 15]) assert.ok(workbook.includes(`<Data ss:Type="Number">${value}</Data>`));
    assert.equal(JSON.stringify(shipment), initial);
    downloadGeneralCsv({ ...args, startDate: '2026-10-01', endDate: '2026-10-31' });
    assert.ok(!(await blobs[2].text()).includes('Paid in November'));
  } finally {
    globalThis.document = originalDocument;
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  }
});

test('two boxes produce exactly two independent report rows in the shared payment month', async () => {
  const { getShipmentReportRows } = await import('./reportWorkbook.js');
  const dual = { ...shipment, tracking_number: 'FIRST', second_package: {
    carrier: 'Estafeta', tracking_number: 'SECOND', guide_price: '90.25', client_price: '160.50',
    insurance_price: '12.75', insurance_sale_price: '18.25',
  } };
  const initial = JSON.stringify(dual);
  const rows = getShipmentReportRows([dual], '2026-11-01', '2026-11-30');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows.map((row) => [row.Envio, row.Caja, row.Guia, row.Fecha]), [
    [1, 1, 'FIRST', '2026-11-01'], [1, 2, 'SECOND', '2026-11-01'],
  ]);
  assert.deepEqual(rows.map((row) => [row['Costo de compra'], row['Costo de venta'], row['Costo del seguro'], row['Costo de venta del seguro']]), [[80, 120, 10, 15], [90.25, 160.5, 12.75, 18.25]]);
  assert.equal(getShipmentReportRows([dual], '2026-10-01', '2026-10-31').length, 0);
  assert.equal(getShipmentReportRows([shipment]).length, 1);
  assert.equal(JSON.stringify(dual), initial);
});
