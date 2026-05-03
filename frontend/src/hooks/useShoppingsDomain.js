import { V, toFormUserId } from '../utils.js';

const OPEN_SHOPPING_STATUSES = new Set(["ACTIVE", "PAUSED"]);
const MAX_OPEN_SHOPPINGS = 3;

const toNumber = (value, fallback = 0) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getMissionStoreLabel = (mission) =>
  mission ? mission.store_name || mission.name || `Tienda #${mission.id}` : "";

export function useShoppingsDomain({
  accessToken,
  apiFetch,
  activeMissionIdRef,
  setClients,
  currentUser,
  stores,
  setStores,
  setStoreRecommendations,
  notifyInfo,
  notifySuccess,
  notifyError,
  confirmAction,
  openImageSourcePicker,
  refreshCoreDataRef,
  refreshSelectedClientRef,
  selectedClient,
  calcMode,
  calcFactor,
  calcTaxes,
  calcDiscount,
  calcCommission,
  calcExchangeRate,
  setCalcMode,
  setCalcFactor,
  setCalcTaxes,
  setCalcDiscount,
  setCalcCommission,
  setCalcExchangeRate,
}) {
  const [shoppings, setShoppings] = V.useState([]);
  const [activeShopping, setActiveShopping] = V.useState(null);
  const [expandedMissionId, setExpandedMissionId] = V.useState(null);
  const [editingMissionId, setEditingMissionId] = V.useState(null);
  const [editingMissionName, setEditingMissionName] = V.useState("");
  const [requests, setRequests] = V.useState([]);
  const [openHistoryMissionByClient, setOpenHistoryMissionByClient] = V.useState({});
  const [showMissionStartModal, setShowMissionStartModal] = V.useState(!1);
  const [missionStartForm, setMissionStartForm] = V.useState({
    name: "",
    store_name: "",
    payer: "",
    tax_percentage: "8",
    calc_mode: "FACTOR",
    factor_value: "1.5",
    commission_percentage: "10",
    exchange_rate: "17.5",
    discount_percentage: "0",
  });
  const [missionSummaryOpen, setMissionSummaryOpen] = V.useState(!1);
  const [missionSummaryStatusFilter, setMissionSummaryStatusFilter] = V.useState("ALL");
  const [missionSearch, setMissionSearch] = V.useState("");
  const [missionTicketUploading, setMissionTicketUploading] = V.useState(!1);
  const [shoppingClientAssignmentSavingId, setShoppingClientAssignmentSavingId] = V.useState(null);
  const requestsLoadedRef = V.useRef(!1);

  const getOpenShoppingMissions = V.useCallback(
    (list = shoppings) =>
      (Array.isArray(list) ? list : [])
        .filter((mission) =>
          OPEN_SHOPPING_STATUSES.has(
            String((mission && mission.status) || "").toUpperCase(),
          ),
        )
        .sort((a, b) => {
          const aTime = new Date((a && a.start_time) || 0).getTime();
          const bTime = new Date((b && b.start_time) || 0).getTime();
          if (aTime !== bTime) return bTime - aTime;
          return Number(b && b.id ? b.id : 0) - Number(a && a.id ? a.id : 0);
        }),
    [shoppings],
  );

  const resolveSelectedShopping = V.useCallback(
    (list = shoppings, preferredId = null) => {
      const openMissions = getOpenShoppingMissions(list);
      const selectedId =
        Number.isFinite(Number(preferredId)) && Number(preferredId) > 0
          ? Number(preferredId)
          : Number(activeShopping && activeShopping.id) ||
            Number((activeMissionIdRef && activeMissionIdRef.current) || 0) ||
            0;
      if (selectedId > 0) {
        const match = openMissions.find((mission) => Number(mission.id) === selectedId);
        if (match) return match;
      }
      return openMissions[0] || null;
    },
    [activeMissionIdRef, activeShopping, getOpenShoppingMissions, shoppings],
  );

  const findStoreByName = V.useCallback(
    (name) =>
      stores.find(
        (store) =>
          store.name.toLowerCase().trim() === String(name || "").toLowerCase().trim(),
      ) || null,
    [stores],
  );

  const loadRequestsData = V.useCallback(
    async (force = !1) => {
      if (!accessToken || (requestsLoadedRef.current && !force)) return [];
      try {
        const data = await apiFetch("/requests/");
        setRequests(data || []);
        requestsLoadedRef.current = !0;
        return data || [];
      } catch (error) {
        console.error("Failed loading requests", error);
        return [];
      }
    },
    [accessToken, apiFetch],
  );

  const getMissionRequestDetailPath = V.useCallback((id) => `/requests/${id}/`, []);

  const reloadMissionRequests = V.useCallback(async () => {
    const data = await apiFetch("/requests/");
    setRequests(data || []);
    return data || [];
  }, [apiFetch]);

  const resetShoppingsDomain = V.useCallback(() => {
    requestsLoadedRef.current = !1;
    setRequests([]);
  }, []);

  const openMissionStart = V.useCallback(() => {
    const parseSafe = (value, fallback = 0) => {
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : fallback;
    };
    const storeName = (activeShopping && getMissionStoreLabel(activeShopping)) || "";
    setMissionStartForm({
      name: storeName,
      store_name: storeName,
      payer: toFormUserId((activeShopping && activeShopping.payer) || (currentUser && currentUser.id)),
      tax_percentage: String(parseSafe(activeShopping && activeShopping.tax_percentage, calcTaxes)),
      calc_mode: String((activeShopping && activeShopping.calc_mode) || calcMode || "FACTOR").toUpperCase(),
      factor_value: String(parseSafe(activeShopping && activeShopping.factor_value, calcFactor)),
      commission_percentage: String(
        parseSafe(activeShopping && activeShopping.commission_percentage, calcCommission),
      ),
      exchange_rate: String(parseSafe(activeShopping && activeShopping.exchange_rate, calcExchangeRate)),
      discount_percentage: String(
        parseSafe(activeShopping && activeShopping.discount_percentage, calcDiscount),
      ),
    });
    setShowMissionStartModal(!0);
  }, [
    activeShopping,
    calcCommission,
    calcDiscount,
    calcExchangeRate,
    calcFactor,
    calcMode,
    calcTaxes,
    currentUser,
  ]);

  const createShopping = V.useCallback(
    async (form = missionStartForm) => {
      const openShoppingCount = getOpenShoppingMissions(shoppings).length;
      if (openShoppingCount >= MAX_OPEN_SHOPPINGS) {
        notifyInfo(
          `Ya hay ${MAX_OPEN_SHOPPINGS} shoppings activos/pausados. Cierra uno para crear otro.`,
        );
        return;
      }
      const storeName = String(form.store_name || form.name || "").trim();
      if (!storeName) {
        notifyInfo("Selecciona o escribe la tienda para iniciar el shopping.");
        return;
      }
      const payerId = parseInt(form.payer, 10);
      if (!Number.isInteger(payerId) || payerId <= 0) {
        notifyInfo("Selecciona quien pagara el shopping.");
        return;
      }
      const nextCalcMode =
        String(form.calc_mode || "FACTOR").toUpperCase() === "PERCENTAGE"
          ? "PERCENTAGE"
          : "FACTOR";
      try {
        let store = findStoreByName(storeName);
        if (!store) {
          store = await apiFetch("/stores/", {
            method: "POST",
            body: JSON.stringify({ name: storeName }),
          });
          setStores((items) =>
            [...items, store].sort((a, b) => a.name.localeCompare(b.name)),
          );
        }
        let createdShopping = null;
        try {
          createdShopping = await apiFetch("/shoppings/", {
            method: "POST",
            body: JSON.stringify({
              name: storeName,
              store: store && store.id ? store.id : null,
              payer: payerId,
              calc_mode: nextCalcMode,
              tax_percentage: toNumber(form.tax_percentage, 8).toFixed(2),
              factor_value: toNumber(form.factor_value, 1.5).toFixed(4),
              commission_percentage: toNumber(form.commission_percentage, 10).toFixed(2),
              exchange_rate: toNumber(form.exchange_rate, 17.5).toFixed(4),
              discount_percentage: toNumber(form.discount_percentage, 0).toFixed(2),
            }),
          });
        } catch {
          createdShopping = await apiFetch("/shoppings/", {
            method: "POST",
            body: JSON.stringify({
              name: storeName,
              store: store && store.id ? store.id : null,
              payer: payerId,
            }),
          });
        }
        const recommendations = await apiFetch("/store-recommendations/");
        setShowMissionStartModal(!1);
        setShoppings([...shoppings, createdShopping]);
        setActiveShopping(createdShopping);
        setStoreRecommendations(recommendations || []);
        setCalcMode(nextCalcMode);
        setCalcTaxes(toNumber(form.tax_percentage, 8));
        setCalcFactor(toNumber(form.factor_value, 1.5));
        setCalcCommission(toNumber(form.commission_percentage, 10));
        setCalcExchangeRate(toNumber(form.exchange_rate, 17.5));
        setCalcDiscount(toNumber(form.discount_percentage, 0));
      } catch (error) {
        console.error("Failed creating shopping", error);
        notifyError(`No se pudo iniciar la misión. ${error.message || ""}`.trim());
      }
    },
    [
      apiFetch,
      findStoreByName,
      getOpenShoppingMissions,
      missionStartForm,
      notifyError,
      notifyInfo,
      setCalcCommission,
      setCalcDiscount,
      setCalcExchangeRate,
      setCalcFactor,
      setCalcMode,
      setCalcTaxes,
      setStoreRecommendations,
      setStores,
      shoppings,
    ],
  );

  const pauseMission = V.useCallback(async () => {
    if (!activeShopping) return;
    try {
      const updated = await apiFetch(`/shoppings/${activeShopping.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "PAUSED" }),
      });
      setShoppings(shoppings.map((mission) => (mission.id === activeShopping.id ? updated : mission)));
      setActiveShopping(updated);
    } catch {}
  }, [activeShopping, apiFetch, shoppings]);

  const resumeMission = V.useCallback(async () => {
    if (!activeShopping) return;
    try {
      const updated = await apiFetch(`/shoppings/${activeShopping.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      });
      setShoppings(shoppings.map((mission) => (mission.id === activeShopping.id ? updated : mission)));
      setActiveShopping(updated);
    } catch {}
  }, [activeShopping, apiFetch, shoppings]);

  const toggleShoppingClientAssignment = V.useCallback(
    async (mission, client) => {
      const missionId = Number(mission && mission.id);
      const clientId = Number(client && client.id);
      if (!missionId || !clientId) return;
      const currentClientIds = Array.isArray(mission && mission.clients)
        ? mission.clients
            .map((value) => Number(value && typeof value === "object" ? value.id : value))
            .filter((value) => Number.isFinite(value) && value > 0)
        : [];
      const nextClientIds = currentClientIds.includes(clientId)
        ? currentClientIds.filter((value) => value !== clientId)
        : [...currentClientIds, clientId];
      setShoppingClientAssignmentSavingId(`${missionId}-${clientId}`);
      try {
        const updatedMission = await apiFetch(`/shoppings/${missionId}/`, {
          method: "PATCH",
          body: JSON.stringify({ clients: nextClientIds }),
        });
        setShoppings((items) => items.map((item) => (Number(item.id) === missionId ? updatedMission : item)));
        if (activeShopping && Number(activeShopping.id) === missionId) {
          setActiveShopping(updatedMission);
        }
      } catch (error) {
        console.error("Failed updating shopping client assignment", error);
        notifyError("No se pudo actualizar los clientes de este shopping.");
      } finally {
        setShoppingClientAssignmentSavingId(null);
      }
    },
    [activeShopping, apiFetch, notifyError],
  );

  const endMission = V.useCallback(async () => {
    if (!activeShopping) return;
    try {
      const updated = await apiFetch(`/shoppings/${activeShopping.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "COMPLETED" }),
      });
      const nextClients = await apiFetch("/clients/");
      const remainingOpenShoppings = getOpenShoppingMissions(
        shoppings.map((mission) => (mission.id === activeShopping.id ? updated : mission)),
      );
      setClients(nextClients || []);
      setShoppings(shoppings.map((mission) => (mission.id === activeShopping.id ? updated : mission)));
      setActiveShopping(remainingOpenShoppings[0] || null);
    } catch {}
  }, [activeShopping, apiFetch, getOpenShoppingMissions, setClients, shoppings]);

  const deleteMission = V.useCallback(
    async (id) => {
      if (
        !(await confirmAction({
          title: "Eliminar misión",
          message: "¿Eliminar esta misión y su historial?",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      try {
        await apiFetch(`/shoppings/${id}/`, { method: "DELETE" });
        const remainingMissions = shoppings.filter((mission) => mission.id !== id);
        const remainingOpenShoppings = getOpenShoppingMissions(remainingMissions);
        setShoppings(remainingMissions);
        activeShopping && activeShopping.id === id && setActiveShopping(remainingOpenShoppings[0] || null);
        expandedMissionId === id && setExpandedMissionId(null);
      } catch {
        notifyError("Error deleting shopping");
      }
    },
    [activeShopping, apiFetch, confirmAction, expandedMissionId, getOpenShoppingMissions, notifyError, shoppings],
  );

  const saveEditedMission = V.useCallback(
    async (id) => {
      if (!editingMissionName.trim()) return;
      try {
        const updated = await apiFetch(`/shoppings/${id}/`, {
          method: "PATCH",
          body: JSON.stringify({ name: editingMissionName }),
        });
        setShoppings(shoppings.map((mission) => (mission.id === id ? updated : mission)));
        activeShopping && activeShopping.id === id && setActiveShopping(updated);
        setEditingMissionId(null);
      } catch {
        notifyError("Error renaming shopping");
      }
    },
    [activeShopping, apiFetch, editingMissionName, notifyError, shoppings],
  );

  const uploadMissionTicket = V.useCallback(
    async (event, mission = null) => {
      const targetMission = mission && mission.id ? mission : activeShopping;
      if (!targetMission) return;
      const files = event.target.files;
      if (!files || files.length === 0) return;
      const formData = new FormData();
      formData.append("image", files[0]);
      setMissionTicketUploading(!0);
      try {
        await apiFetch(`/shoppings/${targetMission.id}/upload-ticket/`, {
          method: "POST",
          body: formData,
        });
        await refreshCoreDataRef.current();
        selectedClient && (await refreshSelectedClientRef.current());
        notifySuccess("Ticket de misión cargado y vinculado.");
      } catch (error) {
        console.error("Shopping ticket upload failed", error);
        notifyError("No se pudo subir el ticket de misión.");
      } finally {
        setMissionTicketUploading(!1);
        event.target.value = "";
      }
    },
    [activeShopping, apiFetch, notifyError, notifySuccess, refreshCoreDataRef, refreshSelectedClientRef, selectedClient],
  );

  const openMissionTicketPicker = V.useCallback(
    (mission = null) => {
      const targetMission = mission && mission.id ? mission : activeShopping;
      if (!targetMission || missionTicketUploading) return;
      openImageSourcePicker((event) => uploadMissionTicket(event, targetMission), {
        title: "Subir ticket de shopping",
        description: "Elige una imagen o PDF del ticket de shopping.",
        accept: "image/*,application/pdf",
        deviceDescription: "Abre tu galeria o archivos y selecciona una imagen o PDF.",
      });
    },
    [activeShopping, missionTicketUploading, openImageSourcePicker, uploadMissionTicket],
  );

  return {
    shoppings,
    setShoppings,
    activeShopping,
    setActiveShopping,
    expandedMissionId,
    setExpandedMissionId,
    editingMissionId,
    setEditingMissionId,
    editingMissionName,
    setEditingMissionName,
    requests,
    setRequests,
    openHistoryMissionByClient,
    setOpenHistoryMissionByClient,
    showMissionStartModal,
    setShowMissionStartModal,
    missionStartForm,
    setMissionStartForm,
    missionSummaryOpen,
    setMissionSummaryOpen,
    missionSummaryStatusFilter,
    setMissionSummaryStatusFilter,
    missionSearch,
    setMissionSearch,
    missionTicketUploading,
    shoppingClientAssignmentSavingId,
    loadRequestsData,
    getMissionRequestDetailPath,
    reloadMissionRequests,
    resetShoppingsDomain,
    getMissionStoreLabel,
    getOpenShoppingMissions,
    resolveSelectedShopping,
    openMissionStart,
    createShopping,
    pauseMission,
    resumeMission,
    toggleShoppingClientAssignment,
    endMission,
    deleteMission,
    saveEditedMission,
    openMissionTicketPicker,
    uploadMissionTicket,
  };
}
