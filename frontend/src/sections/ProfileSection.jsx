import { V, c, getClientPhoneDisplay, getUserPhoneDisplay, getUserOptionLabel, sanitizeClientCountryCodeInput } from '../utils.js';
import { useApp } from '../AppContext.jsx';

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
    clients,
    users,
    onEditClient,
    onDeleteClient,
    saveUserRecord,
  } = useApp();

  const J = user;
  const profile = (J && J.profile) || {};
  const isBothRole = String(profile.role || '').toUpperCase() === 'BOTH';
  const [profileTab, setProfileTab] = V.useState('general');
  const [clientSearch, setClientSearch] = V.useState('');
  const [userSearch, setUserSearch] = V.useState('');
  const [selectedUserId, setSelectedUserId] = V.useState(null);
  const [userForm, setUserForm] = V.useState(null);
  const [userSaving, setUserSaving] = V.useState(false);
  const normalizeDigits = (value) => String(value || '').replace(/\D+/g, '');
  const filteredProfileClients = V.useMemo(() => {
    const search = String(clientSearch || '').trim().toLowerCase();
    const source = Array.isArray(clients) ? clients : [];
    if (!search) return [...source].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'es', { sensitivity: 'base' }));
    return source
      .filter((client) => {
        const blob = [
          client?.name,
          client?.tags,
          client?.phone,
          client?.phone_country_code,
          client?.email,
          client?.shipping_address,
          ...(Array.isArray(client?.shipping_addresses) ? client.shipping_addresses : []),
          getClientPhoneDisplay(client),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(search);
      })
      .sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || ''), 'es', { sensitivity: 'base' }));
  }, [clients, clientSearch]);
  const filteredUsers = V.useMemo(() => {
    const search = String(userSearch || '').trim().toLowerCase();
    const source = Array.isArray(users) ? users : [];
    const sorted = [...source].sort((a, b) => String(a?.username || '').localeCompare(String(b?.username || ''), 'es', { sensitivity: 'base' }));
    if (!search) return sorted;
    return sorted.filter((user) => {
      const profile = user?.profile || {};
      const blob = [
        user?.username,
        user?.email,
        profile?.display_name,
        profile?.role,
        profile?.phone_country_code,
        profile?.phone,
        getUserPhoneDisplay(user),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return blob.includes(search);
    });
  }, [users, userSearch]);
  const selectedProfileUser = V.useMemo(
    () => (Array.isArray(users) ? users.find((user) => Number(user?.id) === Number(selectedUserId)) : null) || null,
    [users, selectedUserId],
  );
  const profileSettingsChanged =
    String((profileSettingsForm.display_name || '').trim()) !==
      String((profile.display_name || '').trim()) ||
    String((profileSettingsForm.phone_country_code || '').trim()) !==
      String((profile.phone_country_code || '').trim()) ||
    String((profileSettingsForm.phone || '').trim()) !==
      String((profile.phone || '').trim()) ||
    String((profileSettingsForm.waha_api_url || '').trim()) !==
      String((profile.waha_api_url || '').trim()) ||
    String((profileSettingsForm.waha_api_key || '').trim()) !==
      String((profile.waha_api_key || '').trim()) ||
    String((profileSettingsForm.waha_session || '').trim()) !==
      String((profile.waha_session || '').trim()) ||
    (normalizeDigits(profileSettingsForm.waha_phone_prefix) || '521') !==
      (normalizeDigits(profile.waha_phone_prefix) || '521') ||
    String((profileSettingsForm.waha_chat_id_suffix || '').trim()) !==
      String((profile.waha_chat_id_suffix || '').trim());
  const profileSaveDisabled = profileSettingsSaving || !profileSettingsChanged;
  V.useEffect(() => {
    if (!isBothRole) return;
    const initialUser = selectedProfileUser || (Array.isArray(users) ? users.find((user) => Number(user?.id) === Number(J && J.id)) : null) || users?.[0] || null;
    if (!initialUser) return;
    if (Number(selectedUserId) !== Number(initialUser.id)) {
      setSelectedUserId(initialUser.id);
      return;
    }
    const profileData = initialUser.profile || {};
    setUserForm((current) => {
      const next = {
        username: String(initialUser.username || ''),
        email: String(initialUser.email || ''),
        first_name: String(initialUser.first_name || ''),
        last_name: String(initialUser.last_name || ''),
        is_active: !!initialUser.is_active,
        role: String(profileData.role || 'AV'),
        display_name: String(profileData.display_name || ''),
        phone_country_code: String(profileData.phone_country_code || '+52'),
        phone: String(profileData.phone || ''),
      };
      if (!current) return next;
      if (Number(current.__user_id || 0) !== Number(initialUser.id)) {
        return { ...next, __user_id: initialUser.id };
      }
      return current;
    });
  }, [isBothRole, users, selectedProfileUser, selectedUserId, J]);

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
              children: [
                "Tel: ",
                String((profileSettingsForm.phone_country_code || "+52").trim()),
                " ",
                String((profileSettingsForm.phone || "").trim()),
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
                children:
                  "Tabla base del perfil para ir agregando ajustes por seccion.",
              }),
            ],
          }),
          isBothRole &&
            c.jsxs("div", {
              className: "grid grid-cols-3 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1",
              children: [
                c.jsx("button", {
                  type: "button",
                  onClick: () => setProfileTab('general'),
                  className:
                    `rounded-xl px-3 py-2 text-xs font-bold transition ${profileTab === 'general' ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                  children: "Configuracion",
                }),
                c.jsx("button", {
                  type: "button",
                  onClick: () => setProfileTab('clients'),
                  className:
                    `rounded-xl px-3 py-2 text-xs font-bold transition ${profileTab === 'clients' ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                  children: "Clientes",
                }),
                c.jsx("button", {
                  type: "button",
                  onClick: () => setProfileTab('users'),
                  className:
                    `rounded-xl px-3 py-2 text-xs font-bold transition ${profileTab === 'users' ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                  children: "Usuarios",
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
                        children: "Codigo de pais",
                      }),
                      c.jsx("input", {
                        type: "text",
                        inputMode: "numeric",
                        value: profileSettingsForm.phone_country_code || "+52",
                        onChange: (o) =>
                          setProfileSettingsForm((N) => ({
                            ...N,
                            phone_country_code: sanitizeClientCountryCodeInput(o.target.value),
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
                    disabled: profileSaveDisabled,
                    className:
                      `px-4 py-2 rounded-xl text-xs font-bold transition ${
                        profileSaveDisabled
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
                className:
                  "grid grid-cols-2 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1",
                children: [
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveThemeMode("LIGHT"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${themeMode !== "DARK" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                    children: "Modo dia",
                  }),
                  c.jsx("button", {
                    type: "button",
                    onClick: () => saveThemeMode("DARK"),
                    className:
                      `rounded-xl px-3 py-2 text-xs font-bold transition ${themeMode === "DARK" ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
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
                children:
                  "Editor libre del texto por default. Ya no usa bloques visuales.",
              }),
            ],
          }),
          c.jsx("p", {
            className: "text-[11px] text-text-sub",
            children:
              "Variables disponibles: {title} \u2022 {items} \u2022 {balance_line} \u2022 {total_label} \u2022 {total} \u2022 {products_total} \u2022 {subtotal} \u2022 {discount_percentage} \u2022 {discount_amount} \u2022 {client_name} \u2022 {shopping_name}",
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
                    children:
                      "Datos usados para enviar los desgloses directos por WhatsApp.",
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
                        className:
                          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "URL sendText",
                      }),
                      c.jsx("input", {
                        type: "url",
                        value: profileSettingsForm.waha_api_url || "",
                        onChange: (o) =>
                          setProfileSettingsForm((N) => ({
                            ...N,
                            waha_api_url: o.target.value,
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
                        className:
                          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "X-Api-Key",
                      }),
                      c.jsx("input", {
                        type: "password",
                        value: profileSettingsForm.waha_api_key || "",
                        onChange: (o) =>
                          setProfileSettingsForm((N) => ({
                            ...N,
                            waha_api_key: o.target.value,
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
                        className:
                          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Session",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.waha_session || "",
                        onChange: (o) =>
                          setProfileSettingsForm((N) => ({
                            ...N,
                            waha_session: o.target.value,
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
                        className:
                          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Sufijo chatId",
                      }),
                      c.jsx("input", {
                        type: "text",
                        value: profileSettingsForm.waha_chat_id_suffix || "",
                        onChange: (o) =>
                          setProfileSettingsForm((N) => ({
                            ...N,
                            waha_chat_id_suffix: o.target.value,
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
                children:
                  "El chatId se arma automaticamente para WAHA con el codigo de pais y el telefono.",
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
                children: profileSettingsSaving
                  ? "Guardando..."
                  : "Guardar WAHA",
              }),
            ],
              }),
            ],
          }),
          isBothRole && profileTab === 'clients' &&
            c.jsxs("div", {
              className: "rounded-2xl border border-border-light dark:border-border-dark px-4 py-4 space-y-3",
              children: [
                c.jsxs("div", {
                  children: [
                    c.jsx("h3", {
                      className: "text-sm font-bold text-text-main",
                      children: "Gestion de clientes",
                    }),
                    c.jsx("p", {
                      className: "mt-1 text-xs text-text-sub",
                      children: "Solo visible para usuarios BOTH. Aqui puedes editar o borrar clientes.",
                    }),
                  ],
                }),
                c.jsx("input", {
                  type: "text",
                  value: clientSearch,
                  onChange: (event) => setClientSearch(event.target.value),
                  placeholder: "Buscar cliente, telefono, email o tags...",
                  className:
                    "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                }),
                filteredProfileClients.length === 0
                  ? c.jsx("p", {
                      className: "text-xs text-text-sub",
                      children: "No hay clientes que coincidan con el filtro.",
                    })
                  : c.jsx("div", {
                      className: "space-y-2 max-h-[360px] overflow-y-auto pr-1",
                      children: filteredProfileClients.map((client) =>
                        c.jsxs("div", {
                          className: "rounded-2xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-gray-900/40 px-3 py-3 space-y-2",
                          children: [
                            c.jsxs("div", {
                              className: "flex items-start justify-between gap-3",
                              children: [
                                c.jsxs("div", {
                                  className: "min-w-0",
                                  children: [
                                    c.jsx("p", {
                                      className: "font-bold text-sm text-text-main truncate",
                                      children: client.name || "Cliente",
                                    }),
                                    !!getClientPhoneDisplay(client) &&
                                      c.jsx("p", {
                                        className: "text-[11px] text-text-sub truncate",
                                        children: getClientPhoneDisplay(client),
                                      }),
                                    client.email &&
                                      c.jsx("p", {
                                        className: "text-[11px] text-text-sub truncate",
                                        children: client.email,
                                      }),
                                  ],
                                }),
                                c.jsx("span", {
                                  className:
                                    "rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300",
                                  children: String(client.status || "Pending"),
                                }),
                              ],
                            }),
                            client.tags &&
                              c.jsx("p", {
                                className: "text-[11px] text-text-sub",
                                children: client.tags,
                              }),
                            c.jsxs("div", {
                              className: "flex flex-wrap items-center gap-2",
                              children: [
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () => typeof onEditClient === "function" && onEditClient(client),
                                  className:
                                    "px-3 py-2 rounded-xl bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition",
                                  children: "Editar",
                                }),
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () => typeof onDeleteClient === "function" && onDeleteClient(client.id),
                                  className:
                                    "px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition",
                                  children: "Borrar",
                                }),
                              ],
                            }),
                          ],
                        }, client.id),
                      ),
                    }),
              ],
            }),
          isBothRole && profileTab === 'users' &&
            c.jsxs("div", {
              className: "rounded-2xl border border-border-light dark:border-border-dark px-4 py-4 space-y-4",
              children: [
                c.jsxs("div", {
                  children: [
                    c.jsx("h3", {
                      className: "text-sm font-bold text-text-main",
                      children: "Gestion de usuarios",
                    }),
                    c.jsx("p", {
                      className: "mt-1 text-xs text-text-sub",
                      children: "Solo visible para usuarios BOTH. Aqui puedes editar usuarios y guardar su telefono con codigo de pais.",
                    }),
                  ],
                }),
                c.jsx("input", {
                  type: "text",
                  value: userSearch,
                  onChange: (event) => setUserSearch(event.target.value),
                  placeholder: "Buscar usuario, correo, telefono o rol...",
                  className:
                    "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                }),
                c.jsxs("div", {
                  className: "grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]",
                  children: [
                    c.jsxs("div", {
                      className: "space-y-2 max-h-[420px] overflow-y-auto pr-1",
                      children: filteredUsers.length === 0
                        ? c.jsx("p", {
                            className: "text-xs text-text-sub",
                            children: "No hay usuarios que coincidan con el filtro.",
                          })
                        : filteredUsers.map((user) => {
                            const profileData = user.profile || {};
                            const isSelected = Number(selectedUserId) === Number(user.id);
                            return c.jsxs("button", {
                              type: "button",
                              onClick: () => {
                                setSelectedUserId(user.id);
                                setUserForm({
                                  username: String(user.username || ''),
                                  email: String(user.email || ''),
                                  first_name: String(user.first_name || ''),
                                  last_name: String(user.last_name || ''),
                                  is_active: !!user.is_active,
                                  role: String(profileData.role || 'AV'),
                                  display_name: String(profileData.display_name || ''),
                                  phone_country_code: String(profileData.phone_country_code || '+52'),
                                  phone: String(profileData.phone || ''),
                                });
                              },
                              className: `w-full text-left rounded-2xl border px-3 py-3 transition ${
                                isSelected
                                  ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                                  : "border-border-light dark:border-border-dark bg-white/90 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900"
                              }`,
                              children: [
                                c.jsxs("div", {
                                  className: "flex items-start justify-between gap-3",
                                  children: [
                                    c.jsxs("div", {
                                      className: "min-w-0",
                                      children: [
                                        c.jsx("p", {
                                          className: "text-sm font-bold text-text-main truncate",
                                          children: getUserOptionLabel(user),
                                        }),
                                        c.jsx("p", {
                                          className: "text-[11px] text-text-sub truncate",
                                          children: `@${user.username || ""}`,
                                        }),
                                      ],
                                    }),
                                    c.jsx("span", {
                                      className: `rounded-full px-2 py-1 text-[10px] font-bold ${
                                        user.is_active
                                          ? "bg-emerald-100 text-emerald-700"
                                          : "bg-gray-100 text-gray-500"
                                      }`,
                                      children: user.is_active ? "Activo" : "Inactivo",
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className: "mt-2 flex flex-wrap items-center gap-2 text-[11px] text-text-sub",
                                  children: [
                                    c.jsx("span", {
                                      children: `Rol: ${String(profileData.role || "AV")}`,
                                    }),
                                    c.jsx("span", {
                                      children: getUserPhoneDisplay(user) || "Sin telefono",
                                    }),
                                  ],
                                }),
                              ],
                            }, user.id);
                          }),
                    }),
                    c.jsxs("div", {
                      className: "rounded-2xl border border-border-light dark:border-border-dark bg-white/80 dark:bg-gray-900/30 px-3 py-3 space-y-3",
                      children: [
                        c.jsxs("div", {
                          className: "flex items-center justify-between gap-3",
                          children: [
                            c.jsxs("div", {
                              children: [
                                c.jsx("h4", {
                                  className: "text-sm font-bold text-text-main",
                                  children: "Editar usuario",
                                }),
                                c.jsx("p", {
                                  className: "text-[11px] text-text-sub mt-0.5",
                                  children: selectedProfileUser
                                    ? `@${selectedProfileUser.username}`
                                    : "Selecciona un usuario para editarlo.",
                                }),
                              ],
                            }),
                            userSaving &&
                              c.jsx("span", {
                                className: "text-[11px] font-semibold text-primary",
                                children: "Guardando...",
                              }),
                          ],
                        }),
                        userForm
                          ? c.jsxs("div", {
                              className: "grid gap-3 md:grid-cols-2",
                              children: [
                                c.jsxs("label", {
                                  className: "block md:col-span-2",
                                  children: [
                                    c.jsx("span", {
                                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                      children: "Username",
                                    }),
                                    c.jsx("input", {
                                      type: "text",
                                      value: userForm.username || "",
                                      onChange: (event) =>
                                        setUserForm((current) => ({ ...current, username: event.target.value })),
                                      className:
                                        "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                                    }),
                                  ],
                                }),
                                c.jsxs("label", {
                                  className: "block md:col-span-2",
                                  children: [
                                    c.jsx("span", {
                                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                      children: "Correo",
                                    }),
                                    c.jsx("input", {
                                      type: "email",
                                      value: userForm.email || "",
                                      onChange: (event) =>
                                        setUserForm((current) => ({ ...current, email: event.target.value })),
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
                                      children: "Nombre visible",
                                    }),
                                    c.jsx("input", {
                                      type: "text",
                                      value: userForm.display_name || "",
                                      onChange: (event) =>
                                        setUserForm((current) => ({ ...current, display_name: event.target.value })),
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
                                      children: "Rol",
                                    }),
                                    c.jsx("select", {
                                      value: userForm.role || "AV",
                                      onChange: (event) =>
                                        setUserForm((current) => ({ ...current, role: event.target.value })),
                                      className:
                                        "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                                      children: [
                                        c.jsx("option", { value: "AV", children: "AV" }, "AV"),
                                        c.jsx("option", { value: "PS", children: "PS" }, "PS"),
                                        c.jsx("option", { value: "BOTH", children: "BOTH" }, "BOTH"),
                                      ],
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
                                      value: userForm.phone_country_code || "+52",
                                      onChange: (event) =>
                                        setUserForm((current) => ({
                                          ...current,
                                          phone_country_code: sanitizeClientCountryCodeInput(event.target.value),
                                        })),
                                      placeholder: "+1",
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
                                      inputMode: "numeric",
                                      value: userForm.phone || "",
                                      onChange: (event) =>
                                        setUserForm((current) => ({
                                          ...current,
                                          phone: normalizeDigits(event.target.value),
                                        })),
                                      placeholder: "5551234567",
                                      className:
                                        "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                                    }),
                                  ],
                                }),
                                c.jsxs("label", {
                                  className: "block md:col-span-2",
                                  children: [
                                    c.jsx("span", {
                                      className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                      children: "Activo",
                                    }),
                                    c.jsx("select", {
                                      value: userForm.is_active ? "1" : "0",
                                      onChange: (event) =>
                                        setUserForm((current) => ({
                                          ...current,
                                          is_active: event.target.value === "1",
                                        })),
                                      className:
                                        "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                                      children: [
                                        c.jsx("option", { value: "1", children: "Si" }, "1"),
                                        c.jsx("option", { value: "0", children: "No" }, "0"),
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className: "md:col-span-2 flex flex-wrap items-center gap-2 pt-1",
                                  children: [
                                    c.jsx("button", {
                                      type: "button",
                                      onClick: async () => {
                                        if (!selectedProfileUser || !userForm || userSaving) return;
                                        const payload = {
                                          username: String(userForm.username || "").trim(),
                                          email: String(userForm.email || "").trim(),
                                          first_name: String(userForm.first_name || "").trim(),
                                          last_name: String(userForm.last_name || "").trim(),
                                          is_active: !!userForm.is_active,
                                          role: String(userForm.role || "AV").trim(),
                                          display_name: String(userForm.display_name || "").trim(),
                                          phone_country_code: String(userForm.phone_country_code || "+52").trim(),
                                          phone: String(userForm.phone || "").trim(),
                                        };
                                        setUserSaving(true);
                                        try {
                                          const savedUser = await saveUserRecord(selectedProfileUser.id, payload);
                                          if (savedUser) {
                                            const savedProfile = savedUser.profile || {};
                                            setUserForm({
                                              username: String(savedUser.username || ''),
                                              email: String(savedUser.email || ''),
                                              first_name: String(savedUser.first_name || ''),
                                              last_name: String(savedUser.last_name || ''),
                                              is_active: !!savedUser.is_active,
                                              role: String(savedProfile.role || 'AV'),
                                              display_name: String(savedProfile.display_name || ''),
                                              phone_country_code: String(savedProfile.phone_country_code || '+52'),
                                              phone: String(savedProfile.phone || ''),
                                            });
                                          }
                                        } catch (error) {
                                          console.error("Failed saving user from profile", error);
                                        } finally {
                                          setUserSaving(false);
                                        }
                                      },
                                      disabled: userSaving || !selectedProfileUser,
                                      className:
                                        "px-4 py-2 rounded-xl text-xs font-bold transition bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed",
                                      children: userSaving ? "Guardando..." : "Guardar usuario",
                                    }),
                                    c.jsx("p", {
                                      className: "text-[11px] text-text-sub",
                                      children: "El numero se guardara junto con el codigo de pais para WAHA.",
                                    }),
                                  ],
                                }),
                              ],
                            })
                          : c.jsx("p", {
                              className: "text-sm text-text-sub",
                              children: "Selecciona un usuario para editarlo.",
                            }),
                      ],
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
