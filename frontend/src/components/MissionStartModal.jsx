import { V, c, getUserOptionLabel } from "../utils.js";

const MissionStartModal = V.memo(function MissionStartModal({
  open,
  missionStartForm,
  setMissionStartForm,
  onSubmit,
  onClose,
  dismissActiveOverlayRef,
  overlayBackdropClass,
  overlaySheetClass,
  filteredMissionStoreSuggestions,
  removeStoreRecommendation,
  payerUserOptions,
  saving = false,
}) {
  if (!open) return null;

  const updateForm = (patch) => setMissionStartForm({ ...missionStartForm, ...patch });
  const handleClose = () => {
    if (dismissActiveOverlayRef && dismissActiveOverlayRef.current) {
      dismissActiveOverlayRef.current();
      return;
    }
    if (typeof onClose === "function") onClose();
  };

  return c.jsx("div", {
    className: overlayBackdropClass(
      "absolute inset-0 z-[65] bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
      "shopping-start",
    ),
    onClick: handleClose,
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet",
        "shopping-start",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsx("h3", {
          className: "text-base font-bold mb-3",
          children: "Shopping en Tienda",
        }),
        c.jsxs("div", {
          className: "space-y-2",
          children: [
            c.jsxs("div", {
              children: [
                c.jsx("label", {
                  className: "text-[10px] font-semibold text-gray-500",
                  children: "Tienda",
                }),
                c.jsx("input", {
                  type: "text",
                  value: missionStartForm.store_name,
                  onChange: (event) =>
                    updateForm({
                      store_name: event.target.value,
                      name: event.target.value,
                    }),
                  placeholder: "Selecciona o escribe la tienda",
                  className:
                    "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                }),
                c.jsx("div", {
                  className:
                    "mt-2 max-h-52 overflow-y-auto ios-scroll rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm",
                  children:
                    filteredMissionStoreSuggestions.length > 0
                      ? filteredMissionStoreSuggestions.map((store) =>
                          c.jsxs(
                            "div",
                            {
                              className:
                                "relative flex items-center gap-2 px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-800",
                              children: [
                                store.recommendation_id &&
                                  c.jsx("button", {
                                    type: "button",
                                    onClick: (event) => {
                                      event.stopPropagation();
                                      removeStoreRecommendation(
                                        store.recommendation_id,
                                        store.name,
                                      );
                                    },
                                    className:
                                      "absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[18px] font-bold leading-none text-black/50 dark:text-white/60 hover:text-rose-600",
                                    "aria-label": `Quitar ${store.name} de recomendaciones`,
                                    children: "x",
                                  }),
                                c.jsxs("button", {
                                  type: "button",
                                  onClick: () =>
                                    updateForm({
                                      store_name: store.name,
                                      name: store.name,
                                    }),
                                  className: "flex-1 pr-8 text-left text-sm hover:text-primary",
                                  children: [
                                    c.jsx("span", {
                                      className: "font-medium",
                                      children: store.name,
                                    }),
                                  ],
                                }),
                              ],
                            },
                            store.recommendation_id || store.id,
                          ),
                        )
                      : c.jsx("div", {
                          className:
                            "px-3 py-2 text-sm text-gray-400 dark:text-gray-500",
                          children: "Sin sugerencias",
                        }),
                }),
              ],
            }),
            c.jsxs("div", {
              children: [
                c.jsx("label", {
                  className: "text-[10px] font-semibold text-gray-500",
                  children: "Quien pagara",
                }),
                c.jsxs("select", {
                  value: missionStartForm.payer,
                  onChange: (event) => updateForm({ payer: event.target.value }),
                  className:
                    "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                  children: [
                    c.jsx("option", {
                      value: "",
                      disabled: !0,
                      children: payerUserOptions.length
                        ? "Selecciona quien pagara"
                        : "Sin usuarios disponibles",
                    }),
                    payerUserOptions.map((user) =>
                      c.jsx(
                        "option",
                        {
                          value: user.id,
                          children: getUserOptionLabel(user),
                        },
                        `mission-payer-${user.id}`,
                      ),
                    ),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "grid grid-cols-2 gap-2",
              children: [
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className: "text-[10px] font-semibold text-gray-500",
                      children: "Taxes (%)",
                    }),
                    c.jsx("input", {
                      type: "number",
                      step: "0.01",
                      value: missionStartForm.tax_percentage,
                      onChange: (event) =>
                        updateForm({ tax_percentage: event.target.value }),
                      className:
                        "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                    }),
                  ],
                }),
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className: "text-[10px] font-semibold text-gray-500",
                      children: "Descuento (%)",
                    }),
                    c.jsx("input", {
                      type: "number",
                      step: "0.01",
                      value: missionStartForm.discount_percentage,
                      onChange: (event) =>
                        updateForm({ discount_percentage: event.target.value }),
                      className:
                        "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "grid grid-cols-2 rounded-xl p-1 bg-gray-50 border border-gray-200",
              children: [
                c.jsx("button", {
                  type: "button",
                  onClick: () => updateForm({ calc_mode: "FACTOR" }),
                  className: `py-2 text-xs font-bold rounded-lg ${String(missionStartForm.calc_mode).toUpperCase() === "FACTOR" ? "bg-primary text-white" : "text-gray-500"}`,
                  children: "Factor",
                }),
                c.jsx("button", {
                  type: "button",
                  onClick: () => updateForm({ calc_mode: "PERCENTAGE" }),
                  className: `py-2 text-xs font-bold rounded-lg ${String(missionStartForm.calc_mode).toUpperCase() === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-gray-500"}`,
                  children: "Porcentaje",
                }),
              ],
            }),
            String(missionStartForm.calc_mode).toUpperCase() === "FACTOR"
              ? c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className: "text-[10px] font-semibold text-gray-500",
                      children: "Factor",
                    }),
                    c.jsx("input", {
                      type: "number",
                      step: "0.01",
                      value: missionStartForm.factor_value,
                      onChange: (event) =>
                        updateForm({ factor_value: event.target.value }),
                      className:
                        "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                    }),
                  ],
                })
              : c.jsxs("div", {
                  className: "grid grid-cols-2 gap-2",
                  children: [
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className: "text-[10px] font-semibold text-gray-500",
                          children: "Comision (%)",
                        }),
                        c.jsx("input", {
                          type: "number",
                          step: "0.01",
                          value: missionStartForm.commission_percentage,
                          onChange: (event) =>
                            updateForm({ commission_percentage: event.target.value }),
                          className:
                            "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className: "text-[10px] font-semibold text-gray-500",
                          children: "Tipo cambio",
                        }),
                        c.jsx("input", {
                          type: "number",
                          step: "0.01",
                          value: missionStartForm.exchange_rate,
                          onChange: (event) =>
                            updateForm({ exchange_rate: event.target.value }),
                          className:
                            "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                        }),
                      ],
                    }),
                  ],
                }),
          ],
        }),
        c.jsxs("div", {
          className: "mt-4 grid grid-cols-2 gap-2",
          children: [
            c.jsx("button", {
              onClick: handleClose,
              className:
                "py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold",
              children: "Cancelar",
            }),
            c.jsx("button", {
              onClick: () => onSubmit(missionStartForm),
              className:
                `py-2 rounded-lg bg-primary text-white hover:bg-primary-dark text-xs font-semibold ${open ? "" : ""} ${!saving ? "" : "opacity-70 cursor-not-allowed"}`,
              disabled: !!saving,
              children: saving ? "Guardando..." : "Iniciar",
            }),
          ],
        }),
      ],
    }),
  });
});

export default MissionStartModal;
