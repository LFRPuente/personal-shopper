import { V, c } from "../utils.js";

const defaultFmt = (value) => {
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : String(value ?? "");
};

const ShipmentProductPickerModal = V.memo(function ShipmentProductPickerModal({
  shipmentProductPickerOpen,
  overlayBackdropClass = (value) => value,
  overlaySheetClass = (value) => value,
  dismissActiveOverlayRef,
  shipmentProductSearch,
  setShipmentProductSearch,
  shipmentSelectedProducts = [],
  shipmentModalFilteredProducts = [],
  shipmentVisibleProductCards = [],
  shipmentHasMoreProductCards = false,
  shipmentForm = {},
  resolveMediaUrl,
  getProductPaymentAmount,
  toggleShipmentProductSelection,
  toggleAllShipmentProductSelections,
  setShipmentProductRenderLimit,
  setShipmentProductPickerOpen,
  formatAmount = defaultFmt,
}) {
  if (!shipmentProductPickerOpen) return null;
  const selectedProductIds = new Set((shipmentForm.product_ids || []).map(Number));
  const allFilteredProductsSelected =
    shipmentModalFilteredProducts.length > 0 &&
    shipmentModalFilteredProducts.every((product) => selectedProductIds.has(Number(product.id)));

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[90] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
      "shipment-product-picker",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-4xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet flex flex-col overflow-hidden",
        "shipment-product-picker",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs("div", {
          className:
            "px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between gap-3",
          children: [
            c.jsxs("div", {
              className: "min-w-0",
              children: [
                c.jsx("h3", {
                  className: "text-base font-bold text-text-main",
                  children: "Productos del cliente",
                }),
              ],
            }),
            c.jsx("button", {
              onClick: () => dismissActiveOverlayRef.current(),
              className:
                "w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center",
              children: c.jsx("span", {
                className: "material-symbols-outlined text-[18px]",
                children: "close",
              }),
            }),
          ],
        }),
        c.jsxs("div", {
          className:
            "px-4 py-3 border-b border-border-light dark:border-border-dark space-y-3",
          children: [
            c.jsxs("div", {
              className: "relative",
              children: [
                c.jsx("span", {
                  className:
                    "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]",
                  children: "search",
                }),
                c.jsx("input", {
                  type: "text",
                  placeholder: "Buscar producto, shopping o tienda...",
                  value: shipmentProductSearch,
                  onChange: (event) => setShipmentProductSearch(event.target.value),
                  className:
                    "w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
                }),
              ],
            }),
            c.jsxs("div", {
              className: "flex items-center justify-between gap-3",
              children: [
                c.jsxs("p", {
                  className: "text-[11px] text-text-sub",
                  children: [
                    shipmentSelectedProducts.length,
                    " producto(s) seleccionado(s)",
                  ],
                }),
                c.jsxs("button", {
                  type: "button",
                  onClick: () => toggleAllShipmentProductSelections(shipmentModalFilteredProducts),
                  className:
                    "shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors",
                  children: [
                    c.jsx("span", {
                      className: "material-symbols-outlined text-[16px]",
                      children: allFilteredProductsSelected ? "deselect" : "select_all",
                    }),
                    allFilteredProductsSelected ? "Quitar todo" : "Seleccionar todo",
                  ],
                }),
              ],
            }),
          ],
        }),
        shipmentModalFilteredProducts.length === 0
          ? c.jsx("div", {
              className:
                "flex-1 overflow-y-auto ios-scroll px-4 py-10 text-center text-sm text-text-sub",
              children:
                "No hay productos compartibles para este cliente con ese filtro.",
            })
          : c.jsx("div", {
              className: "flex-1 overflow-y-auto ios-scroll px-4 py-4",
              children: [
                c.jsx("div", {
                  className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
                  children: shipmentVisibleProductCards.map((product) => {
                    const isSelected = (shipmentForm.product_ids || []).includes(
                        Number(product.id),
                      ),
                      paymentAmount = getProductPaymentAmount(product);
                    return c.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => toggleShipmentProductSelection(product),
                        className:
                          `relative overflow-hidden rounded-2xl border text-left ui-media-card ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-border-light dark:border-border-dark"} bg-surface-light dark:bg-surface-dark`,
                        children: [
                          product.image
                            ? c.jsx("img", {
                                src: resolveMediaUrl(product.image),
                                className: "w-full aspect-[3/4] object-cover",
                              })
                            : c.jsx("div", {
                                className:
                                  "w-full aspect-[3/4] bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400",
                                children: c.jsx("span", {
                                  className: "material-symbols-outlined text-[24px]",
                                  children: "image",
                                }),
                              }),
                          Number.isFinite(paymentAmount) &&
                            c.jsx("div", {
                              className:
                                "absolute inset-x-0 bottom-1.5 z-20 flex justify-center pointer-events-none",
                              children: c.jsxs("span", {
                                className:
                                  "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                children: ["$", formatAmount(paymentAmount)],
                              }),
                            }),
                          c.jsx("div", {
                            className:
                              "absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/35 to-transparent",
                            children: c.jsxs("div", {
                              className: "space-y-0.5",
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-[11px] font-semibold text-white truncate",
                                  children: product.name,
                                }),
                                c.jsx("p", {
                                  className:
                                    "text-[10px] text-white/80 truncate",
                                  children:
                                    product.shopping_name ||
                                    product.mission_name ||
                                    product.store_name ||
                                    "Sin shopping",
                                }),
                                (product.shopping_date || product.mission_date) &&
                                  c.jsx("p", {
                                    className:
                                      "text-[10px] text-white/70 truncate",
                                    children: new Date(
                                      product.shopping_date ||
                                        product.mission_date,
                                    ).toLocaleDateString(),
                                  }),
                              ],
                            }),
                          }),
                          c.jsx("div", {
                            className:
                              `absolute top-2 right-2 w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary text-white" : "bg-white/85 border-white/90 text-slate-400"}`,
                            children:
                              isSelected &&
                              c.jsx("span", {
                                className:
                                  "material-symbols-outlined text-[15px]",
                                children: "check",
                              }),
                          }),
                        ],
                      },
                      `shipment-picker-${product.id}`,
                    );
                  }),
                }),
                shipmentHasMoreProductCards &&
                  c.jsxs("div", {
                    className: "pt-4 flex flex-col items-center gap-2",
                    children: [
                      c.jsxs("p", {
                        className: "text-[11px] text-text-sub",
                        children: [
                          shipmentVisibleProductCards.length,
                          " de ",
                          shipmentModalFilteredProducts.length,
                          " productos cargados",
                        ],
                      }),
                      c.jsx("button", {
                        type: "button",
                        onClick: () =>
                          setShipmentProductRenderLimit((value) => value + 24),
                        className:
                          "px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold dark:bg-slate-800 dark:hover:bg-slate-700",
                        children: "Mostrar mas",
                      }),
                    ],
                  }),
              ],
            }),
        c.jsxs("div", {
          className:
            "px-4 py-3 border-t border-border-light dark:border-border-dark bg-white/92 dark:bg-slate-950/70 grid grid-cols-2 gap-2",
          children: [
            c.jsx("button", {
              onClick: () => dismissActiveOverlayRef.current(),
              className:
                "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900",
              children: "Cerrar",
            }),
            c.jsx("button", {
              onClick: () => setShipmentProductPickerOpen(false),
              className:
                "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold",
              children: "Usar seleccion",
            }),
          ],
        }),
      ],
    }),
  });
});

export default ShipmentProductPickerModal;
