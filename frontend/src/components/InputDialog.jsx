import { V, c } from '../utils.js';

const InputDialog = V.memo(function InputDialog({
  inputDialog,
  overlayBackdropClass,
  overlaySheetClass,
  dismissActiveOverlayRef,
  updateInputDialogField,
  submitInputDialog,
}) {
  if (!inputDialog) return null;

  return c.jsx("div", {
    className: overlayBackdropClass(
      "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-4 ui-backdrop",
      "input",
    ),
    onClick: () => dismissActiveOverlayRef.current(),
    children: c.jsxs("div", {
      className: overlaySheetClass(
        "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl p-5 ui-sheet flex flex-col",
        "input",
      ),
      onClick: (event) => event.stopPropagation(),
      children: [
        c.jsx("div", {
          className: "flex-1 overflow-y-auto ios-scroll pr-1",
          children: [
            c.jsx("h3", {
              className: "text-base font-bold text-text-main",
              children: inputDialog.title,
            }),
            inputDialog.message &&
              c.jsx("p", {
                className: "text-sm text-text-sub mt-1",
                children: inputDialog.message,
              }),
            c.jsx("div", {
              className: "mt-4 space-y-3",
              children: inputDialog.fields.map((field) =>
                c.jsxs(
                  "label",
                  {
                    className: "block",
                    children: [
                      c.jsx("span", {
                        className: "text-[11px] font-semibold text-text-sub",
                        children: field.label || field.name,
                      }),
                      field.type === "textarea"
                        ? c.jsx("textarea", {
                            rows: 4,
                            value: field.value,
                            onChange: (event) =>
                              updateInputDialogField(field.name, event.target.value),
                            placeholder: field.placeholder || "",
                            className:
                              "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                          })
                        : field.type === "select"
                          ? c.jsx("select", {
                              value: field.value,
                              onChange: (event) =>
                                updateInputDialogField(field.name, event.target.value),
                              className:
                                "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                              children: (field.options || []).map((option) =>
                                c.jsx(
                                  "option",
                                  { value: option.value, children: option.label },
                                  `${field.name}-${option.value}`,
                                ),
                              ),
                            })
                          : c.jsx("input", {
                              type: "text",
                              value: field.value,
                              onChange: (event) =>
                                updateInputDialogField(field.name, event.target.value),
                              placeholder: field.placeholder || "",
                              className:
                                "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                            }),
                    ],
                  },
                  field.name,
                ),
              ),
            }),
          ],
        }),
        c.jsxs("div", {
          className:
            "mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-border-light dark:border-border-dark",
          children: [
            c.jsx("button", {
              onClick: () => dismissActiveOverlayRef.current(),
              className:
                "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold",
              children: inputDialog.cancelLabel,
            }),
            c.jsx("button", {
              onClick: submitInputDialog,
              className:
                "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold",
              children: inputDialog.confirmLabel,
            }),
          ],
        }),
      ],
    }),
  });
});

export default InputDialog;
