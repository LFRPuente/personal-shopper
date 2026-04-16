import { V, c } from '../utils.js';

export const REVIEW_CONVERSATION_MODAL_REQUIRED_PROPS = [
  'reviewConversationEntry',
  'reviewConversationScrollRef',
  'dismissActiveOverlayRef',
  'overlayBackdropClass',
  'overlaySheetClass',
  'J',
  'currentConversationStatusActions',
  'altUploadTargetStatus',
  'setAltUploadTargetStatus',
  'altUploadDescription',
  'setAltUploadDescription',
  'altUploadFiles',
  'pickAlternativeUploadImages',
  'sendReviewAlternatives',
  'setFullscreenImage',
  'resolveMediaUrl',
  'getReviewFlowLabel',
];

const ReviewConversationModal = V.memo(function ReviewConversationModal({
  reviewConversationEntry,
  reviewConversationScrollRef,
  dismissActiveOverlayRef,
  overlayBackdropClass,
  overlaySheetClass,
  J,
  currentConversationStatusActions,
  altUploadTargetStatus,
  setAltUploadTargetStatus,
  altUploadDescription,
  setAltUploadDescription,
  altUploadFiles,
  pickAlternativeUploadImages,
  sendReviewAlternatives,
  setFullscreenImage,
  resolveMediaUrl,
  getReviewFlowLabel,
}) {
  if (!reviewConversationEntry) return null;

  const onDismiss = () => {
    if (dismissActiveOverlayRef && dismissActiveOverlayRef.current) {
      dismissActiveOverlayRef.current();
    }
  };

  const messages = [...((reviewConversationEntry.review && reviewConversationEntry.review.messages) || [])].sort(
    (o, N) => new Date(o.created_at || 0).getTime() - new Date(N.created_at || 0).getTime(),
  );

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[79] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
      "review-conversation",
    ),
    onClick: onDismiss,
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "w-full sm:max-w-lg max-h-[82vh] bg-surface-light dark:bg-surface-dark rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden ui-sheet flex flex-col",
        "review-conversation",
      ),
      onClick: (o) => o.stopPropagation(),
      children: [
        c.jsxs("div", {
          className:
            "px-4 py-3 border-b border-border-light dark:border-border-dark flex items-start justify-between gap-3",
          children: [
            c.jsx("p", {
              className: "text-[11px] text-gray-500 dark:text-slate-400",
              children:
                (reviewConversationEntry.product &&
                  reviewConversationEntry.product.name) ||
                "Producto",
            }),
            c.jsx("button", {
              onClick: onDismiss,
              className:
                "w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center",
              children: c.jsx("span", {
                className: "material-symbols-outlined text-[18px]",
                children: "close",
              }),
            }),
          ],
        }),
        c.jsx("div", {
          ref: reviewConversationScrollRef,
          className: "px-3 py-2 flex-1 overflow-y-auto ios-scroll",
          children:
            messages.length > 0
              ? messages.map((o) => {
                  const N =
                    (J && o.sender && Number(o.sender) === Number(J.id)) ||
                    (J &&
                      o.sender_username &&
                      String(o.sender_username).toLowerCase() ===
                        String(J.username || "").toLowerCase());
                  return c.jsxs(
                    "div",
                    {
                      className: `w-full flex ${N ? "justify-end" : "justify-start"} ${N ? "mt-1" : "mt-0.5"}`,
                      children: [
                        c.jsxs("div", {
                          className:
                            `max-w-[88%] rounded-2xl px-3 py-2 ${N ? "ml-auto bg-primary text-white rounded-br-md" : "mr-auto bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md"}`,
                          children: [
                            c.jsxs("div", {
                              className:
                                `flex items-center gap-2 text-[10px] mb-0.5 ${N ? "justify-end text-white/70" : "justify-between text-slate-400 dark:text-slate-500"}`,
                              children: [
                                !N &&
                                c.jsxs("span", {
                                  className:
                                    "font-semibold text-slate-700 dark:text-slate-100",
                                  children: [
                                    o.sender_username || "Usuario",
                                    " • ",
                                    o.sender_role || "AV",
                                  ],
                                }),
                                c.jsx("span", {
                                  className: N ? "inline-flex items-center gap-1 text-white/70" : "",
                                  children: N
                                    ? [
                                        o.created_at
                                          ? new Date(o.created_at).toLocaleString()
                                          : "",
                                        c.jsx(
                                          "span",
                                          {
                                            className:
                                              "material-symbols-outlined text-[12px] leading-none",
                                            children: o.seen_by_other ? "done_all" : "done",
                                          },
                                          `${o.id}-seen-status`,
                                        ),
                                      ]
                                    : o.created_at
                                      ? new Date(o.created_at).toLocaleString()
                                      : "",
                                }),
                              ],
                            }),
                            (o.from_status || o.to_status) &&
                            c.jsx("p", {
                              className:
                                `mb-1 text-[10px] font-semibold ${N ? "text-white/80 text-right" : "text-primary/80 dark:text-sky-300/80"}`,
                              children:
                                o.from_status &&
                                o.to_status &&
                                o.from_status !== o.to_status
                                  ? `${getReviewFlowLabel(o.from_status)} -> ${getReviewFlowLabel(o.to_status)}`
                                  : getReviewFlowLabel(o.to_status || o.from_status),
                            }),
                            o.message &&
                            c.jsx("p", {
                              className:
                                `text-[12px] leading-relaxed whitespace-pre-wrap break-words ${N ? "text-white text-right" : "text-slate-700 dark:text-slate-200"}`,
                              children: o.message,
                            }),
                            (o.attachments || []).length > 0 &&
                            c.jsx("div", {
                              className: `mt-1.5 flex flex-wrap gap-1.5 ${N ? "justify-end" : ""}`,
                              children: (o.attachments || []).map((A) =>
                                c.jsx(
                                  "button",
                                  {
                                    onClick: () =>
                                      setFullscreenImage({
                                        url: resolveMediaUrl(A.file),
                                        copyOnClick: !0,
                                        copyMessage: "Imagen copiada.",
                                      }),
                                    className:
                                      "w-14 h-14 overflow-hidden rounded-lg border border-white/20 dark:border-slate-700 bg-white dark:bg-slate-950",
                                    children: c.jsx("img", {
                                      src: resolveMediaUrl(A.file),
                                      className: "w-full h-full object-cover",
                                    }),
                                  },
                                  A.id,
                                ),
                              ),
                            }),
                          ],
                        }),
                      ],
                    },
                    o.id,
                  );
                })
              : c.jsx("p", {
                  className:
                    "text-sm text-center text-gray-500 dark:text-slate-400 py-8",
                  children: "No hay mensajes guardados en esta revision.",
                }),
        }),
        c.jsxs("div", {
          className:
            "border-t border-border-light dark:border-border-dark px-3 py-3 bg-white/88 dark:bg-slate-950/40 space-y-2.5",
          children: [
            c.jsxs("div", {
              className: "flex items-center justify-between gap-2",
              children: [
                c.jsx("div", {
                  className: "flex items-center gap-1.5",
                  children: currentConversationStatusActions.map((o) =>
                    c.jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => setAltUploadTargetStatus(o.value),
                        className:
                          `px-2.5 py-1.5 rounded-full text-[11px] font-medium border ${altUploadTargetStatus === o.value ? "bg-primary text-white border-primary" : "bg-white/92 dark:bg-slate-900/92 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700"}`,
                        children: o.label,
                      },
                      o.value,
                    ),
                  ),
                }),
                c.jsxs("button", {
                  type: "button",
                  onClick: pickAlternativeUploadImages,
                  className:
                    "shrink-0 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/92 dark:bg-slate-900/92 text-[11px] font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                  children: [
                    "Adjuntar",
                    altUploadFiles.length > 0 ? ` (${altUploadFiles.length})` : "",
                  ],
                }),
              ],
            }),
            c.jsx("textarea", {
              rows: 1,
              value: altUploadDescription,
              onChange: (o) => setAltUploadDescription(o.target.value),
              onKeyDown: (o) => {
                if (o.key !== "Enter" || o.shiftKey) return;
                o.preventDefault();
                sendReviewAlternatives({ closeAfterSave: !1 });
              },
              onInput: (o) => {
                o.target.style.height = "0px";
                o.target.style.height = `${Math.min(o.target.scrollHeight, 128)}px`;
              },
              placeholder: "Comentario opcional para este cambio",
              className:
                "w-full min-h-[38px] max-h-32 px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto ios-scroll",
            }),
            c.jsxs("div", {
              className:
                "flex items-center justify-between gap-3 text-[10px] text-gray-500 dark:text-slate-400",
              children: [
                c.jsx("span", {
                  children: "Comentario opcional",
                }),
                altUploadFiles.length > 0 &&
                c.jsxs("span", {
                  children: ["Archivos: ", altUploadFiles.length],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "grid grid-cols-2 gap-2",
              children: [
                c.jsx("button", {
                  onClick: onDismiss,
                  className:
                    "py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 text-xs font-semibold",
                  children: "Cerrar",
                }),
                c.jsx("button", {
                  onClick: () => sendReviewAlternatives({ closeAfterSave: !1 }),
                  className:
                    "py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-dark",
                  children: "Enviar",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
});

export default ReviewConversationModal;
