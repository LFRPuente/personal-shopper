import { V, c } from "../utils.js";
import HomeClientGalleryPanel from "./HomeClientGalleryPanel.jsx";

const fmt = (value) => {
  const n = Number(value);
  return Number.isFinite(n)
    ? n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(value ?? "");
};

const HomeClientProductCard = V.memo(function HomeClientProductCard({
  product,
  reviewEntry,
  unread,
  currentGalleryStatus,
  galleryStatusActions,
  galleryStatusButtonTone,
  isDesktopLayout,
  openProductMenuId,
  openProductInfoId,
  openProductStatusId,
  productImageUploadingId,
  productStatusUpdatingId,
  resolveMediaUrl,
  setFullscreenImage,
  onToggleProductMenu,
  onToggleProductInfo,
  onToggleProductStatus,
  onEditProduct,
  onChangeProductPhoto,
  onDeleteProduct,
  onOpenConversation,
  onSetProductStatus,
  getReviewFlowLabel,
  getProductImagePrimaryPrice,
  hasProductDiscountedFinalPrice,
  getProductBaseFinalPrice,
  formatProductQuickFinalPrice,
  parseVisualTag,
  getTagClassName,
  hasValue,
}) {
  const menuOpen = openProductMenuId === product.id;
  const infoOpen = openProductInfoId === product.id;
  const statusOpen = openProductStatusId === product.id;
  const price = getProductImagePrimaryPrice(product);

  return c.jsxs("div", {
    className: `bg-surface-light dark:bg-surface-dark ${isDesktopLayout ? "rounded-2xl" : "rounded-lg"} overflow-visible shadow-card border flex flex-col relative group ui-card-quiet ui-media-card ${unread ? "review-item-alert border-red-400 bg-red-50/40 dark:bg-red-950/18" : "border-border-light dark:border-border-dark"}`,
    children: [
      unread && c.jsx("span", { className: "absolute top-1.5 left-1.5 z-20 w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-slate-900" }),
      c.jsxs("div", {
        className: "absolute top-1.5 right-1.5 z-30",
        children: [
          c.jsx("button", {
            onClick: (e) => {
              e.stopPropagation();
              onToggleProductInfo(null);
              onToggleProductStatus(null);
              onToggleProductMenu(menuOpen ? null : product.id);
            },
            className: "w-6 h-6 rounded-full bg-white/38 text-gray-700 hover:bg-white/56 border border-white/35 shadow-sm backdrop-blur-[2px] flex items-center justify-center",
            title: "Opciones",
            children: c.jsx("span", { className: "material-symbols-outlined text-[12px]", children: "more_vert" }),
          }),
          menuOpen &&
            c.jsxs("div", {
              className: "absolute right-0 top-9 z-40 w-36 rounded-xl border border-gray-200 bg-white shadow-lg p-1 ui-pop",
              children: [
                c.jsxs("button", {
                  onClick: (e) => {
                    e.stopPropagation();
                    onToggleProductMenu(null);
                    onEditProduct(product);
                  },
                  className: "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-blue-700 hover:bg-blue-50",
                  children: [c.jsx("span", { className: "material-symbols-outlined text-[14px]", children: "edit" }), "Editar"],
                }),
                c.jsxs("button", {
                  onClick: (e) => {
                    e.stopPropagation();
                    onToggleProductMenu(null);
                    onChangeProductPhoto(product);
                  },
                  disabled: productImageUploadingId === product.id,
                  className: `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-purple-700 ${productImageUploadingId === product.id ? "opacity-60 cursor-wait bg-purple-50" : "hover:bg-purple-50"}`,
                  children: [
                    c.jsx("span", {
                      className: `material-symbols-outlined text-[14px] ${productImageUploadingId === product.id ? "animate-spin" : ""}`,
                      children: productImageUploadingId === product.id ? "progress_activity" : "add_a_photo",
                    }),
                    productImageUploadingId === product.id ? "Subiendo foto" : "Cambiar foto",
                  ],
                }),
                c.jsxs("button", {
                  onClick: (e) => {
                    e.stopPropagation();
                    onToggleProductMenu(null);
                    onDeleteProduct(product.id);
                  },
                  className: "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-red-700 hover:bg-red-50",
                  children: [c.jsx("span", { className: "material-symbols-outlined text-[14px]", children: "delete" }), "Eliminar"],
                }),
              ],
            }),
        ],
      }),
      c.jsx("div", {
        className: "absolute top-1.5 left-1.5 z-20",
        children: c.jsx("button", {
          onClick: (e) => {
            e.stopPropagation();
            onToggleProductMenu(null);
            onToggleProductStatus(null);
            onToggleProductInfo(infoOpen ? null : product.id);
          },
          className: "w-6 h-6 rounded-full bg-white/38 text-gray-700 hover:bg-white/56 border border-white/35 shadow-sm backdrop-blur-[2px] flex items-center justify-center",
          title: "Info del producto",
          children: c.jsx("span", { className: "material-symbols-outlined text-[12px]", children: "info" }),
        }),
      }),
      c.jsxs("div", {
        className: `${isDesktopLayout ? "h-48" : "h-36"} w-full bg-[radial-gradient(circle_at_top,rgba(19,127,236,0.10),transparent_42%),linear-gradient(180deg,rgba(244,247,251,0.95),rgba(236,242,248,0.95))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_38%),linear-gradient(180deg,rgba(22,31,43,0.96),rgba(15,23,34,0.98))] relative flex items-center justify-center`,
        children: [
          c.jsx("div", {
            className: "absolute inset-0 overflow-hidden",
            children: product.image
              ? c.jsx("img", {
                  src: resolveMediaUrl(product.image),
                  className: "w-full h-full object-cover cursor-zoom-in",
                  onClick: () =>
                    setFullscreenImage({
                      url: resolveMediaUrl(product.image),
                      copyOnClick: true,
                      copyMessage: "Imagen copiada.",
                    }),
                  title: "Abrir imagen",
                })
              : c.jsxs("div", {
                  className: "w-full h-full flex flex-col items-center justify-center text-gray-400",
                  children: [
                    c.jsx("span", { className: "material-symbols-outlined text-3xl mb-0.5", children: "image" }),
                    c.jsx("span", { className: "text-[9px] uppercase font-bold", children: "No Image" }),
                  ],
                }),
          }),
          c.jsxs("div", {
            className: "absolute left-0.5 bottom-0.5 z-20",
            children: [
              c.jsx("button", {
                onClick: (e) => {
                  e.stopPropagation();
                  onToggleProductInfo(null);
                  onToggleProductMenu(null);
                  onToggleProductStatus(statusOpen ? null : product.id);
                },
                disabled: productStatusUpdatingId === product.id,
                className: `w-6 h-6 rounded-full border shadow-sm backdrop-blur-[2px] flex items-center justify-center ${galleryStatusButtonTone} ${productStatusUpdatingId === product.id ? "opacity-70 cursor-wait" : ""}`,
                title: `Cambiar status (${getReviewFlowLabel(currentGalleryStatus)})`,
                children: c.jsx("span", {
                  className: `material-symbols-outlined text-[12px] ${productStatusUpdatingId === product.id ? "animate-spin" : ""}`,
                  children: productStatusUpdatingId === product.id ? "progress_activity" : currentGalleryStatus === "REVIEW" ? "pending_actions" : currentGalleryStatus === "REJECTED" ? "cancel" : "task_alt",
                }),
              }),
              statusOpen &&
                c.jsxs("div", {
                  className: "absolute left-0 bottom-7 min-w-[116px] rounded-xl border border-slate-200/90 bg-white/96 p-1 shadow-xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/96",
                  children: [
                    c.jsx("div", { className: "px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400", children: "Cambiar status" }),
                    (galleryStatusActions || []).map((action) =>
                      c.jsxs("button", {
                        onClick: (e) => {
                          e.stopPropagation();
                          onSetProductStatus(product, reviewEntry || null, action.value);
                        },
                        disabled: productStatusUpdatingId === product.id,
                        className: "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 disabled:opacity-60 disabled:cursor-wait",
                        children: [
                          c.jsx("span", { children: action.label }),
                          c.jsx("span", { className: "material-symbols-outlined text-[13px]", children: action.value === "REVIEW" ? "pending_actions" : action.value === "REJECTED" ? "cancel" : "task_alt" }),
                        ],
                      }, action.value),
                    ),
                  ],
                }),
            ],
          }),
          Number.isFinite(price) &&
            c.jsx("div", {
              className: "absolute inset-x-0 bottom-0.5 z-20 flex justify-center pointer-events-none",
              children: hasProductDiscountedFinalPrice(product)
                ? c.jsxs("div", {
                    className: "inline-flex flex-col items-center gap-0.5 rounded-2xl bg-white/82 dark:bg-slate-900/82 px-2.5 py-1 text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                    children: [
                      c.jsxs("span", { className: "whitespace-nowrap text-[9px] font-bold", children: ["Venta $", fmt(getProductBaseFinalPrice(product))] }),
                      c.jsxs("span", { className: "whitespace-nowrap text-[9px] font-black text-emerald-700 dark:text-emerald-300", children: ["C/desc $", formatProductQuickFinalPrice(product)] }),
                    ],
                  })
                : c.jsxs("span", { className: "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md", children: ["$", fmt(price)] }),
            }),
          c.jsx("div", {
            className: "absolute right-0.5 bottom-0.5 z-20",
            children: c.jsxs("button", {
              onClick: (e) => {
                e.stopPropagation();
                onToggleProductInfo(null);
                onToggleProductMenu(null);
                onToggleProductStatus(null);
                onOpenConversation(product, reviewEntry || null);
              },
              className: "px-0.5 py-[1px] rounded-full bg-white/34 text-slate-700 hover:bg-white/50 border border-white/30 shadow-sm backdrop-blur-[2px] inline-flex items-center gap-0.5",
              title: "Historial de conversacion",
              children: c.jsx("span", { className: "material-symbols-outlined text-[10px]", children: "chat" }),
            }),
          }),
          productImageUploadingId === product.id &&
            c.jsxs("div", {
              className: "absolute inset-0 z-10 bg-black/60 text-white flex flex-col items-center justify-center gap-1.5",
              children: [
                c.jsx("span", { className: "material-symbols-outlined animate-spin text-xl", children: "progress_activity" }),
                c.jsx("span", { className: "text-[11px] font-semibold", children: "Subiendo imagen..." }),
                c.jsx("span", { className: "text-[9px] opacity-85", children: "Esperando confirmacion del servidor" }),
              ],
            }),
          product.tags &&
            c.jsx("div", {
              className: "absolute left-1 right-8 bottom-6 flex flex-wrap gap-1",
              children: product.tags
                .split(",")
                .map((tag) => parseVisualTag(tag))
                .filter(Boolean)
                .slice(0, 4)
                .map((tag, index) =>
                  c.jsx("span", {
                    className: `${getTagClassName(tag.type)} text-[9px] px-1.5 py-0.5 rounded`,
                    children: tag.label,
                  }, `${product.id}-tag-${index}`),
                ),
            }),
        ],
      }),
      infoOpen &&
        c.jsxs("div", {
          className: "absolute inset-1 z-20 rounded-md bg-black/75 text-white p-2 overflow-y-auto",
          children: [
            c.jsxs("div", {
              className: "flex items-center justify-between gap-2 mb-1",
              children: [
                c.jsx("p", { className: "text-[10px] font-bold truncate", children: product.name }),
                c.jsx("button", {
                  onClick: (e) => {
                    e.stopPropagation();
                    onToggleProductInfo(null);
                  },
                  className: "w-5 h-5 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center",
                  children: c.jsx("span", { className: "material-symbols-outlined text-[12px]", children: "close" }),
                }),
              ],
            }),
            c.jsxs("p", { className: "text-[10px] uppercase tracking-wide opacity-90", children: ["Estado: ", product.status] }),
            (product.shopping_date || product.mission_date) &&
              c.jsxs("p", {
                className: "text-[10px] opacity-90",
                children: ["Shopping: ", new Date(product.shopping_date || product.mission_date).toLocaleDateString()],
              }),
            product.tags && c.jsxs("p", { className: "text-[10px] mt-1 break-words", children: ["Tags: ", product.tags] }),
            c.jsxs("div", {
              className: "text-[10px] mt-1",
              children: [
                hasValue(product.charged_price) && c.jsxs("p", { children: ["Final: $", product.charged_price] }),
                hasValue(product.real_price) && c.jsxs("p", { children: ["Tienda: $", product.real_price] }),
              ],
            }),
          ],
        }),
    ],
  });
});

const DEFAULT_GALLERY_TAB_ORDER = ["REVIEW", "ANNOTATED", "REJECTED"];

const HomeClientOverlay = V.memo(function HomeClientOverlay({
  client,
  isDesktopLayout,
  closingOverlayKey,
  overlayBackdropClass = (value) => value,
  overlaySheetClass = (value) => value,
  dismissActiveOverlayRef,
  onRefresh,
  copiedClientShareLinks = [],
  onToggleCopiedClientShareLink,
  galleryTab,
  setGalleryTab,
  galleryTabOrder = DEFAULT_GALLERY_TAB_ORDER,
  galleryReviewCount = 0,
  galleryAnnotatedCount = 0,
  galleryRejectedCount = 0,
  selectedClientHomeGlobalBalance = 0,
  selectedClientHomeAnnotatedTotals = { sale: 0 },
  sortedVisibleGalleryProducts = [],
  latestReviewsByProduct = {},
  effectiveHomeClientReviewUnreadMap = {},
  openProductMenuId = null,
  openProductInfoId = null,
  openProductStatusId = null,
  productImageUploadingId = null,
  productStatusUpdatingId = null,
  missionDiscountPercentage = 0,
  newProductUploading = false,
  userRole = "",
  formatAmount = fmt,
  resolveMediaUrl,
  setFullscreenImage,
  onToggleProductMenu,
  onToggleProductInfo,
  onToggleProductStatus,
  onEditProduct,
  onChangeProductPhoto,
  onDeleteProduct,
  onOpenConversation,
  onSetProductStatus,
  getUnifiedReviewState,
  getProductReviewState,
  getChatStatusActionOptions,
  getReviewFlowLabel,
  parseVisualTag,
  getTagClassName,
  hasValue,
  getProductImagePrimaryPrice,
  hasProductDiscountedFinalPrice,
  getProductBaseFinalPrice,
  formatProductQuickFinalPrice,
  onAddNewProduct,
}) {
  if (!client) return null;

  const overlayKey = "client-home";
  const copyKey = `client-history-${client.id}`;
  const isCopied = copiedClientShareLinks.includes(copyKey);

  return c.jsxs("div", {
    className: overlayBackdropClass(
      `${isDesktopLayout ? "fixed inset-0 z-[72] bg-slate-950/45 backdrop-blur-sm p-5 lg:p-6 flex items-stretch justify-center" : "absolute inset-0 z-50 bg-background-light dark:bg-background-dark flex flex-col overflow-x-hidden animate-in slide-in-from-bottom duration-300"} ui-backdrop${closingOverlayKey === overlayKey ? " ui-backdrop-out" : ""}`,
      overlayKey,
    ),
    onClick: isDesktopLayout ? () => dismissActiveOverlayRef.current() : void 0,
    children: [
      c.jsxs("div", {
        className: overlaySheetClass(
          `${isDesktopLayout ? "w-full max-w-[1500px] rounded-[32px] border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark shadow-[0_32px_80px_rgba(15,23,42,0.38)] flex flex-col overflow-hidden animate-in fade-in zoom-in-[0.98] duration-200" : "flex flex-col h-full"} ui-sheet${closingOverlayKey === overlayKey ? " ui-sheet-out" : ""}`,
          overlayKey,
        ),
        onClick: isDesktopLayout ? (e) => e.stopPropagation() : void 0,
        children: [
          c.jsxs("div", {
            className: "sticky top-0 z-10 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md pb-0 border-b border-border-light dark:border-border-dark shadow-sm",
            children: [
              c.jsxs("div", {
                className: isDesktopLayout ? "px-6 py-5 flex items-center justify-between gap-4" : "p-4 flex items-center justify-between",
                children: [
                  c.jsx("button", {
                    onClick: () => dismissActiveOverlayRef.current(),
                    className: "w-10 h-10 flex items-center justify-center rounded-full ui-icon-button",
                    children: c.jsx("span", { className: "material-symbols-outlined", children: "arrow_back" }),
                  }),
                  c.jsx("h2", {
                    className: isDesktopLayout ? "font-bold text-2xl truncate max-w-[420px]" : "font-bold text-lg truncate max-w-[200px]",
                    children: client.name,
                  }),
                  c.jsx("div", {
                    className: "w-10 flex items-center justify-end",
                    children: c.jsx("button", {
                      onClick: onRefresh,
                      className: "opacity-50 hover:opacity-100",
                    children: c.jsx("span", { className: "material-symbols-outlined", children: "refresh" }),
                    }),
                  }),
                ],
              }),
            ],
          }),
          c.jsxs("div", {
            className: isDesktopLayout ? "p-6 flex-1 overflow-y-auto grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] items-start" : "p-5 flex-1 overflow-y-auto space-y-6",
            children: [
              c.jsxs("div", {
                className: isDesktopLayout ? "bg-surface-light dark:bg-surface-dark p-5 rounded-3xl shadow-card border border-border-light dark:border-border-dark space-y-4 xl:sticky xl:top-6" : "bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-border-light space-y-3",
                children: [
                  c.jsxs("div", {
                    className: "flex items-start justify-between gap-3",
                    children: [
                      c.jsxs("div", {
                        className: "min-w-0 flex items-center gap-4 flex-1",
                        children: [
                          c.jsx("div", {
                            className: "w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl uppercase border shrink-0",
                            children: (client.name || "?").charAt(0),
                          }),
                          c.jsxs("div", {
                            className: "min-w-0",
                            children: [
                              c.jsx("p", { className: "text-xs text-text-sub dark:text-slate-400 truncate", children: client.tags }),
                              c.jsxs("div", {
                                className: "mt-1.5 space-y-0.5",
                                children: [
                                  c.jsxs("p", {
                                    className: `inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold ${selectedClientHomeGlobalBalance < 0 ? "text-emerald-700 dark:text-emerald-300" : selectedClientHomeGlobalBalance > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"}`,
                                    children: [selectedClientHomeGlobalBalance < 0 ? "A favor: " : "Deuda: ", "$", formatAmount(Math.abs(selectedClientHomeGlobalBalance))],
                                  }),
                                  c.jsxs("p", {
                                    className: "inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-blue-700 dark:text-blue-300",
                                    children: ["Venta: $", formatAmount(selectedClientHomeAnnotatedTotals.sale)],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      c.jsx("button", {
                        type: "button",
                        onClick: () => onToggleCopiedClientShareLink && onToggleCopiedClientShareLink(client),
                        className: `w-9 h-9 rounded-full border shrink-0 flex items-center justify-center transition ${isCopied ? "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-200" : "border-border-light dark:border-border-dark bg-white/80 dark:bg-slate-900/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/30"}`,
                        title: "Copiar link del cliente",
                        children: c.jsx("span", { className: "material-symbols-outlined text-[18px]", children: "share" }),
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: "flex gap-2",
                    children: [
                      c.jsxs("span", {
                        className: `flex-1 rounded-lg border px-2 py-1.5 shadow-sm text-center flex flex-col items-center justify-center gap-0.5 ${selectedClientHomeGlobalBalance < 0 ? "border-emerald-200 bg-emerald-50/90" : selectedClientHomeGlobalBalance > 0 ? "border-rose-200 bg-rose-50/95" : "border-slate-200 bg-slate-50/95"}`,
                        children: [c.jsx("span", { className: `text-[9px] font-black uppercase ${selectedClientHomeGlobalBalance < 0 ? "text-emerald-700/75" : selectedClientHomeGlobalBalance > 0 ? "text-rose-700/75" : "text-slate-700/75"}`, children: selectedClientHomeGlobalBalance < 0 ? "A favor" : "Deuda" }), c.jsxs("span", { className: selectedClientHomeGlobalBalance < 0 ? "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-emerald-800" : selectedClientHomeGlobalBalance > 0 ? "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-rose-800" : "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-slate-800", children: ["$", formatAmount(Math.abs(selectedClientHomeGlobalBalance))] })],
                      }),
                      c.jsxs("span", {
                        className: "flex-1 rounded-lg border border-blue-200 bg-blue-50/95 px-2 py-1.5 shadow-sm text-center flex flex-col items-center justify-center gap-0.5",
                        children: [c.jsx("span", { className: "text-[9px] font-black uppercase text-blue-700/75", children: "Venta" }), c.jsxs("span", { className: "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-blue-800", children: ["$", formatAmount(selectedClientHomeAnnotatedTotals.sale)] })],
                      }),
                    ],
                  }),
                ],
              }),
              c.jsx(HomeClientGalleryPanel, {
                isDesktopLayout,
                client,
                galleryTab,
                setGalleryTab,
                galleryTabOrder,
                galleryReviewCount,
                galleryAnnotatedCount,
                galleryRejectedCount,
                sortedVisibleGalleryProducts,
                latestReviewsByProduct,
                effectiveHomeClientReviewUnreadMap,
                onAddNewProduct,
                newProductUploading,
                userRole,
                renderProductCard: ({ product, reviewEntry, unread }) => {
                  const currentGalleryStatus = getUnifiedReviewState(
                    getProductReviewState(product, reviewEntry || null),
                  );
                  const galleryStatusActions =
                    getChatStatusActionOptions(currentGalleryStatus);
                  const galleryStatusButtonTone =
                    currentGalleryStatus === "REVIEW"
                      ? "bg-amber-100/88 text-amber-800 border-amber-200/80 hover:bg-amber-100"
                      : currentGalleryStatus === "REJECTED"
                        ? "bg-rose-100/88 text-rose-800 border-rose-200/80 hover:bg-rose-100"
                        : "bg-emerald-100/88 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100";
                  return c.jsx(
                    HomeClientProductCard,
                    {
                      product,
                      reviewEntry,
                      unread,
                      currentGalleryStatus,
                      galleryStatusActions,
                      galleryStatusButtonTone,
                      isDesktopLayout,
                      openProductMenuId,
                      openProductInfoId,
                      openProductStatusId,
                      productImageUploadingId,
                      productStatusUpdatingId,
                      resolveMediaUrl,
                      setFullscreenImage,
                      onToggleProductMenu,
                      onToggleProductInfo,
                      onToggleProductStatus,
                      onEditProduct,
                      onChangeProductPhoto,
                      onDeleteProduct,
                      onOpenConversation,
                      onSetProductStatus,
                      getReviewFlowLabel,
                      getProductImagePrimaryPrice,
                      hasProductDiscountedFinalPrice,
                      getProductBaseFinalPrice,
                      formatProductQuickFinalPrice,
                      parseVisualTag,
                      getTagClassName,
                      hasValue,
                      formatAmount,
                    },
                    product.id,
                  );
                },
              }),
            ],
          }),
        ],
      }),
    ],
  });
});

export default HomeClientOverlay;
