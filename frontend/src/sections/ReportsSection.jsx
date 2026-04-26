import { V, c } from '../utils.js';
import { useApp } from '../AppContext.jsx';
import { downloadGeneralWorkbook } from '../reportWorkbook.js';

const dateOnly = (date) => date.toISOString().slice(0, 10);
const monthStart = () => {
  const now = new Date();
  return dateOnly(new Date(now.getFullYear(), now.getMonth(), 1));
};

const ReportsSection = V.memo(function ReportsSection() {
  const { apiFetch, missions, shipments, users, isDesktopLayout, notifySuccess, notifyInfo, notifyError } = useApp();
  const [startDate, setStartDate] = V.useState(monthStart());
  const [endDate, setEndDate] = V.useState(dateOnly(new Date()));
  const [generating, setGenerating] = V.useState(false);
  const generateReport = async () => {
    if (startDate && endDate && startDate > endDate) return notifyError('El rango de fechas no es valido.');
    setGenerating(true);
    try {
      const [shipmentsResult, expensesResult] = await Promise.allSettled([
        Array.isArray(shipments) && shipments.length ? Promise.resolve(shipments) : apiFetch('/shipments/'),
        apiFetch(`/expenses/?start=${startDate || ''}&end=${endDate || ''}`),
      ]);
      const reportShipments = shipmentsResult.status === 'fulfilled' ? shipmentsResult.value || [] : [];
      const reportExpenses = expensesResult.status === 'fulfilled' ? expensesResult.value || [] : [];
      downloadGeneralWorkbook({ missions, shipments: reportShipments, expenses: reportExpenses, users, startDate, endDate });
      if (shipmentsResult.status === 'rejected' || expensesResult.status === 'rejected') {
        notifyInfo('Reporte generado con la informacion disponible.');
      } else {
        notifySuccess('Reporte generado.');
      }
    } catch (error) {
      console.error('Failed generating report', error);
      notifyError((error && error.message) || 'No se pudo generar el reporte.');
    } finally {
      setGenerating(false);
    }
  };
  return c.jsxs('div', { className: isDesktopLayout ? 'space-y-5' : 'hidden', children: [
    c.jsx('h2', { className: 'text-lg font-bold text-text-main dark:text-white', children: 'Reportes' }),
    c.jsxs('div', { className: 'rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-5 space-y-4 max-w-3xl', children: [
      c.jsxs('div', { children: [
        c.jsx('h3', { className: 'text-sm font-bold text-text-main dark:text-white', children: 'Reporte general' }),
        c.jsx('p', { className: 'mt-1 text-xs text-text-sub dark:text-slate-400', children: 'Incluye SHOPPIING, ENVIOS y GASTOS en el mismo archivo.' }),
      ] }),
      c.jsxs('div', { className: 'grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]', children: [
        c.jsxs('label', { className: 'text-xs font-bold text-text-sub dark:text-slate-400', children: [
          'Desde',
          c.jsx('input', { type: 'date', value: startDate, onChange: (event) => setStartDate(event.target.value), className: 'mt-1 w-full rounded-xl border dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm font-normal text-text-main dark:text-white' }),
        ] }),
        c.jsxs('label', { className: 'text-xs font-bold text-text-sub dark:text-slate-400', children: [
          'Hasta',
          c.jsx('input', { type: 'date', value: endDate, onChange: (event) => setEndDate(event.target.value), className: 'mt-1 w-full rounded-xl border dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm font-normal text-text-main dark:text-white' }),
        ] }),
        c.jsx('button', { onClick: generateReport, disabled: generating, className: 'self-end rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60', children: generating ? 'Generando...' : 'Descargar Excel' }),
      ] }),
    ] }),
  ] });
});

export default ReportsSection;
