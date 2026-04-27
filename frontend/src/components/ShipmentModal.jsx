import { V, c, DARK_NATIVE_SELECT_STYLE, NATIVE_DROPDOWN_OPTION_STYLE, SHIPMENT_CARRIER_OPTIONS, resolveMediaUrl } from "../utils.js";

const ShipmentModal = V.memo(function ShipmentModal({
  shipmentForm,
  shipmentSaving,
  shipmentModalClient,
  shipmentClientPickerOpen,
  shipmentClientSearch,
  filteredShipmentClients,
  shipmentSelectedProducts,
  formatAmount,
  getClientShipmentAddressOptions,
  dismissActiveOverlayRef,
  overlayBackdropClass,
  overlaySheetClass,
  getProductPaymentAmount,
  setShipmentClientPickerOpen,
  setShipmentClientSearch,
  setShipmentProductPickerOpen,
  selectShipmentClient,
  toggleShipmentProductSelection,
  updateShipmentForm,
  saveShipmentEditor,
}) {
  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
      "shipment-modal",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet flex flex-col overflow-hidden",
        "shipment-modal",
      ),
      onClick: (o) => o.stopPropagation(),
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
                  children: shipmentForm.id ? "Editar envio" : "Nuevo envio",
                }),
                c.jsx("p", {
                  className: "text-[11px] text-text-sub mt-0.5",
                  children: "Selecciona cliente y productos.",
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
          className: "flex-1 overflow-y-auto ios-scroll px-4 py-4 space-y-4",
          children: [
            c.jsxs("label", {
              className: "block",
              children: [
                c.jsx("span", {
                  className: "text-[11px] font-semibold text-text-sub",
                  children: "Cliente",
                }),
                c.jsxs("div", {
                  className: "relative mt-1",
                  children: [
                    c.jsxs("button", {
                      type: "button",
                      onClick: () => setShipmentClientPickerOpen((o) => !o),
                      className:
                        "w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-between gap-3 text-left",
                      children: [
                        c.jsx("span", {
                          className: shipmentModalClient
                            ? "text-text-main dark:text-white"
                            : "text-text-sub",
                          children: shipmentModalClient
                            ? shipmentModalClient.name
                            : "Selecciona un cliente",
                        }),
                        c.jsx("span", {
                          className:
                            "material-symbols-outlined text-[18px] text-text-sub",
                          children: shipmentClientPickerOpen
                            ? "expand_less"
                            : "expand_more",
                        }),
                      ],
                    }),
                    shipmentClientPickerOpen &&
                      c.jsxs("div", {
                        className:
                          "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-xl p-2",
                        children: [
                          c.jsx("input", {
                            type: "text",
                            value: shipmentClientSearch,
                            onChange: (o) => setShipmentClientSearch(o.target.value),
                            placeholder: "Buscar cliente...",
                            className:
                              "w-full px-2.5 py-2 text-[11px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                          }),
                          c.jsx("div", {
                            className: "mt-2 max-h-56 overflow-y-auto ios-scroll",
                            children: filteredShipmentClients.length > 0
                              ? filteredShipmentClients.map((o) =>
                                  c.jsx(
                                    "button",
                                    {
                                      type: "button",
                                      onClick: () => selectShipmentClient(o.id),
                                      className:
                                        "w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-slate-800",
                                      children:
                                        String(shipmentForm.client) === String(o.id)
                                          ? `${o.name} ✓`
                                          : o.name,
                                    },
                                    `shipment-client-option-${o.id}`,
                                  ),
                                )
                              : c.jsx("p", {
                                  className:
                                    "px-2.5 py-3 text-[11px] text-gray-400 text-center",
                                  children: "Sin coincidencias",
                                }),
                          }),
                        ],
                      }),
                  ],
                }),
              ],
            }),
            c.jsxs("label", {
              className: "block",
              children: [
                c.jsx("span", {
                  className: "text-[11px] font-semibold text-text-sub",
                  children: "Paqueteria",
                }),
                c.jsx("select", {
                  value: shipmentForm.carrier,
                  onChange: (o) => updateShipmentForm("carrier", o.target.value),
                  style: DARK_NATIVE_SELECT_STYLE,
                  className:
                    "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl border-slate-700 bg-slate-900 text-white outline-none focus:ring-2 focus:ring-primary/40",
                  children: SHIPMENT_CARRIER_OPTIONS.map((o) =>
                    c.jsx(
                      "option",
                      {
                        value: o.value,
                        style: NATIVE_DROPDOWN_OPTION_STYLE,
                        children: o.label,
                      },
                      `shipment-carrier-option-${o.value || "empty"}`,
                    ),
                  ),
                }),
              ],
            }),
            c.jsxs("div", {
              className: "grid grid-cols-1 sm:grid-cols-4 gap-3",
              children: [
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Status de envio",
                    }),
                    c.jsx("select", {
                      value: shipmentForm.status,
                      onChange: (o) => updateShipmentForm("status", o.target.value),
                      style: DARK_NATIVE_SELECT_STYLE,
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl border-slate-700 bg-slate-900 text-white outline-none focus:ring-2 focus:ring-primary/40",
                      children: [
                        c.jsx("option", {
                          value: "PENDING",
                          style: NATIVE_DROPDOWN_OPTION_STYLE,
                          children: "Pendiente",
                        }, "shipment-status-pending"),
                        c.jsx("option", {
                          value: "SHIPPED",
                          style: NATIVE_DROPDOWN_OPTION_STYLE,
                          children: "Enviado",
                        }, "shipment-status-shipped"),
                        c.jsx("option", {
                          value: "DELIVERED",
                          style: NATIVE_DROPDOWN_OPTION_STYLE,
                          children: "Entregado",
                        }, "shipment-status-delivered"),
                        c.jsx("option", {
                          value: "CANCELLED",
                          style: NATIVE_DROPDOWN_OPTION_STYLE,
                          children: "Cancelado",
                        }, "shipment-status-cancelled"),
                      ],
                    }),
                  ],
                }),
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Guia",
                    }),
                    c.jsx("input", {
                      type: "text",
                      value: shipmentForm.tracking_number,
                      onChange: (o) =>
                        updateShipmentForm("tracking_number", o.target.value),
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                    }),
                  ],
                }),
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Costo de compra",
                    }),
                    c.jsx("input", {
                      type: "text",
                      inputMode: "decimal",
                      value: shipmentForm.guide_price,
                      onChange: (o) => updateShipmentForm("guide_price", o.target.value),
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                    }),
                  ],
                }),
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Costo de venta",
                    }),
                    c.jsx("input", {
                      type: "text",
                      inputMode: "decimal",
                      value: shipmentForm.client_price,
                      onChange: (o) =>
                        updateShipmentForm("client_price", o.target.value),
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "grid grid-cols-1 sm:grid-cols-1 gap-3",
              children: [
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Incluye seguro",
                    }),
                    c.jsxs("button", {
                      type: "button",
                      role: "switch",
                      "aria-checked": shipmentForm.includes_insurance,
                      onClick: () =>
                        updateShipmentForm(
                          "includes_insurance",
                          !shipmentForm.includes_insurance,
                        ),
                      className:
                        `mt-1 inline-flex h-10 w-full items-center justify-between rounded-xl border px-3 text-sm font-semibold transition ${shipmentForm.includes_insurance ? "border-primary/40 bg-primary/10 text-primary" : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}`,
                      children: [
                        c.jsx("span", {
                          children: shipmentForm.includes_insurance ? "Sí" : "No",
                        }),
                        c.jsx("span", {
                          className:
                            `inline-flex h-5 w-10 items-center rounded-full p-0.5 transition ${shipmentForm.includes_insurance ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`,
                          children: c.jsx("span", {
                            className:
                              `h-4 w-4 rounded-full bg-white shadow transition ${shipmentForm.includes_insurance ? "translate-x-5" : "translate-x-0"}`,
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                shipmentForm.includes_insurance &&
                  c.jsxs("div", {
                    className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
                    children: [
                      c.jsxs("label", {
                        className: "block",
                        children: [
                          c.jsx("span", {
                            className: "text-[11px] font-semibold text-text-sub",
                            children: "Costo del seguro",
                          }),
                          c.jsx("input", {
                            type: "text",
                            inputMode: "decimal",
                            value: shipmentForm.insurance_price,
                            onChange: (o) =>
                              updateShipmentForm("insurance_price", o.target.value),
                            className:
                              "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                          }),
                        ],
                      }),
                      c.jsxs("label", {
                        className: "block",
                        children: [
                          c.jsx("span", {
                            className: "text-[11px] font-semibold text-text-sub",
                            children: "Costo de venta",
                          }),
                          c.jsx("input", {
                            type: "text",
                            inputMode: "decimal",
                            value: shipmentForm.insurance_sale_price,
                            onChange: (o) =>
                              updateShipmentForm(
                                "insurance_sale_price",
                                o.target.value,
                              ),
                            className:
                              "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                          }),
                        ],
                      }),
                    ],
                  }),
              ],
            }),
            c.jsxs("div", {
              className:
                "grid grid-cols-4 gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-2 dark:border-slate-800 dark:bg-slate-900/40",
              children: [
                ["package_length", "Largo CM"],
                ["package_width", "Ancho CM"],
                ["package_height", "Alto CM"],
                ["package_weight", "Peso KG"],
              ].map(([field, label]) =>
                c.jsxs(
                  "label",
                  {
                    className: "block min-w-0",
                    children: [
                      c.jsx("span", {
                        className:
                          "block text-center text-[9px] font-bold uppercase text-text-sub",
                        children: label,
                      }),
                      c.jsx("input", {
                        type: "text",
                        inputMode: "decimal",
                        value: shipmentForm[field] || "",
                        onChange: (o) => updateShipmentForm(field, o.target.value),
                        className:
                          "mt-1 h-8 w-full rounded-lg border border-slate-200 bg-white px-1.5 text-center text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/40 dark:border-slate-700 dark:bg-gray-800",
                      }),
                    ],
                  },
                  `shipment-package-${field}`,
                ),
              ),
            }),
            c.jsxs("label", {
              className: "block",
              children: [
                c.jsx("span", {
                  className: "text-[11px] font-semibold text-text-sub",
                  children: "Direccion de envio",
                }),
                getClientShipmentAddressOptions(shipmentForm.client).length > 1 &&
                  c.jsxs("select", {
                    value: shipmentForm.shipping_address,
                    onChange: (o) =>
                      updateShipmentForm("shipping_address", o.target.value),
                    style: DARK_NATIVE_SELECT_STYLE,
                    className:
                      "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl border-slate-700 bg-slate-900 text-white outline-none focus:ring-2 focus:ring-primary/40",
                    children: getClientShipmentAddressOptions(shipmentForm.client).map(
                      (o, N) =>
                        c.jsx(
                          "option",
                          {
                            value: o,
                            style: NATIVE_DROPDOWN_OPTION_STYLE,
                            children: o,
                          },
                          `shipment-address-${N}`,
                        ),
                    ),
                  }),
                c.jsx("textarea", {
                  rows: 3,
                  value: shipmentForm.shipping_address,
                  onChange: (o) =>
                    updateShipmentForm("shipping_address", o.target.value),
                  className:
                    "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                }),
              ],
            }),
            c.jsxs("div", {
              className:
                "rounded-2xl border border-border-light dark:border-border-dark bg-slate-50/80 dark:bg-slate-900/40 p-3 space-y-3",
              children: [
                c.jsxs("div", {
                  className: "flex items-center justify-between gap-3",
                  children: [
                    c.jsxs("div", {
                      className: "min-w-0",
                      children: [
                        c.jsx("p", {
                          className: "text-xs font-bold text-text-main",
                          children: "Productos del envio",
                        }),
                        c.jsxs("p", {
                          className: "text-[11px] text-text-sub",
                          children: [shipmentSelectedProducts.length, " seleccionados"],
                        }),
                      ],
                    }),
                    c.jsxs("button", {
                      type: "button",
                      onClick: () => setShipmentProductPickerOpen(!0),
                      className:
                        "shrink-0 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5",
                      children: [
                        c.jsx("span", {
                          className: "material-symbols-outlined text-[15px]",
                          children: "photo_library",
                        }),
                        "Galeria",
                      ],
                    }),
                  ],
                }),
                shipmentSelectedProducts.length > 0
                  ? c.jsx("div", {
                      className: "grid grid-cols-2 sm:grid-cols-3 gap-2",
                      children: shipmentSelectedProducts.map((o) => {
                        const A = getProductPaymentAmount(o);
                        return c.jsxs(
                          "button",
                          {
                            type: "button",
                            onClick: () => toggleShipmentProductSelection(o),
                            className:
                              "relative overflow-hidden rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 text-left",
                            children: [
                              o.image
                                ? c.jsx("img", {
                                    src: resolveMediaUrl(o.image),
                                    className: "w-full aspect-[4/5] object-cover",
                                  })
                                : c.jsx("div", {
                                    className:
                                      "w-full aspect-[4/5] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400",
                                    children: c.jsx("span", {
                                      className: "material-symbols-outlined text-[20px]",
                                      children: "image",
                                    }),
                                  }),
                              Number.isFinite(A) &&
                                c.jsx("div", {
                                  className:
                                    "absolute inset-x-0 bottom-1.5 z-20 flex justify-center pointer-events-none",
                                  children: c.jsxs("span", {
                                    className:
                                      "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                    children: ["$", formatAmount(A)],
                                  }),
                                }),
                              c.jsx("div", {
                                className:
                                  "absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
                                children: c.jsxs("div", {
                                  className: "space-y-0.5",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[11px] font-semibold text-white truncate",
                                      children: o.name,
                                    }),
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] text-white/80 truncate",
                                      children:
                                        o.shopping_name ||
                                        o.mission_name ||
                                        o.store_name ||
                                        "Sin shopping",
                                    }),
                                  ],
                                }),
                              }),
                              c.jsx("div", {
                                className:
                                  "absolute top-2 right-2 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center",
                                children: c.jsx("span", {
                                  className: "material-symbols-outlined text-[14px]",
                                  children: "close",
                                }),
                              }),
                            ],
                          },
                          `shipment-picked-${o.id}`,
                        );
                      }),
                    })
                  : c.jsx("p", {
                      className: "text-xs text-text-sub",
                      children:
                        "Abre la galeria para elegir productos de todas las shoppings de este cliente.",
                    }),
              ],
            }),
            shipmentModalClient &&
              c.jsxs("div", {
                className:
                  "rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 px-3 py-2",
                children: [
                  c.jsx("p", {
                    className:
                      "text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300",
                    children: "Cliente",
                  }),
                  c.jsx("p", {
                    className: "text-xs text-amber-800 dark:text-amber-100 mt-0.5",
                    children: shipmentModalClient.name,
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
              disabled: shipmentSaving,
              className:
                "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900 disabled:opacity-60",
              children: "Cancelar",
            }),
            c.jsx("button", {
              onClick: saveShipmentEditor,
              disabled: shipmentSaving,
              className:
                "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold disabled:opacity-60",
              children: shipmentSaving ? "Guardando..." : shipmentForm.id ? "Guardar" : "Crear",
            }),
          ],
        }),
      ],
    }),
  });
});

export default ShipmentModal;
