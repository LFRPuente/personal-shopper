import { V, getUserOptionLabel, resolveMediaUrl } from "../utils.js";
import { useApp } from "../AppContext.jsx";
import StockProductModal, { createEmptyStockProductForm } from "../components/StockProductModal.jsx";
import StockSalesModal from "../components/StockSalesModal.jsx";

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

const getCreatedStamp = (product) => {
  const parsed = product && product.created_at ? new Date(product.created_at).getTime() : Number(product && product.id);
  return Number.isFinite(parsed) ? parsed : 0;
};

const sortProductsAsc = (items) => [...(Array.isArray(items) ? items : [])].sort((left, right) => {
  const leftStamp = getCreatedStamp(left);
  const rightStamp = getCreatedStamp(right);
  if (leftStamp !== rightStamp) return leftStamp - rightStamp;
  return Number(left && left.id) - Number(right && right.id);
});

const StockCatalogSection = V.memo(function StockCatalogSection() {
  const {
    apiFetch,
    confirmAction,
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
    openImageSourcePicker,
    users,
  } = useApp();

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
  const [salesProduct, setSalesProduct] = V.useState(null);
  const [salesSeenMap, setSalesSeenMap] = V.useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem("stock_sales_seen_map") || "{}") || {};
    } catch {
      return {};
    }
  });

  apiFetchRef.current = apiFetch;
  notifyErrorRef.current = notifyError;

  const loadProducts = V.useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetchRef.current("/stock-products/?include_inactive=1");
      setProducts(sortProductsAsc(data));
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

  V.useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("stock_sales_seen_map", JSON.stringify(salesSeenMap || {}));
  }, [salesSeenMap]);

  V.useEffect(
    () => () => {
      if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    },
    [imagePreviewUrl],
  );

  const setSelectedImageFile = (file) => {
    if (!file) return;
    if (imagePreviewUrl && imagePreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleStockImageSelection = (event) => {
    const file = event && event.target && event.target.files && event.target.files[0];
    if (!file) return;
    setSelectedImageFile(file);
    setModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingProduct(null);
    setForm(createEmptyStockProductForm());
    setImageFile(null);
    setImagePreviewUrl("");
    openImageSourcePicker(handleStockImageSelection, {
      title: "Agregar producto de stock",
      description: "Elige una imagen del producto desde tu dispositivo o pegala desde el portapapeles.",
    });
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
      auto_calc: false,
      apply_discount: product.apply_discount !== false,
      discount_percentage: product.discount_percentage || "0",
      discount_uses_global: product.discount_uses_global !== false,
      payer: product.payer ? String(product.payer) : "",
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

  const pickImage = () =>
    openImageSourcePicker(handleStockImageSelection, {
      title: "Cambiar imagen de stock",
      description: "Elige una nueva imagen del producto desde tu dispositivo o pegala desde el portapapeles.",
    });

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
      payload.append("tags", "");
      payload.append("real_price", String(form.real_price || "0"));
      payload.append("charged_price", String(form.charged_price || "0"));
      payload.append("stock_quantity", String(parseInt(form.stock_quantity, 10) || 0));
      payload.append("apply_discount", form.apply_discount ? "true" : "false");
      payload.append("discount_uses_global", form.discount_uses_global ? "true" : "false");
      payload.append("discount_percentage", String(form.discount_percentage || "0"));
      payload.append("is_active", form.is_active ? "true" : "false");
      payload.append("payer", String(form.payer || ""));
      if (imageFile) payload.append("image", imageFile);
      const url = editingProduct ? `/stock-products/${editingProduct.id}/` : "/stock-products/";
      const saved = await apiFetch(url, {
        method: editingProduct ? "PATCH" : "POST",
        body: payload,
      });
      setProducts((values) => {
        const current = Array.isArray(values) ? values : [];
        if (editingProduct) {
          return sortProductsAsc(current.map((product) => (Number(product.id) === Number(saved.id) ? saved : product)));
        }
        return sortProductsAsc([...current, saved]);
      });
      notifySuccess(editingProduct ? "Producto actualizado." : "Producto agregado al catalogo.");
      closeModal();
    } catch (error) {
      console.error("Failed saving stock product", error);
      if (Number(error && error.status) === 404) {
        await loadProducts();
        closeModal();
        notifyError("Ese producto ya no existe en stock. Se actualizo el listado.");
      } else {
        notifyError(getErrorMessage(error, "No se pudo guardar el producto."));
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePublicVisibility = async (product) => {
    const shouldShow = product.is_active === false;
    if (shouldShow && Number(product.available_quantity || 0) <= 0) {
      notifyError("No se puede mostrar en la pagina web porque el stock disponible es 0.");
      return;
    }
    try {
      const saved = await apiFetch(`/stock-products/${product.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: shouldShow }),
      });
      setProducts((values) => sortProductsAsc(values.map((item) => (Number(item.id) === Number(product.id) ? saved : item))));
      notifySuccess(shouldShow ? "Producto visible en la pagina web." : "Producto oculto de la pagina web.");
    } catch (error) {
      console.error("Failed toggling stock product", error);
      if (Number(error && error.status) === 404) {
        await loadProducts();
        notifyError("Ese producto ya no existe en stock. Se actualizo el listado.");
      } else {
        notifyError(getErrorMessage(error, "No se pudo actualizar el producto."));
      }
    }
  };

  const deleteProduct = async (product) => {
    if (!product || !product.id) return;
    const confirmed =
      typeof confirmAction === "function"
        ? await confirmAction({
            title: "Eliminar producto",
            message: `Se eliminara "${product.name || "este producto"}" del catalogo de stock.`,
            confirmLabel: "Eliminar",
            cancelLabel: "Cancelar",
            tone: "danger",
          })
        : window.confirm("Eliminar este producto?");
    if (!confirmed) return;
    try {
      await apiFetch(`/stock-products/${product.id}/`, { method: "DELETE" });
      setProducts((values) => sortProductsAsc(values.filter((item) => Number(item.id) !== Number(product.id))));
      notifySuccess("Producto eliminado.");
    } catch (error) {
      console.error("Failed deleting stock product", error);
      if (Number(error && error.status) === 404) {
        await loadProducts();
        notifyError("Ese producto ya no existe en stock. Se actualizo el listado.");
      } else {
        notifyError(getErrorMessage(error, "No se pudo eliminar el producto."));
      }
    }
  };

  const patchProduct = async (product, patch, successMessage) => {
    if (!product || !product.id) return;
    try {
      const saved = await apiFetch(`/stock-products/${product.id}/`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      setProducts((values) => sortProductsAsc(values.map((item) => (Number(item.id) === Number(product.id) ? saved : item))));
      if (successMessage) notifySuccess(successMessage);
    } catch (error) {
      console.error("Failed updating stock product", error);
      if (Number(error && error.status) === 404) {
        await loadProducts();
        notifyError("Ese producto ya no existe en stock. Se actualizo el listado.");
      } else {
        notifyError(getErrorMessage(error, "No se pudo actualizar el producto."));
      }
    }
  };

  const updateProductLocalValue = (productId, patch) => {
    setProducts((values) =>
      values.map((item) => (Number(item.id) === Number(productId) ? { ...item, ...patch } : item)),
    );
  };

  const updateProductLocalStock = (product, value) => {
    const stockQuantity = parseInt(value, 10);
    const nextStockQuantity = Number.isFinite(stockQuantity) ? stockQuantity : 0;
    updateProductLocalValue(product.id, {
      stock_quantity: value,
      available_quantity: Math.max(0, nextStockQuantity - Number(product.sold_quantity || 0)),
    });
  };

  const saveProductLocalStock = (product, value) => {
    const stockQuantity = parseInt(value, 10);
    const nextStockQuantity = Math.max(0, Number.isFinite(stockQuantity) ? stockQuantity : 0);
    updateProductLocalValue(product.id, {
      stock_quantity: nextStockQuantity,
      available_quantity: Math.max(0, nextStockQuantity - Number(product.sold_quantity || 0)),
    });
    patchProduct(product, { stock_quantity: nextStockQuantity });
  };

  const updateProductLocalPayer = (product, value) => {
    updateProductLocalValue(product.id, { payer: value || null });
    patchProduct(product, { payer: value || null });
  };

  const handleInlineNumberKeyDown = (event) => {
    if (event.key === "Enter") event.currentTarget.blur();
  };

  const pickProductImage = (product) =>
    openImageSourcePicker(
      async (event) => {
        const file = event && event.target && event.target.files && event.target.files[0];
        if (!file) return;
        const payload = new FormData();
        payload.append("image", file);
        try {
          const saved = await apiFetch(`/stock-products/${product.id}/`, {
            method: "PATCH",
            body: payload,
          });
          setProducts((values) => sortProductsAsc(values.map((item) => (Number(item.id) === Number(product.id) ? saved : item))));
          notifySuccess("Imagen actualizada.");
        } catch (error) {
          console.error("Failed updating stock product image", error);
          notifyError(getErrorMessage(error, "No se pudo cambiar la imagen."));
        }
      },
      {
        title: "Cambiar imagen de stock",
        description: "Elige una nueva imagen del producto desde tu dispositivo o pegala desde el portapapeles.",
      },
    );

  const activeProductsCount = products.filter((product) => Number(product.available_quantity || 0) > 0).length;
  const availableTotal = products.reduce((sum, product) => sum + Number(product.available_quantity || 0), 0);
  const soldTotal = products.reduce((sum, product) => sum + Number(product.sold_quantity || 0), 0);
  const publicUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/catalogo-stock`
      : "/catalogo-stock";
  const copyPublicUrl = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(publicUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = publicUrl;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      notifySuccess("Link copiado al portapapeles.");
    } catch (error) {
      console.error("Failed copying stock catalog link", error);
      notifyError("No se pudo copiar el link.");
    }
  };

  const handleOpenSales = (product) => {
    const orders = Array.isArray(product && product.orders) ? product.orders : [];
    const latestOrder = orders.reduce((latest, order) => {
      const stamp = order && order.created_at ? new Date(order.created_at).getTime() : 0;
      return stamp > latest ? stamp : latest;
    }, 0);
    if (!latestOrder) return;
    setSalesSeenMap((value) => ({ ...(value || {}), [String(product.id)]: latestOrder }));
  };

  const toggleOffer = async (product) => {
    const nextOffer = !(product.discount_uses_global !== false);
    try {
      const saved = await apiFetch(`/stock-products/${product.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ discount_uses_global: nextOffer }),
      });
      setProducts((values) => sortProductsAsc(values.map((item) => (Number(item.id) === Number(product.id) ? saved : item))));
    } catch (error) {
      console.error("Failed updating stock offer flag", error);
      notifyErrorRef.current(getErrorMessage(error, "No se pudo actualizar la oferta."));
      await loadProducts();
    }
  };

  const getSalesBadgeCount = (product) => {
    const orders = Array.isArray(product && product.orders) ? product.orders : [];
    if (!orders.length) return 0;
    const seenAt = Number((salesSeenMap && salesSeenMap[String(product.id)]) || 0);
    return orders.reduce((count, order) => {
      const stamp = order && order.created_at ? new Date(order.created_at).getTime() : 0;
      return stamp > seenAt ? count + 1 : count;
    }, 0);
  };

  const openSalesModal = (product) => {
    setSalesProduct(product);
    handleOpenSales(product);
  };

  return (
    <div className="min-h-[calc(100dvh-9rem)] space-y-5">
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
          <p className="mt-2 text-2xl font-black">{activeProductsCount}</p>
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

      <div className="rounded-2xl border border-border-light bg-surface-light p-4 shadow-card dark:border-border-dark dark:bg-surface-dark">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-text-main dark:text-white">Productos cargados</h2>
          </div>
          <button
            type="button"
            onClick={copyPublicUrl}
            className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            <span className="material-symbols-outlined text-[16px]">content_copy</span>
            Copiar link
          </button>
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
          <div className="overflow-hidden rounded-xl border border-border-light dark:border-border-dark">
            {products.map((product) => {
              const available = Number(product.available_quantity || 0);
              const sold = Number(product.sold_quantity || 0);
              const isOffer = product.discount_uses_global !== false;
              const newSalesCount = getSalesBadgeCount(product);
              return (
                <div key={`stock-product-${product.id}`} className={`grid grid-cols-[88px_minmax(0,1.2fr)_105px_125px_125px_155px_285px] items-center gap-3 border-b border-border-light px-3 py-3 last:border-b-0 dark:border-border-dark ${product.is_active === false ? "opacity-50" : ""}`}>
                  <button type="button" onClick={() => pickProductImage(product)} title="Cambiar imagen" className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800">
                    {product.image ? (
                      <img src={resolveMediaUrl(product.image)} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined">image</span>
                      </div>
                    )}
                  </button>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-text-main dark:text-white">{product.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-text-sub">{product.description || product.tags || "Sin descripcion"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-sub">Stock</p>
                    <input
                      type="number"
                      min={sold}
                      step="1"
                      value={product.stock_quantity ?? 0}
                      onChange={(event) => updateProductLocalStock(product, event.target.value)}
                      onBlur={(event) => saveProductLocalStock(product, event.target.value)}
                      onKeyDown={handleInlineNumberKeyDown}
                      className="mt-1 w-full rounded-md border border-border-light bg-white px-2 py-1 text-sm font-black outline-none focus:ring-2 focus:ring-primary dark:border-border-dark dark:bg-slate-900"
                    />
                    <p className="mt-1 text-[10px] font-bold text-text-sub">Disp. {available}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-sub">Costo USD</p>
                    <input
                      type="number"
                      step="0.01"
                      value={product.real_price ?? ""}
                      onChange={(event) => updateProductLocalValue(product.id, { real_price: event.target.value })}
                      onBlur={(event) => patchProduct(product, { real_price: event.target.value || "0" })}
                      onKeyDown={handleInlineNumberKeyDown}
                      className="mt-1 w-full rounded-md border border-sky-200 bg-sky-50/80 px-2 py-1 text-sm font-black text-sky-900 outline-none focus:ring-2 focus:ring-sky-300 dark:border-sky-800 dark:bg-sky-950/20 dark:text-sky-100"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-sub">Venta MXN</p>
                    <input
                      type="number"
                      step="0.01"
                      value={product.charged_price ?? ""}
                      onChange={(event) => updateProductLocalValue(product.id, { charged_price: event.target.value })}
                      onBlur={(event) => patchProduct(product, { charged_price: event.target.value || "0" })}
                      onKeyDown={handleInlineNumberKeyDown}
                      className="mt-1 w-full rounded-md border border-emerald-200 bg-emerald-50/80 px-2 py-1 text-sm font-black text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-300 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-100"
                    />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase text-text-sub">Quien compro</p>
                    <select
                      value={product.payer ? String(product.payer) : ""}
                      onChange={(event) => updateProductLocalPayer(product, event.target.value)}
                      className="mt-1 w-full rounded-md border border-border-light bg-white px-2 py-1 text-xs font-bold outline-none focus:ring-2 focus:ring-primary dark:border-border-dark dark:bg-slate-900"
                    >
                      <option value="">Sin asignar</option>
                      {(users || []).map((user) => (
                        <option key={`stock-row-payer-${product.id}-${user.id}`} value={user.id}>
                          {getUserOptionLabel(user)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => toggleOffer(product)} role="switch" aria-checked={isOffer} className={`inline-flex items-center gap-2 rounded-md border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] transition ${isOffer ? "border-rose-500 bg-rose-500 text-white" : "border-slate-300 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"}`}>
                      <span className={`block h-3.5 w-3.5 rounded-full bg-white transition ${isOffer ? "translate-x-0" : ""}`} />
                      Oferta
                    </button>
                    <span className={`rounded-md px-2 py-1 text-[10px] font-black ${sold > 0 ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-500"}`}>
                      Vendido {sold}
                    </span>
                    {sold > 0 && (
                      <button type="button" onClick={() => openSalesModal(product)} title="Ver compradores" className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30">
                        <span className="material-symbols-outlined text-[18px]">group</span>
                        {newSalesCount > 0 && (
                        <span className="absolute -right-2 -top-2 min-w-5 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-black text-white shadow-lg ring-2 ring-white dark:bg-white dark:text-slate-950 dark:ring-slate-900">
                            {newSalesCount}
                          </span>
                        )}
                      </button>
                    )}
                    <button type="button" onClick={() => openEditModal(product)} title="Editar producto" className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-300 text-amber-700 hover:bg-amber-50">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button type="button" onClick={() => togglePublicVisibility(product)} title={product.is_active === false ? "Mostrar en pagina web" : "Ocultar de pagina web"} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                      <span className="material-symbols-outlined text-[18px]">{product.is_active === false ? "visibility" : "visibility_off"}</span>
                    </button>
                    <button type="button" onClick={() => deleteProduct(product)} title="Eliminar producto" className="flex h-9 w-9 items-center justify-center rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950/30">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
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
        payerUserOptions={users || []}
        applyCalcModeChange={applyCalcModeChange}
        applyCalcFactorChange={applyCalcFactorChange}
        applyCalcTaxesChange={applyCalcTaxesChange}
        applyCalcCommissionChange={applyCalcCommissionChange}
        applyCalcExchangeRateChange={applyCalcExchangeRateChange}
      />
      <StockSalesModal product={salesProduct} onClose={() => setSalesProduct(null)} />
    </div>
  );
});

export default StockCatalogSection;
