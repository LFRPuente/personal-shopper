import { V, c, resolveMediaUrl } from "../utils.js";

const MissionSummaryModal = V.memo(function MissionSummaryModal({
  open,
  activeMission,
  missionSummaryStatusFilter,
  setMissionSummaryStatusFilter,
  filteredMissionSummaryTotal,
  filteredMissionSummaryProducts = [],
  formatAmount,
  setFullscreenImage,
  getProductQuickFinalPrice,
  formatProductQuickFinalPrice,
  parseVisualTag,
  getTagClassName,
  dismissActiveOverlayRef,
  overlayBackdropClass,
  overlaySheetClass,
}) {
  if (!open) return null;

  return c.jsx("div", {
    className: overlayBackdropClass(
      "absolute inset-0 z-[66] bg-black/50 flex items-center justify-center ui-backdrop p-3 sm:p-4",
      "shopping-summary",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-lg p-5 rounded-2xl border border-border-light dark:border-border-dark shadow-2xl max-h-[85vh] overflow-y-auto ui-sheet",
        "shopping-summary",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs("div", {
          className: "flex items-center justify-between mb-3",
          children: [
            c.jsx("h3", {
              className: "text-base font-bold text-slate-900 dark:text-slate-100",
              children: "Productos de la Tienda",
            }),
            c.jsx("button", {
              onClick: () => dismissActiveOverlayRef.current(),
              className:
                "w-8 h-8 rounded-full ui-icon-button flex items-center justify-center",
              children: c.jsx("span", {
                className: "material-symbols-outlined text-[16px]",
                children: "close",
              }),
            }),
          ],
        }),
        c.jsxs("div", {
          className: "mb-3 grid grid-cols-[1fr_auto_auto] gap-2 items-center",
          children: [
            c.jsx("select", {
              value: missionSummaryStatusFilter,
              onChange: (event) => setMissionSummaryStatusFilter(event.target.value),
              className:
                "w-full px-3 py-2 text-sm border rounded-xl bg-white text-slate-900 border-slate-300 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary",
              children: [
                c.jsx("option", { value: "ALL", children: "Todos" }),
                c.jsx("option", { value: "ANNOTATED", children: "Anotado" }),
                c.jsx("option", { value: "IN_REVIEW", children: "Revision" }),
                c.jsx("option", { value: "REJECTED", children: "Rechazado" }),
              ],
            }),
            c.jsxs("div", {
              className:
                "rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-right dark:border-sky-800 dark:bg-sky-950/30",
              children: [
                c.jsx("p", {
                  className: "text-[10px] font-semibold text-sky-700 dark:text-sky-300",
                  children: "COMPRA USD",
                }),
                c.jsxs("p", {
                  className: "text-sm font-bold text-slate-900 dark:text-slate-100",
                  children: ["$", formatAmount(filteredMissionSummaryPurchaseTotal)],
                }),
              ],
            }),
            c.jsxs("div", {
              className:
                "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right dark:border-emerald-800 dark:bg-emerald-950/30",
              children: [
                c.jsx("p", {
                  className: "text-[10px] font-semibold text-emerald-700 dark:text-emerald-300",
                  children: "VENTA MXN",
                }),
                c.jsxs("p", {
                  className: "text-sm font-bold text-emerald-900 dark:text-emerald-100",
                  children: ["$", formatAmount(filteredMissionSummaryTotal)],
                }),
              ],
            }),
          ],
        }),
        activeMission &&
          c.jsx("div", {
            className:
              "mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-2",
            children: activeMission.ticket_image
              ? c.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    c.jsx("img", {
                      src: resolveMediaUrl(activeMission.ticket_image),
                      className: "ui-media-frame ui-media-md object-cover",
                    }),
                    c.jsx("button", {
                      onClick: () =>
                        setFullscreenImage(resolveMediaUrl(activeMission.ticket_image)),
                      className:
                        "text-xs font-bold text-primary hover:text-primary-dark",
                      children: "Abrir ticket de misión",
                    }),
                  ],
                })
              : c.jsx("p", {
                  className: "text-[11px] text-gray-500",
                  children: "Esta misión todavía no tiene ticket cargado.",
                }),
          }),
        filteredMissionSummaryProducts.length === 0
          ? c.jsx("p", {
              className: "text-xs text-gray-500 text-center py-6",
              children: "No hay productos para ese filtro en la misión activa.",
            })
          : c.jsx("div", {
              className: "grid grid-cols-3 gap-1.5",
              children: filteredMissionSummaryProducts.map((product) =>
                c.jsxs(
                  "div",
                  {
                    className:
                      "relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark shadow-card ui-card-quiet",
                    children: [
                      c.jsx("div", {
                        className:
                          "relative h-36 bg-[radial-gradient(circle_at_top,rgba(19,127,236,0.10),transparent_42%),linear-gradient(180deg,rgba(244,247,251,0.95),rgba(236,242,248,0.95))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_38%),linear-gradient(180deg,rgba(22,31,43,0.96),rgba(15,23,34,0.98))]",
                        children: [
                          product.image
                            ? c.jsx("img", {
                                src: resolveMediaUrl(product.image),
                                className: "w-full h-full object-cover cursor-zoom-in",
                                onClick: () =>
                                  setFullscreenImage({
                                    url: resolveMediaUrl(product.image),
                                    copyOnClick: !0,
                                    copyMessage: "Imagen copiada.",
                                  }),
                                title: "Abrir imagen",
                              })
                            : c.jsxs("div", {
                                className:
                                  "w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500",
                                children: [
                                  c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-3xl mb-0.5",
                                    children: "image",
                                  }),
                                  c.jsx("span", {
                                    className:
                                      "text-[9px] uppercase font-bold tracking-wide",
                                    children: "No Image",
                                  }),
                                ],
                              }),
                          c.jsx("span", {
                            className:
                              `absolute right-1.5 top-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${String(product.status).toUpperCase() === "IN_REVIEW" ? "bg-amber-100/92 text-amber-800" : String(product.status).toUpperCase() === "REJECTED" ? "bg-rose-100/92 text-rose-700" : String(product.status).toUpperCase() === "BOUGHT" ? "bg-emerald-100/92 text-emerald-700" : String(product.status).toUpperCase() === "SHIPPED" ? "bg-blue-100/92 text-blue-700" : "bg-white/90 text-gray-700"}`,
                            children:
                              String(product.status).toUpperCase() === "IN_REVIEW"
                                ? "Revision"
                                : String(product.status).toUpperCase() === "ANNOTATED"
                                  ? "Anotado"
                                  : String(product.status).toUpperCase() === "BOUGHT"
                                    ? "Comprado"
                                    : String(product.status).toUpperCase() === "SHIPPED"
                                      ? "Enviado"
                                      : String(product.status).toUpperCase() === "REJECTED"
                                        ? "Rechazado"
                                        : product.status,
                          }),
                          c.jsxs("div", {
                            className:
                              "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/45 to-transparent px-2 py-1.5",
                            children: [
                              c.jsx("p", {
                                className: "text-[10px] font-bold text-white truncate",
                                children: product.name,
                              }),
                              c.jsxs("div", {
                                className: "mt-1 flex items-center justify-between gap-1",
                                children: [
                                  c.jsx("span", {
                                    className:
                                      "inline-flex max-w-[70%] truncate rounded-full bg-white/16 px-1.5 py-0.5 text-[9px] font-semibold text-white/92 backdrop-blur-sm",
                                    children:
                                      product.client_name || `Cliente #${product.client}`,
                                  }),
                                  Number.isFinite(getProductQuickFinalPrice(product)) &&
                                    c.jsxs("span", {
                                      className:
                                        "shrink-0 rounded-full bg-white/18 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm",
                                      children: [
                                        "$",
                                        formatProductQuickFinalPrice(product),
                                      ],
                                    }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      product.tags &&
                        c.jsx("div", {
                          className:
                            "px-1.5 py-1 flex flex-wrap gap-1 border-t border-gray-100 dark:border-gray-800 bg-white/75 dark:bg-gray-900/25",
                          children: product.tags
                            .split(",")
                            .map((tag) => parseVisualTag(tag))
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((tag, index) =>
                              c.jsx(
                                "span",
                                {
                                  className: `${getTagClassName(tag.type)} text-[9px] px-1.5 py-0.5 rounded`,
                                  children: tag.label,
                                },
                                `${product.id}-shopping-tag-${index}`,
                              ),
                            ),
                        }),
                      !product.tags &&
                        c.jsx("div", {
                          className: "h-1.5 bg-white dark:bg-gray-900/25",
                        }),
                    ],
                  },
                  product.id,
                ),
              ),
            }),
      ],
    }),
  });
});

export default MissionSummaryModal;
