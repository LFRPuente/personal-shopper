import { V } from '../utils.js';

export function usePaymentsDomain({
  apiFetch,
  clients,
  shoppings,
  paymentDomainRef,
  refreshCoreDataRef,
  refreshSelectedClientRef,
  queueCoreRefreshRef,
  queueSelectedClientRefreshRef,
  notifyInfo,
  notifySuccess,
  notifyError,
  confirmAction,
}) {
  const [paymentModalOpen, setPaymentModalOpen] = V.useState(!1);
  const [paymentSaving, setPaymentSaving] = V.useState(!1);
  const [paymentProductSearch, setPaymentProductSearch] = V.useState("");
  const [paymentAmountManual, setPaymentAmountManual] = V.useState(!1);
  const [paymentForm, setPaymentForm] = V.useState({
    id: null,
    client: "",
    shopping: "",
    amount: "",
    product_ids: [],
  });
  const [paymentEntryEditingId, setPaymentEntryEditingId] = V.useState(null);
  const [paymentEntryDraftAmount, setPaymentEntryDraftAmount] = V.useState("");
  const [paymentEntrySavingId, setPaymentEntrySavingId] = V.useState(null);
  const [clientPaymentModalOpen, setClientPaymentModalOpen] = V.useState(!1);
  const [clientPaymentSaving, setClientPaymentSaving] = V.useState(!1);
  const [clientPaymentAmountManual, setClientPaymentAmountManual] = V.useState(!1);
  const [clientPaymentForm, setClientPaymentForm] = V.useState({
    client: "",
    amount: "",
  });
  const [clientPaymentEntryEditingId, setClientPaymentEntryEditingId] = V.useState(null);
  const [clientPaymentEntryDraftAmount, setClientPaymentEntryDraftAmount] = V.useState("");
  const [clientPaymentEntrySavingId, setClientPaymentEntrySavingId] = V.useState(null);

  const getDomain = V.useCallback(() => paymentDomainRef.current || {}, [paymentDomainRef]);
  const queuePaymentRefresh = V.useCallback(
    (coreDelay = 180, selectedDelay = 260) => {
      if (queueCoreRefreshRef && queueCoreRefreshRef.current) queueCoreRefreshRef.current(coreDelay);
      else
        refreshCoreDataRef.current().catch((error) => {
          console.error("Failed refreshing payment core data", error);
        });
      if (queueSelectedClientRefreshRef && queueSelectedClientRefreshRef.current)
        queueSelectedClientRefreshRef.current(selectedDelay);
      else
        refreshSelectedClientRef.current().catch((error) => {
          console.error("Failed refreshing payment selected client", error);
        });
    },
    [queueCoreRefreshRef, queueSelectedClientRefreshRef, refreshCoreDataRef, refreshSelectedClientRef],
  );

  const closePaymentModal = V.useCallback(() => {
    setPaymentModalOpen(!1);
    setPaymentAmountManual(!1);
    setPaymentProductSearch("");
    setPaymentEntryEditingId(null);
    setPaymentEntryDraftAmount("");
    setPaymentEntrySavingId(null);
  }, []);

  const closeClientPaymentModal = V.useCallback(() => {
    setClientPaymentModalOpen(!1);
    setClientPaymentAmountManual(!1);
    setClientPaymentSaving(!1);
    setClientPaymentEntryEditingId(null);
    setClientPaymentEntryDraftAmount("");
    setClientPaymentEntrySavingId(null);
    setClientPaymentForm({
      client: "",
      amount: "",
    });
  }, []);

  const openPaymentModal = V.useCallback(
    (client, shopping = null, record = null) => {
      const domain = getDomain();
      const shoppingId = Number(
        (record && (record.shopping || record.mission)) ||
          (shopping && shopping.id) ||
          (shopping || (domain.activeShopping && domain.activeShopping.id) || 0),
      );
      if (!client || !shoppingId) {
        notifyInfo("Selecciona cliente y shopping.");
        return;
      }
      const payments = domain.paymentLocalShoppingPayments(client, shoppingId);
      const currentRecord = record || payments[0] || null;
      const selectedIds = currentRecord
        ? domain.paymentLocalRecordProducts(currentRecord).map((product) => Number(product.id))
        : [];
      const products = domain.paymentLocalShoppingProducts(client, shoppingId, selectedIds);
      const productIds = products.map((product) => Number(product.id));
      const total = domain.paymentLocalProductsTotal(
        products,
        domain.paymentLocalShoppingDiscount(shoppingId),
      );
      const suggested = total > 0 ? total.toFixed(2) : "";
      const existingAmount = domain.paymentLocalFormatAmountField(currentRecord && currentRecord.amount);
      const isManual = existingAmount !== "" && existingAmount !== suggested;
      if (currentRecord) {
        setPaymentForm({
          id: (currentRecord && currentRecord.id) || null,
          client: String(client.id),
          shopping: String(shoppingId),
          amount: "",
          product_ids: productIds,
        });
        setPaymentAmountManual(!0);
      } else {
        setPaymentForm({
          id: null,
          client: String(client.id),
          shopping: String(shoppingId),
          amount: isManual ? existingAmount : (existingAmount || suggested),
          product_ids: productIds,
        });
        setPaymentAmountManual(isManual);
      }
      setPaymentProductSearch("");
      setPaymentEntryEditingId(null);
      setPaymentEntryDraftAmount("");
      setPaymentEntrySavingId(null);
      setPaymentModalOpen(!0);
    },
    [getDomain, notifyInfo],
  );

  const openClientPaymentModal = V.useCallback(
    (client) => {
      if (!client) return;
      const domain = getDomain();
      const debt = domain.getClientPaymentGlobalDebtAmount(client);
      setClientPaymentForm({
        client: String(client.id),
        amount: debt > 0 ? debt.toFixed(2) : "",
      });
      setClientPaymentAmountManual(!1);
      setClientPaymentModalOpen(!0);
    },
    [getDomain],
  );

  const togglePaymentProductSelection = V.useCallback(
    (product) => {
      if (!product) return;
      const domain = getDomain();
      if (domain.paymentReservedProductIds.has(Number(product.id))) return;
      setPaymentForm((current) => {
        const productId = Number(product.id);
        const productIds = (current.product_ids || []).includes(productId)
          ? (current.product_ids || []).filter((id) => Number(id) !== productId)
          : [...(current.product_ids || []), productId];
        return { ...current, product_ids: productIds };
      });
    },
    [getDomain],
  );

  const startEditingPaymentEntry = V.useCallback(
    (entry) => {
      if (!entry) return;
      const domain = getDomain();
      setPaymentEntryEditingId(String(entry.id));
      setPaymentEntryDraftAmount(domain.paymentLocalFormatAmountField(entry.amount));
    },
    [getDomain],
  );

  const cancelEditingPaymentEntry = V.useCallback(() => {
    setPaymentEntryEditingId(null);
    setPaymentEntryDraftAmount("");
  }, []);

  const saveNegativeClientBatchEntry = V.useCallback(
    async (client, entry, amount) => {
      const domain = getDomain();
      const groupToken = String((entry && entry.group_token) || "").trim();
      const groupedEntries = (entry && entry.grouped_entries) || [];
      const keepEntry = groupedEntries.find((item) => item && item.payment_id && item.id) || null;
      if (!client || !groupToken) return !1;
      for (const item of groupedEntries)
        item &&
          item.payment_id &&
          item.id &&
          (!keepEntry ||
            String(item.payment_id) !== String(keepEntry.payment_id) ||
            String(item.id) !== String(keepEntry.id)) &&
          (await apiFetch(`/payments/${item.payment_id}/entries/${item.id}/`, {
            method: "DELETE",
          }));
      if (keepEntry) {
        await apiFetch(`/payments/${keepEntry.payment_id}/entries/${keepEntry.id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            amount: amount.toFixed(2),
          }),
        });
        return !0;
      }
      const target = domain.getClientPaymentBalanceAdjustmentTarget(client);
      const shoppingId = Number(target && target.key);
      if (!shoppingId) {
        notifyInfo("No hay shopping donde registrar la deuda inicial.");
        return !1;
      }
      const payment = domain.getClientShoppingPayments(client, shoppingId)[0] || null;
      await apiFetch(payment ? `/payments/${payment.id}/` : "/payments/", {
        method: payment ? "PATCH" : "POST",
        body: JSON.stringify({
          client: client.id,
          shopping: shoppingId,
          amount: ((payment ? domain.getPaymentRecordAmount(payment) : 0) + amount).toFixed(2),
          entry_kind: "CLIENT_BATCH",
          entry_group_token: groupToken,
        }),
      });
      return !0;
    },
    [apiFetch, getDomain, notifyInfo],
  );

  const savePaymentEntry = V.useCallback(
    async (entry) => {
      const domain = getDomain();
      const client = domain.paymentModalClient || domain.clientPaymentModalClient;
      const draft = String(paymentEntryDraftAmount || "").trim();
      if (!client || !entry) return;
      if (draft === "" || !Number.isFinite(parseFloat(draft))) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      const amount = domain.paymentLocalToNumber(draft, Number.NaN);
      if (!Number.isFinite(amount)) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      setPaymentEntrySavingId(String(entry.id));
      try {
        if (
          String((entry && entry.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
          String((entry && entry.group_token) || "").trim()
        ) {
          if (amount < 0) {
            if (!(await saveNegativeClientBatchEntry(client, entry, amount))) return;
          } else {
            const plan = domain.getClientBatchEditPlan(client, entry, amount);
            const groupedEntries = ((entry && entry.grouped_entries) || []).reduce((map, item) => {
              const shoppingId = Number(item && item.shopping_id);
              return (
                Number.isFinite(shoppingId) &&
                  (map.has(shoppingId) || map.set(shoppingId, []), map.get(shoppingId).push(item)),
                map
              );
            }, new Map());
            for (const item of plan) {
              const shoppingId = Number(item && item.key);
              const desiredAmount = Math.max(domain.toNumber(item && item.desiredAmount, 0), 0);
              const entries = groupedEntries.get(shoppingId) || [];
              const firstEntry = entries[0] || null;
              const extraEntries = entries.slice(1);
              for (const extraEntry of extraEntries)
                await apiFetch(`/payments/${extraEntry.payment_id}/entries/${extraEntry.id}/`, {
                  method: "DELETE",
                });
              if (firstEntry) {
                if (desiredAmount > 0)
                  await apiFetch(`/payments/${firstEntry.payment_id}/entries/${firstEntry.id}/`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      amount: desiredAmount.toFixed(2),
                    }),
                  });
                else
                  await apiFetch(`/payments/${firstEntry.payment_id}/entries/${firstEntry.id}/`, {
                    method: "DELETE",
                  });
              } else if (desiredAmount > 0) {
                const payment = domain.getClientShoppingPayments(client, shoppingId)[0] || null;
                const productIds = domain.getClientPaymentTargetProductIds(client, shoppingId);
                await apiFetch(payment ? `/payments/${payment.id}/` : "/payments/", {
                  method: payment ? "PATCH" : "POST",
                  body: JSON.stringify({
                    client: client.id,
                    shopping: shoppingId,
                    amount: (
                      (payment ? domain.getPaymentRecordAmount(payment) : 0) + desiredAmount
                    ).toFixed(2),
                    products: productIds,
                    entry_kind: "CLIENT_BATCH",
                    entry_group_token: entry.group_token,
                  }),
                });
              }
            }
          }
        } else {
          const paymentId = entry.payment_id || paymentForm.id;
          if (!paymentId || !entry.id) {
            notifyError("No se pudo identificar el abono.");
            return;
          }
          await apiFetch(`/payments/${paymentId}/entries/${entry.id}/`, {
            method: "PATCH",
            body: JSON.stringify({
              amount: amount.toFixed(2),
            }),
          });
        }
        setPaymentForm((current) => ({
          ...current,
          amount: "",
        }));
        setPaymentAmountManual(!0);
        setPaymentEntryEditingId(null);
        setPaymentEntryDraftAmount("");
        queuePaymentRefresh();
        notifySuccess("Abono actualizado.");
      } catch (error) {
        console.error("Failed updating payment entry", error);
        notifyError((error && error.message) || "No se pudo actualizar el abono.");
      } finally {
        setPaymentEntrySavingId(null);
      }
    },
    [
      apiFetch,
      getDomain,
      notifyError,
      notifyInfo,
      notifySuccess,
      paymentEntryDraftAmount,
      paymentForm.id,
      queuePaymentRefresh,
      saveNegativeClientBatchEntry,
    ],
  );

  const deletePaymentEntry = V.useCallback(
    async (entry) => {
      if (!entry) return;
      const isClientBatch =
        String((entry && entry.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
        String((entry && entry.group_token) || "").trim();
      if (
        !(await confirmAction({
          title: isClientBatch ? "Eliminar abono general" : "Eliminar abono",
          message: isClientBatch
            ? "Se eliminara este abono general y todas sus asignaciones por shopping."
            : "Se eliminara este abono del historial y se recalculara el total del pago.",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      setPaymentEntrySavingId(String(entry.id));
      try {
        const entries = isClientBatch
          ? (entry.grouped_entries || []).map((item) => ({
              payment_id: item.payment_id,
              id: item.id,
            }))
          : [{ payment_id: entry.payment_id || paymentForm.id, id: entry.id }];
        for (const item of entries)
          item &&
            item.payment_id &&
            item.id &&
            (await apiFetch(`/payments/${item.payment_id}/entries/${item.id}/`, {
              method: "DELETE",
            }));
        String(paymentEntryEditingId || "") === String(entry.id) &&
          (setPaymentEntryEditingId(null), setPaymentEntryDraftAmount(""));
        setPaymentForm((current) => ({
          ...current,
          amount: "",
        }));
        setPaymentAmountManual(!0);
        queuePaymentRefresh();
        notifySuccess("Abono eliminado.");
      } catch (error) {
        console.error("Failed deleting payment entry", error);
        notifyError((error && error.message) || "No se pudo eliminar el abono.");
      } finally {
        setPaymentEntrySavingId(null);
      }
    },
    [
      apiFetch,
      confirmAction,
      notifyError,
      notifySuccess,
      paymentEntryEditingId,
      paymentForm.id,
      queuePaymentRefresh,
    ],
  );

  const savePayment = V.useCallback(async () => {
    const domain = getDomain();
    const client = clients.find((item) => String(item.id) === String(paymentForm.client || ""));
    const shopping = shoppings.find((item) => String(item.id) === String(paymentForm.shopping || ""));
    const amountText = String(paymentForm.amount || "").trim();
    const amount =
      amountText === ""
        ? 0
        : domain.paymentLocalToNumber(amountText, Number.NaN);
    if (!client || !shopping) {
      notifyInfo("Selecciona cliente y shopping.");
      return;
    }
    if ((!paymentForm.id && amountText === "") || !Number.isFinite(amount)) {
      notifyInfo("Captura un monto valido.");
      return;
    }
    setPaymentSaving(!0);
    try {
      const totalAmount = paymentForm.id
        ? domain.paymentCurrentAmountValue + amount
        : amount;
      await apiFetch(
        paymentForm.id ? `/payments/${paymentForm.id}/` : "/payments/",
        {
          method: paymentForm.id ? "PATCH" : "POST",
          body: JSON.stringify({
            client: client.id,
            shopping: shopping.id,
            amount: totalAmount.toFixed(2),
            products: (paymentForm.product_ids || []).map((id) => Number(id)),
          }),
        },
      );
      closePaymentModal();
      queuePaymentRefresh();
      notifySuccess(
        paymentForm.id
          ? amount > 0
            ? "Abono guardado."
            : "Pago actualizado."
          : "Pago guardado.",
      );
    } catch (error) {
      console.error("Failed saving payment", error);
      notifyError((error && error.message) || "No se pudo guardar el pago.");
    } finally {
      setPaymentSaving(!1);
    }
  }, [
    apiFetch,
    clients,
    closePaymentModal,
    getDomain,
    notifyError,
    notifyInfo,
    notifySuccess,
    paymentForm,
    queuePaymentRefresh,
    shoppings,
  ]);

  const saveClientPayment = V.useCallback(async () => {
    const domain = getDomain();
    const client = domain.clientPaymentModalClient;
    const amount = domain.paymentLocalToNumber(clientPaymentForm.amount, Number.NaN);
    if (!client) {
      notifyInfo("Selecciona un cliente valido.");
      return;
    }
    if (!Number.isFinite(amount) || amount === 0) {
      notifyInfo("Captura un monto valido distinto de cero.");
      return;
    }
    const saveClientPaymentBalanceAdjustment = async (adjustmentAmount, successMessage, errorMessage) => {
      const target = domain.getClientPaymentBalanceAdjustmentTarget(client);
      const shoppingId = Number(target && target.key);
      if (!shoppingId) {
        notifyInfo("No hay shopping donde registrar el saldo inicial.");
        return !1;
      }
      setClientPaymentSaving(!0);
      try {
        const groupToken = `client-batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        const payment = domain.getClientShoppingPayments(client, shoppingId)[0] || null;
        await apiFetch(payment ? `/payments/${payment.id}/` : "/payments/", {
          method: payment ? "PATCH" : "POST",
          body: JSON.stringify({
            client: client.id,
            shopping: shoppingId,
            amount: ((payment ? domain.getPaymentRecordAmount(payment) : 0) + adjustmentAmount).toFixed(2),
            entry_kind: "CLIENT_BATCH",
            entry_group_token: groupToken,
          }),
        });
        closeClientPaymentModal();
        queuePaymentRefresh();
        notifySuccess(successMessage);
        return !0;
      } catch (error) {
        console.error(errorMessage, error);
        notifyError((error && error.message) || "No se pudo guardar el saldo inicial.");
        return !1;
      } finally {
        setClientPaymentSaving(!1);
      }
    };
    if (amount < 0) {
      await saveClientPaymentBalanceAdjustment(
        amount,
        "Deuda inicial guardada.",
        "Failed saving client debt adjustment",
      );
      return;
    }
    const plan = domain.getClientPaymentPlan(client, amount).filter(
      (item) => domain.paymentLocalToNumber(item && item.appliedAmount, 0) > 0,
    );
    if (plan.some((item) => item && item.isCreditAdjustment) || plan.length === 0) {
      await saveClientPaymentBalanceAdjustment(
        amount,
        "Saldo a favor guardado.",
        "Failed saving client credit adjustment",
      );
      return;
    }
    setClientPaymentSaving(!0);
    try {
      const groupToken = `client-batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      for (const item of plan) {
        const shoppingId = Number(item && item.key);
        const payment = domain.getClientShoppingPayments(client, shoppingId)[0] || null;
        const currentAmount = payment ? domain.getPaymentRecordAmount(payment) : 0;
        const productIds = domain.getClientPaymentTargetProductIds(client, shoppingId);
        await apiFetch(payment ? `/payments/${payment.id}/` : "/payments/", {
          method: payment ? "PATCH" : "POST",
          body: JSON.stringify({
            client: client.id,
            shopping: shoppingId,
            amount: (currentAmount + domain.paymentLocalToNumber(item.appliedAmount, 0)).toFixed(2),
            products: productIds,
            entry_kind: "CLIENT_BATCH",
            entry_group_token: groupToken,
          }),
        });
      }
      closeClientPaymentModal();
      queuePaymentRefresh();
      notifySuccess("Pago guardado.");
    } catch (error) {
      console.error("Failed saving client payment", error);
      notifyError((error && error.message) || "No se pudo guardar el pago.");
    } finally {
      setClientPaymentSaving(!1);
    }
  }, [
    apiFetch,
    clientPaymentForm.amount,
    closeClientPaymentModal,
    getDomain,
    notifyError,
    notifyInfo,
    notifySuccess,
    queuePaymentRefresh,
  ]);

  const startEditingClientPaymentEntry = V.useCallback(
    (entry) => {
      if (!entry) return;
      const domain = getDomain();
      setClientPaymentEntryEditingId(String(entry.id));
      setClientPaymentEntryDraftAmount(domain.paymentLocalFormatAmountField(entry.amount));
    },
    [getDomain],
  );

  const cancelEditingClientPaymentEntry = V.useCallback(() => {
    setClientPaymentEntryEditingId(null);
    setClientPaymentEntryDraftAmount("");
  }, []);

  const saveClientPaymentHistoryRow = V.useCallback(
    async (entry) => {
      const domain = getDomain();
      const client = domain.clientPaymentModalClient;
      const draft = String(clientPaymentEntryDraftAmount || "").trim();
      if (!client || !entry) return;
      if (draft === "" || !Number.isFinite(parseFloat(draft))) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      const amount = domain.paymentLocalToNumber(draft, Number.NaN);
      if (!Number.isFinite(amount)) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      setClientPaymentEntrySavingId(String(entry.id));
      try {
        if (
          String((entry && entry.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
          String((entry && entry.group_token) || "").trim()
        ) {
          if (amount < 0) {
            if (!(await saveNegativeClientBatchEntry(client, entry, amount))) return;
          } else {
            const plan = domain.getClientBatchEditPlan(client, entry, amount);
            const groupedEntries = ((entry && entry.grouped_entries) || []).reduce((map, item) => {
              const shoppingId = Number(item && item.shopping_id);
              return (
                Number.isFinite(shoppingId) &&
                  (map.has(shoppingId) || map.set(shoppingId, []), map.get(shoppingId).push(item)),
                map
              );
            }, new Map());
            for (const item of plan) {
              const shoppingId = Number(item && item.key);
              const desiredAmount = Math.max(domain.toNumber(item && item.desiredAmount, 0), 0);
              const entries = groupedEntries.get(shoppingId) || [];
              const firstEntry = entries[0] || null;
              const extraEntries = entries.slice(1);
              for (const extraEntry of extraEntries)
                await apiFetch(`/payments/${extraEntry.payment_id}/entries/${extraEntry.id}/`, {
                  method: "DELETE",
                });
              if (firstEntry) {
                if (desiredAmount > 0)
                  await apiFetch(`/payments/${firstEntry.payment_id}/entries/${firstEntry.id}/`, {
                    method: "PATCH",
                    body: JSON.stringify({
                      amount: desiredAmount.toFixed(2),
                    }),
                  });
                else
                  await apiFetch(`/payments/${firstEntry.payment_id}/entries/${firstEntry.id}/`, {
                    method: "DELETE",
                  });
              } else if (desiredAmount > 0) {
                const payment = domain.getClientShoppingPayments(client, shoppingId)[0] || null;
                const productIds = domain.getClientPaymentTargetProductIds(client, shoppingId);
                await apiFetch(payment ? `/payments/${payment.id}/` : "/payments/", {
                  method: payment ? "PATCH" : "POST",
                  body: JSON.stringify({
                    client: client.id,
                    shopping: shoppingId,
                    amount: (
                      (payment ? domain.getPaymentRecordAmount(payment) : 0) + desiredAmount
                    ).toFixed(2),
                    products: productIds,
                    entry_kind: "CLIENT_BATCH",
                    entry_group_token: entry.group_token,
                  }),
                });
              }
            }
          }
        } else {
          if (!entry.payment_id || !entry.id) {
            notifyError("No se pudo identificar el abono.");
            return;
          }
          await apiFetch(`/payments/${entry.payment_id}/entries/${entry.id}/`, {
            method: "PATCH",
            body: JSON.stringify({
              amount: amount.toFixed(2),
            }),
          });
        }
        setClientPaymentEntryEditingId(null);
        setClientPaymentEntryDraftAmount("");
        queuePaymentRefresh();
        notifySuccess("Abono actualizado.");
      } catch (error) {
        console.error("Failed updating client payment history row", error);
        notifyError((error && error.message) || "No se pudo actualizar el abono.");
      } finally {
        setClientPaymentEntrySavingId(null);
      }
    },
    [
      apiFetch,
      clientPaymentEntryDraftAmount,
      getDomain,
      notifyError,
      notifyInfo,
      notifySuccess,
      queuePaymentRefresh,
      saveNegativeClientBatchEntry,
    ],
  );

  const deleteClientPaymentHistoryRow = V.useCallback(
    async (entry) => {
      if (!entry) return;
      const isClientBatch =
        String((entry && entry.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
        String((entry && entry.group_token) || "").trim();
      if (
        !(await confirmAction({
          title: isClientBatch ? "Eliminar abono general" : "Eliminar abono",
          message: isClientBatch
            ? "Se eliminara este abono general y todas sus asignaciones por shopping."
            : "Se eliminara este abono del historial.",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      setClientPaymentEntrySavingId(String(entry.id));
      try {
        const entries = isClientBatch
          ? (entry.grouped_entries || []).map((item) => ({
              payment_id: item.payment_id,
              id: item.id,
            }))
          : [{ payment_id: entry.payment_id, id: entry.id }];
        for (const item of entries)
          item &&
            item.payment_id &&
            item.id &&
            (await apiFetch(`/payments/${item.payment_id}/entries/${item.id}/`, {
              method: "DELETE",
            }));
        String(clientPaymentEntryEditingId || "") === String(entry.id) &&
          (setClientPaymentEntryEditingId(null), setClientPaymentEntryDraftAmount(""));
        queuePaymentRefresh();
        notifySuccess("Abono eliminado.");
      } catch (error) {
        console.error("Failed deleting client payment history row", error);
        notifyError((error && error.message) || "No se pudo eliminar el abono.");
      } finally {
        setClientPaymentEntrySavingId(null);
      }
    },
    [
      apiFetch,
      clientPaymentEntryEditingId,
      confirmAction,
      notifyError,
      notifySuccess,
      queuePaymentRefresh,
    ],
  );

  const deletePayment = V.useCallback(
    async (payment) => {
      if (!payment || !payment.id) return;
      const confirmed = await confirmAction({
        title: "Eliminar pago",
        message: "Este pago se quitara del historial del cliente.",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        tone: "danger",
      });
      if (!confirmed) return;
      try {
        await apiFetch(`/payments/${payment.id}/`, { method: "DELETE" });
        queuePaymentRefresh();
        notifySuccess("Pago eliminado.");
      } catch (error) {
        console.error("Failed deleting payment", error);
        notifyError((error && error.message) || "No se pudo eliminar el pago.");
      }
    },
    [apiFetch, confirmAction, notifyError, notifySuccess, queuePaymentRefresh],
  );

  return {
    paymentModalOpen,
    setPaymentModalOpen,
    paymentSaving,
    paymentProductSearch,
    setPaymentProductSearch,
    paymentAmountManual,
    setPaymentAmountManual,
    paymentForm,
    setPaymentForm,
    paymentEntryEditingId,
    setPaymentEntryEditingId,
    paymentEntryDraftAmount,
    setPaymentEntryDraftAmount,
    paymentEntrySavingId,
    clientPaymentModalOpen,
    setClientPaymentModalOpen,
    clientPaymentSaving,
    clientPaymentAmountManual,
    setClientPaymentAmountManual,
    clientPaymentForm,
    setClientPaymentForm,
    clientPaymentEntryEditingId,
    clientPaymentEntryDraftAmount,
    setClientPaymentEntryDraftAmount,
    clientPaymentEntrySavingId,
    closePaymentModal,
    closeClientPaymentModal,
    openPaymentModal,
    openClientPaymentModal,
    togglePaymentProductSelection,
    startEditingPaymentEntry,
    cancelEditingPaymentEntry,
    savePaymentEntry,
    deletePaymentEntry,
    savePayment,
    saveClientPayment,
    startEditingClientPaymentEntry,
    cancelEditingClientPaymentEntry,
    saveClientPaymentHistoryRow,
    deleteClientPaymentHistoryRow,
    deletePayment,
  };
}
