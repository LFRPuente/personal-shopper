import { V, getUserOptionLabel } from "../utils.js";
import { createPortal } from "react-dom";

const emptyForm = {
  name: "",
  description: "",
  tags: "",
  real_price: "",
  charged_price: "",
  stock_quantity: "1",
  auto_calc: true,
    apply_discount: false,
    discount_percentage: "0",
    discount_uses_global: false,
  payer: "",
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
  payerUserOptions,
  applyCalcModeChange,
  applyCalcFactorChange,
  applyCalcTaxesChange,
  applyCalcCommissionChange,
  applyCalcExchangeRateChange,
}) {
  const priceSyncSourceRef = V.useRef("real");
  const [imagePreviewOpen, setImagePreviewOpen] = V.useState(false);

  V.useEffect(() => {
    if (!open) setImagePreviewOpen(false);
  }, [open]);

  const getPriceMultiplier = V.useCallback(() => {
    const baseMultiplier =
      String(calcMode).toUpperCase() === "FACTOR"
        ? toNumber(calcFactor)
        : (1 + toNumber(calcCommission) / 100) *
          (1 + toNumber(calcTaxes) / 100) *
          toNumber(calcExchangeRate);
    const discountMultiplier = form.apply_discount ? Math.max(0, 1 - toNumber(form.discount_percentage) / 100) : 1;
    return baseMultiplier * discountMultiplier;
  }, [
    calcMode,
    calcFactor,
    calcTaxes,
    calcCommission,
    calcExchangeRate,
    form.apply_discount,
    form.discount_percentage,
  ]);

  V.useEffect(() => {
    if (!open || typeof document === "undefined") return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        if (imagePreviewOpen) {
          setImagePreviewOpen(false);
          return;
        }
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, imagePreviewOpen, onClose]);

  V.useEffect(() => {
    if (!open || !form.auto_calc) return;
    const priceMultiplier = getPriceMultiplier();
    if (!Number.isFinite(priceMultiplier) || priceMultiplier <= 0) return;
    if (priceSyncSourceRef.current === "charged") {
      const parsed = parseFloat(form.charged_price);
      if (!Number.isFinite(parsed)) return;
      const nextRealPrice = (parsed / priceMultiplier).toFixed(2);
      if (String(form.real_price || "") !== nextRealPrice) {
        setForm((value) => ({ ...value, real_price: nextRealPrice }));
      }
      return;
    }
    const parsed = parseFloat(form.real_price);
    if (!Number.isFinite(parsed)) return;
    const nextChargedPrice = (parsed * priceMultiplier).toFixed(2);
    if (String(form.charged_price || "") !== nextChargedPrice) {
      setForm((value) => ({ ...value, charged_price: nextChargedPrice }));
    }
  }, [
    open,
    form.auto_calc,
    form.real_price,
    form.charged_price,
    getPriceMultiplier,
    setForm,
  ]);

  if (!open || typeof document === "undefined") return null;

  const updateForm = (patch) => setForm((value) => ({ ...value, ...patch }));
  const effectiveDiscount = form.discount_percentage;
  const discountMultiplier = form.apply_discount ? Math.max(0, 1 - toNumber(effectiveDiscount) / 100) : 1;
  const basePriceMultiplier =
    String(calcMode).toUpperCase() === "FACTOR"
      ? toNumber(calcFactor)
      : (1 + toNumber(calcCommission) / 100) *
        (1 + toNumber(calcTaxes) / 100) *
        toNumber(calcExchangeRate);
  const priceMultiplier = basePriceMultiplier * discountMultiplier;
  const getAutoChargedPrice = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && Number.isFinite(priceMultiplier)
      ? (parsed * priceMultiplier).toFixed(2)
      : form.charged_price;
  };
  const getAutoRealPrice = (value) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) && Number.isFinite(priceMultiplier) && priceMultiplier > 0
      ? (parsed / priceMultiplier).toFixed(2)
      : form.real_price;
  };
  const updateRealPrice = (value) => {
    priceSyncSourceRef.current = "real";
    updateForm({
      real_price: value,
      charged_price: form.auto_calc ? getAutoChargedPrice(value) : form.charged_price,
    });
  };
  const updateChargedPrice = (value) => {
    priceSyncSourceRef.current = "charged";
    updateForm({
      charged_price: value,
      real_price: form.auto_calc ? getAutoRealPrice(value) : form.real_price,
    });
  };
  const toggleAutoCalc = () =>
    updateForm({
      auto_calc: !form.auto_calc,
      charged_price:
        !form.auto_calc && priceSyncSourceRef.current !== "charged"
          ? getAutoChargedPrice(form.real_price)
          : form.charged_price,
      real_price:
        !form.auto_calc && priceSyncSourceRef.current === "charged"
          ? getAutoRealPrice(form.charged_price)
          : form.real_price,
    });
  const toggleDiscount = () => {
    const nextApplyDiscount = !form.apply_discount;
    const nextMultiplier = basePriceMultiplier * (nextApplyDiscount ? Math.max(0, 1 - toNumber(effectiveDiscount) / 100) : 1);
    const parsed = parseFloat(form.real_price);
    updateForm({
      apply_discount: nextApplyDiscount,
      charged_price:
        form.auto_calc && Number.isFinite(parsed) && Number.isFinite(nextMultiplier)
          ? (parsed * nextMultiplier).toFixed(2)
          : form.charged_price,
    });
  };
  const updateDiscount = (value) => {
    const nextMultiplier = basePriceMultiplier * (form.apply_discount ? Math.max(0, 1 - toNumber(value) / 100) : 1);
    const parsed = parseFloat(form.real_price);
    updateForm({
      discount_percentage: value,
      discount_uses_global: false,
      charged_price:
        form.auto_calc && Number.isFinite(parsed) && Number.isFinite(nextMultiplier)
          ? (parsed * nextMultiplier).toFixed(2)
          : form.charged_price,
    });
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[98] flex items-end justify-center overflow-y-auto bg-black/55 p-3 sm:items-center sm:p-5"
        onClick={onClose}
      >
        <div
          className="w-full max-w-4xl rounded-2xl border border-border-light bg-surface-light p-5 shadow-2xl dark:border-border-dark dark:bg-surface-dark"
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
                  onClick={() => setImagePreviewOpen(true)}
                  title="Ver imagen"
                  aria-label="Ver imagen del producto"
                  className="h-10 w-10 overflow-hidden rounded-lg border border-border-light bg-slate-100 shadow-sm dark:border-border-dark dark:bg-slate-900"
                >
                  <img src={imagePreviewUrl} className="h-full w-full object-cover" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-border-light text-text-sub hover:bg-slate-100 dark:border-border-dark dark:hover:bg-slate-800"
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-bold text-text-main dark:text-white">Quien pago</label>
            <select
              value={form.payer}
              onChange={(event) => updateForm({ payer: event.target.value })}
              className="w-full rounded-xl border px-4 py-2.5 outline-none focus:ring-2 focus:ring-primary dark:border-slate-700 dark:bg-slate-900"
              required
            >
              <option value="" disabled>
                {payerUserOptions && payerUserOptions.length ? "Selecciona quien pago" : "Sin usuarios disponibles"}
              </option>
              {(payerUserOptions || []).map((user) => (
                <option key={`stock-payer-${user.id}`} value={user.id}>
                  {getUserOptionLabel(user)}
                </option>
              ))}
            </select>
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
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-sm font-bold text-text-main dark:text-white">Costo de Venta MXN</label>
            </div>
            <input
              type="number"
              step="0.01"
              value={form.charged_price}
              onChange={(event) => updateChargedPrice(event.target.value)}
              className="w-full rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-2.5 font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-100"
              required
            />
            <div className="mt-2 flex items-center justify-between gap-3 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-900">
              <span className="text-xs font-black text-text-sub">Calculo automatico</span>
              <button type="button" role="switch" aria-checked={form.auto_calc} onClick={toggleAutoCalc} className={`h-6 w-11 rounded-full border p-0.5 transition ${form.auto_calc ? "border-primary bg-primary" : "border-slate-300 bg-slate-300 dark:border-slate-700 dark:bg-slate-700"}`}>
                <span className={`block h-4 w-4 rounded-full bg-white transition ${form.auto_calc ? "translate-x-5" : ""}`} />
              </button>
            </div>
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

          <div className="rounded-xl border border-border-light p-3 dark:border-border-dark">
            <label className="mb-2 block text-sm font-bold text-text-main dark:text-white">Modo de calculo</label>
            <div className="grid grid-cols-2 rounded-xl border border-border-light bg-slate-50 p-1 dark:border-border-dark dark:bg-slate-900">
              <button type="button" onClick={() => applyCalcModeChange("FACTOR")} className={`rounded-lg py-2 text-xs font-black ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-text-sub"}`}>Factor</button>
              <button type="button" onClick={() => applyCalcModeChange("PERCENTAGE")} className={`rounded-lg py-2 text-xs font-black ${calcMode === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-text-sub"}`}>Porcentaje</button>
            </div>
          </div>

          <div className="rounded-xl border border-border-light p-3 dark:border-border-dark">
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

          <div className="md:col-span-2 grid gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800 dark:bg-amber-950/20 md:grid-cols-[1fr_150px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-amber-900 dark:text-amber-100">Aplicar descuento</p>
              </div>
              <button type="button" onClick={toggleDiscount} className={`h-7 w-12 rounded-full border p-0.5 transition ${form.apply_discount ? "border-amber-500 bg-amber-500" : "border-slate-300 bg-slate-300 dark:border-slate-700 dark:bg-slate-700"}`}>
                <span className={`block h-5 w-5 rounded-full bg-white transition ${form.apply_discount ? "translate-x-5" : ""}`} />
              </button>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              value={effectiveDiscount}
              onChange={(event) => updateDiscount(event.target.value)}
              disabled={!form.apply_discount}
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

          <div className="md:col-span-2 flex justify-end gap-2 border-t border-border-light pt-4 dark:border-border-dark">
            <button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100">Cancelar</button>
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-black text-white hover:bg-primary-dark disabled:cursor-wait disabled:opacity-70">
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
        </div>
      </div>
      {imagePreviewOpen && imagePreviewUrl && (
        <div
          className="fixed inset-0 z-[140] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setImagePreviewOpen(false)}
        >
          <div className="relative max-h-[92vh] max-w-[95vw]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setImagePreviewOpen(false)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow"
              aria-label="Cerrar imagen"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img src={imagePreviewUrl} className="max-h-[92vh] max-w-[95vw] rounded-xl bg-black object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </>,
    document.body,
  );
});

export default StockProductModal;
