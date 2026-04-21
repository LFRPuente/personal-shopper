import { V, c } from "../utils.js";

const ReviewNotifyRecipientSwitch = V.memo(function ReviewNotifyRecipientSwitch({
  enabled = false,
  setEnabled = () => {},
  users = [],
  selectedRecipientIds = [],
  setSelectedRecipientIds = () => {},
}) {
  const selectedSet = new Set((selectedRecipientIds || []).map((value) => Number(value)));
  const selectableUsers = (users || []).filter((user) => user && user.id);

  const toggleRecipient = (userId) => {
    const numericId = Number(userId);
    if (!numericId) return;
    setSelectedRecipientIds((values) => {
      const next = new Set((values || []).map((value) => Number(value)));
      next.has(numericId) ? next.delete(numericId) : next.add(numericId);
      return Array.from(next);
    });
  };

  return c.jsxs("div", {
    className: "rounded-2xl border border-border-light dark:border-border-dark bg-white/85 dark:bg-slate-950/30 px-3 py-3 space-y-3",
    children: [
      c.jsxs("div", {
        className: "flex items-center justify-between gap-3",
        children: [
          c.jsx("p", {
            className: "text-sm font-semibold text-slate-900 dark:text-slate-100",
            children: "Destinatarios",
          }),
          c.jsxs("button", {
            type: "button",
            role: "switch",
            "aria-checked": enabled,
            onClick: () => setEnabled(!enabled),
            className:
              `inline-flex h-9 w-20 items-center justify-between rounded-full border px-2.5 text-[11px] font-semibold transition ${enabled ? "border-primary/40 bg-primary/10 text-primary" : "border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"}`,
            children: [
              c.jsx("span", {
                children: enabled ? "ON" : "OFF",
              }),
              c.jsx("span", {
                className:
                  `inline-flex h-4 w-8 items-center rounded-full p-0.5 transition ${enabled ? "bg-primary" : "bg-slate-300 dark:bg-slate-600"}`,
                children: c.jsx("span", {
                  className:
                    `h-3 w-3 rounded-full bg-white shadow transition ${enabled ? "translate-x-4" : "translate-x-0"}`,
                }),
              }),
            ],
          }),
        ],
      }),
      enabled
        ? c.jsxs(c.Fragment, {
            children: [
              c.jsx("p", {
                className: "text-[11px] text-slate-500 dark:text-slate-300",
                children:
                  "Activa el switch para elegir a qué usuario enviar el mensaje por WAHA.",
              }),
              c.jsx("div", {
                className:
                  "grid gap-2 max-h-56 overflow-y-auto pr-1",
                children: selectableUsers.length > 0
                  ? selectableUsers.map((user) => {
                      const profile = user.profile || {};
                      const hasPhone = !!String(profile.phone || "").trim();
                      const checked = selectedSet.has(Number(user.id));
                      const userLabel =
                        String(profile.display_name || "").trim() ||
                        String(user.username || "").trim() ||
                        `Usuario ${user.id}`;

                      return c.jsxs(
                        "button",
                        {
                          type: "button",
                          onClick: () => hasPhone && toggleRecipient(user.id),
                          disabled: !hasPhone,
                          className: `text-left rounded-xl border px-3 py-2 transition ${
                            checked
                              ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                              : "border-border-light dark:border-border-dark bg-white/90 dark:bg-slate-900/65 hover:bg-slate-50 dark:hover:bg-slate-900"
                          } ${!hasPhone ? "opacity-50 cursor-not-allowed" : ""}`,
                          children: [
                            c.jsxs("div", {
                              className: "flex items-center justify-between gap-3",
                              children: [
                                c.jsxs("div", {
                                  className: "min-w-0",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-sm font-bold text-slate-900 dark:text-slate-100 truncate",
                                      children: userLabel,
                                    }),
                                  ],
                                }),
                                c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-[18px] text-primary dark:text-primary/90",
                                  children: checked
                                    ? "check_circle"
                                    : "radio_button_unchecked",
                                }),
                              ],
                            }),
                          ],
                        },
                        user.id,
                      );
                    })
                  : c.jsx("p", {
                      className: "text-sm text-text-sub",
                      children: "No hay usuarios disponibles.",
                    }),
              }),
            ],
          })
        : c.jsx("p", {
            className: "text-[11px] text-slate-500 dark:text-slate-300",
            children: "Switch apagado. Se enviará al destinatario por defecto.",
          }),
    ],
  });
});

export default ReviewNotifyRecipientSwitch;
