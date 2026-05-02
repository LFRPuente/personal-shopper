import {
  V,
  MODULE_AMOUNT_FORMAT,
  normalizeShipmentStatusValue,
} from "../utils.js";

const EMPTY_SHIPMENT_FORM = {
  id: null,
  client: "",
  carrier: "",
  status: "PENDING",
  tracking_number: "",
  guide_price: "",
  client_price: "",
  includes_insurance: !1,
  insurance_price: "",
  insurance_sale_price: "",
  package_length: "",
  package_width: "",
  package_height: "",
  package_weight: "",
  shipping_address: "",
  product_ids: [],
  initial_product_ids: [],
};

export function useShipmentsDomain({
  accessToken,
  apiFetch,
  clients,
  shoppings,
  notifyInfo,
  notifySuccess,
  notifyError,
  confirmAction,
  openInputDialog,
  openImageSourcePicker,
  setPublicExpandedShipmentId,
  publicClientShareToken,
  reloadPublicShareData,
  queueCoreRefreshRef,
  queueSelectedClientRefreshRef,
  refreshCoreDataRef,
  refreshSelectedClientRef,
  currentTabRef,
  productStatusUpdatingId,
  setProductStatusUpdatingId,
}) {
  const [shipments, setShipments] = V.useState([]);
  const [shipmentSearch, setShipmentSearch] = V.useState("");
  const [shipmentEvidenceUploadingId, setShipmentEvidenceUploadingId] = V.useState(null);
  const [shipmentEvidenceDeletingId, setShipmentEvidenceDeletingId] = V.useState(null);
  const [shipmentEvidenceReplacingId, setShipmentEvidenceReplacingId] = V.useState(null);
  const [openShipmentEvidenceMenuId, setOpenShipmentEvidenceMenuId] = V.useState(null);
  const [shipmentDetailLoadingIds, setShipmentDetailLoadingIds] = V.useState([]);
  const [expandedShipmentIds, setExpandedShipmentIds] = V.useState([]);
  const [shipmentSaving, setShipmentSaving] = V.useState(!1);
  const [shipmentModalOpen, setShipmentModalOpen] = V.useState(!1);
  const [shipmentClientPickerOpen, setShipmentClientPickerOpen] = V.useState(!1);
  const [shipmentClientSearch, setShipmentClientSearch] = V.useState("");
  const [shipmentProductPickerOpen, setShipmentProductPickerOpen] = V.useState(!1);
  const [shipmentProductSearch, setShipmentProductSearch] = V.useState("");
  const [shipmentProductRenderLimit, setShipmentProductRenderLimit] = V.useState(24);
  const [shipmentForm, setShipmentForm] = V.useState(EMPTY_SHIPMENT_FORM);
  const shipmentsLoadedRef = V.useRef(!1);

  const queueCoreRefresh = V.useCallback(
    (delay) => queueCoreRefreshRef.current && queueCoreRefreshRef.current(delay),
    [queueCoreRefreshRef],
  );
  const queueSelectedClientRefresh = V.useCallback(
    (delay) =>
      queueSelectedClientRefreshRef.current &&
      queueSelectedClientRefreshRef.current(delay),
    [queueSelectedClientRefreshRef],
  );

  const getShipmentEvidenceKind = V.useCallback((item = null) => {
    const mediaType = String((item && item.media_type) || "").toUpperCase();
    if (mediaType === "VIDEO" || mediaType === "IMAGE") return mediaType;
    const file = String((item && item.file) || "").toLowerCase();
    return /\.(mp4|mov|m4v|webm|ogg)$/i.test(file) ? "VIDEO" : "IMAGE";
  }, []);

  const prepareShipmentEvidenceFile = V.useCallback(async (file) => {
    if (!file) return null;
    return String(file.type || "").toLowerCase().startsWith("image/")
      ? compressImage(file).catch(() => file)
      : file;
  }, []);

  const hasShipmentTrackingReady = V.useCallback(
    (shipment) =>
      !!String((shipment && shipment.carrier) || "").trim() &&
      !!String((shipment && shipment.tracking_number) || "").trim(),
    [],
  );

  const toNumber = V.useCallback((value, fallback = 0) => {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }, []);

  const formatAmount = V.useCallback(
    (value) => MODULE_AMOUNT_FORMAT.format(toNumber(value, 0)),
    [toNumber],
  );

  const getShipmentPurchasePriceAmount = V.useCallback(
    (shipment) => {
      const value =
        shipment &&
        shipment.guide_price !== null &&
        typeof shipment.guide_price !== "undefined" &&
        String(shipment.guide_price).trim() !== ""
          ? shipment.guide_price
          : shipment &&
              shipment.client_price !== null &&
              typeof shipment.client_price !== "undefined" &&
              String(shipment.client_price).trim() !== ""
            ? shipment.client_price
            : 0;
      return toNumber(value, 0);
    },
    [toNumber],
  );

  const getShipmentSalePriceAmount = V.useCallback(
    (shipment) => {
      const value =
        shipment &&
        shipment.client_price !== null &&
        typeof shipment.client_price !== "undefined" &&
        String(shipment.client_price).trim() !== ""
          ? shipment.client_price
          : shipment &&
              shipment.guide_price !== null &&
              typeof shipment.guide_price !== "undefined" &&
              String(shipment.guide_price).trim() !== ""
            ? shipment.guide_price
            : 0;
      return toNumber(value, 0);
    },
    [toNumber],
  );

  const getShipmentSalePriceSummary = V.useCallback(
    (shipment) => {
      const amount = getShipmentSalePriceAmount(shipment);
      return amount <= 0 ? "Costo de envio gratis" : `Costo: $${formatAmount(amount)}`;
    },
    [formatAmount, getShipmentSalePriceAmount],
  );

  const getPublicShipmentSalePriceSummary = V.useCallback(
    (shipment) => {
      if (!hasShipmentTrackingReady(shipment)) return "";
      return getShipmentSalePriceSummary(shipment);
    },
    [getShipmentSalePriceSummary, hasShipmentTrackingReady],
  );

  const shipmentHasHydratedDetail = V.useCallback(
    (shipment = null) =>
      !!(
        shipment &&
        Array.isArray(shipment.products_detail) &&
        Array.isArray(shipment.evidence) &&
        Array.isArray(shipment.client_shipping_addresses)
      ),
    [],
  );

  const upsertShipmentListItem = V.useCallback((shipment) => {
    if (!shipment || !shipment.id) return;
    setShipments((items) => {
      const list = Array.isArray(items) ? items : [];
      const index = list.findIndex((item) => Number(item.id) === Number(shipment.id));
      if (index === -1) return [shipment, ...list];
      const next = [...list];
      next[index] = { ...next[index], ...shipment };
      return next;
    });
  }, []);

  const mergeShipmentSummariesWithHydrated = V.useCallback(
    (current = [], incoming = []) => {
      const hydrated = new Map(
        (Array.isArray(current) ? current : [])
          .filter((item) => shipmentHasHydratedDetail(item))
          .map((item) => [Number(item.id), item]),
      );
      return (Array.isArray(incoming) ? incoming : []).map((item) => {
        const detail = hydrated.get(Number(item && item.id));
        if (!detail) return item;
        return {
          ...detail,
          ...item,
          products_detail: detail.products_detail,
          evidence: detail.evidence,
          client_shipping_addresses: detail.client_shipping_addresses,
        };
      });
    },
    [shipmentHasHydratedDetail],
  );

  const loadShipmentsData = V.useCallback(
    async (force = !1) => {
      if (!accessToken || (shipmentsLoadedRef.current && !force)) return [];
      try {
        const data = await apiFetch("/shipments/");
        setShipments((items) => mergeShipmentSummariesWithHydrated(items, data || []));
        shipmentsLoadedRef.current = !0;
        return data || [];
      } catch (error) {
        console.error("Failed loading shipments", error);
        return [];
      }
    },
    [accessToken, apiFetch, mergeShipmentSummariesWithHydrated],
  );

  const resetShipmentsDomain = V.useCallback(() => {
    shipmentsLoadedRef.current = !1;
    setShipments([]);
  }, []);

  const getShipmentClientProducts = V.useCallback(
    (clientId = null) => {
      const client = clients.find((item) => Number(item.id) === Number(clientId || 0));
      if (!client) return [];
      return ((client && client.products) || []).map((product) => ({
        ...product,
        client_name: client.name,
        shipping_address: product.shipping_address || client.shipping_address || "",
      }));
    },
    [clients],
  );

  const getShipmentProductPickerState = V.useCallback(
    (clientId = null, shipmentId = null, products = null) => {
      const source = Array.isArray(products) ? products : getShipmentClientProducts(clientId);
      const shoppingStatus = new Map(
        (shoppings || []).map((shopping) => [
          Number(shopping.id),
          String(shopping.status || "").toUpperCase(),
        ]),
      );
      const currentShipmentId = Number(shipmentId || 0);
      const hiddenSummary = {
        totalEligible: 0,
        totalHidden: 0,
        hiddenByStatus: 0,
        hiddenByOpenShopping: 0,
        hiddenByOtherShipment: 0,
      };
      const eligible = [];
      for (const product of source) {
        const status = String(product.status || "").toUpperCase();
        if (!["ANNOTATED", "BOUGHT", "SHIPPED"].includes(status)) {
          hiddenSummary.hiddenByStatus += 1;
          continue;
        }
        const shoppingId = Number(product.shopping || product.mission || product.mission_id || 0);
        if (shoppingId && shoppingStatus.get(shoppingId) !== "COMPLETED") {
          hiddenSummary.hiddenByOpenShopping += 1;
          continue;
        }
        const otherShipmentId = Number((((product || {}).shipment || {}).id) || 0);
        if (otherShipmentId && otherShipmentId !== currentShipmentId) {
          hiddenSummary.hiddenByOtherShipment += 1;
          continue;
        }
        eligible.push(product);
      }
      hiddenSummary.totalEligible = eligible.length;
      hiddenSummary.totalHidden =
        hiddenSummary.hiddenByStatus +
        hiddenSummary.hiddenByOpenShopping +
        hiddenSummary.hiddenByOtherShipment;
      return {
        products: eligible.sort((left, right) => {
          const missionCompare = String(
            left.shopping_name || left.mission_name || left.store_name || "",
          ).localeCompare(
            String(right.shopping_name || right.mission_name || right.store_name || ""),
          );
          if (missionCompare !== 0) return missionCompare;
          return String(left.name || "").localeCompare(String(right.name || ""));
        }),
        hiddenSummary,
      };
    },
    [getShipmentClientProducts, shoppings],
  );

  const formatShipmentHiddenProductsMessage = V.useCallback((summary = null) => {
    if (!summary || !summary.totalHidden) return "";
    const parts = [];
    summary.hiddenByOpenShopping &&
      parts.push(`${summary.hiddenByOpenShopping} por shopping abierta`);
    summary.hiddenByOtherShipment &&
      parts.push(`${summary.hiddenByOtherShipment} en otro envio`);
    summary.hiddenByStatus &&
      parts.push(`${summary.hiddenByStatus} por status no elegible`);
    return parts.length ? `Ocultos: ${parts.join(", ")}.` : "";
  }, []);

  const getClientShipmentAddressOptions = V.useCallback(
    (clientId = "") => {
      const client = clients.find((item) => String(item.id) === String(clientId || ""));
      if (!client) return [];
      const options = [];
      const seen = new Set();
      const add = (value) => {
        const address = String(value || "").trim();
        if (!address) return;
        const key = address.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        options.push(address);
      };
      add(client.shipping_address);
      (Array.isArray(client.shipping_addresses) ? client.shipping_addresses : []).forEach(add);
      return options;
    },
    [clients],
  );

  const getShipmentFormState = V.useCallback(
    (shipment = null, product = null) => {
      const clientId = String((product && product.client) || (shipment && shipment.client) || "");
      const products =
        (shipment && (shipment.products_detail || shipment.products)) ||
        (product && product.id ? [product] : []);
      const guidePrice =
        shipment && shipment.guide_price !== null && typeof shipment.guide_price !== "undefined"
          ? String(shipment.guide_price)
          : shipment && shipment.client_price !== null && typeof shipment.client_price !== "undefined"
            ? String(shipment.client_price)
            : "";
      const clientPrice =
        shipment && shipment.client_price !== null && typeof shipment.client_price !== "undefined"
          ? String(shipment.client_price)
          : shipment && shipment.guide_price !== null && typeof shipment.guide_price !== "undefined"
            ? String(shipment.guide_price)
            : "";
      return {
        id: (shipment && shipment.id) || null,
        client: clientId,
        carrier: String((shipment && shipment.carrier) || "").trim(),
        status: normalizeShipmentStatusValue((shipment && shipment.status) || "PENDING"),
        tracking_number: (shipment && shipment.tracking_number) || "",
        guide_price: guidePrice,
        client_price: clientPrice,
        includes_insurance: !!(shipment && shipment.includes_insurance),
        insurance_price:
          shipment &&
          shipment.insurance_price !== null &&
          typeof shipment.insurance_price !== "undefined"
            ? String(shipment.insurance_price)
            : "",
        insurance_sale_price:
          shipment &&
          shipment.insurance_sale_price !== null &&
          typeof shipment.insurance_sale_price !== "undefined"
            ? String(shipment.insurance_sale_price)
            : "",
        package_length:
          shipment &&
          shipment.package_length !== null &&
          typeof shipment.package_length !== "undefined"
            ? String(shipment.package_length)
            : "",
        package_width:
          shipment &&
          shipment.package_width !== null &&
          typeof shipment.package_width !== "undefined"
            ? String(shipment.package_width)
            : "",
        package_height:
          shipment &&
          shipment.package_height !== null &&
          typeof shipment.package_height !== "undefined"
            ? String(shipment.package_height)
            : "",
        package_weight:
          shipment &&
          shipment.package_weight !== null &&
          typeof shipment.package_weight !== "undefined"
            ? String(shipment.package_weight)
            : "",
        shipping_address:
          (shipment && shipment.shipping_address) ||
          getClientShipmentAddressOptions(clientId)[0] ||
          ((product && (product.shipping_address || "")) || ""),
        product_ids: products.map((item) => Number(typeof item === "object" ? item.id : item)),
        initial_product_ids: products.map((item) =>
          Number(typeof item === "object" ? item.id : item),
        ),
      };
    },
    [getClientShipmentAddressOptions],
  );

  const loadShipmentForm = V.useCallback(
    (shipment = null, product = null) => {
      setShipmentForm(getShipmentFormState(shipment, product));
      setShipmentClientPickerOpen(!1);
      setShipmentClientSearch("");
      setShipmentProductSearch("");
      setShipmentProductPickerOpen(!1);
    },
    [getShipmentFormState],
  );

  const fetchShipmentDetail = V.useCallback(
    async (shipment, options = {}) => {
      const id = Number((shipment && shipment.id) || shipment || 0);
      if (!Number.isFinite(id) || id <= 0) return null;
      const current =
        shipments.find((item) => Number(item && item.id) === id) ||
        (shipment && typeof shipment === "object" ? shipment : null);
      if (!options.force && shipmentHasHydratedDetail(current)) return current;
      setShipmentDetailLoadingIds((items) =>
        items.includes(id) ? items : [...items, id],
      );
      try {
        const data = await apiFetch(`/shipments/${id}/`);
        data && data.id && upsertShipmentListItem(data);
        return data || null;
      } catch (error) {
        console.error("Failed loading shipment detail", error);
        notifyError("No se pudo cargar el detalle del envio.");
        return null;
      } finally {
        setShipmentDetailLoadingIds((items) =>
          items.filter((item) => Number(item) !== id),
        );
      }
    },
    [apiFetch, notifyError, shipmentHasHydratedDetail, shipments, upsertShipmentListItem],
  );

  const isShipmentExpanded = V.useCallback(
    (shipment) =>
      (expandedShipmentIds || []).includes(Number((shipment && shipment.id) || shipment || 0)),
    [expandedShipmentIds],
  );

  const toggleExpandedShipment = V.useCallback(
    (shipment) => {
      if (!shipment) return;
      const id = Number(shipment.id);
      if (isShipmentExpanded(id)) {
        setExpandedShipmentIds((items) =>
          (items || []).filter((item) => Number(item) !== id),
        );
        return;
      }
      setExpandedShipmentIds((items) => [...new Set([...(items || []), id])]);
      if (shipmentHasHydratedDetail(shipment)) {
        loadShipmentForm(shipment);
        return;
      }
      setShipmentForm((form) => ({
        ...form,
        id,
        client: String((shipment && shipment.client) || ""),
        carrier: String((shipment && shipment.carrier) || "").trim(),
        status: normalizeShipmentStatusValue((shipment && shipment.status) || "PENDING"),
        tracking_number: (shipment && shipment.tracking_number) || "",
        guide_price:
          shipment && shipment.guide_price !== null && typeof shipment.guide_price !== "undefined"
            ? String(shipment.guide_price)
            : "",
        client_price:
          shipment &&
          shipment.client_price !== null &&
          typeof shipment.client_price !== "undefined"
            ? String(shipment.client_price)
            : "",
        includes_insurance: !!(shipment && shipment.includes_insurance),
        insurance_price:
          shipment &&
          shipment.insurance_price !== null &&
          typeof shipment.insurance_price !== "undefined"
            ? String(shipment.insurance_price)
            : "",
        insurance_sale_price:
          shipment &&
          shipment.insurance_sale_price !== null &&
          typeof shipment.insurance_sale_price !== "undefined"
            ? String(shipment.insurance_sale_price)
            : "",
        package_length:
          shipment &&
          shipment.package_length !== null &&
          typeof shipment.package_length !== "undefined"
            ? String(shipment.package_length)
            : "",
        package_width:
          shipment &&
          shipment.package_width !== null &&
          typeof shipment.package_width !== "undefined"
            ? String(shipment.package_width)
            : "",
        package_height:
          shipment &&
          shipment.package_height !== null &&
          typeof shipment.package_height !== "undefined"
            ? String(shipment.package_height)
            : "",
        package_weight:
          shipment &&
          shipment.package_weight !== null &&
          typeof shipment.package_weight !== "undefined"
            ? String(shipment.package_weight)
            : "",
        shipping_address: (shipment && shipment.shipping_address) || "",
        product_ids: [],
        initial_product_ids: [],
      }));
      fetchShipmentDetail(id).then((data) => {
        data && loadShipmentForm(data);
      });
    },
    [fetchShipmentDetail, isShipmentExpanded, loadShipmentForm, shipmentHasHydratedDetail],
  );

  const resetExpandedShipmentForm = V.useCallback(
    (shipment) => {
      if (!shipment) return;
      loadShipmentForm(shipment);
    },
    [loadShipmentForm],
  );

  const openShipmentEditor = V.useCallback(
    (shipment = null, product = null) => {
      if (!clients.length) {
        notifyInfo("Necesitas al menos un cliente para crear envios.");
        return;
      }
      loadShipmentForm(shipment, product);
      setShipmentModalOpen(!0);
    },
    [clients.length, loadShipmentForm, notifyInfo],
  );

  const updateShipmentForm = V.useCallback(
    (field, value) => {
      setShipmentForm((form) => {
        const next = { ...form, [field]: value };
        if (field === "client" && String(form.client || "") !== String(value || "")) {
          const addresses = getClientShipmentAddressOptions(value);
          next.product_ids = [];
          next.shipping_address = addresses[0] || "";
        }
        return next;
      });
    },
    [getClientShipmentAddressOptions],
  );

  const selectShipmentClient = V.useCallback(
    (clientId) => {
      updateShipmentForm("client", String(clientId || ""));
      setShipmentClientPickerOpen(!1);
      setShipmentClientSearch("");
    },
    [updateShipmentForm],
  );

  const toggleShipmentProductSelection = V.useCallback((product) => {
    if (!product) return;
    setShipmentForm((form) => {
      const productId = Number(product.id);
      const productIds = (form.product_ids || []).includes(productId)
        ? (form.product_ids || []).filter((item) => Number(item) !== productId)
        : [...(form.product_ids || []), productId];
      return { ...form, product_ids: productIds };
    });
  }, []);

  const saveShipmentEditor = V.useCallback(async () => {
    const client = clients.find(
      (item) => String(item.id) === String(shipmentForm.client || ""),
    );
    const carrier = String(shipmentForm.carrier || "").trim();
    const guidePrice =
      String(shipmentForm.guide_price || "").trim() === ""
        ? null
        : String(shipmentForm.guide_price || "").trim();
    const clientPrice =
      String(shipmentForm.client_price || "").trim() === ""
        ? null
        : String(shipmentForm.client_price || "").trim();
    const insurancePrice =
      String(shipmentForm.insurance_price || "").trim() === ""
        ? null
        : String(shipmentForm.insurance_price || "").trim();
    const insuranceSalePrice =
      String(shipmentForm.insurance_sale_price || "").trim() === ""
        ? null
        : String(shipmentForm.insurance_sale_price || "").trim();
    const packageLength =
      String(shipmentForm.package_length || "").trim() === ""
        ? null
        : String(shipmentForm.package_length || "").trim();
    const packageWidth =
      String(shipmentForm.package_width || "").trim() === ""
        ? null
        : String(shipmentForm.package_width || "").trim();
    const packageHeight =
      String(shipmentForm.package_height || "").trim() === ""
        ? null
        : String(shipmentForm.package_height || "").trim();
    const packageWeight =
      String(shipmentForm.package_weight || "").trim() === ""
        ? null
        : String(shipmentForm.package_weight || "").trim();
    if (!client) {
      notifyInfo("Selecciona un cliente.");
      return;
    }
    if (!(shipmentForm.product_ids || []).length) {
      notifyInfo("Selecciona al menos un producto.");
      return;
    }
    const pickerState = getShipmentProductPickerState(client.id, shipmentForm.id);
    const shipmentProductsById = new Map(
      pickerState.products.map((product) => [Number(product.id), product]),
    );
    const invalidShipmentSelection = (shipmentForm.product_ids || []).some(
      (productId) => !shipmentProductsById.has(Number(productId)),
    );
    if (invalidShipmentSelection) {
      notifyInfo(
        "Solo puedes enviar productos de shoppings cerradas y que no pertenezcan a otro envio. Quita los demas productos para guardar.",
      );
      return;
    }
    const sameShipmentProductSelection =
      [...(shipmentForm.product_ids || [])]
        .map((productId) => Number(productId))
        .sort((left, right) => left - right)
        .join(",") ===
      [...(shipmentForm.initial_product_ids || [])]
        .map((productId) => Number(productId))
        .sort((left, right) => left - right)
        .join(",");
    setShipmentSaving(!0);
    try {
      const shipment = await apiFetch(
        shipmentForm.id ? `/shipments/${shipmentForm.id}/` : "/shipments/",
        {
          method: shipmentForm.id ? "PATCH" : "POST",
          body: JSON.stringify({
            client: client.id,
            carrier,
            status: normalizeShipmentStatusValue(shipmentForm.status || "PENDING"),
            tracking_number: String(shipmentForm.tracking_number || "").trim(),
            guide_price: guidePrice,
            client_price: clientPrice,
            includes_insurance: !!shipmentForm.includes_insurance,
            insurance_price: insurancePrice,
            insurance_sale_price: insuranceSalePrice,
            package_length: packageLength,
            package_width: packageWidth,
            package_height: packageHeight,
            package_weight: packageWeight,
            shipping_address: String(shipmentForm.shipping_address || "").trim(),
          }),
        },
      );
      const withProducts = sameShipmentProductSelection
        ? shipment
        : await apiFetch(`/shipments/${shipment.id}/set-products/`, {
            method: "POST",
            body: JSON.stringify({
              products: (shipmentForm.product_ids || []).map((productId) =>
                Number(productId),
              ),
            }),
          });
      const updatedShipment = withProducts || shipment;
      setShipmentModalOpen(!1);
      setShipmentProductPickerOpen(!1);
      setPublicExpandedShipmentId(Number(shipment.id));
      setExpandedShipmentIds((items) => [
        ...new Set([...(items || []), Number(shipment.id)]),
      ]);
      upsertShipmentListItem(updatedShipment);
      setShipmentForm(getShipmentFormState(updatedShipment));
      notifySuccess(shipmentForm.id ? "Envio actualizado." : "Envio creado.");
      queueCoreRefresh(260);
      queueSelectedClientRefresh(320);
      publicClientShareToken &&
        reloadPublicShareData().catch((error) => {
          console.error("Failed refreshing public share after saving shipment", error);
        });
    } catch (error) {
      console.error("Failed saving shipment", error);
      notifyError((error && error.message) || "No se pudo guardar el envio.");
    } finally {
      setShipmentSaving(!1);
    }
  }, [
    apiFetch,
    clients,
    getShipmentFormState,
    getShipmentProductPickerState,
    notifyError,
    notifyInfo,
    notifySuccess,
    publicClientShareToken,
    queueCoreRefresh,
    queueSelectedClientRefresh,
    reloadPublicShareData,
    setPublicExpandedShipmentId,
    shipmentForm,
    upsertShipmentListItem,
  ]);

  const openShipmentAssignmentPicker = V.useCallback(
    async (product) => {
      if (!product) return;
      const candidates = shipments.filter(
        (shipment) =>
          Number(shipment.client) === Number(product.client) &&
          Number(shipment.id) !== Number(product.shipment && product.shipment.id),
      );
      if (!candidates.length) {
        openShipmentEditor(null, product);
        return;
      }
      const result = await openInputDialog({
        title: "Asignar envio",
        confirmLabel: "Continuar",
        cancelLabel: "Cancelar",
        fields: [
          {
            name: "shipment_id",
            label: "Envio",
            type: "select",
            value: "__new__",
            options: [
              { value: "__new__", label: "Crear envio nuevo" },
              ...candidates.map((shipment) => ({
                value: String(shipment.id),
                label: `${shipment.carrier || "Paqueteria"}${
                  shipment.tracking_number ? ` • ${shipment.tracking_number}` : ""
                }`,
              })),
            ],
          },
        ],
      });
      if (!result) return;
      if (result.shipment_id === "__new__") {
        openShipmentEditor(null, product);
        return;
      }
      try {
        const shipment = candidates.find(
          (item) => String(item.id) === String(result.shipment_id),
        );
        if (!shipment) throw new Error("Envio no encontrado.");
        await apiFetch(`/shipments/${shipment.id}/assign-product/`, {
          method: "POST",
          body: JSON.stringify({
            product: product.id,
          }),
        });
        queueCoreRefresh(120);
        queueSelectedClientRefresh(180);
        notifySuccess("Envio asignado.");
      } catch (error) {
        console.error("Failed assigning existing shipment", error);
        notifyError((error && error.message) || "No se pudo asignar el envio.");
      }
    },
    [
      apiFetch,
      notifyError,
      notifySuccess,
      openInputDialog,
      openShipmentEditor,
      queueCoreRefresh,
      queueSelectedClientRefresh,
      shipments,
    ],
  );

  const deleteShipment = V.useCallback(
    async (shipment) => {
      if (!shipment || !shipment.id) return;
      const confirmed = await confirmAction({
        title: "Eliminar envio",
        message: "Este envio se desvinculara del producto.",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        tone: "danger",
      });
      if (!confirmed) return;
      try {
        await apiFetch(`/shipments/${shipment.id}/`, { method: "DELETE" });
        setShipments((items) =>
          (items || []).filter((item) => Number(item.id) !== Number(shipment.id)),
        );
        setExpandedShipmentIds((items) =>
          (items || []).filter((item) => Number(item) !== Number(shipment.id)),
        );
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        notifySuccess("Envio eliminado.");
      } catch (error) {
        console.error("Failed deleting shipment", error);
        notifyError((error && error.message) || "No se pudo eliminar el envio.");
      }
    },
    [apiFetch, confirmAction, notifyError, notifySuccess, queueCoreRefresh, queueSelectedClientRefresh],
  );

  const openShipmentEvidencePicker = V.useCallback(
    (shipment) => {
      if (!shipment || !shipment.id) return;
      openImageSourcePicker(
        (event) => {
          const files = event && event.target && event.target.files;
          files && files.length > 0 && uploadShipmentEvidence(shipment, files);
        },
        {
          title: "Agregar evidencia",
          eyebrow: "Evidencia del envio",
          description:
            "Elige si quieres tomar la evidencia del dispositivo o pegar una imagen desde el portapapeles.",
          multiple: !0,
          accept: "image/*,video/*",
          deviceDescription:
            "Abre tu galeria o archivos y selecciona imagenes o videos para este envio.",
          clipboardLabel: "Pegar desde portapapeles",
          clipboardDescription:
            "Pega una imagen que ya copiaste para agregarla rapido a la evidencia del envio.",
        },
      );
    },
    [openImageSourcePicker],
  );

  const uploadShipmentEvidence = V.useCallback(
    async (shipment, files) => {
      if (!shipment || !shipment.id || !files || !files.length) return;
      setShipmentEvidenceUploadingId(shipment.id);
      setOpenShipmentEvidenceMenuId(null);
      try {
        const body = new FormData();
        for (const file of Array.from(files)) {
          const evidenceFile = await prepareShipmentEvidenceFile(file);
          evidenceFile && body.append("files", evidenceFile);
        }
        const result = await apiFetch(`/shipments/${shipment.id}/upload-evidence/`, {
          method: "POST",
          body,
        });
        result && result.shipment && upsertShipmentListItem(result.shipment);
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Evidencia agregada.");
      } catch (error) {
        console.error("Failed uploading shipment evidence", error);
        notifyError((error && error.message) || "No se pudo subir la evidencia.");
      } finally {
        setShipmentEvidenceUploadingId(null);
      }
    },
    [
      apiFetch,
      notifyError,
      notifySuccess,
      prepareShipmentEvidenceFile,
      publicClientShareToken,
      queueCoreRefresh,
      queueSelectedClientRefresh,
      reloadPublicShareData,
      upsertShipmentListItem,
    ],
  );

  const openShipmentEvidenceReplacePicker = V.useCallback(
    (shipment, evidence) => {
      if (!shipment || !shipment.id || !evidence || !evidence.id) return;
      setOpenShipmentEvidenceMenuId(null);
      openImageSourcePicker(
        (event) => {
          const files = event && event.target && event.target.files;
          files && files.length > 0 && replaceShipmentEvidence(shipment, evidence, files[0]);
        },
        {
          title: "Cambiar evidencia",
          eyebrow: "Evidencia del envio",
          description:
            "Elige si quieres reemplazar la evidencia desde el dispositivo o pegar una imagen desde el portapapeles.",
          multiple: !1,
          accept: "image/*,video/*",
          deviceDescription:
            "Abre tu galeria o archivos y selecciona una imagen o video nuevo para esta evidencia.",
          clipboardLabel: "Pegar desde portapapeles",
          clipboardDescription:
            "Pega una imagen copiada para reemplazar la evidencia actual.",
        },
      );
    },
    [openImageSourcePicker],
  );

  const replaceShipmentEvidence = V.useCallback(
    async (shipment, evidence, file) => {
      if (!shipment || !shipment.id || !evidence || !evidence.id || !file) return;
      setShipmentEvidenceReplacingId(evidence.id);
      try {
        const body = new FormData();
        const evidenceFile = await prepareShipmentEvidenceFile(file);
        if (!evidenceFile) {
          notifyError("No se pudo preparar el archivo de evidencia.");
          return;
        }
        body.append("file", evidenceFile);
        const result = await apiFetch(
          `/shipments/${shipment.id}/evidence/${evidence.id}/replace/`,
          {
            method: "POST",
            body,
          },
        );
        result && result.shipment && upsertShipmentListItem(result.shipment);
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Evidencia actualizada.");
      } catch (error) {
        console.error("Failed replacing shipment evidence", error);
        notifyError((error && error.message) || "No se pudo cambiar la evidencia.");
      } finally {
        setShipmentEvidenceReplacingId(null);
      }
    },
    [
      apiFetch,
      notifyError,
      notifySuccess,
      prepareShipmentEvidenceFile,
      publicClientShareToken,
      queueCoreRefresh,
      queueSelectedClientRefresh,
      reloadPublicShareData,
      upsertShipmentListItem,
    ],
  );

  const deleteShipmentEvidence = V.useCallback(
    async (shipment, evidenceId) => {
      if (!shipment || !shipment.id || !evidenceId) return;
      const confirmed = await confirmAction({
        title: "Eliminar evidencia",
        message: "Este archivo ya no se mostrara al cliente.",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        tone: "danger",
      });
      if (!confirmed) return;
      setOpenShipmentEvidenceMenuId(null);
      setShipmentEvidenceDeletingId(evidenceId);
      try {
        const result = await apiFetch(`/shipments/${shipment.id}/evidence/${evidenceId}/`, {
          method: "DELETE",
        });
        result && result.id && upsertShipmentListItem(result);
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Evidencia eliminada.");
      } catch (error) {
        console.error("Failed deleting shipment evidence", error);
        notifyError((error && error.message) || "No se pudo eliminar la evidencia.");
      } finally {
        setShipmentEvidenceDeletingId(null);
      }
    },
    [
      apiFetch,
      confirmAction,
      notifyError,
      notifySuccess,
      publicClientShareToken,
      queueCoreRefresh,
      queueSelectedClientRefresh,
      reloadPublicShareData,
      upsertShipmentListItem,
    ],
  );

  const setShipmentProductStatusQuick = V.useCallback(
    async (productId, status) => {
      if (!productId || !status || productStatusUpdatingId === productId) return;
      setProductStatusUpdatingId(productId);
      try {
        await apiFetch(`/products/${productId}/`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        refreshCoreDataRef.current && (await refreshCoreDataRef.current());
        refreshSelectedClientRef.current && (await refreshSelectedClientRef.current());
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Status del producto actualizado.");
      } catch (error) {
        console.error("Failed updating shipment product status", error);
        notifyError((error && error.message) || "No se pudo cambiar el status del producto.");
      } finally {
        setProductStatusUpdatingId(null);
      }
    },
    [
      apiFetch,
      notifyError,
      notifySuccess,
      productStatusUpdatingId,
      publicClientShareToken,
      refreshCoreDataRef,
      refreshSelectedClientRef,
      reloadPublicShareData,
      setProductStatusUpdatingId,
    ],
  );

  const shipmentModalClient = clients.find(
    (client) => String(client.id) === String(shipmentForm.client || ""),
  );

  const shipmentClientOptions = V.useMemo(
    () =>
      (clients || []).map((client) => ({
        id: client.id,
        name: client.name,
      })),
    [clients],
  );

  const filteredShipmentClients = V.useMemo(() => {
    const query = String(shipmentClientSearch || "").trim().toLowerCase();
    return shipmentClientOptions.filter((client) =>
      !query || String(client.name || "").toLowerCase().includes(query),
    );
  }, [shipmentClientOptions, shipmentClientSearch]);

  const shipmentModalClientProducts = V.useMemo(
    () => getShipmentClientProducts(shipmentForm.client),
    [getShipmentClientProducts, shipmentForm.client],
  );

  const shipmentModalProductState = V.useMemo(
    () =>
      shipmentProductPickerOpen
        ? getShipmentProductPickerState(
            shipmentForm.client,
            shipmentForm.id,
            shipmentModalClientProducts,
          )
        : {
            products: [],
            hiddenSummary: {
              totalEligible: 0,
              totalHidden: 0,
              hiddenByStatus: 0,
              hiddenByOpenShopping: 0,
              hiddenByOtherShipment: 0,
            },
          },
    [
      getShipmentProductPickerState,
      shipmentForm.client,
      shipmentForm.id,
      shipmentModalClientProducts,
      shipmentProductPickerOpen,
    ],
  );

  const shipmentModalProducts = shipmentModalProductState.products;

  const shipmentHiddenProductsMessage = V.useMemo(
    () => formatShipmentHiddenProductsMessage(shipmentModalProductState.hiddenSummary),
    [formatShipmentHiddenProductsMessage, shipmentModalProductState],
  );

  const shipmentModalFilteredProducts = V.useMemo(
    () =>
      shipmentModalProducts.filter((product) => {
        const query = String(shipmentProductSearch || "").trim().toLowerCase();
        if (!query) return !0;
        return [
          product.name,
          product.shopping_name || product.mission_name,
          product.store_name,
          product.client_name,
          product.status,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      }),
    [shipmentModalProducts, shipmentProductSearch],
  );

  const shipmentVisibleProductCards = V.useMemo(
    () => shipmentModalFilteredProducts.slice(0, shipmentProductRenderLimit),
    [shipmentModalFilteredProducts, shipmentProductRenderLimit],
  );

  const shipmentHasMoreProductCards =
    shipmentModalFilteredProducts.length > shipmentVisibleProductCards.length;

  const shipmentSelectedProducts = V.useMemo(() => {
    const productsById = new Map();
    shipmentModalClientProducts.forEach((product) => {
      productsById.set(Number(product.id), product);
    });
    const shipment = shipments.find(
      (item) => Number(item.id) === Number(shipmentForm.id || 0),
    );
    ((shipment && (shipment.products_detail || [])) || []).forEach((product) => {
      const productId = Number(product.id);
      productsById.has(productId) || productsById.set(productId, product);
    });
    return (shipmentForm.product_ids || [])
      .map((productId) => productsById.get(Number(productId)))
      .filter(Boolean);
  }, [
    shipmentForm.id,
    shipmentForm.product_ids,
    shipmentModalClientProducts,
    shipments,
  ]);

  V.useEffect(() => {
    if (openShipmentEvidenceMenuId === null) return undefined;
    const closeShipmentEvidenceMenuOnOutsideClick = (event) => {
      const target = event.target;
      if (
        target &&
        target.closest &&
        target.closest("[data-shipment-evidence-menu]")
      )
        return;
      setOpenShipmentEvidenceMenuId(null);
    };
    const closeShipmentEvidenceMenuOnEscape = (event) => {
      event.key === "Escape" && setOpenShipmentEvidenceMenuId(null);
    };
    document.addEventListener("click", closeShipmentEvidenceMenuOnOutsideClick);
    document.addEventListener("keydown", closeShipmentEvidenceMenuOnEscape);
    return () => {
      document.removeEventListener("click", closeShipmentEvidenceMenuOnOutsideClick);
      document.removeEventListener("keydown", closeShipmentEvidenceMenuOnEscape);
    };
  }, [openShipmentEvidenceMenuId]);

  V.useEffect(() => {
    if (!shipmentProductPickerOpen) return;
    setShipmentProductRenderLimit(24);
  }, [shipmentForm.client, shipmentProductPickerOpen, shipmentProductSearch]);

  return {
    shipments,
    setShipments,
    shipmentSearch,
    setShipmentSearch,
    shipmentEvidenceUploadingId,
    shipmentEvidenceDeletingId,
    shipmentEvidenceReplacingId,
    openShipmentEvidenceMenuId,
    setOpenShipmentEvidenceMenuId,
    shipmentDetailLoadingIds,
    expandedShipmentIds,
    setExpandedShipmentIds,
    shipmentSaving,
    shipmentModalOpen,
    setShipmentModalOpen,
    shipmentClientPickerOpen,
    setShipmentClientPickerOpen,
    shipmentClientSearch,
    setShipmentClientSearch,
    shipmentProductPickerOpen,
    setShipmentProductPickerOpen,
    shipmentProductSearch,
    setShipmentProductSearch,
    shipmentProductRenderLimit,
    setShipmentProductRenderLimit,
    shipmentForm,
    setShipmentForm,
    shipmentsLoadedRef,
    loadShipmentsData,
    resetShipmentsDomain,
    getShipmentEvidenceKind,
    prepareShipmentEvidenceFile,
    hasShipmentTrackingReady,
    getShipmentPurchasePriceAmount,
    getShipmentSalePriceAmount,
    getShipmentSalePriceSummary,
    getPublicShipmentSalePriceSummary,
    upsertShipmentListItem,
    shipmentHasHydratedDetail,
    mergeShipmentSummariesWithHydrated,
    fetchShipmentDetail,
    getShipmentClientProducts,
    getShipmentProductPickerState,
    formatShipmentHiddenProductsMessage,
    getClientShipmentAddressOptions,
    getShipmentFormState,
    loadShipmentForm,
    isShipmentExpanded,
    toggleExpandedShipment,
    resetExpandedShipmentForm,
    openShipmentEditor,
    updateShipmentForm,
    selectShipmentClient,
    toggleShipmentProductSelection,
    saveShipmentEditor,
    openShipmentAssignmentPicker,
    deleteShipment,
    openShipmentEvidencePicker,
    uploadShipmentEvidence,
    openShipmentEvidenceReplacePicker,
    replaceShipmentEvidence,
    deleteShipmentEvidence,
    setShipmentProductStatusQuick,
    shipmentModalClient,
    shipmentClientOptions,
    filteredShipmentClients,
    shipmentModalClientProducts,
    shipmentModalProductState,
    shipmentModalProducts,
    shipmentHiddenProductsMessage,
    shipmentModalFilteredProducts,
    shipmentVisibleProductCards,
    shipmentHasMoreProductCards,
    shipmentSelectedProducts,
  };
}

function compressImage(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type || !file.type.startsWith("image/")) {
      resolve(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Canvas to Blob failed"));
              return;
            }
            const newFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          file.type,
          quality,
        );
      };
      img.onerror = () => reject(new Error("Invalid image format"));
      img.src = event.target.result;
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}
