export default function ShipmentInternalComment({ value, onChange }) {
  return (
    <details className="rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-900/50">
      <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
        Comentario interno{value?.trim() ? ' · Con nota' : ''}
      </summary>
      <textarea
        aria-label="Comentario interno"
        className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-600 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-400"
        rows={2}
        maxLength={1000}
        value={value || ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Solo para el equipo y el reporte de gastos"
      />
    </details>
  );
}
