import { V, c } from "../utils.js";

const ClientPaymentModal = V.memo(function ClientPaymentModal(props) {
  const {
    clientPaymentModalOpen,
    clientPaymentModalClient,
    clientPaymentReceivingTargets,
    clientPaymentTargets,
    clientPaymentAllocatedTotal,
    clientPaymentPlan,
    clientPaymentForm,
    setClientPaymentAmountManual,
    setClientPaymentForm,
    clientPaymentTotalDebt,
    clientPaymentHistoryRows,
    clientPaymentEntryEditingId,
    clientPaymentEntryDraftAmount,
    setClientPaymentEntryDraftAmount,
    saveClientPaymentHistoryRow,
    clientPaymentEntrySavingId,
    cancelEditingClientPaymentEntry,
    paymentLocalToNumber,
    formatAmount,
    startEditingClientPaymentEntry,
    deleteClientPaymentHistoryRow,
    clientPaymentBalance,
    clientPaymentSaving,
    saveClientPayment,
    clientPaymentAmountValue,
    onDismiss,
    overlayBackdropClass,
    overlaySheetClass,
  } = props;

  if (!clientPaymentModalOpen) return null;

  const clientPaymentIsDebtAdjustment =
    paymentLocalToNumber(clientPaymentForm.amount, 0) < 0;
  const clientPaymentIsCreditAdjustment =
    !clientPaymentIsDebtAdjustment &&
    clientPaymentPlan.some((plan) => plan && plan.isCreditAdjustment);

  const renderShoppingPlanCard = (plan) => {
    const isDebtAdjustment = Boolean(plan.isDebtAdjustment);
    const isCreditAdjustment = Boolean(plan.isCreditAdjustment);
    return c.jsxs(
      "div",
      {
        className: `rounded-2xl border px-3 py-3 transition ${
          isDebtAdjustment
            ? "border-rose-300 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/30"
            : isCreditAdjustment
              ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
            : plan.isReceiving
            ? "border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30"
            : "border-border-light bg-white dark:border-border-dark dark:bg-slate-900/50"
        }`,
        children: [
          c.jsxs("div", {
            className: "flex items-start justify-between gap-3",
            children: [
              c.jsxs("div", {
                className: "min-w-0 flex-1",
                children: [
                  c.jsx("p", {
                    className:
                      "text-sm font-semibold truncate text-text-main dark:text-white",
                    children: plan.title,
                  }),
                  c.jsxs("p", {
                    className: "text-[11px] text-text-sub mt-0.5",
                    children: [
                      plan.date
                        ? new Date(plan.date).toLocaleDateString()
                        : "Sin fecha",
                      " - ",
                      Number.isFinite(plan.annotatedCount)
                        ? plan.annotatedCount
                        : plan.items.length,
                      " item(s)",
                    ],
                  }),
                  c.jsxs("div", {
                    className: "mt-2 flex flex-wrap gap-1",
                    children: [
                      c.jsxs("span", {
                        className:
                          "inline-flex rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700",
                        children: [
                          "Venta: $",
                          formatAmount(plan.productsTotal),
                        ],
                      }),
                      c.jsxs("span", {
                        className:
                          "inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700",
                        children: [
                          "Pagado: $",
                          formatAmount(plan.paymentsTotal),
                        ],
                      }),
                      c.jsxs("span", {
                        className:
                          "inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700",
                        children: [
                          "Deuda: $",
                          formatAmount(plan.debtAmount),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "shrink-0 text-right flex flex-col items-end gap-1",
                children: [
                  plan.isReceiving
                    ? c.jsx("span", {
                        className:
                          isDebtAdjustment
                            ? "inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-700"
                            : isCreditAdjustment
                              ? "inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                            : "inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700",
                        children: c.jsx("span", {
                          className: "material-symbols-outlined text-[16px]",
                          children: isDebtAdjustment
                            ? "add_card"
                            : isCreditAdjustment
                              ? "account_balance_wallet"
                              : "check_circle",
                        }),
                      })
                    : null,
                  plan.isReceiving &&
                    c.jsxs("span", {
                      className:
                        isDebtAdjustment
                          ? "text-[11px] font-bold text-rose-700 dark:text-rose-300"
                          : isCreditAdjustment
                            ? "text-[11px] font-bold text-emerald-700 dark:text-emerald-300"
                          : "text-[11px] font-bold text-violet-700 dark:text-violet-300",
                      children: [
                        isDebtAdjustment
                          ? "Deuda +$"
                          : isCreditAdjustment
                            ? "A favor +$"
                            : "Abona $",
                        formatAmount(
                          Math.abs(paymentLocalToNumber(plan.appliedAmount, 0)),
                        ),
                      ],
                    }),
                ],
              }),
            ],
          }),
        ],
      },
      `client-payment-shopping-${plan.key}`,
    );
  };

  const renderHistoryRow = (row) => {
    const isEditing =
      String(clientPaymentEntryEditingId || "") === String(row.id);
    const allocations = Array.isArray(row.shopping_allocations)
      ? row.shopping_allocations
      : [];
    const isBatch =
      String((row && row.entry_kind) || "").toUpperCase() === "CLIENT_BATCH";

    return c.jsxs(
      "div",
      {
        className:
          "rounded-2xl border border-violet-100 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/20 px-3 py-2.5",
        children: [
          c.jsxs("div", {
            className: "flex items-start justify-between gap-2",
            children: [
              c.jsxs("div", {
                className: "min-w-0",
                children: [
                  c.jsx("p", {
                    className:
                      "text-[11px] font-bold text-violet-700 dark:text-violet-200 truncate",
                    children:
                      row.shopping_title || `Shopping #${row.shopping_id}`,
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
                              paymentLocalToNumber(allocation.amount, 0) < 0
                                ? " -$"
                                : " $",
                              formatAmount(
                                Math.abs(
                                  paymentLocalToNumber(allocation.amount, 0),
                                ),
                              ),
                            ],
                          },
                          `client-payment-history-tag-${row.id}-${allocation.shopping_id}`,
                        ),
                      ),
                    }),
                  isEditing
                    ? c.jsxs("div", {
                        className: "mt-1 flex items-center gap-1.5",
                        children: [
                          c.jsx("input", {
                            type: "text",
                            step: "0.01",
                            inputMode: "text",
                            value: clientPaymentEntryDraftAmount,
                            autoComplete: "off",
                            onChange: (event) =>
                              setClientPaymentEntryDraftAmount(
                                event.target.value,
                              ),
                            className:
                              "w-28 px-2.5 py-1.5 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                          }),
                          c.jsx("button", {
                            type: "button",
                            onClick: () => saveClientPaymentHistoryRow(row),
                            disabled:
                              clientPaymentEntrySavingId === String(row.id),
                            className:
                              "w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center disabled:opacity-60",
                            children: c.jsx("span", {
                              className: `material-symbols-outlined text-[14px] ${
                                clientPaymentEntrySavingId === String(row.id)
                                  ? "animate-spin"
                                  : ""
                              }`,
                              children:
                                clientPaymentEntrySavingId === String(row.id)
                                  ? "progress_activity"
                                  : "check",
                            }),
                          }),
                          c.jsx("button", {
                            type: "button",
                            onClick: cancelEditingClientPaymentEntry,
                            disabled:
                              clientPaymentEntrySavingId === String(row.id),
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
                          paymentLocalToNumber(row.amount, 0) < 0 ? "-$" : "+$",
                          formatAmount(
                            Math.abs(paymentLocalToNumber(row.amount, 0)),
                          ),
                        ],
                      }),
                  c.jsxs("p", {
                    className: "text-[10px] text-text-sub mt-0.5",
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
                      isBatch ? "Global $" : "Total $",
                      formatAmount(paymentLocalToNumber(row.total_after, 0)),
                    ],
                  }),
                  !isEditing &&
                    c.jsxs("div", {
                      className: "flex items-center justify-end gap-1",
                      children: [
                        c.jsx("button", {
                          type: "button",
                          onClick: () => startEditingClientPaymentEntry(row),
                          disabled:
                            clientPaymentEntrySavingId === String(row.id),
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
                          onClick: () => deleteClientPaymentHistoryRow(row),
                          disabled:
                            clientPaymentEntrySavingId === String(row.id),
                          className:
                            "w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center disabled:opacity-60",
                          children: c.jsx("span", {
                            className: `material-symbols-outlined text-[14px] ${
                              clientPaymentEntrySavingId === String(row.id)
                                ? "animate-spin"
                                : ""
                            }`,
                            children:
                              clientPaymentEntrySavingId === String(row.id)
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
      `client-payment-history-entry-${row.id}`,
    );
  };

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
      "client-payment-modal",
    ),
    onClick: onDismiss,
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-6xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet flex flex-col overflow-hidden",
        "client-payment-modal",
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
                  children: "Pago del cliente",
                }),
                c.jsxs("p", {
                  className: "text-[11px] text-text-sub mt-0.5",
                  children: [
                    clientPaymentModalClient
                      ? clientPaymentModalClient.name
                      : "Cliente",
                    clientPaymentIsDebtAdjustment
                      ? " - captura de deuda inicial"
                      : clientPaymentIsCreditAdjustment
                        ? " - captura de saldo a favor inicial"
                      : " - se abona del shopping mas antiguo al mas reciente",
                  ],
                }),
              ],
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
        c.jsxs("div", {
          className: "flex-1 overflow-y-auto ios-scroll px-4 py-4 space-y-4",
          children: [
            c.jsxs("div", {
              className:
                "grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)] gap-4",
              children: [
                c.jsxs("div", {
                  className:
                    "rounded-3xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-slate-900/45 overflow-hidden",
                  children: [
                    c.jsxs("div", {
                      className:
                        "px-4 py-3 border-b border-border-light dark:border-border-dark space-y-3",
                      children: [
                        c.jsxs("div", {
                          className: "flex items-center justify-between gap-3",
                          children: [
                            c.jsxs("div", {
                              className: "min-w-0",
                              children: [
                                c.jsx("p", {
                                  className: "text-sm font-bold text-text-main",
                                  children: "Shoppings del pago",
                                }),
                                c.jsxs("p", {
                                  className:
                                    "text-[11px] text-text-sub mt-0.5",
                                  children: [
                                    clientPaymentIsDebtAdjustment
                                      ? "Ajuste de deuda"
                                      : clientPaymentIsCreditAdjustment
                                        ? "Ajuste a favor"
                                      : `${clientPaymentReceivingTargets.length} de ${clientPaymentTargets.length}`,
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("span", {
                              className:
                                clientPaymentIsDebtAdjustment
                                  ? "inline-flex rounded-full bg-rose-100 px-2 py-1 text-[10px] font-bold text-rose-700"
                                  : clientPaymentIsCreditAdjustment
                                    ? "inline-flex rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-700"
                                  : "inline-flex rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700",
                              children: [
                                clientPaymentIsDebtAdjustment
                                  ? "Deuda: -$"
                                  : clientPaymentIsCreditAdjustment
                                    ? "A favor: +$"
                                    : "Abono: $",
                                formatAmount(Math.abs(clientPaymentAllocatedTotal)),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    clientPaymentPlan.length === 0
                      ? c.jsx("div", {
                          className:
                            "px-4 py-10 text-sm text-center text-text-sub",
                          children:
                            clientPaymentIsDebtAdjustment
                              ? "No hay shopping activa donde registrar la deuda inicial."
                              : clientPaymentIsCreditAdjustment
                                ? "No hay shopping activa donde registrar el saldo a favor inicial."
                              : "Este cliente no tiene shoppings con deuda pendiente.",
                        })
                      : c.jsx("div", {
                          className:
                            "max-h-[52vh] overflow-y-auto ios-scroll p-3 space-y-2",
                          children: clientPaymentPlan.map(renderShoppingPlanCard),
                        }),
                  ],
                }),
                c.jsxs("div", {
                  className: "space-y-4",
                  children: [
                    c.jsxs("div", {
                      className:
                        "rounded-3xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-slate-900/45 p-4 space-y-4",
                      children: [
                        c.jsxs("label", {
                          className: "block",
                          children: [
                            c.jsx("span", {
                              className:
                                "text-[11px] font-semibold text-text-sub",
                              children: "Monto del movimiento",
                            }),
                            c.jsx("input", {
                              type: "text",
                              step: "0.01",
                              inputMode: "text",
                              value: clientPaymentForm.amount,
                              onChange: (event) => {
                                setClientPaymentAmountManual(true);
                                setClientPaymentForm((current) => ({
                                  ...current,
                                  amount: event.target.value,
                                }));
                              },
                              placeholder: "0.00",
                              autoComplete: "off",
                              className:
                                "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                            }),
                            c.jsx("p", {
                              className: "mt-1 text-[10px] leading-4 text-text-sub",
                              children:
                                "Usa negativo para deuda inicial o positivo para saldo a favor.",
                            }),
                            c.jsxs("div", {
                              className:
                                "mt-1 flex items-center justify-between gap-2",
                              children: [
                                c.jsx("span", {
                                  className:
                                    "text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80",
                                  children: `Deuda total: $${formatAmount(clientPaymentTotalDebt)}`,
                                }),
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () => {
                                    setClientPaymentAmountManual(false);
                                    setClientPaymentForm((current) => ({
                                      ...current,
                                      amount:
                                        clientPaymentTotalDebt > 0
                                          ? clientPaymentTotalDebt.toFixed(2)
                                          : "",
                                    }));
                                  },
                                  className:
                                    "text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
                                  children: "Usar deuda",
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
                                "flex items-center justify-between gap-2",
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
                                    clientPaymentHistoryRows.length,
                                    " movimiento(s)",
                                  ],
                                }),
                              ],
                            }),
                            clientPaymentHistoryRows.length === 0
                              ? c.jsx("p", {
                                  className:
                                    "text-[11px] leading-5 text-text-sub",
                                  children:
                                    "Aun no hay abonos guardados para este cliente.",
                                })
                              : c.jsx("div", {
                                  className:
                                    "space-y-2 max-h-56 overflow-y-auto ios-scroll pr-1",
                                  children:
                                    clientPaymentHistoryRows.map(
                                      renderHistoryRow,
                                    ),
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
                                  children: [
                                    "$",
                                    formatAmount(clientPaymentTotalDebt),
                                  ],
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
                                  children: clientPaymentIsDebtAdjustment
                                    ? "Deuda"
                                    : clientPaymentIsCreditAdjustment
                                      ? "A favor"
                                      : "Pago",
                                }),
                                c.jsxs("p", {
                                  className:
                                    "text-lg font-bold text-emerald-700 dark:text-emerald-100 mt-1",
                                  children: [
                                    clientPaymentIsDebtAdjustment
                                      ? "-$"
                                      : clientPaymentIsCreditAdjustment
                                        ? "+$"
                                        : "$",
                                    formatAmount(Math.abs(clientPaymentAllocatedTotal)),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: `rounded-2xl border px-3 py-2 ${
                                clientPaymentBalance < 0
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                                  : clientPaymentBalance > 0
                                    ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                    : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                              }`,
                              children: [
                                c.jsx("p", {
                                  className: `text-[10px] uppercase font-bold ${
                                    clientPaymentBalance < 0
                                      ? "text-emerald-700 dark:text-emerald-300"
                                      : clientPaymentBalance > 0
                                        ? "text-slate-700 dark:text-slate-300"
                                        : "text-emerald-700 dark:text-emerald-300"
                                  }`,
                                  children:
                                    clientPaymentBalance < 0
                                      ? "A favor"
                                      : "Deuda",
                                }),
                                c.jsxs("p", {
                                  className: `text-lg font-bold mt-1 ${
                                    clientPaymentBalance < 0
                                      ? "text-emerald-700 dark:text-emerald-100"
                                      : clientPaymentBalance > 0
                                        ? "text-slate-700 dark:text-slate-100"
                                        : "text-emerald-700 dark:text-emerald-100"
                                  }`,
                                  children: [
                                    "$",
                                    formatAmount(
                                      clientPaymentBalance < 0
                                        ? Math.abs(clientPaymentBalance)
                                        : clientPaymentBalance,
                                    ),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        c.jsx("p", {
                          className: "text-[11px] leading-5 text-text-sub",
                          children:
                            clientPaymentIsDebtAdjustment
                              ? "La deuda inicial se registra como un cargo negativo en la shopping mas antigua del cliente o en la shopping activa."
                              : clientPaymentIsCreditAdjustment
                                ? "El saldo a favor inicial se registra como un movimiento positivo en la shopping mas antigua del cliente o en la shopping activa."
                              : clientPaymentReceivingTargets.length > 0
                              ? "El abono se reparte automaticamente empezando por la shopping mas antigua."
                              : "Captura un monto para repartirlo automaticamente entre las shoppings con deuda.",
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
              onClick: onDismiss,
              disabled: clientPaymentSaving,
              className:
                "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 disabled:opacity-60",
              children: "Cancelar",
            }),
            c.jsx("button", {
              onClick: saveClientPayment,
              disabled:
                clientPaymentSaving ||
                clientPaymentReceivingTargets.length === 0 ||
                !Number.isFinite(clientPaymentAmountValue) ||
                clientPaymentAmountValue === 0,
              className:
                "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold disabled:opacity-70",
              children: clientPaymentSaving ? "Guardando..." : "Guardar",
            }),
          ],
        }),
      ],
    }),
  });
});

export default ClientPaymentModal;
