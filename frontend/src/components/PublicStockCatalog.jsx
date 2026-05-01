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
  const [previewImage, setPreviewImage] = V.useState(null);
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

  const updateQuantity = (nextQuantity) => {
    if (!selectedProduct) return;
    const available = Math.max(1, Number(selectedProduct.available_quantity || 1));
    const quantity = Math.min(available, Math.max(1, Number(nextQuantity) || 1));
    setForm((value) => ({ ...value, quantity }));
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
      <section className="relative overflow-hidden px-4 py-4 sm:px-7 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-[220px] bg-[radial-gradient(circle_at_22%_10%,rgba(168,85,247,0.20),transparent_30%),linear-gradient(135deg,#111827,#35205f_56%,#7c3aed)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex min-h-[155px] flex-col justify-end pb-5 text-white">
            <p className="text-sm font-black uppercase tracking-[0.20em] text-white/80">Compratelo con Pao</p>
            <h1 className="mt-1 max-w-4xl text-4xl font-black tracking-normal sm:text-5xl lg:text-6xl">
              Catalogo de Stock
            </h1>
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
              {products.map((product) => {
                const available = Number(product.available_quantity || 0);
                return (
                  <article key={`public-stock-${product.id}`} className="group overflow-hidden rounded-2xl bg-white shadow-[0_14px_40px_rgba(15,23,42,0.12)]">
                    <button
                      type="button"
                      onClick={() => product.image && setPreviewImage(resolveMediaUrl(product.image))}
                      className="relative block aspect-square w-full overflow-hidden bg-slate-100 text-left"
                      aria-label={`Ver imagen de ${product.name}`}
                    >
                      {product.image ? (
                        <img src={resolveMediaUrl(product.image)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined text-5xl">image</span>
                        </div>
                      )}
                      <div className="absolute right-2 top-2">
                        <span className="rounded-full bg-slate-950/86 px-3 py-1.5 text-base font-black text-white shadow-lg backdrop-blur">
                          ${money(product.charged_price)}
                        </span>
                      </div>
                    </button>
                    <div className="p-3">
                      <h2 className="line-clamp-2 min-h-[38px] text-base font-black leading-tight text-slate-950">{product.name}</h2>
                      <button
                        type="button"
                        onClick={() => openOrder(product)}
                        disabled={available < 1}
                        className="mt-2 w-full rounded-xl bg-violet-600 px-3 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white shadow-lg shadow-violet-600/24 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
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
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">Cantidad</label>
                <div className="grid grid-cols-[48px_1fr_48px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    onClick={() => updateQuantity(Number(form.quantity) - 1)}
                    className="flex h-12 items-center justify-center text-slate-700 disabled:text-slate-300"
                    disabled={Number(form.quantity) <= 1}
                    aria-label="Reducir cantidad"
                  >
                    <span className="material-symbols-outlined text-[20px]">remove</span>
                  </button>
                  <div className="flex h-12 items-center justify-center border-x border-slate-200 text-lg font-black text-slate-950">
                    {form.quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => updateQuantity(Number(form.quantity) + 1)}
                    className="flex h-12 items-center justify-center text-slate-700 disabled:text-slate-300"
                    disabled={Number(form.quantity) >= Number(selectedProduct.available_quantity || 1)}
                    aria-label="Aumentar cantidad"
                  >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                  </button>
                </div>
              </div>
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

      {previewImage && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/85 p-4" onClick={() => setPreviewImage(null)}>
          <div className="relative max-h-[92vh] max-w-[95vw]" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow"
              aria-label="Cerrar imagen"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <img src={previewImage} className="max-h-[92vh] max-w-[95vw] rounded-2xl bg-black object-contain shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
});

export default PublicStockCatalog;
