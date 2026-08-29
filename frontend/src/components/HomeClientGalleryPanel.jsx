import { V, c } from "../utils.js";

const DEFAULT_GALLERY_TAB_ORDER = ["REVIEW", "ANNOTATED", "REJECTED"];

const HomeClientGalleryPanel = V.memo(function HomeClientGalleryPanel({
  isDesktopLayout,
  galleryTab,
  setGalleryTab,
  galleryTabOrder = DEFAULT_GALLERY_TAB_ORDER,
  galleryReviewCount = 0,
  galleryAnnotatedCount = 0,
  galleryRejectedCount = 0,
  sortedVisibleGalleryProducts = [],
  latestReviewsByProduct = {},
  effectiveHomeClientReviewUnreadMap = {},
  client,
  onAddNewProduct,
  newProductUploading = false,
  userRole = "",
  renderProductCard,
}) {
  if (!client) return null;

  const galleryTabConfig = {
    REVIEW: {
      label: "Revision",
      count: galleryReviewCount,
      title: "Productos en revision",
    },
    ANNOTATED: {
      label: "Anotado",
      count: galleryAnnotatedCount,
      title: "Productos anotados",
    },
    REJECTED: {
      label: "Rechazado",
      count: galleryRejectedCount,
      title: "Productos rechazados",
    },
  };

  const orderedGalleryTabs = (Array.isArray(galleryTabOrder) && galleryTabOrder.length
    ? galleryTabOrder
    : DEFAULT_GALLERY_TAB_ORDER
  ).filter((status) => galleryTabConfig[status]);

  const activeGalleryTab = galleryTabConfig[galleryTab] || galleryTabConfig.ANNOTATED;

  return c.jsxs("div", {
    className: isDesktopLayout ? "animate-in fade-in duration-200 space-y-4" : "animate-in fade-in duration-200",
    children: [
      c.jsxs("div", {
        className: "mb-4",
        children: [
          c.jsx("h4", { className: "font-bold text-lg", children: activeGalleryTab.title }),
          c.jsxs("p", {
            className: "text-xs text-gray-500 mt-1",
            children: [
              "Anotado: ",
              galleryAnnotatedCount,
              " - Revision: ",
              galleryReviewCount,
              " - Rechazado: ",
              galleryRejectedCount,
            ],
          }),
        ],
      }),
      c.jsx("div", {
        className:
          isDesktopLayout
            ? "bg-surface-light dark:bg-surface-dark p-4 rounded-2xl shadow-card border border-border-light dark:border-border-dark"
            : "bg-surface-light dark:bg-surface-dark p-3 rounded-xl shadow-sm border border-border-light dark:border-border-dark",
        children: c.jsxs("div", {
          className: "flex items-center gap-4 text-sm font-bold overflow-x-auto",
          children: orderedGalleryTabs.map((status) =>
            c.jsx(
              "button",
              {
                onClick: () => setGalleryTab(status),
                className: `pb-3 border-b-2 transition-colors ${
                  galleryTab === status
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"
                }`,
                children: [galleryTabConfig[status].label, " (", galleryTabConfig[status].count, ")"],
              },
              status,
            ),
          ),
        }),
      }),
      c.jsxs("div", {
        className:
          isDesktopLayout
            ? "grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
            : "grid grid-cols-3 gap-1",
        children: [
          c.jsxs(
            "div",
            {
              onClick: newProductUploading ? void 0 : onAddNewProduct,
              className: `bg-gray-50 dark:bg-gray-800 ${
                isDesktopLayout ? "rounded-2xl h-52" : "rounded-lg h-40"
              } flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 transition group ${
                newProductUploading
                  ? "cursor-wait opacity-75 border-primary/40"
                  : "cursor-pointer hover:bg-primary/5 hover:border-primary/40"
              }`,
              children: [
                c.jsx("span", {
                  className: `material-symbols-outlined text-3xl text-primary mb-2 transition-transform ${
                    newProductUploading ? "animate-spin" : "group-hover:scale-110"
                  }`,
                  children: newProductUploading ? "progress_activity" : "add_photo_alternate",
                }),
                c.jsx("span", {
                  className: "text-sm font-semibold text-center px-4",
                  children: newProductUploading
                    ? "Subiendo imagen..."
                    : userRole === "PS"
                      ? "+ Photo / Found Product"
                      : "+ Photo / Pre-order",
                }),
                newProductUploading &&
                  c.jsx("span", {
                    className: "text-[11px] text-text-sub mt-1 px-4 text-center",
                    children: "No cierres la ventana hasta que termine la carga.",
                  }),
              ],
            },
            "add-product-card",
          ),
          sortedVisibleGalleryProducts.map((product) => {
            const reviewEntry = latestReviewsByProduct[product.id];
            const unread = !!(effectiveHomeClientReviewUnreadMap[client.id] || {})[product.id];
            return renderProductCard({
              product,
              reviewEntry,
              unread,
            });
          }),
        ],
      }),
    ],
  });
});

export default HomeClientGalleryPanel;
