import { V, Zs, resolveMediaUrl } from "../utils.js";

const getErrorMessage = (error, fallback = "No se pudo completar la solicitud.") =>
  String((error && error.message) || fallback);

const money = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
};

const publicFetch = async (path, options = {}) => {
  const response = await fetch(`${Zs}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((payload && (payload.error || payload.detail)) || `HTTP ${response.status}`);
  }
  return payload;
};

const PublicStockCatalog = V.memo(function PublicStockCatalog() {
  const [products, setProducts] = V.useState([]);
  const [loading, setLoading] = V.useState(true);
  const [error, setError] = V.useState("");
  const [selectedProduct, setSelectedProduct] = V.useState(null);
  const [form, setForm] = V.useState({ customer_name: "", customer_phone: "", quantity: 1 });
  const [sending, setSending] = V.useState(false);
  const [sentMessage, setSentMessage] = V.useState("");

  const loadCatalog = V.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await publicFetch("/public/stock-catalog/");
      setProducts(Array.isArray(data && data.products) ? data.products : []);
    } catch (requestError) {
      console.error("Failed loading public stock catalog", requestError);
      setError(getErrorMessage(requestError, "No se pudo cargar el catalogo."));
    } finally {
      setLoading(false);
    }
  }, []);

  V.useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  const openOrder = (product) => {
    setSelectedProduct(product);
    setForm({ customer_name: "", customer_phone: "", quantity: 1 });
    setSentMessage("");
  };

  const closeOrder = () => {
    setSelectedProduct(null);
    setSending(false);
    setSentMessage("");
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    if (!selectedProduct) return;
    setSending(true);
    setSentMessage("");
    try {
      await publicFetch("/public/stock-catalog/order/", {
        method: "POST",
        body: JSON.stringify({
          product: selectedProduct.id,
          customer_name: form.customer_name,
          customer_phone: form.customer_phone,
          quantity: form.quantity,
        }),
      });
      setSentMessage("Listo, tu solicitud fue enviada.");
      await loadCatalog();
      setTimeout(closeOrder, 1200);
    } catch (requestError) {
      console.error("Failed sending stock order", requestError);
      setSentMessage(getErrorMessage(requestError, "No se pudo enviar la solicitud."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ed] text-slate-950">
      <section className="relative overflow-hidden px-5 py-8 sm:px-8 lg:px-14">
        <div className="absolute inset-x-0 top-0 h-[360px] bg-[radial-gradient(circle_at_22%_18%,rgba(168,85,247,0.22),transparent_34%),linear-gradient(135deg,#111827,#35205f_56%,#7c3aed)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex min-h-[280px] flex-col justify-end pb-8 text-white">
            <p className="text-xs font-black uppercase tracking-[0.28em] text-white/70">Personal Shopper</p>
            <h1 className="mt-3 max-w-4xl text-5xl font-black tracking-normal sm:text-6xl lg:text-7xl">
              Catalogo de Stock
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium text-white/78 sm:text-lg">
              Productos disponibles para apartar directo desde inventario.
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
              <span className="material-symbols-outlined animate-spin text-4xl text-violet-600">progress_activity</span>
              <p className="mt-3 text-sm font-bold text-slate-500">Cargando catalogo...</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-white p-12 text-center text-rose-600 shadow-xl">
              <p className="text-sm font-bold">{error}</p>
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-3xl bg-white p-12 text-center shadow-xl">
              <p className="text-sm font-bold text-slate-500">No hay productos disponibles por ahora.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => {
                const available = Number(product.available_quantity || 0);
                return (
                  <article key={`public-stock-${product.id}`} className="group overflow-hidden rounded-[28px] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
                    <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                      {product.image ? (
                        <img src={resolveMediaUrl(product.image)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined text-5xl">image</span>
                        </div>
                      )}
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
                        <span className="rounded-full bg-white/88 px-3 py-1 text-[11px] font-black text-violet-700 backdrop-blur">
                          {available} disponible{available === 1 ? "" : "s"}
                        </span>
                        <span className="rounded-full bg-slate-950/82 px-3 py-1 text-[11px] font-black text-white backdrop-blur">
                          ${money(product.charged_price)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h2 className="line-clamp-2 min-h-[44px] text-lg font-black leading-tight text-slate-950">{product.name}</h2>
                      <p className="mt-2 line-clamp-2 min-h-[40px] text-sm text-slate-500">
                        {product.description || product.tags || "Producto disponible en stock."}
                      </p>
                      <button
                        type="button"
                        onClick={() => openOrder(product)}
                        disabled={available < 1}
                        className="mt-4 w-full rounded-2xl bg-violet-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-violet-600/24 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                      >
                        YO
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center">
          <form onSubmit={submitOrder} className="w-full max-w-md rounded-[28px] bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-violet-600">Apartar producto</p>
                <h3 className="mt-1 text-xl font-black text-slate-950">{selectedProduct.name}</h3>
              </div>
              <button type="button" onClick={closeOrder} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <span className="material-symbols-outlined text-[19px]">close</span>
              </button>
            </div>

            <div className="mt-5 space-y-3">
              <input
                value={form.customer_name}
                onChange={(event) => setForm((value) => ({ ...value, customer_name: event.target.value }))}
                placeholder="Tu nombre"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              <input
                value={form.customer_phone}
                onChange={(event) => setForm((value) => ({ ...value, customer_phone: event.target.value }))}
                placeholder="Telefono"
                inputMode="tel"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-semibold outline-none focus:ring-2 focus:ring-violet-500"
                required
              />
              {Number(selectedProduct.available_quantity || 0) > 1 && (
                <div>
                  <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Cantidad</label>
                  <select
                    value={form.quantity}
                    onChange={(event) => setForm((value) => ({ ...value, quantity: event.target.value }))}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base font-black outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {Array.from({ length: Number(selectedProduct.available_quantity || 0) }, (_, index) => index + 1).map((quantity) => (
                      <option key={`quantity-${quantity}`} value={quantity}>{quantity}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {sentMessage && (
              <p className={`mt-4 rounded-2xl px-4 py-3 text-sm font-bold ${sentMessage.startsWith("Listo") ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                {sentMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              className="mt-5 w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white disabled:cursor-wait disabled:bg-slate-400"
            >
              {sending ? "Enviando..." : "Enviar"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
});

export default PublicStockCatalog;
