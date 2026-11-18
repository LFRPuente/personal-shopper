export const SHIPMENT_PACKAGE_FIELDS = Object.freeze([
  'carrier', 'tracking_number', 'guide_price', 'client_price', 'includes_insurance',
  'insurance_price', 'insurance_sale_price', 'package_length', 'package_width',
  'package_height', 'package_weight',
]);

export const createShipmentPackage = (source = {}) => Object.fromEntries(
  SHIPMENT_PACKAGE_FIELDS.map((key) => [key, key === 'includes_insurance' ? !!source[key] : String(source[key] ?? '')]),
);

export const getShipmentPackages = (shipment) => shipment
  ? [shipment, ...(shipment.second_package && typeof shipment.second_package === 'object' && !Array.isArray(shipment.second_package) ? [shipment.second_package] : [])]
  : [];

export const getPackageSalePrice = (box) => {
  const value = box?.client_price !== null && box?.client_price !== undefined && String(box.client_price).trim() !== ''
    ? box.client_price : box?.guide_price;
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

// Public links must never substitute an internal purchase cost for a sale price.
export const getPublicPackageSalePriceLabel = (box, formatAmount) => {
  const raw = box?.client_price;
  if (raw === null || raw === undefined || String(raw).trim() === '') return '';
  const price = Number(raw);
  if (!Number.isFinite(price)) return '';
  return price === 0 ? 'GRATIS' : `$${formatAmount(price)}`;
};

export const getPackagesSalePrice = (shipment) => getShipmentPackages(shipment).reduce((sum, box) => sum + getPackageSalePrice(box), 0);

export const shipmentPackagePayload = (box) => box ? Object.fromEntries(
  SHIPMENT_PACKAGE_FIELDS.map((key) => [key, key === 'includes_insurance' ? !!box[key]
    : ['carrier', 'tracking_number'].includes(key) ? String(box[key] || '').trim()
      : String(box[key] ?? '').trim() || null]),
) : null;
