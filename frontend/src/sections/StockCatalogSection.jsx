import { V, resolveMediaUrl } from "../utils.js";
import { useApp } from "../AppContext.jsx";
import StockProductModal, { createEmptyStockProductForm } from "../components/StockProductModal.jsx";

const getErrorMessage = (error, fallback = "No se pudo completar la accion.") =>
  String(
    (error && error.payload && (error.payload.error || error.payload.detail)) ||
      (error && error.message) ||
      fallback,
  );

const toAmount = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "0.00";
};

const StockCatalogSection = V.memo(function StockCatalogSection() {
  const {
    apiFetch,
    notifySuccess,
    notifyError,
    calcMode,
    calcFactor,
    calcTaxes,
    calcDiscount,
    calcCommission,
    calcExchangeRate,
    applyCalcModeChange,
    applyCalcFactorChange,
    applyCalcTaxesChange,
    applyCalcCommissionChange,
    applyCalcExchangeRateChange,
  } = useApp();

  const fileInputRef = V.useRef(null);
  const apiFetchRef = V.useRef(apiFetch);
  const notifyErrorRef = V.useRef(notifyError);
  const [products, setProducts] = V.useState([]);
  const [loading, setLoading] = V.useState(true);
  const [saving, setSaving] = V.useState(false);
  const [modalOpen, setModalOpen] = V.useState(false);
  const [editingProduct, setEditingProduct] = V.useState(null);
  const [form, setForm] = V.useState(createEmptyStockProductForm);
  const [imageFile, setImageFile] = V.useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = V.useState("");

  apiFetchRef.current = apiFetch;
  notifyErrorRef.current = notifyError;

  const loadProducts = V.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchRef.current("/stock-products/?include_inactive=1");
      setProducts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed loading stock catalog", error);
      notifyErrorRef.current(getErrorMessage(error, "No se pudo cargar el catalogo de stock."));
    } finally {
      setLoading(false);
    }
  }, []);

  V.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  V.useEffect(
    () => () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    },
    [imagePreviewUrl],
  );

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(createEmptyStockProductForm());
    setImageFile(null);
    setImagePreviewUrl("");
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setForm({
      name: product.name || "",
      description: product.description || "",
      tags: product.tags || "",
      real_price: product.real_price || "",
      charged_price: product.charged_price || "",
      stock_quantity: String(product.stock_quantity ?? 0),
      apply_discount: product.apply_discount !== false,
      discount_percentage: product.discount_percentage || "0",
      discount_uses_global: product.discount_uses_global !== false,
      is_active: product.is_active !== false,
    });
    setImageFile(null);
    setImagePreviewUrl(product.image ? resolveMediaUrl(product.image) : "");
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setImageFile(null);
    setImagePreviewUrl("");
  };

  const pickImage = () => fileInputRef.current && fileInputRef.current.click();

  const submitProduct = async (event) => {
    event.preventDefault();
    if (!String(form.name || "").trim()) {
      notifyError("Captura el nombre del producto.");
      return;
    }
    setSaving(true);
    try {
      const payload = new FormData();
      payload.append("name", String(form.name || "").trim());
      payload.append("description", String(form.description || "").trim());
      payload.append("tags", String(form.tags || "").trim());
      payload.append("real_price", String(form.real_price || "0"));
      payload.append("charged_price", String(form.charged_price || "0"));
      payload.append("stock_quantity", String(parseInt(form.stock_quantity, 10) || 0));
      payload.append("apply_discount", form.apply_discount ? "true" : "false");
      payload.append("discount_uses_global", form.discount_uses_global ? "true" : "false");
      payload.append("discount_percentage", String(form.discount_percentage || calcDiscount || "0"));
      payload.append("is_active", form.is_active ? "true" : "false");
      if (imageFile) payload.append("image", imageFile);
      const url = editingProduct ? `/stock-products/${editingProduct.id}/` : "/stock-products/";
      const saved = await apiFetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        body: payload,
      });
      setProducts((values) => {
        const current = Array.isArray(values) ? values : [];
        if (editingProduct) {
          return current.map((product) => (Number(product.id) === Number(saved.id) ? saved : product));
        }
        return [saved, ...current];
      });
      notifySuccess(editingProduct ? "Producto actualizado." : "Producto agregado al catalogo.");
      closeModal();
    } catch (error) {
      console.error("Failed saving stock product", error);
      notifyError(getErrorMessage(error, "No se pudo guardar el producto."));
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (product) => {
    try {
      const saved = await apiFetch(`/stock-products/${product.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: product.is_active === false }),
      });
      setProducts((values) => values.map((item) => (Number(item.id) === Number(product.id) ? saved : item)));
    } catch (error) {
      console.error("Failed toggling stock product", error);
      notifyError(getErrorMessage(error, "No se pudo actualizar el producto."));
    }
  };

  const activeProducts = products.filter((product) => product.is_active !== false);
  const availableTotal = activeProducts.reduce((sum, product) => sum + Number(product.available_quantity || 0), 0);
  const soldTotal = activeProducts.reduce((sum, product) => sum + Number(product.sold_quantity || 0), 0);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/catalogo-stock`
      : "/catalogo-stock";

  return (
    <div className="min-h-[calc(100dvh-9rem)] space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files && event.target.files[0];
          event.target.value = "";
          if (!file) return;
          if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(imagePreviewUrl);
          }
          setImageFile(file);
          setImagePreviewUrl(URL.createObjectURL(file));
        }}
      />

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-primary">Vista web</p>
          <h1 className="text-3xl font-black text-text-main dark:text-white">Catalogo de Stock</h1>
          <p className="mt-1 text-sm text-text-sub">Administra productos disponibles, vendidos y pagina publica.</p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-black text-white shadow-sm hover:bg-primary-dark"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Agregar stock
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-border-light bg-surface-light p-4 shadow-sm dark:border-border-dark dark:bg-surface-dark">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-sub">Productos activos</p>
          <p className="mt-2 text-2xl font-black">{activeProducts.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">Disponible</p>
          <p className="mt-2 text-2xl font-black text-emerald-800 dark:text-emerald-100">{availableTotal}</p>
        </div>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm dark:border-rose-900 dark:bg-rose-950/20">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700 dark:text-rose-300">Vendido</p>
          <p className="mt-2 text-2xl font-black text-rose-800 dark:text-rose-100">{soldTotal}</p>
        </div>
      </div>

      <div className="rounded-3xl border border-border-light bg-surface-light p-4 shadow-card dark:border-border-dark dark:bg-surface-dark">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-text-main dark:text-white">Productos cargados</h2>
            <a href={publicUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-primary hover:underline">
              Abrir pagina publica
            </a>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-200">
            {publicUrl}
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-text-sub">
            <span className="material-symbols-outlined animate-spin text-3xl text-primary">progress_activity</span>
            <p className="mt-2 text-sm font-semibold">Cargando stock...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-light px-6 py-14 text-center text-text-sub dark:border-border-dark">
            <span className="material-symbols-outlined text-4xl text-primary">inventory_2</span>
            <p className="mt-2 text-sm font-bold">Aun no hay productos en stock.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border-light dark:border-border-dark">
            {products.map((product) => {
              const available = Number(product.available_quantity || 0);
              const sold = Number(product.sold_quantity || 0);
              return (
                <div key={`stock-product-${product.id}`} className={`grid grid-cols-[88px_minmax(0,1.2fr)_120px_140px_140px_150px] items-center gap-3 border-b border-border-light px-3 py-3 last:border-b-0 dark:border-border-dark ${product.is_active === false ? "opacity-50" : ""}`}>
                  <div className="h-20 w-20 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                    {product.image ? (
                      <img src={resolveMediaUrl(product.image)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-text-main dark:text-white">{product.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-text-sub">{product.description || product.tags || "Sin descripcion"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-sub">Stock</p>
                    <p className="text-sm font-black">{available} / {product.stock_quantity || 0}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-sub">Costo USD</p>
                    <p className="text-sm font-black text-sky-700 dark:text-sky-300">${toAmount(product.real_price)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-sub">Venta MXN</p>
                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">${toAmount(product.charged_price)}</p>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black ${sold > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                      Vendido {sold}
                    </span>
                    <button type="button" onClick={() => openEditModal(product)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-300 text-amber-700 hover:bg-amber-50">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button type="button" onClick={() => toggleActive(product)} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                      <span className="material-symbols-outlined text-[18px]">{product.is_active === false ? "visibility" : "visibility_off"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <StockProductModal
        open={modalOpen}
        form={form}
        setForm={setForm}
        imagePreviewUrl={imagePreviewUrl}
        onPickImage={pickImage}
        onSubmit={submitProduct}
        onClose={closeModal}
        saving={saving}
        isEditing={!!editingProduct}
        calcMode={calcMode}
        calcFactor={calcFactor}
        calcTaxes={calcTaxes}
        calcCommission={calcCommission}
        calcExchangeRate={calcExchangeRate}
        calcDiscount={calcDiscount}
        applyCalcModeChange={applyCalcModeChange}
        applyCalcFactorChange={applyCalcFactorChange}
        applyCalcTaxesChange={applyCalcTaxesChange}
        applyCalcCommissionChange={applyCalcCommissionChange}
        applyCalcExchangeRateChange={applyCalcExchangeRateChange}
      />
    </div>
  );
});

export default StockCatalogSection;
