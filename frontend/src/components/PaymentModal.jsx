import { V, c, resolveMediaUrl } from "../utils.js";

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const PaymentModal = V.memo(function PaymentModal(props) {
  const {
    paymentForm,
    paymentSaving,
    paymentModalClient,
    paymentModalShopping,
    paymentModalProducts,
    paymentModalDiscountPercent,
    paymentReservedProductIds,
    paymentFilteredProducts,
    paymentSelectedProducts,
    paymentSelectedProductsTotal,
    paymentCurrentAmountValue,
    paymentDraftAmountValue,
    paymentPreviewAmountValue,
    paymentSuggestedEntryAmount,
    paymentFormBalance,
    paymentHistoryRows,
    paymentProductSearch,
    paymentAmountManual,
    paymentEntryEditingId,
    paymentEntryDraftAmount,
    paymentEntrySavingId,
    formatAmount,
    getProductPaymentAmount,
    setPaymentProductSearch,
    setPaymentAmountManual,
    setPaymentForm,
    setPaymentEntryEditingId,
    setPaymentEntryDraftAmount,
    togglePaymentProductSelection,
    startEditingPaymentEntry,
    cancelEditingPaymentEntry,
    savePaymentEntry,
    deletePaymentEntry,
    savePayment,
    dismissActiveOverlayRef,
    overlayBackdropClass,
    overlaySheetClass,
  } = props;

  if (!paymentModalClient || !paymentModalShopping) return null;

  const paymentSelectedSet = new Set((paymentForm.product_ids || []).map((value) => Number(value)));
  const paymentReservedSet =
    paymentReservedProductIds instanceof Set
      ? paymentReservedProductIds
      : new Set((paymentReservedProductIds || []).map((value) => Number(value)));
  const paymentSelectedCount = paymentSelectedProducts.length;
  const paymentHistoryCount = paymentHistoryRows.length;
  const paymentDiscountLabel =
    Number.isFinite(paymentModalDiscountPercent) && paymentModalDiscountPercent > 0
      ? `${formatAmount(paymentModalDiscountPercent)}%`
      : "0%";

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[92] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
      "payment-modal",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "w-full sm:max-w-6xl max-h-[92vh] bg-surface-light dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden ui-sheet flex flex-col",
        "payment-modal",
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
                  className: "text-[11px] uppercase tracking-wide text-text-sub",
                  children: paymentModalShopping.name || paymentModalShopping.title || "Shopping",
                }),
                c.jsx("h3", {
                  className: "text-base font-bold text-text-main truncate",
                  children: paymentModalClient.name || paymentModalClient.username || "Cliente",
                }),
                c.jsx("p", {
                  className: "text-[11px] text-text-sub mt-0.5",
                  children:
                    paymentForm.id
                      ? "Edita un abono existente o agrega uno nuevo."
                      : "Selecciona los productos y captura el abono.",
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
        c.jsx("div", {
          className:
            "flex-1 overflow-y-auto ios-scroll px-4 py-4 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.85fr)]",
          children: [
            c.jsxs("div", {
              className:
                "rounded-3xl border border-border-light dark:border-border-dark bg-slate-50/80 dark:bg-slate-950/30 p-4 flex flex-col gap-4 min-h-0",
              children: [
                c.jsxs("div", {
                  className: "flex flex-wrap items-center justify-between gap-2",
                  children: [
                    c.jsx("div", {
                      className: "min-w-0",
                      children: c.jsx("h4", {
                        className: "text-sm font-bold text-text-main",
                        children: "Productos",
                      }),
                    }),
                    c.jsxs("span", {
                      className:
                        "inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700",
                      children: [
                        paymentSelectedCount,
                        " seleccionado(s) · Descuento ",
                        paymentDiscountLabel,
                      ],
                    }),
                  ],
                }),
                c.jsx("div", {
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
                      value: paymentProductSearch,
                      onChange: (event) =>
                        setPaymentProductSearch(event.target.value),
                      className:
                        "w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
                    }),
                  ],
                }),
                c.jsx("div", {
                  className: "flex items-center justify-between gap-2 text-[11px] text-text-sub",
                  children: [
                    c.jsx("span", {
                      children: paymentFilteredProducts.length
                        ? `${paymentFilteredProducts.length} producto(s) cargado(s)`
                        : "No hay productos para mostrar con ese filtro.",
                    }),
                    c.jsx("span", {
                      children: paymentAmountManual
                        ? "Monto manual activo"
                        : "Monto sugerido activo",
                    }),
                  ],
                }),
                paymentFilteredProducts.length === 0
                  ? c.jsx("div", {
                    className:
                      "flex-1 min-h-[240px] rounded-2xl border border-dashed border-border-light dark:border-border-dark flex items-center justify-center text-sm text-text-sub bg-white/60 dark:bg-slate-900/40",
                    children: "No hay productos para este cliente con ese filtro.",
                  })
                  : c.jsx("div", {
                    className:
                      "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3",
                    children: paymentFilteredProducts.map((product) => {
                      const productId = Number(product.id);
                      const isSelected = paymentSelectedSet.has(productId);
                      const isReserved =
                        paymentReservedSet.has(productId) && !isSelected;
                      const amount = getProductPaymentAmount(product);
                      return c.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => togglePaymentProductSelection(product),
                          disabled: isReserved,
                          className:
                            `relative overflow-hidden rounded-2xl border text-left ui-media-card ${isSelected ? "border-primary ring-2 ring-primary/30" : "border-border-light dark:border-border-dark"} ${isReserved ? "opacity-50 cursor-not-allowed" : ""} bg-surface-light dark:bg-surface-dark`,
                          children: [
                            product.image
                              ? c.jsx("img", {
                                src: resolveMediaUrl(product.image),
                                className: "w-full aspect-[3/4] object-cover",
                                loading: "lazy",
                                decoding: "async",
                              })
                              : c.jsx("div", {
                                className:
                                  "w-full aspect-[3/4] bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400",
                                children: c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-[24px]",
                                  children: "image",
                                }),
                              }),
                            Number.isFinite(amount) &&
                              c.jsx("div", {
                                className:
                                  "absolute inset-x-0 bottom-1.5 z-20 flex justify-center pointer-events-none",
                                children: c.jsxs("span", {
                                  className:
                                    "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                  children: ["$", formatAmount(amount)],
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
                                    className: "text-[10px] text-white/80 truncate",
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
                            isReserved &&
                              c.jsx("div", {
                                className:
                                  "absolute inset-0 bg-black/20 flex items-center justify-center",
                                children: c.jsx("span", {
                                  className:
                                    "px-2 py-1 rounded-full bg-white/90 text-[10px] font-bold text-slate-700",
                                  children: "Reservado",
                                }),
                              }),
                          ],
                        },
                        `payment-picker-${product.id}`,
                      );
                    }),
                  }),
              ],
            }),
            c.jsxs("div", {
              className: "space-y-4 min-h-0",
              children: [
                c.jsxs("div", {
                  className:
                    "rounded-3xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-slate-900/45 p-4 space-y-4",
                  children: [
                    c.jsxs("div", {
                      className:
                        "flex items-center justify-between gap-2 flex-wrap",
                      children: [
                        c.jsx("div", {
                          className: "min-w-0",
                          children: c.jsx("p", {
                            className:
                              "text-xs font-bold uppercase tracking-wide text-text-sub",
                            children: "Monto del pago",
                          }),
                        }),
                        c.jsxs("div", {
                          className:
                            "text-right text-[11px] text-text-sub flex flex-col items-end",
                          children: [
                            c.jsx("span", {
                              children: `Sugerido: $${formatAmount(paymentSuggestedEntryAmount)}`,
                            }),
                            c.jsx("span", {
                              children: `Total seleccionado: $${formatAmount(paymentSelectedProductsTotal)}`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    c.jsx("input", {
                      type: "number",
                      step: "0.01",
                      inputMode: "decimal",
                      value: paymentForm.amount,
                      onChange: (event) => {
                        setPaymentAmountManual(!0);
                        setPaymentForm((current) => ({
                          ...current,
                          amount: event.target.value,
                        }));
                      },
                      placeholder: "0.00",
                      className:
                        "w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                    }),
                    c.jsxs("div", {
                      className: "flex items-center justify-between gap-2",
                      children: [
                        c.jsx("span", {
                          className:
                            "text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80",
                          children: `Saldo: $${formatAmount(paymentFormBalance)}`,
                        }),
                        c.jsx("button", {
                          type: "button",
                          onClick: () => {
                            setPaymentAmountManual(!1);
                            setPaymentForm((current) => ({
                              ...current,
                              amount:
                                paymentSuggestedEntryAmount > 0
                                  ? paymentSuggestedEntryAmount.toFixed(2)
                                  : "",
                            }));
                          },
                          className:
                            "text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
                          children: "Usar sugerido",
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className:
                    "rounded-3xl border border-border-light dark:border-border-dark bg-slate-50/80 dark:bg-slate-950/30 px-4 py-3.5 space-y-3",
                  children: [
                    c.jsxs("div", {
                      className:
                        "flex items-center justify-between gap-2 flex-wrap",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-xs font-bold uppercase tracking-wide text-text-sub",
                          children: "Historial de abonos",
                        }),
                        c.jsxs("span", {
                          className:
                            "inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700",
                          children: [
                            paymentHistoryCount,
                            " movimiento(s)",
                          ],
                        }),
                      ],
                    }),
                    paymentHistoryCount === 0
                      ? c.jsx("p", {
                        className: "text-[11px] leading-5 text-text-sub",
                        children:
                          "Aun no hay abonos guardados para este cliente.",
                      })
                      : c.jsx("div", {
                        className: "space-y-2 max-h-56 overflow-y-auto ios-scroll pr-1",
                        children: paymentHistoryRows.map((row) => {
                          const isEditing =
                              String(paymentEntryEditingId || "") === String(row.id),
                            allocations = Array.isArray(row.shopping_allocations)
                              ? row.shopping_allocations
                              : [],
                            isGlobalBatch =
                              String((row && row.entry_kind) || "").toUpperCase() ===
                              "CLIENT_BATCH";
                          return c.jsxs(
                            "div",
                            {
                              className:
                                "rounded-2xl border border-violet-100 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/20 px-3 py-2.5",
                              children: [
                                c.jsxs("div", {
                                  className:
                                    "flex items-start justify-between gap-2",
                                  children: [
                                    c.jsxs("div", {
                                      className: "min-w-0",
                                      children: [
                                        c.jsx("p", {
                                          className:
                                            "text-[11px] font-bold text-violet-700 dark:text-violet-200 truncate",
                                          children:
                                            row.shopping_title ||
                                            `Shopping #${row.shopping_id}`,
                                        }),
                                        allocations.length > 0 &&
                                          c.jsx("div", {
                                            className: "mt-1 flex flex-wrap gap-1",
                                            children: allocations.map((allocation) =>
                                              c.jsxs(
                                                "span",
                                                {
                                                  className:
                                                    "inline-flex rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 border border-violet-200 dark:bg-violet-900/40 dark:border-violet-800 dark:text-violet-100",
                                                  children: [
                                                    allocation.shopping_title,
                                                    " $",
                                                    formatAmount(
                                                      Math.abs(
                                                        toNumber(allocation.amount, 0),
                                                      ),
                                                    ),
                                                  ],
                                                },
                                                `payment-history-tag-${row.id}-${allocation.shopping_id}`,
                                              ),
                                            ),
                                          }),
                                        isEditing
                                          ? c.jsxs("div", {
                                            className:
                                              "mt-1 flex items-center gap-1.5",
                                            children: [
                                              c.jsx("input", {
                                                type: "number",
                                                step: "0.01",
                                                inputMode: "decimal",
                                                value: paymentEntryDraftAmount,
                                                onChange: (event) =>
                                                  setPaymentEntryDraftAmount(
                                                    event.target.value,
                                                  ),
                                                className:
                                                  "w-28 px-2.5 py-1.5 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                                              }),
                                              c.jsx("button", {
                                                type: "button",
                                                onClick: () => savePaymentEntry(row),
                                                disabled:
                                                  paymentEntrySavingId ===
                                                  String(row.id),
                                                className:
                                                  "w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center disabled:opacity-60",
                                                children: c.jsx("span", {
                                                  className:
                                                    `material-symbols-outlined text-[14px] ${paymentEntrySavingId === String(row.id) ? "animate-spin" : ""}`,
                                                  children:
                                                    paymentEntrySavingId ===
                                                    String(row.id)
                                                      ? "progress_activity"
                                                      : "check",
                                                }),
                                              }),
                                              c.jsx("button", {
                                                type: "button",
                                                onClick: cancelEditingPaymentEntry,
                                                disabled:
                                                  paymentEntrySavingId ===
                                                  String(row.id),
                                                className:
                                                  "w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-60",
                                                children: c.jsx("span", {
                                                  className:
                                                    "material-symbols-outlined text-[14px]",
                                                  children: "close",
                                                }),
                                              }),
                                            ],
                                          })
                                          : c.jsxs("p", {
                                            className:
                                              "text-[12px] font-bold mt-0.5 text-emerald-700 dark:text-emerald-300",
                                            children: [
                                              toNumber(row.amount, 0) < 0 ? "-$" : "+$",
                                              formatAmount(Math.abs(toNumber(row.amount, 0))),
                                            ],
                                          }),
                                        c.jsxs("p", {
                                          className:
                                            "text-[10px] text-text-sub mt-0.5",
                                          children: [
                                            row.created_at
                                              ? new Date(row.created_at).toLocaleString()
                                              : "Sin fecha",
                                            row.created_by_username
                                              ? ` - ${row.created_by_username}`
                                              : "",
                                          ],
                                        }),
                                      ],
                                    }),
                                    c.jsxs("div", {
                                      className: "text-right shrink-0 space-y-1",
                                      children: [
                                        c.jsxs("p", {
                                          className:
                                            "text-[10px] font-bold text-violet-700 dark:text-violet-200",
                                          children: [
                                            isGlobalBatch ? "Global $" : "Total $",
                                            formatAmount(toNumber(row.total_after, 0)),
                                          ],
                                        }),
                                        !isEditing &&
                                          c.jsxs("div", {
                                            className:
                                              "flex items-center justify-end gap-1",
                                            children: [
                                              c.jsx("button", {
                                                type: "button",
                                                onClick: () => startEditingPaymentEntry(row),
                                                disabled:
                                                  paymentEntrySavingId ===
                                                  String(row.id),
                                                className:
                                                  "w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center disabled:opacity-60",
                                                children: c.jsx("span", {
                                                  className:
                                                    "material-symbols-outlined text-[14px]",
                                                  children: "edit",
                                                }),
                                              }),
                                              c.jsx("button", {
                                                type: "button",
                                                onClick: () => deletePaymentEntry(row),
                                                disabled:
                                                  paymentEntrySavingId ===
                                                  String(row.id),
                                                className:
                                                  "w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center disabled:opacity-60",
                                                children: c.jsx("span", {
                                                  className:
                                                    `material-symbols-outlined text-[14px] ${paymentEntrySavingId === String(row.id) ? "animate-spin" : ""}`,
                                                  children:
                                                    paymentEntrySavingId ===
                                                    String(row.id)
                                                      ? "progress_activity"
                                                      : "delete",
                                                }),
                                              }),
                                            ],
                                          }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            },
                            `payment-history-entry-${row.id}`,
                          );
                        }),
                      }),
                  ],
                }),
                c.jsxs("div", {
                  className: "grid grid-cols-1 sm:grid-cols-3 gap-2",
                  children: [
                    c.jsxs("div", {
                      className:
                        "rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 px-3 py-2",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300",
                          children: "Deuda",
                        }),
                        c.jsxs("p", {
                          className:
                            "text-lg font-bold text-blue-700 dark:text-blue-100 mt-1",
                          children: ["$", formatAmount(paymentSelectedProductsTotal)],
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      className:
                        "rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-3 py-2",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300",
                          children: "Pago",
                        }),
                        c.jsxs("p", {
                          className:
                            "text-lg font-bold text-emerald-700 dark:text-emerald-100 mt-1",
                          children: ["$", formatAmount(paymentPreviewAmountValue)],
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      className:
                        `rounded-2xl border px-3 py-2 ${
                          paymentFormBalance < 0
                            ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                            : paymentFormBalance > 0
                              ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                              : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                        }`,
                      children: [
                        c.jsx("p", {
                          className:
                            `text-[10px] uppercase font-bold ${
                              paymentFormBalance < 0
                                ? "text-emerald-700 dark:text-emerald-300"
                                : paymentFormBalance > 0
                                  ? "text-slate-700 dark:text-slate-300"
                                  : "text-emerald-700 dark:text-emerald-300"
                            }`,
                          children: paymentFormBalance < 0 ? "A favor" : "Deuda",
                        }),
                        c.jsxs("p", {
                          className:
                            `text-lg font-bold mt-1 ${
                              paymentFormBalance < 0
                                ? "text-emerald-700 dark:text-emerald-100"
                                : paymentFormBalance > 0
                                  ? "text-slate-700 dark:text-slate-100"
                                  : "text-emerald-700 dark:text-emerald-100"
                            }`,
                          children: [
                            "$",
                            formatAmount(
                              paymentFormBalance < 0
                                ? Math.abs(paymentFormBalance)
                                : paymentFormBalance,
                            ),
                          ],
                        }),
                      ],
                    }),
                  ],
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
              disabled: paymentSaving,
              className:
                "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 disabled:opacity-60",
              children: "Cancelar",
            }),
            c.jsx("button", {
              onClick: savePayment,
              disabled:
                paymentSaving ||
                paymentSelectedProducts.length === 0 ||
                !Number.isFinite(toNumber(paymentForm.amount, 0)) ||
                toNumber(paymentForm.amount, 0) <= 0,
              className:
                "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold disabled:opacity-70",
              children: paymentSaving ? "Guardando..." : "Guardar",
            }),
          ],
        }),
      ],
    }),
  });
});

export default PaymentModal;
