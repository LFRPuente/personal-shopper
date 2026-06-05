import {
  V,
  normalizeClientCountryCode,
  normalizeClientPhoneDigits,
  normalizeClientShippingAddresses,
  slugifyRouteToken,
  buildAppPath,
} from "../utils.js";

const HOME_CLIENT_GALLERY_TAB_ORDER = ["REVIEW", "ANNOTATED", "REJECTED"];
const STANDARD_CLIENT_GALLERY_TAB_ORDER = ["ANNOTATED", "REVIEW", "REJECTED"];

export function useClientsDomain({
  apiFetch,
  clients,
  setClients,
  publicShareType,
  pendingHomeClientRouteRef,
  recentlyClosedHomeClientRouteRef,
  setFullscreenImage,
  setClosingOverlayKey,
  setProductGalleryTab,
  notifyInfo,
  notifySuccess,
  notifyError,
  confirmAction,
  copyTextToClipboard,
  setCopiedClientShareLinks,
}) {
  const [selectedClient, setSelectedClient] = V.useState(null);
  const [createClientOpen, setCreateClientOpen] = V.useState(!1);
  const [newClientName, setNewClientName] = V.useState("");
  const [newClientTags, setNewClientTags] = V.useState("");
  const [clientPhoneCountryCode, setClientPhoneCountryCode] = V.useState("+521");
  const [clientPhone, setClientPhone] = V.useState("");
  const [clientEmail, setClientEmail] = V.useState("");
  const [clientShippingAddress, setClientShippingAddress] = V.useState("");
  const [clientShippingAddresses, setClientShippingAddresses] = V.useState([]);
  const [editingClient, setEditingClient] = V.useState(null);
  const [editClientOpen, setEditClientOpen] = V.useState(!1);
  const [editClientForm, setEditClientForm] = V.useState({
    name: "",
    tags: "",
    status: "",
    phone_country_code: "+52",
    phone: "",
    email: "",
    shipping_address: "",
    shipping_addresses: [],
  });
  const [clientGalleryTabOrder, setClientGalleryTabOrder] = V.useState(
    HOME_CLIENT_GALLERY_TAB_ORDER,
  );
  const [clientGalleryMissionScopeId, setClientGalleryMissionScopeId] = V.useState(null);
  const [clientGalleryMissionScopeMeta, setClientGalleryMissionScopeMeta] = V.useState(null);
  const [clientGalleryAllowsShoppingChoice, setClientGalleryAllowsShoppingChoice] =
    V.useState(!1);
  const [clientDetailLoadingId, setClientDetailLoadingId] = V.useState(null);
  const clientDetailRequestRef = V.useRef(0);

  const clearPendingHomeClientRoute = V.useCallback(() => {
    pendingHomeClientRouteRef.current = null;
  }, [pendingHomeClientRouteRef]);

  const allowHomeClientRouteOpen = V.useCallback(() => {
    recentlyClosedHomeClientRouteRef.current = null;
  }, [recentlyClosedHomeClientRouteRef]);

  const mergeClientIntoList = V.useCallback(
    (client) => {
      if (!client || !client.id) return;
      setClients((items) =>
        (items || []).map((item) => (item.id === client.id ? client : item)),
      );
    },
    [setClients],
  );

  const hasClientDetail = V.useCallback(
    (client) => !!client && Array.isArray(client.receipts),
    [],
  );

  const hydrateClientDetail = V.useCallback(
    async (client, { force = !1, select = !0 } = {}) => {
      if (!client || !client.id) return null;
      if (select) setSelectedClient(client);
      if (!force && hasClientDetail(client)) return client;
      const requestId = clientDetailRequestRef.current + 1;
      clientDetailRequestRef.current = requestId;
      setClientDetailLoadingId(client.id);
      try {
        const detailedClient = await apiFetch(`/clients/${client.id}/`);
        mergeClientIntoList(detailedClient);
        if (select && clientDetailRequestRef.current === requestId) {
          setSelectedClient(detailedClient);
        }
        return detailedClient;
      } catch (error) {
        console.error("Failed hydrating client detail", error);
        notifyError("No se pudo cargar el detalle completo del cliente.");
        return null;
      } finally {
        if (clientDetailRequestRef.current === requestId) {
          setClientDetailLoadingId(null);
        }
      }
    },
    [apiFetch, hasClientDetail, mergeClientIntoList, notifyError],
  );

  const buildClientPayload = V.useCallback(
    ({
      name = "",
      status = "Pending",
      tags = "",
      phone_country_code = "+521",
      phone = "",
      email = "",
      shipping_address = "",
      shipping_addresses = [],
    }) => ({
      name: String(name || "").trim(),
      status,
      tags: String(tags || "").trim(),
      phone_country_code: normalizeClientCountryCode(phone_country_code),
      phone: normalizeClientPhoneDigits(phone),
      email: String(email || "").trim(),
      shipping_address: String(shipping_address || "").trim(),
      shipping_addresses: normalizeClientShippingAddresses(
        shipping_addresses,
        shipping_address,
      ),
    }),
    [],
  );

  const openCreateClientModal = V.useCallback(() => {
    setNewClientName("");
    setNewClientTags("");
    setClientPhoneCountryCode("+521");
    setClientPhone("");
    setClientEmail("");
    setClientShippingAddress("");
    setClientShippingAddresses([]);
    setCreateClientOpen(!0);
  }, []);

  const openEditClientModal = V.useCallback((client) => {
    if (!client) return;
    setEditingClient(client);
    setEditClientForm({
      name: client.name,
      tags: client.tags || "",
      status: client.status,
      phone_country_code: client.phone_country_code || "+52",
      phone: client.phone || "",
      email: client.email || "",
      shipping_address: client.shipping_address || "",
      shipping_addresses: Array.isArray(client.shipping_addresses)
        ? client.shipping_addresses
        : [],
    });
    setEditClientOpen(!0);
  }, []);

  const createClient = V.useCallback(
    async (event) => {
      event.preventDefault();
      if (!newClientName) return;
      try {
        const payload = buildClientPayload({
          name: newClientName,
          status: "Pending",
          tags: newClientTags,
          phone_country_code: clientPhoneCountryCode,
          phone: clientPhone,
          email: clientEmail,
          shipping_address: clientShippingAddress,
          shipping_addresses: clientShippingAddresses,
        });
        if (payload.phone && payload.phone.length !== 10) {
          notifyInfo("El telefono debe tener exactamente 10 numeros.");
          return;
        }
        const client = await apiFetch("/clients/", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setClients([...clients, client]);
        setNewClientName("");
        setNewClientTags("");
        setClientPhoneCountryCode("+521");
        setClientPhone("");
        setClientEmail("");
        setClientShippingAddress("");
        setClientShippingAddresses([]);
        setCreateClientOpen(!1);
      } catch (error) {
        notifyError((error && error.message) || "Error creating client");
      }
    },
    [
      apiFetch,
      buildClientPayload,
      clientEmail,
      clientPhone,
      clientPhoneCountryCode,
      clientShippingAddress,
      clientShippingAddresses,
      clients,
      newClientName,
      newClientTags,
      notifyError,
      notifyInfo,
      setClients,
    ],
  );

  const updateClient = V.useCallback(
    async (event) => {
      event.preventDefault();
      if (!editClientForm.name || !editingClient) return;
      try {
        const payload = buildClientPayload(editClientForm);
        if (payload.phone && payload.phone.length !== 10) {
          notifyInfo("El telefono debe tener exactamente 10 numeros.");
          return;
        }
        const client = await apiFetch(`/clients/${editingClient.id}/`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        mergeClientIntoList(client);
        setEditClientOpen(!1);
        setEditingClient(null);
      } catch (error) {
        notifyError((error && error.message) || "Error updating client");
      }
    },
    [
      apiFetch,
      buildClientPayload,
      editClientForm,
      editingClient,
      mergeClientIntoList,
      notifyError,
      notifyInfo,
    ],
  );

  const deleteClient = V.useCallback(
    async (clientId) => {
      if (
        !(await confirmAction({
          title: "Eliminar cliente",
          message: "Se eliminará el cliente y todos sus productos vinculados.",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      try {
        await apiFetch(`/clients/${clientId}/`, { method: "DELETE" });
        setClients(clients.filter((client) => client.id !== clientId));
        selectedClient && selectedClient.id === clientId && setSelectedClient(null);
      } catch {
        notifyError("Error deleting client");
      }
    },
    [apiFetch, clients, confirmAction, notifyError, selectedClient, setClients],
  );

  const toggleClientStatus = V.useCallback(
    async (client) => {
      const status =
        String(client.status || "").toLowerCase() === "active" ? "Pending" : "Active";
      try {
        const updatedClient = await apiFetch(`/clients/${client.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        mergeClientIntoList(updatedClient);
      } catch (error) {
        console.error(error);
      }
    },
    [apiFetch, mergeClientIntoList],
  );

  const refreshSelectedClient = V.useCallback(async () => {
    if (!selectedClient) return;
    try {
      const client = await apiFetch(`/clients/${selectedClient.id}/`);
      setSelectedClient(client);
      mergeClientIntoList(client);
    } catch {}
  }, [apiFetch, mergeClientIntoList, selectedClient]);

  const openClientFullGallery = V.useCallback(
    (client, missionScopeId = null) => {
      clearPendingHomeClientRoute();
      allowHomeClientRouteOpen();
      setClientGalleryMissionScopeId(missionScopeId);
      setClientGalleryMissionScopeMeta(null);
      setClientGalleryAllowsShoppingChoice(
        missionScopeId === null ||
          typeof missionScopeId === "undefined" ||
          String(missionScopeId).trim() === "",
      );
      setClientGalleryTabOrder(HOME_CLIENT_GALLERY_TAB_ORDER);
      hydrateClientDetail(client);
      setProductGalleryTab("REVIEW");
    },
    [allowHomeClientRouteOpen, clearPendingHomeClientRoute, hydrateClientDetail, setProductGalleryTab],
  );

  const openMissionClientView = V.useCallback(
    (client, missionScopeId = null) => {
      clearPendingHomeClientRoute();
      allowHomeClientRouteOpen();
      setClientGalleryMissionScopeId(missionScopeId);
      setClientGalleryMissionScopeMeta(null);
      setClientGalleryAllowsShoppingChoice(!1);
      setClientGalleryTabOrder(STANDARD_CLIENT_GALLERY_TAB_ORDER);
      hydrateClientDetail(client);
      setProductGalleryTab("ANNOTATED");
    },
    [allowHomeClientRouteOpen, clearPendingHomeClientRoute, hydrateClientDetail, setProductGalleryTab],
  );

  const openClientSectionGallery = V.useCallback(
    (client) => {
      clearPendingHomeClientRoute();
      allowHomeClientRouteOpen();
      setClientGalleryMissionScopeId(null);
      setClientGalleryMissionScopeMeta(null);
      setClientGalleryAllowsShoppingChoice(!0);
      setClientGalleryTabOrder(STANDARD_CLIENT_GALLERY_TAB_ORDER);
      hydrateClientDetail(client);
      setProductGalleryTab("ANNOTATED");
    },
    [allowHomeClientRouteOpen, clearPendingHomeClientRoute, hydrateClientDetail, setProductGalleryTab],
  );

  const openClientShoppingGallery = V.useCallback(
    (client, missionScope = null) => {
      clearPendingHomeClientRoute();
      allowHomeClientRouteOpen();
      const scopeId =
        missionScope && typeof missionScope === "object"
          ? Number(missionScope.id || missionScope.key || missionScope.shopping || missionScope.mission || 0)
          : Number(missionScope || 0);
      setClientGalleryMissionScopeId(scopeId || null);
      setClientGalleryMissionScopeMeta(
        missionScope && typeof missionScope === "object" ? missionScope : null,
      );
      setClientGalleryAllowsShoppingChoice(!1);
      setClientGalleryTabOrder(STANDARD_CLIENT_GALLERY_TAB_ORDER);
      hydrateClientDetail(client);
      setProductGalleryTab("ANNOTATED");
    },
    [allowHomeClientRouteOpen, clearPendingHomeClientRoute, hydrateClientDetail, setProductGalleryTab],
  );

  const closeSelectedClient = V.useCallback(() => {
    recentlyClosedHomeClientRouteRef.current = selectedClient
      ? slugifyRouteToken(selectedClient.name || selectedClient.username || selectedClient.id)
      : null;
    clientDetailRequestRef.current += 1;
    setClientDetailLoadingId(null);
    setSelectedClient(null);
    setFullscreenImage(null);
    setClientGalleryAllowsShoppingChoice(!1);
    setClientGalleryMissionScopeMeta(null);
    setClientGalleryMissionScopeId(null);
    setClientGalleryTabOrder(HOME_CLIENT_GALLERY_TAB_ORDER);
    setClosingOverlayKey("");
    clearPendingHomeClientRoute();
    if (
      typeof window !== "undefined" &&
      !publicShareType &&
      window.location.pathname !== "/home/"
    ) {
      window.history.replaceState({}, "", "/home/");
    }
  }, [
    clearPendingHomeClientRoute,
    publicShareType,
    recentlyClosedHomeClientRouteRef,
    selectedClient,
    setClosingOverlayKey,
    setFullscreenImage,
  ]);

  const generateClientHistoryShareLink = V.useCallback(
    async (client) => {
      if (!client) throw new Error("Cliente invalido.");
      const result = await apiFetch("/client-share-links/", {
        method: "POST",
        body: JSON.stringify({
          client: client.id,
        }),
      });
      if (!result || !result.share_url) throw new Error("No se pudo generar el enlace.");
      return result;
    },
    [apiFetch],
  );

  const copyClientMissionShareLink = V.useCallback(
    async (event, client) => {
      if (!client) return;
      try {
        const result = await generateClientHistoryShareLink(client);
        const copyMode = await copyTextToClipboard(
          result.share_url,
          "Copia el link del cliente:",
        );
        const key = `client-history-${client.id}`;
        if (copyMode !== "manual") {
          setCopiedClientShareLinks((items) =>
            items.includes(key) ? items : [...items, key],
          );
        }
        copyMode === "manual"
          ? notifyInfo("El navegador bloqueo la copia directa. Copia el link desde la ventana.")
          : notifySuccess("Link copiado.");
      } catch (error) {
        console.error("Failed to copy client shopping share link", error);
        notifyError((error && error.message) || "No se pudo generar el link del cliente.");
      }
    },
    [
      copyTextToClipboard,
      generateClientHistoryShareLink,
      notifyError,
      notifyInfo,
      notifySuccess,
      setCopiedClientShareLinks,
    ],
  );

  const copyClientShipmentHistoryLink = V.useCallback(
    async (shipment) => {
      if (!shipment || !shipment.id || !shipment.client) return;
      try {
        const result = await generateClientHistoryShareLink({ id: shipment.client });
        const url = new URL(result.share_url, window.location.origin);
        url.searchParams.set("focus_shipment_id", String(shipment.id));
        const copyMode = await copyTextToClipboard(
          url.toString(),
          "Copia el link del cliente:",
        );
        const key = `shipment-client-history-share-${shipment.id}`;
        if (copyMode !== "manual") {
          setCopiedClientShareLinks((items) =>
            items.includes(key) ? items : [...items, key],
          );
        }
        copyMode === "manual"
          ? notifyInfo("El navegador bloqueo la copia directa. Copia el link desde la ventana.")
          : notifySuccess("Link copiado.");
      } catch (error) {
        console.error("Failed to copy client shipment history link", error);
        notifyError((error && error.message) || "No se pudo generar el link del cliente.");
      }
    },
    [
      copyTextToClipboard,
      generateClientHistoryShareLink,
      notifyError,
      notifyInfo,
      notifySuccess,
      setCopiedClientShareLinks,
    ],
  );

  const selectedClientSlug = selectedClient
    ? slugifyRouteToken(selectedClient.name || selectedClient.username || selectedClient.id)
    : "";
  const selectedClientPath = selectedClient
    ? buildAppPath("HOME", { homeClientSlug: selectedClientSlug })
    : "";

  return {
    selectedClient,
    setSelectedClient,
    clientDetailLoadingId,
    hydrateClientDetail,
    createClientOpen,
    setCreateClientOpen,
    newClientName,
    setNewClientName,
    newClientTags,
    setNewClientTags,
    clientPhoneCountryCode,
    setClientPhoneCountryCode,
    clientPhone,
    setClientPhone,
    clientEmail,
    setClientEmail,
    clientShippingAddress,
    setClientShippingAddress,
    clientShippingAddresses,
    setClientShippingAddresses,
    editingClient,
    setEditingClient,
    editClientOpen,
    setEditClientOpen,
    editClientForm,
    setEditClientForm,
    clientGalleryTabOrder,
    setClientGalleryTabOrder,
    clientGalleryMissionScopeId,
    setClientGalleryMissionScopeId,
    clientGalleryMissionScopeMeta,
    setClientGalleryMissionScopeMeta,
    clientGalleryAllowsShoppingChoice,
    setClientGalleryAllowsShoppingChoice,
    buildClientPayload,
    openCreateClientModal,
    openEditClientModal,
    createClient,
    updateClient,
    deleteClient,
    toggleClientStatus,
    refreshSelectedClient,
    openClientFullGallery,
    openMissionClientView,
    openClientSectionGallery,
    openClientShoppingGallery,
    closeSelectedClient,
    generateClientHistoryShareLink,
    copyClientMissionShareLink,
    copyClientShipmentHistoryLink,
    selectedClientPath,
  };
}
