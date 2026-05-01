import { V } from "../utils.js";
import { createPortal } from "react-dom";

const emptyForm = {
  name: "",
  description: "",
  tags: "",
  real_price: "",
  charged_price: "",
  stock_quantity: "1",
  apply_discount: true,
  discount_percentage: "0",
  discount_uses_global: true,
  is_active: true,
};

export const createEmptyStockProductForm = () => ({ ...emptyForm });

const toNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const StockProductModal = V.memo(function StockProductModal({
  open,
  form,
  setForm,
  imagePreviewUrl,
  onPickImage,
  onSubmit,
  onClose,
  saving,
  isEditing,
  calcMode,
  calcFactor,
  calcTaxes,
  calcCommission,
  calcExchangeRate,
  calcDiscount,
  applyCalcModeChange,
  applyCalcFactorChange,
  applyCalcTaxesChange,
  applyCalcCommissionChange,
  applyCalcExchangeRateChange,
}) {
  if (!open || typeof document === "undefined") return null;

  const updateForm = (patch) => setForm((value) => ({ ...value, ...patch }));
  const effectiveDiscount = form.discount_uses_global ? calcDiscount : form.discount_percentage;
  const discountMultiplier = form.apply_discount ? Math.max(0, 1 - toNumber(effectiveDiscount) / 100) : 1;
  const priceMultiplier =
    String(calcMode).toUpperCase() === "FACTOR"
      ? toNumber(calcFactor) * discountMultiplier
      : discountMultiplier *
        (1 + toNumber(calcCommission) / 100) *
        (1 + toNumber(calcTaxes) / 100) *
        toNumber(calcExchangeRate);
  const updateRealPrice = (value) => {
    const parsed = parseFloat(value);
    updateForm({
      real_price: value,
      charged_price:
        Number.isFinite(parsed) && Number.isFinite(priceMultiplier)
          ? (parsed * priceMultiplier).toFixed(2)
          : form.charged_price,
    });
  };
  const updateChargedPrice = (value) => {
    const parsed = parseFloat(value);
    updateForm({
      charged_price: value,
      real_price:
        Number.isFinite(parsed) && Number.isFinite(priceMultiplier) && priceMultiplier > 0
          ? (parsed / priceMultiplier).toFixed(2)
          : form.real_price,
    });
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[98] flex items-end justify-center overflow-y-auto bg-black/55 p-3 sm:items-center sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl rounded-t-3xl border border-border-light bg-surface-light p-5 shadow-2xl dark:border-border-dark dark:bg-surface-dark sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Catalogo de Stock</p>
            <h3 className="text-xl font-black text-text-main dark:text-white">
              {isEditing ? "Editar producto" : "Agregar producto"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {imagePreviewUrl && (
              <button
                type="button"
                onClick={onPickImage}
                title="Cambiar imagen"
                aria-label="Cambiar imagen del producto"
                className="h-10 w-10 overflow-hidden rounded-full border border-border-light bg-slate-100 shadow-sm dark:border-border-dark dark:bg-slate-900"
              >
                <img src={imagePreviewUrl} className="h-full w-full object-cover" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-light text-text-sub hover:bg-slate-100 dark:border-border-dark dark:hover:bg-slate-800"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid max-h-[78vh] grid-cols-1 gap-4 overflow-y-auto pr-1 ios-scroll md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Producto</label>
            <input
              value={form.name}
              onChange={(event) => updateForm({ name: event.target.value })}
              className="w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Costo USD</label>
            <input
              type="number"
              step="0.01"
              value={form.real_price}
              onChange={(event) => updateRealPrice(event.target.value)}
              className="w-full rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-2.5 font-bold text-sky-900 outline-none focus:ring-2 focus:ring-sky-300 dark:border-sky-800 dark:bg-sky-950/20 dark:text-sky-100"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Costo de Venta MXN</label>
            <input
              type="number"
              step="0.01"
              value={form.charged_price}
              onChange={(event) => updateChargedPrice(event.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-100"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Piezas en stock</label>
            <input
              type="number"
              min="0"
              step="1"
              value={form.stock_quantity}
              onChange={(event) => updateForm({ stock_quantity: event.target.value })}
              className="w-full rounded-xl border px-4 py-2.5 font-bold outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Imagen</label>
            <button
              type="button"
              onClick={onPickImage}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 px-4 py-2.5 text-sm font-bold text-primary hover:bg-primary/5"
            >
              <span className="material-symbols-outlined text-[18px]">add_photo_alternate</span>
              {imagePreviewUrl ? "Cambiar imagen" : "Seleccionar imagen"}
            </button>
          </div>

          <div className="rounded-2xl border border-border-light p-3 dark:border-border-dark">
            <label className="mb-2 block text-sm font-bold text-text-main dark:text-white">Modo de calculo</label>
            <div className="grid grid-cols-2 rounded-xl border border-border-light bg-slate-50 p-1 dark:border-border-dark dark:bg-slate-900">
              <button type="button" onClick={() => applyCalcModeChange("FACTOR")} className={`rounded-lg py-2 text-xs font-black ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-text-sub"}`}>Factor</button>
              <button type="button" onClick={() => applyCalcModeChange("PERCENTAGE")} className={`rounded-lg py-2 text-xs font-black ${calcMode === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-text-sub"}`}>Porcentaje</button>
            </div>
          </div>

          <div className="rounded-2xl border border-border-light p-3 dark:border-border-dark">
            {calcMode === "FACTOR" ? (
              <>
                <label className="mb-2 block text-sm font-bold text-text-main dark:text-white">Factor</label>
                <input type="number" step="0.01" value={calcFactor} onChange={(event) => applyCalcFactorChange(event.target.value)} className="w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900" />
              </>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                <input type="number" step="0.01" value={calcTaxes} onChange={(event) => applyCalcTaxesChange(event.target.value)} placeholder="Tax" className="rounded-xl border px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <input type="number" step="0.01" value={calcCommission} onChange={(event) => applyCalcCommissionChange(event.target.value)} placeholder="Comision" className="rounded-xl border px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
                <input type="number" step="0.01" value={calcExchangeRate} onChange={(event) => applyCalcExchangeRateChange(event.target.value)} placeholder="TC" className="rounded-xl border px-3 py-2.5 text-sm outline-none dark:border-slate-700 dark:bg-slate-900" />
              </div>
            )}
          </div>

          <div className="md:col-span-2 grid gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-950/20 md:grid-cols-[1fr_150px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-amber-900 dark:text-amber-100">Aplicar descuento</p>
                <p className="text-xs text-amber-700 dark:text-amber-300">Usa el descuento global o uno especial para este producto.</p>
              </div>
              <button type="button" onClick={() => updateForm({ apply_discount: !form.apply_discount })} className={`h-7 w-12 rounded-full border ${form.apply_discount ? "bg-amber-500" : "bg-slate-300"}`} />
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={effectiveDiscount}
              onChange={(event) => updateForm({ discount_percentage: event.target.value, discount_uses_global: false })}
              className="rounded-xl border border-amber-200 px-3 py-2.5 font-bold text-amber-900 outline-none dark:border-amber-800 dark:bg-slate-900 dark:text-amber-100"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Descripcion</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(event) => updateForm({ description: event.target.value })}
              className="w-full resize-none rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Tags</label>
            <input
              value={form.tags}
              onChange={(event) => updateForm({ tags: event.target.value })}
              placeholder="Talla, marca, color..."
              className="w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
            />
          </div>

          <div className="md:col-span-2 flex justify-end gap-2 border-t border-border-light pt-4 dark:border-border-dark">
            <button type="button" onClick={onClose} className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-black text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
});

export default StockProductModal;
