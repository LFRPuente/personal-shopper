import { V, c } from "../utils.js";

const EditTicketModal = V.memo(function EditTicketModal({
  open,
  ticket,
  ticketForm,
  setTicketForm,
  onSubmit,
  dismissActiveOverlayRef,
  overlayBackdropClass,
  overlaySheetClass,
}) {
  if (!open || !ticket) return null;

  return c.jsx("div", {
    className: overlayBackdropClass(
      "absolute inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
      "edit-ticket",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl ui-sheet",
        "edit-ticket",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsxs("h3", {
          className: "text-xl font-bold mb-4",
          children: ["Edit Ticket #", ticket.id, " Data"],
        }),
        c.jsxs("form", {
          onSubmit,
          className: "space-y-4",
          children: [
            c.jsxs("div", {
              className: "grid grid-cols-2 gap-4",
              children: [
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Store Total",
                    }),
                    c.jsx("input", {
                      type: "number",
                      step: "0.01",
                      value: ticketForm.total_real_price,
                      onChange: (event) =>
                        setTicketForm({
                          ...ticketForm,
                          total_real_price: event.target.value,
                        }),
                      className:
                        "w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700",
                    }),
                  ],
                }),
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Charged Total",
                    }),
                    c.jsx("input", {
                      type: "number",
                      step: "0.01",
                      value: ticketForm.total_charged_price,
                      onChange: (event) =>
                        setTicketForm({
                          ...ticketForm,
                          total_charged_price: event.target.value,
                        }),
                      className:
                        "w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700",
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "grid grid-cols-2 gap-4",
              children: [
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Tax %",
                    }),
                    c.jsx("input", {
                      type: "number",
                      step: "0.01",
                      value: ticketForm.tax_percentage,
                      onChange: (event) =>
                        setTicketForm({
                          ...ticketForm,
                          tax_percentage: event.target.value,
                        }),
                      className:
                        "w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700",
                    }),
                  ],
                }),
                c.jsx("div", {
                  className: "flex flex-col justify-end pb-2",
                  children: c.jsxs("label", {
                    className: "flex items-center gap-2 cursor-pointer",
                    children: [
                      c.jsx("input", {
                        type: "checkbox",
                        checked: ticketForm.shipping_paid,
                        onChange: (event) =>
                          setTicketForm({
                            ...ticketForm,
                            shipping_paid: event.target.checked,
                          }),
                        className: "w-5 h-5 text-primary rounded",
                      }),
                      c.jsx("span", {
                        className: "text-sm font-medium",
                        children: "Shopping pagado por",
                      }),
                    ],
                  }),
                }),
              ],
            }),
            c.jsxs("div", {
              className: "flex gap-3 pt-4",
              children: [
                c.jsx("button", {
                  type: "button",
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "flex-1 py-3 font-semibold rounded-xl ui-btn-secondary",
                  children: "Cancel",
                }),
                c.jsx("button", {
                  type: "submit",
                  className:
                    "flex-1 py-3 font-semibold rounded-xl ui-btn-primary",
                  children: "Save",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
});

export default EditTicketModal;
