import { V, c, NATIVE_DROPDOWN_OPTION_STYLE } from '../utils.js';
import { useApp } from '../AppContext.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const monthBounds = (month) => [`${month}-01`, new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10)];
const MONTH_NAMES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const currentYear = () => new Date().getFullYear();
const currentMonthNumber = () => new Date().getMonth() + 1;
const padMonth = (value) => String(value).padStart(2, '0');
const currentMonthKey = () => `${currentYear()}-${padMonth(currentMonthNumber())}`;

const ExpensesSection = V.memo(function ExpensesSection() {
  const { apiFetch, notifySuccess, notifyError, isDesktopLayout, formatAmount } = useApp();
  const nowYear = currentYear();
  const [month, setMonth] = V.useState(currentMonthKey());
  const [expenses, setExpenses] = V.useState([]);
  const [saving, setSaving] = V.useState(false);
  const [form, setForm] = V.useState({ expense_date: today(), expense_type: '', description: '', amount: '' });
  const monthOptions = V.useMemo(() => {
    const options = [];
    for (let year = nowYear - 2; year <= nowYear; year += 1) {
      const limit = year === nowYear ? currentMonthNumber() : 12;
      for (let monthNumber = 1; monthNumber <= limit; monthNumber += 1) {
        options.push({
          value: `${year}-${padMonth(monthNumber)}`,
          label: `${MONTH_NAMES[monthNumber - 1]} ${year}`,
        });
      }
    }
    return options.reverse();
  }, [nowYear]);
  const loadExpenses = V.useCallback(async () => {
    const [start, end] = monthBounds(month);
    setExpenses(await apiFetch(`/expenses/?start=${start}&end=${end}`) || []);
  }, [apiFetch, month]);
  V.useEffect(() => { loadExpenses().catch((error) => console.error('Failed loading expenses', error)); }, [loadExpenses]);
  const types = V.useMemo(() => [...new Set((expenses || []).map((expense) => expense.expense_type).filter(Boolean))], [expenses]);
  const lastAmount = V.useMemo(() => {
    const match = (expenses || []).find((expense) => String(expense.expense_type || '').toLowerCase() === String(form.expense_type || '').toLowerCase());
    return match ? match.amount : '';
  }, [expenses, form.expense_type]);
  const saveExpense = async (event) => {
    event.preventDefault();
    if (!form.expense_type.trim() || !(Number(form.amount) > 0)) return notifyError('Captura tipo de gasto y monto.');
    setSaving(true);
    try {
      await apiFetch('/expenses/', { method: 'POST', body: JSON.stringify({ ...form, expense_type: form.expense_type.trim(), amount: Number(form.amount) }) });
      setForm({ expense_date: today(), expense_type: form.expense_type, description: '', amount: '' });
      await loadExpenses();
      notifySuccess('Gasto guardado.');
    } catch (error) {
      console.error('Failed saving expense', error);
      notifyError((error && error.message) || 'No se pudo guardar el gasto.');
    } finally {
      setSaving(false);
    }
  };
  return c.jsxs('div', { className: isDesktopLayout ? 'space-y-5' : 'hidden', children: [
    c.jsxs('div', { className: 'flex items-center justify-between gap-4', children: [
      c.jsx('h2', { className: 'text-lg font-bold text-text-main dark:text-white', children: 'Gastos' }),
      c.jsx('select', { value: month, onChange: (event) => setMonth(event.target.value), className: 'rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 px-3 py-2 text-sm font-bold dark:text-white', children: monthOptions.map((option) => c.jsx('option', { value: option.value, children: option.label }, option.value)) }),
    ] }),
    c.jsxs('form', { onSubmit: saveExpense, className: 'grid grid-cols-1 gap-3 rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 md:grid-cols-[150px_1fr_1.5fr_150px_auto]', children: [
      c.jsx('input', { type: 'date', value: form.expense_date, onChange: (event) => setForm({ ...form, expense_date: event.target.value }), className: 'rounded-xl border dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm dark:text-white' }),
      c.jsxs('div', { children: [
        c.jsx('input', { list: 'expense-types', value: form.expense_type, onChange: (event) => setForm({ ...form, expense_type: event.target.value }), placeholder: 'Tipo de gasto', className: 'w-full rounded-xl border dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm dark:text-white' }),
        c.jsx('datalist', { id: 'expense-types', children: types.map((type) => c.jsx('option', { value: type, style: NATIVE_DROPDOWN_OPTION_STYLE }, type)) }),
      ] }),
      c.jsx('input', { value: form.description, maxLength: 255, onChange: (event) => setForm({ ...form, description: event.target.value }), placeholder: 'Descripcion corta', className: 'rounded-xl border dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm dark:text-white' }),
      c.jsx('input', { type: 'number', min: '0', step: '0.01', value: form.amount, onChange: (event) => setForm({ ...form, amount: event.target.value }), placeholder: lastAmount ? `Ultimo ${lastAmount}` : 'Monto', className: 'rounded-xl border dark:border-slate-700 dark:bg-slate-900 px-3 py-2 text-sm dark:text-white' }),
      c.jsx('button', { disabled: saving, className: 'rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary-dark disabled:opacity-60', children: saving ? 'Guardando...' : 'Guardar' }),
    ] }),
    c.jsx('div', { className: 'overflow-hidden rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark', children: c.jsxs('table', { className: 'w-full text-left text-sm', children: [
      c.jsx('thead', { className: 'bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400', children: c.jsxs('tr', { children: ['Fecha', 'Tipo', 'Descripcion', 'Monto'].map((header) => c.jsx('th', { className: 'px-4 py-3 font-bold', children: header }, header)) }) }),
      c.jsx('tbody', { className: 'divide-y divide-border-light dark:divide-border-dark', children: (expenses || []).slice(0, 50).map((expense) => c.jsxs('tr', { className: 'text-text-main dark:text-white', children: [
        c.jsx('td', { className: 'px-4 py-3 whitespace-nowrap', children: expense.expense_date }),
        c.jsx('td', { className: 'px-4 py-3 font-semibold', children: expense.expense_type }),
        c.jsx('td', { className: 'px-4 py-3 text-text-sub dark:text-slate-400', children: expense.description || '-' }),
        c.jsx('td', { className: 'px-4 py-3 font-bold', children: `$${formatAmount ? formatAmount(expense.amount) : expense.amount}` }),
      ] }, expense.id)) }),
    ] }) }),
  ] });
});

export default ExpensesSection;
