import { V, c } from "../utils.js";

const CreateClientModal = V.memo(function CreateClientModal(props) {
  const {
    open,
    onSubmit,
    clientName,
    setClientName,
    clientPhoneCountryCode,
    setClientPhoneCountryCode,
    sanitizeClientCountryCodeInput,
    clientPhone,
    setClientPhone,
    sanitizeClientPhoneInput,
    shippingAddress,
    setShippingAddress,
    clientShippingAddresses,
    setClientShippingAddresses,
    dismissActiveOverlayRef,
    overlayBackdropClass,
    overlaySheetClass,
  } = props;

  if (!open) return null;

  return c.jsx("div", {
    className: overlayBackdropClass(
      "absolute inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
      "add-client",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl ui-sheet",
        "add-client",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsx("h3", {
          className: "text-xl font-bold mb-4",
          children: "Add New Client",
        }),
        c.jsxs("form", {
          onSubmit,
          className: "space-y-4",
          children: [
            c.jsxs("div", {
              children: [
                c.jsx("label", {
                  className:
                    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                  children: "Client Name",
                }),
                c.jsx("input", {
                  type: "text",
                  value: clientName,
                  onChange: (event) => setClientName(event.target.value),
                  placeholder: "e.g. John Doe",
                  className:
                    "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                  required: true,
                }),
              ],
            }),
            c.jsxs("div", {
              children: [
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Phone",
                    }),
                    c.jsxs("div", {
                      className: "grid grid-cols-[112px_minmax(0,1fr)] gap-3",
                      children: [
                        c.jsx("input", {
                          type: "text",
                          value: clientPhoneCountryCode,
                          onChange: (event) =>
                            setClientPhoneCountryCode(
                              sanitizeClientCountryCodeInput(event.target.value),
                            ),
                          placeholder: "+52",
                          maxLength: 8,
                          className:
                            "w-full px-4 py-3 text-lg border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                        }),
                        c.jsx("input", {
                          type: "tel",
                          inputMode: "numeric",
                          value: clientPhone,
                          onChange: (event) =>
                            setClientPhone(
                              sanitizeClientPhoneInput(event.target.value),
                            ),
                          placeholder: "5512345678",
                          maxLength: 10,
                          className:
                            "w-full px-4 py-3 text-lg border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "space-y-3",
              children: [
                c.jsx("label", {
                  className:
                    "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                  children: "Shipping Address",
                }),
                c.jsx("textarea", {
                  value: shippingAddress,
                  onChange: (event) => setShippingAddress(event.target.value),
                  placeholder: "123 Main St, City, State",
                  rows: 2,
                  className:
                    "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none",
                }),
                c.jsxs("div", {
                  className: "space-y-2",
                  children: [
                    c.jsxs("div", {
                      className: "flex items-center justify-between gap-3",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-xs font-medium uppercase tracking-[0.18em] text-gray-500",
                          children: "Other shipping addresses",
                        }),
                        c.jsxs("button", {
                          type: "button",
                          onClick: () =>
                            setClientShippingAddresses([
                              ...clientShippingAddresses,
                              "",
                            ]),
                          className:
                            "px-3 py-1.5 text-xs font-semibold rounded-xl ui-btn-secondary",
                          children: ["+", " Add"],
                        }),
                      ],
                    }),
                    clientShippingAddresses.length
                      ? clientShippingAddresses.map((address, index) =>
                          c.jsxs(
                            "div",
                            {
                              className: "flex gap-2 items-start",
                              children: [
                                c.jsx("textarea", {
                                  value: address,
                                  onChange: (event) =>
                                    setClientShippingAddresses(
                                      clientShippingAddresses.map(
                                        (current, currentIndex) =>
                                          currentIndex === index
                                            ? event.target.value
                                            : current,
                                      ),
                                    ),
                                  rows: 2,
                                  placeholder: "Additional shipping address",
                                  className:
                                    "flex-1 px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none",
                                }),
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () =>
                                    setClientShippingAddresses(
                                      clientShippingAddresses.filter(
                                        (_, currentIndex) =>
                                          currentIndex !== index,
                                      ),
                                    ),
                                  className:
                                    "px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100",
                                  children: "Remove",
                                }),
                              ],
                            },
                            `create-client-shipping-${index}`,
                          ),
                        )
                      : c.jsx("p", {
                          className: "text-xs text-gray-500",
                          children: "No additional addresses yet.",
                        }),
                  ],
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
                  children: "Create",
                }),
              ],
            }),
          ],
        }),
      ],
    }),
  });
});

export default CreateClientModal;
