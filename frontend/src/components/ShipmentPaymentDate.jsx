import { V, c } from '../utils.js';

const displayDate = (value) => value ? value.split('-').reverse().join('/') : '';

export default function ShipmentPaymentDate({ shipment, onSave }) {
  const [editing, setEditing] = V.useState(false);
  const [draft, setDraft] = V.useState('');
  const [saving, setSaving] = V.useState(false);
  const cancelled = V.useRef(false);
  const canEdit = ['PENDING', 'PREPARING'].includes(shipment.status);
  const created = shipment.created_at ? new Date(shipment.created_at).toLocaleDateString('es-MX', { timeZone: 'America/Matamoros' }) : 'Sin fecha';
  const title = `Creado: ${created}. ${shipment.payment_date ? `Pago: ${displayDate(shipment.payment_date)}.` : 'Pago pendiente; el reporte usa la fecha de creación.'}${canEdit ? ' Editar fecha de pago.' : ''}`;
  const label = shipment.payment_date ? `Pago: ${displayDate(shipment.payment_date)}` : `Creado: ${created}`;
  const finish = async () => {
    if (cancelled.current) return;
    setEditing(false);
    if (draft === (shipment.payment_date || '')) return;
    setSaving(true);
    try { await onSave(shipment, draft); }
    finally { setSaving(false); }
  };

  if (editing) return c.jsx('input', {
    type: 'date',
    autoFocus: true,
    value: draft,
    'aria-label': `Fecha de pago del envío de ${shipment.client_name || 'cliente'}`,
    title,
    className: 'shipment-payment-date-input',
    onChange: (event) => setDraft(event.target.value),
    onBlur: finish,
    onKeyDown: (event) => {
      if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); }
      if (event.key === 'Escape') { cancelled.current = true; setEditing(false); }
    },
  });

  return c.jsx('button', {
    type: 'button',
    disabled: !canEdit || saving,
    'aria-label': `${canEdit ? 'Editar fecha de pago' : 'Fecha de pago'} del envío de ${shipment.client_name || 'cliente'}`,
    title,
    onClick: () => { cancelled.current = false; setDraft(shipment.payment_date || ''); setEditing(true); },
    className: 'shipment-payment-date',
    children: saving ? 'Guardando…' : label,
  });
}
