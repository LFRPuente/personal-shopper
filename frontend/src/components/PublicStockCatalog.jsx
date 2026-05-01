import { V, Zs, resolveMediaUrl } from "../utils.js";

const getErrorMessage = (error, fallback = "No se pudo completar la solicitud.") =>
  String((error && error.message) || fallback);

const money = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
};

const getCreatedStamp = (item) => {
  const parsed = item && item.created_at ? new Date(item.created_at).getTime() : Number(item && item.id);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortProductsAsc = (items) => [...(Array.isArray(items) ? items : [])].sort((left, right) => {
  const leftStamp = getCreatedStamp(left);
  const rightStamp = getCreatedStamp(right);
  if (leftStamp !== rightStamp) return leftStamp - rightStamp;
  return Number(left && left.id) - Number(right && right.id);
});

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
  const [orderStage, setOrderStage] = V.useState("form");

  const loadCatalog = V.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await publicFetch("/public/stock-catalog/");
      setProducts(sortProductsAsc(data && data.products));
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
    setOrderStage("form");
  };

  const closeOrder = V.useCallback(() => {
    setSelectedProduct(null);
    setSending(false);
    setSentMessage("");
    setOrderStage("form");
  }, []);

  V.useEffect(() => {
    if (!selectedProduct || typeof document === "undefined") return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeOrder();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedProduct, closeOrder]);

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
      setOrderStage("thanks");
      setSentMessage("");
      await loadCatalog();
    } catch (requestError) {
      console.error("Failed sending stock order", requestError);
      setSentMessage(getErrorMessage(requestError, "No se pudo enviar la solicitud."));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#f7f3ed] text-slate-950">
      <section className="relative overflow-hidden px-4 py-2 sm:px-7 lg:px-12">
        <div className="absolute inset-x-0 top-0 h-[150px] bg-[radial-gradient(circle_at_22%_6%,rgba(255,255,255,0.08),transparent_30%),linear-gradient(135deg,#050505,#1f1f1f_52%,#525252)]" />
        <div className="relative mx-auto max-w-7xl">
          <div className="flex min-h-[92px] flex-col justify-start pt-0.5 pb-2 text-white">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-white/80">Compratelo con PAO</p>
            <h1 className="mt-0.5 max-w-4xl text-3xl font-black leading-[0.94] tracking-normal sm:text-4xl lg:text-5xl">
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
                const isOffer = product.discount_uses_global !== false;
                return (
                  <article key={`public-stock-${product.id}`} className="group overflow-hidden rounded-lg bg-white shadow-[0_14px_40px_rgba(15,23,42,0.12)]">
                    <button
                      type="button"
                      onClick={() => product.image && setPreviewImage(resolveMediaUrl(product.image))}
                      className="relative block aspect-square w-full overflow-hidden rounded-none bg-slate-100 text-left"
                      aria-label={`Ver imagen de ${product.name}`}
                    >
                      {product.image ? (
                        <img src={resolveMediaUrl(product.image)} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-slate-300">
                          <span className="material-symbols-outlined text-5xl">image</span>
                        </div>
                      )}
                      <div className="absolute right-2 top-2 flex items-center gap-2">
                        {isOffer && (
                          <span className="rounded-full bg-rose-600 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white shadow">
                            OFERTA
                          </span>
                        )}
                        <span className="rounded-md bg-black/55 px-3 py-1.5 text-xl font-black text-white backdrop-blur-md sm:text-2xl">
                          ${money(product.charged_price)}
                        </span>
                      </div>
                    </button>
                    <div className="px-3 pb-3 pt-2">
                      <h2 className="line-clamp-2 min-h-[32px] text-[15px] font-black leading-[1.02] tracking-tight text-slate-950">
                        {String(product.name || "").toUpperCase()}
                      </h2>
                      <button
                        type="button"
                        onClick={() => openOrder(product)}
                        disabled={available < 1}
                        className="mt-0.5 w-full rounded-xl bg-slate-600 px-3 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-lg shadow-slate-600/24 transition hover:bg-black focus:bg-black disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
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
          <div className="relative w-full max-w-md min-h-[430px] overflow-hidden rounded-[28px] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 p-5 shadow-2xl">
            <div className={`transition-all duration-500 ${orderStage === "form" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none absolute inset-0 opacity-0 translate-y-2"}`}>
              <form onSubmit={submitOrder} className="text-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/60">Apartar producto</p>
                    <h3 className="mt-1 truncate text-xl font-black uppercase tracking-tight text-white">{String(selectedProduct.name || "").toUpperCase()}</h3>
                  </div>
                  <button type="button" onClick={closeOrder} className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-white hover:bg-black">
                    <span className="material-symbols-outlined text-[19px]">close</span>
                  </button>
                </div>

                <div className="mt-5 space-y-3">
                  <input
                    value={form.customer_name}
                    onChange={(event) => setForm((value) => ({ ...value, customer_name: event.target.value }))}
                    placeholder="Tu nombre"
                    className="w-full rounded-2xl border border-white/10 bg-white/95 px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:ring-2 focus:ring-slate-400"
                    required
                  />
                  <input
                    value={form.customer_phone}
                    onChange={(event) => setForm((value) => ({ ...value, customer_phone: event.target.value }))}
                    placeholder="Telefono"
                    inputMode="tel"
                    className="w-full rounded-2xl border border-white/10 bg-white/95 px-4 py-3 text-base font-semibold text-slate-950 outline-none focus:ring-2 focus:ring-slate-400"
                    required
                  />
                  <div>
                    <label className="mb-1 block text-xs font-black uppercase tracking-[0.16em] text-white/60">Cantidad</label>
                    <div className="grid grid-cols-[48px_1fr_48px] overflow-hidden rounded-2xl border border-white/10 bg-white/95">
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
                  <p className="mt-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-100">
                    {sentMessage}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="mt-5 w-full rounded-2xl bg-slate-600 px-4 py-3 text-sm font-black uppercase tracking-[0.18em] text-white shadow-lg shadow-slate-950/20 transition hover:bg-black disabled:cursor-wait disabled:bg-slate-500"
                >
                  {sending ? "Enviando..." : "Enviar"}
                </button>
              </form>
            </div>

            <div className={`transition-all duration-500 ${orderStage === "thanks" ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none absolute inset-0 opacity-0 translate-y-2"}`}>
              <div className="flex h-full min-h-[390px] flex-col items-center justify-center px-4 text-center text-white">
                <p className="max-w-sm font-serif text-2xl leading-snug tracking-wide sm:text-3xl">
                  Gracias por tu compra. En breve algun miembro del equipo de Compratelo con Pao se contactara contigo.
                </p>
                <button
                  type="button"
                  onClick={closeOrder}
                  className="mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-slate-600 text-white shadow-lg shadow-slate-950/20 transition hover:bg-black"
                  aria-label="Cerrar"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
            </div>
          </div>
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
