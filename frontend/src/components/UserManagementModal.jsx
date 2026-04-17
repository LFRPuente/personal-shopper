import { V, c, getUserOptionLabel, getUserPhoneDisplay, sanitizeClientCountryCodeInput } from "../utils.js";

const UserManagementModal = V.memo(function UserManagementModal(props) {
  const {
    open,
    users = [],
    currentUserId,
    createUserRecord,
    saveUserRecord,
    deleteUserRecord,
    onClose,
    overlayBackdropClass,
    overlaySheetClass,
  } = props;
  const backdropClass =
    typeof overlayBackdropClass === "function" ? overlayBackdropClass : (value) => value;
  const sheetClass =
    typeof overlaySheetClass === "function" ? overlaySheetClass : (value) => value;

  const [userSearch, setUserSearch] = V.useState("");
  const [selectedUserId, setSelectedUserId] = V.useState(null);
  const [creatingUser, setCreatingUser] = V.useState(false);
  const [userForm, setUserForm] = V.useState(null);
  const [userSaving, setUserSaving] = V.useState(false);
  const [userDeleting, setUserDeleting] = V.useState(false);

  const buildBlankUserForm = () => ({
    username: "",
    password: "",
    email: "",
    first_name: "",
    last_name: "",
    role: "AV",
    display_name: "",
    phone_country_code: "+52",
    phone: "",
  });

  const buildUserForm = (user) => {
    const profile = user?.profile || {};
    return {
      username: String(user?.username || ""),
      password: "",
      email: String(user?.email || ""),
      first_name: String(user?.first_name || ""),
      last_name: String(user?.last_name || ""),
      role: String(profile.role || "AV"),
      display_name: String(profile.display_name || ""),
      phone_country_code: String(profile.phone_country_code || "+52"),
      phone: String(profile.phone || ""),
    };
  };

  const sortedUsers = V.useMemo(
    () =>
      [...(Array.isArray(users) ? users : [])].sort((a, b) =>
        String(a?.username || "").localeCompare(String(b?.username || ""), "es", {
          sensitivity: "base",
        }),
      ),
    [users],
  );

  const filteredUsers = V.useMemo(() => {
    const search = String(userSearch || "").trim().toLowerCase();
    if (!search) return sortedUsers;
    return sortedUsers.filter((user) => {
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
        .join(" ")
        .toLowerCase();
      return blob.includes(search);
    });
  }, [sortedUsers, userSearch]);

  const selectedUser = V.useMemo(
    () =>
      (Array.isArray(sortedUsers)
        ? sortedUsers.find((user) => Number(user?.id) === Number(selectedUserId))
        : null) || null,
    [sortedUsers, selectedUserId],
  );

  V.useEffect(() => {
    if (!open) return;
    if (creatingUser) return;
    const preferred =
      sortedUsers.find((user) => Number(user?.id) === Number(currentUserId)) ||
      sortedUsers[0] ||
      null;
    if (!preferred) {
      setSelectedUserId(null);
      setUserForm(null);
      return;
    }
    setSelectedUserId((value) =>
      value && sortedUsers.some((user) => Number(user.id) === Number(value))
        ? value
        : preferred.id,
    );
    setUserSearch("");
    setUserForm(buildUserForm(preferred));
  }, [open, sortedUsers, currentUserId, creatingUser]);

  V.useEffect(() => {
    if (!open) return;
    if (creatingUser) {
      setUserForm(buildBlankUserForm());
      return;
    }
    const selected =
      sortedUsers.find((user) => Number(user?.id) === Number(selectedUserId)) ||
      null;
    setUserForm(selected ? buildUserForm(selected) : null);
  }, [open, selectedUserId, sortedUsers, creatingUser]);

  if (!open) return null;

  const isCreating = creatingUser || !selectedUserId;

  return c.jsx("div", {
    className: backdropClass(
      "fixed inset-0 z-[95] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
      "users",
    ),
    onClick: onClose,
    children: c.jsxs("div", {
      className: sheetClass(
        "w-full sm:max-w-5xl max-h-[92vh] bg-surface-light dark:bg-surface-dark rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden ui-sheet flex flex-col",
        "users",
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
                  children: "EDICION DE USUARIOS",
                }),
                c.jsx("h3", {
                  className: "text-base font-bold text-text-main truncate",
                  children: "Usuarios del sistema",
                }),
                c.jsx("p", {
                  className: "text-[11px] text-text-sub mt-0.5",
                  children: "Solo visible para usuarios BOTH.",
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
          className:
            "flex-1 min-h-0 overflow-y-auto ios-scroll px-4 py-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]",
          children: [
            c.jsxs("div", {
              className: "space-y-3",
              children: [
                c.jsx("input", {
                  type: "text",
                  value: userSearch,
                  onChange: (event) => setUserSearch(event.target.value),
                  placeholder: "Buscar usuario, correo, telefono o rol...",
                  className:
                    "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                }),
                c.jsxs("div", {
                  className: "flex flex-wrap items-center gap-2",
                  children: [
                    c.jsx("button", {
                      type: "button",
                      onClick: () => {
                        setCreatingUser(true);
                        setSelectedUserId(null);
                        setUserSearch("");
                        setUserForm(buildBlankUserForm());
                      },
                      className:
                        "px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition",
                      children: "Nuevo usuario",
                    }),
                    creatingUser &&
                      c.jsx("button", {
                        type: "button",
                        onClick: () => {
                          setCreatingUser(false);
                          const preferred =
                            sortedUsers.find((user) => Number(user?.id) === Number(currentUserId)) ||
                            sortedUsers[0] ||
                            null;
                          setSelectedUserId(preferred ? preferred.id : null);
                          setUserForm(preferred ? buildUserForm(preferred) : null);
                        },
                        className:
                          "px-3 py-2 rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition",
                        children: "Cancelar alta",
                      }),
                  ],
                }),
                c.jsx("div", {
                  className: "space-y-2 max-h-[64vh] overflow-y-auto pr-1",
                  children: filteredUsers.length === 0
                    ? c.jsx("p", {
                        className: "text-sm text-text-sub",
                        children: "No hay usuarios que coincidan con el filtro.",
                      })
                    : filteredUsers.map((user) => {
                        const profile = user.profile || {};
                        const isSelected = Number(selectedUserId) === Number(user.id);
                        return c.jsxs("button", {
                          type: "button",
                          onClick: () => {
                            setCreatingUser(false);
                            setSelectedUserId(user.id);
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
                                  className:
                                    "rounded-full px-2 py-1 text-[10px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
                                  children: String(profile.role || "AV"),
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: "mt-2 flex flex-wrap items-center gap-2 text-[11px] text-text-sub",
                              children: [
                                c.jsx("span", {
                                  children: getUserPhoneDisplay(user) || "Sin telefono",
                                }),
                              ],
                            }),
                          ],
                        }, user.id);
                      }),
                }),
              ],
            }),
            c.jsxs("div", {
              className:
                "rounded-2xl border border-border-light dark:border-border-dark bg-white/80 dark:bg-gray-900/30 px-3 py-3 space-y-3",
              children: [
                c.jsxs("div", {
                  className: "flex items-center justify-between gap-3",
                  children: [
                    c.jsxs("div", {
                      children: [
                        c.jsx("h4", {
                          className: "text-sm font-bold text-text-main",
                              children: isCreating ? "Crear usuario" : "Editar usuario",
                        }),
                        c.jsx("p", {
                          className: "text-[11px] text-text-sub mt-0.5",
                          children: isCreating
                            ? "Completa los datos para crear un usuario."
                            : selectedUser
                              ? `@${selectedUser.username}`
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
                                  phone: String(event.target.value || "").replace(/\D+/g, ""),
                                })),
                              placeholder: "5551234567",
                              className:
                                "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                            }),
                          ],
                        }),
                        isCreating &&
                          c.jsxs("label", {
                            className: "block md:col-span-2",
                            children: [
                              c.jsx("span", {
                                className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                                children: "Password",
                              }),
                              c.jsx("input", {
                                type: "password",
                                value: userForm.password || "",
                                onChange: (event) =>
                                  setUserForm((current) => ({
                                    ...current,
                                    password: event.target.value,
                                  })),
                                autoComplete: "new-password",
                                className:
                                  "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                              }),
                            ],
                          }),
                        c.jsxs("div", {
                          className: "md:col-span-2 flex flex-wrap items-center gap-2 pt-1",
                          children: [
                            c.jsx("button", {
                              type: "button",
                              onClick: async () => {
                                if (!userForm || userSaving) return;
                                const payload = {
                                  username: String(userForm.username || "").trim(),
                                  password: String(userForm.password || "").trim(),
                                  email: String(userForm.email || "").trim(),
                                  first_name: String(userForm.first_name || "").trim(),
                                  last_name: String(userForm.last_name || "").trim(),
                                  role: String(userForm.role || "AV").trim(),
                                  display_name: String(userForm.display_name || "").trim(),
                                  phone_country_code: String(userForm.phone_country_code || "+52").trim(),
                                  phone: String(userForm.phone || "").trim(),
                                };
                                if (!payload.username) return;
                                if (isCreating && !payload.password) return;
                                setUserSaving(true);
                                try {
                                  const savedUser = isCreating
                                    ? await createUserRecord(payload)
                                    : await saveUserRecord(selectedUser.id, payload);
                                  if (savedUser) {
                                    const savedProfile = savedUser.profile || {};
                                    setCreatingUser(false);
                                    setSelectedUserId(savedUser.id);
                                    setUserForm({
                                      username: String(savedUser.username || ""),
                                      password: "",
                                      email: String(savedUser.email || ""),
                                      first_name: String(savedUser.first_name || ""),
                                      last_name: String(savedUser.last_name || ""),
                                      role: String(savedProfile.role || "AV"),
                                      display_name: String(savedProfile.display_name || ""),
                                      phone_country_code: String(savedProfile.phone_country_code || "+52"),
                                      phone: String(savedProfile.phone || ""),
                                    });
                                  }
                                } finally {
                                  setUserSaving(false);
                                }
                              },
                              disabled:
                                userSaving ||
                                !userForm ||
                                (isCreating && !String(userForm.password || "").trim()),
                              className:
                                "px-4 py-2 rounded-xl text-xs font-bold transition bg-primary text-white hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed",
                              children: userSaving
                                ? "Guardando..."
                                : isCreating
                                  ? "Crear usuario"
                                  : "Guardar usuario",
                            }),
                            !isCreating &&
                              c.jsx("button", {
                                type: "button",
                                onClick: async () => {
                                  if (!selectedUser || userDeleting) return;
                                  if (!window.confirm(`Eliminar a @${selectedUser.username}?`)) return;
                                  setUserDeleting(true);
                                  try {
                                    await deleteUserRecord(selectedUser.id);
                                  } finally {
                                    setUserDeleting(false);
                                  }
                                },
                                disabled:
                                  userDeleting ||
                                  !selectedUser ||
                                  Number(selectedUser.id) === Number(currentUserId),
                                className:
                                  "px-4 py-2 rounded-xl text-xs font-bold transition bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed",
                                children: userDeleting ? "Eliminando..." : "Borrar usuario",
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
  });
});

export default UserManagementModal;
