import { V } from "../utils.js";
import { createPortal } from "react-dom";

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
};

const getOrderStamp = (order) => {
  const parsed = order && order.created_at ? new Date(order.created_at).getTime() : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

const StockSalesModal = V.memo(function StockSalesModal({ product, onClose }) {
  const orders = Array.isArray(product && product.orders)
    ? [...product.orders].sort((left, right) => getOrderStamp(left) - getOrderStamp(right))
    : [];

  V.useEffect(() => {
    if (!product || typeof document === "undefined") return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [product, onClose]);

  if (!product || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/55 p-3 sm:items-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl border border-border-light bg-surface-light p-5 shadow-2xl dark:border-border-dark dark:bg-surface-dark sm:rounded-3xl" onClick={(event) => event.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">Ventas de stock</p>
            <h3 className="truncate text-xl font-black text-text-main dark:text-white">{product.name}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-light text-text-sub hover:bg-slate-100 dark:border-border-dark dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 ios-scroll">
          {orders.length ? orders.map((order) => (
            <div key={`stock-sale-${order.id}`} className="rounded-2xl border border-border-light bg-white p-3 dark:border-border-dark dark:bg-slate-900">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-text-main dark:text-white">{order.customer_name || "Sin nombre"}</p>
                  <p className="mt-1 text-xs font-bold text-text-sub">{order.customer_phone || "Sin telefono"}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">x{order.quantity || 1}</span>
              </div>
              {formatDate(order.created_at) && <p className="mt-2 text-[11px] font-semibold text-text-sub">{formatDate(order.created_at)}</p>}
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed border-border-light px-5 py-8 text-center text-sm font-bold text-text-sub dark:border-border-dark">
              Sin compradores registrados.
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
});

export default StockSalesModal;
