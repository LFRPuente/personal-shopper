import { V, getUserOptionLabel } from "../utils.js";

const ProductModal = V.memo(function ProductModal({
  open,
  selectedProduct,
  productForm,
  setProductForm,
  onSubmit,
  onClose,
  productModalMode,
  isDesktopLayout,
  payerUserOptions,
  productStoreInputClass,
  productFinalInputClass,
  productPriceAutoInfoOpen,
  setProductPriceAutoInfoOpen,
  productPriceAutoSync,
  setProductPriceAutoSync,
  setProductPriceSyncSource,
  showProductDiscountFields,
  productDiscountEnabled,
  productStoreDiscountedPrice,
  productFinalDiscountedPrice,
  calcMode,
  applyCalcModeChange,
  calcFactor,
  applyCalcFactorChange,
  calcTaxes,
  applyCalcTaxesChange,
  calcCommission,
  applyCalcCommissionChange,
  calcExchangeRate,
  applyCalcExchangeRateChange,
  productCalcInputClass,
  productCalcCompactInputClass,
  modalTags,
  newModalTag,
  setNewModalTag,
  addModalTag,
  removeModalTag,
  productModalCanChooseShopping,
  productModalPinnedShopping,
  productModalSelectedShopping,
  productModalShoppingSearch,
  setProductModalShoppingSearch,
  productModalShoppingOptionsCount,
  productModalFilteredShoppingOptions,
  getMissionStoreLabel,
  activeShopping,
  storeSearch,
  setStoreSearch,
  filteredStores,
  userRole,
  showAddStoreInput,
  setShowAddStoreInput,
  newStoreName,
  setNewStoreName,
  createStoreFromModal,
  newProductUploading,
  modalHasRequiredProductFields,
  overlayBackdropClass,
  overlaySheetClass,
}) {
  if (!open || !selectedProduct) return null;

  const updateForm = (patch) => setProductForm({ ...productForm, ...patch });

  return (
    <div
      className={overlayBackdropClass(
        "fixed inset-0 z-[95] bg-black/50 flex items-end sm:items-center justify-center overflow-y-auto p-2 sm:p-4 ui-backdrop",
        "edit-product",
      )}
      onClick={onClose}
    >
      <div
        className={overlaySheetClass(
          `bg-surface-light dark:bg-surface-dark w-full ${isDesktopLayout ? "sm:max-w-5xl rounded-3xl max-h-[92vh] overflow-y-auto" : "sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"} p-6 shadow-2xl ui-sheet`,
          "edit-product",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">
          {productModalMode === "create" ? "Agregar producto" : "Edit Product Info"}
        </h3>
        <form
          onSubmit={onSubmit}
          className={isDesktopLayout ? "grid grid-cols-2 gap-5 items-start" : "space-y-4"}
        >
          <div className={isDesktopLayout ? "col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Product Name
            </label>
            <input
              type="text"
              value={productForm.name}
              onChange={(event) => updateForm({ name: event.target.value })}
              className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
              required
            />
          </div>

          <div className={isDesktopLayout ? "col-span-2" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Quien paga
            </label>
            <select
              value={productForm.payer}
              onChange={(event) => updateForm({ payer: event.target.value })}
              className="w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="" disabled>
                {payerUserOptions.length ? "Selecciona quien pagara" : "Sin usuarios disponibles"}
              </option>
              {payerUserOptions.map((user) => (
                <option key={`product-payer-${user.id}`} value={user.id}>
                  {getUserOptionLabel(user)}
                </option>
              ))}
            </select>
          </div>

          <div
            className={
              isDesktopLayout ? "col-span-2 grid grid-cols-2 gap-4" : "grid grid-cols-2 gap-4"
            }
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Store Price (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={productForm.real_price}
                onChange={(event) => {
                  setProductPriceSyncSource("real");
                  updateForm({ real_price: event.target.value });
                }}
                className={productStoreInputClass}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Final Price (MXN)
              </label>
              <input
                type="number"
                step="0.01"
                value={productForm.charged_price}
                onChange={(event) => {
                  setProductPriceSyncSource("charged");
                  updateForm({ charged_price: event.target.value });
                }}
                className={productFinalInputClass}
                required
              />
            </div>
          </div>

          <div
            className={`${isDesktopLayout ? "col-span-2 " : ""}flex items-center justify-between gap-3 rounded-xl px-1 py-1`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold text-text-sub dark:text-slate-300 truncate">
                Calculo automatico
              </span>
              <div
                className="relative shrink-0"
                onMouseEnter={() => setProductPriceAutoInfoOpen(true)}
                onMouseLeave={() => setProductPriceAutoInfoOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setProductPriceAutoInfoOpen((value) => !value)}
                  onFocus={() => setProductPriceAutoInfoOpen(true)}
                  onBlur={() => setProductPriceAutoInfoOpen(false)}
                  title="Si esta activo, al cambiar Store Price o Final Price se recalcula el otro segun el factor o porcentaje. Si lo desactivas, ambos precios se editan por separado."
                  className="w-5 h-5 rounded-full border border-fuchsia-200 text-fuchsia-700 dark:border-fuchsia-800 dark:text-fuchsia-300 inline-flex items-center justify-center hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 transition"
                  aria-label="Info de calculo automatico"
                  aria-expanded={productPriceAutoInfoOpen}
                  aria-describedby="product-price-auto-info"
                >
                  <span className="material-symbols-outlined text-[12px] leading-none">info</span>
                </button>
                {productPriceAutoInfoOpen && (
                  <div
                    id="product-price-auto-info"
                    className="absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-fuchsia-200 bg-white/98 px-3 py-2 text-[11px] leading-5 text-fuchsia-900 shadow-xl dark:border-fuchsia-900 dark:bg-slate-950 dark:text-fuchsia-100"
                  >
                    Si esta activo, al cambiar Store Price o Final Price se recalcula el otro segun el
                    factor o porcentaje. Si lo desactivas, ambos precios se editan por separado.
                  </div>
                )}
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={productPriceAutoSync}
              onClick={() => setProductPriceAutoSync((value) => !value)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${productPriceAutoSync ? "bg-primary border-primary" : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${productPriceAutoSync ? "translate-x-6" : "translate-x-1"}`}
              />
            </button>
          </div>

          {showProductDiscountFields && (
            <div className={`${isDesktopLayout ? "col-span-2 " : ""}space-y-3`}>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/85 px-3 py-2 dark:border-amber-800 dark:bg-amber-950/20">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-amber-800 dark:text-amber-100">
                    Aplicar descuento de shopping
                  </p>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    Puedes quitarlo solo para este producto.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={productDiscountEnabled}
                  onClick={() => updateForm({ apply_discount: !productDiscountEnabled })}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${productDiscountEnabled ? "bg-amber-500 border-amber-500" : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${productDiscountEnabled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
              {productDiscountEnabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                      Store Price con descuento (USD)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={
                        Number.isFinite(productStoreDiscountedPrice)
                          ? productStoreDiscountedPrice.toFixed(2)
                          : ""
                      }
                      className="w-full px-3 py-2 border rounded-xl border-amber-200 bg-amber-50/85 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-100 font-semibold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-1">
                      Final Price con descuento (MXN)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={
                        Number.isFinite(productFinalDiscountedPrice)
                          ? productFinalDiscountedPrice.toFixed(2)
                          : ""
                      }
                      className="w-full px-3 py-2 border rounded-xl border-amber-200 bg-amber-50/85 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-100 font-semibold outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className={isDesktopLayout ? "col-span-1" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Modo de Calculo
            </label>
            <div className="grid grid-cols-2 rounded-xl p-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => applyCalcModeChange("FACTOR")}
                className={`py-2 text-xs font-bold rounded-lg transition ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`}
              >
                Factor
              </button>
              <button
                type="button"
                onClick={() => applyCalcModeChange("PERCENTAGE")}
                className={`py-2 text-xs font-bold rounded-lg transition ${calcMode === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`}
              >
                Porcentaje
              </button>
            </div>
          </div>

          {calcMode === "FACTOR" ? (
            <div className={isDesktopLayout ? "col-span-1" : ""}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Factor
              </label>
              <input
                type="number"
                step="0.01"
                value={calcFactor}
                onChange={(event) => applyCalcFactorChange(event.target.value)}
                className={`${productCalcInputClass} px-4 py-2`}
              />
            </div>
          ) : (
            <div
              className={
                isDesktopLayout ? "col-span-1 grid grid-cols-2 gap-2" : "grid grid-cols-2 gap-2"
              }
            >
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Taxes (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcTaxes}
                  onChange={(event) => applyCalcTaxesChange(event.target.value)}
                  className={`${productCalcCompactInputClass} px-2 py-2`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comision (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcCommission}
                  onChange={(event) => applyCalcCommissionChange(event.target.value)}
                  className={`${productCalcCompactInputClass} px-2 py-2`}
                />
              </div>
              <div>
                <label className="block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tipo Cambio
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={calcExchangeRate}
                  onChange={(event) => applyCalcExchangeRateChange(event.target.value)}
                  className={`${productCalcCompactInputClass} px-2 py-2`}
                />
              </div>
            </div>
          )}

          <div className={isDesktopLayout ? "col-span-1" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {modalTags.length === 0 ? (
                <span className="text-xs text-gray-400">Sin tags</span>
              ) : (
                modalTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-1 flex items-center gap-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeModalTag(tag)}
                      className="material-symbols-outlined text-[14px] leading-none hover:text-red-500"
                    >
                      close
                    </button>
                  </span>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newModalTag}
                onChange={(event) => setNewModalTag(event.target.value)}
                placeholder="Agregar tag"
                className="flex-1 px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
              />
              <button
                type="button"
                onClick={addModalTag}
                className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
              >
                + Add
              </button>
            </div>
          </div>

          <div className={isDesktopLayout ? "col-span-1" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {productModalCanChooseShopping || productModalPinnedShopping ? "Shopping" : "Store"}
            </label>
            {productModalCanChooseShopping ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-3 dark:border-sky-800 dark:bg-sky-950/30 space-y-2">
                <input
                  type="text"
                  value={productModalShoppingSearch}
                  onChange={(event) => setProductModalShoppingSearch(event.target.value)}
                  placeholder="Buscar shopping o fecha..."
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                />
                {productModalSelectedShopping && (
                  <div className="rounded-xl border border-sky-300/60 bg-white/80 px-3 py-2 dark:border-sky-700 dark:bg-slate-900/60">
                    <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
                      {getMissionStoreLabel(productModalSelectedShopping) ||
                        productModalSelectedShopping.name ||
                        "Sin shopping asignada"}
                    </p>
                    <p className="mt-1 text-[11px] text-sky-700/80 dark:text-sky-300/80">
                      {productModalSelectedShopping.start_time
                        ? new Date(productModalSelectedShopping.start_time).toLocaleDateString()
                        : "Sin fecha"}
                    </p>
                  </div>
                )}
                <div className="max-h-36 overflow-y-auto ios-scroll space-y-1 pr-1">
                  {productModalFilteredShoppingOptions.length > 0 ? (
                    productModalFilteredShoppingOptions.slice(0, 6).map((shopping) => (
                      <button
                        key={`product-shopping-search-${shopping.id}`}
                        type="button"
                        onClick={() => {
                          setProductForm({
                            ...productForm,
                            shopping: String(shopping.id),
                            store:
                              shopping && shopping.store !== null && typeof shopping.store !== "undefined"
                                ? String(shopping.store)
                                : "",
                          });
                          setProductModalShoppingSearch("");
                        }}
                        className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                          Number(productForm.shopping || 0) === Number(shopping.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-sky-200 bg-white/80 text-slate-700 hover:border-primary/40 hover:bg-white dark:border-sky-900 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-primary/50 dark:hover:bg-slate-900"
                        }`}
                      >
                        <p className="text-sm font-semibold truncate">
                          {getMissionStoreLabel(shopping) || shopping.name || `Shopping #${shopping.id}`}
                        </p>
                        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {shopping.start_time
                            ? new Date(shopping.start_time).toLocaleDateString()
                            : "Sin fecha"}
                        </p>
                      </button>
                    ))
                  ) : (
                    <p className="px-1 py-2 text-xs text-sky-700/80 dark:text-sky-300/80">
                      {productModalShoppingOptionsCount
                        ? "Sin coincidencias."
                        : "Sin shoppings disponibles."}
                    </p>
                  )}
                </div>
              </div>
            ) : productModalPinnedShopping ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/30">
                <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
                  {getMissionStoreLabel(productModalPinnedShopping) ||
                    productModalPinnedShopping.name ||
                    "Sin shopping asignada"}
                </p>
                {productModalPinnedShopping.start_time && (
                  <p className="mt-1 text-[11px] text-sky-700/80 dark:text-sky-300/80">
                    {new Date(productModalPinnedShopping.start_time).toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : activeShopping ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/30">
                <p className="text-sm font-semibold text-sky-900 dark:text-sky-100">
                  {getMissionStoreLabel(activeShopping) || "Sin tienda asignada"}
                </p>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={storeSearch}
                  onChange={(event) => setStoreSearch(event.target.value)}
                  placeholder="Buscar tienda..."
                  className="w-full px-3 py-2 border rounded-xl mb-2 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                />
                <select
                  value={productForm.store || ""}
                  onChange={(event) => updateForm({ store: event.target.value })}
                  className="w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                >
                  <option value="">Selecciona tienda</option>
                  {filteredStores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
                {userRole === "AV" && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddStoreInput((value) => !value)}
                      className="text-xs font-semibold text-primary hover:text-primary-dark"
                    >
                      + Add Store
                    </button>
                    {showAddStoreInput && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          value={newStoreName}
                          onChange={(event) => setNewStoreName(event.target.value)}
                          placeholder="Nombre de tienda"
                          className="flex-1 px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none"
                        />
                        <button
                          type="button"
                          onClick={createStoreFromModal}
                          className="px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark"
                        >
                          Guardar
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className={isDesktopLayout ? "col-span-1" : ""}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["ANNOTATED", "Anotado"],
                ["REVIEW", "Revision"],
                ["REJECTED", "Rechazado"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => updateForm({ status: value })}
                  className={`px-2 py-2 rounded-xl text-[11px] leading-tight font-bold border transition ${
                    productForm.status === value
                      ? "bg-primary text-white border-primary"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary/50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className={`${isDesktopLayout ? "col-span-2" : ""} flex gap-3 pt-4`}>
            <button
              type="button"
              onClick={onClose}
              disabled={newProductUploading}
              className={`flex-1 py-3 font-semibold rounded-xl ui-btn-secondary ${newProductUploading ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                (productModalMode === "create" && newProductUploading) || !modalHasRequiredProductFields
              }
              className={`flex-1 py-3 font-semibold rounded-xl ui-btn-primary ${
                (productModalMode === "create" && newProductUploading) || !modalHasRequiredProductFields
                  ? "opacity-75 cursor-not-allowed"
                  : ""
              }`}
            >
              {productModalMode === "create"
                ? newProductUploading
                  ? "Creando..."
                  : "Crear producto"
                : "Save Changes"}
            </button>
          </div>

          {!modalHasRequiredProductFields && (
            <p className={`${isDesktopLayout ? "col-span-2" : ""} text-xs font-medium text-rose-600 dark:text-rose-300`}>
              Debes capturar el nombre, Store Price (USD) y Final Price (MXN) para guardar este
              producto. Cancelar sigue disponible.
            </p>
          )}
        </form>
      </div>
    </div>
  );
});

export default ProductModal;
