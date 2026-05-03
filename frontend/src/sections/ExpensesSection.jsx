import { V, c, NATIVE_DROPDOWN_OPTION_STYLE } from '../utils.js';
import { useApp, useAppServices } from '../AppContext.jsx';

const today = () => new Date().toISOString().slice(0, 10);
const monthBounds = (month) => [`${month}-01`, new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).toISOString().slice(0, 10)];
const MONTH_NAMES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
const currentYear = () => new Date().getFullYear();
const currentMonthNumber = () => new Date().getMonth() + 1;
const padMonth = (value) => String(value).padStart(2, '0');
const currentMonthKey = () => `${currentYear()}-${padMonth(currentMonthNumber())}`;

const ExpensesSection = V.memo(function ExpensesSection() {
  const { isDesktopLayout } = useApp();
  const { apiFetch, confirmAction, notifySuccess, notifyError, formatAmount } = useAppServices();
  const apiFetchRef = V.useRef(apiFetch);
  const nowYear = currentYear();
  const [month, setMonth] = V.useState(currentMonthKey());
  const [monthPickerOpen, setMonthPickerOpen] = V.useState(false);
  const [expenses, setExpenses] = V.useState([]);
  const [saving, setSaving] = V.useState(false);
  const [form, setForm] = V.useState({ expense_date: today(), expense_type: '', description: '', amount: '' });
  const selectedYear = Number(month.slice(0, 4));
  const selectedMonth = Number(month.slice(5, 7));
  const yearOptions = V.useMemo(() => [nowYear, nowYear - 1, nowYear - 2], [nowYear]);
  const monthLimit = selectedYear === nowYear ? currentMonthNumber() : 12;
  const monthLabel = `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`;
  V.useEffect(() => { apiFetchRef.current = apiFetch; }, [apiFetch]);
  const loadExpenses = V.useCallback(async () => {
    const [start, end] = monthBounds(month);
    setExpenses(await apiFetchRef.current(`/expenses/?start=${start}&end=${end}`) || []);
  }, [month]);
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
      await apiFetchRef.current('/expenses/', { method: 'POST', body: JSON.stringify({ ...form, expense_type: form.expense_type.trim(), amount: Number(form.amount) }) });
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
  const deleteExpense = async (expense) => {
    if (!expense || !expense.id) return;
    const confirmed = typeof confirmAction === 'function'
      ? await confirmAction({
        title: 'Eliminar gasto',
        message: 'Este gasto se quitara del historial.',
        confirmLabel: 'Eliminar',
        cancelLabel: 'Cancelar',
        tone: 'danger',
      })
      : window.confirm('Eliminar este gasto?');
    if (!confirmed) return;
    try {
      await apiFetchRef.current(`/expenses/${expense.id}/`, { method: 'DELETE' });
      await loadExpenses();
      notifySuccess('Gasto eliminado.');
    } catch (error) {
      console.error('Failed deleting expense', error);
      notifyError((error && error.message) || 'No se pudo eliminar el gasto.');
    }
  };
  return c.jsxs('div', { className: isDesktopLayout ? 'space-y-5' : 'hidden', children: [
    c.jsxs('div', { className: 'flex items-center justify-between gap-4', children: [
      c.jsx('h2', { className: 'text-lg font-bold text-text-main dark:text-white', children: 'Gastos' }),
      c.jsxs('div', { className: 'relative', children: [
        c.jsxs('button', { type: 'button', onClick: () => setMonthPickerOpen((value) => !value), className: 'flex min-w-[170px] items-center justify-between gap-3 rounded-xl border border-border-light bg-white px-3 py-2 text-sm font-bold text-text-main shadow-sm hover:bg-slate-50 dark:border-border-dark dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800', children: [
          monthLabel,
          c.jsx('span', { className: 'material-symbols-outlined text-[18px] text-text-sub', children: 'expand_more' }),
        ] }),
        monthPickerOpen &&
        c.jsxs('div', { className: 'absolute right-0 top-full z-50 mt-2 grid w-[320px] grid-cols-[1fr_92px] overflow-hidden rounded-2xl border border-border-light bg-white shadow-xl dark:border-border-dark dark:bg-slate-900', children: [
          c.jsx('div', { className: 'grid grid-cols-2 gap-1 p-3', children: MONTH_NAMES.slice(0, monthLimit).map((name, index) => {
            const monthNumber = index + 1;
            const active = monthNumber === selectedMonth;
            return c.jsx('button', { type: 'button', onClick: () => {
              setMonth(`${selectedYear}-${padMonth(monthNumber)}`);
              setMonthPickerOpen(false);
            }, className: `rounded-lg px-2 py-2 text-left text-[11px] font-bold transition ${active ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`, children: name }, name);
          }) }),
          c.jsx('div', { className: 'border-l border-border-light p-2 dark:border-border-dark', children: yearOptions.map((year) => {
            const active = year === selectedYear;
            return c.jsx('button', { type: 'button', onClick: () => {
              const nextMonth = year === nowYear && selectedMonth > currentMonthNumber() ? currentMonthNumber() : selectedMonth;
              setMonth(`${year}-${padMonth(nextMonth)}`);
            }, className: `mb-1 w-full rounded-lg px-2 py-2 text-xs font-bold transition ${active ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'}`, children: year }, year);
          }) }),
        ] }),
      ] }),
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
      c.jsx('thead', { className: 'bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400', children: c.jsxs('tr', { children: ['Fecha', 'Tipo', 'Descripcion', 'Monto', ''].map((header) => c.jsx('th', { className: 'px-4 py-3 font-bold', children: header }, header || 'actions')) }) }),
      c.jsx('tbody', { className: 'divide-y divide-border-light dark:divide-border-dark', children: (expenses || []).slice(0, 50).map((expense) => c.jsxs('tr', { className: 'text-text-main dark:text-white', children: [
        c.jsx('td', { className: 'px-4 py-3 whitespace-nowrap', children: expense.expense_date }),
        c.jsx('td', { className: 'px-4 py-3 font-semibold', children: expense.expense_type }),
        c.jsx('td', { className: 'px-4 py-3 text-text-sub dark:text-slate-400', children: expense.description || '-' }),
        c.jsx('td', { className: 'px-4 py-3 font-bold', children: `$${formatAmount ? formatAmount(expense.amount) : expense.amount}` }),
        c.jsx('td', { className: 'px-4 py-3 text-right', children: c.jsx('button', { type: 'button', onClick: () => deleteExpense(expense), title: 'Eliminar gasto', className: 'inline-flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30', children: c.jsx('span', { className: 'material-symbols-outlined text-[18px]', children: 'delete' }) }) }),
      ] }, expense.id)) }),
    ] }) }),
  ] });
});

export default ExpensesSection;
