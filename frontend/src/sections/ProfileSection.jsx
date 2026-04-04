import { V, c } from '../utils.js';
import { useApp } from '../AppContext.jsx';

const DEFAULT_BREAKDOWN_TEMPLATE =
  "DESGLOSE DE TU CUENTA:\n\n{items}\n\nTOTAL TIENDA: ${total}\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗\n\nTe lo puedo asegurar por 10 minutos en lo que haces transferencia.💕";

const ProfileSection = V.memo(function ProfileSection() {
  const {
    user,
    isDesktopLayout,
    layoutMode,
    saveLayoutMode,
    defaultBreakdownTemplate,
    persistDefaultBreakdownTemplate,
    profileSettingsForm,
    setProfileSettingsForm,
    profileSettingsSaving,
    saveProfileSettings,
    handleLogout,
    notifySuccess,
    notifyError,
  } = useApp();

  const J = user;

  return c.jsxs("div", {
    className: isDesktopLayout
      ? "grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] items-start"
      : "space-y-6",
    children: [
      c.jsxs("div", {
        className:
          isDesktopLayout
            ? "bg-surface-light p-6 rounded-3xl border shadow-card text-center xl:sticky xl:top-6"
            : "bg-surface-light p-6 rounded-2xl border shadow-card text-center",
        children: [
          c.jsx("div", {
            className:
              "w-24 h-24 mx-auto rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-4xl mb-4 border-4 border-white shadow-sm",
            children: String(
              (profileSettingsForm.display_name || "").trim() || J.username,
            )
              .charAt(0)
              .toUpperCase(),
          }),
          c.jsx("h2", {
            className: "text-2xl font-bold text-center",
            children:
              String((profileSettingsForm.display_name || "").trim()) ||
              J.username,
          }),
          c.jsxs("p", {
            className: "mt-1 text-center text-sm text-text-sub",
            children: ["@", J.username],
          }),
          c.jsx("span", {
            className:
              "inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs uppercase rounded-full",
            children: J.profile.role,
          }),
          !!String((profileSettingsForm.phone || "").trim()) &&
            c.jsxs("p", {
              className: "mt-4 text-sm text-text-main text-center",
              children: ["Tel: ", String((profileSettingsForm.phone || "").trim())],
            }),
        ],
      }),
      c.jsxs("div", {
        className: isDesktopLayout
          ? "bg-surface-light p-5 rounded-3xl border shadow-card space-y-4"
          : "bg-surface-light p-4 rounded-2xl border shadow-card space-y-3",
        children: [
          c.jsxs("div", {
            className: "space-y-1 pb-1 border-b border-border-light dark:border-border-dark",
            children: [
              c.jsx("h3", {
                className: "text-base font-bold text-text-main",
                children: "Configuraciones",
              }),
              c.jsx("p", {
                className: "text-xs text-text-sub",
                children:
                  "Tabla base del perfil para ir agregando ajustes por seccion.",
              }),
            ],
          }),
          c.jsxs("div", {
            className: "space-y-3",
            children: [
              c.jsxs("div", {
                children: [
                  c.jsx("h3", {
                    className: "text-sm font-bold text-text-main",
                    children: "Datos del perfil",
                  }),
                  c.jsx("p", {
                    className: "text-xs text-text-sub mt-1",
                    children: "Nombre visible y telefono del usuario.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "grid gap-3 md:grid-cols-2",
                children: [
                  c.jsxs("label", {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className:
                          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Nombre",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.display_name,
                        onChange: (o) =>
                          setProfileSettingsForm((N) => ({
                            ...N,
                            display_name: o.target.value,
                          })),
                        placeholder: J.username,
                        className:
                          "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                      }),
                    ],
                  }),
                  c.jsxs("label", {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className:
                          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Telefono",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.phone,
                        onChange: (o) =>
                          setProfileSettingsForm((N) => ({
                            ...N,
                            phone: o.target.value,
                          })),
                        placeholder: "5512345678",
                        className:
                          "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                      }),
                    ],
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                  c.jsxs("span", {
                    className:
                      "inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-[11px] font-semibold text-text-sub",
                    children: ["Usuario: @", J.username],
                  }),
                  c.jsx("button", {
                    type: "button",
                    onClick: saveProfileSettings,
                    disabled:
                      profileSettingsSaving ||
                      (String((profileSettingsForm.display_name || "")).trim() ===
                        String((J.profile && J.profile.display_name) || "").trim() &&
                        String((profileSettingsForm.phone || "")).trim() ===
                          String((J.profile && J.profile.phone) || "").trim()),
                    className:
                      `px-4 py-2 rounded-xl text-xs font-bold transition ${
                        profileSettingsSaving ||
                        (String((profileSettingsForm.display_name || "")).trim() ===
                          String((J.profile && J.profile.display_name) || "").trim() &&
                          String((profileSettingsForm.phone || "")).trim() ===
                            String((J.profile && J.profile.phone) || "").trim())
                          ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`,
                    children: profileSettingsSaving
                      ? "Guardando..."
                      : "Guardar datos",
                  }),
                ],
              }),
            ],
          }),
          c.jsxs("div", {
            className: "space-y-2",
            children: [
              c.jsxs("div", {
                children: [
                  c.jsx("h3", {
                    className: "text-sm font-bold text-text-main",
                    children: "Vista de la app",
                  }),
                  c.jsx("p", {
                    className: "text-xs text-text-sub mt-1",
                    children:
                      "Esta preferencia se guarda por perfil y se aplica al iniciar sesi\u00f3n.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className:
                  "grid grid-cols-2 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1",
                children: [
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveLayoutMode("MOBILE"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${layoutMode === "MOBILE" ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                    children: "Movil",
                  }),
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveLayoutMode("WEB"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${layoutMode === "WEB" ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                    children: "Web",
                  }),
                ],
              }),
            ],
          }),
          c.jsxs("div", {
            children: [
              c.jsx("h3", {
                className: "text-sm font-bold text-text-main",
                children: "Configuracion de desglose",
              }),
              c.jsx("p", {
                className: "mt-1 text-xs text-text-sub",
                children:
                  "Editor libre del texto por default. Ya no usa bloques visuales.",
              }),
            ],
          }),
          c.jsx("p", {
            className: "text-[11px] text-text-sub",
            children:
              "Variables disponibles: {title} \u2022 {items} \u2022 {total} \u2022 {subtotal} \u2022 {discount_percentage} \u2022 {discount_amount} \u2022 {client_name} \u2022 {shopping_name}",
          }),
          c.jsx("textarea", {
            value: defaultBreakdownTemplate,
            onChange: (o) => {
              persistDefaultBreakdownTemplate(o.target.value);
            },
            rows: 10,
            className:
              "w-full rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 px-3 py-3 text-xs text-text-main dark:text-white outline-none focus:ring-2 focus:ring-primary/40 whitespace-pre-wrap",
          }),
          c.jsxs("div", {
            className: "flex items-center gap-2",
            children: [
              c.jsx("button", {
                type: "button",
                onClick: () =>
                  persistDefaultBreakdownTemplate(
                    DEFAULT_BREAKDOWN_TEMPLATE,
                  ),
                className:
                  "px-3 py-2 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs font-bold",
                children: "Reset",
              }),
              c.jsx("p", {
                className: "text-[11px] text-text-sub",
                children:
                  "Se guarda en este navegador y puedes editarlo manualmente.",
              }),
            ],
          }),
          c.jsxs("div", {
            className:
              "rounded-2xl border border-dashed border-border-light dark:border-border-dark px-4 py-4",
            children: [
              c.jsx("h3", {
                className: "text-sm font-bold text-text-main",
                children: "Por definir",
              }),
              c.jsx("p", {
                className: "mt-1 text-xs text-text-sub",
                children:
                  "Espacio reservado para mas cambios dentro de esta tabla de configuraciones.",
              }),
            ],
          }),
        ],
      }),
      c.jsxs("button", {
        onClick: handleLogout,
        className:
          "w-full py-4 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition flex justify-center items-center gap-2",
        children: [
          c.jsx("span", {
            className: "material-symbols-outlined",
            children: "logout",
          }),
          "Logout",
        ],
      }),
    ],
  });
});

export default ProfileSection;
