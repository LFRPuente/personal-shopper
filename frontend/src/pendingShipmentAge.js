const DAY_MS = 86400000;

export function getMatamorosDate(now = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Matamoros', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now).map(({ type, value }) => [type, value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function calendarDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return NaN;
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp / DAY_MS : NaN;
}

export function getPendingShipmentAge(client, today = getMatamorosDate()) {
  const currentDay = calendarDay(today);
  const items = (Array.isArray(client?.products) ? client.products : [])
    .filter((product) => product && !product.shipment &&
      ['ANNOTATED', 'BOUGHT'].includes(String(product.status || '').toUpperCase()))
    .map((product) => ({ product, days: currentDay - calendarDay(product.purchase_date) }))
    .filter(({ days }) => Number.isFinite(days) && days > 30)
    .sort((a, b) => b.days - a.days || Number(a.product.id) - Number(b.product.id));
  return { items, count: items.length, oldestDays: items[0]?.days || 0 };
}
