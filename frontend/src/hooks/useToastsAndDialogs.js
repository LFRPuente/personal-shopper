import { V } from "../utils.js";

export function useToastsAndDialogs() {
  const [toasts, setToasts] = V.useState([]);
  const [confirmDialog, setConfirmDialog] = V.useState(null);
  const [inputDialog, setInputDialog] = V.useState(null);
  const toastTimeoutsRef = V.useRef(new Map());
  const toastIdRef = V.useRef(0);

  const dismissToast = V.useCallback((id) => {
    const timeout = toastTimeoutsRef.current.get(id);
    if (timeout) clearTimeout(timeout);
    toastTimeoutsRef.current.delete(id);
    setToasts((items) => items.filter((item) => item.id !== id));
  }, []);

  const pushToast = V.useCallback(
    (message, tone = "info") => {
      const text = String(message || "").trim();
      if (!text) return;
      const id = `${Date.now()}-${toastIdRef.current++}`;
      setToasts((items) => [...items, { id, message: text, tone }].slice(-4));
      const timeout = window.setTimeout(() => dismissToast(id), 3200);
      toastTimeoutsRef.current.set(id, timeout);
    },
    [dismissToast],
  );

  const notifySuccess = V.useCallback((message) => pushToast(message, "success"), [pushToast]);
  const notifyError = V.useCallback((message) => pushToast(message, "error"), [pushToast]);
  const notifyInfo = V.useCallback((message) => pushToast(message, "info"), [pushToast]);

  const confirmAction = V.useCallback(
    ({
      title = "Confirmar accion",
      message = "",
      confirmLabel = "Continuar",
      cancelLabel = "Cancelar",
      tone = "danger",
    }) =>
      new Promise((resolve) => {
        setConfirmDialog({
          title,
          message,
          confirmLabel,
          cancelLabel,
          tone,
          resolve,
        });
      }),
    [],
  );

  const closeConfirmDialog = V.useCallback(
    (confirmed) => {
      if (confirmDialog && confirmDialog.resolve) {
        confirmDialog.resolve(!!confirmed);
      }
      setConfirmDialog(null);
    },
    [confirmDialog],
  );

  const openInputDialog = V.useCallback(
    ({
      title = "Captura",
      message = "",
      confirmLabel = "Guardar",
      cancelLabel = "Cancelar",
      fields = [],
    }) =>
      new Promise((resolve) => {
        setInputDialog({
          title,
          message,
          confirmLabel,
          cancelLabel,
          fields: fields.map((field) => ({
            ...field,
            value:
              typeof field.value !== "undefined"
                ? field.value
                : field.type === "select"
                  ? (((field.options || [])[0] || {}).value ?? "")
                  : "",
          })),
          resolve,
        });
      }),
    [],
  );

  const updateInputDialogField = V.useCallback((name, value) => {
    setInputDialog((dialog) =>
      dialog
        ? {
            ...dialog,
            fields: dialog.fields.map((field) =>
              field.name === name ? { ...field, value } : field,
            ),
          }
        : dialog,
    );
  }, []);

  const closeInputDialog = V.useCallback(
    (value = null) => {
      if (inputDialog && inputDialog.resolve) inputDialog.resolve(value);
      setInputDialog(null);
    },
    [inputDialog],
  );

  const submitInputDialog = V.useCallback(() => {
    if (!inputDialog) return;
    const missingField = inputDialog.fields.find((field) => {
      if (!field.required) return false;
      return !String(field.value || "").trim();
    });
    if (missingField) {
      notifyInfo(
        missingField.requiredMessage ||
          `Completa ${String(missingField.label || missingField.name || "este campo").toLowerCase()}.`,
      );
      return;
    }
    closeInputDialog(
      inputDialog.fields.reduce(
        (values, field) => ({ ...values, [field.name]: field.value }),
        {},
      ),
    );
  }, [closeInputDialog, inputDialog, notifyInfo]);

  V.useEffect(
    () => () => {
      toastTimeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
      toastTimeoutsRef.current.clear();
    },
    [],
  );

  return {
    toasts,
    confirmDialog,
    inputDialog,
    dismissToast,
    pushToast,
    notifySuccess,
    notifyError,
    notifyInfo,
    confirmAction,
    closeConfirmDialog,
    openInputDialog,
    updateInputDialogField,
    closeInputDialog,
    submitInputDialog,
  };
}
