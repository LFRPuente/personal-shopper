import { V, c, sanitizeClientCountryCodeInput } from "../utils.js";
import { useApp } from "../AppContext.jsx";
import UserManagementModal from "../components/UserManagementModal.jsx";

const DEFAULT_BREAKDOWN_TEMPLATE =
  "DESGLOSE DE TU CUENTA:\n\n{items}\n{balance_line}\n\n*{total_label}: ${total}*\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗\n\nTe lo puedo asegurar por 10 minutos en lo que haces transferencia.💕";

const ProfileSection = V.memo(function ProfileSection() {
  const {
    user,
    isDesktopLayout,
    layoutMode,
    saveLayoutMode,
    themeMode,
    saveThemeMode,
    defaultBreakdownTemplate,
    persistDefaultBreakdownTemplate,
    profileSettingsForm,
    setProfileSettingsForm,
    profileSettingsSaving,
    saveProfileSettings,
    handleLogout,
    users,
    createUserRecord,
    saveUserRecord,
    deleteUserRecord,
  } = useApp();

  const J = user;
  const profile = (J && J.profile) || {};
  const isBothRole = String(profile.role || "").toUpperCase() === "BOTH";
  const [userManagementOpen, setUserManagementOpen] = V.useState(false);

  const normalizeDigits = (value) => String(value || "").replace(/\D+/g, "");
  const profileSettingsChanged =
    String((profileSettingsForm.display_name || "").trim()) !==
      String((profile.display_name || "").trim()) ||
    String((profileSettingsForm.phone_country_code || "").trim()) !==
      String((profile.phone_country_code || "").trim()) ||
    String((profileSettingsForm.phone || "").trim()) !==
      String((profile.phone || "").trim()) ||
    String((profileSettingsForm.waha_api_url || "").trim()) !==
      String((profile.waha_api_url || "").trim()) ||
    String((profileSettingsForm.waha_api_key || "").trim()) !==
      String((profile.waha_api_key || "").trim()) ||
    String((profileSettingsForm.waha_session || "").trim()) !==
      String((profile.waha_session || "").trim()) ||
    (normalizeDigits(profileSettingsForm.waha_phone_prefix) || "521") !==
      (normalizeDigits(profile.waha_phone_prefix) || "521") ||
    String((profileSettingsForm.waha_chat_id_suffix || "").trim()) !==
      String((profile.waha_chat_id_suffix || "").trim());
  const profileSaveDisabled = profileSettingsSaving || !profileSettingsChanged;

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
            children: String((profileSettingsForm.display_name || "").trim() || J.username)
              .charAt(0)
              .toUpperCase(),
          }),
          c.jsx("h2", {
            className: "text-2xl font-bold text-center",
            children: String((profileSettingsForm.display_name || "").trim()) || J.username,
          }),
          c.jsxs("p", {
            className: "mt-1 text-center text-sm text-text-sub",
            children: ["@", J.username],
          }),
          c.jsx("span", {
            className:
              "inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs uppercase rounded-full",
            children: profile.role,
          }),
          !!String((profileSettingsForm.phone || "").trim()) &&
            c.jsxs("p", {
              className: "mt-4 text-sm text-text-main text-center",
              children: [
                "Tel: ",
                String((profileSettingsForm.phone_country_code || "+52").trim()),
                " ",
                String((profileSettingsForm.phone || "").trim()),
              ],
            }),
          c.jsx("button", {
            onClick: handleLogout,
            className:
              "mt-4 w-full py-4 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition flex justify-center items-center gap-2",
            children: [
              c.jsx("span", {
                className: "material-symbols-outlined",
                children: "logout",
              }),
              "Logout",
            ],
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
                children: "Ajustes del perfil y WhatsApp.",
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
                    children: "Nombre, codigo de pais y telefono del usuario.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "grid gap-3 md:grid-cols-3",
                children: [
                  c.jsxs("label", {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Nombre",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.display_name,
                        onChange: (event) =>
                          setProfileSettingsForm((current) => ({
                            ...current,
                            display_name: event.target.value,
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
                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Codigo de pais",
                      }),
                      c.jsx("input", {
                        type: "text",
                        inputMode: "numeric",
                        value: profileSettingsForm.phone_country_code || "+52",
                        onChange: (event) =>
                          setProfileSettingsForm((current) => ({
                            ...current,
                            phone_country_code: sanitizeClientCountryCodeInput(event.target.value),
                          })),
                        placeholder: "+52",
                        className:
                          "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                      }),
                    ],
                  }),
                  c.jsxs("label", {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Telefono",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.phone,
                        onChange: (event) =>
                          setProfileSettingsForm((current) => ({
                            ...current,
                            phone: event.target.value,
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
                    disabled: profileSaveDisabled,
                    className:
                      `px-4 py-2 rounded-xl text-xs font-bold transition ${
                        profileSaveDisabled
                          ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                          : "bg-primary text-white hover:bg-primary-dark"
                      }`,
                    children: profileSettingsSaving ? "Guardando..." : "Guardar datos",
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
                    children: "Esta preferencia se guarda por perfil y se aplica al iniciar sesi\u00f3n.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "grid grid-cols-2 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1",
                children: [
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveLayoutMode("MOBILE"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${
                        layoutMode === "MOBILE"
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                      }`,
                    children: "Movil",
                  }),
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveLayoutMode("WEB"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${
                        layoutMode === "WEB"
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                      }`,
                    children: "Web",
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
                    children: "Modo de color",
                  }),
                  c.jsx("p", {
                    className: "text-xs text-text-sub mt-1",
                    children: "Escoge si la app se ve en modo dia o modo noche.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "grid grid-cols-2 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1",
                children: [
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveThemeMode("LIGHT"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${
                        themeMode !== "DARK"
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                      }`,
                    children: "Modo dia",
                  }),
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveThemeMode("DARK"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${
                        themeMode === "DARK"
                          ? "bg-primary text-white shadow-sm"
                          : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                      }`,
                    children: "Modo noche",
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
                children: "Editor libre del texto por default. Ya no usa bloques visuales.",
              }),
            ],
          }),
          c.jsx("p", {
            className: "text-[11px] text-text-sub",
            children:
              "Variables disponibles: {title} • {items} • {balance_line} • {total_label} • {total} • {products_total} • {subtotal} • {discount_percentage} • {discount_amount} • {client_name} • {shopping_name}",
          }),
          c.jsx("textarea", {
            value: defaultBreakdownTemplate,
            onChange: (event) => {
              persistDefaultBreakdownTemplate(event.target.value);
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
                onClick: () => persistDefaultBreakdownTemplate(DEFAULT_BREAKDOWN_TEMPLATE),
                className:
                  "px-3 py-2 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs font-bold",
                children: "Reset",
              }),
              c.jsx("p", {
                className: "text-[11px] text-text-sub",
                children: "Se guarda en este navegador y puedes editarlo manualmente.",
              }),
            ],
          }),
          c.jsxs("div", {
            className:
              "rounded-2xl border border-border-light dark:border-border-dark px-4 py-4 space-y-3",
            children: [
              c.jsxs("div", {
                children: [
                  c.jsx("h3", {
                    className: "text-sm font-bold text-text-main",
                    children: "WAHA WhatsApp",
                  }),
                  c.jsx("p", {
                    className: "mt-1 text-xs text-text-sub",
                    children: "Datos usados para enviar los desgloses directos por WhatsApp.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "grid gap-3 md:grid-cols-2",
                children: [
                  c.jsxs("label", {
                    className: "block md:col-span-2",
                    children: [
                      c.jsx("span", {
                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "URL sendText",
                      }),
                      c.jsx("input", {
                        type: "url",
                        value: profileSettingsForm.waha_api_url || "",
                        onChange: (event) =>
                          setProfileSettingsForm((current) => ({
                            ...current,
                            waha_api_url: event.target.value,
                          })),
                        placeholder: "https://waha.servidorfs.com/api/sendText",
                        className:
                          "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                      }),
                    ],
                  }),
                  c.jsxs("label", {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "X-Api-Key",
                      }),
                      c.jsx("input", {
                        type: "password",
                        value: profileSettingsForm.waha_api_key || "",
                        onChange: (event) =>
                          setProfileSettingsForm((current) => ({
                            ...current,
                            waha_api_key: event.target.value,
                          })),
                        placeholder: "API key de WAHA",
                        className:
                          "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                      }),
                    ],
                  }),
                  c.jsxs("label", {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Session",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.waha_session || "",
                        onChange: (event) =>
                          setProfileSettingsForm((current) => ({
                            ...current,
                            waha_session: event.target.value,
                          })),
                        placeholder: "default",
                        className:
                          "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                      }),
                    ],
                  }),
                  c.jsxs("label", {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Sufijo chatId",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.waha_chat_id_suffix || "",
                        onChange: (event) =>
                          setProfileSettingsForm((current) => ({
                            ...current,
                            waha_chat_id_suffix: event.target.value,
                          })),
                        placeholder: "@c.us",
                        className:
                          "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                      }),
                    ],
                  }),
                ],
              }),
              c.jsx("p", {
                className: "text-[11px] text-text-sub",
                children: "El chatId se arma automaticamente para WAHA con el codigo de pais y el telefono.",
              }),
              c.jsx("button", {
                type: "button",
                onClick: saveProfileSettings,
                disabled: profileSaveDisabled,
                className:
                  `px-4 py-2 rounded-xl text-xs font-bold transition ${
                    profileSaveDisabled
                      ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`,
                children: profileSettingsSaving ? "Guardando..." : "Guardar WAHA",
              }),
            ],
          }),
          isBothRole &&
            c.jsx("button", {
              type: "button",
              onClick: () => setUserManagementOpen(true),
              className:
                "w-full px-4 py-3 rounded-2xl bg-slate-900 text-white hover:bg-slate-800 text-sm font-bold transition",
              children: "EDICION DE USUARIOS",
            }),
        ],
      }),
      isBothRole &&
        c.jsx(UserManagementModal, {
          open: userManagementOpen,
          users,
          currentUserId: J && J.id,
          createUserRecord,
          saveUserRecord,
          deleteUserRecord,
          onClose: () => setUserManagementOpen(false),
        }),
    ],
  });
});

export default ProfileSection;
