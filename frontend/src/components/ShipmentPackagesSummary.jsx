import { getShipmentPackages, getPublicPackageSalePriceLabel } from '../shipmentPackages.js';
import { getShipmentTrackingUrl, MODULE_AMOUNT_FORMAT } from '../utils.js';

export default function ShipmentPackagesSummary({ shipment, compact = false }) {
  return <div className={compact ? 'mt-1 space-y-1' : 'space-y-2'}>
    {getShipmentPackages(shipment).map((box, index) => {
      const tracking = String(box.tracking_number || '').trim();
      const trackingUrl = getShipmentTrackingUrl(box.carrier, tracking);
      const priceLabel = getPublicPackageSalePriceLabel(box, (value) => MODULE_AMOUNT_FORMAT.format(value));
      return <div key={index} className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
        <span className="shrink-0 font-bold text-text-main dark:text-white">Caja {index + 1}</span>
        <span className="min-w-0 break-all text-text-sub">{box.carrier || 'Paquetería pendiente'}{tracking ? ` · ${tracking}` : ''}</span>
        {priceLabel && <span className="font-bold text-emerald-700 dark:text-emerald-300">{priceLabel}</span>}
        {!compact && trackingUrl && <a href={trackingUrl} target="_blank" rel="noreferrer noopener" className="font-semibold text-primary hover:underline">Rastrear caja {index + 1} ↗</a>}
      </div>;
    })}
  </div>;
}
