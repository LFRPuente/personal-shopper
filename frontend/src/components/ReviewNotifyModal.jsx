import { V, c } from "../utils.js";
import ReviewNotifyRecipientSwitch from "./ReviewNotifyRecipientSwitch.jsx";

const ReviewNotifyModal = V.memo(function ReviewNotifyModal(props) {
  const {
    open,
    product,
    client,
    users = [],
    selectedRecipientIds = [],
    message,
    setMessage,
    setSelectedRecipientIds,
    sending,
    onSend,
    onClose,
    overlayBackdropClass,
    overlaySheetClass,
  } = props;
  const [recipientSelectorOpen, setRecipientSelectorOpen] = V.useState(false);

  V.useEffect(() => {
    if (open) setRecipientSelectorOpen(false);
  }, [open, product && product.id, client && client.id]);

  if (!open) return null;

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[94] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
      "review-notify",
    ),
    onClick: onClose,
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "w-full sm:max-w-2xl max-h-[90vh] bg-surface-light dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden ui-sheet flex flex-col",
        "review-notify",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs("div", {
          className:
            "px-4 py-3 border-b border-border-light dark:border-border-dark flex items-start justify-between gap-3",
          children: [
            c.jsxs("div", {
              className: "min-w-0",
              children: [
                c.jsx("p", {
                  className: "text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-300",
                  children: "Mensaje para WAHA",
                }),
                c.jsx("h3", {
                  className: "text-base font-bold text-slate-900 dark:text-slate-100 truncate",
                  children: (product && product.name) || "Producto",
                }),
                c.jsx("p", {
                  className: "text-[11px] text-slate-500 dark:text-slate-300 mt-0.5",
                  children: [
                    "Cliente: ",
                    (client && client.name) || "Cliente",
                  ],
                }),
              ],
            }),
            c.jsx("button", {
              type: "button",
              onClick: onClose,
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
          className: "flex-1 min-h-0 overflow-y-auto ios-scroll px-4 py-4 space-y-4",
          children: [
            c.jsxs("div", {
              className:
                "rounded-2xl border border-border-light dark:border-border-dark bg-slate-50/90 dark:bg-slate-950/40 px-3 py-3 space-y-2",
              children: [
                c.jsx("p", {
                  className: "text-sm font-semibold text-slate-900 dark:text-slate-100",
                  children: "Comentario",
                }),
                c.jsx("textarea", {
                  rows: 4,
                  value: message,
                  onChange: (event) => setMessage(event.target.value),
                  placeholder: "Escribe el comentario que quieres enviar...",
                  className:
                    "w-full px-3 py-2 text-sm border rounded-xl bg-white text-slate-900 border-slate-300 placeholder:text-slate-400 dark:bg-slate-950/70 dark:border-slate-700 dark:text-slate-100 dark:placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-primary/40 resize-none",
                }),
                c.jsx("p", {
                  className: "text-[11px] text-slate-500 dark:text-slate-300",
                  children: [
                    "Se enviará como: ",
                    message ? `"${String(message).trim()}"` : "\"\"",
                    " ",
                    (product && product.name) || "PRODUCTO",
                    " DEL CLIENTE ",
                    (client && client.name) || "CLIENTE",
                    " 💬",
                  ],
                }),
              ],
            }),
            c.jsx(ReviewNotifyRecipientSwitch, {
              enabled: recipientSelectorOpen,
              setEnabled: setRecipientSelectorOpen,
              users,
              selectedRecipientIds,
              setSelectedRecipientIds,
            }),
          ],
        }),
        c.jsxs("div", {
          className:
            "border-t border-border-light dark:border-border-dark px-4 py-3 bg-white/90 dark:bg-slate-950/40 flex items-center justify-between gap-3",
          children: [
            c.jsx("button", {
              type: "button",
              onClick: onClose,
              className:
                "px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 text-sm font-semibold",
              children: "Cancelar",
            }),
            c.jsx("button", {
              type: "button",
              onClick: onSend,
              disabled: sending || (selectedRecipientIds || []).length === 0,
              className:
                "px-4 py-2 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed",
              children: sending ? "Enviando..." : "Enviar mensaje",
            }),
          ],
        }),
      ],
    }),
  });
});

export default ReviewNotifyModal;
