import * as React from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

const V = React;
const c = { jsx, jsxs, Fragment };

const getStoredNumber = (key, fallback) => {
  const raw = localStorage.getItem(key);
  const parsed = raw === null ? Number.NaN : parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const getStoredPercent = (key, fallbackPercent) => {
  const raw = localStorage.getItem(key);
  const parsed = raw === null ? Number.NaN : parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallbackPercent;
  // Backward compatibility: old values were stored as decimal ratios (e.g. 0.08).
  if (parsed > 0 && parsed <= 1) return parsed * 100;
  return parsed;
};

const DEFAULT_PRODUCT_FORM = {
  name: "",
  real_price: "",
  charged_price: "",
  tags: "",
  store: "",
  status: "ANNOTATED",
};

const createEmptyProductForm = (overrides = {}) => ({
  ...DEFAULT_PRODUCT_FORM,
  ...overrides,
});

const getDraftProductFlowState = (galleryState, role) =>
  galleryState === "REVIEW" || galleryState === "REJECTED" || galleryState === "ANNOTATED"
    ? galleryState
    : role === "AV"
      ? "REVIEW"
      : "ANNOTATED";

const normalizeProductModalStatus = (statusValue) => {
  const normalized = String(statusValue || "").trim().toUpperCase();
  if (!normalized) return "ANNOTATED";
  return normalized === "REVIEW" || normalized === "PS_REVIEW" || normalized === "AV_REVIEW"
    ? "IN_REVIEW"
    : normalized;
};

// <-------- seccion 8: API base configurable por entorno (evita URLs de tunnel vencidas)
const ENV_API_URL = (import.meta.env.VITE_API_URL || "").trim();
const Zs = ENV_API_URL
  ? ENV_API_URL.replace(/\/$/, "")
  : window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000/api"
    : `${window.location.origin}/api`;
// <-------- seccion 8: URL websocket derivada del backend API
const WS_UPDATES_URL = `${Zs.replace("https://", "wss://").replace("http://", "ws://").replace(/\/api$/, "")}/ws/updates/`;
// <-------- seccion 8: normaliza URLs de media para localhost/tunnel/https
const BACKEND_ORIGIN = Zs.replace(/\/api$/, "");
const isLocalHostName = (o) => o === "localhost" || o === "127.0.0.1";
const resolveMediaUrl = (o) => {
  if (!o || typeof o !== "string") return o;
  const N = o.trim();
  if (!N) return N;
  if (N.startsWith("blob:") || N.startsWith("data:")) return N;
  if (N.startsWith("//")) return `${window.location.protocol}${N}`;
  if (N.startsWith("/")) return `${BACKEND_ORIGIN}${N}`;
  if (N.startsWith("media/")) return `${BACKEND_ORIGIN}/${N}`;
  if (!/^https?:\/\//i.test(N)) return N;
  try {
    const A = new URL(N),
      vl = new URL(BACKEND_ORIGIN);
    if (!isLocalHostName(window.location.hostname)) {
      if (isLocalHostName(A.hostname)) {
        return `${BACKEND_ORIGIN}${A.pathname}${A.search}${A.hash}`;
      }
      if (window.location.protocol === "https:" && A.protocol === "http:") {
        A.protocol = "https:";
        return A.toString();
      }
    }
    return N;
  } catch {
    return N;
  }
};
const getShipmentStatusLabel = (o) => {
  const N = String(o || "").toUpperCase();
  return N === "PREPARING"
    ? "Preparando"
    : N === "SHIPPED"
      ? "Enviado"
      : N === "DELIVERED"
        ? "Entregado"
        : N === "CANCELLED"
          ? "Cancelado"
          : "Pendiente";
};
const getShipmentTrackingUrl = (carrier, trackingNumber) => {
  const o = String(trackingNumber || "").trim();
  const N = String(carrier || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!o || !N) return "";
  if (N.includes("estafeta")) {
    return `https://cs.estafeta.com/es/Tracking/searchByGet?wayBillType=0&wayBill=${encodeURIComponent(o)}`;
  }
  if (N.includes("dhl")) {
    return `https://www.dhl.com/mx-es/home/rastreo.html?tracking-id=${encodeURIComponent(o)}&submit=1`;
  }
  return "";
};
const getPublicShareInfoFromPath = () => {
  const o = window.location.pathname.match(/^\/share\/(client|shipment)\/([^/]+)\/?$/i);
  return o
    ? { type: String(o[1] || "").toLowerCase(), token: decodeURIComponent(o[2]) }
    : { type: "", token: "" };
};
function nh() {
  const publicShareInfo = V.useMemo(() => getPublicShareInfoFromPath(), []),
    publicClientShareToken = publicShareInfo.token,
    publicShareType = publicShareInfo.type,
    DEFAULT_BREAKDOWN_TEMPLATE =
      "DESGLOSE DE TU CUENTA:\n\n{items}\n\nTOTAL TIENDA: ${total}\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗\n\nTe lo puedo asegurar por 10 minutos en lo que haces transferencia.💕",
    [C, jl] = V.useState(localStorage.getItem("access_token") || null),
    [J, b] = V.useState(null),
    [Q, al] = V.useState("LOGIN"),
    [cl, Ql] = V.useState({ username: "", password: "", role: "AV" }),
    [U, T] = V.useState(""),
    [X, H] = V.useState("AV"),
    [layoutMode, setLayoutMode] = V.useState("MOBILE"),
    [isWideViewport, setIsWideViewport] = V.useState(() =>
      typeof window !== "undefined" ? window.innerWidth >= 1024 : !1,
    ),
    [nl, Ll] = V.useState("HOME"),
    [sectionTransitionStage, setSectionTransitionStage] = V.useState("idle"),
    [Al, zl] = V.useState([]),
    [w, Dl] = V.useState(null),
    [Kl, _l] = V.useState([]),
    [W, et] = V.useState(null),
    [Il, k] = V.useState(!1),
    [Pl, at] = V.useState(!1),
    [me, ut] = V.useState(!1),
    [Vl, Yt] = V.useState(""),
    [Nt, it] = V.useState(""),
    [p, z] = V.useState(""),
    [q, sl] = V.useState(""),
    [rl, d] = V.useState(""),
    [j, _] = V.useState(""),
    [O, Y] = V.useState(null),
    [K, tl] = V.useState(!1),
    [ml, hl] = V.useState({
      name: "",
      tags: "",
      status: "",
      phone: "",
      email: "",
      shipping_address: "",
    }),
    [kt, Kt] = V.useState(null),
    [va, we] = V.useState(null),
    [ct, ke] = V.useState([]),
    [he, Ke] = V.useState(null),
    [st, Gt] = V.useState(() => createEmptyProductForm()),
    [productModalMode, setProductModalMode] = V.useState("edit"),
    [pendingProductFile, setPendingProductFile] = V.useState(null),
    [productFinalPriceManual, setProductFinalPriceManual] = V.useState(!1),
    [closingOverlayKey, setClosingOverlayKey] = V.useState(""),
    [Je, We] = V.useState(null),
    [ji, sn] = V.useState(!1),
    [Ol, $e] = V.useState({
      total_real_price: "",
      total_charged_price: "",
      tax_percentage: "8.00",
      shipping_paid: !1,
    }),
    [fn, rn] = V.useState(null),
    [pa, dn] = V.useState(null),
    [Sa, uu] = V.useState(""),
    [Ei, ge] = V.useState(null),
    [wl, jt] = V.useState("REVIEW"),
    [clientGalleryMissionScopeId, setClientGalleryMissionScopeId] = V.useState(
      null,
    ),
    [calcMode, setCalcMode] = V.useState(
      localStorage.getItem("calc_mode") || "FACTOR",
    ),
    [calcFactor, setCalcFactor] = V.useState(() =>
      getStoredNumber("calc_factor", 1.5),
    ),
    [calcPrice, setCalcPrice] = V.useState(""),
    [calcTaxes, setCalcTaxes] = V.useState(() =>
      getStoredPercent("calc_taxes", 8),
    ),
    [calcDiscount, setCalcDiscount] = V.useState(() =>
      getStoredPercent("calc_discount", 0),
    ),
    [calcCommission, setCalcCommission] = V.useState(() =>
      getStoredPercent("calc_commission", 10),
    ),
    [calcExchangeRate, setCalcExchangeRate] = V.useState(() =>
      getStoredNumber("calc_exchange_rate", 17.5),
    ),
    [defaultBreakdownTemplate, setDefaultBreakdownTemplate] = V.useState(
      localStorage.getItem("default_breakdown_template") ||
        DEFAULT_BREAKDOWN_TEMPLATE,
    ),
    [calcCopied, setCalcCopied] = V.useState(!1),
    [fullscreenImage, setFullscreenImage] = V.useState(null),
    [stores, setStores] = V.useState([]),
    [storeRecommendations, setStoreRecommendations] = V.useState([]),
    [shippingCarrierRecommendations, setShippingCarrierRecommendations] = V.useState([]),
    [storeSearch, setStoreSearch] = V.useState(""),
    [showAddStoreInput, setShowAddStoreInput] = V.useState(!1),
    [newStoreName, setNewStoreName] = V.useState(""),
    [modalTags, setModalTags] = V.useState([]),
    [newModalTag, setNewModalTag] = V.useState(""),
    [copiedImageItemId, setCopiedImageItemId] = V.useState(null),
    [copiedMissionClients, setCopiedMissionClients] = V.useState([]),
    [copiedClientShareLinks, setCopiedClientShareLinks] = V.useState([]),
    [publicClientShareData, setPublicClientShareData] = V.useState(null),
    [publicClientShareLoading, setPublicClientShareLoading] = V.useState(
      !!publicClientShareToken,
    ),
    [publicClientShareError, setPublicClientShareError] = V.useState(""),
    [publicExpandedShipmentId, setPublicExpandedShipmentId] = V.useState(null),
    [requests, setRequests] = V.useState([]),
    [shipments, setShipments] = V.useState([]),
    [shipmentSearch, setShipmentSearch] = V.useState(""),
    [expandedShipmentId, setExpandedShipmentId] = V.useState(null),
    [shipmentModalOpen, setShipmentModalOpen] = V.useState(!1),
    [shipmentProductPickerOpen, setShipmentProductPickerOpen] = V.useState(!1),
    [shipmentProductSearch, setShipmentProductSearch] = V.useState(""),
    [shipmentForm, setShipmentForm] = V.useState({
      id: null,
      client: "",
      carrier: "",
      tracking_number: "",
      guide_price: "",
      client_price: "",
      shipping_address: "",
      product_ids: [],
    }),
    [paymentModalOpen, setPaymentModalOpen] = V.useState(!1),
    [paymentSaving, setPaymentSaving] = V.useState(!1),
    [paymentProductSearch, setPaymentProductSearch] = V.useState(""),
    [paymentAmountManual, setPaymentAmountManual] = V.useState(!1),
    [paymentForm, setPaymentForm] = V.useState({
      id: null,
      client: "",
      shopping: "",
      amount: "",
      note: "",
      product_ids: [],
    }),
    [newRequestText, setNewRequestText] = V.useState(""),
    [newRequestClientId, setNewRequestClientId] = V.useState(""),
    [newRequestClientPickerOpen, setNewRequestClientPickerOpen] = V.useState(!1),
    [newRequestClientSearch, setNewRequestClientSearch] = V.useState(""),
    [newRequestImageFile, setNewRequestImageFile] = V.useState(null),
    [newRequestImagePreview, setNewRequestImagePreview] = V.useState(""),
    [editingRequestId, setEditingRequestId] = V.useState(null),
    [editingRequestText, setEditingRequestText] = V.useState(""),
    [editingRequestClientId, setEditingRequestClientId] = V.useState(""),
    [editingRequestClientPickerOpen, setEditingRequestClientPickerOpen] = V.useState(!1),
    [editingRequestClientSearch, setEditingRequestClientSearch] = V.useState(""),
    [editingRequestImageFile, setEditingRequestImageFile] = V.useState(null),
    [editingRequestImagePreview, setEditingRequestImagePreview] = V.useState(""),
    [editingRequestSaving, setEditingRequestSaving] = V.useState(!1),
    [toasts, setToasts] = V.useState([]),
    [confirmDialog, setConfirmDialog] = V.useState(null),
    [inputDialog, setInputDialog] = V.useState(null),
    [openProductMenuId, setOpenProductMenuId] = V.useState(null),
    [openProductInfoId, setOpenProductInfoId] = V.useState(null),
    [reviewConversationEntry, setReviewConversationEntry] = V.useState(null),
    [openHistoryMissionByClient, setOpenHistoryMissionByClient] = V.useState({}),
    [showMissionStartModal, setShowMissionStartModal] = V.useState(!1),
    [missionStartForm, setMissionStartForm] = V.useState({
      name: "",
      store_name: "",
      tax_percentage: "8",
      calc_mode: "FACTOR",
      factor_value: "1.5",
      commission_percentage: "10",
      exchange_rate: "17.5",
      discount_percentage: "0",
    }),
    [missionSummaryOpen, setMissionSummaryOpen] = V.useState(!1),
    [missionSummaryStatusFilter, setMissionSummaryStatusFilter] = V.useState("ALL"),
    [homeClientSearch, setHomeClientSearch] = V.useState(""),
    [missionSearch, setMissionSearch] = V.useState(""),
    [homeUnreadSummary, setHomeUnreadSummary] = V.useState({}),
    [seenReviewItemMap, setSeenReviewItemMap] = V.useState({}),
    [homeNeedsAttention, setHomeNeedsAttention] = V.useState(!1),
    [missionTicketUploading, setMissionTicketUploading] = V.useState(!1),
    [receiptUploading, setReceiptUploading] = V.useState(!1),
    [newProductUploading, setNewProductUploading] = V.useState(!1),
    [productImageUploadingId, setProductImageUploadingId] = V.useState(null),
    // <-------- seccion 7: estado local para revisiones AV <-> PS
    [productReviews, setProductReviews] = V.useState([]),
    [missionReviewAlerts, setMissionReviewAlerts] = V.useState([]),
    [altUploadReviewId, setAltUploadReviewId] = V.useState(null),
    [altUploadProductId, setAltUploadProductId] = V.useState(null),
    [altUploadTargetStatus, setAltUploadTargetStatus] = V.useState(""),
    [altUploadDescription, setAltUploadDescription] = V.useState(""),
    [altUploadFiles, setAltUploadFiles] = V.useState([]),
    // <-------- seccion 8: refs para websocket y reconexion
    wsRef = V.useRef(null),
    wsReconnectTimerRef = V.useRef(null),
    wsStoppedRef = V.useRef(!1),
    altUploadFileInputRef = V.useRef(null),
    reviewConversationScrollRef = V.useRef(null),
    reviewConversationStateRef = V.useRef(""),
    currentTabRef = V.useRef("HOME"),
    selectedClientIdRef = V.useRef(null),
    activeMissionIdRef = V.useRef(null),
    toastTimeoutsRef = V.useRef(new Map()),
    toastIdRef = V.useRef(0),
    I = async (o, N = {}) => {
      const A = { "Content-Type": "application/json" };
      (C && (A.Authorization = `Bearer ${C}`),
        N.body instanceof FormData && delete A["Content-Type"]);
      const vl = await fetch(`${Zs}${o}`, { ...N, headers: A });
      if (vl.status === 204) return null;
      let El = null;
      const Se = vl.headers.get("content-type") || "";
      if (Se.includes("application/json")) {
        try {
          El = await vl.json();
        } catch {
          El = null;
        }
      } else {
        const ea = await vl.text();
        El = ea ? { detail: ea } : null;
      }
      if (vl.status === 401) {
        iu();
        throw new Error((El && (El.detail || El.message)) || "Unauthorized");
      }
      if (!vl.ok) {
        const ea = new Error(
          (El && (El.detail || El.message)) || `HTTP ${vl.status}`,
        );
        (ea.status = vl.status, ea.payload = El);
        throw ea;
      }
      return El;
    },
    publicApiFetch = async (o, N = {}) => {
      const A = { "Content-Type": "application/json" };
      N.body instanceof FormData && delete A["Content-Type"];
      const vl = await fetch(`${Zs}${o}`, { ...N, headers: A });
      if (vl.status === 204) return null;
      let El = null;
      const Se = vl.headers.get("content-type") || "";
      if (Se.includes("application/json")) {
        try {
          El = await vl.json();
        } catch {
          El = null;
        }
      } else {
        const ea = await vl.text();
        El = ea ? { detail: ea } : null;
      }
      if (!vl.ok) {
        const ea = new Error(
          (El && (El.detail || El.message)) || `HTTP ${vl.status}`,
        );
        (ea.status = vl.status, ea.payload = El);
        throw ea;
      }
      return El;
    },
    Ti = async () => {
      try {
        const o = await I("/auth/me/");
        (b(o),
          o.profile.role === "BOTH" ? H("PS") : H(o.profile.role),
          setLayoutMode(
            o.profile.layout_mode === "WEB" ? "WEB" : "MOBILE",
          ));
        const [N, A, yl, qs] = await Promise.all([
          I("/clients/"),
          I("/shoppings/"),
          I("/shipments/"),
          I("/shipping-carrier-recommendations/"),
        ]);
        _l(N || []);
        zl(A || []);
        setShipments(yl || []);
        setShippingCarrierRecommendations(qs || []);
        const vl = A.find(
          (El) => El.status === "ACTIVE" || El.status === "PAUSED",
        );
        const [El, Se] = await Promise.all([
          I("/stores/"),
          I("/store-recommendations/"),
        ]);
        setStores(El || []);
        setStoreRecommendations(Se || []);
        Dl(vl || null);
        if (vl && vl.id) {
          const ea = await I(`/reviews/unread-summary/?shopping=${vl.id}`);
          setHomeUnreadSummary(ea || {});
        } else setHomeUnreadSummary({});
      } catch (o) {
        console.error("Failed loading data", o);
      }
    },
    // <-------- seccion 8: refresh de clientes + misiones para eventos websocket
    refreshCoreData = async () => {
      try {
        const [N, A, vl, yl, qs] = await Promise.all([
          I("/clients/"),
          I("/shoppings/"),
          I("/store-recommendations/"),
          I("/shipments/"),
          I("/shipping-carrier-recommendations/"),
        ]);
        _l(N || []);
        zl(A || []);
        setStoreRecommendations(vl || []);
        setShipments(yl || []);
        setShippingCarrierRecommendations(qs || []);
        const El = (A || []).find(
          (Se) => Se.status === "ACTIVE" || Se.status === "PAUSED",
        );
        Dl(El || null);
        if (El && El.id) {
          const Se = await I(`/reviews/unread-summary/?shopping=${El.id}`);
          setHomeUnreadSummary(Se || {});
        } else setHomeUnreadSummary({});
      } catch {}
    },
    refreshSelectedClient = async () => {
      const o = selectedClientIdRef.current;
      if (!o) return;
      try {
        const N = await I(`/clients/${o}/`);
        (et(N), _l((A) => A.map((vl) => (vl.id === N.id ? N : vl))));
      } catch (N) {
        console.error("Failed refreshing selected client", N);
      }
    },
    // <-------- seccion 8: helper de recarga y update robusto para peticiones
    getMissionRequestDetailPath = (o) => `/requests/${o}/`,
    reloadMissionRequests = async () => {
      const N = await I("/requests/");
      return (setRequests(N || []), N || []);
    };
  const dismissToast = (o) => {
      const N = toastTimeoutsRef.current.get(o);
      N && clearTimeout(N);
      toastTimeoutsRef.current.delete(o);
      setToasts((A) => A.filter((vl) => vl.id !== o));
    },
    pushToast = (o, N = "info") => {
      const A = String(o || "").trim();
      if (!A) return;
      const vl = `${Date.now()}-${toastIdRef.current++}`;
      setToasts((El) => [...El, { id: vl, message: A, tone: N }].slice(-4));
      const El = window.setTimeout(() => dismissToast(vl), 3200);
      toastTimeoutsRef.current.set(vl, El);
    },
    notifySuccess = (o) => pushToast(o, "success"),
    notifyError = (o) => pushToast(o, "error"),
    notifyInfo = (o) => pushToast(o, "info"),
    confirmAction = ({
      title = "Confirmar accion",
      message = "",
      confirmLabel = "Continuar",
      cancelLabel = "Cancelar",
      tone = "danger",
    }) =>
      new Promise((o) => {
        setConfirmDialog({
          title,
          message,
          confirmLabel,
          cancelLabel,
          tone,
          resolve: o,
        });
      }),
    closeConfirmDialog = (o) => {
      confirmDialog && confirmDialog.resolve && confirmDialog.resolve(!!o);
      setConfirmDialog(null);
    },
    openInputDialog = ({
      title = "Captura",
      message = "",
      confirmLabel = "Guardar",
      cancelLabel = "Cancelar",
      fields = [],
    }) =>
      new Promise((o) => {
        setInputDialog({
          title,
          message,
          confirmLabel,
          cancelLabel,
          fields: fields.map((N) => ({
            ...N,
            value:
              typeof N.value !== "undefined"
                ? N.value
                : N.type === "select"
                  ? (((N.options || [])[0] || {}).value ?? "")
                  : "",
          })),
          resolve: o,
        });
      }),
    updateInputDialogField = (o, N) => {
      setInputDialog((A) =>
        A
          ? {
            ...A,
            fields: A.fields.map((vl) =>
              vl.name === o ? { ...vl, value: N } : vl,
            ),
          }
          : A,
      );
    },
    closeInputDialog = (o = null) => {
      inputDialog && inputDialog.resolve && inputDialog.resolve(o);
      setInputDialog(null);
    },
    submitInputDialog = () => {
      if (!inputDialog) return;
      const o = inputDialog.fields.find((N) => {
        if (!N.required) return !1;
        return !String(N.value || "").trim();
      });
      if (o) {
        notifyInfo(
          o.requiredMessage ||
          `Completa ${String(o.label || o.name || "este campo").toLowerCase()}.`,
        );
        return;
      }
      closeInputDialog(
        inputDialog.fields.reduce(
          (N, A) => ({ ...N, [A.name]: A.value }),
          {},
        ),
      );
    },
    activeOverlayKey = confirmDialog
      ? "confirm"
      : inputDialog
        ? "input"
        : paymentModalOpen
          ? "payment-modal"
        : shipmentProductPickerOpen
          ? "shipment-product-picker"
          : shipmentModalOpen
            ? "shipment-modal"
        : fullscreenImage
          ? "fullscreen-image"
          : reviewConversationEntry
            ? "review-conversation"
            : Pl
              ? "group-ticket"
              : ji && Je
                ? "edit-ticket"
                : me && he
                  ? "edit-product"
                  : K
                    ? "edit-client"
                    : W
                      ? "client-home"
                    : Il
                      ? "add-client"
                      : missionSummaryOpen
                        ? "shopping-summary"
                        : showMissionStartModal
                          ? "shopping-start"
                          : "",
    overlayHistorySkipRef = V.useRef(!1),
    closingOverlayKeyRef = V.useRef(""),
    overlayDismissTimerRef = V.useRef(null),
    sectionSwitchTimerRef = V.useRef(null),
    sectionSettleTimerRef = V.useRef(null),
    activeOverlayKeyRef = V.useRef(""),
    dismissActiveOverlayRef = V.useRef(() => {});
  V.useEffect(() => {
    closingOverlayKeyRef.current = closingOverlayKey;
  }, [closingOverlayKey]);
  V.useEffect(() => {
    activeOverlayKeyRef.current = activeOverlayKey;
    const o = () => {
      setClosingOverlayKey("");
      if (confirmDialog) {
        closeConfirmDialog(!1);
        return;
      }
      if (inputDialog) {
        closeInputDialog(null);
        return;
      }
      if (paymentModalOpen) {
        setPaymentModalOpen(!1);
        setPaymentAmountManual(!1);
        setPaymentProductSearch("");
        return;
      }
      if (shipmentProductPickerOpen) {
        setShipmentProductPickerOpen(!1);
        return;
      }
      if (shipmentModalOpen) {
        setShipmentModalOpen(!1);
        setShipmentProductPickerOpen(!1);
        return;
      }
      if (fullscreenImage) {
        setFullscreenImage(null);
        return;
      }
      if (reviewConversationEntry) {
        setReviewConversationEntry(null);
        closeAlternativeUploadModal();
        return;
      }
      if (Pl) {
        at(!1);
        we(null);
        Kt(null);
        return;
      }
      if (ji && Je) {
        sn(!1);
        We(null);
        return;
      }
      if (me && he) {
        closeProductModal();
        return;
      }
      if (K) {
        tl(!1);
        Y(null);
        return;
      }
      if (W) {
        Aa();
        return;
      }
      if (Il) {
        k(!1);
        return;
      }
      if (missionSummaryOpen) {
        setMissionSummaryOpen(!1);
        return;
      }
      showMissionStartModal && setShowMissionStartModal(!1);
    };
    dismissActiveOverlayRef.current = (N = !1, A = !1) => {
      const vl = activeOverlayKeyRef.current;
      if (!vl) return;
      if (me && he) {
        if (newProductUploading) return;
        const El = getProductModalPriceError();
        if (El) {
          notifyInfo(El);
          return;
        }
      }
      !N &&
        window.history.state &&
        window.history.state.__ps_overlay &&
        ((overlayHistorySkipRef.current = !0), window.history.back());
      if (A) {
        overlayDismissTimerRef.current &&
          clearTimeout(overlayDismissTimerRef.current);
        overlayDismissTimerRef.current = null;
        o();
        return;
      }
      if (closingOverlayKeyRef.current === vl) return;
      setClosingOverlayKey(vl);
      overlayDismissTimerRef.current &&
        clearTimeout(overlayDismissTimerRef.current);
      overlayDismissTimerRef.current = setTimeout(() => {
        overlayDismissTimerRef.current = null;
        o();
      }, 170);
    };
  }, [
    activeOverlayKey,
    closingOverlayKey,
    confirmDialog,
    inputDialog,
    paymentModalOpen,
    shipmentProductPickerOpen,
    shipmentModalOpen,
    fullscreenImage,
    reviewConversationEntry,
    Pl,
    ji,
    Je,
    me,
    he,
    newProductUploading,
    K,
    W,
    Il,
    missionSummaryOpen,
    showMissionStartModal,
    st,
  ]);
  V.useEffect(() => {
    if (!activeOverlayKey) return;
    const o = window.history.state || {};
    o.__ps_overlay === activeOverlayKey ||
      window.history.pushState({ ...o, __ps_overlay: activeOverlayKey }, "");
  }, [activeOverlayKey]);
  V.useEffect(() => {
    const o = () => {
      if (overlayHistorySkipRef.current) {
        overlayHistorySkipRef.current = !1;
        return;
      }
      activeOverlayKeyRef.current && dismissActiveOverlayRef.current(!0);
    };
    window.addEventListener("popstate", o);
    return () => window.removeEventListener("popstate", o);
  }, []);
  V.useEffect(() => {
    const o = (N) => {
      const A = String(N.key || "");
      if (A !== "Escape" && A !== "Esc" && N.keyCode !== 27) return;
      if (!activeOverlayKeyRef.current) return;
      N.preventDefault();
      N.stopPropagation();
      dismissActiveOverlayRef.current(!0);
    };
    document.addEventListener("keydown", o, !0);
    return () => document.removeEventListener("keydown", o, !0);
  }, []);
  V.useEffect(() => {
    if (!me || !he || productFinalPriceManual) return;
    const o = computeProductModalFinalPrice(st.real_price);
    const N = Number.isFinite(o) ? o.toFixed(2) : "";
    Gt((A) =>
      String((A && A.charged_price) || "") === N
        ? A
        : { ...A, charged_price: N },
    );
  }, [
    me,
    he,
    st.real_price,
    calcMode,
    calcFactor,
    calcDiscount,
    calcTaxes,
    calcCommission,
    calcExchangeRate,
    productFinalPriceManual,
  ]);
  V.useEffect(() => {
    if (!paymentModalOpen || paymentAmountManual) return;
    const o = Kl.find(
        (A) => String(A.id) === String(paymentForm.client || ""),
      ) || null,
      N = paymentForm.shopping
        ? new Set((paymentForm.product_ids || []).map((A) => Number(A)))
        : new Set(),
      A =
        o && paymentForm.shopping
          ? paymentLocalProductsTotal(
            paymentLocalShoppingProducts(o, paymentForm.shopping, N).filter((vl) =>
              N.has(Number(vl.id)),
            ),
          )
          : 0,
      vl = N.size > 0 ? A.toFixed(2) : "";
    setPaymentForm((N) =>
      String((N && N.amount) || "") === vl
        ? N
        : { ...N, amount: vl },
    );
  }, [
    paymentModalOpen,
    paymentAmountManual,
    paymentForm.client,
    paymentForm.shopping,
    paymentForm.product_ids,
    Kl,
  ]);
  V.useEffect(() => {
    C && Ti();
  }, [C]);
  V.useEffect(() => {
    if (!C) setSeenReviewItemMap({});
  }, [C]);
  V.useEffect(
    () => () => {
      toastTimeoutsRef.current.forEach((o) => clearTimeout(o));
      toastTimeoutsRef.current.clear();
      overlayDismissTimerRef.current &&
        clearTimeout(overlayDismissTimerRef.current);
      sectionSwitchTimerRef.current &&
        clearTimeout(sectionSwitchTimerRef.current);
      sectionSettleTimerRef.current &&
        clearTimeout(sectionSettleTimerRef.current);
    },
    [],
  );
  // <-------- seccion 8: guardar ids actuales para manejar mensajes websocket
  V.useEffect(() => {
    selectedClientIdRef.current = W ? W.id : null;
    activeMissionIdRef.current = w ? w.id : null;
  }, [W, w]);
  V.useEffect(() => {
    currentTabRef.current = nl;
    if (nl === "HOME") setHomeNeedsAttention(!1);
  }, [nl]);
  V.useEffect(() => {
    const o = () => setIsWideViewport(window.innerWidth >= 1024);
    o();
    window.addEventListener("resize", o);
    return () => window.removeEventListener("resize", o);
  }, []);
  // <-------- seccion 8: conexion websocket + reconexion automatica
  V.useEffect(() => {
    if (!C) {
      wsStoppedRef.current = !0;
      wsReconnectTimerRef.current && clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }
    wsStoppedRef.current = !1;
    let reconnectAttempt = 0;
    const refreshRequestsForMission = async () => {
      try {
        const N = await I("/requests/");
        setRequests(N || []);
      } catch (N) {
        console.error("Failed loading shopping requests", N);
      }
    };
    const refreshReviewsForCurrentContext = async () => {
      const o = selectedClientIdRef.current,
        N = activeMissionIdRef.current;
      if (o) {
        try {
          const A = await I(`/reviews/?client=${o}`);
          setProductReviews(A || []);
        } catch (A) {
          console.error("Failed loading product reviews", A);
        }
      }
      if (N) {
        try {
          const A = await I(`/reviews/?shopping=${N}`);
          setMissionReviewAlerts(
            (A || []).filter(
              (vl) =>
                vl.status === "PENDING" || vl.status === "ALTERNATIVE_SENT",
            ),
          );
        } catch (A) {
          console.error("Failed loading shopping reviews", A);
        }
      } else {
        setMissionReviewAlerts([]);
      }
    };
    const refreshUnreadSummaryForActiveMission = async () => {
      const o = activeMissionIdRef.current;
      if (!o) {
        setHomeUnreadSummary({});
        return;
      }
      try {
        const N = await I(`/reviews/unread-summary/?shopping=${o}`);
        setHomeUnreadSummary(N || {});
      } catch (N) {
        console.error("Failed loading unread review summary", N);
      }
    };
    const connect = () => {
      if (wsStoppedRef.current) return;
      const o = new WebSocket(
        `${WS_UPDATES_URL}?token=${encodeURIComponent(C)}`,
      );
      wsRef.current = o;
      o.onopen = () => {
        reconnectAttempt = 0;
      };
      o.onmessage = async (N) => {
        try {
          const A = JSON.parse(N.data || "{}");
          const vl = A.model,
            El = String(A.action || "changed").toLowerCase(),
            Se = () => {
              if (currentTabRef.current !== "HOME") setHomeNeedsAttention(!0);
            };
          if (
            (vl === "clients" || vl === "requests" || vl === "reviews") &&
            El === "created"
          ) {
            Se();
          }
          if (vl === "clients" || vl === "shoppings") {
            await refreshCoreData();
            return;
          }
          if (vl === "shipments") {
            await refreshCoreData();
            await refreshSelectedClient();
            return;
          }
          if (vl === "products" || vl === "receipts") {
            await refreshCoreData();
            await refreshSelectedClient();
            await refreshUnreadSummaryForActiveMission();
            return;
          }
          if (vl === "requests") {
            await refreshRequestsForMission();
            return;
          }
          if (vl === "reviews") {
            await refreshCoreData();
            await refreshSelectedClient();
            await refreshReviewsForCurrentContext();
            await refreshUnreadSummaryForActiveMission();
            return;
          }
          if (vl === "stores") {
            const [ea, gl] = await Promise.all([
              I("/stores/"),
              I("/store-recommendations/"),
            ]);
            setStores(ea || []);
            setStoreRecommendations(gl || []);
            return;
          }
        } catch (A) {
          console.error("Failed processing websocket message", A);
        }
      };
      o.onerror = () => {
        try {
          o.close();
        } catch {}
      };
      o.onclose = () => {
        if (wsStoppedRef.current) return;
        reconnectAttempt += 1;
        const N = Math.min(5000, 1000 * reconnectAttempt);
        wsReconnectTimerRef.current = setTimeout(connect, N);
      };
    };
    connect();
    return () => {
      wsStoppedRef.current = !0;
      wsReconnectTimerRef.current && clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [C]);
  V.useEffect(() => {
    localStorage.setItem("calc_mode", calcMode);
  }, [calcMode]);
  V.useEffect(() => {
    localStorage.setItem("calc_factor", String(calcFactor));
  }, [calcFactor]);
  V.useEffect(() => {
    localStorage.setItem("calc_taxes", String(calcTaxes));
  }, [calcTaxes]);
  V.useEffect(() => {
    localStorage.setItem("calc_discount", String(calcDiscount));
  }, [calcDiscount]);
  V.useEffect(() => {
    localStorage.setItem("calc_commission", String(calcCommission));
  }, [calcCommission]);
  V.useEffect(() => {
    localStorage.setItem("calc_exchange_rate", String(calcExchangeRate));
  }, [calcExchangeRate]);
  V.useEffect(() => {
    if (openProductMenuId === null && openProductInfoId === null)
      return;
    const closeMenuOnOutsideClick = (o) => {
      const N = o.target;
      if (
        N &&
        N.closest &&
        (N.closest("[data-product-menu]") || N.closest("[data-product-info]"))
      )
        return;
      setOpenProductMenuId(null), setOpenProductInfoId(null);
    };
    document.addEventListener("click", closeMenuOnOutsideClick);
    return () => {
      document.removeEventListener("click", closeMenuOnOutsideClick);
    };
  }, [openProductMenuId, openProductInfoId]);
  V.useEffect(() => {
    if (!C) {
      setRequests([]);
      return;
    }
    let isMounted = !0;
    const loadRequests = async () => {
      try {
        const o = await I("/requests/");
        isMounted && setRequests(o || []);
      } catch (o) {
        console.error("Failed loading requests", o);
      }
    };
    loadRequests();
    return () => {
      isMounted = !1;
    };
  }, [C]);
  // <-------- seccion 8: carga inicial de revisiones por cliente (sin polling)
  V.useEffect(() => {
    if (!C || !W) {
      setProductReviews([]);
      return;
    }
    let isMounted = !0;
    const loadProductReviews = async () => {
      try {
        const o = await I(`/reviews/?client=${W.id}`);
        isMounted && setProductReviews(o || []);
      } catch (o) {
        console.error("Failed loading product reviews", o);
      }
    };
    loadProductReviews();
    return () => {
      isMounted = !1;
    };
  }, [C, W]);
  V.useEffect(() => {
    if (!C || !w || !w.id) {
      setHomeUnreadSummary({});
      return;
    }
    let isMounted = !0;
    const loadUnreadSummary = async () => {
      try {
        const o = await I(`/reviews/unread-summary/?shopping=${w.id}`);
        isMounted && setHomeUnreadSummary(o || {});
      } catch (o) {
        console.error("Failed loading unread review summary", o);
      }
    };
    loadUnreadSummary();
    return () => {
      isMounted = !1;
    };
  }, [C, w]);
  // <-------- seccion 8: carga inicial de alertas de revision por mision
  V.useEffect(() => {
    if (!C || !w || (w.status !== "ACTIVE" && w.status !== "PAUSED")) {
      setMissionReviewAlerts([]);
      return;
    }
    let isMounted = !0;
    const loadMissionReviews = async () => {
      try {
        const o = await I(`/reviews/?shopping=${w.id}`);
        isMounted &&
          setMissionReviewAlerts(
            (o || []).filter(
              (N) => N.status === "PENDING" || N.status === "ALTERNATIVE_SENT",
            ),
          );
      } catch (o) {
        console.error("Failed loading shopping reviews", o);
      }
    };
    loadMissionReviews();
    return () => {
      isMounted = !1;
    };
  }, [C, w]);
  // <-------- seccion 9: sincroniza calculadora con configuracion de mision activa
  V.useEffect(() => {
    if (!w) return;
    const o = String(w.calc_mode || "FACTOR").toUpperCase();
    (o === "FACTOR" || o === "PERCENTAGE") && setCalcMode(o);
    const N = parseFloat(w.factor_value);
    Number.isFinite(N) && setCalcFactor(N);
    const A = parseFloat(w.tax_percentage);
    Number.isFinite(A) && setCalcTaxes(A);
    const vl = parseFloat(w.commission_percentage);
    Number.isFinite(vl) && setCalcCommission(vl);
    const El = parseFloat(w.exchange_rate);
    Number.isFinite(El) && setCalcExchangeRate(El);
    const Se = parseFloat(w.discount_percentage);
    Number.isFinite(Se) && setCalcDiscount(Se);
  }, [w && w.id]);
  const Ai = async (o) => {
    (o.preventDefault(), T(""));
    try {
      if (Q === "LOGIN") {
        const N = await fetch(`${Zs}/token/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: cl.username,
            password: cl.password,
          }),
        });
        if (!N.ok) {
          let A = "Invalid credentials";
          try {
            const vl = await N.json();
            A =
              vl.detail ||
              vl.error ||
              (typeof vl === "string" ? vl : A);
          } catch {}
          throw new Error(A);
        }
        const A = await N.json();
        (localStorage.setItem("access_token", A.access), jl(A.access));
      } else {
        const N = await fetch(`${Zs}/auth/register/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(cl),
        });
        if (!N.ok) {
          let A = "Failed to register.";
          try {
            const vl = await N.json();
            A =
              vl.error ||
              vl.detail ||
              (typeof vl === "string" ? vl : A);
          } catch {}
          throw new Error(A);
        }
        (al("LOGIN"), T("Registered successfully! Now please log in."));
      }
    } catch (N) {
      T(N.message);
    }
  },
    iu = () => {
      (
        localStorage.removeItem("access_token"),
        jl(null),
        b(null),
        setLayoutMode("MOBILE")
      );
    },
    Na = async (o) => {
      if ((o.preventDefault(), !!Vl))
        try {
          const N = await I("/clients/", {
            method: "POST",
            body: JSON.stringify({
              name: Vl,
              status: "Pending",
              tags: Nt,
              phone: p,
              email: q,
              shipping_address: rl,
            }),
          });
          (_l([...Kl, N]), Yt(""), it(""), z(""), sl(""), d(""), k(!1));
        } catch {
          notifyError("Error creating client");
        }
    },
    ja = async (o) => {
      if ((o.preventDefault(), !!ml.name))
        try {
          const N = await I(`/clients/${O.id}/`, {
            method: "PATCH",
            body: JSON.stringify(ml),
          });
          (_l(Kl.map((A) => (A.id === O.id ? N : A))), tl(!1), Y(null));
        } catch {
          notifyError("Error updating client");
        }
    },
    Ea = async (o) => {
      if (
        !(await confirmAction({
          title: "Eliminar cliente",
          message:
            "Se eliminará el cliente y todos sus productos vinculados.",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      try {
        (await I(`/clients/${o}/`, { method: "DELETE" }),
          _l(Kl.filter((N) => N.id !== o)),
          W && W.id === o && et(null));
      } catch {
        notifyError("Error deleting client");
      }
    },
    Jt = async (o) => {
      const N = String(o.status || "").toLowerCase() === "active" ? "Pending" : "Active";
      try {
        const A = await I(`/clients/${o.id}/`, {
          method: "PATCH",
          body: JSON.stringify({ status: N }),
        });
        _l(Kl.map((vl) => (vl.id === o.id ? A : vl)));
      } catch (A) {
        console.error(A);
      }
    },
    openMissionStart = () => {
      const parseSafe = (N, A = 0) => {
        const vl = parseFloat(N);
        return Number.isFinite(vl) ? vl : A;
      };
      const N = (w && getMissionStoreLabel(w)) || "";
      setMissionStartForm({
        name: N,
        store_name: N,
        tax_percentage: String(parseSafe(w && w.tax_percentage, calcTaxes)),
        calc_mode: String((w && w.calc_mode) || calcMode || "FACTOR").toUpperCase(),
        factor_value: String(parseSafe(w && w.factor_value, calcFactor)),
        commission_percentage: String(
          parseSafe(w && w.commission_percentage, calcCommission),
        ),
        exchange_rate: String(parseSafe(w && w.exchange_rate, calcExchangeRate)),
        discount_percentage: String(
          parseSafe(w && w.discount_percentage, calcDiscount),
        ),
      });
      setShowMissionStartModal(!0);
    },
    ye = async (o = missionStartForm) => {
      const N = String(o.store_name || o.name || "").trim();
      if (!N) {
        notifyInfo("Selecciona o escribe la tienda para iniciar el shopping.");
        return;
      }
      const A = String(o.calc_mode || "FACTOR").toUpperCase() === "PERCENTAGE"
        ? "PERCENTAGE"
        : "FACTOR";
      try {
        let vl = findStoreByName(N);
        if (!vl) {
          vl = await I("/stores/", {
            method: "POST",
            body: JSON.stringify({ name: N }),
          });
          setStores((Se) =>
            [...Se, vl].sort((ea, gl) => ea.name.localeCompare(gl.name)),
          );
        }
        let El = null;
        try {
          El = await I("/shoppings/", {
            method: "POST",
            body: JSON.stringify({
              name: N,
              store: vl && vl.id ? vl.id : null,
              calc_mode: A,
              tax_percentage: toNumber(o.tax_percentage, 8).toFixed(2),
              factor_value: toNumber(o.factor_value, 1.5).toFixed(4),
              commission_percentage: toNumber(o.commission_percentage, 10).toFixed(2),
              exchange_rate: toNumber(o.exchange_rate, 17.5).toFixed(4),
              discount_percentage: toNumber(o.discount_percentage, 0).toFixed(2),
            }),
          });
        } catch {
          El = await I("/shoppings/", {
            method: "POST",
            body: JSON.stringify({
              name: N,
              store: vl && vl.id ? vl.id : null,
            }),
          });
        }
        const Se = await I("/store-recommendations/");
        (setShowMissionStartModal(!1),
          zl([...Al, El]),
          Dl(El),
          setStoreRecommendations(Se || []),
          setCalcMode(A),
          setCalcTaxes(toNumber(o.tax_percentage, 8)),
          setCalcFactor(toNumber(o.factor_value, 1.5)),
          setCalcCommission(toNumber(o.commission_percentage, 10)),
          setCalcExchangeRate(toNumber(o.exchange_rate, 17.5)),
          setCalcDiscount(toNumber(o.discount_percentage, 0)));
      } catch (vl) {
        console.error("Failed creating shopping", vl);
        notifyError(`No se pudo iniciar la misión. ${vl.message || ""}`.trim());
      }
    },
    be = async () => {
      if (w)
        try {
          const o = await I(`/shoppings/${w.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "PAUSED" }),
          });
          (zl(Al.map((N) => (N.id === w.id ? o : N))), Dl(o));
        } catch { }
    },
    cu = async () => {
      if (w)
        try {
          const o = await I(`/shoppings/${w.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "ACTIVE" }),
          });
          (zl(Al.map((N) => (N.id === w.id ? o : N))), Dl(o));
        } catch { }
    },
    on = async () => {
      if (w)
        try {
          const o = await I(`/shoppings/${w.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "COMPLETED" }),
          });
          const N = await I("/clients/");
          (_l(N || []), zl(Al.map((A) => (A.id === w.id ? o : A))), Dl(null));
        } catch { }
    },
    mn = async (o) => {
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
        (await I(`/shoppings/${o}/`, { method: "DELETE" }),
          zl(Al.filter((N) => N.id !== o)),
          w && w.id === o && Dl(null),
          fn === o && rn(null));
      } catch {
        notifyError("Error deleting shopping");
      }
    },
    Fe = async (o) => {
      if (Sa.trim())
        try {
          const N = await I(`/shoppings/${o}/`, {
            method: "PATCH",
            body: JSON.stringify({ name: Sa }),
          });
          (zl(Al.map((A) => (A.id === o ? N : A))),
            w && w.id === o && Dl(N),
            dn(null));
        } catch {
          notifyError("Error renaming shopping");
        }
    },
    Qt = async () => {
      if (W)
        try {
          const o = await I(`/clients/${W.id}/`);
          (et(o), _l(Kl.map((N) => (N.id === o.id ? o : N))));
        } catch { }
    },
    Ta = (o, N = null) => {
      (setClientGalleryMissionScopeId(N),
        et(o),
        jt("REVIEW"));
    },
    Aa = () => {
      (et(null),
        setFullscreenImage(null),
        setClientGalleryMissionScopeId(null));
    },
    navigateSection = (o) => {
      if (o === nl) return;
      sectionSwitchTimerRef.current && clearTimeout(sectionSwitchTimerRef.current);
      sectionSettleTimerRef.current && clearTimeout(sectionSettleTimerRef.current);
      setSectionTransitionStage("out");
      sectionSwitchTimerRef.current = setTimeout(() => {
        Ll(o);
        setSectionTransitionStage("in");
        sectionSwitchTimerRef.current = null;
        sectionSettleTimerRef.current = setTimeout(() => {
          setSectionTransitionStage("idle");
          sectionSettleTimerRef.current = null;
        }, 220);
      }, 110);
    },
    overlayBackdropClass = (o, N) =>
      `${o}${closingOverlayKey === N ? " ui-backdrop-out" : ""}`,
    overlaySheetClass = (o, N) =>
      `${o}${closingOverlayKey === N ? " ui-sheet-out" : ""}`,
    // <-------- seccion 8: selector de imagen robusto (evita fallas de input hidden en algunos entornos Windows)
    openSingleImagePicker = (o) => {
      try {
        const N = document.createElement("input");
        (N.type = "file",
          N.accept = "image/*",
          N.style.position = "fixed",
          N.style.left = "-9999px",
          N.style.top = "-9999px",
          N.onchange = () => {
            const A = Array.from(N.files || []);
            if (A.length > 0) {
              // Use a stable File[] copy before removing the temporary input.
              o({ target: { files: A, value: "" } });
            }
            N.remove();
          },
          document.body.appendChild(N),
          N.click());
      } catch (N) {
        (console.error("Failed opening image picker", N),
          notifyError("No se pudo abrir el selector de imagen."));
      }
    },
    su = () => {
      if (receiptUploading) return;
      openSingleImagePicker(ru);
    },
    openMissionTicketPicker = () => {
      if (!w || missionTicketUploading) return;
      openSingleImagePicker(uploadMissionTicket);
    },
    fu = () => {
      if (newProductUploading) return;
      openSingleImagePicker(lt);
    },
    uploadMissionTicket = async (o) => {
      if (!w) return;
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = new FormData();
      A.append("image", N[0]);
      setMissionTicketUploading(!0);
      try {
        await I(`/shoppings/${w.id}/upload-ticket/`, {
          method: "POST",
          body: A,
        });
        await refreshCoreData();
        W && (await Qt());
        notifySuccess("Ticket de misión cargado y vinculado.");
      } catch (vl) {
        console.error("Shopping ticket upload failed", vl);
        notifyError("No se pudo subir el ticket de misión.");
      } finally {
        setMissionTicketUploading(!1);
        o.target.value = "";
      }
    },
    Xt = (o) => {
      if (productImageUploadingId) return;
      (Ke(o), openSingleImagePicker(Xl));
    },
    // <-------- seccion 8: comprimir imagen antes de subir para no saturar 3G/4G
    compressImage = (file, maxWidth = 1200, quality = 0.8) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            let width = img.width;
            let height = img.height;
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
    },
    Xl = async (o) => {
      if (!he) return;
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const originalFile = N[0];
      const compressedFile = await compressImage(originalFile).catch(() => originalFile);
      const A = new FormData();
      A.append("image", compressedFile);
      const vl = he.id;
      setProductImageUploadingId(vl);
      try {
        await I(`/products/${vl}/`, { method: "PATCH", body: A });
        await Qt();
      } catch {
        notifyError("Error updating photo");
      } finally {
        o.target.value = "";
        setProductImageUploadingId(null);
        Ke(null);
      }
    },
    formatProductPriceField = (o) => {
      if (o === null || typeof o === "undefined" || String(o).trim() === "") return "";
      const N = parseFloat(o);
      return Number.isFinite(N) ? N.toFixed(2) : String(o);
    },
    computeProductModalFinalPrice = (o) => {
      const N = parseFloat(o);
      const A = Math.max(0, 1 - (parseFloat(calcDiscount) || 0) / 100);
      return Number.isFinite(N)
        ? calcMode === "FACTOR"
          ? N * calcFactor * A
          : N *
            A *
            (1 + calcCommission / 100) *
            (1 + calcTaxes / 100) *
            calcExchangeRate
        : Number.NaN;
    },
    getProductModalPriceError = (o = null) => {
      const N = o || st;
      const A = String(N.real_price || "").trim();
      const vl = String(N.charged_price || "").trim();
      if (!A || !Number.isFinite(parseFloat(A)))
        return "Debes capturar un Store Price (USD) valido antes de cerrar o guardar.";
      if (!vl || !Number.isFinite(parseFloat(vl)))
        return "Debes capturar un Final Price (MXN) valido antes de cerrar o guardar.";
      return "";
    },
    openProductModal = (o, N = "edit", A = {}) => {
      const vl = String(o && o.tags ? o.tags : "")
          .split(",")
          .map((Se) => Se.trim())
          .filter((Se) => Se.length > 0),
        El = (o && o.store) || ((w && w.store) || ""),
        SeRealPrice = formatProductPriceField((o && o.real_price) || ""),
        SeChargedPrice = formatProductPriceField((o && o.charged_price) || ""),
        computedFinalPrice = computeProductModalFinalPrice(SeRealPrice),
        computedFinalPriceText = Number.isFinite(computedFinalPrice)
          ? computedFinalPrice.toFixed(2)
          : "",
        Se =
          typeof A.formStatus === "string" && A.formStatus.trim()
            ? A.formStatus
            : getProductReviewState(
              o,
              o && o.id ? latestReviewsByProduct[o.id] || null : null,
            ),
        ea =
          !!SeChargedPrice &&
          (!computedFinalPriceText || SeChargedPrice !== computedFinalPriceText);
      (Ke(o),
        Gt(
          createEmptyProductForm({
            name: (o && o.name) || "",
            real_price: SeRealPrice,
            charged_price: ea ? SeChargedPrice : (SeChargedPrice || computedFinalPriceText),
            tags: (o && o.tags) || "",
            store: El,
            status: Se,
          }),
        ),
        setModalTags(vl),
        setNewModalTag(""),
        setStoreSearch(""),
        setShowAddStoreInput(!1),
        setNewStoreName(""),
        setPendingProductFile(A.file || null),
        setProductFinalPriceManual(ea),
        setProductModalMode(N),
        ut(!0));
    },
    closeProductModal = (o = !1) => {
      if (newProductUploading && !o) return;
      if (!o) {
        const N = getProductModalPriceError();
        if (N) {
          notifyInfo(N);
          return;
        }
      }
      (ut(!1),
        Ke(null),
        Gt(createEmptyProductForm()),
        setProductModalMode("edit"),
        setPendingProductFile(null),
        setProductFinalPriceManual(!1),
        setModalTags([]),
        setNewModalTag(""),
        setStoreSearch(""),
        setShowAddStoreInput(!1),
        setNewStoreName(""));
    },
    lt = async (o) => {
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = N[0],
        vl = getDraftProductFlowState(wl, X),
        El = (w && w.store) || "";
      openProductModal(
        createEmptyProductForm({
          store: El,
          status: normalizeProductModalStatus(vl),
        }),
        "create",
        { file: A, formStatus: vl },
      );
      o.target.value = "";
    },
    xe = async (o) => {
      if (
        !(await confirmAction({
          title: "Eliminar producto",
          message: "¿Seguro que quieres eliminar este item?",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      try {
        (await I(`/products/${o}/`, { method: "DELETE" }), Qt());
      } catch (N) {
        console.log(N);
      }
    },
    setProductStatusQuick = async (o, N) => {
      try {
        (await I(`/products/${o}/`, {
          method: "PATCH",
          body: JSON.stringify({ status: N }),
        }),
          Qt());
      } catch (A) {
        console.error("Failed updating product status", A);
      }
    },
    hn = (o) => {
      openProductModal(o, "edit");
    },
    buildProductModalPayload = () => {
      const o = computeProductModalFinalPrice(st.real_price),
        N = Number.isFinite(o) ? o.toFixed(2) : "",
        A = (gl) => {
          if (gl === null || typeof gl === "undefined" || String(gl).trim() === "")
            return null;
          const ae = parseFloat(gl);
          return Number.isFinite(ae) ? ae.toFixed(2) : null;
        };
      return {
        payload: {
          ...st,
          name: String(st.name || "").trim(),
          tags: modalTags.join(", "),
          store: w ? null : st.store ? Number(st.store) : null,
          status: normalizeProductModalStatus(st.status),
          real_price: A(st.real_price),
          charged_price: productFinalPriceManual
            ? A(st.charged_price)
            : (N || A(st.charged_price)),
        },
        reviewState: st.status,
      };
    },
    zi = async (o) => {
      o.preventDefault();
      if (!he) return;
      const { payload: N, reviewState: A } = buildProductModalPayload(),
        vl = productModalMode === "create";
      if (!N.name) {
        notifyError("Debes capturar el nombre del producto.");
        return;
      }
      const El = getProductModalPriceError(N);
      if (El) {
        notifyError(El);
        return;
      }
      if (vl && !pendingProductFile) {
        notifyError("Selecciona una imagen para crear el producto.");
        return;
      }
      try {
        if (vl) {
          const Se = new FormData();
          setNewProductUploading(!0);
          const ea = await compressImage(pendingProductFile).catch(() => pendingProductFile);
          Se.append("image", ea);
          Se.append("client", W.id);
          Se.append("name", N.name);
          Se.append("status", N.status);
          Se.append("purchase_date", new Date().toISOString().slice(0, 10));
          N.real_price !== null && Se.append("real_price", N.real_price);
          N.charged_price !== null && Se.append("charged_price", N.charged_price);
          N.tags && Se.append("tags", N.tags);
          w && w.id
            ? Se.append("shopping", w.id)
            : N.store !== null && Se.append("store", String(N.store));
          const gl = await I("/products/", { method: "POST", body: Se });
          A !== "ANNOTATED" &&
            (await syncProductReviewState(
              { ...gl, status: N.status },
              null,
              A,
            ));
        } else {
          await I(`/products/${he.id}/`, {
            method: "PATCH",
            body: JSON.stringify(N),
          });
          await syncProductReviewState(
            { ...he, status: N.status },
            latestReviewsByProduct[he.id] || null,
            A,
          );
        }
        (closeProductModal(!0), await refreshProductReviews(W && W.id), Qt());
      } catch (El) {
        console.error(vl ? "Failed creating product" : "Failed updating product", El);
        notifyError(vl ? "Error adding product" : "Error updating item");
      } finally {
        vl && setNewProductUploading(!1);
      }
    },
    _i = async (o) => {
      o.preventDefault();
      try {
        (await I(`/receipts/${Je.id}/`, {
          method: "PATCH",
          body: JSON.stringify(Ol),
        }),
          sn(!1),
          We(null),
          Qt());
      } catch {
        notifyError("Error updating ticket");
      }
    },
    ru = async (o) => {
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = new FormData();
      (A.append("image", N[0]),
        A.append("uploaded_by_id", J.id),
        W && W.id && A.append("client", W.id));
      setReceiptUploading(!0);
      try {
        const vl = await I("/receipts/", { method: "POST", body: A });
        (await Qt(), Kt(vl.id));
        const El = URL.createObjectURL(N[0]);
        (we(El), ke([]), at(!0));
      } catch {
        notifyError("Receipt upload failed");
      } finally {
        setReceiptUploading(!1);
        o.target.value = "";
      }
    },
    la = (o) => {
      (Kt(o.id), we(resolveMediaUrl(o.image)));
      const N = o.items ? o.items.map((A) => A.id) : [];
      (ke(N), at(!0));
    },
    gn = (o) => {
      ke((N) => (N.includes(o) ? N.filter((A) => A !== o) : [...N, o]));
    },
    ve = async () => {
      try {
        const N = W.products
          .map((A) => A.id)
          .map((A) => {
            if (ct.includes(A))
              return I(`/products/${A}/`, {
                method: "PATCH",
                body: JSON.stringify({ receipt: kt, status: "ANNOTATED" }),
              });
            {
              const vl = W.products.find((El) => El.id === A);
              if (vl && vl.receipt === kt)
                return I(`/products/${A}/`, {
                  method: "PATCH",
                  body: JSON.stringify({ receipt: null }),
                });
            }
            return null;
          })
          .filter((A) => A !== null);
        (await Promise.all(N), Qt(), at(!1), we(null), Kt(null));
      } catch (o) {
        console.error("Error linking", o);
      }
    },
    copyCalculatorValue = async (o) => {
      if (!Number.isFinite(o)) return;
      try {
        (await navigator.clipboard.writeText(o.toFixed(2)),
          setCalcCopied(!0),
          setTimeout(() => setCalcCopied(!1), 1200));
      } catch (N) {
        console.error("Failed to copy calculator result", N);
      }
    },
    addModalTag = () => {
      const o = newModalTag.trim();
      if (!o) return;
      if (modalTags.some((N) => N.toLowerCase() === o.toLowerCase())) {
        setNewModalTag("");
        return;
      }
      (setModalTags((N) => [...N, o]), setNewModalTag(""));
    },
    removeModalTag = (o) => {
      setModalTags((N) => N.filter((A) => A !== o));
    },
    createStoreFromModal = async () => {
      const o = newStoreName.trim();
      if (!o) return;
      try {
        const N = await I("/stores/", {
          method: "POST",
          body: JSON.stringify({ name: o }),
        });
        (setStores((A) => [...A, N].sort((vl, El) => vl.name.localeCompare(El.name))),
          Gt((A) => ({ ...A, store: N.id })),
          setShowAddStoreInput(!1),
          setNewStoreName(""),
          setStoreSearch(""));
      } catch (N) {
        console.error("Failed to create store", N);
      }
    },
    // <-------- seccion 8: convertir imagen a PNG para mejorar compatibilidad de copiado
    convertBlobToPng = async (o) => {
      if (!o) throw new Error("Invalid image blob");
      if (o.type === "image/png") return o;
      const N = URL.createObjectURL(o);
      try {
        const A = await new Promise((vl, El) => {
          const Se = new Image();
          (Se.onload = () => vl(Se),
            Se.onerror = () => El(new Error("Could not decode image")),
            Se.src = N);
        });
        const vl = document.createElement("canvas"),
          El = Math.max(1, A.naturalWidth || A.width || 1),
          Se = Math.max(1, A.naturalHeight || A.height || 1);
        (vl.width = El, vl.height = Se);
        const ea = vl.getContext("2d");
        if (!ea) throw new Error("Canvas context unavailable");
        ea.drawImage(A, 0, 0, El, Se);
        return await new Promise((gl, ae) => {
          vl.toBlob(
            (oi) => (oi ? gl(oi) : ae(new Error("PNG conversion failed"))),
            "image/png",
          );
        });
      } finally {
        URL.revokeObjectURL(N);
      }
    },
    copyProductImageToClipboard = async (o, N) => {
      if (!N) return;
      const A = resolveMediaUrl(N);
      try {
        const vl = await fetch(A);
        if (!vl.ok) throw new Error(`HTTP ${vl.status}`);
        const El = await vl.blob(),
          Se =
            El.type && El.type.startsWith("image/") ? El.type : "image/png";
        if (
          navigator.clipboard &&
          navigator.clipboard.write &&
          typeof ClipboardItem !== "undefined"
        ) {
          const ea = [];
          try {
            const gl = await convertBlobToPng(El);
            ea.push({ type: "image/png", blob: gl });
          } catch {}
          Se !== "image/png" && ea.push({ type: Se, blob: El });
          Se === "image/png" && ea.push({ type: Se, blob: El });
          let gl = !1;
          for (const ae of ea) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ [ae.type]: ae.blob }),
              ]);
              gl = !0;
              break;
            } catch {}
          }
          if (!gl) throw new Error("Clipboard image API not supported");
        } else {
          throw new Error("Clipboard image API not supported");
        }
        (setCopiedImageItemId(o),
          setTimeout(() => setCopiedImageItemId(null), 2000));
      } catch (vl) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(A);
            (setCopiedImageItemId(o),
              setTimeout(() => setCopiedImageItemId(null), 2000),
              notifyInfo(
                "Tu navegador no permite copiar imagen directa. Se copio el enlace de la imagen.",
              ));
            return;
          }
        } catch {}
        (console.error("Failed to copy image", vl),
          notifyError("No se pudo copiar la imagen. Intenta en Chrome o Edge."));
      }
    },
    copyImageUrlToClipboard = async (o, N = "Imagen copiada.") => {
      if (!o) return;
      try {
        const A = await fetch(o);
        if (!A.ok) throw new Error(`HTTP ${A.status}`);
        const vl = await A.blob(),
          El =
            vl.type && vl.type.startsWith("image/") ? vl.type : "image/png";
        if (
          navigator.clipboard &&
          navigator.clipboard.write &&
          typeof ClipboardItem != "undefined"
        ) {
          const Se = [];
          try {
            const ea = await convertBlobToPng(vl);
            Se.push({ type: "image/png", blob: ea });
          } catch {}
          El !== "image/png" && Se.push({ type: El, blob: vl });
          El === "image/png" && Se.push({ type: El, blob: vl });
          let ea = !1;
          for (const gl of Se) {
            try {
              await navigator.clipboard.write([
                new ClipboardItem({ [gl.type]: gl.blob }),
              ]);
              ea = !0;
              break;
            } catch {}
          }
          if (!ea) throw new Error("Clipboard image API not supported");
          notifySuccess(N);
          return;
        }
        throw new Error("Clipboard image API not supported");
      } catch (A) {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(o);
            notifyInfo(
              "Tu navegador no permite copiar imagen directa. Se copio el enlace de la imagen.",
            );
            return;
          }
        } catch {}
        (console.error("Failed to copy image url", A),
          notifyError("No se pudo copiar la imagen. Intenta en Chrome o Edge."));
      }
    },
    getFullscreenImageUrl = (o) =>
      !o ? "" : typeof o == "string" ? o : o.url || "",
    buildBreakdownMessage = ({
      title = "DESGLOSE DE TU CUENTA:",
      items = [],
      itemsText = "",
      total = 0,
      itemBullet = "*",
    }) => {
      const o = new Intl.NumberFormat("es-MX"),
        N =
          itemsText ||
          (items.length > 0
            ? items
                .map((A) => `${itemBullet} ${A.name} – $${o.format(A.finalPrice)}`)
                .join("\n")
            : "Sin productos."),
        A = (defaultBreakdownTemplate || DEFAULT_BREAKDOWN_TEMPLATE)
          .replaceAll("{title}", title)
          .replaceAll("{items}", N)
          .replaceAll("{total}", o.format(total));
      return A;
    },
    handleFullscreenImageCopy = async () => {
      if (
        !fullscreenImage ||
        typeof fullscreenImage == "string" ||
        !fullscreenImage.copyOnClick
      )
        return;
      const o = getFullscreenImageUrl(fullscreenImage);
      o && (await copyImageUrlToClipboard(o, fullscreenImage.copyMessage || "Imagen copiada."));
    },
    copyMissionBreakdown = async (o, N) => {
      const A = (N.products || []).filter((vl) => vl.shopping === o.id),
        vl = A.map((Se) => {
          const ea = parseFloat(Se.charged_price || 0);
          return { name: Se.name, finalPrice: Number.isFinite(ea) ? ea : 0 };
        }),
        El = vl.reduce((ea, gl) => ea + gl.finalPrice, 0),
        Se = buildBreakdownMessage({
          items: vl,
          total: El,
        });
      try {
        await navigator.clipboard.writeText(Se);
      } catch (gl) {
        console.error("Failed to copy shopping breakdown", gl);
      }
    },
    copyAnnotatedMissionBreakdown = async (o, N) => {
      const A = ((N && N.products) || []).filter((vl) => {
          const El = String(vl.status || "").toUpperCase();
          return Number(vl.shopping) === Number(o && o.id) && El === "ANNOTATED";
        }),
        vl = A.map((Se) => {
          const ea = parseFloat(Se.charged_price || 0);
          return { name: Se.name, finalPrice: Number.isFinite(ea) ? ea : 0 };
        }),
        El = vl.reduce((ea, gl) => ea + gl.finalPrice, 0),
        Se = buildBreakdownMessage({
          items: vl,
          total: El,
        });
      try {
        await navigator.clipboard.writeText(Se);
        const gl = `home-${o.id}-${N.id}`;
        setCopiedMissionClients((ae) =>
          ae.includes(gl) ? ae : [...ae, gl],
        );
      } catch (gl) {
        console.error("Failed to copy annotated shopping breakdown", gl);
      }
    },
    copyMissionClientsBreakdown = async (o, N = []) => {
      if (!o) return;
      const A = new Intl.NumberFormat("es-MX"),
        vl = N.map((El) => {
          const Se = ((El && El.products) || []).filter((ea) => {
              const gl = String(ea.status || "").toUpperCase();
              return Number(ea.shopping) === Number(o.id) && gl === "ANNOTATED";
            }),
            ea = Se.map((gl) => {
              const ae = parseFloat(gl.charged_price || 0);
              return { name: gl.name, finalPrice: Number.isFinite(ae) ? ae : 0 };
            }),
            gl = ea.reduce((ae, oi) => ae + oi.finalPrice, 0);
          return {
            name: El.name,
            items: ea,
            total: gl,
          };
        }).filter((El) => El.items.length > 0);
      if (vl.length === 0) {
        notifyInfo("No hay productos anotados para copiar en esta misión.");
        return;
      }
      const El = vl.reduce((Se, ea) => Se + ea.total, 0),
        Se = buildBreakdownMessage({
          title: "DESGLOSE DE LA MISION:",
          itemsText: vl
            .map(
              (ea) =>
                `${ea.name}:\n` +
                ea.items
                  .map((gl) => `* ${gl.name} – $${A.format(gl.finalPrice)}`)
                  .join("\n") +
                `\nTOTAL CLIENTE: $${A.format(ea.total)}`,
            )
            .join("\n\n"),
          total: El,
        });
      try {
        await navigator.clipboard.writeText(Se);
      } catch (ea) {
        console.error("Failed to copy clients shopping breakdown", ea);
      }
    },
    generateClientHistoryShareLink = async (o) => {
      if (!o) throw new Error("Cliente invalido.");
      const N = await I("/client-share-links/", {
        method: "POST",
        body: JSON.stringify({
          client: o.id,
        }),
      });
      if (!N || !N.share_url) throw new Error("No se pudo generar el enlace.");
      return N;
    },
    copyClientMissionShareLink = async (o, N) => {
      if (!N) return;
      try {
        const A = await generateClientHistoryShareLink(N);
        await navigator.clipboard.writeText(A.share_url);
        const vl = `client-history-${N.id}`;
        setCopiedClientShareLinks((El) =>
          El.includes(vl) ? El : [...El, vl],
        );
        notifySuccess("Link copiado.");
      } catch (A) {
        console.error("Failed to copy client shopping share link", A);
        notifyError(
          (A && A.message) || "No se pudo generar el link del cliente.",
        );
      }
    },
    copyShipmentShareLink = async (o) => {
      if (!o || !o.id) return;
      try {
        const N = await I("/shipment-share-links/", {
          method: "POST",
          body: JSON.stringify({
            shipment: o.id,
          }),
        });
        if (!N || !N.share_url) throw new Error("No se pudo generar el enlace.");
        await navigator.clipboard.writeText(N.share_url);
        const A = `shipment-share-${o.id}`;
        setCopiedClientShareLinks((vl) =>
          vl.includes(A) ? vl : [...vl, A],
        );
        notifySuccess("Link copiado.");
      } catch (N) {
        console.error("Failed to copy shipment share link", N);
        notifyError(
          (N && N.message) || "No se pudo generar el link del envio.",
        );
      }
    },
    saveLayoutMode = async (o) => {
      if (!J) return;
      const N = String(o || "").toUpperCase() === "WEB" ? "WEB" : "MOBILE";
      const A = layoutMode;
      if (A === N) return;
      setLayoutMode(N);
      try {
        const vl = await I("/auth/me/", {
          method: "PATCH",
          body: JSON.stringify({ layout_mode: N }),
        });
        vl && b(vl);
      } catch (vl) {
        console.error("Failed saving layout mode", vl);
        setLayoutMode(A);
        notifyError("No se pudo guardar la vista en tu perfil.");
      }
    },
    getShipmentAssignableProducts = (o = null) =>
      Kl.flatMap((N) =>
        ((N && N.products) || [])
          .filter((A) =>
            ["ANNOTATED", "BOUGHT", "SHIPPED"].includes(
              String(A.status || "").toUpperCase(),
            ),
          )
          .filter((A) => (!o ? !0 : Number(A.client) === Number(o)))
          .map((A) => ({
            ...A,
            client_name: N.name,
            shipping_address:
              A.shipping_address || N.shipping_address || "",
          })),
      ).sort((N, A) => {
        const vl = String(N.shopping_name || N.mission_name || N.store_name || "").localeCompare(
          String(A.shopping_name || A.mission_name || A.store_name || ""),
        );
        if (vl !== 0) return vl;
        return String(N.name || "").localeCompare(String(A.name || ""));
      }),
    getShipmentFormState = (o = null, N = null) => {
      const A = String((N && N.client) || (o && o.client) || ((Kl[0] || {}).id || ""));
      const vl =
        o && o.client_price !== null && typeof o.client_price != "undefined"
          ? String(o.client_price)
          : o && o.guide_price !== null && typeof o.guide_price != "undefined"
            ? String(o.guide_price)
            : "";
      return {
        id: (o && o.id) || null,
        client: A,
        carrier: String((o && o.carrier) || "").trim(),
        status: String((o && o.status) || "PENDING"),
        tracking_number: (o && o.tracking_number) || "",
        guide_price: vl,
        client_price: vl,
        shipping_address:
          (o && o.shipping_address) ||
          ((N && (N.shipping_address || "")) || ""),
        product_ids:
          ((o && (o.products || [])) || (N && N.id ? [N.id] : [])).map((Se) =>
            Number(Se),
          ),
      };
    },
    openShipmentEditor = (o = null, N = null) => {
      if (!Kl.length) {
        notifyInfo("Necesitas al menos un cliente para crear envios.");
        return;
      }
      setShipmentForm(getShipmentFormState(o, N));
      setShipmentProductSearch("");
      setShipmentProductPickerOpen(!1);
      setShipmentModalOpen(!0);
    },
    updateShipmentForm = (o, N) => {
      setShipmentForm((A) => {
        const vl = { ...A, [o]: N };
        if (o === "client" && String(A.client || "") !== String(N || "")) {
          const El = Kl.find((Se) => String(Se.id) === String(N || ""));
          vl.product_ids = [];
          if (!String(A.shipping_address || "").trim()) {
            vl.shipping_address = (El && El.shipping_address) || "";
          }
        }
        return vl;
      });
    },
    toggleShipmentProductSelection = (o) => {
      if (!o) return;
      setShipmentForm((N) => {
        const A = Number(o.id);
        const vl = (N.product_ids || []).includes(A)
          ? (N.product_ids || []).filter((El) => Number(El) !== A)
          : [...(N.product_ids || []), A];
        return { ...N, product_ids: vl };
      });
    },
    saveShipmentEditor = async () => {
      const o = Kl.find(
        (A) => String(A.id) === String(shipmentForm.client || ""),
      );
      const N = String(shipmentForm.carrier || "").trim();
      const A =
        String(shipmentForm.client_price || "").trim() === ""
          ? null
          : String(shipmentForm.client_price || "").trim();
      if (!o) {
        notifyInfo("Selecciona un cliente.");
        return;
      }
      if (!N) {
        notifyInfo("Captura la paqueteria.");
        return;
      }
      if (!(shipmentForm.product_ids || []).length) {
        notifyInfo("Selecciona al menos un producto.");
        return;
      }
      try {
        const El = await I(
          shipmentForm.id ? `/shipments/${shipmentForm.id}/` : "/shipments/",
          {
            method: shipmentForm.id ? "PATCH" : "POST",
            body: JSON.stringify({
              client: o.id,
              carrier: N,
              status: String(shipmentForm.status || "PENDING"),
              tracking_number: String(
                shipmentForm.tracking_number || "",
              ).trim(),
              guide_price: A,
              client_price: A,
              shipping_address: String(
                shipmentForm.shipping_address || "",
              ).trim(),
            }),
          },
        );
        await I(`/shipments/${El.id}/set-products/`, {
          method: "POST",
          body: JSON.stringify({
            products: (shipmentForm.product_ids || []).map((vl) => Number(vl)),
          }),
        });
        setShipmentModalOpen(!1);
        setShipmentProductPickerOpen(!1);
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess(shipmentForm.id ? "Envio actualizado." : "Envio creado.");
      } catch (El) {
        console.error("Failed saving shipment", El);
        notifyError((El && El.message) || "No se pudo guardar el envio.");
      }
    },
    openShipmentAssignmentPicker = async (o) => {
      if (!o) return;
      const N = shipments.filter(
        (A) =>
          Number(A.client) === Number(o.client) &&
          Number(A.id) !== Number(o.shipment && o.shipment.id),
      );
      if (!N.length) {
        openShipmentEditor(null, o);
        return;
      }
      const A = await openInputDialog({
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
              ...N.map((vl) => ({
                value: String(vl.id),
                label: `${vl.carrier || "Paqueteria"}${vl.tracking_number ? ` • ${vl.tracking_number}` : ""}`,
              })),
            ],
          },
        ],
      });
      if (!A) return;
      if (A.shipment_id === "__new__") {
        openShipmentEditor(null, o);
        return;
      }
      try {
        const vl = N.find((El) => String(El.id) === String(A.shipment_id));
        if (!vl) throw new Error("Envio no encontrado.");
        await I(`/shipments/${vl.id}/assign-product/`, {
          method: "POST",
          body: JSON.stringify({
            product: o.id,
          }),
        });
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Envio asignado.");
      } catch (vl) {
        console.error("Failed assigning existing shipment", vl);
        notifyError((vl && vl.message) || "No se pudo asignar el envio.");
      }
    },
    deleteShipment = async (o) => {
      if (!o || !o.id) return;
      const N = await confirmAction({
        title: "Eliminar envio",
        message: "Este envio se desvinculara del producto.",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        tone: "danger",
      });
      if (!N) return;
      try {
        await I(`/shipments/${o.id}/`, { method: "DELETE" });
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Envio eliminado.");
      } catch (A) {
        console.error("Failed deleting shipment", A);
        notifyError((A && A.message) || "No se pudo eliminar el envio.");
      }
    },
    shipmentModalClient = Kl.find(
      (o) => String(o.id) === String(shipmentForm.client || ""),
    ),
    shipmentModalProducts = getShipmentAssignableProducts(shipmentForm.client),
    shipmentModalFilteredProducts = shipmentModalProducts.filter((o) => {
      const N = String(shipmentProductSearch || "").trim().toLowerCase();
      if (!N) return !0;
      return [
        o.name,
        o.shopping_name || o.mission_name,
        o.store_name,
        o.client_name,
        o.status,
      ]
        .filter(Boolean)
        .some((A) => String(A).toLowerCase().includes(N));
    }),
    shipmentSelectedProducts = shipmentModalProducts.filter((o) =>
      (shipmentForm.product_ids || []).includes(Number(o.id)),
    ),
    paymentLocalToNumber = (o, N = 0) => {
      const A = parseFloat(o);
      return Number.isFinite(A) ? A : N;
    },
    paymentLocalHasValue = (o) =>
      o !== null && typeof o !== "undefined" && o !== "",
    paymentLocalFormatAmountField = (o) => {
      if (!paymentLocalHasValue(o)) return "";
      const N = paymentLocalToNumber(o, Number.NaN);
      return Number.isFinite(N) ? N.toFixed(2) : String(o);
    },
    paymentLocalProductAmount = (o) => {
      const N = paymentLocalToNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(N)) return N;
      const A = paymentLocalToNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(A) ? A : 0;
    },
    paymentLocalShoppingProducts = (o, N, A = []) => {
      const vl = A instanceof Set
        ? A
        : new Set((A || []).map((Se) => Number(Se)));
      return ((o && o.products) || []).filter(
        (Se) =>
          Number(Se && Se.shopping) === Number(N) &&
          (
            String((Se && Se.status) || "").toUpperCase() === "ANNOTATED" ||
            vl.has(Number(Se && Se.id))
          ),
      );
    },
    paymentLocalProductsTotal = (o = []) =>
      (o || []).reduce((N, A) => N + paymentLocalProductAmount(A), 0),
    paymentLocalRecordProducts = (o = null) =>
      (o && (o.products_detail || [])) || [],
    paymentLocalRecordShoppingId = (o = null) =>
      Number((o && (o.shopping || o.mission)) || 0),
    paymentLocalRecordAmount = (o = null) =>
      paymentLocalToNumber(o && o.amount, 0),
    paymentLocalRecordProductsTotal = (o = null) =>
      paymentLocalHasValue(o && o.products_total)
        ? paymentLocalToNumber(o.products_total, 0)
        : paymentLocalProductsTotal(paymentLocalRecordProducts(o)),
    paymentLocalRecordBalance = (o = null) =>
      paymentLocalHasValue(o && o.balance)
        ? paymentLocalToNumber(o.balance, 0)
        : paymentLocalRecordProductsTotal(o) - paymentLocalRecordAmount(o),
    paymentLocalShoppingPayments = (o, N) =>
      (((o && o.payments) || []).filter(
        (A) => paymentLocalRecordShoppingId(A) === Number(N),
      )).sort(
        (A, vl) =>
          new Date(vl.updated_at || vl.created_at || 0).getTime() -
          new Date(A.updated_at || A.created_at || 0).getTime(),
      ),
    paymentModalClient = Kl.find(
      (o) => String(o.id) === String(paymentForm.client || ""),
    ) || null,
    paymentModalShopping = Al.find(
      (o) => String(o.id) === String(paymentForm.shopping || ""),
    ) || null,
    paymentModalProducts = paymentModalClient && paymentForm.shopping
      ? paymentLocalShoppingProducts(
        paymentModalClient,
        paymentForm.shopping,
        paymentForm.product_ids || [],
      )
      : [],
    paymentReservedProductIds = paymentModalClient && paymentForm.shopping
      ? paymentLocalShoppingPayments(paymentModalClient, paymentForm.shopping).reduce(
        (o, N) => {
          if (Number(N.id) === Number(paymentForm.id || 0)) return o;
          paymentLocalRecordProducts(N).forEach((A) => {
            o.add(Number(A.id));
          });
          return o;
        },
        new Set(),
      )
      : new Set(),
    paymentFilteredProducts = paymentModalProducts.filter((o) => {
      const N = String(paymentProductSearch || "").trim().toLowerCase();
      if (!N) return !0;
      return [
        o.name,
        o.shopping_name || o.mission_name,
        o.store_name,
        o.status,
      ]
        .filter(Boolean)
        .some((A) => String(A).toLowerCase().includes(N));
    }),
    paymentSelectedProducts = paymentModalProducts.filter((o) =>
      (paymentForm.product_ids || []).includes(Number(o.id)),
    ),
    paymentSelectedProductsTotal = paymentLocalProductsTotal(paymentSelectedProducts),
    paymentFormAmountValue = paymentLocalToNumber(paymentForm.amount, 0),
    paymentFormBalance = paymentSelectedProductsTotal - paymentFormAmountValue,
    getDefaultPaymentProductIds = (o, N) =>
      paymentLocalShoppingProducts(o, N)
        .filter((A) => !paymentLocalShoppingPayments(o, N).some((vl) =>
          paymentLocalRecordProducts(vl).some((El) => Number(El.id) === Number(A.id)),
        ))
        .map((A) => Number(A.id)),
    openPaymentModal = (o, N = null, A = null) => {
      const vl = Number(
        (A && (A.shopping || A.mission)) ||
        (N && N.id) ||
        (N || (w && w.id) || 0),
      );
      if (!o || !vl) {
        notifyInfo("Selecciona cliente y shopping.");
        return;
      }
      const El = paymentLocalShoppingPayments(o, vl),
        Se = A || El[0] || null,
        ea = Se
          ? paymentLocalRecordProducts(Se).map((gl) => Number(gl.id))
          : getDefaultPaymentProductIds(o, vl),
        gl = new Set(ea),
        ae = paymentLocalProductsTotal(
          paymentLocalShoppingProducts(o, vl, gl).filter((oi) =>
            gl.has(Number(oi.id)),
          ),
        ),
        oi = ae > 0 ? ae.toFixed(2) : "",
        Pi = paymentLocalFormatAmountField(Se && Se.amount),
        bi = Pi !== "" && Pi !== oi;
      setPaymentForm({
        id: (Se && Se.id) || null,
        client: String(o.id),
        shopping: String(vl),
        amount: bi ? Pi : (Pi || oi),
        note: (Se && Se.note) || "",
        product_ids: ea,
      });
      setPaymentAmountManual(bi);
      setPaymentProductSearch("");
      setPaymentModalOpen(!0);
    },
    togglePaymentProductSelection = (o) => {
      if (!o) return;
      if (paymentReservedProductIds.has(Number(o.id))) return;
      setPaymentForm((N) => {
        const A = Number(o.id);
        const vl = (N.product_ids || []).includes(A)
          ? (N.product_ids || []).filter((El) => Number(El) !== A)
          : [...(N.product_ids || []), A];
        return { ...N, product_ids: vl };
      });
    },
    savePayment = async () => {
      const o = Kl.find((A) => String(A.id) === String(paymentForm.client || ""));
      const N = Al.find((A) => String(A.id) === String(paymentForm.shopping || ""));
      const A = String(paymentForm.amount || "").trim();
      if (!o || !N) {
        notifyInfo("Selecciona cliente y shopping.");
        return;
      }
      if (A === "" || !Number.isFinite(parseFloat(A))) {
        notifyInfo("Captura un monto valido.");
        return;
      }
      setPaymentSaving(!0);
      try {
        await I(
          paymentForm.id ? `/payments/${paymentForm.id}/` : "/payments/",
          {
            method: paymentForm.id ? "PATCH" : "POST",
            body: JSON.stringify({
              client: o.id,
              shopping: N.id,
              amount: paymentLocalToNumber(A, 0).toFixed(2),
              note: String(paymentForm.note || "").trim(),
              products: (paymentForm.product_ids || []).map((vl) => Number(vl)),
            }),
          },
        );
        setPaymentModalOpen(!1);
        setPaymentAmountManual(!1);
        setPaymentProductSearch("");
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess(paymentForm.id ? "Pago actualizado." : "Pago guardado.");
      } catch (vl) {
        console.error("Failed saving payment", vl);
        notifyError((vl && vl.message) || "No se pudo guardar el pago.");
      } finally {
        setPaymentSaving(!1);
      }
    },
    deletePayment = async (o) => {
      if (!o || !o.id) return;
      const N = await confirmAction({
        title: "Eliminar pago",
        message: "Este pago se quitara del historial del cliente.",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        tone: "danger",
      });
      if (!N) return;
      try {
        await I(`/payments/${o.id}/`, { method: "DELETE" });
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Pago eliminado.");
      } catch (A) {
        console.error("Failed deleting payment", A);
        notifyError((A && A.message) || "No se pudo eliminar el pago.");
      }
    },
    exportMissionCsv = (o) => {
      const N = (ae) => `"${String(ae ?? "").replaceAll('"', '""')}"`,
        A = ["Cliente", "Producto", "Store Price (USD)", "Final Price (MXN)", "Status", "Tienda", "Tags"].join(","),
        vl = (o.clients_detail || []).flatMap((El) =>
          (El.products || [])
            .filter((Se) => Se.shopping === o.id)
            .map((Se) =>
              [
                N(El.name),
                N(Se.name),
                N(Se.real_price),
                N(Se.charged_price),
                N(Se.status),
                N((stores.find((ea) => ea.id === Se.store) || {}).name || ""),
                N(Se.tags || ""),
              ].join(","),
            ),
        ),
        El = [A, ...vl].join("\n"),
        Se = new Blob([El], { type: "text/csv;charset=utf-8;" }),
        ea = URL.createObjectURL(Se),
        gl = document.createElement("a");
      (gl.href = ea,
        gl.download = `mission_${o.id}_desglose.csv`,
        document.body.appendChild(gl),
        gl.click(),
        document.body.removeChild(gl),
        URL.revokeObjectURL(ea));
    },
    getRelativeTime = (o) => {
      const N = new Date(o).getTime();
      if (!Number.isFinite(N)) return "ahora";
      const
        A = Math.floor((Date.now() - N) / 1000);
      if (!Number.isFinite(A) || A < 0) return "ahora";
      if (A < 60) return `hace ${A}s`;
      const vl = Math.floor(A / 60);
      if (vl < 60) return `hace ${vl} min`;
      const El = Math.floor(vl / 60);
      if (El < 24) return `hace ${El} h`;
      const Se = Math.floor(El / 24);
      return `hace ${Se} d`;
    },
    getMissionStoreLabel = (o) =>
      o ? o.store_name || o.name || `Tienda #${o.id}` : "",
    normalizeSearchText = (o) =>
      String(o || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, " ")
        .trim(),
    getSearchTokens = (o) =>
      normalizeSearchText(o)
        .split(" ")
        .map((N) => N.trim())
        .filter(Boolean),
    getMissionSearchBlob = (o) => {
      if (!o) return "";
      const N = o.start_time ? new Date(o.start_time) : null;
      const A = N && !Number.isNaN(N.getTime())
        ? [
            N.toLocaleDateString("es-MX"),
            N.toLocaleDateString("en-US"),
            N.toLocaleDateString("es-MX", { month: "long" }),
            N.toLocaleDateString("es-MX", { month: "short" }),
            N.toLocaleDateString("en-US", { month: "long" }),
            N.toLocaleDateString("en-US", { month: "short" }),
            `${N.getDate()} ${N.toLocaleDateString("es-MX", { month: "long" })}`,
            `${N.getDate()} ${N.toLocaleDateString("en-US", { month: "long" })}`,
            `${String(N.getMonth() + 1).padStart(2, "0")}-${String(N.getDate()).padStart(2, "0")}`,
            `${String(N.getDate()).padStart(2, "0")}-${String(N.getMonth() + 1).padStart(2, "0")}`,
            `${String(N.getMonth() + 1).padStart(2, "0")}/${String(N.getDate()).padStart(2, "0")}`,
            `${String(N.getDate()).padStart(2, "0")}/${String(N.getMonth() + 1).padStart(2, "0")}`,
            `${N.getFullYear()}-${String(N.getMonth() + 1).padStart(2, "0")}-${String(N.getDate()).padStart(2, "0")}`,
          ]
        : [];
      return normalizeSearchText(
        [
          o.name,
          o.store_name,
          getMissionStoreLabel(o),
          ...A,
        ].join(" "),
      );
    },
    recommendedStoreNames = storeRecommendations.map((o) =>
      String(o.store_name || "").trim().toLowerCase(),
    ),
    recommendedMissionStores = storeRecommendations.map((o) => {
      const N = stores.find((A) => Number(A.id) === Number(o.store));
      return {
        id: N ? N.id : `store-recommendation-${o.id}`,
        store_id: o.store,
        name: (N && N.name) || o.store_name,
        recommendation_id: o.id,
      };
    }),
    latestRecommendedMissionStore =
      recommendedMissionStores.length > 0 ? recommendedMissionStores[0] : null,
    orderedMissionStores = recommendedMissionStores,
    filteredMissionStoreSuggestions = (() => {
      const o = String(missionStartForm.store_name || "").trim().toLowerCase();
      if (!o) {
        const N = latestRecommendedMissionStore
          ? [latestRecommendedMissionStore]
          : [];
        const A = orderedMissionStores.filter(
          (vl) => !latestRecommendedMissionStore || Number(vl.id) !== Number(latestRecommendedMissionStore.id),
        );
        return [...N, ...A].slice(0, 8);
      }
      return recommendedMissionStores.filter((A) =>
        String(A.name || "").toLowerCase().includes(o),
      ).slice(0, 8);
    })(),
    recommendedShippingCarriers = shippingCarrierRecommendations.map((o) => ({
      id: o.id,
      name: String(o.name || "").trim(),
      recommendation_id: o.id,
    })),
    latestShippingCarrierRecommendation =
      recommendedShippingCarriers.length > 0
        ? recommendedShippingCarriers[0]
        : null,
    filteredShippingCarrierSuggestions = (() => {
      const o = String(shipmentForm.carrier || "").trim().toLowerCase();
      if (!o) {
        const N = latestShippingCarrierRecommendation
          ? [latestShippingCarrierRecommendation]
          : [];
        const A = recommendedShippingCarriers.filter(
          (vl) =>
            !latestShippingCarrierRecommendation ||
            Number(vl.id) !== Number(latestShippingCarrierRecommendation.id),
        );
        return [...N, ...A].slice(0, 8);
      }
      return recommendedShippingCarriers.filter((A) =>
        String(A.name || "").toLowerCase().includes(o),
      ).slice(0, 8);
    })(),
    findStoreByName = (o) =>
      stores.find(
        (N) =>
          N.name.toLowerCase().trim() === String(o || "").toLowerCase().trim(),
      ) || null,
    removeStoreRecommendation = async (o, N = "") => {
      try {
        await I(`/store-recommendations/${o}/`, { method: "DELETE" });
        setStoreRecommendations((A) => A.filter((vl) => Number(vl.id) !== Number(o)));
        notifySuccess(
          `Se quitó${N ? ` ${N}` : ""} de recomendaciones.`,
        );
      } catch (A) {
        console.error("Failed deleting store recommendation", A);
        notifyError("No se pudo quitar la tienda de recomendaciones.");
      }
    },
    clearNewRequestImage = () => {
      (setNewRequestImageFile(null), setNewRequestImagePreview(""));
    },
    clearEditingRequestImage = () => {
      (setEditingRequestImageFile(null), setEditingRequestImagePreview(""));
    },
    pickRequestImage = () => {
      openSingleImagePicker(handleRequestImageSelection);
    },
    pickEditingRequestImage = () => {
      if (editingRequestSaving) return;
      openSingleImagePicker(handleEditingRequestImageSelection);
    },
    handleRequestImageSelection = (o) => {
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = URL.createObjectURL(N[0]);
      (setNewRequestImageFile(N[0]), setNewRequestImagePreview(A), (o.target.value = ""));
    },
    handleEditingRequestImageSelection = (o) => {
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = URL.createObjectURL(N[0]);
      (setEditingRequestImageFile(N[0]),
        setEditingRequestImagePreview(A),
        (o.target.value = ""));
    },
    createMissionRequest = async () => {
      const o = newRequestText.trim();
      if (!o && !newRequestImageFile) return;
      const Nl = new FormData();
      Nl.append("description", o || "Pendiente con foto");
      Nl.append("status", "PENDING");
      const Se = String(newRequestClientId || W && W.id || "").trim();
      Se && Nl.append("client", Se);
      newRequestImageFile && Nl.append("image", newRequestImageFile);
      try {
        const N = await I("/requests/", {
          method: "POST",
          body: Nl,
        });
        if (N && N.id) {
          setRequests((A) => [N, ...A.filter((vl) => vl.id !== N.id)]);
        } else {
          await reloadMissionRequests();
        }
        (setNewRequestText(""),
          setNewRequestClientId(""),
          setNewRequestClientPickerOpen(!1),
          setNewRequestClientSearch(""),
          clearNewRequestImage());
      } catch (N) {
        (console.error("Failed creating request", N),
          notifyError(`No se pudo crear la petición. ${N.message || ""}`.trim()));
      }
    },
    updateMissionRequest = async (o, N, A = {}) => {
      const vl = requests;
      setRequests((El) =>
        El.map((Se) =>
          Se.id === o ? { ...Se, status: N, ...A, updated_at: new Date().toISOString() } : Se,
        ),
      );
      try {
        const El = await I(getMissionRequestDetailPath(o), {
          method: "PATCH",
          body: JSON.stringify({ status: N, ...A }),
        });
        if (!El || typeof El !== "object" || typeof El.id === "undefined")
          throw new Error("Respuesta invalida al actualizar la peticion.");
        setRequests((Se) => Se.map((ea) => (ea.id === o ? El : ea)));
      } catch (El) {
        (setRequests(vl),
          console.error("Failed updating request", El),
          notifyError(`No se pudo actualizar la petición. ${El.message || ""}`.trim()));
      }
    },
    startRequestModify = (o) => {
      (setEditingRequestId(o.id),
        setEditingRequestText(o.description || ""),
        setEditingRequestClientId(o.client ? String(o.client) : ""),
        setEditingRequestClientPickerOpen(!1),
        setEditingRequestClientSearch(""),
        setEditingRequestImageFile(null),
        setEditingRequestImagePreview(o.image ? resolveMediaUrl(o.image) : ""));
    },
    cancelRequestModify = () => {
      (setEditingRequestId(null),
        setEditingRequestText(""),
        setEditingRequestClientId(""),
        setEditingRequestClientPickerOpen(!1),
        setEditingRequestClientSearch(""),
        setEditingRequestSaving(!1),
        clearEditingRequestImage());
    },
    saveRequestModify = async (o) => {
      const N = editingRequestText.trim();
      if (!N) return;
      const A = new FormData();
      A.append("description", N);
      A.append("note", N);
      A.append("status", "MODIFIED");
      A.append("client", editingRequestClientId ? String(editingRequestClientId) : "");
      editingRequestImageFile && A.append("image", editingRequestImageFile);
      setEditingRequestSaving(!0);
      try {
        const vl = await I(getMissionRequestDetailPath(o.id), {
          method: "PATCH",
          body: A,
        });
        if (!vl || typeof vl !== "object" || typeof vl.id === "undefined")
          throw new Error("Respuesta invalida al modificar la peticion.");
        (setRequests((El) => El.map((Se) => (Se.id === o.id ? vl : Se))),
          cancelRequestModify());
      } catch (vl) {
        (console.error("Failed modifying request", vl),
          notifyError(`No se pudo modificar la petición. ${vl.message || ""}`.trim()));
      } finally {
        setEditingRequestSaving(!1);
      }
    },
    deleteMissionRequest = async (o) => {
      if (
        !(await confirmAction({
          title: "Eliminar petición",
          message: "¿Eliminar esta petición? Esta acción no se puede deshacer.",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      const N = requests;
      setRequests((A) => A.filter((vl) => vl.id !== o));
      try {
        await I(getMissionRequestDetailPath(o), { method: "DELETE" });
      } catch (A) {
        (setRequests(N),
          console.error("Failed deleting request", A),
          notifyError(`No se pudo eliminar la petición. ${A.message || ""}`.trim()));
      }
    },
    // <-------- seccion 7: utilidades de revisiones y alternativas
    refreshProductReviews = async (o = W && W.id) => {
      if (!o) return;
      try {
        const N = await I(`/reviews/?client=${o}`);
        setProductReviews(N || []);
      } catch (N) {
        console.error("Failed refreshing product reviews", N);
      }
    },
    createProductReview = async (o) => {
      if (!o || X === "PS") return;
      const Nl = (productReviews || []).find(
        (N) =>
          N.product === o.id &&
          (N.status === "PENDING" || N.status === "ALTERNATIVE_SENT"),
      );
      if (Nl) {
        notifyInfo("Este producto ya tiene una revision activa.");
        return;
      }
      const N = await openInputDialog({
        title: "Nueva revision para PS",
        message: "Describe lo que PS necesita revisar en este producto.",
        confirmLabel: "Enviar",
        fields: [
          {
            name: "review_note",
            label: "Nota",
            type: "textarea",
            value: "",
            placeholder: "Nota de revision para PS",
            required: !0,
            requiredMessage: "Escribe una nota de revision.",
          },
          {
            name: "review_type",
            label: "Tipo",
            type: "select",
            value: "CHECK_OTHER",
            options: [
              { value: "CHECK_SIZE", label: "Verificar talla/tamaño" },
              { value: "CHECK_STOCK", label: "Verificar existencia" },
              { value: "CHECK_OTHER", label: "Otro" },
            ],
          },
        ],
      });
      if (!N) return;
      const A = String(N.review_note || "").trim();
      if (!A) return;
      const vl = ["CHECK_SIZE", "CHECK_STOCK", "CHECK_OTHER"].includes(
        N.review_type,
      )
        ? N.review_type
        : "CHECK_OTHER";
      try {
        await I("/reviews/", {
          method: "POST",
          body: JSON.stringify({
            product: o.id,
            review_note: A,
            review_type: vl,
            status: "PENDING",
          }),
        });
        await refreshProductReviews(o.client);
        setMissionReviewAlerts((El) => [
          {
            id: `tmp-${Date.now()}`,
            product: o.id,
            status: "PENDING",
            review_note: A,
          },
          ...El,
        ]);
      } catch (El) {
        console.error("Failed creating product review", El);
      }
    },
    updateProductReviewAction = async (o, N, A = {}) => {
      if (!o) return null;
      try {
        const vl = await I(`/reviews/${o.id}/${N}/`, {
          method: "POST",
          body: JSON.stringify(A),
        });
        await refreshProductReviews(W && W.id);
        await Qt();
        return vl;
      } catch (vl) {
        console.error("Failed updating review action", vl);
        return null;
      }
    },
    openProductConversation = (o, N = null) => {
      if (!o && !N) return;
      const A = N || (o && latestReviewsByProduct[o.id]) || null,
        vl = o || (A && W && (W.products || []).find((El) => Number(El.id) === Number(A.product))) || null,
        El = getUnifiedReviewState(getProductReviewState(vl, A));
      const Se = vl ? String(latestReviewMessageTokenByProduct[vl.id] || "") : "";
      setOpenProductInfoId(null),
        setOpenProductMenuId(null),
        Se &&
          vl &&
          setSeenReviewItemMap((ea) => ({ ...ea, [vl.id]: Se })),
        A &&
          A.id &&
          I(`/reviews/${A.id}/mark-seen/`, {
            method: "POST",
            body: JSON.stringify({}),
          }).catch((ea) => {
            console.error("Failed marking review conversation as seen", ea);
          }),
        setReviewConversationEntry({ review: A, product: vl }),
        setAltUploadReviewId(A ? A.id : null),
        setAltUploadProductId(vl ? vl.id : A && A.product ? A.product : null),
        setAltUploadTargetStatus(El),
        setAltUploadDescription(""),
        setAltUploadFiles([]);
    },
    closeAlternativeUploadModal = () => {
      (setAltUploadReviewId(null),
        setAltUploadProductId(null),
        setAltUploadTargetStatus(""),
        setAltUploadDescription(""),
        setAltUploadFiles([]));
    },
    sendReviewAlternatives = async (o = {}) => {
      if (!altUploadReviewId && !altUploadProductId) return;
      const Nl =
          W && (W.products || []).find((A) => Number(A.id) === Number(altUploadProductId)),
        N =
          altUploadReviewId && latestReviewsByProduct[altUploadProductId]
            ? latestReviewsByProduct[altUploadProductId]
            : null,
        A = String(altUploadDescription || "").trim();
      if (!Nl) {
        notifyError("No se encontro el producto para aplicar el cambio.");
        return;
      }
      try {
        await syncProductReviewState(
          Nl,
          N,
          altUploadTargetStatus ||
            getUnifiedReviewState(getProductReviewState(Nl, N)),
          A,
          altUploadFiles,
        );
        await refreshProductReviews(W && W.id);
        await Qt();
        o.closeAfterSave !== !1
          ? closeAlternativeUploadModal()
          : (setAltUploadDescription(""), setAltUploadFiles([]));
      } catch (N) {
        console.error("Failed saving product status change", N);
        notifyError("No se pudo guardar el cambio de estado del producto.");
      }
    },
    selectReviewAlternative = async (o, N) => {
      if (!o || !N) return;
      try {
        await I(`/reviews/${o.id}/select-alternative/${N.id}/`, {
          method: "POST",
          body: JSON.stringify({}),
        });
        await refreshProductReviews(W && W.id);
        await Qt();
      } catch (A) {
        console.error("Failed selecting alternative", A);
      }
    },
    keepOriginalProduct = async (o) => {
      await updateProductReviewAction(o, "keep-original");
    },
    discardReviewedProduct = async (o) => {
      await updateProductReviewAction(o, "discard");
    },
    sendProductToPs = async (o, N = null) => {
      if (!o || X === "PS") return;
      if (N) {
        await resendReviewToPs(N);
        return;
      }
      await createProductReview(o);
    },
    sendProductToAv = (o) => {
      if (!o || X !== "PS") return;
      openProductConversation(
        o,
        latestReviewsByProduct[o.id] || null,
      );
    },
    markProductAnnotated = async (o, N = null) => {
      if (!o) return;
      if (X === "PS" && N && N.status === "PENDING") {
        await updateProductReviewAction(N, "confirm");
        return;
      }
      if (X !== "PS" && N) {
        await keepOriginalProduct(N);
        return;
      }
      await setProductStatusQuick(o.id, "ANNOTATED");
    },
    markProductRejected = async (o, N = null) => {
      if (!o) return;
      if (X === "PS" && N && N.status === "PENDING") {
        await updateProductReviewAction(N, "no-stock");
        return;
      }
      if (X !== "PS" && N) {
        await discardReviewedProduct(N);
        return;
      }
      await setProductStatusQuick(o.id, "REJECTED");
    },
    resendReviewToPs = async (o) => {
      if (!o) return;
      const N = await openInputDialog({
        title: "Reenviar a PS",
        message: "Puedes ajustar la nota antes de reenviar.",
        confirmLabel: "Reenviar",
        fields: [
          {
            name: "review_note",
            label: "Nota",
            type: "textarea",
            value: o.review_note || "",
            placeholder: "Nota para PS (opcional)",
          },
        ],
      });
      if (!N) return;
      try {
        await I(`/reviews/${o.id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "PENDING",
            review_note: String(
              N.review_note || o.review_note || "",
            ).trim(),
          }),
        });
        o.product &&
          (await I(`/products/${o.product}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "IN_REVIEW" }),
          }));
        await refreshProductReviews(W && W.id);
        await Qt();
      } catch (A) {
        console.error("Failed resending review", A);
      }
    },
    Rt = Kl.filter((o) => String(o.status || "").toLowerCase() === "active");
  const toNumber = (o, N = 0) => {
      const A = parseFloat(o);
      return Number.isFinite(A) ? A : N;
    },
    hasValue = (o) => o !== null && typeof o !== "undefined" && o !== "",
    amountFormatter = new Intl.NumberFormat("es-MX", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    formatAmount = (o) => amountFormatter.format(toNumber(o, 0)),
    getHomeVisibleProducts = (o) =>
      (o.products || []).filter(
        (N) =>
          N.shopping !== null &&
          typeof N.shopping !== "undefined" &&
          N.status !== "IN_REVIEW" &&
          N.status !== "REJECTED",
      ),
    getHomeClientTotals = (o) =>
      o.reduce(
        (N, A) => ({
          usd: N.usd + toNumber(A.real_price, 0),
          sale: N.sale + toNumber(A.charged_price, 0),
        }),
        { usd: 0, sale: 0 },
      ),
    getHomeClientMissionTotals = (o, missionId) =>
      (o || []).filter(A => A.shopping === missionId).reduce(
        (N, A) => ({
          usd: N.usd + toNumber(A.real_price, 0),
          sale: N.sale + toNumber(A.charged_price, 0),
        }),
        { usd: 0, sale: 0 },
      ),
    getHomeClientMissionAnnotatedTotals = (o, missionId) =>
      (o || [])
        .filter(
          (A) =>
            Number(A && A.shopping) === Number(missionId) &&
            String((A && A.status) || "").toUpperCase() === "ANNOTATED",
        )
        .reduce(
          (N, A) => ({
            usd: N.usd + toNumber(A.real_price, 0),
            sale: N.sale + toNumber(A.charged_price, 0),
          }),
          { usd: 0, sale: 0 },
        ),
    getProductPaymentAmount = (o) => {
      const N = toNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(N)) return N;
      const A = toNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(A) ? A : 0;
    },
    getClientShoppingProducts = (o, N) =>
      ((o && o.products) || []).filter(
        (A) =>
          Number(A && A.shopping) === Number(N) &&
          String(A && A.status || "").toUpperCase() !== "REJECTED",
      ),
    getPaymentProductsTotal = (o = []) =>
      (o || []).reduce((N, A) => N + getProductPaymentAmount(A), 0),
    getPaymentRecordProducts = (o = null) => (o && (o.products_detail || [])) || [],
    getPaymentRecordShoppingId = (o = null) =>
      Number((o && (o.shopping || o.mission)) || 0),
    getPaymentRecordAmount = (o = null) => toNumber(o && o.amount, 0),
    getPaymentRecordProductsTotal = (o = null) =>
      hasValue(o && o.products_total)
        ? toNumber(o.products_total, 0)
        : getPaymentProductsTotal(getPaymentRecordProducts(o)),
    getPaymentRecordBalance = (o = null) =>
      hasValue(o && o.balance)
        ? toNumber(o.balance, 0)
        : getPaymentRecordProductsTotal(o) - getPaymentRecordAmount(o),
    getClientShoppingPayments = (o, N) =>
      (((o && o.payments) || []).filter(
        (A) => getPaymentRecordShoppingId(A) === Number(N),
      )).sort(
        (A, vl) =>
          new Date(vl.updated_at || vl.created_at || 0).getTime() -
          new Date(A.updated_at || A.created_at || 0).getTime(),
      ),
    getClientShoppingPaymentProducts = (o, N) => {
      const A = new Map();
      getClientShoppingPayments(o, N).forEach((vl) => {
        getPaymentRecordProducts(vl).forEach((El) => {
          const Se = Number(El && El.id);
          Number.isFinite(Se) && !A.has(Se) && A.set(Se, El);
        });
      });
      return Array.from(A.values());
    },
    getClientShoppingPaymentSummary = (o, N) => {
      const A = getClientShoppingPayments(o, N).reduce(
          (vl, El) => vl + getPaymentRecordAmount(El),
          0,
        ),
        vl = getPaymentProductsTotal(getClientShoppingPaymentProducts(o, N));
      return {
        amount: A,
        productsTotal: vl,
        balance: vl - A,
      };
    },
    parseVisualTag = (o) => {
      const N = String(o || "").trim();
      if (!N) return null;
      if (/^PS\s*[:\-]/i.test(N))
        return { label: N.replace(/^PS\s*[:\-]\s*/i, "").trim() || "PS", type: "PS" };
      if (/^AV\s*[:\-]/i.test(N))
        return { label: N.replace(/^AV\s*[:\-]\s*/i, "").trim() || "AV", type: "AV" };
      return { label: N, type: "GEN" };
    },
    getTagClassName = (o) =>
      o === "PS"
        ? "bg-blue-600/92 text-white border border-blue-300/80 shadow-sm"
        : o === "AV"
          ? "bg-emerald-600/92 text-white border border-emerald-300/80 shadow-sm"
          : "bg-white/92 text-gray-800 border border-white shadow-sm",
    getProductStatusLabel = (o, N = null) =>
      o === "REJECTED"
        ? "Rechazado"
        : o === "IN_REVIEW"
          ? "Revision"
          : o === "SHIPPED"
            ? "Enviado"
            : "Anotado",
    getUnifiedReviewState = (o) =>
      o === "PS_REVIEW" || o === "AV_REVIEW" ? "REVIEW" : o,
    getProductReviewState = (o, N = null) =>
      o && o.status === "REJECTED"
        ? "REJECTED"
        : o && o.status === "SHIPPED"
          ? "SHIPPED"
          : o && o.status === "IN_REVIEW"
            ? N && (N.status === "ALTERNATIVE_SENT" || N.status === "NO_STOCK")
              ? "AV_REVIEW"
              : "PS_REVIEW"
            : "ANNOTATED",
    getLatestReviewMessageToken = (o = null) => {
      if (!o || !(o.messages || []).length) return "";
      const N = [...(o.messages || [])]
        .sort(
          (A, vl) =>
            new Date(vl.created_at || 0).getTime() -
            new Date(A.created_at || 0).getTime(),
        )[0];
      if (!N) return "";
      return `REVIEW:${N.created_at || ""}`;
    },
    getReviewActivityTime = (o = null) => {
      if (!o) return 0;
      const N = [...(o.messages || [])].reduce((A, vl) => {
        const El = new Date(vl.created_at || 0).getTime();
        return Number.isFinite(El) && El > A ? El : A;
      }, 0);
      if (N > 0) return N;
      const A = new Date(o.updated_at || o.created_at || 0).getTime();
      return Number.isFinite(A) ? A : 0;
    },
    isReviewTokenUnread = (o, N) => {
      const A = String(o || ""),
        vl = String(N || "");
      if (!A.startsWith("REVIEW")) return !1;
      if (!vl) return !0;
      if (!vl.startsWith("REVIEW")) return !0;
      const El = A.split(":")[1] || "",
        Se = vl.split(":")[1] || "";
      if (!El) return !1;
      if (!Se) return !0;
      return new Date(El).getTime() > new Date(Se).getTime();
    },
    getServerSeenReviewToken = (o = null) => {
      if (!o) return "";
      const N = o.current_user_last_seen_message_at || "";
      return N ? `REVIEW:${N}` : "";
    },
    getHomeClientReviewState = (o = [], N = {}) => {
      const A = (o || []).filter(
        (vl) => vl && vl.status !== "REJECTED" && vl.status !== "SHIPPED",
      );
      if (
        A.some((vl) => {
          const El = N[vl.id];
          return !!El && (El.status === "ALTERNATIVE_SENT" || El.status === "NO_STOCK");
        })
      )
        return "REVIEW";
      if (
        A.some((vl) => {
          const El = N[vl.id];
          return vl.status === "IN_REVIEW" && (!El || El.status === "PENDING");
        })
      )
        return "REVIEW";
      return "ANNOTATED";
    },
    getHomeClientReviewLabel = (o) =>
      o === "REVIEW"
        ? "Revision"
          : "Anotado",
    getChatStatusActionOptions = (o) => {
      const N = ["ANNOTATED", "REVIEW", "REJECTED"];
      return N.filter((A) => A !== o).map((A) => ({
        value: A,
        label: getReviewFlowLabel(A),
      }));
    },
    getHomeClientReviewTone = (o, N = !1) =>
      `${N ? "" : "opacity-78 "} ${
        o === "REVIEW"
          ? "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800"
          : "bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/35 dark:text-emerald-200 dark:border-emerald-800"
      }`,
    getReviewFlowLabel = (o) =>
      o === "PS_REVIEW" || o === "AV_REVIEW" || o === "REVIEW"
        ? "Revision"
          : o === "REJECTED"
            ? "Rechazado"
            : "Anotado",
    syncProductReviewState = async (o, N = null, A, vl = "", El = []) => {
      if (!o) return;
      const Se = String(vl || "").trim();
      const hasMessagePayload = !!Se || (El || []).length > 0;
      const previousState = getUnifiedReviewState(getProductReviewState(o, N));
      const effectiveTarget =
        A === "REVIEW"
          ? N && (N.status === "ALTERNATIVE_SENT" || N.status === "NO_STOCK")
            ? "AV_REVIEW"
            : "PS_REVIEW"
          : A;
      const targetState = getUnifiedReviewState(effectiveTarget);
      let ea = N || null;
      if (effectiveTarget === "ANNOTATED") {
        if (!ea && hasMessagePayload)
          ea = await I("/reviews/", {
            method: "POST",
            body: JSON.stringify({
              product: o.id,
              review_note: "Producto marcado como anotado.",
              review_type: "CHECK_OTHER",
              status: "PENDING",
            }),
          });
        if (ea) await I(`/reviews/${ea.id}/keep-original/`, { method: "POST", body: JSON.stringify({ ps_response: Se || null }) });
        else if (o.status !== "ANNOTATED")
          await I(`/products/${o.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "ANNOTATED" }),
          });
      } else if (effectiveTarget === "PS_REVIEW") {
        if (ea) {
          await I(`/reviews/${ea.id}/`, {
            method: "PATCH",
            body: JSON.stringify({
              status: "PENDING",
              review_note: String(Se || ea.review_note || "Revision enviada a PS.").trim(),
            }),
          });
          if (o.status !== "IN_REVIEW")
            await I(`/products/${o.id}/`, {
              method: "PATCH",
              body: JSON.stringify({ status: "IN_REVIEW" }),
            });
        } else
          ea = await I("/reviews/", {
            method: "POST",
            body: JSON.stringify({
              product: o.id,
              review_note: "Revision enviada a PS.",
              review_type: "CHECK_OTHER",
              status: "PENDING",
            }),
          });
      } else if (effectiveTarget === "AV_REVIEW") {
        if (ea) {
          await I(`/reviews/${ea.id}/`, {
            method: "PATCH",
            body: JSON.stringify({
              status: "ALTERNATIVE_SENT",
              ps_response: Se || null,
            }),
          });
        } else
          ea = await I("/reviews/", {
            method: "POST",
            body: JSON.stringify({
              product: o.id,
              review_note: "Revision enviada a AV.",
              review_type: "CHECK_OTHER",
              status: "ALTERNATIVE_SENT",
            }),
          });
      } else if (effectiveTarget === "REJECTED") {
        if (!ea && hasMessagePayload)
          ea = await I("/reviews/", {
            method: "POST",
            body: JSON.stringify({
              product: o.id,
              review_note: "Producto rechazado.",
              review_type: "CHECK_OTHER",
              status: "PENDING",
            }),
          });
        if (ea) await I(`/reviews/${ea.id}/discard/`, { method: "POST", body: JSON.stringify({ ps_response: Se || null }) });
        else if (o.status !== "REJECTED")
          await I(`/products/${o.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "REJECTED" }),
          });
      }
      if (ea && (Se || (El || []).length > 0)) {
        const gl = new FormData();
        Se && gl.append("message", Se);
        previousState &&
          targetState &&
          previousState !== targetState &&
          gl.append("from_status", previousState);
        targetState && gl.append("to_status", targetState);
        (El || []).forEach((ae) => gl.append("files", ae));
        await I(`/reviews/${ea.id}/send-message/`, {
          method: "POST",
          body: gl,
        });
      }
    },
    modalComputedFinalPrice = computeProductModalFinalPrice(st.real_price),
    modalHasRequiredPrices = !getProductModalPriceError(st),
    sectionStageClass =
      sectionTransitionStage === "out"
        ? "ui-section-stage ui-section-stage-out"
        : sectionTransitionStage === "in"
          ? "ui-section-stage ui-section-stage-in"
          : "ui-section-stage",
    productStoreInputClass =
      "w-full px-3 py-2 border rounded-xl border-sky-200 bg-sky-50/80 dark:bg-sky-950/20 dark:border-sky-800 text-sky-900 dark:text-sky-100 font-semibold caret-sky-900 dark:caret-sky-100 focus:ring-2 focus:ring-sky-300 outline-none",
    productFinalInputClass =
      "w-full px-3 py-2 border rounded-xl border-emerald-200 bg-emerald-50/85 dark:bg-emerald-950/20 dark:border-emerald-800 text-emerald-800 dark:text-emerald-100 font-bold caret-emerald-800 dark:caret-emerald-100 focus:ring-2 focus:ring-emerald-300 outline-none",
    productCalcInputClass =
      "calc-input w-full border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 text-fuchsia-700 dark:text-fuchsia-200 caret-fuchsia-700 dark:caret-fuchsia-200 font-semibold focus:ring-2 focus:ring-primary outline-none",
    productCalcCompactInputClass =
      "calc-input w-full border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 text-fuchsia-700 dark:text-fuchsia-200 caret-fuchsia-700 dark:caret-fuchsia-200 font-semibold focus:ring-2 focus:ring-primary outline-none",
    filteredStores = stores
      .filter((o) =>
        o.name.toLowerCase().includes(storeSearch.trim().toLowerCase()),
      )
      .sort((o, N) => o.name.localeCompare(N.name)),
    latestReviewsByProduct = (productReviews || []).reduce((o, N) => {
      if (!N.product) return o;
      const A = o[N.product];
      if (!A) {
        o[N.product] = N;
        return o;
      }
      const vl = getReviewActivityTime(N),
        El = getReviewActivityTime(A);
      vl >= El && (o[N.product] = N);
      return o;
    }, {}),
    latestMissionReviewsByProduct = [...(missionReviewAlerts || []), ...(productReviews || [])].reduce(
      (o, N) => {
        if (!N || !N.product) return o;
        const A = o[N.product];
        if (!A) {
          o[N.product] = N;
          return o;
        }
        const vl = getReviewActivityTime(N),
          El = getReviewActivityTime(A);
        vl >= El && (o[N.product] = N);
        return o;
      },
      {},
    ),
    latestReviewMessageTokenByProduct = [...(missionReviewAlerts || []), ...(productReviews || [])].reduce(
      (o, N) => {
        if (!N || !N.product) return o;
        const A = getLatestReviewMessageToken(N),
          vl = String(o[N.product] || "");
        if (!A) return o;
        if (!vl || isReviewTokenUnread(A, vl)) o[N.product] = A;
        return o;
      },
      {},
    ),
    serverSeenReviewItemMap = [...(missionReviewAlerts || []), ...(productReviews || [])].reduce(
      (o, N) => {
        if (!N || !N.product) return o;
        const A = getServerSeenReviewToken(N),
          vl = String(o[N.product] || "");
        if (!A) return o;
        if (!vl || isReviewTokenUnread(A, vl)) o[N.product] = A;
        return o;
      },
      {},
    ),
    mergedSeenReviewItemMap = Object.entries(serverSeenReviewItemMap).reduce(
      (o, [N, A]) => {
        const vl = String(seenReviewItemMap[N] || ""),
          El = String(A || "");
        o[N] = vl && !isReviewTokenUnread(vl, El) ? vl : El;
        return o;
      },
      { ...seenReviewItemMap },
    ),
    activeMissionProducts = w
      ? (Kl || []).flatMap((o) =>
        (o.products || []).filter((N) => Number(N.shopping) === Number(w.id)),
      )
      : [],
    requestAssignableClients = [...(Kl || [])].sort((o, N) =>
      String(o.name || "").localeCompare(String(N.name || ""), "es", {
        sensitivity: "base",
      }),
    ),
    getClientNameById = (o) => {
      if (!o) return "";
      const N = requestAssignableClients.find((A) => Number(A.id) === Number(o));
      return (N && N.name) || "";
    },
    filteredNewRequestClients = requestAssignableClients.filter((o) =>
      normalizeSearchText(o.name || "").includes(normalizeSearchText(newRequestClientSearch)),
    ),
    filteredEditingRequestClients = requestAssignableClients.filter((o) =>
      normalizeSearchText(o.name || "").includes(normalizeSearchText(editingRequestClientSearch)),
    ),
    clientGalleryScopeMission = clientGalleryMissionScopeId
      ? Al.find((o) => Number(o.id) === Number(clientGalleryMissionScopeId))
      : null,
    missionTaxPercentage = toNumber(w && w.tax_percentage, toNumber(calcTaxes, 0)),
    missionProductsCount = activeMissionProducts.length,
    missionTotalWithoutTaxes = activeMissionProducts.reduce((o, N) => {
      const A = toNumber(N.real_price, Number.NaN);
      if (Number.isFinite(A)) return o + A;
      const vl = toNumber(N.charged_price, Number.NaN);
      if (!Number.isFinite(vl)) return o;
      return o + vl / (1 + missionTaxPercentage / 100);
    }, 0),
    missionTotalWithTaxes = activeMissionProducts.reduce((o, N) => {
      const A = toNumber(N.charged_price, Number.NaN);
      if (Number.isFinite(A)) return o + A;
      const vl = toNumber(N.real_price, Number.NaN);
      if (!Number.isFinite(vl)) return o;
      return o + vl * (1 + missionTaxPercentage / 100);
    }, 0),
    filteredMissionSummaryProducts = activeMissionProducts.filter((o) =>
      missionSummaryStatusFilter === "ALL"
        ? !0
        : String(o.status || "").toUpperCase() === missionSummaryStatusFilter,
    ).sort((o, N) => {
      if (missionSummaryStatusFilter !== "ALL") return 0;
      const A = (vl) => {
          const El = String(vl.status || "").toUpperCase();
          return El === "REJECTED" ? 2 : El === "IN_REVIEW" ? 1 : 0;
        },
        vl = A(o),
        El = A(N);
      if (vl !== El) return vl - El;
      return String(o.name || "").localeCompare(String(N.name || ""), "es", {
        sensitivity: "base",
      });
    }),
    filteredMissionSummaryTotal = filteredMissionSummaryProducts.reduce((o, N) => {
      const A = toNumber(N.charged_price, Number.NaN);
      if (Number.isFinite(A)) return o + A;
      const vl = toNumber(N.real_price, Number.NaN);
      if (!Number.isFinite(vl)) return o;
      return o + vl * (1 + missionTaxPercentage / 100);
    }, 0),
    homeClientMissionProductsMap = Rt.reduce((o, N) => {
      o[N.id] = (N.products || []).filter((A) => Number(A.shopping) === Number(w && w.id));
      return o;
    }, {}),
    homeClientReviewItemStates = Rt.reduce((o, N) => {
      o[N.id] = ((homeClientMissionProductsMap[N.id] || []).reduce((A, vl) => {
        A[vl.id] = String(latestReviewMessageTokenByProduct[vl.id] || "");
        return A;
      }, {}));
      return o;
    }, {}),
    derivedHomeClientReviewUnreadMap = Rt.reduce((o, N) => {
      const A = Object.entries(homeClientReviewItemStates[N.id] || {}).reduce(
        (vl, [El, Se]) => {
          const ea = String(Se || ""),
            gl = String(mergedSeenReviewItemMap[El] || "");
          if (isReviewTokenUnread(ea, gl)) vl[El] = ea;
          return vl;
        },
        {},
      );
      o[N.id] = A;
      return o;
    }, {}),
    backendHomeClientReviewUnreadMap = Rt.reduce((o, N) => {
      const A = homeUnreadSummary[String(N.id)] || homeUnreadSummary[N.id] || null;
      o[N.id] = (A && (A.product_ids || []).reduce((vl, El) => {
        vl[El] = String(A.latest_activity_at || "");
        return vl;
      }, {})) || {};
      return o;
    }, {}),
    effectiveHomeClientReviewUnreadMap = Object.keys(homeUnreadSummary || {}).length
      ? backendHomeClientReviewUnreadMap
      : derivedHomeClientReviewUnreadMap,
    homeClientLatestUnreadActivityMap = Rt.reduce((o, N) => {
      const A = homeUnreadSummary[String(N.id)] || homeUnreadSummary[N.id] || null;
      if (A && A.latest_activity_at) {
        o[N.id] = new Date(A.latest_activity_at).getTime();
        return o;
      }
      const vl = Object.values(
        derivedHomeClientReviewUnreadMap[N.id] || {},
      ).reduce((El, Se) => {
        const ea = String(Se || "").replace(/^REVIEW:/, "");
        const gl = new Date(ea || 0).getTime();
        return Number.isFinite(gl) && gl > El ? gl : El;
      }, 0);
      o[N.id] = vl;
      return o;
    }, {}),
    homeClientReviewStates = Rt.reduce((o, N) => {
      o[N.id] = getHomeClientReviewState(
        homeClientMissionProductsMap[N.id] || [],
        latestMissionReviewsByProduct,
      );
      return o;
    }, {}),
    filteredHomeClientsInMission = Rt.filter((o) =>
      String(o.name || "").toLowerCase().includes(homeClientSearch.trim().toLowerCase()),
    ).sort((o, N) => {
      const A = Object.keys(effectiveHomeClientReviewUnreadMap[o.id] || {}).length,
        vl = Object.keys(effectiveHomeClientReviewUnreadMap[N.id] || {}).length;
      if (A !== vl) return vl - A;
      const El = homeClientLatestUnreadActivityMap[o.id] || 0,
        Se = homeClientLatestUnreadActivityMap[N.id] || 0;
      if (El !== Se) return Se - El;
      return String(o.name || "").localeCompare(String(N.name || ""), "es", {
        sensitivity: "base",
      });
    }),
    currentConversationProductState = reviewConversationEntry
      ? getUnifiedReviewState(getProductReviewState(
          reviewConversationEntry.product ||
            (reviewConversationEntry.review &&
              W &&
              (W.products || []).find(
                (o) => Number(o.id) === Number(reviewConversationEntry.review.product),
              )) ||
            null,
          reviewConversationEntry.review || null,
        ))
      : "ANNOTATED",
    currentConversationStatusActions = getChatStatusActionOptions(
      currentConversationProductState,
    ),
    selectedClientHomeProducts = W ? getHomeVisibleProducts(W) : [],
    selectedClientHomeTotals = w ? getHomeClientMissionTotals(selectedClientHomeProducts, w.id) : getHomeClientTotals(selectedClientHomeProducts),
    galleryProducts = (((W && W.products) || []).filter((o) =>
      clientGalleryMissionScopeId
        ? Number(o.shopping) === Number(clientGalleryMissionScopeId) &&
          (clientGalleryScopeMission &&
          clientGalleryScopeMission.status === "COMPLETED"
            ? o.status === "ANNOTATED"
            : !0)
        : !0,
    )),
    galleryReviewCount = galleryProducts.filter((o) => o.status === "IN_REVIEW").length,
    galleryAnnotatedCount = galleryProducts.filter((o) =>
      o.status === "ANNOTATED" || o.status === "BOUGHT",
    ).length,
    galleryRejectedCount = galleryProducts.filter((o) => o.status === "REJECTED").length,
    visibleGalleryProducts =
      wl === "REVIEW"
        ? galleryProducts.filter((o) => o.status === "IN_REVIEW")
        : wl === "REJECTED"
            ? galleryProducts.filter((o) => o.status === "REJECTED")
            : galleryProducts.filter((o) =>
              o.status === "ANNOTATED" || o.status === "BOUGHT",
            ),
    sortedVisibleGalleryProducts = [...visibleGalleryProducts].sort((o, N) => {
      const A = latestReviewsByProduct[o.id],
        vl = latestReviewsByProduct[N.id],
        El = A && (A.status === "PENDING" || A.status === "ALTERNATIVE_SENT")
          ? 0
          : 1,
        Se = vl && (vl.status === "PENDING" || vl.status === "ALTERNATIVE_SENT")
          ? 0
          : 1;
      if (El !== Se) return El - Se;
      const ea = A ? new Date(A.updated_at || A.created_at || 0).getTime() : 0,
        gl = vl ? new Date(vl.updated_at || vl.created_at || 0).getTime() : 0;
      return gl - ea;
    }),
    publicFocusedShipment =
      publicClientShareData &&
      (publicClientShareData.shipments || []).find(
        (o) => Number(o.id) === Number(publicClientShareData.focus_shipment_id),
      ),
    publicSelectedShipment =
      publicClientShareData &&
      (publicClientShareData.shipments || []).find(
        (o) => Number(o.id) === Number(publicExpandedShipmentId),
      ),
    publicSelectedShipmentTrackingUrl = publicSelectedShipment
      ? getShipmentTrackingUrl(
          publicSelectedShipment.carrier,
          publicSelectedShipment.tracking_number,
        )
      : "",
    publicShipmentProductIds = publicClientShareData
      ? new Set(
          (publicClientShareData.shipments || []).flatMap((o) =>
            (o.products_detail || []).map((N) => Number(N.id)),
          ),
        )
      : new Set(),
    publicPendingShipmentProducts = publicClientShareData
      ? (publicClientShareData.products || []).filter(
          (o) =>
            o.status === "ANNOTATED" &&
            !publicShipmentProductIds.has(Number(o.id)),
        )
      : [],
    publicClientCreditTotal = publicClientShareData
      ? Math.max(toNumber(publicClientShareData.client_credit, 0), 0)
      : 0,
    missionReviewAlertCount = missionReviewAlerts.length,
    isDesktopLayout = layoutMode === "WEB" && isWideViewport;
  V.useEffect(() => {
    if (!publicClientShareToken) return;
    let o = !0;
    setPublicClientShareLoading(!0);
    setPublicClientShareError("");
    publicApiFetch(
      publicShareType === "shipment"
        ? `/public/shipment-share/${encodeURIComponent(publicClientShareToken)}/`
        : `/public/client-share/${encodeURIComponent(publicClientShareToken)}/`,
    )
      .then((N) => {
        o && setPublicClientShareData(N || null);
      })
      .catch((N) => {
        o &&
          setPublicClientShareError(
            (N && N.message) || "No se pudo cargar este enlace.",
          );
      })
      .finally(() => {
        o && setPublicClientShareLoading(!1);
      });
    return () => {
      o = !1;
    };
  }, [publicClientShareToken, publicShareType]);
  V.useEffect(() => {
    if (!publicClientShareData) return;
    if (
      publicShareType === "shipment" &&
      publicClientShareData.focus_shipment_id
    ) {
      setPublicExpandedShipmentId(Number(publicClientShareData.focus_shipment_id));
      return;
    }
    setPublicExpandedShipmentId(null);
  }, [
    publicShareType,
    publicClientShareData &&
    publicClientShareData.focus_shipment_id,
    publicClientShareData &&
    (publicClientShareData.shipments || []).length,
  ]);
  V.useEffect(() => {
    if (!reviewConversationEntry) return;
    const o =
      (reviewConversationEntry.product && reviewConversationEntry.product.id) ||
      (reviewConversationEntry.review && reviewConversationEntry.review.product);
    if (!o) return;
    const N =
        (W &&
          (W.products || []).find((A) => Number(A.id) === Number(o))) ||
        reviewConversationEntry.product ||
        null,
      A = latestReviewsByProduct[o] || null;
    ((N &&
      reviewConversationEntry.product &&
      Number(N.id) === Number(reviewConversationEntry.product.id) &&
      A === reviewConversationEntry.review) ||
      setReviewConversationEntry((vl) =>
        vl
          ? {
              review: A,
              product: N || vl.product,
            }
          : vl,
      ),
      altUploadProductId === o || setAltUploadProductId(o),
      ((A && altUploadReviewId && Number(A.id) === Number(altUploadReviewId)) ||
        (!A && altUploadReviewId === null)) ||
        setAltUploadReviewId(A ? A.id : null));
  }, [
    reviewConversationEntry,
    latestReviewsByProduct,
    W,
    altUploadProductId,
    altUploadReviewId,
  ]);
  V.useEffect(() => {
    if (!reviewConversationEntry) return;
    const o =
      (reviewConversationEntry.product && reviewConversationEntry.product.id) ||
      (reviewConversationEntry.review && reviewConversationEntry.review.product);
    if (!o) return;
    const N = String(latestReviewMessageTokenByProduct[o] || "");
    if (!N) return;
    setSeenReviewItemMap((A) =>
      String(A[o] || "") === N ? A : { ...A, [o]: N },
    );
  }, [reviewConversationEntry, latestReviewMessageTokenByProduct]);
  V.useEffect(() => {
    if (!reviewConversationEntry || !J) return;
    const o =
      (reviewConversationEntry.product && reviewConversationEntry.product.id) ||
      (reviewConversationEntry.review && reviewConversationEntry.review.product);
    if (!o) return;
    const N = latestReviewsByProduct[o] || reviewConversationEntry.review || null;
    if (!N || !N.id) return;
    const A = [...(N.messages || [])]
      .sort(
        (vl, El) =>
          new Date(El.created_at || 0).getTime() -
          new Date(vl.created_at || 0).getTime(),
      )[0];
    if (!A || !A.id) return;
    const vl =
      Number(A.sender) === Number(J.id) ||
      String(A.sender_username || "").toLowerCase() ===
        String(J.username || "").toLowerCase();
    if (vl) return;
    if (Number(N.current_user_last_seen_message_id || 0) >= Number(A.id)) return;
    I(`/reviews/${N.id}/mark-seen/`, {
      method: "POST",
      body: JSON.stringify({}),
    }).catch((El) => {
      console.error("Failed auto-marking open review conversation as seen", El);
    });
  }, [reviewConversationEntry, latestReviewsByProduct, J]);
  V.useEffect(() => {
    if (!reviewConversationEntry) return;
    const o =
      reviewConversationEntry.product ||
      (reviewConversationEntry.review &&
        W &&
        (W.products || []).find(
          (N) => Number(N.id) === Number(reviewConversationEntry.review.product),
        )) ||
      null;
    const N =
      (o && latestReviewsByProduct[o.id]) ||
      reviewConversationEntry.review ||
      null;
    const A = getUnifiedReviewState(getProductReviewState(o, N));
    setAltUploadTargetStatus((vl) => {
      const El = reviewConversationStateRef.current;
      return !vl || vl === El ? A : vl;
    });
    reviewConversationStateRef.current = A;
  }, [reviewConversationEntry, latestReviewsByProduct, W]);
  V.useEffect(() => {
    if (!reviewConversationEntry || !reviewConversationScrollRef.current) return;
    const o = window.requestAnimationFrame(() => {
      const N = reviewConversationScrollRef.current;
      N && (N.scrollTop = N.scrollHeight);
    });
    return () => window.cancelAnimationFrame(o);
  }, [
    reviewConversationEntry,
    reviewConversationEntry &&
    reviewConversationEntry.review &&
    (reviewConversationEntry.review.messages || []).length,
  ]);
  if (publicClientShareToken)
    return c.jsxs("div", {
      className:
        "w-full min-h-[100dvh] bg-background-light dark:bg-background-dark flex justify-center px-4 py-6",
      children: [
        fullscreenImage &&
        c.jsx("div", {
          className:
            "fixed inset-0 z-[90] bg-black/92 overflow-auto p-4 ui-backdrop",
          onClick: () => setFullscreenImage(null),
          children: c.jsxs("div", {
            className:
              "min-h-full w-full flex items-center justify-center relative",
            children: [
              c.jsx("button", {
                onClick: () => setFullscreenImage(null),
                className:
                  "fixed top-4 right-4 z-[91] w-10 h-10 rounded-full bg-white/90 text-gray-800 border border-gray-200 flex items-center justify-center shadow",
                children: c.jsx("span", {
                  className: "material-symbols-outlined",
                  children: "close",
                }),
              }),
              c.jsx("img", {
                src: getFullscreenImageUrl(fullscreenImage),
                className:
                  "block max-w-none w-auto h-auto min-w-full sm:min-w-0 sm:max-w-[95vw] object-contain",
                onClick: (o) => o.stopPropagation(),
              }),
            ],
          }),
        }),
        c.jsxs("div", {
        className:
          "w-full max-w-[480px] rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-xl overflow-hidden",
        children: [
          c.jsxs("div", {
            className:
              "px-5 py-4 border-b border-border-light dark:border-border-dark bg-white/80 dark:bg-slate-900/70",
            children: [
              c.jsx("p", {
                className: "text-[10px] font-black tracking-[0.24em] uppercase text-text-sub",
                children:
                  publicShareType === "shipment"
                    ? "Historial del cliente"
                    : "Historial del cliente",
              }),
              c.jsx("h1", {
                className: "mt-1 text-lg font-black text-text-main dark:text-white",
                children:
                  (publicClientShareData && publicClientShareData.client_name) ||
                  "Cliente",
              }),
              publicClientShareData &&
              publicShareType === "shipment" &&
              c.jsxs("p", {
                className: "mt-1 text-xs text-text-sub dark:text-slate-400",
                children: [
                  publicShareType === "shipment" && publicFocusedShipment
                    ? `Enfoque en envio #${publicFocusedShipment.id}`
                    : `${(publicClientShareData.shipments || []).length || 0} envios • ${(
                        publicClientShareData.receipts || []
                      ).length || 0} tickets`,
                ],
              }),
              publicClientShareData &&
              publicShareType !== "shipment" &&
              c.jsxs("p", {
                className: "mt-1 text-xs text-text-sub dark:text-slate-400",
                children: [
                  `${(publicClientShareData.shipments || []).length || 0} envios`,
                ],
              }),
            ],
          }),
          publicClientShareLoading
            ? c.jsxs("div", {
                className: "px-5 py-12 text-center text-text-sub",
                children: [
                  c.jsx("span", {
                    className:
                      "material-symbols-outlined animate-spin text-3xl text-primary",
                    children: "progress_activity",
                  }),
                  c.jsx("p", {
                    className: "mt-3 text-sm font-medium",
                    children: "Cargando productos...",
                  }),
                ],
              })
            : publicClientShareError
              ? c.jsxs("div", {
                  className: "px-5 py-12 text-center",
                  children: [
                    c.jsx("span", {
                      className: "material-symbols-outlined text-4xl text-rose-500",
                      children: "lock",
                    }),
                    c.jsx("p", {
                      className: "mt-3 text-sm font-semibold text-rose-600",
                      children: publicClientShareError,
                    }),
                  ],
                })
              : c.jsxs("div", {
                  className: "px-4 py-4 space-y-3",
                  children: [
                    publicClientCreditTotal > 0 &&
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20 px-4 py-3",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300",
                          children: "Credito disponible",
                        }),
                        c.jsxs("p", {
                          className:
                            "mt-1 text-lg font-black text-emerald-800 dark:text-emerald-100",
                          children: ["$", formatAmount(publicClientCreditTotal)],
                        }),
                        c.jsx("p", {
                          className:
                            "mt-1 text-[11px] leading-5 text-emerald-700/80 dark:text-emerald-200/80",
                          children:
                            "Este credito ya considera las compras donde se uso credito previo.",
                        }),
                      ],
                    }),
                    publicSelectedShipment &&
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 px-4 py-3 space-y-2",
                      children: [
                        publicShareType !== "shipment" &&
                        c.jsx("button", {
                          type: "button",
                          onClick: () => setPublicExpandedShipmentId(null),
                          className:
                            "inline-flex items-center gap-1 text-[11px] font-bold text-primary",
                          children: [
                            c.jsx("span", {
                              className: "material-symbols-outlined text-[16px]",
                              children: "arrow_back",
                            }),
                            "Volver al historial",
                          ],
                        }),
                        c.jsxs("div", {
                          className: "flex items-center justify-between gap-3",
                          children: [
                            c.jsx("span", {
                              className: "text-[10px] font-bold uppercase tracking-wide text-text-sub",
                              children: "Status de envio",
                            }),
                            c.jsx("span", {
                              className: "px-2 py-1 rounded-full bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-200 text-[10px] font-bold uppercase",
                              children: getShipmentStatusLabel(
                                publicSelectedShipment.status,
                              ),
                            }),
                          ],
                        }),
                        c.jsxs("div", {
                          className: "space-y-1",
                          children: [
                            c.jsxs("p", {
                              className: "text-xs text-text-main dark:text-white",
                              children: [
                                publicSelectedShipment.carrier ||
                                  "Paqueteria",
                                publicSelectedShipment.tracking_number
                                  ? ` • ${publicSelectedShipment.tracking_number}`
                                  : "",
                              ],
                            }),
                            publicSelectedShipmentTrackingUrl &&
                            c.jsxs("a", {
                              href: publicSelectedShipmentTrackingUrl,
                              target: "_blank",
                              rel: "noreferrer noopener",
                              className:
                                "inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline",
                              children: [
                                c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-[14px]",
                                  children: "open_in_new",
                                }),
                                "Rastrear guia",
                              ],
                            }),
                          ],
                        }),
                        c.jsxs("div", {
                          className: "grid grid-cols-1 gap-2",
                          children: [
                            c.jsxs("div", {
                              className:
                                "rounded-xl bg-emerald-50 dark:bg-emerald-950/20 px-3 py-2",
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-300",
                                  children: "Precio",
                                }),
                                c.jsxs("p", {
                                  className:
                                    "text-xs font-semibold text-emerald-800 dark:text-emerald-200 mt-0.5",
                                  children: [
                                    "$",
                                    formatAmount(
                                      parseFloat(
                                        publicSelectedShipment.client_price || 0,
                                      ),
                                    ),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        publicSelectedShipment.shipping_address &&
                        c.jsxs("div", {
                          className:
                            "rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2",
                          children: [
                            c.jsx("p", {
                              className:
                                "text-[10px] font-bold uppercase text-text-sub",
                              children: "Direccion de envio",
                            }),
                            c.jsx("p", {
                              className:
                                "text-xs text-text-main dark:text-slate-200 mt-0.5 whitespace-pre-wrap",
                              children: publicSelectedShipment.shipping_address,
                            }),
                          ],
                        }),
                        (publicSelectedShipment.products_detail || []).length > 0 &&
                        c.jsxs("div", {
                          className: "space-y-2 pt-2",
                          children: [
                            c.jsxs("div", {
                              className:
                                "flex items-center justify-between gap-2",
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-[11px] font-bold uppercase tracking-wide text-text-sub",
                                  children: "Productos",
                                }),
                                c.jsxs("span", {
                                  className: "text-[10px] text-text-sub",
                                  children: [
                                    (publicSelectedShipment.products_detail || [])
                                      .length,
                                    " items",
                                  ],
                                }),
                              ],
                            }),
                            c.jsx("div", {
                              className: "grid grid-cols-2 gap-2",
                              children: (publicSelectedShipment.products_detail || []).map(
                                (o) =>
                                  c.jsxs(
                                    "div",
                                    {
                                      className:
                                        "rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 p-2 flex gap-2 items-start",
                                      children: [
                                        o.image
                                          ? c.jsx("img", {
                                              src: resolveMediaUrl(o.image),
                                              onClick: () =>
                                                setFullscreenImage(
                                                  resolveMediaUrl(o.image),
                                                ),
                                              className:
                                                "w-16 h-16 rounded-lg object-cover cursor-zoom-in shrink-0",
                                            })
                                          : c.jsx("div", {
                                              className:
                                                "w-16 h-16 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-gray-300 dark:text-slate-600 shrink-0",
                                              children: c.jsx("span", {
                                                className:
                                                  "material-symbols-outlined text-2xl",
                                                children: "image",
                                              }),
                                            }),
                                        c.jsxs("div", {
                                          className: "min-w-0 flex-1 pt-0.5",
                                          children: [
                                            c.jsx("p", {
                                              className:
                                                "text-[11px] font-semibold text-text-main dark:text-white line-clamp-2",
                                              children: o.name,
                                            }),
                                            c.jsxs("p", {
                                              className:
                                                "mt-1 text-[13px] font-black text-emerald-700 dark:text-emerald-300",
                                              children: [
                                                "$",
                                                formatAmount(
                                                  parseFloat(
                                                    o.charged_price ||
                                                      o.real_price ||
                                                      0,
                                                  ),
                                                ),
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    },
                                    `selected-public-shipment-product-${o.id}`,
                                  ),
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                    !publicSelectedShipment &&
                    (publicClientShareData.shipments || []).length > 0 &&
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 px-4 py-3 space-y-2",
                      children: [
                        c.jsxs("div", {
                          className: "flex items-center justify-between gap-2",
                          children: [
                            c.jsx("h3", {
                              className: "text-sm font-bold text-text-main dark:text-white",
                              children: "Envios",
                            }),
                            c.jsxs("span", {
                              className: "text-[11px] text-text-sub",
                              children: [
                                (publicClientShareData.shipments || []).length,
                                " total",
                              ],
                            }),
                          ],
                        }),
                        c.jsx("div", {
                          className: "space-y-2",
                          children: (publicClientShareData.shipments || []).map((o) =>
                            c.jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: () =>
                                  setPublicExpandedShipmentId(Number(o.id)),
                                className:
                                  `w-full text-left rounded-xl border px-3 py-2 transition ${Number(publicClientShareData.focus_shipment_id) === Number(o.id) ? "border-primary bg-primary/5" : "border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-800/50"}`,
                                children: [
                                  c.jsxs("div", {
                                    className: "flex items-center justify-between gap-2",
                                    children: [
                                      c.jsxs("div", {
                                        className: "min-w-0",
                                        children: [
                                          c.jsx("p", {
                                            className: "text-xs font-bold text-text-main dark:text-white truncate",
                                            children:
                                              o.tracking_number ||
                                              o.carrier ||
                                              `Envio #${o.id}`,
                                          }),
                                          c.jsxs("p", {
                                            className: "mt-1 text-[11px] text-text-sub",
                                            children: [
                                              "Precio: $",
                                              formatAmount(parseFloat(o.client_price || 0)),
                                            ],
                                          }),
                                        ],
                                      }),
                                      c.jsxs("div", {
                                        className: "flex items-center gap-2 shrink-0",
                                        children: [
                                          c.jsx("span", {
                                            className: "text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300",
                                            children: getShipmentStatusLabel(o.status),
                                          }),
                                          c.jsx("span", {
                                            className: "material-symbols-outlined text-[18px] text-text-sub",
                                            children: "chevron_right",
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  o.shipping_address &&
                                  c.jsx("p", {
                                    className: "mt-1 text-[11px] text-text-sub line-clamp-2",
                                    children: o.shipping_address,
                                  }),
                                ],
                              },
                              `public-shipment-${o.id}`,
                            ),
                          ),
                        }),
                      ],
                    }),
                    !publicSelectedShipment &&
                    publicPendingShipmentProducts.length > 0 &&
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 space-y-2.5",
                      children: [
                        c.jsxs("div", {
                          className: "flex items-center justify-between gap-2",
                          children: [
                            c.jsx("h3", {
                              className: "text-sm font-bold text-amber-900 dark:text-amber-100",
                              children: "Pendiente",
                            }),
                            c.jsxs("span", {
                              className: "text-[11px] text-amber-700 dark:text-amber-300",
                              children: [
                                publicPendingShipmentProducts.length,
                                " item",
                                publicPendingShipmentProducts.length === 1 ? "" : "s",
                              ],
                            }),
                          ],
                        }),
                        c.jsx("div", {
                          className: "grid grid-cols-2 gap-1.5",
                          children: publicPendingShipmentProducts.map((o) =>
                            c.jsxs(
                              "div",
                              {
                                className:
                                  "rounded-lg border border-amber-200 dark:border-amber-900 bg-white/90 dark:bg-slate-900 p-1.5 flex gap-1.5 items-start",
                                children: [
                                  o.image
                                    ? c.jsx("img", {
                                        src: resolveMediaUrl(o.image),
                                        onClick: () =>
                                          setFullscreenImage(resolveMediaUrl(o.image)),
                                        className:
                                          "w-12 h-12 rounded-md object-cover cursor-zoom-in shrink-0",
                                      })
                                    : c.jsx("div", {
                                        className:
                                          "w-12 h-12 rounded-md bg-amber-100/80 dark:bg-amber-950/20 flex items-center justify-center text-amber-300 dark:text-amber-700 shrink-0",
                                        children: c.jsx("span", {
                                          className:
                                            "material-symbols-outlined text-[18px]",
                                          children: "image",
                                        }),
                                      }),
                                  c.jsxs("div", {
                                    className: "min-w-0 flex-1",
                                    children: [
                                      c.jsx("p", {
                                        className:
                                          "text-[10px] leading-4 font-semibold text-text-main dark:text-white line-clamp-2",
                                        children: o.name,
                                      }),
                                      c.jsxs("p", {
                                        className:
                                          "mt-0.5 text-xs font-black text-amber-700 dark:text-amber-300",
                                        children: [
                                          "$",
                                          formatAmount(
                                            parseFloat(
                                              o.charged_price || o.real_price || 0,
                                            ),
                                          ),
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              },
                              `public-pending-product-${o.id}`,
                            ),
                          ),
                        }),
                      ],
                    }),
                    publicShareType === "shipment" &&
                    !publicSelectedShipment &&
                    (publicClientShareData.receipts || []).length > 0 &&
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 px-4 py-3 space-y-2",
                      children: [
                        c.jsx("h3", {
                          className: "text-sm font-bold text-text-main dark:text-white",
                          children: "Tickets",
                        }),
                        c.jsx("div", {
                          className: "grid grid-cols-3 gap-2",
                          children: (publicClientShareData.receipts || []).map((o) =>
                            c.jsx(
                              "button",
                              {
                                type: "button",
                                onClick: () =>
                                  o.image &&
                                  setFullscreenImage(resolveMediaUrl(o.image)),
                                className:
                                  "overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 aspect-square",
                                children: o.image
                                  ? c.jsx("img", {
                                      src: resolveMediaUrl(o.image),
                                      className: "w-full h-full object-cover",
                                    })
                                  : c.jsx("div", {
                                      className:
                                        "w-full h-full flex items-center justify-center text-slate-400",
                                      children: c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-[20px]",
                                        children: "receipt_long",
                                      }),
                                    }),
                              },
                              `public-receipt-${o.id}`,
                            ),
                          ),
                        }),
                      ],
                    }),
                    (publicClientShareData.shipments || []).length === 0 &&
                    c.jsx("div", {
                          className:
                            "rounded-2xl border border-dashed border-border-light dark:border-border-dark px-4 py-10 text-center text-sm text-text-sub",
                          children: "No hay envios para mostrar.",
                        }),
                  ],
                }),
        ],
      }),
      ],
    });
  if (!C || !J)
    return c.jsxs("div", {
      className:
        "w-full max-w-[480px] min-h-screen bg-surface-light dark:bg-surface-dark flex flex-col justify-center p-8 border-x border-border-light relative animate-in fade-in",
      children: [
        c.jsxs("div", {
          className: "text-center mb-10",
          children: [
            c.jsx("span", {
              className:
                "material-symbols-outlined text-6xl text-primary mb-4 font-variation-settings-fill",
              children: "shopping_cart",
            }),
            c.jsx("h1", {
              className: "text-3xl md:text-4xl font-black mb-2",
              children: "Personal Shopper",
            }),
            c.jsx("p", {
              className: "text-gray-500",
              children: "Log in or create an account to start.",
            }),
          ],
        }),
        U &&
        c.jsx("div", {
          className:
            "bg-red-100 text-red-700 p-3 rounded-xl mb-4 text-sm font-medium border border-red-200",
          children: U,
        }),
        c.jsxs("form", {
          onSubmit: Ai,
          className: "space-y-3 md:space-y-4",
          children: [
            c.jsx("div", {
              children: c.jsx("input", {
                placeholder: "Username",
                value: cl.username,
                onChange: (o) => Ql({ ...cl, username: o.target.value }),
                className:
                  "w-full border p-3 md:p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-primary transition-all",
                required: !0,
              }),
            }),
            c.jsx("div", {
              children: c.jsx("input", {
                type: "password",
                placeholder: "Password",
                value: cl.password,
                onChange: (o) => Ql({ ...cl, password: o.target.value }),
                className:
                  "w-full border p-3 md:p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-primary transition-all",
                required: !0,
              }),
            }),
            Q === "REGISTER" &&
            c.jsx("div", {
              children: c.jsxs("select", {
                value: cl.role,
                onChange: (o) => Ql({ ...cl, role: o.target.value }),
                className:
                  "w-full border p-3 md:p-4 rounded-xl bg-gray-50/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 outline-none focus:ring-2 ring-primary transition-all",
                children: [
                  c.jsx("option", {
                    value: "AV",
                    children: "Agente de Ventas (Oficina)",
                  }),
                  c.jsx("option", {
                    value: "PS",
                    children: "Personal Shopper (Tienda)",
                  }),
                  c.jsx("option", {
                    value: "BOTH",
                    children: "Ambos (Admin / Tester)",
                  }),
                ],
              }),
            }),
            c.jsx("button", {
              type: "submit",
              className:
                "w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 md:py-4 rounded-xl shadow-[0_8px_16px_rgba(139,92,246,0.25)] transition-all",
              children: Q === "LOGIN" ? "Access Account" : "Register Account",
            }),
          ],
        }),
        c.jsx("div", {
          className: "mt-6 md:mt-8 pb-4 text-center text-sm",
          children: c.jsx("button", {
            onClick: () => {
              (al(Q === "LOGIN" ? "REGISTER" : "LOGIN"), T(""));
            },
            className: "font-bold text-gray-500 hover:text-primary transition",
            children:
              Q === "LOGIN"
                ? "Don't have an account? Register"
                : "Already have an account? Login",
          }),
        }),
      ],
    });
  const ta = () =>
    c.jsxs("div", {
      className: isDesktopLayout
        ? "grid gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(340px,380px)] xl:grid-rows-[auto_minmax(0,1fr)] items-stretch"
        : "flex flex-col gap-0 pb-24 rounded-2xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark",
      children: [
        false && c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark p-6 rounded-2xl shadow-card text-center border border-border-light dark:border-border-dark",
          children: [
            c.jsx("div", {
              className:
                "w-20 h-20 mx-auto bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4",
              children: c.jsx("span", {
                className: "material-symbols-outlined text-4xl",
                children: "store",
              }),
            }),
            c.jsx("h2", {
              className: "text-2xl font-bold mb-2",
              children: "Shopping en Tienda",
            }),
            c.jsx("p", {
              className: "text-text-sub text-sm mb-6",
              children: w
                ? w.status === "PAUSED"
                  ? `Shopping pausado en ${getMissionStoreLabel(w)}.`
                  : `Comprando en ${getMissionStoreLabel(w)}.`
                : "Inicia un shopping al entrar a la tienda para comenzar a registrar compras.",
            }),
            w
              ? c.jsxs("div", {
                className: "flex gap-3",
                children: [
                  w.status === "ACTIVE"
                    ? c.jsxs("button", {
                      onClick: be,
                      className:
                        "flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2 bg-amber-500 hover:bg-amber-600",
                      children: [
                        c.jsx("span", {
                          className: "material-symbols-outlined",
                          children: "pause_circle",
                        }),
                        " Pause",
                      ],
                    })
                    : c.jsxs("button", {
                      onClick: cu,
                      className:
                        "flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2 bg-green-600 hover:bg-green-700",
                      children: [
                        c.jsx("span", {
                          className: "material-symbols-outlined",
                          children: "play_circle",
                        }),
                        " Resume",
                      ],
                    }),
                  c.jsxs("button", {
                    onClick: on,
                    className:
                      "flex-1 py-3 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2 bg-red-500 hover:bg-red-600",
                    children: [
                      c.jsx("span", {
                        className: "material-symbols-outlined",
                        children: "stop_circle",
                      }),
                      " End",
                    ],
                  }),
                ],
              })
              : c.jsxs("button", {
                onClick: openMissionStart,
                className:
                  "w-full py-4 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2 bg-primary hover:bg-primary-dark",
                children: [
                  c.jsx("span", {
                    className: "material-symbols-outlined",
                    children: "play_circle",
                  }),
                  " Iniciar Shopping",
                ],
            }),
          ],
        }),
        c.jsxs("div", {
          className: isDesktopLayout
            ? w
              ? "xl:order-2 xl:col-start-1 xl:row-start-2 bg-surface-light dark:bg-surface-dark p-5 border border-border-light dark:border-border-dark shadow-card min-h-[420px] xl:rounded-t-none xl:rounded-br-none xl:rounded-bl-3xl xl:border-t-0 xl:-mt-px"
              : "xl:order-2 xl:col-span-2 bg-surface-light dark:bg-surface-dark p-5 rounded-b-3xl border border-border-light dark:border-border-dark shadow-card min-h-[420px] xl:border-t-0 xl:-mt-px"
            : "bg-surface-light dark:bg-surface-dark p-3 md:p-4 border-b border-border-light dark:border-border-dark",
          children: [
            c.jsxs("div", {
              className: "mb-4",
              children: [
                c.jsxs("h3", {
                  className: "font-bold text-sm mb-2 text-text-main dark:text-white",
                  children: ["Peticiones (", requests.length, ")"],
                }),
                c.jsx("div", {
                  className: isDesktopLayout
                    ? "space-y-2 pr-1 max-h-[520px] overflow-y-auto ios-scroll"
                    : "space-y-2 pr-1 max-h-[200px] overflow-y-auto ios-scroll",
                  children:
                    requests.length === 0
                      ? c.jsx("p", {
                          className: "text-xs text-gray-400 py-3 text-center",
                          children: "Sin peticiones activas.",
                        })
                      : requests.map((o) =>
                          c.jsxs(
                            "div",
                            {
                              className: `relative rounded-xl border-l-4 px-3 py-2.5 shadow-sm transition ${o.status === "ACKNOWLEDGED" ? "bg-emerald-100/95 border-emerald-500 border-l-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700 dark:border-l-emerald-500" : o.status === "NO_STOCK" ? "bg-rose-100/95 border-rose-500 border-l-rose-700 dark:bg-rose-950/60 dark:border-rose-700 dark:border-l-rose-500" : o.status === "MODIFIED" ? "bg-amber-100/95 border-amber-500 border-l-amber-700 dark:bg-amber-950/60 dark:border-amber-700 dark:border-l-amber-500" : o.status === "DISCARDED" ? "bg-slate-100/95 border-slate-400 border-l-slate-600 dark:bg-slate-900 dark:border-slate-600 dark:border-l-slate-400" : "bg-sky-50 border-sky-300 border-l-sky-500 dark:bg-slate-900/70 dark:border-slate-600 dark:border-l-sky-400"}`,
                              children: [
                                editingRequestId === o.id
                                  ? c.jsxs("div", {
                                      className: "space-y-2",
                                      children: [
                                        c.jsxs("div", {
                                          className: "flex items-center gap-2",
                                          children: [
                                            c.jsxs("div", {
                                              className: "relative shrink-0",
                                              children: [
                                                c.jsx("button", {
                                                  type: "button",
                                                  onClick: () =>
                                                    setEditingRequestClientPickerOpen((N) => !N),
                                                  className:
                                                    "w-9 h-9 rounded-md border border-slate-300 bg-white/85 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800 flex items-center justify-center",
                                                  title:
                                                    getClientNameById(editingRequestClientId) ||
                                                    "Asignar cliente",
                                                  children: c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-[15px]",
                                                    children: "person",
                                                  }),
                                                }),
                                                editingRequestClientPickerOpen &&
                                                c.jsxs("div", {
                                                  className:
                                                    "absolute left-0 top-11 z-30 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-xl p-2",
                                                  children: [
                                                    c.jsx("input", {
                                                      type: "text",
                                                      value: editingRequestClientSearch,
                                                      onChange: (N) =>
                                                        setEditingRequestClientSearch(N.target.value),
                                                      placeholder: "Buscar cliente...",
                                                      className:
                                                        "w-full px-2.5 py-2 text-[11px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                                                    }),
                                                    c.jsxs("button", {
                                                      type: "button",
                                                      onClick: () => {
                                                        setEditingRequestClientId("");
                                                        setEditingRequestClientPickerOpen(!1);
                                                        setEditingRequestClientSearch("");
                                                      },
                                                      className:
                                                        "mt-2 w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800",
                                                      children: [
                                                        "Sin cliente",
                                                        getClientNameById(editingRequestClientId)
                                                          ? ""
                                                          : " ✓",
                                                      ],
                                                    }),
                                                    c.jsx("div", {
                                                      className: "mt-1 max-h-44 overflow-y-auto ios-scroll",
                                                      children:
                                                        filteredEditingRequestClients.length > 0
                                                          ? filteredEditingRequestClients.map((N) =>
                                                              c.jsx(
                                                                "button",
                                                                {
                                                                  type: "button",
                                                                  onClick: () => {
                                                                    setEditingRequestClientId(String(N.id));
                                                                    setEditingRequestClientPickerOpen(!1);
                                                                    setEditingRequestClientSearch("");
                                                                  },
                                                                  className:
                                                                    "w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-slate-800",
                                                                  children:
                                                                    String(editingRequestClientId) === String(N.id)
                                                                      ? `${N.name} ✓`
                                                                      : N.name,
                                                                },
                                                                `request-edit-client-${N.id}`,
                                                              ),
                                                            )
                                                          : c.jsx("p", {
                                                              className:
                                                                "px-2.5 py-3 text-[11px] text-gray-400 text-center",
                                                              children: "Sin coincidencias",
                                                            }),
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            c.jsx("input", {
                                              type: "text",
                                              value: editingRequestText,
                                              onChange: (N) => setEditingRequestText(N.target.value),
                                              className:
                                                "flex-1 px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                                            }),
                                            c.jsx("button", {
                                              onClick: pickEditingRequestImage,
                                              disabled: editingRequestSaving,
                                              className:
                                                `w-9 h-9 rounded-md border border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-200 flex items-center justify-center ${editingRequestSaving ? "opacity-60 cursor-wait" : ""}`,
                                              title: "Cambiar imagen",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[16px]",
                                                children: "imagesmode",
                                              }),
                                            }),
                                          ],
                                        }),
                                        editingRequestImagePreview &&
                                        c.jsxs("div", {
                                          className:
                                            "flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-[11px] text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
                                          children: [
                                            c.jsx("p", {
                                              className: "min-w-0 flex-1 truncate",
                                              children:
                                                editingRequestImageFile &&
                                                editingRequestImageFile.name
                                                  ? editingRequestImageFile.name
                                                  : "Imagen actual",
                                            }),
                                            c.jsxs("button", {
                                              type: "button",
                                              onClick: () =>
                                                setFullscreenImage({
                                                  url: editingRequestImagePreview,
                                                  copyOnClick: !0,
                                                  copyMessage: "Imagen copiada.",
                                                }),
                                              className:
                                                "shrink-0 rounded-md border border-sky-300 px-2 py-1 font-semibold text-sky-700 dark:border-sky-700 dark:text-sky-200",
                                              children: [
                                                c.jsx("span", {
                                                  className:
                                                    "material-symbols-outlined mr-1 text-[13px] align-[-2px]",
                                                  children: "image",
                                                }),
                                                "Abrir",
                                              ],
                                            }),
                                          ],
                                        }),
                                        c.jsxs("div", {
                                          className: "flex items-center gap-2",
                                          children: [
                                            c.jsx("button", {
                                              onClick: () => saveRequestModify(o),
                                              disabled:
                                                editingRequestSaving ||
                                                !editingRequestText.trim(),
                                              className:
                                                `text-[10px] px-3 py-1.5 rounded-full text-white font-semibold transition ${editingRequestSaving || !editingRequestText.trim() ? "bg-amber-300 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"}`,
                                              children: editingRequestSaving
                                                ? "Guardando..."
                                                : "Guardar",
                                            }),
                                            c.jsx("button", {
                                              onClick: cancelRequestModify,
                                              disabled: editingRequestSaving,
                                              className:
                                                "text-[10px] px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition disabled:opacity-60 disabled:cursor-not-allowed",
                                              children: "X",
                                            }),
                                          ],
                                        }),
                                      ],
                                    })
                                  : c.jsxs("div", {
                                      className: "flex items-start gap-2",
                                      children: [
                                        c.jsxs("div", {
                                          className: "min-w-0 flex-1",
                                          children: [
                                            c.jsx("p", {
                                              className: "text-xs font-semibold truncate text-gray-900 dark:text-gray-100",
                                              children: o.description,
                                            }),
                                            c.jsxs("div", {
                                              className: "mt-1 flex items-center gap-1.5",
                                              children: [
                                                c.jsx("span", {
                                                  className: `text-[9px] uppercase font-black tracking-wide px-1.5 py-0.5 rounded ${o.status === "ACKNOWLEDGED" ? "bg-emerald-700 text-white dark:bg-emerald-500 dark:text-slate-900" : o.status === "NO_STOCK" ? "bg-rose-700 text-white dark:bg-rose-500 dark:text-slate-900" : o.status === "MODIFIED" ? "bg-amber-700 text-white dark:bg-amber-500 dark:text-slate-900" : o.status === "DISCARDED" ? "bg-slate-600 text-white dark:bg-slate-400 dark:text-slate-900" : "bg-sky-700 text-white dark:bg-sky-500 dark:text-slate-900"}`,
                                                  children: o.status === "ACKNOWLEDGED"
                                                    ? "ENTERADO"
                                                    : o.status === "NO_STOCK"
                                                      ? "NO HAY"
                                                      : o.status === "MODIFIED"
                                                        ? "MODIFICADA"
                                                        : o.status === "DISCARDED"
                                                          ? "DESCARTADA"
                                                          : "PENDIENTE",
                                                }),
                                                c.jsxs("p", {
                                                  className: "text-[10px] text-gray-700 dark:text-gray-300 truncate",
                                                  children: [
                                                    o.created_by_username || o.created_by_name || "Usuario",
                                                    " (",
                                                    o.created_by_role || "AV",
                                                    ") • ",
                                                    o.client_name ? `${o.client_name} • ` : "",
                                                    getRelativeTime(o.updated_at || o.created_at),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        c.jsxs("div", {
                                          className: "shrink-0 flex items-center gap-1",
                                          children: [
                                            o.image &&
                                            c.jsx("button", {
                                              onClick: () =>
                                                setFullscreenImage({
                                                  url: resolveMediaUrl(o.image),
                                                  copyOnClick: !0,
                                                  copyMessage: "Imagen copiada.",
                                                }),
                                              className:
                                                "w-8 h-8 rounded-md border border-slate-300 bg-white/85 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800 flex items-center justify-center",
                                              title: "Abrir imagen",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[14px]",
                                                children: "image",
                                              }),
                                            }),
                                            c.jsx("button", {
                                              onClick: () =>
                                                updateMissionRequest(
                                                  o.id,
                                                  o.status === "ACKNOWLEDGED"
                                                    ? "PENDING"
                                                    : "ACKNOWLEDGED",
                                                ),
                                              className:
                                                "w-8 h-8 rounded-md border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200 dark:hover:bg-emerald-900/60 flex items-center justify-center",
                                              title: "Enterado",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[14px]",
                                                children: "check",
                                              }),
                                            }),
                                            c.jsx("button", {
                                              onClick: () =>
                                                updateMissionRequest(
                                                  o.id,
                                                  o.status === "NO_STOCK"
                                                    ? "PENDING"
                                                    : "NO_STOCK",
                                                ),
                                              className:
                                                "w-8 h-8 rounded-md border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/35 dark:text-red-200 dark:hover:bg-red-900/60 flex items-center justify-center",
                                              title: "No existencia",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[14px]",
                                                children: "block",
                                              }),
                                            }),
                                            c.jsx("button", {
                                              onClick: () => startRequestModify(o),
                                              className:
                                                "w-8 h-8 rounded-md border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/60 flex items-center justify-center",
                                              title: "Modificar",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[14px]",
                                                children: "edit",
                                              }),
                                            }),
                                            c.jsx("button", {
                                              onClick: () => deleteMissionRequest(o.id),
                                              className:
                                                "w-8 h-8 rounded-md border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/35 dark:text-rose-200 dark:hover:bg-rose-900/60 flex items-center justify-center",
                                              title: "Eliminar",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[14px]",
                                                children: "delete_forever",
                                              }),
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                              ],
                            },
                            o.id,
                          ),
                        ),
                }),
                c.jsxs("div", {
                  className: "mt-2 space-y-2",
                  children: [
                    newRequestImagePreview &&
                    c.jsxs("div", {
                      className:
                        "flex items-center justify-between gap-2 rounded-lg border border-sky-200 bg-sky-50/80 px-3 py-2 text-[11px] text-sky-900 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100",
                      children: [
                        c.jsx("p", {
                          className: "min-w-0 flex-1 truncate",
                          children: newRequestImageFile && newRequestImageFile.name
                            ? newRequestImageFile.name
                            : "Imagen seleccionada",
                        }),
                        c.jsxs("div", {
                          className: "flex items-center gap-1.5",
                          children: [
                            c.jsx("button", {
                              type: "button",
                              onClick: () =>
                                setFullscreenImage({
                                  url: newRequestImagePreview,
                                  copyOnClick: !0,
                                  copyMessage: "Imagen copiada.",
                                }),
                              className:
                                "rounded-md border border-sky-300 px-2 py-1 font-semibold text-sky-700 dark:border-sky-700 dark:text-sky-200",
                              children: "Abrir",
                            }),
                            c.jsx("button", {
                              onClick: clearNewRequestImage,
                              className:
                                "rounded-md border border-sky-300 px-2 py-1 font-semibold text-sky-700 dark:border-sky-700 dark:text-sky-200",
                              title: "Quitar imagen",
                              children: "Quitar",
                            }),
                          ],
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      className: "flex gap-2 items-center flex-wrap sm:flex-nowrap w-full",
                      children: [
                        c.jsxs("div", {
                          className: "relative shrink-0",
                          children: [
                            c.jsx("button", {
                              type: "button",
                              onClick: () =>
                                setNewRequestClientPickerOpen((o) => !o),
                              className:
                                "w-10 h-10 rounded-lg border border-slate-300 bg-white/85 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-800/90 dark:text-slate-100 dark:hover:bg-slate-800 flex items-center justify-center",
                              title:
                                getClientNameById(newRequestClientId) ||
                                "Asignar cliente",
                              children: c.jsx("span", {
                                className:
                                  "material-symbols-outlined text-[16px]",
                                children: "person",
                              }),
                            }),
                            newRequestClientPickerOpen &&
                            c.jsxs("div", {
                              className:
                                "absolute left-0 top-12 z-30 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-xl p-2",
                              children: [
                                c.jsx("input", {
                                  type: "text",
                                  value: newRequestClientSearch,
                                  onChange: (o) =>
                                    setNewRequestClientSearch(o.target.value),
                                  placeholder: "Buscar cliente...",
                                  className:
                                    "w-full px-2.5 py-2 text-[11px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                                }),
                                c.jsxs("button", {
                                  type: "button",
                                  onClick: () => {
                                    setNewRequestClientId("");
                                    setNewRequestClientPickerOpen(!1);
                                    setNewRequestClientSearch("");
                                  },
                                  className:
                                    "mt-2 w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800",
                                  children: [
                                    "Sin cliente",
                                    getClientNameById(newRequestClientId) ? "" : " ✓",
                                  ],
                                }),
                                c.jsx("div", {
                                  className: "mt-1 max-h-44 overflow-y-auto ios-scroll",
                                  children:
                                    filteredNewRequestClients.length > 0
                                      ? filteredNewRequestClients.map((o) =>
                                          c.jsx(
                                            "button",
                                            {
                                              type: "button",
                                              onClick: () => {
                                                setNewRequestClientId(String(o.id));
                                                setNewRequestClientPickerOpen(!1);
                                                setNewRequestClientSearch("");
                                              },
                                              className:
                                                "w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-slate-800",
                                              children:
                                                String(newRequestClientId) === String(o.id)
                                                  ? `${o.name} ✓`
                                                  : o.name,
                                            },
                                            `request-client-${o.id}`,
                                          ),
                                        )
                                      : c.jsx("p", {
                                          className:
                                            "px-2.5 py-3 text-[11px] text-gray-400 text-center",
                                          children: "Sin coincidencias",
                                        }),
                                }),
                              ],
                            }),
                          ],
                        }),
                        c.jsx("input", {
                          type: "text",
                          value: newRequestText,
                          onChange: (o) => setNewRequestText(o.target.value),
                          placeholder: "Nueva petición...",
                          className:
                            "flex-1 min-w-[120px] px-3 py-2 rounded-lg border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary w-full",
                        }),
                        c.jsx("button", {
                          onClick: pickRequestImage,
                          className:
                            "px-3 py-2 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200 flex-shrink-0",
                          title: "Adjuntar foto",
                          children: c.jsx("span", {
                            className: "material-symbols-outlined text-[18px]",
                            children: "add_photo_alternate",
                          }),
                        }),
                        c.jsx("button", {
                          onClick: createMissionRequest,
                          disabled: !newRequestText.trim() && !newRequestImageFile,
                          className: `px-4 py-2 rounded-lg text-sm font-semibold transition flex-shrink-0 flex-1 sm:flex-none ${newRequestText.trim() || newRequestImageFile ? "bg-primary text-white hover:bg-primary-dark" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`,
                          children: "Enviar",
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        w &&
        Rt.length > 0 &&
        c.jsxs("div", {
          className: isDesktopLayout
            ? "xl:order-3 xl:col-start-2 xl:row-span-2 bg-surface-light dark:bg-surface-dark p-4 border border-border-light dark:border-border-dark shadow-card min-h-[640px] flex flex-col xl:rounded-l-none xl:rounded-tr-3xl xl:rounded-br-3xl xl:-ml-px"
            : "bg-surface-light dark:bg-surface-dark p-3 md:p-4 border-b border-border-light dark:border-border-dark",
          children: [
            c.jsxs("div", {
              className: "mb-3 space-y-2",
              children: [
                c.jsxs("h3", {
                  className:
                    "font-bold text-sm text-text-main dark:text-white",
                  children: ["Clients in Shopping (", filteredHomeClientsInMission.length, ")"],
                }),
                c.jsx("input", {
                  type: "text",
                  value: homeClientSearch,
                  onChange: (o) => setHomeClientSearch(o.target.value),
                  placeholder: "Buscar client...",
                  className:
                    "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary",
                }),
              ],
            }),
            c.jsx("div", {
              className: isDesktopLayout
                ? "pr-0 max-h-[calc(100vh-18rem)] overflow-y-auto overscroll-contain ios-scroll"
                : "pr-1 max-h-[240px] overflow-y-auto overscroll-contain ios-scroll",
              children: filteredHomeClientsInMission.map((o) => {
                const N = getHomeClientMissionAnnotatedTotals(o.products || [], w.id),
                  A = getClientShoppingPaymentSummary(o, w.id),
                  vl = A.balance;
                return c.jsxs(
                  "div",
                  {
                    className:
                      "flex items-center gap-3 bg-gray-50 dark:bg-gray-800 px-3 py-2.5 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition",
                    children: [
                      c.jsx("div", {
                        onClick: () => Ta(o, w && w.id),
                        className:
                          "w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase border border-primary/20",
                        children: o.name.charAt(0),
                      }),
                      c.jsxs("div", {
                        onClick: () => Ta(o, w && w.id),
                        className: "flex-1 min-w-0",
                        children: [
                          c.jsxs("div", {
                            className: "flex items-center justify-between gap-2",
                            children: [
                              c.jsxs("div", {
                                className: "min-w-0",
                                children: [
                                  c.jsxs("div", {
                                    className: "flex items-center gap-2 min-w-0",
                                    children: [
                                      c.jsx("p", {
                                        className:
                                          "font-semibold text-xs text-text-main dark:text-gray-100 truncate",
                                        children: o.name,
                                      }),
                                      !!Object.keys(effectiveHomeClientReviewUnreadMap[o.id] || {}).length &&
                                      c.jsx("span", {
                                        className:
                                          "shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center font-bold",
                                        children: Object.keys(
                                          effectiveHomeClientReviewUnreadMap[o.id] || {},
                                        ).length,
                                      }),
                                    ],
                                  }),
                                  c.jsxs("p", {
                                    className: "text-[10px] text-gray-500",
                                    children: [
                                      (homeClientMissionProductsMap[o.id] || []).length,
                                      " items in this shopping",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                          c.jsxs("div", {
                            className: "flex gap-2 mt-1",
                            children: [
                              c.jsxs("span", {
                                className:
                                  `px-1.5 py-0.5 rounded-md text-[9px] font-bold ${vl < 0 ? "bg-emerald-100 text-emerald-800" : vl > 0 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"}`,
                                children: [
                                  "Saldo: ",
                                  vl < 0 ? "-$" : "$",
                                  formatAmount(Math.abs(vl)),
                                ],
                              }),
                              c.jsxs("span", {
                                className: "px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold",
                                children: ["Venta: $", formatAmount(N.sale)]
                              })
                            ]
                          })
                        ],
                      }),
                      c.jsxs("div", {
                        className: "shrink-0 flex items-center gap-1.5",
                        children: [
                          c.jsx("button", {
                            type: "button",
                            onClick: (N) => {
                              N.stopPropagation();
                              openPaymentModal(o, w);
                            },
                            className:
                              "w-8 h-8 rounded-md border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200 flex items-center justify-center transition",
                            title: "Registrar pago",
                            children: c.jsx("span", {
                              className:
                                "material-symbols-outlined text-[14px]",
                              children: "payments",
                            }),
                          }),
                          c.jsx("button", {
                            type: "button",
                            onClick: (N) => {
                              N.stopPropagation();
                              const A = `home-${w.id}-${o.id}`;
                              if (copiedMissionClients.includes(A)) {
                                setCopiedMissionClients((vl) =>
                                  vl.filter((El) => El !== A),
                                );
                                return;
                              }
                              copyAnnotatedMissionBreakdown(w, o);
                            },
                            className:
                              `w-8 h-8 rounded-md border flex items-center justify-center transition ${
                                copiedMissionClients.includes(`home-${w.id}-${o.id}`)
                                  ? "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950/35 dark:text-sky-200"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200"
                              }`,
                            title: copiedMissionClients.includes(`home-${w.id}-${o.id}`)
                              ? "Desglose copiado"
                              : "Copiar desglose",
                            children: c.jsx("span", {
                              className: "material-symbols-outlined text-[13px]",
                              children: copiedMissionClients.includes(`home-${w.id}-${o.id}`)
                                ? "done"
                                : "receipt_long",
                            }),
                          }),
                          c.jsx("span", {
                            onClick: () => Ta(o, w && w.id),
                            className:
                              "material-symbols-outlined text-gray-400 text-[18px]",
                            children: "chevron_right",
                          }),
                        ],
                      }),
                    ],
                  },
                  o.id,
                );
              }),
            }),
          ],
        }),
        w &&
        Rt.length === 0 &&
        c.jsxs("div", {
          className: isDesktopLayout
            ? "xl:order-3 xl:col-start-2 xl:row-span-2 text-center py-12 bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark shadow-card min-h-[420px] flex flex-col items-center justify-center xl:rounded-l-none xl:rounded-tr-3xl xl:rounded-br-3xl xl:-ml-px"
            : "text-center py-8 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark",
          children: [
            c.jsx("p", {
              className: "text-gray-400 text-sm",
              children: "No clients assigned to this shopping yet.",
            }),
            c.jsx("p", {
              className: "text-[10px] text-gray-400 mt-1",
              children: "Go to the Clients tab to add clients.",
            }),
          ],
        }),
        false && w &&
        c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark shadow-sm",
          children: [
            c.jsxs("h3", {
              className: "font-bold text-sm mb-3 text-text-main dark:text-white",
              children: ["Peticiones (", requests.length, ")"],
            }),
            c.jsx("div", {
              className: "max-h-[250px] overflow-y-auto ios-scroll space-y-2 pr-1",
              children:
                requests.length === 0
                  ? c.jsx("p", {
                    className: "text-xs text-gray-400 py-4 text-center",
                    children: "Sin peticiones activas.",
                  })
                  : requests.map((o) =>
                    c.jsxs(
                      "div",
                      {
                        className: `rounded-xl border p-3 ${o.status === "ACKNOWLEDGED" ? "bg-blue-50 border-blue-200" : o.status === "NO_STOCK" ? "bg-red-50 border-red-200" : o.status === "DISCARDED" ? "bg-gray-100 border-gray-200 opacity-70" : o.status === "MODIFIED" ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"}`,
                        children: [
                          editingRequestId === o.id
                            ? c.jsxs("div", {
                              className: "space-y-2 mb-2",
                              children: [
                                c.jsxs("div", {
                                  className: "flex gap-2",
                                  children: [
                                    c.jsx("input", {
                                      type: "text",
                                      value: editingRequestText,
                                      onChange: (N) =>
                                        setEditingRequestText(N.target.value),
                                      className:
                                        "flex-1 px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                                    }),
                                    c.jsx("button", {
                                      onClick: pickEditingRequestImage,
                                      disabled: editingRequestSaving,
                                      className:
                                        `px-2 py-1 rounded-lg border border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-200 ${editingRequestSaving ? "opacity-60 cursor-wait" : ""}`,
                                      title: "Cambiar imagen",
                                      children: c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-[16px]",
                                        children: "imagesmode",
                                      }),
                                    }),
                                  ],
                                }),
                                editingRequestImagePreview &&
                                c.jsxs("div", {
                                  className:
                                    "flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/40",
                                  children: [
                                    c.jsx("img", {
                                      src: editingRequestImagePreview,
                                      className:
                                        "ui-media-frame ui-media-md object-cover",
                                    }),
                                    c.jsx("p", {
                                      className:
                                        "flex-1 text-[11px] text-sky-900 dark:text-sky-100",
                                      children:
                                        editingRequestImageFile &&
                                        editingRequestImageFile.name
                                          ? editingRequestImageFile.name
                                          : "Imagen actual",
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className: "flex gap-2",
                                  children: [
                                    c.jsx("button", {
                                      onClick: () => saveRequestModify(o),
                                      disabled:
                                        editingRequestSaving ||
                                        !editingRequestText.trim(),
                                      className:
                                        `text-xs px-2 py-1 rounded text-white font-semibold ${editingRequestSaving || !editingRequestText.trim() ? "bg-amber-300 cursor-not-allowed" : "bg-amber-500 hover:bg-amber-600"}`,
                                      children: editingRequestSaving
                                        ? "Guardando..."
                                        : "Guardar",
                                    }),
                                    c.jsx("button", {
                                      onClick: cancelRequestModify,
                                      disabled: editingRequestSaving,
                                      className:
                                        "text-xs px-2.5 py-1.5 rounded-xl ui-btn-secondary font-semibold disabled:opacity-60 disabled:cursor-not-allowed",
                                      children: "Cancelar",
                                    }),
                                  ],
                                }),
                              ],
                            })
                            : c.jsxs(c.Fragment, {
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-xs font-medium text-gray-700 dark:text-gray-200 mb-2",
                                  children: o.description,
                                }),
                                o.image &&
                                c.jsx("button", {
                                  onClick: () =>
                                    setFullscreenImage(resolveMediaUrl(o.image)),
                                  className:
                                    "mb-2 ui-media-frame ui-media-ticket-md",
                                  children: c.jsx("img", {
                                    src: resolveMediaUrl(o.image),
                                    className: "w-full h-full object-cover",
                                  }),
                                }),
                              ],
                            }),
                          c.jsxs("p", {
                            className: "text-[10px] text-gray-500 mb-2",
                            children: [
                              o.created_by_username || "Usuario",
                              " (",
                              o.created_by_role || "AV",
                              ") • ",
                              o.client_name ? `${o.client_name} • ` : "",
                              getRelativeTime(o.updated_at || o.created_at),
                            ],
                          }),
                          c.jsxs("div", {
                            className: "flex flex-wrap gap-1",
                            children: [
                              c.jsx("button", {
                                onClick: () =>
                                  updateMissionRequest(
                                    o.id,
                                    o.status === "ACKNOWLEDGED"
                                      ? "PENDING"
                                      : "ACKNOWLEDGED",
                                  ),
                                className:
                                  "text-[10px] px-2 py-1 rounded bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200",
                                children: "Enterado",
                              }),
                              c.jsx("button", {
                                onClick: () =>
                                  updateMissionRequest(
                                    o.id,
                                    o.status === "NO_STOCK"
                                      ? "PENDING"
                                      : "NO_STOCK",
                                  ),
                                className:
                                  "text-[10px] px-2 py-1 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200",
                                children: "No Existencia",
                              }),
                              c.jsx("button", {
                                onClick: () =>
                                  updateMissionRequest(
                                    o.id,
                                    "DISCARDED",
                                  ),
                                className:
                                  "text-[10px] px-2 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300",
                                children: "Descartar",
                              }),
                              c.jsx("button", {
                                onClick: () => startRequestModify(o),
                                className:
                                  "text-[10px] px-2 py-1 rounded bg-amber-100 text-amber-700 font-semibold hover:bg-amber-200",
                                children: "Modificar",
                              }),
                              c.jsx("button", {
                                onClick: () => deleteMissionRequest(o.id),
                                className:
                                  "text-[10px] px-2 py-1 rounded bg-rose-100 text-rose-700 font-semibold hover:bg-rose-200",
                                children: "Borrar",
                              }),
                            ],
                          }),
                        ],
                      },
                      o.id,
                    ),
                  ),
            }),
            c.jsxs("div", {
              className: "mt-3 space-y-2",
              children: [
                newRequestImagePreview &&
                c.jsxs("div", {
                  className:
                    "flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/40",
                  children: [
                    c.jsx("img", {
                      src: newRequestImagePreview,
                      className: "ui-media-frame ui-media-md object-cover",
                    }),
                    c.jsx("p", {
                      className: "flex-1 text-[11px] text-sky-900 dark:text-sky-100",
                      children: newRequestImageFile && newRequestImageFile.name
                        ? newRequestImageFile.name
                        : "Imagen seleccionada",
                    }),
                    c.jsx("button", {
                      onClick: clearNewRequestImage,
                      className:
                        "w-8 h-8 rounded-full border border-sky-300 bg-white text-sky-700 dark:border-sky-700 dark:bg-slate-900 dark:text-sky-200 flex items-center justify-center",
                      title: "Quitar imagen",
                      children: c.jsx("span", {
                        className: "material-symbols-outlined text-[16px]",
                        children: "close",
                      }),
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: "flex gap-2 items-center flex-wrap sm:flex-nowrap w-full",
                  children: [
                    c.jsx("input", {
                      type: "text",
                      value: newRequestText,
                      onChange: (o) => setNewRequestText(o.target.value),
                      placeholder: "Nueva petición...",
                      className:
                        "flex-1 min-w-[120px] px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary w-full",
                    }),
                    c.jsx("button", {
                      onClick: pickRequestImage,
                      className:
                        "px-3 py-2 rounded-xl border border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200 flex-shrink-0",
                      title: "Adjuntar foto",
                      children: c.jsx("span", {
                        className: "material-symbols-outlined text-[18px]",
                        children: "add_photo_alternate",
                      }),
                    }),
                    c.jsx("button", {
                      onClick: createMissionRequest,
                      disabled: !newRequestText.trim() && !newRequestImageFile,
                      className: `px-4 py-2 rounded-xl text-sm font-semibold transition flex-shrink-0 flex-1 sm:flex-none ${newRequestText.trim() || newRequestImageFile ? "bg-primary text-white hover:bg-primary-dark" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`,
                      children: "Enviar",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
        c.jsxs("div", {
          className: isDesktopLayout
            ? w
              ? "xl:order-1 xl:col-start-1 xl:row-start-1 bg-surface-light dark:bg-surface-dark p-4 border border-border-light dark:border-border-dark shadow-card xl:rounded-tl-3xl xl:rounded-tr-none xl:rounded-br-none xl:rounded-bl-none"
              : "xl:order-1 xl:col-span-2 bg-surface-light dark:bg-surface-dark p-4 rounded-3xl border border-border-light dark:border-border-dark shadow-card"
            : "bg-surface-light dark:bg-surface-dark px-3 py-3 md:px-4",
          children: [
            c.jsxs("div", {
              className: isDesktopLayout
                ? "flex items-start justify-between gap-4"
                : "flex items-center justify-between gap-2",
              children: [
                c.jsxs("div", {
                  className: "min-w-0",
                  children: [
                    c.jsx("h3", {
                      className: isDesktopLayout
                        ? "font-bold text-lg text-text-main dark:text-white truncate"
                        : "font-bold text-sm text-text-main dark:text-white truncate",
                      children: "Shopping en Tienda",
                    }),
                    c.jsx("p", {
                      className: isDesktopLayout
                        ? "text-xs text-gray-500 truncate mt-0.5"
                        : "text-[10px] text-gray-500 truncate",
                      children: w
                        ? `${getMissionStoreLabel(w)} • ${w.status}`
                        : "Sin shopping activo",
                    }),
                  ],
                }),
                c.jsx("span", {
                  className: `font-bold rounded-full ${isDesktopLayout ? "text-[11px] px-2.5 py-1" : "text-[10px] px-2 py-1"} ${w ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`,
                  children: w ? "ON" : "OFF",
                }),
              ],
            }),
            w &&
            c.jsxs("div", {
              className: isDesktopLayout
                ? "mt-3 flex items-center justify-between gap-4"
                : "mt-2 flex items-start justify-between gap-3",
              children: [
                c.jsxs("span", {
                  className: isDesktopLayout
                    ? "pt-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300"
                    : "pt-0.5 text-[11px] font-semibold text-gray-600 dark:text-gray-300",
                  children: ["Items: ", missionProductsCount],
                }),
                c.jsxs("div", {
                  className: "text-right",
                  children: [
                    c.jsxs("span", {
                      className: isDesktopLayout
                        ? "block text-[10px] font-semibold text-primary"
                        : "block text-[11px] font-semibold text-primary",
                      children: [
                        "Total+Tax: $",
                        missionTotalWithTaxes.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                      ],
                    }),
                    c.jsxs("span", {
                      className: isDesktopLayout
                        ? "mt-0.5 block text-[9px] font-medium text-gray-500 dark:text-gray-400"
                        : "mt-0.5 block text-[10px] font-medium text-gray-500 dark:text-gray-400",
                      children: [
                        "Sin tax: $",
                        missionTotalWithoutTaxes.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: isDesktopLayout
                ? "mt-3 grid grid-cols-2 xl:grid-cols-4 gap-2"
                : "mt-2 grid grid-cols-4 gap-2",
              children: w
                ? [
                  w.status === "ACTIVE"
                    ? c.jsx(
                      "button",
                      {
                        onClick: be,
                        className:
                          isDesktopLayout
                            ? "py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600"
                            : "py-2 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600",
                        children: "Pause",
                      },
                      "pause",
                    )
                    : c.jsx(
                      "button",
                      {
                        onClick: cu,
                        className:
                          isDesktopLayout
                            ? "py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-700"
                            : "py-2 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700",
                        children: "Resume",
                      },
                      "resume",
                    ),
                  c.jsx(
                    "button",
                    {
                      onClick: on,
                      className:
                        isDesktopLayout
                          ? "py-1.5 rounded-lg bg-red-500 text-white text-[10px] font-bold hover:bg-red-600"
                          : "py-2 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600",
                      children: "End",
                    },
                    "end",
                  ),
                  c.jsx(
                    "button",
                    {
                      onClick: () => setMissionSummaryOpen(!0),
                      className:
                        isDesktopLayout
                          ? "py-1.5 rounded-lg bg-primary text-white text-[10px] font-bold hover:bg-primary-dark"
                          : "py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark",
                      children: "View",
                    },
                    "view",
                  ),
                  c.jsx(
                    "button",
                    {
                      onClick: openMissionTicketPicker,
                      disabled: missionTicketUploading,
                      className:
                        `${isDesktopLayout ? "py-1.5 text-[10px]" : "py-2 text-[11px]"} rounded-lg text-white font-bold ${missionTicketUploading ? "bg-purple-400 cursor-wait opacity-80" : "bg-purple-600 hover:bg-purple-700"}`,
                      children: missionTicketUploading ? "Subiendo..." : "Ticket",
                    },
                    "ticket",
                  ),
                ]
                : [
                  c.jsx(
                    "button",
                    {
                      onClick: openMissionStart,
                      className:
                        `${isDesktopLayout ? "col-span-4 py-1.5 text-[10px]" : "col-span-4 py-2 text-[11px]"} rounded-lg bg-primary text-white font-bold hover:bg-primary-dark`,
                      children: "Iniciar Shopping",
                    },
                    "start",
                  ),
                ],
            }),
            w &&
            c.jsx("div", {
              className:
                isDesktopLayout
                  ? "mt-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-2.5"
                  : "mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-2",
              children: missionTicketUploading
                ? c.jsxs("div", {
                  className: "flex items-center gap-2 text-purple-700",
                  children: [
                    c.jsx("span", {
                      className:
                        "material-symbols-outlined animate-spin text-[18px]",
                      children: "progress_activity",
                    }),
                    c.jsxs("div", {
                      children: [
                        c.jsx("p", {
                          className: "text-[11px] font-bold",
                          children: "Subiendo ticket de mision...",
                        }),
                        c.jsx("p", {
                          className: "text-[10px] text-purple-600",
                          children: "Se reflejara aqui al terminar la carga.",
                        }),
                      ],
                    }),
                  ],
                })
                : w.ticket_image
                ? c.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    c.jsx("img", {
                      src: resolveMediaUrl(w.ticket_image),
                      className: "ui-media-frame ui-media-sm object-cover",
                    }),
                    c.jsx("button", {
                      onClick: () => setFullscreenImage(resolveMediaUrl(w.ticket_image)),
                      className:
                        "text-[11px] font-bold text-primary hover:text-primary-dark",
                      children: "Ver ticket de misión",
                    }),
                  ],
                })
                : c.jsx("p", {
                  className: "text-[11px] text-gray-500",
                  children: "Ticket de misión pendiente.",
                }),
            }),
          ],
        }),
      ],
    }),
    pe = () => {
      const o = (A) =>
        A === "ACTIVE"
          ? "bg-green-100 text-green-700"
          : A === "PAUSED"
            ? "bg-amber-100 text-amber-700"
            : "bg-gray-200 text-gray-600",
        N = (A) =>
          A === "SHIPPED"
            ? "bg-blue-100 text-blue-700"
            : A === "REJECTED"
              ? "bg-red-100 text-red-700"
            : A === "IN_REVIEW"
              ? "bg-orange-100 text-orange-700"
              : "bg-amber-100 text-amber-700";
      return c.jsxs("div", {
        className: isDesktopLayout ? "space-y-6" : "space-y-4",
        children: [
          c.jsxs("div", {
            className: isDesktopLayout
              ? "flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mt-2 mb-2"
              : "flex items-center justify-between mt-2 mb-2",
            children: [
              c.jsx("h2", {
                className: "text-lg font-bold text-text-main dark:text-white",
                children: "Shoppings",
              }),
              !w &&
              c.jsxs("button", {
                onClick: openMissionStart,
                className:
                  "text-xs font-bold bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition flex items-center gap-1",
                children: [
                  c.jsx("span", {
                    className: "material-symbols-outlined text-[16px]",
                    children: "add",
                  }),
                  " New",
                ],
              }),
            ],
            }),
          c.jsx("input", {
            type: "text",
            value: missionSearch,
            onChange: (A) => setMissionSearch(A.target.value),
            placeholder: "Buscar misión o fecha...",
            className: isDesktopLayout
              ? "w-full max-w-2xl px-4 py-3 rounded-2xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary"
              : "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary",
          }),
          Al.length === 0
            ? c.jsxs("div", {
              className:
                "text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-dashed border-gray-300 p-6",
              children: [
                c.jsx("span", {
                  className:
                    "material-symbols-outlined text-4xl text-gray-300 mb-2",
                  children: "store_off",
                }),
                c.jsx("p", {
                  className: "font-bold text-lg mb-2",
                  children: "No shoppings yet",
                }),
                c.jsx("p", {
                  className: "text-gray-500 text-sm mb-4",
                  children: "Inicia tu primer shopping en tienda desde aqui.",
                }),
                c.jsx("button", {
                  onClick: openMissionStart,
                  className:
                    "px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition",
                  children: "Iniciar Shopping",
                }),
              ],
            })
            : c.jsx("div", {
              className: isDesktopLayout
                ? "grid gap-4 xl:grid-cols-2 2xl:grid-cols-3"
                : "space-y-3",
              children: Al.filter((A) => {
                const vl = getSearchTokens(missionSearch);
                if (!vl.length) return !0;
                const El = getMissionSearchBlob(A);
                return vl.every((Se) => El.includes(Se));
              }).map((A) => {
                const vl = fn === A.id,
                  El = w && w.id === A.id,
                  Se = A.clients_detail || [],
                  qa = Se.filter((gl) =>
                    (gl.products || []).some((ae) => ae.shopping === A.id),
                  ),
                  ea = (A.products || []).filter((gl) =>
                    A.status === "COMPLETED" ? gl.status === "ANNOTATED" : !0,
                  );
                return c.jsxs(
                  "div",
                  {
                    className: `bg-surface-light dark:bg-surface-dark rounded-xl border shadow-sm overflow-hidden transition-all ui-card-quiet h-full ${isDesktopLayout ? "rounded-2xl" : ""} ${El ? "border-primary/50 ring-1 ring-primary/20" : "border-border-light dark:border-border-dark"}`,
                    children: [
                      c.jsx("div", {
                        className: isDesktopLayout
                          ? "p-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                          : "p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition",
                        onClick: () => rn(vl ? null : A.id),
                        children: c.jsxs("div", {
                          className: "flex items-center justify-between",
                          children: [
                            c.jsx("div", {
                              className: "flex-1 min-w-0",
                              children:
                                pa === A.id
                                  ? c.jsxs("div", {
                                    className: "flex gap-2",
                                    onClick: (gl) => gl.stopPropagation(),
                                    children: [
                                      c.jsx("input", {
                                        type: "text",
                                        value: Sa,
                                        onChange: (gl) =>
                                          uu(gl.target.value),
                                        className:
                                          "flex-1 px-2 py-1 text-sm border rounded-lg dark:bg-gray-800",
                                        autoFocus: !0,
                                      }),
                                      c.jsx("button", {
                                        onClick: () => Fe(A.id),
                                        className:
                                          "text-xs bg-primary text-white px-3 py-1 rounded-lg font-bold",
                                        children: "Save",
                                      }),
                                      c.jsx("button", {
                                        onClick: () => dn(null),
                                        className: "text-xs text-gray-500",
                                        children: "✕",
                                      }),
                                    ],
                                  })
                                  : c.jsxs(c.Fragment, {
                                    children: [
                                      c.jsx("p", {
                                        className: isDesktopLayout
                                          ? "font-bold text-base truncate"
                                          : "font-bold text-sm truncate",
                                        children: A.name || getMissionStoreLabel(A),
                                      }),
                                      c.jsxs("p", {
                                        className: isDesktopLayout
                                          ? "text-[11px] text-gray-500 mt-0.5"
                                          : "text-[10px] text-gray-500 mt-0.5",
                                        children: [
                                          new Date(
                                            A.start_time,
                                          ).toLocaleDateString(),
                                          A.store_name &&
                                          c.jsxs(c.Fragment, {
                                            children: [" • ", A.store_name],
                                          }),
                                          " • ",
                                          qa.length,
                                          " clients • ",
                                          ea.length,
                                          " products",
                                        ],
                                      }),
                                    ],
                                  }),
                            }),
                            c.jsxs("div", {
                              className: "flex items-center gap-2 ml-2",
                              children: [
                                c.jsx("span", {
                                  className: `text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${o(A.status)}`,
                                  children: A.status,
                                }),
                                c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-gray-400 text-[18px] transition-transform",
                                  style: {
                                    transform: vl ? "rotate(180deg)" : "",
                                  },
                                  children: "expand_more",
                                }),
                              ],
                            }),
                          ],
                        }),
                      }),
                      vl &&
                      c.jsxs("div", {
                        className:
                          "border-t border-border-light dark:border-border-dark",
                        children: [
                          El &&
                          c.jsxs("div", {
                            className:
                              "px-4 py-3 bg-primary/5 border-b border-border-light flex gap-2",
                            children: [
                              w.status === "ACTIVE"
                                ? c.jsxs("button", {
                                  onClick: be,
                                  className:
                                    "flex-1 py-2 text-white font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-xs flex justify-center items-center gap-1",
                                  children: [
                                    c.jsx("span", {
                                      className:
                                        "material-symbols-outlined text-[14px]",
                                      children: "pause_circle",
                                    }),
                                    " Pause",
                                  ],
                                })
                                : c.jsxs("button", {
                                  onClick: cu,
                                  className:
                                    "flex-1 py-2 text-white font-bold rounded-lg bg-green-600 hover:bg-green-700 text-xs flex justify-center items-center gap-1",
                                  children: [
                                    c.jsx("span", {
                                      className:
                                        "material-symbols-outlined text-[14px]",
                                      children: "play_circle",
                                    }),
                                    " Resume",
                                  ],
                                }),
                              c.jsxs("button", {
                                onClick: on,
                                className:
                                  "flex-1 py-2 text-white font-bold rounded-lg bg-red-500 hover:bg-red-600 text-xs flex justify-center items-center gap-1",
                                children: [
                                  c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[14px]",
                                    children: "stop_circle",
                                  }),
                                  " End",
                                ],
                              }),
                            ],
                          }),
                          c.jsx("div", {
                            className: "px-4 py-3 border-b border-border-light dark:border-border-dark",
                            children: A.ticket_image
                              ? c.jsxs("div", {
                                className: "flex items-center gap-2",
                                children: [
                                  c.jsx("img", {
                                    src: resolveMediaUrl(A.ticket_image),
                                    className:
                                      "ui-media-frame ui-media-sm object-cover",
                                  }),
                                  c.jsx("button", {
                                    onClick: () => setFullscreenImage(resolveMediaUrl(A.ticket_image)),
                                    className:
                                      "text-[11px] font-bold text-primary hover:text-primary-dark",
                                    children: "Ver ticket de esta misión",
                                  }),
                                ],
                              })
                              : c.jsx("p", {
                                className: "text-[11px] text-gray-500",
                                children: "Sin ticket cargado para esta misión.",
                              }),
                          }),
                          qa.length > 0 &&
                          c.jsxs("div", {
                            className: "px-4 py-3",
                            children: [
                              c.jsxs("h4", {
                                className:
                                  "text-xs font-bold text-text-sub uppercase mb-2",
                                children: ["Clients (", qa.length, ")"],
                              }),
                              c.jsx("div", {
                                className: "space-y-2",
                                children: qa.map((gl) => {
                                  const ae = `${A.id}-${gl.id}`,
                                    oi = (gl.products || []).filter(
                                      (mi) =>
                                        mi.shopping === A.id &&
                                        (A.status === "COMPLETED"
                                          ? mi.status === "ANNOTATED"
                                          : !0),
                                    );
                                  return c.jsxs(
                                    "div",
                                    {
                                      className: `flex items-center gap-3 p-2.5 rounded-lg border ${copiedMissionClients.includes(ae) ? "bg-emerald-50 border-emerald-200" : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700"}`,
                                      children: [
                                        c.jsx("div", {
                                          className:
                                            "w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm uppercase",
                                          children: gl.name.charAt(0),
                                        }),
                                        c.jsxs("div", {
                                          className: "flex-1 min-w-0",
                                          children: [
                                            c.jsx("p", {
                                              className:
                                                "font-semibold text-xs truncate",
                                              children: gl.name,
                                            }),
                                            c.jsxs("p", {
                                              className:
                                                "text-[10px] text-gray-500",
                                              children: [
                                                oi.length,
                                                " items • ",
                                                (gl.receipts || [])
                                                  .length,
                                                " tickets",
                                              ],
                                            }),
                                          ],
                                        }),
                                        c.jsxs("div", {
                                          className: "flex items-center gap-1 shrink-0",
                                          children: [
                                            c.jsx("button", {
                                              onClick: () => Ta(gl, A.id),
                                              className:
                                                "text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg hover:bg-primary/20 transition",
                                              children: "View",
                                            }),
                                            c.jsx("button", {
                                              onClick: () =>
                                                copyMissionBreakdown(
                                                  A,
                                                  gl,
                                                ),
                                              className:
                                                "w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition flex items-center justify-center",
                                              title: "Copiar desglose",
                                              children: c.jsx("span", {
                                                className:
                                                  "material-symbols-outlined text-[16px]",
                                                children: "receipt_long",
                                              }),
                                            }),
                                          ],
                                        }),
                                      ],
                                    },
                                    gl.id,
                                  );
                                }),
                              }),
                            ],
                          }),
                          ea.length > 0 &&
                          c.jsxs("div", {
                            className:
                              "px-4 py-3 border-t border-border-light dark:border-border-dark",
                            children: [
                              c.jsxs("h4", {
                                className:
                                  "text-xs font-bold text-text-sub uppercase mb-2",
                                children: ["Products (", ea.length, ")"],
                              }),
                              c.jsx("div", {
                                className: "grid grid-cols-3 gap-1.5",
                                children: ea.map((gl) =>
                                  c.jsxs(
                                    "div",
                                    {
                                      className:
                                        "relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark shadow-card ui-card-quiet",
                                      children: [
                                        c.jsx("div", {
                                          className:
                                            "relative h-36 bg-[radial-gradient(circle_at_top,rgba(19,127,236,0.10),transparent_42%),linear-gradient(180deg,rgba(244,247,251,0.95),rgba(236,242,248,0.95))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_38%),linear-gradient(180deg,rgba(22,31,43,0.96),rgba(15,23,34,0.98))]",
                                          children: [
                                            gl.image
                                              ? c.jsx("img", {
                                                src: resolveMediaUrl(gl.image),
                                                className:
                                                  "w-full h-full object-cover cursor-zoom-in",
                                                onClick: () =>
                                                  setFullscreenImage({
                                                    url: resolveMediaUrl(gl.image),
                                                    copyOnClick: !0,
                                                    copyMessage: "Imagen copiada.",
                                                  }),
                                                title: "Abrir imagen",
                                              })
                                              : c.jsxs("div", {
                                                className:
                                                  "w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500",
                                                children: [
                                                  c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-3xl mb-0.5",
                                                    children: "image",
                                                  }),
                                                  c.jsx("span", {
                                                    className:
                                                      "text-[9px] uppercase font-bold tracking-wide",
                                                    children: "No Image",
                                                  }),
                                                ],
                                              }),
                                            c.jsx("span", {
                                              className: `absolute right-1.5 top-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${String(gl.status).toUpperCase() === "IN_REVIEW" ? "bg-amber-100/92 text-amber-800" : String(gl.status).toUpperCase() === "REJECTED" ? "bg-rose-100/92 text-rose-700" : String(gl.status).toUpperCase() === "BOUGHT" ? "bg-emerald-100/92 text-emerald-700" : String(gl.status).toUpperCase() === "SHIPPED" ? "bg-blue-100/92 text-blue-700" : "bg-white/90 text-gray-700"}`,
                                              children:
                                                String(gl.status).toUpperCase() === "IN_REVIEW"
                                                  ? "Revision"
                                                  : String(gl.status).toUpperCase() === "ANNOTATED"
                                                    ? "Anotado"
                                                    : String(gl.status).toUpperCase() === "BOUGHT"
                                                      ? "Comprado"
                                                      : String(gl.status).toUpperCase() === "SHIPPED"
                                                        ? "Enviado"
                                                        : String(gl.status).toUpperCase() === "REJECTED"
                                                          ? "Rechazado"
                                                          : gl.status,
                                            }),
                                            c.jsxs("div", {
                                              className:
                                                "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/45 to-transparent px-2 py-1.5",
                                              children: [
                                                c.jsx("p", {
                                                  className:
                                                    "text-[10px] font-bold text-white truncate",
                                                  children: gl.name,
                                                }),
                                                c.jsxs("div", {
                                                  className:
                                                    "mt-1 flex items-center justify-between gap-1",
                                                  children: [
                                                    c.jsx("span", {
                                                      className:
                                                        "inline-flex max-w-[70%] truncate rounded-full bg-white/16 px-1.5 py-0.5 text-[9px] font-semibold text-white/92 backdrop-blur-sm",
                                                      children:
                                                        gl.client_name || `Cliente #${gl.client}`,
                                                    }),
                                                    hasValue(gl.charged_price) &&
                                                      c.jsxs("span", {
                                                        className:
                                                          "shrink-0 rounded-full bg-white/18 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm",
                                                        children: ["$", gl.charged_price],
                                                      }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        gl.tags &&
                                        c.jsx("div", {
                                          className:
                                            "px-1.5 py-1 flex flex-wrap gap-1 border-t border-gray-100 dark:border-gray-800 bg-white/75 dark:bg-gray-900/25",
                                          children: gl.tags
                                            .split(",")
                                            .map((vl) => parseVisualTag(vl))
                                            .filter((vl) => vl)
                                            .slice(0, 2)
                                            .map((vl, El) =>
                                              c.jsx(
                                                "span",
                                                {
                                                  className: `${getTagClassName(vl.type)} text-[9px] px-1.5 py-0.5 rounded`,
                                                  children: vl.label,
                                                },
                                                `${gl.id}-shopping-product-tag-${El}`,
                                              ),
                                            ),
                                        }),
                                        !gl.tags &&
                                        c.jsx("div", {
                                          className:
                                            "h-1.5 bg-white dark:bg-gray-900/25",
                                        }),
                                      ],
                                    },
                                    gl.id,
                                  ),
                                ),
                              }),
                            ],
                          }),
                          qa.length === 0 &&
                          ea.length === 0 &&
                          c.jsx("div", {
                            className: "px-4 py-6 text-center",
                            children: c.jsx("p", {
                              className: "text-xs text-gray-400",
                              children:
                                "No clients or products linked to this shopping.",
                            }),
                          }),
                          A.status === "COMPLETED" &&
                          c.jsx("div", {
                            className:
                              "px-4 py-3 border-t border-border-light dark:border-border-dark",
                            children: c.jsxs("button", {
                              onClick: () => exportMissionCsv(A),
                              className:
                                "w-full py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition flex justify-center items-center gap-1",
                              children: [
                                c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-[14px]",
                                  children: "download",
                                }),
                                " Export CSV",
                              ],
                            }),
                          }),
                          c.jsxs("div", {
                            className:
                              "px-4 py-3 border-t border-border-light dark:border-border-dark bg-gray-50/50 dark:bg-gray-900/30 flex gap-2",
                            children: [
                              c.jsxs("button", {
                                onClick: (gl) => {
                                  (gl.stopPropagation(),
                                    dn(A.id),
                                    uu(A.name || ""));
                                },
                                className:
                                  "flex-1 py-2 text-xs font-semibold text-gray-600 bg-white dark:bg-gray-800 dark:text-gray-300 border rounded-lg hover:bg-gray-100 transition flex justify-center items-center gap-1",
                                children: [
                                  c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[14px]",
                                    children: "edit",
                                  }),
                                  " Rename",
                                ],
                              }),
                              c.jsxs("button", {
                                onClick: (gl) => {
                                  (gl.stopPropagation(), mn(A.id));
                                },
                                className:
                                  "flex-1 py-2 text-xs font-semibold text-red-500 bg-white dark:bg-gray-800 border border-red-100 rounded-lg hover:bg-red-50 transition flex justify-center items-center gap-1",
                                children: [
                                  c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[14px]",
                                    children: "delete",
                                  }),
                                  " Delete",
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  },
                  A.id,
                );
              }),
            }),
        ],
      });
    },
    Hl = () => {
      const o = Kl.filter(
        (N) =>
          N.name.toLowerCase().includes(j.toLowerCase()) ||
          (N.tags && N.tags.toLowerCase().includes(j.toLowerCase())),
      );
      return c.jsxs("div", {
        className: isDesktopLayout ? "space-y-6" : "space-y-4",
        children: [
          c.jsxs("div", {
            className: isDesktopLayout
              ? "flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between mb-2"
              : "flex items-center justify-between mb-2",
            children: [
              c.jsxs("div", {
                children: [
                  c.jsx("h2", {
                    className: "text-lg font-bold text-text-main",
                    children: "Clients",
                  }),
                  c.jsxs("p", {
                    className: "text-xs text-text-sub",
                    children: ["Total: ", Kl.length],
                  }),
                ],
              }),
              X !== "PS" &&
              c.jsxs("button", {
                onClick: () => k(!0),
                className:
                  "bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition",
                children: [
                  c.jsx("span", {
                    className: "material-symbols-outlined text-[18px]",
                    children: "add",
                  }),
                  " New",
                ],
              }),
            ],
          }),
          c.jsxs("div", {
            className: "relative",
            children: [
              c.jsx("span", {
                className:
                  "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
                children: "search",
              }),
              c.jsx("input", {
                type: "text",
                placeholder: "Search by name or tags...",
                value: j,
                onChange: (N) => _(N.target.value),
                className: isDesktopLayout
                  ? "w-full max-w-2xl pl-10 pr-4 py-3.5 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
                  : "w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
              }),
            ],
          }),
          o.length === 0
            ? c.jsx("div", {
              className:
                "text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light border-dashed",
              children: c.jsx("p", {
                className: "text-gray-500 text-sm",
                children: "No clients defined or matched search.",
              }),
            })
            : o.map((N) => {
              const A = Ei === N.id,
                vl = getHomeVisibleProducts(N),
                El = getHomeClientTotals(vl),
                Se = vl.reduce((ea, gl) => {
                  const ae = String(gl.shopping);
                  return (ea[ae] || (ea[ae] = []), ea[ae].push(gl), ea);
                }, {}),
                ea = Array.from(
                  new Set([
                    ...Object.keys(Se),
                    ...((N.payments || []).map((gl) =>
                      String((gl && (gl.shopping || gl.mission)) || ""),
                    ).filter(Boolean)),
                  ]),
                )
                  .map((gl) => {
                    const ae = Se[gl] || [],
                      Pi = getClientShoppingPayments(N, gl),
                      pa = getClientShoppingPaymentSummary(N, gl),
                      oiPaymentName =
                        (Pi[0] && (Pi[0].shopping_name || Pi[0].mission_name)) || "",
                      oiPaymentDate =
                        (Pi[0] && (Pi[0].updated_at || Pi[0].created_at)) || "";
                    const oi =
                        Al.find((mi) => mi.id === Number(gl)),
                      oiName = (ae[0] && (ae[0].shopping_name || ae[0].mission_name)
                        ? String(ae[0].shopping_name || ae[0].mission_name).trim()
                        : oiPaymentName),
                      mi =
                        oi && oi.name
                          ? oi.name
                          : oiName
                            ? oiName
                            : `Tienda #${gl}`,
                      Ri =
                        (oi && oi.start_time) ||
                        (ae[0] && (ae[0].shopping_date || ae[0].mission_date || ae[0].created_at)) ||
                        oiPaymentDate ||
                        "";
                    return {
                      key: gl,
                      shopping: oi,
                      title: mi,
                      date: Ri,
                      items: ae,
                      payments: Pi,
                      productsTotal: getPaymentProductsTotal(ae),
                      paymentsTotal: pa.amount,
                      balance: pa.balance,
                    };
                  })
                  .sort(
                    (gl, ae) =>
                      new Date(ae.date || 0).getTime() -
                      new Date(gl.date || 0).getTime(),
                  );
              return c.jsxs(
                "div",
                {
                  className:
                    "bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark overflow-hidden group ui-card-quiet",
                  children: [
                    c.jsxs("div", {
                      className: "px-3 py-3 flex items-start gap-3 relative",
                      children: [
                        c.jsx("div", {
                          className:
                            "w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base uppercase border border-primary/15",
                          children: N.name.charAt(0),
                        }),
                        c.jsxs("div", {
                          className: "flex-1 min-w-0 cursor-pointer",
                          onClick: () => ge(A ? null : N.id),
                          children: [
                            c.jsx("h3", {
                              className: "font-bold text-sm",
                              children: N.name,
                            }),
                            c.jsxs("p", {
                              className: "text-xs text-gray-500",
                              children: [
                                vl.length,
                                " items • ",
                                (N.receipts || []).length,
                                " tickets",
                              ],
                            }),
                            c.jsxs("div", {
                              className: "mt-1.5 space-y-0.5",
                              children: [
                                c.jsxs("p", {
                                  className:
                                    "text-[11px] font-bold text-emerald-700 dark:text-emerald-300",
                                  children: [
                                    "Total USD: $",
                                    formatAmount(El.usd),
                                  ],
                                }),
                                c.jsxs("p", {
                                  className:
                                    "text-[11px] font-bold text-blue-700 dark:text-blue-300",
                                  children: [
                                    "Total Venta: $",
                                    formatAmount(El.sale),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: "mt-2 grid grid-cols-2 gap-2 max-w-[18rem] min-w-0",
                              children: [
                                c.jsxs("div", {
                                  className:
                                    "rounded-xl border border-emerald-200 bg-emerald-50/90 px-2 py-2 shadow-[0_12px_24px_-22px_rgba(5,150,105,0.45)] min-w-0 overflow-hidden",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[9px] font-black uppercase tracking-[0.08em] text-emerald-700/75",
                                      children: "USD",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "mt-0.5 text-[11px] sm:text-[13px] font-extrabold text-emerald-800 leading-none truncate tabular-nums",
                                      children: ["$", formatAmount(El.usd)],
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className:
                                    "rounded-xl border border-blue-200 bg-blue-50/95 px-2 py-2 shadow-[0_14px_24px_-22px_rgba(37,99,235,0.48)] min-w-0 overflow-hidden",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[9px] font-black uppercase tracking-[0.08em] text-blue-700/75",
                                      children: "Venta",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "mt-0.5 text-[11px] sm:text-[13px] font-extrabold text-blue-800 leading-none truncate tabular-nums",
                                      children: ["$", formatAmount(El.sale)],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            N.tags &&
                            c.jsx("p", {
                              className:
                                "text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate",
                              children: N.tags,
                            }),
                          ],
                        }),
                        c.jsxs("div", {
                          className:
                            "shrink-0 self-start flex flex-col items-end gap-1.5 pt-0.5",
                          children: [
                            w
                              ? c.jsx("div", {
                                onClick: () => Jt(N),
                                className: `px-2.5 py-1 rounded-full text-[8px] font-bold uppercase leading-none tracking-[0.08em] whitespace-nowrap transition cursor-pointer ${N.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                                children:
                                  N.status === "Active"
                                    ? "In Shopping"
                                    : "Idle",
                              })
                              : null,
                            c.jsxs("div", {
                              className:
                                "flex items-center justify-end gap-0.5 shrink-0",
                              children: [
                                c.jsx("button", {
                                  onClick: () => {
                                    const A = `client-history-${N.id}`;
                                    if (copiedClientShareLinks.includes(A)) {
                                      setCopiedClientShareLinks((vl) =>
                                        vl.filter((El) => El !== A),
                                      );
                                      return;
                                    }
                                    copyClientMissionShareLink(null, N);
                                  },
                                  className:
                                    `w-7 h-7 rounded-full flex items-center justify-center ${copiedClientShareLinks.includes(`client-history-${N.id}`) ? "bg-sky-100 text-sky-700 dark:bg-sky-950/35 dark:text-sky-200" : "hover:bg-violet-100 text-violet-600 dark:text-violet-300 dark:hover:bg-violet-950/30"}`,
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[15px]",
                                    children: "share",
                                  }),
                                }),
                                c.jsx("button", {
                                  onClick: () => {
                                    (Y(N),
                                      hl({
                                        name: N.name,
                                        tags: N.tags || "",
                                        status: N.status,
                                        phone: N.phone || "",
                                        email: N.email || "",
                                        shipping_address:
                                          N.shipping_address || "",
                                      }),
                                      tl(!0));
                                  },
                                  className:
                                    "w-6 h-6 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[15px]",
                                    children: "more_vert",
                                  }),
                                }),
                                c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-gray-400 text-[15px] cursor-pointer transition-transform",
                                  style: { transform: A ? "rotate(180deg)" : "" },
                                  onClick: () => ge(A ? null : N.id),
                                  children: "expand_more",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    }),
                    A &&
                    c.jsxs("div", {
                      className:
                        "border-t border-border-light dark:border-border-dark px-4 py-3",
                      children: [
                        N.phone &&
                        c.jsxs("p", {
                          className: "text-[10px] text-gray-500 mb-1",
                          children: ["📱 ", N.phone],
                        }),
                        N.email &&
                        c.jsxs("p", {
                          className: "text-[10px] text-gray-500 mb-1",
                          children: ["📧 ", N.email],
                        }),
                        N.shipping_address &&
                        c.jsxs("p", {
                          className: "text-[10px] text-gray-500 mb-2",
                          children: ["📦 ", N.shipping_address],
                        }),
                        vl.length === 0 && (N.payments || []).length === 0
                          ? c.jsx("p", {
                            className:
                              "text-xs text-gray-400 text-center py-4",
                            children: "No purchases yet for this client.",
                          })
                          : c.jsxs(c.Fragment, {
                            children: [
                              c.jsxs("h4", {
                                className:
                                  "text-xs font-bold text-text-sub uppercase mb-2",
                                children: [
                                  "Shopping History (",
                                  ea.length,
                                  ")",
                                ],
                              }),
                              c.jsx("div", {
                                className:
                                  "space-y-1.5 max-h-[300px] overflow-y-auto",
                                children: ea.map((ea) =>
                                  c.jsxs(
                                    "div",
                                    {
                                      className: "rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 overflow-hidden",
                                      children: [
                                        c.jsxs("div", {
                                          className:
                                            "px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-100/70 dark:hover:bg-gray-700/40 transition",
                                          onClick: () =>
                                            setOpenHistoryMissionByClient((gl) => ({
                                              ...gl,
                                              [N.id]:
                                                gl[N.id] === ea.key ? null : ea.key,
                                            })),
                                          children: [
                                            c.jsxs("div", {
                                              className: "min-w-0 flex-1",
                                              children: [
                                                c.jsx("p", {
                                                  className:
                                                    "font-semibold text-xs truncate",
                                                  children: ea.title,
                                                }),
                                                c.jsxs("p", {
                                                  className:
                                                    "text-[10px] text-gray-500",
                                                  children: [
                                                    ea.items.length,
                                                    " item(s)",
                                                    ea.payments.length > 0 &&
                                                    c.jsxs(c.Fragment, {
                                                      children: [
                                                        " • ",
                                                        ea.payments.length,
                                                        " pago(s)",
                                                      ],
                                                    }),
                                                    ea.date &&
                                                    c.jsxs(c.Fragment, {
                                                      children: [
                                                        " • ",
                                                        new Date(
                                                          ea.date,
                                                        ).toLocaleDateString(),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                                c.jsxs("div", {
                                                  className: "mt-1 flex flex-wrap gap-1",
                                                  children: [
                                                    c.jsxs("span", {
                                                      className:
                                                        "inline-flex rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700",
                                                      children: [
                                                        "Venta: $",
                                                        formatAmount(ea.productsTotal),
                                                      ],
                                                    }),
                                                    c.jsxs("span", {
                                                      className:
                                                        "inline-flex rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700",
                                                      children: [
                                                        "Pagado: $",
                                                        formatAmount(ea.paymentsTotal),
                                                      ],
                                                    }),
                                                    c.jsxs("span", {
                                                      className:
                                                        `inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                                          ea.balance < 0
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-700"
                                                        }`,
                                                      children: [
                                                        ea.balance < 0
                                                          ? "Credito: $"
                                                          : "Saldo: $",
                                                        formatAmount(
                                                          ea.balance < 0
                                                            ? Math.abs(ea.balance)
                                                            : ea.balance,
                                                        ),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                            c.jsxs("div", {
                                              className: "ml-2 flex items-center gap-0.5 shrink-0",
                                              children: [
                                                c.jsx("button", {
                                                  type: "button",
                                                  onClick: (gl) => {
                                                    gl.stopPropagation();
                                                    openPaymentModal(
                                                      N,
                                                      ea.shopping || { id: Number(ea.key) },
                                                    );
                                                  },
                                                  className:
                                                    "w-7 h-7 rounded-md bg-violet-100 text-violet-700 hover:bg-violet-200 transition flex items-center justify-center",
                                                  title: "Registrar pago",
                                                  children: c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-[14px]",
                                                    children: "payments",
                                                  }),
                                                }),
                                                c.jsx("button", {
                                                  type: "button",
                                                  onClick: (gl) => {
                                                    gl.stopPropagation();
                                                    copyMissionBreakdown(
                                                      ea.shopping || { id: Number(ea.key) },
                                                      N,
                                                    );
                                                  },
                                                  className:
                                                    "w-7 h-7 rounded-md bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition flex items-center justify-center",
                                                  title: "Copiar desglose de esta misión",
                                                  children: c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-[14px]",
                                                    children: "receipt_long",
                                                  }),
                                                }),
                                                c.jsx("span", {
                                                  className:
                                                    "material-symbols-outlined text-[14px] text-gray-500",
                                                  children:
                                                    openHistoryMissionByClient[N.id] ===
                                                    ea.key
                                                      ? "expand_less"
                                                      : "expand_more",
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        openHistoryMissionByClient[N.id] ===
                                        ea.key &&
                                        c.jsx("div", {
                                          className:
                                            "border-t border-gray-200 dark:border-gray-700 px-2 py-1.5 space-y-1",
                                          children: [
                                            ea.payments.length > 0 &&
                                            c.jsxs("div", {
                                              className: "mb-2 space-y-1.5",
                                              children: [
                                                c.jsx("p", {
                                                  className:
                                                    "text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-300",
                                                  children: "Pagos",
                                                }),
                                                ea.payments.map((gl) => {
                                                  const ae = getPaymentRecordProducts(gl),
                                                    oi = getPaymentRecordAmount(gl),
                                                    Pi = getPaymentRecordProductsTotal(gl),
                                                    bi = getPaymentRecordBalance(gl);
                                                  return c.jsxs(
                                                    "div",
                                                    {
                                                      className:
                                                        "rounded-lg border border-violet-100 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/20 px-2.5 py-2 space-y-2",
                                                      children: [
                                                        c.jsxs("div", {
                                                          className:
                                                            "flex items-start justify-between gap-2",
                                                          children: [
                                                            c.jsxs("div", {
                                                              className:
                                                                "min-w-0",
                                                              children: [
                                                                c.jsx("p", {
                                                                  className:
                                                                    "text-xs font-bold text-text-main dark:text-white",
                                                                  children: `Pago #${gl.id}`,
                                                                }),
                                                                c.jsxs("p", {
                                                                  className:
                                                                    "text-[10px] text-text-sub mt-0.5",
                                                                  children: [
                                                                    gl.created_by_username ||
                                                                    "Usuario",
                                                                    " - ",
                                                                    getRelativeTime(
                                                                      gl.updated_at ||
                                                                        gl.created_at,
                                                                    ),
                                                                  ],
                                                                }),
                                                              ],
                                                            }),
                                                            c.jsxs("div", {
                                                              className:
                                                                "flex items-center gap-0.5 shrink-0",
                                                              children: [
                                                                c.jsx("button", {
                                                                  type: "button",
                                                                  onClick: (oiEvent) => {
                                                                    oiEvent.stopPropagation();
                                                                    openPaymentModal(
                                                                      N,
                                                                      ea.shopping || { id: Number(ea.key) },
                                                                      gl,
                                                                    );
                                                                  },
                                                                  className:
                                                                    "w-6 h-6 rounded-md bg-white/90 dark:bg-slate-900/70 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-800 flex items-center justify-center",
                                                                  title: "Editar pago",
                                                                  children: c.jsx("span", {
                                                                    className:
                                                                      "material-symbols-outlined text-[13px]",
                                                                    children:
                                                                      "edit",
                                                                  }),
                                                                }),
                                                                c.jsx("button", {
                                                                  type: "button",
                                                                  onClick: (oiEvent) => {
                                                                    oiEvent.stopPropagation();
                                                                    deletePayment(
                                                                      gl,
                                                                    );
                                                                  },
                                                                  className:
                                                                    "w-6 h-6 rounded-md bg-white/90 dark:bg-slate-900/70 text-rose-700 dark:text-rose-200 border border-rose-200 dark:border-rose-800 flex items-center justify-center",
                                                                  title:
                                                                    "Eliminar pago",
                                                                  children: c.jsx("span", {
                                                                    className:
                                                                      "material-symbols-outlined text-[13px]",
                                                                    children:
                                                                      "delete",
                                                                  }),
                                                                }),
                                                              ],
                                                            }),
                                                          ],
                                                        }),
                                                        c.jsxs("div", {
                                                          className:
                                                            "flex flex-wrap gap-1",
                                                          children: [
                                                            c.jsxs("span", {
                                                              className:
                                                                "inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700",
                                                              children: [
                                                                "Monto: $",
                                                                formatAmount(oi),
                                                              ],
                                                            }),
                                                            c.jsxs("span", {
                                                              className:
                                                                "inline-flex rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700",
                                                              children: [
                                                                "Venta: $",
                                                                formatAmount(Pi),
                                                              ],
                                                            }),
                                                            c.jsxs("span", {
                                                              className:
                                                                `inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                                                  bi < 0
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : bi > 0
                                                                      ? "bg-slate-200 text-slate-700"
                                                                      : "bg-emerald-100 text-emerald-700"
                                                                }`,
                                                              children: [
                                                                bi < 0
                                                                  ? "Credito: $"
                                                                  : "Saldo: $",
                                                                formatAmount(
                                                                  bi < 0
                                                                    ? Math.abs(bi)
                                                                    : bi,
                                                                ),
                                                              ],
                                                            }),
                                                          ],
                                                        }),
                                                        gl.note &&
                                                        c.jsx("p", {
                                                          className:
                                                            "text-[10px] text-text-sub rounded-md bg-white/80 dark:bg-slate-900/50 px-2 py-1 border border-violet-100 dark:border-violet-900/50",
                                                          children: gl.note,
                                                        }),
                                                        ae.length > 0
                                                          ? c.jsx("div", {
                                                            className:
                                                              "flex flex-wrap gap-1",
                                                            children: ae.map((oiProduct) =>
                                                              c.jsxs(
                                                                "span",
                                                                {
                                                                  className:
                                                                    "inline-flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-800 bg-white/90 dark:bg-slate-900/70 px-2 py-1 text-[10px] font-medium text-violet-700 dark:text-violet-200",
                                                                  children: [
                                                                    oiProduct.name,
                                                                    c.jsxs("span", {
                                                                      className:
                                                                        "font-bold",
                                                                      children: [
                                                                        "$",
                                                                        formatAmount(
                                                                          getProductPaymentAmount(
                                                                            oiProduct,
                                                                          ),
                                                                        ),
                                                                      ],
                                                                    }),
                                                                  ],
                                                                },
                                                                `payment-product-${gl.id}-${oiProduct.id}`,
                                                              ),
                                                            ),
                                                          })
                                                          : c.jsx("p", {
                                                            className:
                                                              "text-[10px] text-text-sub",
                                                            children:
                                                              "Sin productos ligados a este pago.",
                                                          }),
                                                      ],
                                                    },
                                                    gl.id,
                                                  );
                                                }),
                                              ],
                                            }),
                                            ea.items.map((gl) =>
                                            c.jsxs(
                                              "div",
                                              {
                                                className:
                                                  "flex items-center justify-between bg-white dark:bg-gray-900/30 px-2 py-1.5 rounded-md text-xs border border-gray-100 dark:border-gray-700",
                                                children: [
                                                  c.jsxs("div", {
                                                    className:
                                                      "flex items-center gap-2 flex-1 min-w-0",
                                                    children: [
                                                      gl.image
                                                        ? c.jsx("img", {
                                                          src: resolveMediaUrl(
                                                            gl.image,
                                                          ),
                                                          className:
                                                            "ui-media-frame ui-media-xs object-cover",
                                                        })
                                                        : c.jsx("div", {
                                                          className:
                                                            "ui-media-frame ui-media-xs bg-gray-200 dark:bg-gray-700 flex items-center justify-center",
                                                          children: c.jsx(
                                                            "span",
                                                            {
                                                              className:
                                                                "material-symbols-outlined text-gray-400 text-[12px]",
                                                              children:
                                                                "image",
                                                            },
                                                          ),
                                                        }),
                                                      c.jsxs("div", {
                                                        className: "min-w-0",
                                                        children: [
                                                          c.jsx("p", {
                                                            className:
                                                              "font-semibold truncate",
                                                            children: gl.name,
                                                          }),
                                                          gl.shipment &&
                                                          c.jsxs("p", {
                                                            className:
                                                              "text-[9px] text-sky-600 dark:text-sky-300 truncate",
                                                            children: [
                                                              "Envio: ",
                                                              gl.shipment.carrier ||
                                                                "Paqueteria",
                                                              gl.shipment.tracking_number
                                                                ? ` • ${gl.shipment.tracking_number}`
                                                                : "",
                                                            ],
                                                          }),
                                                          gl.tags &&
                                                          c.jsx("p", {
                                                            className:
                                                              "text-[9px] text-purple-500 truncate",
                                                            children: gl.tags,
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  c.jsxs("div", {
                                                    className:
                                                      "flex items-center gap-2 ml-2",
                                                    children: [
                                                      c.jsx("button", {
                                                        type: "button",
                                                        onClick: (ae) => {
                                                          ae.stopPropagation();
                                                          gl.shipment
                                                            ? openShipmentEditor(
                                                                gl.shipment,
                                                                gl,
                                                              )
                                                            : openShipmentAssignmentPicker(
                                                                gl,
                                                              );
                                                        },
                                                        className:
                                                          `w-7 h-7 rounded-md border flex items-center justify-center ${
                                                            gl.shipment
                                                              ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200"
                                                              : "border-gray-200 bg-white text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                                          }`,
                                                        title: gl.shipment
                                                          ? "Editar envio"
                                                          : "Asignar envio",
                                                        children: c.jsx("span", {
                                                          className:
                                                            "material-symbols-outlined text-[14px]",
                                                          children: "local_shipping",
                                                        }),
                                                      }),
                                                      hasValue(gl.charged_price) &&
                                                      c.jsxs("span", {
                                                        className:
                                                          "text-[10px] font-bold text-blue-600",
                                                        children: [
                                                          "$",
                                                          gl.charged_price,
                                                        ],
                                                      }),
                                                      c.jsx("span", {
                                                        className: `text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${gl.status === "SHIPPED" ? "bg-blue-100 text-blue-700" : gl.status === "REJECTED" ? "bg-red-100 text-red-700" : gl.status === "IN_REVIEW" ? "bg-orange-100 text-orange-700" : "bg-amber-100 text-amber-700"}`,
                                                        children: gl.status === "BOUGHT" ? "ANNOTATED" : gl.status,
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              },
                                              gl.id,
                                            ),
                                          ),
                                          ],
                                        }),
                                      ],
                                    },
                                    ea.key,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        c.jsxs("button", {
                          onClick: () => Ta(N),
                          className:
                            "mt-2 px-3 py-1.5 text-[11px] font-bold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition inline-flex items-center justify-center gap-1",
                          children: [
                            c.jsx("span", {
                              className:
                                "material-symbols-outlined text-[13px]",
                              children: "open_in_new",
                            }),
                            " Open Full Gallery",
                          ],
                        }),
                      ],
                    }),
                  ],
                },
                N.id,
              );
            }),
        ],
      });
    },
    xu = () => {
      const o = shipments.filter((N) => {
        const A = String(shipmentSearch || "").trim().toLowerCase();
        if (!A) return !0;
        return [
          N.client_name,
          N.shopping_name || N.mission_name,
          ...((N.shopping_names || N.mission_names || [])),
          N.carrier,
          N.tracking_number,
          N.shipping_address,
          ...((N.products_detail || []).map((vl) => vl.name)),
        ]
          .filter(Boolean)
          .some((vl) => String(vl).toLowerCase().includes(A));
      });
      return c.jsxs("div", {
        className: "space-y-4",
        children: [
          c.jsxs("div", {
            className: "flex items-center justify-between mb-2",
            children: [
              c.jsxs("div", {
                children: [
                  c.jsx("h2", {
                    className: "text-lg font-bold text-text-main",
                    children: "Shipments",
                  }),
                  c.jsxs("p", {
                    className: "text-xs text-text-sub",
                    children: ["Total: ", shipments.length],
                  }),
                ],
              }),
              c.jsxs("button", {
                onClick: () => openShipmentEditor(),
                className:
                  "bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition",
                children: [
                  c.jsx("span", {
                    className: "material-symbols-outlined text-[18px]",
                    children: "add",
                  }),
                  " New",
                ],
              }),
            ],
          }),
          c.jsxs("div", {
            className: "relative",
            children: [
              c.jsx("span", {
                className:
                  "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400",
                children: "search",
              }),
              c.jsx("input", {
                type: "text",
                placeholder: "Buscar envio, cliente o guia...",
                value: shipmentSearch,
                onChange: (N) => setShipmentSearch(N.target.value),
                className:
                  "w-full pl-10 pr-4 py-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
              }),
            ],
          }),
          o.length === 0
            ? c.jsx("div", {
                className:
                  "text-center py-12 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light border-dashed",
                children: c.jsx("p", {
                  className: "text-gray-500 text-sm",
                  children: "No hay envios definidos o coincidentes.",
                }),
              })
            : c.jsx("div", {
                className: isDesktopLayout
                  ? "grid gap-4 xl:grid-cols-2 2xl:grid-cols-3"
                  : "space-y-2",
                children: o.map((N) =>
                  c.jsxs(
                    "div",
                    {
                      className: `rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-3 py-2.5 shadow-sm h-full ${isDesktopLayout ? "rounded-2xl" : ""}`,
                      children: [
                        c.jsxs("div", {
                          className: isDesktopLayout
                            ? "flex items-start justify-between gap-3"
                            : "flex items-start justify-between gap-2",
                          children: [
                            c.jsxs("div", {
                              className: "min-w-0",
                              children: [
                                c.jsx("p", {
                                  className: isDesktopLayout
                                    ? "text-sm font-bold text-text-main dark:text-white truncate"
                                    : "text-xs font-bold text-text-main dark:text-white truncate",
                                  children:
                                    N.tracking_number ||
                                    N.carrier ||
                                    `Envio #${N.id}`,
                                }),
                                c.jsxs("p", {
                                  className: isDesktopLayout
                                    ? "text-[12px] text-text-sub truncate"
                                    : "text-[11px] text-text-sub truncate",
                                  children: [
                                    N.client_name || "Cliente",
                                    (N.shopping_names || N.mission_names || []).length > 0
                                      ? ` • ${(N.shopping_names || N.mission_names || []).slice(0, 2).join(", ")}`
                                      : N.shopping_name || N.mission_name
                                        ? ` • ${N.shopping_name || N.mission_name}`
                                        : "",
                                  ],
                                }),
                                c.jsxs("div", {
                                  className: "mt-1 flex items-center gap-2 text-[11px]",
                                  children: [
                                    c.jsx("span", {
                                      className:
                                        "font-bold uppercase text-sky-700 dark:text-sky-300",
                                      children: getShipmentStatusLabel(N.status),
                                    }),
                                    c.jsxs("span", {
                                      className: "text-text-sub",
                                      children: [
                                        "$",
                                        formatAmount(
                                          parseFloat(
                                            N.client_price || N.guide_price || 0,
                                          ),
                                        ),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: "flex items-center gap-1",
                              children: [
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () =>
                                    setExpandedShipmentId((A) =>
                                      Number(A) === Number(N.id) ? null : N.id,
                                    ),
                                  className:
                                    "w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[16px]",
                                    children:
                                      Number(expandedShipmentId) === Number(N.id)
                                        ? "expand_less"
                                        : "expand_more",
                                  }),
                                }),
                                c.jsx("button", {
                                  onClick: () => openShipmentEditor(N),
                                  className:
                                    "w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[16px]",
                                    children: "edit",
                                  }),
                                }),
                                c.jsx("button", {
                                  onClick: () => deleteShipment(N),
                                  className:
                                    "w-8 h-8 rounded-lg border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[16px]",
                                    children: "delete",
                                  }),
                                }),
                              ],
                            }),
                          ],
                        }),
                        Number(expandedShipmentId) === Number(N.id) &&
                        c.jsxs("div", {
                          className: "mt-2 space-y-1.5",
                          children: [
                            c.jsxs("div", {
                              className: "grid grid-cols-2 gap-1.5",
                              children: [
                                c.jsxs("div", {
                                  className:
                                    "rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-text-sub",
                                      children: "Paqueteria",
                                    }),
                                    c.jsx("p", {
                                      className: "text-xs font-semibold mt-0.5",
                                      children: N.carrier || "Sin definir",
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className:
                                    "rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-1.5",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-text-sub",
                                      children: "Guia",
                                    }),
                                    c.jsx("p", {
                                      className:
                                        "text-xs font-semibold mt-0.5 break-all",
                                      children: N.tracking_number || "Sin definir",
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className:
                                    "col-span-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1.5",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300",
                                      children: "Precio",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "text-xs font-semibold mt-0.5 text-emerald-800 dark:text-emerald-200",
                                      children: [
                                        "$",
                                        formatAmount(
                                          parseFloat(
                                            N.client_price || N.guide_price || 0,
                                          ),
                                        ),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className:
                                "rounded-lg bg-sky-50 dark:bg-sky-950/20 px-2.5 py-1.5",
                              children: [
                                c.jsxs("p", {
                                  className:
                                    "text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300",
                                  children: [
                                    "Productos (",
                                    N.product_count || 0,
                                    ")",
                                  ],
                                }),
                                (N.products_detail || []).length > 0
                                  ? c.jsx("div", {
                                      className: "mt-1 flex flex-wrap gap-1",
                                      children: (N.products_detail || []).map((vl) =>
                                        c.jsx(
                                          "span",
                                          {
                                            className:
                                              "px-1.5 py-0.5 rounded-full bg-white/90 dark:bg-slate-900/80 text-[9px] font-medium text-sky-800 dark:text-sky-100 border border-sky-100 dark:border-sky-900",
                                            children: vl.name,
                                          },
                                          `${N.id}-shipment-product-${vl.id}`,
                                        ),
                                      ),
                                    })
                                  : c.jsx("p", {
                                      className:
                                        "mt-1 text-xs text-sky-700/80 dark:text-sky-300/80",
                                      children: "Sin productos asignados.",
                                    }),
                              ],
                            }),
                            c.jsxs("div", {
                              className:
                                "rounded-lg bg-gray-50 dark:bg-gray-900/40 px-2.5 py-1.5",
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-[10px] uppercase font-bold text-text-sub",
                                  children: "Direccion",
                                }),
                                c.jsx("p", {
                                  className:
                                    "text-xs mt-0.5 text-text-main dark:text-slate-200 whitespace-pre-wrap",
                                  children:
                                    N.shipping_address || "Sin direccion capturada",
                                }),
                              ],
                            }),
                          ],
                        }),
                      ],
                    },
                    N.id,
                  ),
                ),
              }),
        ],
      });
    },
    du = () =>
      c.jsxs("div", {
        className: isDesktopLayout
          ? "grid gap-6 xl:grid-cols-[minmax(280px,360px)_minmax(0,1fr)] items-start"
          : "space-y-6",
        children: [
          c.jsxs("div", {
            className:
              isDesktopLayout
                ? "bg-surface-light p-6 rounded-3xl border shadow-card text-center xl:sticky xl:top-6"
                : "bg-surface-light p-6 rounded-2xl border shadow-card text-center",
            children: [
              c.jsx("div", {
                className:
                  "w-24 h-24 mx-auto rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-4xl mb-4 border-4 border-white shadow-sm",
                children: J.username.charAt(0).toUpperCase(),
              }),
              c.jsx("h2", {
                className: "text-2xl font-bold",
                children: J.username,
              }),
              c.jsx("span", {
                className:
                  "inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs uppercase rounded-full",
                children: J.profile.role,
              }),
            ],
          }),
          c.jsxs("div", {
            className: isDesktopLayout
              ? "bg-surface-light p-5 rounded-3xl border shadow-card space-y-4"
              : "bg-surface-light p-4 rounded-2xl border shadow-card space-y-3",
            children: [
              c.jsxs("div", {
                className: "space-y-2",
                children: [
                  c.jsxs("div", {
                    children: [
                      c.jsx("h3", {
                        className: "text-sm font-bold text-text-main",
                        children: "Vista de la app",
                      }),
                      c.jsx("p", {
                        className: "text-xs text-text-sub mt-1",
                        children:
                          "Esta preferencia se guarda por perfil y se aplica al iniciar sesión.",
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className:
                      "grid grid-cols-2 rounded-2xl bg-gray-100 dark:bg-gray-800 p-1",
                    children: [
                      c.jsx("button", {
                        type: "button",
                        onClick: () => saveLayoutMode("MOBILE"),
                        className:
                          `rounded-xl px-3 py-2 text-xs font-bold transition ${layoutMode === "MOBILE" ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                        children: "Movil",
                      }),
                      c.jsx("button", {
                        type: "button",
                        onClick: () => saveLayoutMode("WEB"),
                        className:
                          `rounded-xl px-3 py-2 text-xs font-bold transition ${layoutMode === "WEB" ? "bg-primary text-white shadow-sm" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                        children: "Web",
                      }),
                    ],
                  }),
                ],
              }),
              c.jsxs("div", {
                children: [
                  c.jsx("h3", {
                    className: "text-sm font-bold text-text-main",
                    children: "Desglose Default",
                  }),
                  c.jsx("p", {
                    className: "text-xs text-text-sub mt-1",
                    children:
                      "Variables disponibles: {title}, {items}, {total}",
                  }),
                ],
              }),
              c.jsx("textarea", {
                value: defaultBreakdownTemplate,
                onChange: (o) => {
                  const N = o.target.value;
                  setDefaultBreakdownTemplate(N);
                  localStorage.setItem("default_breakdown_template", N);
                },
                rows: 8,
                className:
                  "w-full rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 px-3 py-2 text-xs text-text-main dark:text-white outline-none focus:ring-2 focus:ring-primary/40 whitespace-pre-wrap",
              }),
              c.jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  c.jsx("button", {
                    type: "button",
                    onClick: () => {
                      setDefaultBreakdownTemplate(DEFAULT_BREAKDOWN_TEMPLATE);
                      localStorage.setItem(
                        "default_breakdown_template",
                        DEFAULT_BREAKDOWN_TEMPLATE,
                      );
                    },
                    className:
                      "px-3 py-2 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs font-bold",
                    children: "Reset",
                  }),
                  c.jsx("p", {
                    className: "text-[11px] text-text-sub",
                    children:
                      "Se usa para los copiados de desglose en general.",
                  }),
                ],
              }),
            ],
          }),
          c.jsxs("button", {
            onClick: iu,
            className:
              "w-full py-4 text-red-600 bg-red-50 hover:bg-red-100 font-bold rounded-xl transition flex justify-center items-center gap-2",
            children: [
              c.jsx("span", {
                className: "material-symbols-outlined",
                children: "logout",
              }),
              "Logout",
            ],
          }),
        ],
      });
  const hu = () => {
    const o = parseFloat(calcPrice),
      N = Number.isFinite(o),
      A = N ? o * calcFactor * Math.max(0, 1 - calcDiscount / 100) : Number.NaN,
      vl = N
        ? o *
          Math.max(0, 1 - calcDiscount / 100) *
          (1 + calcCommission / 100) *
          (1 + calcTaxes / 100) *
          calcExchangeRate
        : Number.NaN,
      El = calcMode === "FACTOR" ? A : vl,
      Se = new Intl.NumberFormat("es-MX", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    return (
      <div className="space-y-4">
        <div className="rounded-2xl p-4 border border-border-light dark:border-border-dark bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-text-main dark:text-white">Calculadora</h2>
          <p className="text-xs text-text-sub dark:text-slate-300 mt-1">
            Cambia entre Factor y Porcentaje. Toca el resultado para copiar.
          </p>
          <div className="mt-4 grid grid-cols-2 rounded-xl p-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setCalcMode("FACTOR")}
              className={`py-2 text-xs font-bold rounded-lg transition ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`}
            >
              Factor
            </button>
            <button
              onClick={() => setCalcMode("PERCENTAGE")}
              className={`py-2 text-xs font-bold rounded-lg transition ${calcMode === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`}
            >
              Porcentaje
            </button>
          </div>
        </div>

        {calcMode === "FACTOR" ? (
          <div className="rounded-2xl p-4 border border-amber-100 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-amber-950/30 shadow-sm space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Precio</label>
              <input
                type="number"
                step="0.01"
                value={calcPrice}
                onChange={(e) => setCalcPrice(e.target.value)}
                className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-amber-300"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Factor</label>
              <input
                type="number"
                step="0.01"
                value={calcFactor}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  setCalcFactor(Number.isFinite(t) ? t : 0);
                }}
                className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Descuento (%)</label>
              <input
                type="number"
                step="0.01"
                value={calcDiscount}
                onChange={(e) => {
                  const t = parseFloat(e.target.value);
                  setCalcDiscount(Number.isFinite(t) ? t : 0);
                }}
                className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-900 dark:to-emerald-950/30 shadow-sm space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Monto</label>
              <input
                type="number"
                step="0.01"
                value={calcPrice}
                onChange={(e) => setCalcPrice(e.target.value)}
                className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Descuento (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={calcDiscount}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setCalcDiscount(Number.isFinite(t) ? t : 0);
                  }}
                  className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Taxes (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={calcTaxes}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setCalcTaxes(Number.isFinite(t) ? t : 0);
                  }}
                  className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Comision (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={calcCommission}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setCalcCommission(Number.isFinite(t) ? t : 0);
                  }}
                  className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Tipo de Cambio</label>
                <input
                  type="number"
                  step="0.01"
                  value={calcExchangeRate}
                  onChange={(e) => {
                    const t = parseFloat(e.target.value);
                    setCalcExchangeRate(Number.isFinite(t) ? t : 0);
                  }}
                  className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => copyCalculatorValue(El)}
          className="w-full rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 p-5 shadow-sm hover:shadow-md transition text-left"
        >
          <p className="text-[10px] uppercase font-bold tracking-wide text-gray-500 dark:text-gray-400">Resultado</p>
          <p className="text-3xl font-black mt-1 text-gray-900 dark:text-white">
            {Number.isFinite(El) ? `$${Se.format(El)}` : "--"}
          </p>
          <p className={`text-xs mt-2 font-semibold transition ${calcCopied ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
            {calcCopied ? "Copiado ✓" : "Toca para copiar"}
          </p>
        </button>
      </div>
    );
  };
  return c.jsxs("div", {
    className: isDesktopLayout
      ? "w-screen h-[100dvh] min-h-[100dvh] bg-surface-light dark:bg-surface-dark shadow-2xl relative flex flex-col overflow-hidden"
      : "w-full max-w-[480px] h-[100dvh] min-h-[100dvh] bg-surface-light dark:bg-surface-dark shadow-2xl relative flex flex-col border-x border-border-light dark:border-border-dark overflow-hidden",
    children: [
      J &&
      J.profile.role === "BOTH" &&
      c.jsxs("div", {
        className: isDesktopLayout
          ? "bg-emerald-600 text-white text-xs p-2 flex justify-center gap-4 z-50 relative shadow-md ml-80"
          : "bg-emerald-600 text-white text-xs p-2 flex justify-center gap-4 z-50 relative shadow-md",
        children: [
          c.jsx("span", {
            className: "font-bold border-r border-emerald-500 pr-3",
            children: "Dev Toggle",
          }),
          c.jsxs("label", {
            className: "flex items-center gap-1 cursor-pointer",
            children: [
              c.jsx("input", {
                type: "radio",
                name: "role",
                value: "PS",
                checked: X === "PS",
                onChange: () => {
                  (H("PS"), Aa());
                },
              }),
              " PS Mode",
            ],
          }),
          c.jsxs("label", {
            className: "flex items-center gap-1 cursor-pointer",
            children: [
              c.jsx("input", {
                type: "radio",
                name: "role",
                value: "AV",
                checked: X === "AV",
                onChange: () => {
                  (H("AV"), Aa());
                },
              }),
              " AV Mode",
            ],
          }),
        ],
      }),
      c.jsx("header", {
        className: isDesktopLayout
          ? "sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark transition-colors duration-200 ml-80"
          : "sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark transition-colors duration-200",
        children: c.jsx("div", {
          className: "px-5 py-4 flex items-center gap-3",
          children: [
            c.jsx("div", {
              className:
                "h-10 w-10 rounded-full bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center font-bold text-lg uppercase shrink-0",
              children: J.username.charAt(0),
            }),
            c.jsxs("div", {
              children: [
                c.jsxs("h2", {
                  className:
                    "text-sm font-semibold text-text-main dark:text-white leading-tight",
                  children: ["Hi, ", J.username],
                }),
                c.jsx("p", {
                  className:
                    "text-xs text-text-sub dark:text-slate-400 font-medium",
                  children:
                    X === "PS"
                      ? "Personal Shopper (Tienda)"
                      : "Agente de Ventas (Oficina)",
                }),
              ],
            }),
          ],
        }),
      }),
      c.jsxs("main", {
        className: isDesktopLayout
          ? "flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark ml-80"
          : "flex-1 overflow-y-auto p-5 bg-background-light dark:bg-background-dark",
        children: [
          c.jsx("div", {
            className: sectionStageClass,
            children:
              nl === "HOME"
                ? ta()
                : nl === "MISSIONS"
                  ? pe()
                  : nl === "CLIENTS"
                    ? Hl()
                    : nl === "SHIPMENTS"
                      ? xu()
                      : nl === "CALCULATOR"
                        ? hu()
                        : nl === "PROFILE"
                          ? du()
                          : null,
          }, nl),
          c.jsx("div", {
            className: "shrink-0",
            style: isDesktopLayout
              ? { height: "1rem" }
              : { height: "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)" },
          }),
        ],
      }),
      showMissionStartModal &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "absolute inset-0 z-[65] bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
          "shopping-start",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md max-h-[85vh] overflow-y-auto p-5 rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet",
            "shopping-start",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsx("h3", {
              className: "text-base font-bold mb-3",
              children: "Shopping en Tienda",
            }),
            c.jsxs("div", {
              className: "space-y-2",
              children: [
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className: "text-[10px] font-semibold text-gray-500",
                      children: "Tienda",
                    }),
                    c.jsx("input", {
                      type: "text",
                      value: missionStartForm.store_name,
                      onChange: (o) =>
                        setMissionStartForm({
                          ...missionStartForm,
                          store_name: o.target.value,
                          name: o.target.value,
                        }),
                      placeholder: "Selecciona o escribe la tienda",
                      className:
                        "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                    }),
                    c.jsx("div", {
                      className:
                        "mt-2 max-h-52 overflow-y-auto ios-scroll rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm",
                      children:
                        filteredMissionStoreSuggestions.length > 0
                          ? filteredMissionStoreSuggestions.map((o) =>
                              c.jsxs(
                                "div",
                                {
                                  className:
                                    "relative flex items-center gap-2 px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-800",
                                  children: [
                                    o.recommendation_id &&
                                    c.jsx("button", {
                                      type: "button",
                                      onClick: (N) => {
                                        N.stopPropagation();
                                        removeStoreRecommendation(
                                          o.recommendation_id,
                                          o.name,
                                        );
                                      },
                                      className:
                                        "absolute right-3 top-1/2 -translate-y-1/2 z-10 text-[18px] font-bold leading-none text-black/50 dark:text-white/60 hover:text-rose-600",
                                      "aria-label": `Quitar ${o.name} de recomendaciones`,
                                      children: "×",
                                    }),
                                    c.jsxs("button", {
                                      type: "button",
                                      onClick: () =>
                                        setMissionStartForm({
                                          ...missionStartForm,
                                          store_name: o.name,
                                          name: o.name,
                                        }),
                                      className:
                                        "flex-1 pr-8 text-left text-sm hover:text-primary",
                                      children: c.jsx("span", {
                                        className: "font-medium",
                                        children: o.name,
                                      }),
                                    }),
                                  ],
                                },
                                o.recommendation_id || o.id,
                              ),
                            )
                          : c.jsx("div", {
                              className:
                                "px-3 py-2 text-sm text-gray-400 dark:text-gray-500",
                              children: "Sin sugerencias",
                            }),
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: "grid grid-cols-2 gap-2",
                  children: [
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className: "text-[10px] font-semibold text-gray-500",
                          children: "Taxes (%)",
                        }),
                        c.jsx("input", {
                          type: "number",
                          step: "0.01",
                          value: missionStartForm.tax_percentage,
                          onChange: (o) =>
                            setMissionStartForm({
                              ...missionStartForm,
                              tax_percentage: o.target.value,
                            }),
                          className:
                            "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className: "text-[10px] font-semibold text-gray-500",
                          children: "Descuento (%)",
                        }),
                        c.jsx("input", {
                          type: "number",
                          step: "0.01",
                          value: missionStartForm.discount_percentage,
                          onChange: (o) =>
                            setMissionStartForm({
                              ...missionStartForm,
                              discount_percentage: o.target.value,
                            }),
                          className:
                            "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: "grid grid-cols-2 rounded-xl p-1 bg-gray-50 border border-gray-200",
                  children: [
                    c.jsx("button", {
                      type: "button",
                      onClick: () =>
                        setMissionStartForm({
                          ...missionStartForm,
                          calc_mode: "FACTOR",
                        }),
                      className: `py-2 text-xs font-bold rounded-lg ${String(missionStartForm.calc_mode).toUpperCase() === "FACTOR" ? "bg-primary text-white" : "text-gray-500"}`,
                      children: "Factor",
                    }),
                    c.jsx("button", {
                      type: "button",
                      onClick: () =>
                        setMissionStartForm({
                          ...missionStartForm,
                          calc_mode: "PERCENTAGE",
                        }),
                      className: `py-2 text-xs font-bold rounded-lg ${String(missionStartForm.calc_mode).toUpperCase() === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-gray-500"}`,
                      children: "Porcentaje",
                    }),
                  ],
                }),
                String(missionStartForm.calc_mode).toUpperCase() === "FACTOR"
                  ? c.jsxs("div", {
                    children: [
                      c.jsx("label", {
                        className: "text-[10px] font-semibold text-gray-500",
                        children: "Factor",
                      }),
                      c.jsx("input", {
                        type: "number",
                        step: "0.01",
                        value: missionStartForm.factor_value,
                        onChange: (o) =>
                          setMissionStartForm({
                            ...missionStartForm,
                            factor_value: o.target.value,
                          }),
                        className:
                          "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                      }),
                    ],
                  })
                  : c.jsxs("div", {
                    className: "grid grid-cols-2 gap-2",
                    children: [
                      c.jsxs("div", {
                        children: [
                          c.jsx("label", {
                            className: "text-[10px] font-semibold text-gray-500",
                            children: "Comision (%)",
                          }),
                          c.jsx("input", {
                            type: "number",
                            step: "0.01",
                            value: missionStartForm.commission_percentage,
                            onChange: (o) =>
                              setMissionStartForm({
                                ...missionStartForm,
                                commission_percentage: o.target.value,
                              }),
                            className:
                              "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                          }),
                        ],
                      }),
                      c.jsxs("div", {
                        children: [
                          c.jsx("label", {
                            className: "text-[10px] font-semibold text-gray-500",
                            children: "Tipo cambio",
                          }),
                          c.jsx("input", {
                            type: "number",
                            step: "0.01",
                            value: missionStartForm.exchange_rate,
                            onChange: (o) =>
                              setMissionStartForm({
                                ...missionStartForm,
                                exchange_rate: o.target.value,
                              }),
                            className:
                              "mt-1 w-full px-2 py-2 text-sm border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                          }),
                        ],
                      }),
                    ],
                  }),
              ],
            }),
            c.jsxs("div", {
              className: "mt-4 grid grid-cols-2 gap-2",
              children: [
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold",
                  children: "Cancelar",
                }),
                c.jsx("button", {
                  onClick: () => ye(missionStartForm),
                  className:
                    "py-2 rounded-lg bg-primary text-white hover:bg-primary-dark text-xs font-semibold",
                  children: "Iniciar",
                }),
              ],
            }),
          ],
        }),
      }),
      missionSummaryOpen &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "absolute inset-0 z-[66] bg-black/50 flex items-center justify-center ui-backdrop p-3 sm:p-4",
          "shopping-summary",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-lg p-5 rounded-2xl border border-border-light dark:border-border-dark shadow-2xl max-h-[85vh] overflow-y-auto ui-sheet",
            "shopping-summary",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className: "flex items-center justify-between mb-3",
              children: [
                c.jsx("h3", {
                  className: "text-base font-bold",
                  children: "Productos de la Tienda",
                }),
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "w-8 h-8 rounded-full ui-icon-button flex items-center justify-center",
                  children: c.jsx("span", {
                    className: "material-symbols-outlined text-[16px]",
                    children: "close",
                  }),
                }),
              ],
            }),
            c.jsxs("div", {
              className: "mb-3 grid grid-cols-[1fr_auto] gap-2 items-center",
              children: [
                c.jsx("select", {
                  value: missionSummaryStatusFilter,
                  onChange: (o) => setMissionSummaryStatusFilter(o.target.value),
                  className:
                    "w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                  children: [
                    c.jsx("option", { value: "ALL", children: "Todos" }),
                    c.jsx("option", {
                      value: "ANNOTATED",
                      children: "Anotado",
                    }),
                    c.jsx("option", {
                      value: "IN_REVIEW",
                      children: "Revision",
                    }),
                    c.jsx("option", {
                      value: "REJECTED",
                      children: "Rechazado",
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className:
                    "rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-right",
                  children: [
                    c.jsx("p", {
                      className: "text-[10px] font-semibold text-emerald-700",
                      children: "Total filtrado",
                    }),
                    c.jsxs("p", {
                      className: "text-sm font-bold text-emerald-900",
                      children: ["$", formatAmount(filteredMissionSummaryTotal)],
                    }),
                  ],
                }),
              ],
            }),
            w &&
            c.jsx("div", {
              className:
                "mb-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-2",
              children: w.ticket_image
                ? c.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    c.jsx("img", {
                      src: resolveMediaUrl(w.ticket_image),
                      className: "ui-media-frame ui-media-md object-cover",
                    }),
                    c.jsx("button", {
                      onClick: () => setFullscreenImage(resolveMediaUrl(w.ticket_image)),
                      className:
                        "text-xs font-bold text-primary hover:text-primary-dark",
                      children: "Abrir ticket de misión",
                    }),
                  ],
                })
                : c.jsx("p", {
                  className: "text-[11px] text-gray-500",
                  children: "Esta misión todavía no tiene ticket cargado.",
                }),
            }),
            filteredMissionSummaryProducts.length === 0
              ? c.jsx("p", {
                className: "text-xs text-gray-500 text-center py-6",
                children: "No hay productos para ese filtro en la misión activa.",
              })
              : c.jsx("div", {
                className: "grid grid-cols-3 gap-1.5",
                children: filteredMissionSummaryProducts.map((o) =>
                  c.jsxs(
                    "div",
                    {
                      className:
                        "relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-surface-light dark:bg-surface-dark shadow-card ui-card-quiet",
                      children: [
                        c.jsx("div", {
                          className:
                            "relative h-36 bg-[radial-gradient(circle_at_top,rgba(19,127,236,0.10),transparent_42%),linear-gradient(180deg,rgba(244,247,251,0.95),rgba(236,242,248,0.95))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_38%),linear-gradient(180deg,rgba(22,31,43,0.96),rgba(15,23,34,0.98))]",
                          children: [
                            o.image
                              ? c.jsx("img", {
                                src: resolveMediaUrl(o.image),
                                className: "w-full h-full object-cover cursor-zoom-in",
                                onClick: () =>
                                  setFullscreenImage({
                                    url: resolveMediaUrl(o.image),
                                    copyOnClick: !0,
                                    copyMessage: "Imagen copiada.",
                                  }),
                                title: "Abrir imagen",
                              })
                              : c.jsxs("div", {
                                className:
                                  "w-full h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500",
                                children: [
                                  c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-3xl mb-0.5",
                                    children: "image",
                                  }),
                                  c.jsx("span", {
                                    className:
                                      "text-[9px] uppercase font-bold tracking-wide",
                                    children: "No Image",
                                  }),
                                ],
                              }),
                            c.jsx("span", {
                              className:
                                `absolute right-1.5 top-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${String(o.status).toUpperCase() === "IN_REVIEW" ? "bg-amber-100/92 text-amber-800" : String(o.status).toUpperCase() === "REJECTED" ? "bg-rose-100/92 text-rose-700" : String(o.status).toUpperCase() === "BOUGHT" ? "bg-emerald-100/92 text-emerald-700" : String(o.status).toUpperCase() === "SHIPPED" ? "bg-blue-100/92 text-blue-700" : "bg-white/90 text-gray-700"}`,
                              children:
                                String(o.status).toUpperCase() === "IN_REVIEW"
                                  ? "Revision"
                                  : String(o.status).toUpperCase() === "ANNOTATED"
                                    ? "Anotado"
                                    : String(o.status).toUpperCase() === "BOUGHT"
                                      ? "Comprado"
                                      : String(o.status).toUpperCase() === "SHIPPED"
                                        ? "Enviado"
                                        : String(o.status).toUpperCase() === "REJECTED"
                                          ? "Rechazado"
                                          : o.status,
                            }),
                            c.jsxs("div", {
                              className:
                                "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/45 to-transparent px-2 py-1.5",
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-[10px] font-bold text-white truncate",
                                  children: o.name,
                                }),
                                c.jsxs("div", {
                                  className:
                                    "mt-1 flex items-center justify-between gap-1",
                                  children: [
                                    c.jsx("span", {
                                      className:
                                        "inline-flex max-w-[70%] truncate rounded-full bg-white/16 px-1.5 py-0.5 text-[9px] font-semibold text-white/92 backdrop-blur-sm",
                                      children: o.client_name || `Cliente #${o.client}`,
                                    }),
                                    hasValue(o.charged_price) &&
                                      c.jsxs("span", {
                                        className:
                                          "shrink-0 rounded-full bg-white/18 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm",
                                        children: ["$", o.charged_price],
                                      }),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        o.tags &&
                        c.jsx("div", {
                          className:
                            "px-1.5 py-1 flex flex-wrap gap-1 border-t border-gray-100 dark:border-gray-800 bg-white/75 dark:bg-gray-900/25",
                          children: o.tags
                            .split(",")
                            .map((N) => parseVisualTag(N))
                            .filter((N) => N)
                            .slice(0, 2)
                            .map((N, A) =>
                              c.jsx(
                                "span",
                                {
                                  className: `${getTagClassName(N.type)} text-[9px] px-1.5 py-0.5 rounded`,
                                  children: N.label,
                                },
                                `${o.id}-shopping-tag-${A}`,
                              ),
                            ),
                        }),
                        !o.tags &&
                        c.jsx("div", {
                          className: "h-1.5 bg-white dark:bg-gray-900/25",
                        }),
                      ],
                    },
                    o.id,
                  ),
                ),
              }),
          ],
        }),
      }),
      Il &&
      c.jsx("div", {
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
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsx("h3", {
              className: "text-xl font-bold mb-4",
              children: "Add New Client",
            }),
            c.jsxs("form", {
              onSubmit: Na,
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
                      value: Vl,
                      onChange: (o) => Yt(o.target.value),
                      placeholder: "e.g. John Doe",
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                      required: !0,
                    }),
                  ],
                }),
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Tags (comma separated)",
                    }),
                    c.jsx("input", {
                      type: "text",
                      value: Nt,
                      onChange: (o) => it(o.target.value),
                      placeholder: "e.g. Apple, Sony, VIP",
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
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
                          children: "Phone",
                        }),
                        c.jsx("input", {
                          type: "tel",
                          value: p,
                          onChange: (o) => z(o.target.value),
                          placeholder: "+1 555 1234",
                          className:
                            "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                          children: "Email",
                        }),
                        c.jsx("input", {
                          type: "email",
                          value: q,
                          onChange: (o) => sl(o.target.value),
                          placeholder: "client@email.com",
                          className:
                            "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Shipping Address",
                    }),
                    c.jsx("textarea", {
                      value: rl,
                      onChange: (o) => d(o.target.value),
                      placeholder: "123 Main St, City, State",
                      rows: 2,
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none",
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
      }),
      K &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "absolute inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
          "edit-client",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl ui-sheet",
            "edit-client",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsx("h3", {
              className: "text-xl font-bold mb-4",
              children: "Edit Client Details",
            }),
            c.jsxs("form", {
              onSubmit: ja,
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
                      value: ml.name,
                      onChange: (o) => hl({ ...ml, name: o.target.value }),
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                      required: !0,
                    }),
                  ],
                }),
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Tags (comma separated)",
                    }),
                    c.jsx("input", {
                      type: "text",
                      value: ml.tags,
                      onChange: (o) => hl({ ...ml, tags: o.target.value }),
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
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
                          children: "Phone",
                        }),
                        c.jsx("input", {
                          type: "tel",
                          value: ml.phone,
                          onChange: (o) =>
                            hl({ ...ml, phone: o.target.value }),
                          className:
                            "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                          children: "Email",
                        }),
                        c.jsx("input", {
                          type: "email",
                          value: ml.email,
                          onChange: (o) =>
                            hl({ ...ml, email: o.target.value }),
                          className:
                            "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Shipping Address",
                    }),
                    c.jsx("textarea", {
                      value: ml.shipping_address,
                      onChange: (o) =>
                        hl({ ...ml, shipping_address: o.target.value }),
                      rows: 2,
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none",
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
                c.jsxs("button", {
                  type: "button",
                  onClick: () => {
                    (Ea(O.id), tl(!1), Y(null));
                  },
                  className:
                    "w-full mt-2 py-2 text-red-500 bg-red-50 hover:bg-red-100 font-semibold rounded-xl transition text-sm flex justify-center items-center gap-1",
                  children: [
                    c.jsx("span", {
                      className: "material-symbols-outlined text-[16px]",
                      children: "delete",
                    }),
                    " Delete Client",
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      me &&
      he &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[95] bg-black/50 flex items-end sm:items-center justify-center overflow-y-auto p-2 sm:p-4 ui-backdrop",
          "edit-product",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            `bg-surface-light dark:bg-surface-dark w-full ${isDesktopLayout ? "sm:max-w-5xl rounded-3xl overflow-visible" : "sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"} p-6 shadow-2xl ui-sheet`,
            "edit-product",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsx("h3", {
              className: "text-xl font-bold mb-4",
              children:
                productModalMode === "create"
                  ? "Agregar producto"
                  : "Edit Product Info",
            }),
            c.jsxs("form", {
              onSubmit: zi,
              className: isDesktopLayout
                ? "grid grid-cols-2 gap-5 items-start"
                : "space-y-4",
              children: [
                c.jsxs("div", {
                  className: isDesktopLayout ? "col-span-2" : "",
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Product Name",
                    }),
                    c.jsx("input", {
                      type: "text",
                      value: st.name,
                      onChange: (o) => Gt({ ...st, name: o.target.value }),
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                      required: !0,
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: isDesktopLayout
                    ? "col-span-2 grid grid-cols-2 gap-4"
                    : "grid grid-cols-2 gap-4",
                  children: [
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                          children: "Store Price (USD)",
                        }),
                        c.jsx("input", {
                          type: "number",
                          step: "0.01",
                          value: st.real_price,
                          onChange: (o) =>
                            Gt({ ...st, real_price: o.target.value }),
                          className: productStoreInputClass,
                          required: !0,
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                          children: "Final Price (MXN)",
                        }),
                        c.jsx("input", {
                          type: "number",
                          step: "0.01",
                          value: st.charged_price,
                          onChange: (o) => {
                            setProductFinalPriceManual(!0);
                            Gt({ ...st, charged_price: o.target.value });
                          },
                          className: productFinalInputClass,
                          required: !0,
                        }),
                        Number.isFinite(modalComputedFinalPrice) &&
                        c.jsxs("div", {
                          className: "mt-1 flex items-center justify-between gap-2",
                          children: [
                            c.jsxs("span", {
                              className:
                                "text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80",
                              children: [
                                "Calculado: $",
                                modalComputedFinalPrice.toFixed(2),
                              ],
                            }),
                            productFinalPriceManual &&
                            c.jsx("button", {
                              type: "button",
                              onClick: () => {
                                setProductFinalPriceManual(!1);
                                Gt({
                                  ...st,
                                  charged_price: modalComputedFinalPrice.toFixed(2),
                                });
                              },
                              className:
                                "text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
                              children: "Usar calculo",
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: isDesktopLayout ? "col-span-1" : "",
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Modo de Calculo",
                    }),
                    c.jsxs("div", {
                      className:
                        "grid grid-cols-2 rounded-xl p-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700",
                      children: [
                        c.jsx("button", {
                          type: "button",
                          onClick: () => setCalcMode("FACTOR"),
                          className: `py-2 text-xs font-bold rounded-lg transition ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                          children: "Factor",
                        }),
                        c.jsx("button", {
                          type: "button",
                          onClick: () => setCalcMode("PERCENTAGE"),
                          className: `py-2 text-xs font-bold rounded-lg transition ${calcMode === "PERCENTAGE" ? "bg-emerald-600 text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                          children: "Porcentaje",
                        }),
                      ],
                    }),
                  ],
                }),
                calcMode === "FACTOR"
                  ? c.jsxs("div", {
                    className: isDesktopLayout ? "col-span-1" : "",
                    children: [
                      c.jsx("label", {
                        className:
                          "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                        children: "Factor",
                      }),
                      c.jsx("input", {
                        type: "number",
                        step: "0.01",
                        value: calcFactor,
                        onChange: (o) => {
                          const N = parseFloat(o.target.value);
                          setCalcFactor(Number.isFinite(N) ? N : 0);
                        },
                        className:
                          `${productCalcInputClass} px-4 py-2`,
                      }),
                      c.jsxs("div", {
                        className: "mt-2",
                        children: [
                          c.jsx("label", {
                            className:
                              "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: "Descuento (%)",
                          }),
                          c.jsx("input", {
                            type: "number",
                            step: "0.01",
                            value: calcDiscount,
                            onChange: (o) => {
                              const N = parseFloat(o.target.value);
                              setCalcDiscount(Number.isFinite(N) ? N : 0);
                            },
                            className:
                              `${productCalcInputClass} px-4 py-2`,
                          }),
                        ],
                      }),
                    ],
                  })
                  : c.jsxs("div", {
                    className: isDesktopLayout
                      ? "col-span-1 grid grid-cols-2 gap-2"
                      : "grid grid-cols-2 gap-2",
                    children: [
                      c.jsxs("div", {
                        children: [
                          c.jsx("label", {
                            className:
                              "block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: "Descuento (%)",
                          }),
                          c.jsx("input", {
                            type: "number",
                            step: "0.01",
                            value: calcDiscount,
                            onChange: (o) => {
                              const N = parseFloat(o.target.value);
                              setCalcDiscount(Number.isFinite(N) ? N : 0);
                            },
                            className:
                              `${productCalcCompactInputClass} px-2 py-2`,
                          }),
                        ],
                      }),
                      c.jsxs("div", {
                        children: [
                          c.jsx("label", {
                            className:
                              "block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: "Taxes (%)",
                          }),
                          c.jsx("input", {
                            type: "number",
                            step: "0.01",
                            value: calcTaxes,
                            onChange: (o) => {
                              const N = parseFloat(o.target.value);
                              setCalcTaxes(Number.isFinite(N) ? N : 0);
                            },
                            className:
                              `${productCalcCompactInputClass} px-2 py-2`,
                          }),
                        ],
                      }),
                      c.jsxs("div", {
                        children: [
                          c.jsx("label", {
                            className:
                              "block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: "Comision (%)",
                          }),
                          c.jsx("input", {
                            type: "number",
                            step: "0.01",
                            value: calcCommission,
                            onChange: (o) => {
                              const N = parseFloat(o.target.value);
                              setCalcCommission(Number.isFinite(N) ? N : 0);
                            },
                            className:
                              `${productCalcCompactInputClass} px-2 py-2`,
                          }),
                        ],
                      }),
                      c.jsxs("div", {
                        children: [
                          c.jsx("label", {
                            className:
                              "block text-[10px] font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: "Tipo Cambio",
                          }),
                          c.jsx("input", {
                            type: "number",
                            step: "0.01",
                            value: calcExchangeRate,
                            onChange: (o) => {
                              const N = parseFloat(o.target.value);
                              setCalcExchangeRate(Number.isFinite(N) ? N : 0);
                            },
                            className:
                              `${productCalcCompactInputClass} px-2 py-2`,
                          }),
                        ],
                      }),
                    ],
                  }),
                c.jsxs("div", {
                  className: isDesktopLayout ? "col-span-1" : "",
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Tags",
                    }),
                    c.jsx("div", {
                      className: "flex flex-wrap gap-2 mb-2",
                      children:
                        modalTags.length === 0
                          ? c.jsx("span", {
                            className: "text-xs text-gray-400",
                            children: "Sin tags",
                          })
                          : modalTags.map((o) =>
                            c.jsxs(
                              "span",
                              {
                                className:
                                  "text-xs bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-1 flex items-center gap-1",
                                children: [
                                  o,
                                  c.jsx("button", {
                                    type: "button",
                                    onClick: () => removeModalTag(o),
                                    className:
                                      "material-symbols-outlined text-[14px] leading-none hover:text-red-500",
                                    children: "close",
                                  }),
                                ],
                              },
                              o,
                            ),
                          ),
                    }),
                    c.jsxs("div", {
                      className: "flex gap-2",
                      children: [
                        c.jsx("input", {
                          type: "text",
                          value: newModalTag,
                          onChange: (o) => setNewModalTag(o.target.value),
                          placeholder: "Agregar tag",
                          className:
                            "flex-1 px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                        }),
                        c.jsx("button", {
                          type: "button",
                          onClick: addModalTag,
                          className:
                            "px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark",
                          children: "+ Add",
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: isDesktopLayout ? "col-span-1" : "",
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Store",
                    }),
                    w
                      ? c.jsxs("div", {
                        className:
                          "rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/30",
                        children: [
                          c.jsx("p", {
                            className: "text-sm font-semibold text-sky-900 dark:text-sky-100",
                            children: getMissionStoreLabel(w) || "Sin tienda asignada",
                          }),
                        ],
                      })
                      : c.jsxs(c.Fragment, {
                        children: [
                          c.jsx("input", {
                            type: "text",
                            value: storeSearch,
                            onChange: (o) => setStoreSearch(o.target.value),
                            placeholder: "Buscar tienda...",
                            className:
                              "w-full px-3 py-2 border rounded-xl mb-2 dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                          }),
                          c.jsxs("select", {
                            value: st.store || "",
                            onChange: (o) => Gt({ ...st, store: o.target.value }),
                            className:
                              "w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                            children: [
                              c.jsx("option", {
                                value: "",
                                children: "Selecciona tienda",
                              }),
                              filteredStores.map((o) =>
                                c.jsx(
                                  "option",
                                  { value: o.id, children: o.name },
                                  o.id,
                                ),
                              ),
                            ],
                          }),
                          X === "AV" &&
                          c.jsxs("div", {
                            className: "mt-2",
                            children: [
                              c.jsx("button", {
                                type: "button",
                                onClick: () =>
                                  setShowAddStoreInput((o) => !o),
                                className:
                                  "text-xs font-semibold text-primary hover:text-primary-dark",
                                children: "+ Add Store",
                              }),
                              showAddStoreInput &&
                              c.jsxs("div", {
                                className: "flex gap-2 mt-2",
                                children: [
                                  c.jsx("input", {
                                    type: "text",
                                    value: newStoreName,
                                    onChange: (o) =>
                                      setNewStoreName(o.target.value),
                                    placeholder: "Nombre de tienda",
                                    className:
                                      "flex-1 px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                                  }),
                                  c.jsx("button", {
                                    type: "button",
                                    onClick: createStoreFromModal,
                                    className:
                                      "px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark",
                                    children: "Guardar",
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                  ],
                }),
                c.jsxs("div", {
                  className: isDesktopLayout ? "col-span-1" : "",
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Status",
                    }),
                    c.jsxs("div", {
                      className: isDesktopLayout
                        ? "grid grid-cols-3 gap-2"
                        : "grid grid-cols-2 gap-2",
                      children: [
                        ["ANNOTATED", "Anotado"],
                        ["REVIEW", "Revision"],
                        ["REJECTED", "Rechazado"],
                      ].map(([o, N]) =>
                        c.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => Gt({ ...st, status: o }),
                            className: `px-3 py-2 rounded-xl text-xs font-bold border transition ${st.status === o ? "bg-primary text-white border-primary" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary/50"}`,
                            children: N,
                          },
                          o,
                        ),
                      ),
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: `${isDesktopLayout ? "col-span-2" : ""} flex gap-3 pt-4`,
                  children: [
                    c.jsx("button", {
                      type: "button",
                      onClick: () => dismissActiveOverlayRef.current(),
                      disabled: newProductUploading,
                      className:
                        `flex-1 py-3 font-semibold rounded-xl ui-btn-secondary ${newProductUploading ? "opacity-60 cursor-not-allowed" : ""}`,
                      children: "Cancel",
                    }),
                    c.jsx("button", {
                      type: "submit",
                      disabled:
                        (productModalMode === "create" && newProductUploading) ||
                        !modalHasRequiredPrices,
                      className:
                        `flex-1 py-3 font-semibold rounded-xl ui-btn-primary ${(productModalMode === "create" && newProductUploading) || !modalHasRequiredPrices ? "opacity-75 cursor-not-allowed" : ""}`,
                      children:
                        productModalMode === "create"
                          ? newProductUploading
                            ? "Creando..."
                            : "Crear producto"
                          : "Save Changes",
                    }),
                  ],
                }),
                !modalHasRequiredPrices &&
                c.jsx("p", {
                  className: `${isDesktopLayout ? "col-span-2" : ""} text-xs font-medium text-rose-600 dark:text-rose-300`,
                  children:
                    "Debes capturar Store Price (USD) y Final Price (MXN) para poder cerrar o guardar este producto.",
                }),
              ],
            }),
          ],
        }),
      }),
      ji &&
      Je &&
      c.jsx("div", {
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
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("h3", {
              className: "text-xl font-bold mb-4",
              children: ["Edit Ticket #", Je.id, " Data"],
            }),
            c.jsxs("form", {
              onSubmit: _i,
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
                          value: Ol.total_real_price,
                          onChange: (o) =>
                            $e({ ...Ol, total_real_price: o.target.value }),
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
                          value: Ol.total_charged_price,
                          onChange: (o) =>
                            $e({
                              ...Ol,
                              total_charged_price: o.target.value,
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
                          value: Ol.tax_percentage,
                          onChange: (o) =>
                            $e({ ...Ol, tax_percentage: o.target.value }),
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
                            checked: Ol.shipping_paid,
                            onChange: (o) =>
                              $e({ ...Ol, shipping_paid: o.target.checked }),
                            className: "w-5 h-5 text-primary rounded",
                          }),
                          c.jsx("span", {
                            className: "text-sm font-medium",
                            children: "Shipping Paid",
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
      }),
      W &&
      c.jsxs("div", {
        className:
          `${isDesktopLayout
            ? "fixed inset-0 z-[72] bg-slate-950/45 backdrop-blur-sm p-5 lg:p-6 flex items-stretch justify-center"
            : "absolute inset-0 z-50 bg-background-light dark:bg-background-dark flex flex-col overflow-x-hidden animate-in slide-in-from-bottom duration-300"} ui-backdrop${closingOverlayKey === "client-home" ? " ui-backdrop-out" : ""}`,
        onClick: isDesktopLayout ? () => dismissActiveOverlayRef.current() : void 0,
        children: c.jsxs("div", {
          className: `${isDesktopLayout
            ? "w-full max-w-[1500px] rounded-[32px] border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark shadow-[0_32px_80px_rgba(15,23,42,0.38)] flex flex-col overflow-hidden animate-in fade-in zoom-in-[0.98] duration-200"
            : "flex flex-col h-full"} ui-sheet${closingOverlayKey === "client-home" ? " ui-sheet-out" : ""}`,
          onClick: isDesktopLayout ? (o) => o.stopPropagation() : void 0,
          children: [
          c.jsxs("div", {
            className:
              "sticky top-0 z-10 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md pb-0 border-b border-border-light dark:border-border-dark shadow-sm",
            children: [
              c.jsxs("div", {
                className: isDesktopLayout
                  ? "px-6 py-5 flex items-center justify-between gap-4"
                  : "p-4 flex items-center justify-between",
                children: [
                  c.jsx("button", {
                    onClick: () => dismissActiveOverlayRef.current(),
                    className:
                      "w-10 h-10 flex items-center justify-center rounded-full ui-icon-button",
                    children: c.jsx("span", {
                      className: "material-symbols-outlined",
                      children: "arrow_back",
                    }),
                  }),
                  c.jsx("h2", {
                    className: isDesktopLayout
                      ? "font-bold text-2xl truncate max-w-[420px]"
                      : "font-bold text-lg truncate max-w-[200px]",
                    children: W.name,
                  }),
                  c.jsx("div", {
                    className: "w-10 flex items-center justify-end",
                    children: c.jsx("button", {
                      onClick: Qt,
                      className: "opacity-50 hover:opacity-100",
                      children: c.jsx("span", {
                        className: "material-symbols-outlined",
                        children: "refresh",
                      }),
                    }),
                  }),
                ],
              }),
              c.jsxs("div", {
                className:
                  isDesktopLayout
                    ? "flex px-6 gap-6 text-sm font-bold border-t border-border-light dark:border-border-dark pt-3 overflow-x-auto"
                    : "flex px-4 gap-6 text-sm font-bold border-t border-border-light dark:border-border-dark pt-2",
                children: [
                  c.jsxs("button", {
                    onClick: () => jt("REVIEW"),
                    className: `pb-3 border-b-2 transition-colors ${wl === "REVIEW" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"}`,
                    children: ["Revision (", galleryReviewCount, ")"],
                  }),
                  c.jsxs("button", {
                    onClick: () => jt("ANNOTATED"),
                    className: `pb-3 border-b-2 transition-colors ${wl === "ANNOTATED" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"}`,
                    children: ["Anotado (", galleryAnnotatedCount, ")"],
                  }),
                  c.jsxs("button", {
                    onClick: () => jt("REJECTED"),
                    className: `pb-3 border-b-2 transition-colors ${wl === "REJECTED" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"}`,
                    children: ["Rechazado (", galleryRejectedCount, ")"],
                  }),
                ],
              }),
            ],
          }),
          c.jsxs("div", {
            className: isDesktopLayout
              ? "p-6 flex-1 overflow-y-auto grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] items-start"
              : "p-5 flex-1 overflow-y-auto space-y-6",
            children: [
              c.jsxs("div", {
                className: isDesktopLayout
                  ? "bg-surface-light dark:bg-surface-dark p-5 rounded-3xl shadow-card border border-border-light dark:border-border-dark space-y-4 xl:sticky xl:top-6"
                  : "bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-border-light space-y-3",
                children: [
                  c.jsxs("div", {
                    className: "flex items-center gap-4",
                    children: [
                      c.jsx("div", {
                        className:
                          "w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl uppercase border",
                        children: W.name.charAt(0),
                      }),
                      c.jsxs("div", {
                        className: "min-w-0",
                        children: [
                          c.jsx("span", {
                            className: `text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${W.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`,
                            children:
                              W.status === "Active" ? "In Shopping" : "Idle",
                          }),
                          c.jsx("p", {
                            className:
                              "text-xs text-text-sub dark:text-slate-400 truncate",
                            children: W.tags,
                          }),
                          c.jsxs("div", {
                            className: "mt-1.5 space-y-0.5",
                            children: [
                              c.jsxs("p", {
                                className:
                                  "text-[11px] font-bold text-emerald-700 dark:text-emerald-300",
                                children: [
                                  "Total USD: $",
                                  formatAmount(selectedClientHomeTotals.usd),
                                ],
                              }),
                              c.jsxs("p", {
                                className:
                                  "text-[11px] font-bold text-blue-700 dark:text-blue-300",
                                children: [
                                  "Total Venta: $",
                                  formatAmount(selectedClientHomeTotals.sale),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: "flex gap-2",
                    children: [
                      c.jsxs("span", {
                        className:
                          "flex-1 rounded-lg border border-emerald-200 bg-emerald-50/90 px-2 py-1.5 shadow-sm text-center",
                        children: [
                          c.jsx("span", {
                            className:
                              "text-[9px] font-black uppercase text-emerald-700/75 mr-1",
                            children: "USD",
                          }),
                          c.jsxs("span", {
                            className:
                              "text-sm font-bold text-emerald-800",
                            children: ["$", formatAmount(selectedClientHomeTotals.usd)],
                          }),
                        ],
                      }),
                      c.jsxs("span", {
                        className:
                          "flex-1 rounded-lg border border-blue-200 bg-blue-50/95 px-2 py-1.5 shadow-sm text-center",
                        children: [
                          c.jsx("span", {
                            className:
                              "text-[9px] font-black uppercase text-blue-700/75 mr-1",
                            children: "Venta",
                          }),
                          c.jsxs("span", {
                            className:
                              "text-sm font-bold text-blue-800",
                            children: ["$", formatAmount(selectedClientHomeTotals.sale)],
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (wl === "REVIEW" ||
                wl === "ANNOTATED" ||
                wl === "REJECTED") &&
              c.jsxs("div", {
                className: isDesktopLayout
                  ? "animate-in fade-in duration-200 space-y-4"
                  : "animate-in fade-in duration-200",
                children: [
                  c.jsxs("div", {
                    className: "mb-4",
                    children: [
                      c.jsx("h4", {
                        className: "font-bold text-lg",
                        children:
                          wl === "REVIEW"
                            ? "Productos en revision"
                              : wl === "REJECTED"
                                ? "Productos rechazados"
                                : "Productos anotados",
                      }),
                      c.jsxs("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: [
                          "Anotado: ",
                          galleryAnnotatedCount,
                          " • Revision: ",
                          galleryReviewCount,
                          " • Rechazado: ",
                          galleryRejectedCount,
                        ],
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: isDesktopLayout
                      ? "grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3"
                      : "grid grid-cols-3 gap-1",
                    children: [
                      // <-------- seccion 7: tarjetas con estado de revision y acciones por rol
                      sortedVisibleGalleryProducts.map((o) => {
                        const reviewEntry = latestReviewsByProduct[o.id],
                          hasPulse = !!(
                            effectiveHomeClientReviewUnreadMap[W && W.id] || {}
                          )[o.id],
                          isPendingReview =
                            reviewEntry && reviewEntry.status === "PENDING",
                          isAltReady =
                            reviewEntry &&
                            reviewEntry.status === "ALTERNATIVE_SENT";
                        return c.jsxs(
                          "div",
                          {
                            className: `bg-surface-light dark:bg-surface-dark ${isDesktopLayout ? "rounded-2xl" : "rounded-lg"} overflow-visible shadow-card border flex flex-col relative group ui-card-quiet ${hasPulse ? "review-item-alert border-red-400 bg-red-50/40 dark:bg-red-950/18" : "border-border-light dark:border-border-dark"}`,
                            children: [
                              hasPulse &&
                              c.jsx("span", {
                                className:
                                  "absolute top-1.5 left-1.5 z-20 w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-slate-900",
                              }),
                              c.jsxs("div", {
                                className: "absolute top-1.5 right-1.5 z-20",
                                "data-product-menu": "1",
                                children: [
                                  c.jsx("button", {
                                    onClick: (N) => {
                                      (N.stopPropagation(),
                                        setOpenProductInfoId(null),
                                        setOpenProductMenuId((A) =>
                                          A === o.id ? null : o.id,
                                        ));
                                    },
                                    className:
                                      "w-6 h-6 rounded-full bg-white/38 text-gray-700 hover:bg-white/56 border border-white/35 shadow-sm backdrop-blur-[2px] flex items-center justify-center",
                                    title: "Opciones",
                                    children: c.jsx("span", {
                                      className:
                                        "material-symbols-outlined text-[12px]",
                                      children: "more_vert",
                                    }),
                                  }),
                                  openProductMenuId === o.id &&
                                  c.jsxs("div", {
                                    className:
                                      "absolute right-0 top-9 w-36 rounded-xl border border-gray-200 bg-white shadow-lg p-1 ui-pop",
                                    children: [
                                      c.jsxs("button", {
                                        onClick: (N) => {
                                          (N.stopPropagation(),
                                            setOpenProductMenuId(null),
                                            hn(o));
                                        },
                                        className:
                                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-blue-700 hover:bg-blue-50",
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              "material-symbols-outlined text-[14px]",
                                            children: "edit",
                                          }),
                                          "Editar",
                                        ],
                                      }),
                                      c.jsxs("button", {
                                        onClick: (N) => {
                                          (N.stopPropagation(),
                                            setOpenProductMenuId(null),
                                            Xt(o));
                                        },
                                        disabled: productImageUploadingId === o.id,
                                        className:
                                          `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-purple-700 ${productImageUploadingId === o.id ? "opacity-60 cursor-wait bg-purple-50" : "hover:bg-purple-50"}`,
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              `material-symbols-outlined text-[14px] ${productImageUploadingId === o.id ? "animate-spin" : ""}`,
                                            children:
                                              productImageUploadingId === o.id
                                                ? "progress_activity"
                                                : "add_a_photo",
                                          }),
                                          productImageUploadingId === o.id
                                            ? "Subiendo foto"
                                            : "Cambiar foto",
                                        ],
                                      }),
                                      c.jsxs("button", {
                                        onClick: (N) => {
                                          (N.stopPropagation(),
                                            setOpenProductMenuId(null),
                                            xe(o.id));
                                        },
                                        className:
                                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-red-700 hover:bg-red-50",
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              "material-symbols-outlined text-[14px]",
                                            children: "delete",
                                          }),
                                          "Eliminar",
                                        ],
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              c.jsx("div", {
                                className: "absolute top-1.5 left-1.5 z-20",
                                "data-product-info": "1",
                                children: c.jsx("button", {
                                  onClick: (N) => {
                                    (N.stopPropagation(),
                                      setOpenProductMenuId(null),
                                      setOpenProductInfoId((A) =>
                                        A === o.id ? null : o.id,
                                      ));
                                  },
                                  className:
                                    "w-6 h-6 rounded-full bg-white/38 text-gray-700 hover:bg-white/56 border border-white/35 shadow-sm backdrop-blur-[2px] flex items-center justify-center",
                                  title: "Info del producto",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[12px]",
                                    children: "info",
                                  }),
                                }),
                              }),
                              c.jsxs("div", {
                                className:
                                  `${isDesktopLayout ? "h-48" : "h-36"} w-full bg-[radial-gradient(circle_at_top,rgba(19,127,236,0.10),transparent_42%),linear-gradient(180deg,rgba(244,247,251,0.95),rgba(236,242,248,0.95))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_38%),linear-gradient(180deg,rgba(22,31,43,0.96),rgba(15,23,34,0.98))] relative flex items-center justify-center`,
                                children: [
                                  c.jsx("div", {
                                    className:
                                      "absolute inset-0 overflow-hidden",
                                    children: o.image
                                      ? c.jsx("img", {
                                        src: resolveMediaUrl(o.image),
                                        className:
                                          "w-full h-full object-cover cursor-zoom-in",
                                        onClick: () =>
                                          setFullscreenImage({
                                            url: resolveMediaUrl(o.image),
                                            copyOnClick: !0,
                                            copyMessage: "Imagen copiada.",
                                          }),
                                        title: "Abrir imagen",
                                      })
                                      : c.jsxs("div", {
                                        className:
                                          "w-full h-full flex flex-col items-center justify-center text-gray-400",
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              "material-symbols-outlined text-3xl mb-0.5",
                                            children: "image",
                                          }),
                                          c.jsx("span", {
                                            className:
                                              "text-[9px] uppercase font-bold",
                                            children: "No Image",
                                          }),
                                        ],
                                      }),
                                  }),
                                  c.jsx("div", {
                                    className: "absolute right-0.5 bottom-0.5 z-20",
                                    children: c.jsxs("button", {
                                      onClick: (N) => {
                                        (N.stopPropagation(),
                                          setOpenProductInfoId(null),
                                          setOpenProductMenuId(null),
                                          openProductConversation(
                                            o,
                                            reviewEntry || null,
                                          ));
                                      },
                                      className:
                                        "px-0.5 py-[1px] rounded-full bg-white/34 text-slate-700 hover:bg-white/50 border border-white/30 shadow-sm backdrop-blur-[2px] inline-flex items-center gap-0.5",
                                      title: "Historial de conversacion",
                                      children: [
                                        c.jsx("span", {
                                          className:
                                            "material-symbols-outlined text-[10px]",
                                          children: "chat",
                                        }),
                                      ],
                                    }),
                                  }),
                                  productImageUploadingId === o.id &&
                                  c.jsxs("div", {
                                    className:
                                      "absolute inset-0 z-10 bg-black/60 text-white flex flex-col items-center justify-center gap-1.5",
                                    children: [
                                      c.jsx("span", {
                                        className:
                                          "material-symbols-outlined animate-spin text-xl",
                                        children: "progress_activity",
                                      }),
                                      c.jsx("span", {
                                        className: "text-[11px] font-semibold",
                                        children: "Subiendo imagen...",
                                      }),
                                      c.jsx("span", {
                                        className: "text-[9px] opacity-85",
                                        children: "Esperando confirmacion del servidor",
                                      }),
                                    ],
                                  }),
                                  o.tags &&
                                  c.jsx("div", {
                                    className:
                                      "absolute left-1 right-8 bottom-6 flex flex-wrap gap-1",
                                    children: o.tags
                                      .split(",")
                                      .map((N) => parseVisualTag(N))
                                      .filter((N) => N)
                                      .slice(0, 4)
                                      .map((N, A) =>
                                        c.jsx(
                                          "span",
                                          {
                                            className: `${getTagClassName(N.type)} text-[9px] px-1.5 py-0.5 rounded`,
                                            children: N.label,
                                          },
                                          `${o.id}-tag-${A}`,
                                        ),
                                      ),
                                  }),
                                    ],
                                  }),
                                  openProductInfoId === o.id &&
                                  c.jsxs("div", {
                                    className:
                                      "absolute inset-1 z-20 rounded-md bg-black/75 text-white p-2 overflow-y-auto",
                                    "data-product-info": "1",
                                    children: [
                                      c.jsxs("div", {
                                        className:
                                          "flex items-center justify-between gap-2 mb-1",
                                        children: [
                                          c.jsx("p", {
                                            className:
                                              "text-[10px] font-bold truncate",
                                            children: o.name,
                                          }),
                                          c.jsx("button", {
                                            onClick: (N) => {
                                              (N.stopPropagation(),
                                                setOpenProductInfoId(null));
                                            },
                                            className:
                                              "w-5 h-5 rounded bg-white/20 hover:bg-white/30 flex items-center justify-center",
                                            children: c.jsx("span", {
                                              className:
                                                "material-symbols-outlined text-[12px]",
                                              children: "close",
                                            }),
                                          }),
                                        ],
                                      }),
                                      c.jsxs("p", {
                                        className:
                                          "text-[10px] uppercase tracking-wide opacity-90",
                                        children: ["Estado: ", o.status],
                                      }),
                                      (o.shopping_date || o.mission_date) &&
                                      c.jsxs("p", {
                                        className: "text-[10px] opacity-90",
                                        children: [
                                          "Shopping: ",
                                          new Date(
                                            o.shopping_date || o.mission_date,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      o.tags &&
                                      c.jsxs("p", {
                                        className:
                                          "text-[10px] mt-1 break-words",
                                        children: ["Tags: ", o.tags],
                                      }),
                                      c.jsxs("div", {
                                        className: "text-[10px] mt-1",
                                        children: [
                                          hasValue(o.charged_price) &&
                                          c.jsxs("p", {
                                            children: ["Final: $", o.charged_price],
                                          }),
                                          hasValue(o.real_price) &&
                                          c.jsxs("p", {
                                            children: ["Tienda: $", o.real_price],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                            ],
                          },
                          o.id,
                        );
                      }),
                      c.jsxs("div", {
                        onClick: newProductUploading ? void 0 : fu,
                        className:
                          `bg-gray-50 dark:bg-gray-800 ${isDesktopLayout ? "rounded-2xl h-52" : "rounded-lg h-40"} flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 transition group ${newProductUploading ? "cursor-wait opacity-75 border-primary/40" : "cursor-pointer hover:bg-primary/5 hover:border-primary/40"}`,
                        children: [
                          c.jsx("span", {
                            className:
                              `material-symbols-outlined text-3xl text-primary mb-2 transition-transform ${newProductUploading ? "animate-spin" : "group-hover:scale-110"}`,
                            children: newProductUploading
                              ? "progress_activity"
                              : "add_photo_alternate",
                          }),
                          c.jsx("span", {
                            className:
                              "text-sm font-semibold text-center px-4",
                            children: newProductUploading
                              ? "Subiendo imagen..."
                              : X === "PS"
                                ? "+ Photo / Found Product"
                                : "+ Photo / Pre-order",
                          }),
                          newProductUploading &&
                          c.jsx("span", {
                            className: "text-[11px] text-text-sub mt-1 px-4 text-center",
                            children: "No cierres la ventana hasta que termine la carga.",
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              false &&
              c.jsxs("div", {
                className: "animate-in fade-in duration-200",
                children: [
                  c.jsx("div", {
                    className: "mb-4",
                    children: c.jsx("h4", {
                      className: "font-bold text-lg",
                      children: "Group Tickets",
                    }),
                  }),
                  c.jsxs("div", {
                    className: "grid grid-cols-1 gap-4",
                    children: [
                      (W.receipts || []).map((o) =>
                        c.jsxs(
                          "div",
                          {
                            className:
                              "bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-card border border-border-light dark:border-border-dark flex flex-col p-4 relative group ui-card-quiet",
                            children: [
                              c.jsxs("div", {
                                className: "flex gap-4 items-start",
                                children: [
                                  o.image
                                    ? c.jsx("img", {
                                      src: resolveMediaUrl(o.image),
                                      className:
                                        "ui-media-frame ui-media-ticket-md object-cover",
                                    })
                                    : c.jsx("div", {
                                      className:
                                        "ui-media-frame ui-media-ticket-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center",
                                      children: c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-gray-400",
                                        children: "receipt",
                                      }),
                                    }),
                                  c.jsxs("div", {
                                    className: "flex-1 pb-2",
                                    children: [
                                      c.jsxs("p", {
                                        className:
                                          "font-bold text-sm tracking-tight",
                                        children: ["Ticket #", o.id],
                                      }),
                                      c.jsxs("p", {
                                        className:
                                          "text-xs text-gray-500 mb-2",
                                        children: [
                                          "Uploaded ",
                                          new Date(
                                            o.uploaded_at || Date.now(),
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      c.jsxs("div", {
                                        className:
                                          "flex flex-wrap gap-1 mb-1",
                                        children: [
                                          hasValue(o.total_real_price) &&
                                          c.jsxs("span", {
                                            className:
                                              "text-[10px] bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded font-bold",
                                            children: [
                                              "Store: $",
                                              o.total_real_price,
                                            ],
                                          }),
                                          hasValue(o.total_charged_price) &&
                                          c.jsxs("span", {
                                            className:
                                              "text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold",
                                            children: [
                                              "Charged: $",
                                              o.total_charged_price,
                                            ],
                                          }),
                                          hasValue(o.tax_percentage) &&
                                          c.jsxs("span", {
                                            className:
                                              "text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100",
                                            children: [
                                              "Tax: ",
                                              o.tax_percentage,
                                              "%",
                                            ],
                                          }),
                                          o.shipping_paid &&
                                          c.jsx("span", {
                                            className:
                                              "text-[10px] bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded border border-teal-100",
                                            children: "Ship ✓",
                                          }),
                                        ],
                                      }),
                                      (o.items || []).length > 0
                                        ? c.jsxs("p", {
                                          className:
                                            "text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded inline-block",
                                          children: [
                                            (o.items || []).length,
                                            " Product(s) linked",
                                          ],
                                        })
                                        : c.jsx("p", {
                                          className:
                                            "text-xs text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded inline-block",
                                          children: "No products linked",
                                        }),
                                    ],
                                  }),
                                ],
                              }),
                              c.jsxs("div", {
                                className:
                                  "mt-3 pt-3 border-t flex justify-between gap-2",
                                children: [
                                  c.jsxs("button", {
                                    onClick: () => {
                                      (We(o),
                                        $e({
                                          total_real_price:
                                            o.total_real_price || "",
                                          total_charged_price:
                                            o.total_charged_price || "",
                                          tax_percentage:
                                            o.tax_percentage || "8.00",
                                          shipping_paid:
                                            o.shipping_paid || !1,
                                        }),
                                        sn(!0));
                                    },
                                    className:
                                      "text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 flex items-center gap-1 px-3 py-1.5 rounded-lg transition",
                                    children: [
                                      c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-[14px]",
                                        children: "edit",
                                      }),
                                      " Edit Data",
                                    ],
                                  }),
                                  c.jsxs("button", {
                                    onClick: () => la(o),
                                    className:
                                      "text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 flex items-center gap-1 px-3 py-1.5 rounded-lg transition",
                                    children: [
                                      c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-[14px]",
                                        children: "link",
                                      }),
                                      " Edit Linked Items Group",
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          },
                          o.id,
                        ),
                      ),
                      X === "PS" &&
                      c.jsxs("div", {
                        onClick: receiptUploading ? void 0 : su,
                        className:
                          `bg-purple-50 dark:bg-purple-900/10 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-purple-300 dark:border-purple-700/50 py-8 transition ${receiptUploading ? "cursor-wait opacity-75" : "cursor-pointer hover:bg-purple-100/50"}`,
                        children: [
                          c.jsx("span", {
                            className:
                              `material-symbols-outlined text-4xl text-purple-600 mb-2 ${receiptUploading ? "animate-spin" : ""}`,
                            children: receiptUploading
                              ? "progress_activity"
                              : "receipt_long",
                          }),
                          c.jsx("span", {
                            className:
                              "text-sm font-semibold text-purple-700 dark:text-purple-400",
                            children: receiptUploading
                              ? "Subiendo ticket..."
                              : "Upload Store Ticket",
                          }),
                          receiptUploading &&
                          c.jsx("span", {
                            className: "text-[11px] text-purple-600 mt-1",
                            children: "Esperando confirmacion del servidor.",
                          }),
                        ],
                      }),
                      X === "AV" &&
                      (W.receipts || []).length === 0 &&
                      c.jsx("div", {
                        className:
                          "text-center py-8 text-gray-400 text-sm",
                        children:
                          "No tickets uploaded by the Personal Shopper yet.",
                      }),
                    ],
                  }),
                ],
              }),
              false &&
              fullscreenImage &&
              c.jsx("div", {
                className:
                  "fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4",
                onClick: () => setFullscreenImage(null),
                children: c.jsxs("div", {
                  className: "relative max-w-[95vw] max-h-[90vh]",
                  onClick: (o) => o.stopPropagation(),
                  children: [
                    c.jsx("button", {
                      onClick: () => setFullscreenImage(null),
                      className:
                        "absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-gray-700 border border-gray-200 flex items-center justify-center shadow",
                      children: c.jsx("span", {
                        className: "material-symbols-outlined",
                        children: "close",
                      }),
                    }),
                    c.jsx("img", {
                      src: fullscreenImage,
                      className:
                        "max-w-[95vw] max-h-[90vh] object-contain rounded-xl bg-black",
                    }),
                  ],
                }),
              }),
            ],
          }),
          false &&
          fullscreenImage &&
          c.jsx("div", {
            className:
              "fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4",
            onClick: () => setFullscreenImage(null),
            children: c.jsxs("div", {
              className: "relative max-w-[95vw] max-h-[90vh]",
              onClick: (o) => o.stopPropagation(),
              children: [
                c.jsx("button", {
                  onClick: () => setFullscreenImage(null),
                  className:
                    "absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white text-gray-700 border border-gray-200 flex items-center justify-center shadow",
                  children: c.jsx("span", {
                    className: "material-symbols-outlined",
                    children: "close",
                  }),
                }),
                c.jsx("img", {
                  src: fullscreenImage,
                  className:
                    "max-w-[95vw] max-h-[90vh] object-contain rounded-xl bg-black",
                }),
              ],
            }),
          }),
      Pl &&
      c.jsxs("div", {
        className: overlayBackdropClass(
          "absolute inset-0 z-[60] bg-black/50 flex items-end ui-backdrop",
          "group-ticket",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: [
          c.jsxs("div", {
            className: overlaySheetClass(
              "bg-background-light dark:bg-background-dark flex flex-col animate-in slide-in-from-bottom duration-300 h-[85vh] w-full rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-border-light dark:border-border-dark overflow-hidden ui-sheet",
              "group-ticket",
            ),
            onClick: (o) => o.stopPropagation(),
                children: [
                  c.jsxs("div", {
                    className:
                      "p-5 border-b border-border-light dark:border-border-dark flex justify-between items-center bg-gray-50 dark:bg-gray-800",
                    children: [
                      c.jsx("h3", {
                        className: "text-lg font-bold",
                        children: "Group Products into Ticket",
                      }),
                      c.jsx("button", {
                        onClick: () => dismissActiveOverlayRef.current(),
                        className:
                          "w-8 h-8 flex items-center justify-center rounded-full ui-icon-button",
                        children: c.jsx("span", {
                          className: "material-symbols-outlined",
                          children: "close",
                        }),
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: "flex-1 overflow-y-auto p-5",
                    children: [
                      c.jsxs("div", {
                        className:
                                "mb-4 flex items-center gap-4 bg-purple-50 border border-purple-100 p-3 rounded-xl shadow-[0_14px_28px_-24px_rgba(88,28,135,0.3)]",
                        children: [
                          va
                            ? c.jsx("img", {
                              src: va,
                              className:
                                "ui-media-frame ui-media-ticket-sm object-cover",
                            })
                            : c.jsx("div", {
                              className:
                                "ui-media-frame ui-media-ticket-sm bg-white text-gray-300 flex items-center justify-center",
                              children: c.jsx("span", {
                                className: "material-symbols-outlined",
                                children: "receipt",
                              }),
                            }),
                          c.jsxs("div", {
                            children: [
                              c.jsxs("p", {
                                className:
                                  "font-semibold text-sm text-purple-900",
                                children: ["Selecting Group for Ticket #", kt],
                              }),
                              c.jsx("p", {
                                className: "text-xs text-purple-700",
                                children:
                                  "Tap products below to group them into this ticket.",
                              }),
                            ],
                          }),
                        ],
                      }),
                      W.products.length === 0
                        ? c.jsx("p", {
                          className: "text-sm text-center text-gray-500 my-8",
                          children:
                            "This client has no products added. Add products first to link them to tickets.",
                        })
                        : c.jsx("div", {
                          className: "space-y-3 pb-24",
                          children: W.products.map((o) =>
                            c.jsxs(
                              "div",
                              {
                                onClick: () => gn(o.id),
                                className: `flex items-center gap-4 p-3 rounded-xl border-2 transition-colors cursor-pointer ${ct.includes(o.id) ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-gray-200 dark:border-gray-700 hover:border-primary/50"}`,
                                children: [
                                  o.image
                                    ? c.jsx("img", {
                                      src: resolveMediaUrl(o.image),
                                      className:
                                        "ui-media-frame ui-media-md object-cover",
                                    })
                                    : c.jsx("div", {
                                      className:
                                        "ui-media-frame ui-media-md bg-white dark:bg-slate-900 flex items-center justify-center text-gray-400",
                                      children: c.jsx("span", {
                                        className:
                                          "material-symbols-outlined",
                                        children: "image",
                                      }),
                                    }),
                                  c.jsxs("div", {
                                    className: "flex-1",
                                    children: [
                                      c.jsx("p", {
                                        className: "font-semibold text-sm",
                                        children: o.name,
                                      }),
                                      c.jsx("p", {
                                        className:
                                          "text-[10px] text-gray-500 uppercase",
                                        children: o.status,
                                      }),
                                    ],
                                  }),
                                  c.jsx("div", {
                                    className: `w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${ct.includes(o.id) ? "border-green-600 bg-green-500 text-white" : "border-gray-300"}`,
                                    children:
                                      ct.includes(o.id) &&
                                      c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-[16px] font-bold",
                                        children: "check",
                                      }),
                                  }),
                                ],
                              },
                              o.id,
                            ),
                          ),
                        }),
                    ],
                  }),
                  c.jsx("div", {
                    className:
                      "absolute bottom-0 inset-x-0 p-4 border-t border-border-light dark:border-border-dark bg-white dark:bg-surface-dark pb-8",
                    children: c.jsx("button", {
                      onClick: ve,
                      disabled: W.products.length === 0,
                      className: `w-full py-4 text-white font-bold rounded-xl shadow-lg transition flex justify-center items-center gap-2 ${W.products.length === 0 ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`,
                      children:
                        ct.length > 0
                          ? c.jsxs(c.Fragment, {
                            children: [
                              "Save Ticket & Group ",
                              ct.length,
                              " Item(s)",
                            ],
                          })
                          : c.jsx(c.Fragment, {
                            children: "Save Group (0 Items)",
                          }),
                    }),
                  }),
                ],
              }),
            ],
          }),
          ],
        }),
      }),
      toasts.length > 0 &&
      c.jsx("div", {
        className:
          "fixed inset-x-0 top-4 z-[88] flex flex-col items-center gap-2 px-4 pointer-events-none",
        children: toasts.map((o) =>
          c.jsxs(
            "div",
            {
              className:
                `pointer-events-auto w-full max-w-md rounded-2xl border shadow-lg backdrop-blur-sm px-4 py-3 flex items-start gap-3 ${o.tone === "success"
                  ? "bg-emerald-50/95 border-emerald-200 text-emerald-800"
                  : o.tone === "error"
                    ? "bg-rose-50/95 border-rose-200 text-rose-800"
                    : "bg-slate-50/95 border-slate-200 text-slate-800"}`,
              children: [
                c.jsx("span", {
                  className: "material-symbols-outlined text-[18px] mt-0.5",
                  children:
                    o.tone === "success"
                      ? "check_circle"
                      : o.tone === "error"
                        ? "error"
                        : "info",
                }),
                c.jsx("p", {
                  className: "flex-1 text-sm font-medium leading-5",
                  children: o.message,
                }),
                c.jsx("button", {
                  onClick: () => dismissToast(o.id),
                  className:
                    "w-7 h-7 rounded-full hover:bg-black/5 flex items-center justify-center",
                  children: c.jsx("span", {
                    className: "material-symbols-outlined text-[16px]",
                    children: "close",
                  }),
                }),
              ],
            },
            o.id,
          ),
        ),
      }),
      confirmDialog &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-4 ui-backdrop",
          "confirm",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl p-5 ui-sheet",
            "confirm",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className: "flex items-start gap-3",
              children: [
                c.jsx("div", {
                  className:
                    `w-10 h-10 rounded-2xl flex items-center justify-center ${confirmDialog.tone === "danger" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"}`,
                  children: c.jsx("span", {
                    className: "material-symbols-outlined",
                    children:
                      confirmDialog.tone === "danger" ? "warning" : "help",
                  }),
                }),
                c.jsxs("div", {
                  className: "flex-1",
                  children: [
                    c.jsx("h3", {
                      className: "text-base font-bold text-text-main",
                      children: confirmDialog.title,
                    }),
                    c.jsx("p", {
                      className: "text-sm text-text-sub mt-1",
                      children: confirmDialog.message,
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "mt-5 grid grid-cols-2 gap-2",
              children: [
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold",
                  children: confirmDialog.cancelLabel,
                }),
                c.jsx("button", {
                  onClick: () => closeConfirmDialog(!0),
                  className:
                    `py-2.5 rounded-xl text-sm font-semibold text-white ${confirmDialog.tone === "danger" ? "bg-rose-600 hover:bg-rose-700" : "bg-primary hover:bg-primary-dark"}`,
                  children: confirmDialog.confirmLabel,
                }),
              ],
            }),
          ],
        }),
      }),
      inputDialog &&
      c.jsx("div", {
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
          onClick: (o) => o.stopPropagation(),
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
                  children: inputDialog.fields.map((o) =>
                    c.jsxs(
                      "label",
                      {
                        className: "block",
                        children: [
                          c.jsx("span", {
                            className: "text-[11px] font-semibold text-text-sub",
                            children: o.label || o.name,
                          }),
                          o.type === "textarea"
                            ? c.jsx("textarea", {
                              rows: 4,
                              value: o.value,
                              onChange: (N) =>
                                updateInputDialogField(o.name, N.target.value),
                              placeholder: o.placeholder || "",
                              className:
                                "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                            })
                            : o.type === "select"
                              ? c.jsx("select", {
                                value: o.value,
                                onChange: (N) =>
                                  updateInputDialogField(o.name, N.target.value),
                                className:
                                  "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                                children: (o.options || []).map((N) =>
                                  c.jsx(
                                    "option",
                                    { value: N.value, children: N.label },
                                    `${o.name}-${N.value}`,
                                  ),
                                ),
                              })
                              : c.jsx("input", {
                                type: "text",
                                value: o.value,
                                onChange: (N) =>
                                  updateInputDialogField(o.name, N.target.value),
                                placeholder: o.placeholder || "",
                                className:
                                  "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                              }),
                        ],
                      },
                      o.name,
                    ),
                  ),
                }),
              ],
            }),
            c.jsxs("div", {
              className: "mt-5 grid grid-cols-2 gap-2 pt-3 border-t border-border-light dark:border-border-dark",
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
      }),
      paymentModalOpen &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
          "payment-modal",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-5xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet flex flex-col overflow-hidden",
            "payment-modal",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className:
                "px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between gap-3",
              children: [
                c.jsxs("div", {
                  className: "min-w-0",
                  children: [
                    c.jsx("h3", {
                      className: "text-base font-bold text-text-main",
                      children: paymentForm.id ? "Editar pago" : "Registrar pago",
                    }),
                    c.jsx("p", {
                      className: "text-[11px] text-text-sub mt-0.5",
                      children:
                        "Selecciona productos anotados de la shopping y registra el monto pagado.",
                    }),
                  ],
                }),
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
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
              className: "flex-1 overflow-y-auto ios-scroll p-4 space-y-4",
              children: [
                c.jsxs("div", {
                  className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3",
                  children: [
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-border-light dark:border-border-dark bg-white/80 dark:bg-slate-900/50 px-3 py-2 xl:col-span-2",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-[10px] uppercase font-bold tracking-wide text-text-sub",
                          children: "Cliente",
                        }),
                        c.jsx("p", {
                          className:
                            "text-sm font-semibold text-text-main dark:text-white mt-1",
                          children:
                            (paymentModalClient && paymentModalClient.name) ||
                            "Sin cliente",
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-border-light dark:border-border-dark bg-white/80 dark:bg-slate-900/50 px-3 py-2 xl:col-span-2",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-[10px] uppercase font-bold tracking-wide text-text-sub",
                          children: "Shopping",
                        }),
                        c.jsx("p", {
                          className:
                            "text-sm font-semibold text-text-main dark:text-white mt-1",
                          children:
                            (paymentModalShopping &&
                              (paymentModalShopping.name ||
                                paymentModalShopping.store_name)) ||
                            `Shopping #${paymentForm.shopping}`,
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      className:
                        "rounded-2xl border border-violet-100 dark:border-violet-900/60 bg-violet-50/70 dark:bg-violet-950/20 px-3 py-2",
                      children: [
                        c.jsx("p", {
                          className:
                            "text-[10px] uppercase font-bold tracking-wide text-violet-600 dark:text-violet-300",
                          children: "Seleccion",
                        }),
                        c.jsxs("p", {
                          className:
                            "text-sm font-semibold text-violet-700 dark:text-violet-100 mt-1",
                          children: [
                            paymentSelectedProducts.length,
                            " producto(s)",
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className:
                    "grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.95fr)] gap-4",
                  children: [
                    c.jsxs("div", {
                      className:
                        "rounded-3xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-slate-900/45 overflow-hidden",
                      children: [
                        c.jsxs("div", {
                          className:
                            "px-4 py-3 border-b border-border-light dark:border-border-dark space-y-3",
                          children: [
                            c.jsxs("div", {
                              className:
                                "flex items-center justify-between gap-3",
                              children: [
                                c.jsxs("div", {
                                  className: "min-w-0",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-sm font-bold text-text-main",
                                      children: "Productos del pago",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "text-[11px] text-text-sub mt-0.5",
                                      children: [
                                        paymentSelectedProducts.length,
                                        " seleccionados de ",
                                        paymentModalProducts.length,
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("span", {
                                  className:
                                    "inline-flex rounded-full bg-blue-100 px-2 py-1 text-[10px] font-bold text-blue-700",
                                  children: [
                                    "Venta: $",
                                    formatAmount(paymentSelectedProductsTotal),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: "relative",
                              children: [
                                c.jsx("span", {
                                  className:
                                    "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]",
                                  children: "search",
                                }),
                                c.jsx("input", {
                                  type: "text",
                                  value: paymentProductSearch,
                                  onChange: (o) =>
                                    setPaymentProductSearch(o.target.value),
                                  placeholder: "Buscar producto o status...",
                                  className:
                                    "w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
                                }),
                              ],
                            }),
                          ],
                        }),
                        paymentModalProducts.length === 0
                          ? c.jsx("div", {
                            className:
                              "px-4 py-10 text-sm text-center text-text-sub",
                            children:
                              "Este cliente no tiene productos en esta shopping.",
                          })
                          : paymentFilteredProducts.length === 0
                            ? c.jsx("div", {
                              className:
                                "px-4 py-10 text-sm text-center text-text-sub",
                              children:
                                "No hay productos que coincidan con ese filtro.",
                            })
                            : c.jsx("div", {
                              className:
                                "max-h-[52vh] overflow-y-auto ios-scroll p-3 space-y-2",
                              children: paymentFilteredProducts.map((o) => {
                                const N = (paymentForm.product_ids || []).includes(
                                    Number(o.id),
                                  ),
                                  A = paymentReservedProductIds.has(
                                    Number(o.id),
                                  );
                                return c.jsxs(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () => togglePaymentProductSelection(o),
                                    disabled: A,
                                    className:
                                      `w-full text-left rounded-2xl border px-3 py-3 transition ${
                                        N
                                          ? "border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30"
                                          : A
                                            ? "border-slate-200 bg-slate-100/80 text-slate-400 cursor-not-allowed dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-500"
                                            : "border-border-light bg-white dark:border-border-dark dark:bg-slate-900/50 hover:border-primary/40 hover:bg-primary/5"
                                      }`,
                                    children: [
                                      c.jsxs("div", {
                                        className:
                                          "flex items-center justify-between gap-3",
                                        children: [
                                          c.jsxs("div", {
                                            className:
                                              "flex items-center gap-3 flex-1 min-w-0",
                                            children: [
                                              o.image
                                                ? c.jsx("img", {
                                                  src: resolveMediaUrl(o.image),
                                                  className:
                                                    "ui-media-frame ui-media-xs object-cover",
                                                })
                                                : c.jsx("div", {
                                                  className:
                                                    "ui-media-frame ui-media-xs bg-gray-200 dark:bg-gray-700 flex items-center justify-center",
                                                  children: c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-gray-400 text-[14px]",
                                                    children: "image",
                                                  }),
                                                }),
                                              c.jsxs("div", {
                                                className: "min-w-0 flex-1",
                                                children: [
                                                  c.jsx("p", {
                                                    className:
                                                      "text-sm font-semibold truncate text-text-main dark:text-white",
                                                    children: o.name,
                                                  }),
                                                  c.jsxs("div", {
                                                    className:
                                                      "mt-1 flex flex-wrap gap-1",
                                                    children: [
                                                      c.jsxs("span", {
                                                        className:
                                                          "inline-flex rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700",
                                                        children: [
                                                          "$",
                                                          formatAmount(
                                                            getProductPaymentAmount(
                                                              o,
                                                            ),
                                                          ),
                                                        ],
                                                      }),
                                                      c.jsx("span", {
                                                        className:
                                                          "inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700",
                                                        children:
                                                          o.status || "SIN STATUS",
                                                      }),
                                                      A &&
                                                      c.jsx("span", {
                                                        className:
                                                          "inline-flex rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700",
                                                        children:
                                                          "Ligado a otro pago",
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                            ],
                                          }),
                                          c.jsx("div", {
                                            className:
                                              `w-8 h-8 rounded-full border flex items-center justify-center ${
                                                N
                                                  ? "border-violet-500 bg-violet-500 text-white"
                                                  : "border-slate-300 text-slate-400 dark:border-slate-700"
                                              }`,
                                            children: c.jsx("span", {
                                              className:
                                                "material-symbols-outlined text-[16px]",
                                              children: N ? "check" : "add",
                                            }),
                                          }),
                                        ],
                                      }),
                                    ],
                                  },
                                  `payment-modal-product-${o.id}`,
                                );
                              }),
                            }),
                      ],
                    }),
                    c.jsxs("div", {
                      className: "space-y-4",
                      children: [
                        c.jsxs("div", {
                          className:
                            "rounded-3xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-slate-900/45 p-4 space-y-4",
                          children: [
                            c.jsxs("div", {
                              className: "grid grid-cols-1 gap-3",
                              children: [
                                c.jsxs("label", {
                                  className: "block",
                                  children: [
                                    c.jsx("span", {
                                      className:
                                        "text-[11px] font-semibold text-text-sub",
                                      children: "Monto del pago",
                                    }),
                                    c.jsx("input", {
                                      type: "number",
                                      step: "0.01",
                                      inputMode: "decimal",
                                      value: paymentForm.amount,
                                      onChange: (o) => {
                                        setPaymentAmountManual(!0);
                                        setPaymentForm((N) => ({
                                          ...N,
                                          amount: o.target.value,
                                        }));
                                      },
                                      placeholder: "0.00",
                                      className:
                                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                                    }),
                                    c.jsxs("div", {
                                      className:
                                        "mt-1 flex items-center justify-between gap-2",
                                      children: [
                                        c.jsxs("span", {
                                          className:
                                            "text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80",
                                          children: [
                                            "Suma productos: $",
                                            formatAmount(paymentSelectedProductsTotal),
                                          ],
                                        }),
                                        paymentAmountManual &&
                                        c.jsx("button", {
                                          type: "button",
                                          onClick: () => {
                                            setPaymentAmountManual(!1);
                                            setPaymentForm((N) => ({
                                              ...N,
                                              amount:
                                                (paymentForm.product_ids || []).length > 0
                                                  ? paymentSelectedProductsTotal.toFixed(2)
                                                  : "",
                                            }));
                                          },
                                          className:
                                            "text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
                                          children: "Usar suma",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("label", {
                                  className: "block",
                                  children: [
                                    c.jsx("span", {
                                      className:
                                        "text-[11px] font-semibold text-text-sub",
                                      children: "Nota",
                                    }),
                                    c.jsx("textarea", {
                                      rows: 4,
                                      value: paymentForm.note,
                                      onChange: (o) =>
                                        setPaymentForm((N) => ({
                                          ...N,
                                          note: o.target.value,
                                        })),
                                      placeholder:
                                        "Opcional: referencia, metodo de pago, comentario...",
                                      className:
                                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: "grid grid-cols-1 sm:grid-cols-3 gap-2",
                              children: [
                                c.jsxs("div", {
                                  className:
                                    "rounded-2xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 px-3 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300",
                                      children: "Venta",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "text-lg font-bold text-blue-700 dark:text-blue-100 mt-1",
                                      children: [
                                        "$",
                                        formatAmount(paymentSelectedProductsTotal),
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className:
                                    "rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900 px-3 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300",
                                      children: "Pago",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "text-lg font-bold text-emerald-700 dark:text-emerald-100 mt-1",
                                      children: [
                                        "$",
                                        formatAmount(paymentFormAmountValue),
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className:
                                    `rounded-2xl border px-3 py-2 ${
                                      paymentFormBalance < 0
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                                        : paymentFormBalance > 0
                                          ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                          : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                                    }`,
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        `text-[10px] uppercase font-bold ${
                                          paymentFormBalance < 0
                                            ? "text-emerald-700 dark:text-emerald-300"
                                            : paymentFormBalance > 0
                                              ? "text-slate-700 dark:text-slate-300"
                                              : "text-emerald-700 dark:text-emerald-300"
                                        }`,
                                      children:
                                        paymentFormBalance < 0
                                          ? "Credito"
                                          : "Saldo",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        `text-lg font-bold mt-1 ${
                                          paymentFormBalance < 0
                                            ? "text-emerald-700 dark:text-emerald-100"
                                            : paymentFormBalance > 0
                                              ? "text-slate-700 dark:text-slate-100"
                                              : "text-emerald-700 dark:text-emerald-100"
                                        }`,
                                      children: [
                                        "$",
                                        formatAmount(
                                          paymentFormBalance < 0
                                            ? Math.abs(paymentFormBalance)
                                            : paymentFormBalance,
                                        ),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsx("p", {
                              className:
                                "text-[11px] leading-5 text-text-sub",
                              children:
                                paymentFormBalance < 0
                                  ? "Credito a favor: el cliente pago mas de lo seleccionado."
                                  : "Puedes quitar o agregar productos para ajustar lo que cubre este pago.",
                            }),
                          ],
                        }),
                        paymentSelectedProducts.length > 0 &&
                        c.jsxs("div", {
                          className:
                            "rounded-3xl border border-border-light dark:border-border-dark bg-white/70 dark:bg-slate-900/45 p-4 space-y-2",
                          children: [
                            c.jsx("p", {
                              className:
                                "text-[11px] font-bold uppercase tracking-wide text-text-sub",
                              children: "Incluye",
                            }),
                            c.jsx("div", {
                              className: "flex flex-wrap gap-1.5",
                              children: paymentSelectedProducts.map((o) =>
                                c.jsxs(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () =>
                                      togglePaymentProductSelection(o),
                                    className:
                                      "inline-flex items-center gap-1 rounded-full border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-950/30 px-2 py-1 text-[10px] font-medium text-violet-700 dark:text-violet-200",
                                    children: [
                                      o.name,
                                      c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-[12px]",
                                        children: "close",
                                      }),
                                    ],
                                  },
                                  `payment-selected-${o.id}`,
                                ),
                              ),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className:
                "px-4 py-3 border-t border-border-light dark:border-border-dark bg-white/92 dark:bg-slate-950/70 grid grid-cols-2 gap-2",
              children: [
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  disabled: paymentSaving,
                  className:
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 disabled:opacity-60",
                  children: "Cancelar",
                }),
                c.jsx("button", {
                  onClick: savePayment,
                  disabled: paymentSaving,
                  className:
                    "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold disabled:opacity-70",
                  children: paymentSaving
                    ? "Guardando..."
                    : paymentForm.id
                      ? "Guardar"
                      : "Crear",
                }),
              ],
            }),
          ],
        }),
      }),
      shipmentModalOpen &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
          "shipment-modal",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet flex flex-col overflow-hidden",
            "shipment-modal",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className:
                "px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between gap-3",
              children: [
                c.jsxs("div", {
                  className: "min-w-0",
                  children: [
                    c.jsx("h3", {
                      className: "text-base font-bold text-text-main",
                      children: shipmentForm.id ? "Editar envio" : "Nuevo envio",
                    }),
                    c.jsx("p", {
                      className: "text-[11px] text-text-sub mt-0.5",
                      children: "Selecciona cliente, paqueteria y productos.",
                    }),
                  ],
                }),
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
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
              className: "flex-1 overflow-y-auto ios-scroll px-4 py-4 space-y-4",
              children: [
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Cliente",
                    }),
                    c.jsx("select", {
                      value: shipmentForm.client,
                      onChange: (o) =>
                        updateShipmentForm("client", o.target.value),
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                      children: Kl.map((o) =>
                        c.jsx(
                          "option",
                          { value: String(o.id), children: o.name },
                          `shipment-client-${o.id}`,
                        ),
                      ),
                    }),
                  ],
                }),
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Paqueteria",
                    }),
                    c.jsx("input", {
                      type: "text",
                      value: shipmentForm.carrier,
                      onChange: (o) =>
                        updateShipmentForm("carrier", o.target.value),
                      placeholder: "Ej. DHL, FedEx, Estafeta",
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                    }),
                    c.jsx("div", {
                      className:
                        "mt-2 max-h-44 overflow-y-auto ios-scroll rounded-xl border border-gray-200 bg-white dark:bg-gray-900 dark:border-gray-700 shadow-sm",
                      children:
                        filteredShippingCarrierSuggestions.length > 0
                          ? filteredShippingCarrierSuggestions.map((o) =>
                              c.jsx(
                                "button",
                                {
                                  type: "button",
                                  onClick: () =>
                                    updateShipmentForm("carrier", o.name),
                                  className:
                                    "w-full text-left px-3 py-2 border-b last:border-b-0 border-gray-100 dark:border-gray-800 text-sm hover:text-primary",
                                  children: c.jsx("span", {
                                    className: "font-medium",
                                    children: o.name,
                                  }),
                                },
                                `shipment-carrier-${o.recommendation_id || o.id}`,
                              ),
                            )
                          : c.jsx("div", {
                              className:
                                "px-3 py-2 text-sm text-gray-400 dark:text-gray-500",
                              children: "Sin sugerencias",
                            }),
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: "grid grid-cols-1 sm:grid-cols-4 gap-3",
                  children: [
                    c.jsxs("label", {
                      className: "block",
                      children: [
                        c.jsx("span", {
                          className: "text-[11px] font-semibold text-text-sub",
                          children: "Status de envio",
                        }),
                        c.jsx("select", {
                          value: shipmentForm.status,
                          onChange: (o) =>
                            updateShipmentForm("status", o.target.value),
                          className:
                            "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                          children: [
                            c.jsx("option", { value: "PENDING", children: "Pendiente" }, "shipment-status-pending"),
                            c.jsx("option", { value: "PREPARING", children: "Preparando" }, "shipment-status-preparing"),
                            c.jsx("option", { value: "SHIPPED", children: "Enviado" }, "shipment-status-shipped"),
                            c.jsx("option", { value: "DELIVERED", children: "Entregado" }, "shipment-status-delivered"),
                            c.jsx("option", { value: "CANCELLED", children: "Cancelado" }, "shipment-status-cancelled"),
                          ],
                        }),
                      ],
                    }),
                    c.jsxs("label", {
                      className: "block",
                      children: [
                        c.jsx("span", {
                          className: "text-[11px] font-semibold text-text-sub",
                          children: "Guia",
                        }),
                        c.jsx("input", {
                          type: "text",
                          value: shipmentForm.tracking_number,
                          onChange: (o) =>
                            updateShipmentForm("tracking_number", o.target.value),
                          className:
                            "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                        }),
                      ],
                    }),
                    c.jsxs("label", {
                      className: "block",
                      children: [
                        c.jsx("span", {
                          className: "text-[11px] font-semibold text-text-sub",
                          children: "Precio",
                        }),
                        c.jsx("input", {
                          type: "text",
                          inputMode: "decimal",
                          value: shipmentForm.client_price,
                          onChange: (o) =>
                            updateShipmentForm("client_price", o.target.value),
                          className:
                            "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Direccion de envio",
                    }),
                    c.jsx("textarea", {
                      rows: 3,
                      value: shipmentForm.shipping_address,
                      onChange: (o) =>
                        updateShipmentForm("shipping_address", o.target.value),
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className:
                    "rounded-2xl border border-border-light dark:border-border-dark bg-slate-50/80 dark:bg-slate-900/40 p-3 space-y-3",
                  children: [
                    c.jsxs("div", {
                      className: "flex items-center justify-between gap-3",
                      children: [
                        c.jsxs("div", {
                          className: "min-w-0",
                          children: [
                            c.jsx("p", {
                              className: "text-xs font-bold text-text-main",
                              children: "Productos del envio",
                            }),
                            c.jsxs("p", {
                              className: "text-[11px] text-text-sub",
                              children: [
                                shipmentSelectedProducts.length,
                                " seleccionados",
                              ],
                            }),
                          ],
                        }),
                        c.jsxs("button", {
                          type: "button",
                          onClick: () => setShipmentProductPickerOpen(!0),
                          className:
                            "shrink-0 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold flex items-center gap-1.5",
                          children: [
                            c.jsx("span", {
                              className:
                                "material-symbols-outlined text-[15px]",
                              children: "photo_library",
                            }),
                            "Galeria",
                          ],
                        }),
                      ],
                    }),
                    shipmentSelectedProducts.length > 0
                      ? c.jsx("div", {
                          className: "grid grid-cols-2 sm:grid-cols-3 gap-2",
                          children: shipmentSelectedProducts.map((o) =>
                            c.jsxs(
                              "button",
                              {
                                type: "button",
                                onClick: () => toggleShipmentProductSelection(o),
                                className:
                                  "relative overflow-hidden rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 text-left",
                                children: [
                                  o.image
                                    ? c.jsx("img", {
                                        src: resolveMediaUrl(o.image),
                                        className: "w-full aspect-[4/5] object-cover",
                                      })
                                    : c.jsx("div", {
                                        className:
                                          "w-full aspect-[4/5] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400",
                                        children: c.jsx("span", {
                                          className:
                                            "material-symbols-outlined text-[20px]",
                                          children: "image",
                                        }),
                                      }),
                                  c.jsx("div", {
                                    className:
                                      "absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/40 to-transparent",
                                    children: c.jsxs("div", {
                                      className: "space-y-0.5",
                                      children: [
                                        c.jsx("p", {
                                          className:
                                            "text-[11px] font-semibold text-white truncate",
                                          children: o.name,
                                        }),
                                        c.jsx("p", {
                                          className:
                                            "text-[10px] text-white/80 truncate",
                                          children:
                                            o.shopping_name ||
                                            o.mission_name ||
                                            o.store_name ||
                                            "Sin shopping",
                                        }),
                                      ],
                                    }),
                                  }),
                                  c.jsx("div", {
                                    className:
                                      "absolute top-2 right-2 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center",
                                    children: c.jsx("span", {
                                      className:
                                        "material-symbols-outlined text-[14px]",
                                      children: "close",
                                    }),
                                  }),
                                ],
                              },
                              `shipment-picked-${o.id}`,
                            ),
                          ),
                        })
                      : c.jsx("p", {
                          className: "text-xs text-text-sub",
                          children:
                            "Abre la galeria para elegir productos de todas las shoppings de este cliente.",
                        }),
                  ],
                }),
                shipmentModalClient &&
                c.jsxs("div", {
                  className:
                    "rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900 px-3 py-2",
                  children: [
                    c.jsx("p", {
                      className:
                        "text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300",
                      children: "Cliente",
                    }),
                    c.jsx("p", {
                      className:
                        "text-xs text-amber-800 dark:text-amber-100 mt-0.5",
                      children: shipmentModalClient.name,
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className:
                "px-4 py-3 border-t border-border-light dark:border-border-dark bg-white/92 dark:bg-slate-950/70 grid grid-cols-2 gap-2",
              children: [
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
                  children: "Cancelar",
                }),
                c.jsx("button", {
                  onClick: saveShipmentEditor,
                  className:
                    "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold",
                  children: shipmentForm.id ? "Guardar" : "Crear",
                }),
              ],
            }),
          ],
        }),
      }),
      shipmentProductPickerOpen &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[90] bg-black/55 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
          "shipment-product-picker",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-4xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet flex flex-col overflow-hidden",
            "shipment-product-picker",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className:
                "px-4 py-3 border-b border-border-light dark:border-border-dark flex items-center justify-between gap-3",
              children: [
                c.jsxs("div", {
                  className: "min-w-0",
                  children: [
                    c.jsx("h3", {
                      className: "text-base font-bold text-text-main",
                      children: "Productos del cliente",
                    }),
                    c.jsx("p", {
                      className: "text-[11px] text-text-sub mt-0.5",
                      children:
                        "Selecciona varios productos aunque sean de distintas shoppings.",
                    }),
                  ],
                }),
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
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
              className: "px-4 py-3 border-b border-border-light dark:border-border-dark space-y-3",
              children: [
                c.jsxs("div", {
                  className: "relative",
                  children: [
                    c.jsx("span", {
                      className:
                        "material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]",
                      children: "search",
                    }),
                    c.jsx("input", {
                      type: "text",
                      placeholder: "Buscar producto, shopping o tienda...",
                      value: shipmentProductSearch,
                      onChange: (o) => setShipmentProductSearch(o.target.value),
                      className:
                        "w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 transition-shadow",
                    }),
                  ],
                }),
                c.jsxs("p", {
                  className: "text-[11px] text-text-sub",
                  children: [
                    shipmentSelectedProducts.length,
                    " producto(s) seleccionado(s)",
                  ],
                }),
              ],
            }),
            shipmentModalFilteredProducts.length === 0
              ? c.jsx("div", {
                  className:
                    "flex-1 overflow-y-auto ios-scroll px-4 py-10 text-center text-sm text-text-sub",
                  children:
                    "No hay productos compartibles para este cliente con ese filtro.",
                })
              : c.jsx("div", {
                  className:
                    "flex-1 overflow-y-auto ios-scroll p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3",
                  children: shipmentModalFilteredProducts.map((o) => {
                    const N = (shipmentForm.product_ids || []).includes(
                      Number(o.id),
                    );
                    return c.jsxs(
                      "button",
                      {
                        type: "button",
                        onClick: () => toggleShipmentProductSelection(o),
                        className:
                          `relative overflow-hidden rounded-2xl border text-left ${N ? "border-primary ring-2 ring-primary/30" : "border-border-light dark:border-border-dark"} bg-surface-light dark:bg-surface-dark`,
                        children: [
                          o.image
                            ? c.jsx("img", {
                                src: resolveMediaUrl(o.image),
                                className: "w-full aspect-[3/4] object-cover",
                              })
                            : c.jsx("div", {
                                className:
                                  "w-full aspect-[3/4] bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400",
                                children: c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-[24px]",
                                  children: "image",
                                }),
                              }),
                          c.jsx("div", {
                            className:
                              "absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 via-black/35 to-transparent",
                            children: c.jsxs("div", {
                              className: "space-y-0.5",
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-[11px] font-semibold text-white truncate",
                                  children: o.name,
                                }),
                                c.jsx("p", {
                                  className: "text-[10px] text-white/80 truncate",
                                  children:
                                    o.shopping_name ||
                                    o.mission_name ||
                                    o.store_name ||
                                    "Sin shopping",
                                }),
                              ],
                            }),
                          }),
                          c.jsx("div", {
                            className:
                              `absolute top-2 right-2 w-6 h-6 rounded-full border flex items-center justify-center ${N ? "bg-primary border-primary text-white" : "bg-white/85 border-white/90 text-slate-400"}`,
                            children:
                              N &&
                              c.jsx("span", {
                                className:
                                  "material-symbols-outlined text-[15px]",
                                children: "check",
                              }),
                          }),
                        ],
                      },
                      `shipment-picker-${o.id}`,
                    );
                  }),
                }),
            c.jsxs("div", {
              className:
                "px-4 py-3 border-t border-border-light dark:border-border-dark bg-white/92 dark:bg-slate-950/70 grid grid-cols-2 gap-2",
              children: [
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100",
                  children: "Cerrar",
                }),
                c.jsx("button", {
                  onClick: () => setShipmentProductPickerOpen(!1),
                  className:
                    "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold",
                  children: "Usar seleccion",
                }),
              ],
            }),
          ],
        }),
      }),
      reviewConversationEntry &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[79] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
          "review-conversation",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "w-full sm:max-w-lg max-h-[82vh] bg-surface-light dark:bg-surface-dark rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl overflow-hidden ui-sheet flex flex-col",
            "review-conversation",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className:
                "px-4 py-3 border-b border-border-light dark:border-border-dark flex items-start justify-between gap-3",
              children: [
                c.jsx("p", {
                  className: "text-[11px] text-gray-500 dark:text-slate-400",
                  children:
                    (reviewConversationEntry.product &&
                      reviewConversationEntry.product.name) ||
                    "Producto",
                }),
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center justify-center",
                  children: c.jsx("span", {
                    className: "material-symbols-outlined text-[18px]",
                    children: "close",
                  }),
                }),
              ],
            }),
            c.jsx("div", {
              ref: reviewConversationScrollRef,
              className: "px-3 py-2 flex-1 overflow-y-auto ios-scroll",
              children:
                reviewConversationEntry.review &&
                (reviewConversationEntry.review.messages || []).length > 0
                  ? [...(reviewConversationEntry.review.messages || [])]
                    .sort(
                      (o, N) =>
                        new Date(o.created_at || 0).getTime() -
                        new Date(N.created_at || 0).getTime(),
                    )
                    .map((o) => {
                    const N =
                      (J && o.sender && Number(o.sender) === Number(J.id)) ||
                      (J &&
                        o.sender_username &&
                        String(o.sender_username).toLowerCase() ===
                          String(J.username || "").toLowerCase());
                    return (
                    c.jsxs(
                      "div",
                      {
                        className: `w-full flex ${N ? "justify-end" : "justify-start"} ${N ? "mt-1" : "mt-0.5"}`,
                        children: [
                          c.jsxs("div", {
                            className:
                              `max-w-[88%] rounded-2xl px-3 py-2 ${N ? "ml-auto bg-primary text-white rounded-br-md" : "mr-auto bg-white/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-bl-md"}`,
                            children: [
                              c.jsxs("div", {
                                className:
                                  `flex items-center gap-2 text-[10px] mb-0.5 ${N ? "justify-end text-white/70" : "justify-between text-slate-400 dark:text-slate-500"}`,
                                children: [
                                  !N &&
                                  c.jsxs("span", {
                                    className:
                                      "font-semibold text-slate-700 dark:text-slate-100",
                                    children: [
                                      o.sender_username || "Usuario",
                                      " • ",
                                      o.sender_role || "AV",
                                    ],
                                  }),
                                  c.jsx("span", {
                                    className: N ? "inline-flex items-center gap-1 text-white/70" : "",
                                    children: N
                                      ? [
                                          o.created_at
                                            ? new Date(o.created_at).toLocaleString()
                                            : "",
                                          c.jsx(
                                            "span",
                                            {
                                              className:
                                                "material-symbols-outlined text-[12px] leading-none",
                                              children: o.seen_by_other ? "done_all" : "done",
                                            },
                                            `${o.id}-seen-status`,
                                          ),
                                        ]
                                      : o.created_at
                                        ? new Date(o.created_at).toLocaleString()
                                        : "",
                                  }),
                                ],
                              }),
                              (o.from_status || o.to_status) &&
                              c.jsx("p", {
                                className:
                                  `mb-1 text-[10px] font-semibold ${N ? "text-white/80 text-right" : "text-primary/80 dark:text-sky-300/80"}`,
                                children:
                                  o.from_status &&
                                  o.to_status &&
                                  o.from_status !== o.to_status
                                    ? `${getReviewFlowLabel(o.from_status)} -> ${getReviewFlowLabel(o.to_status)}`
                                    : getReviewFlowLabel(
                                        o.to_status || o.from_status,
                                      ),
                              }),
                              o.message &&
                              c.jsx("p", {
                                className:
                                  `text-[12px] leading-relaxed whitespace-pre-wrap break-words ${N ? "text-white text-right" : "text-slate-700 dark:text-slate-200"}`,
                                children: o.message,
                              }),
                              (o.attachments || []).length > 0 &&
                              c.jsx("div", {
                                className: `mt-1.5 flex flex-wrap gap-1.5 ${N ? "justify-end" : ""}`,
                                children: (o.attachments || []).map((A) =>
                                  c.jsx(
                                    "button",
                                    {
                                      onClick: () =>
                                        setFullscreenImage({
                                          url: resolveMediaUrl(A.file),
                                          copyOnClick: !0,
                                          copyMessage: "Imagen copiada.",
                                        }),
                                      className:
                                        "w-14 h-14 overflow-hidden rounded-lg border border-white/20 dark:border-slate-700 bg-white dark:bg-slate-950",
                                      children: c.jsx("img", {
                                        src: resolveMediaUrl(A.file),
                                        className: "w-full h-full object-cover",
                                      }),
                                    },
                                    A.id,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        ],
                      },
                      o.id,
                    )
                    );
                  })
                  : c.jsx("p", {
                    className:
                      "text-sm text-center text-gray-500 dark:text-slate-400 py-8",
                    children: "No hay mensajes guardados en esta revision.",
                  }),
            }),
            c.jsxs("div", {
              className:
                "border-t border-border-light dark:border-border-dark px-3 py-3 bg-white/88 dark:bg-slate-950/40 space-y-2.5",
              children: [
                c.jsxs("div", {
                  className: "flex items-center justify-between gap-2",
                  children: [
                    c.jsx("div", {
                      className: "flex items-center gap-1.5",
                      children: currentConversationStatusActions.map((o) =>
                        c.jsx(
                          "button",
                          {
                            type: "button",
                            onClick: () => setAltUploadTargetStatus(o.value),
                            className:
                              `px-2.5 py-1.5 rounded-full text-[11px] font-medium border ${
                                altUploadTargetStatus === o.value
                                  ? "bg-primary text-white border-primary"
                                  : "bg-white/92 dark:bg-slate-900/92 text-slate-600 dark:text-slate-200 border-slate-200 dark:border-slate-700"
                              }`,
                            children: o.label,
                          },
                          o.value,
                        ),
                      ),
                    }),
                    c.jsxs("button", {
                      type: "button",
                      onClick: () =>
                        altUploadFileInputRef.current &&
                        altUploadFileInputRef.current.click(),
                      className:
                        "shrink-0 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/92 dark:bg-slate-900/92 text-[11px] font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                      children: [
                        "Adjuntar",
                        altUploadFiles.length > 0 ? ` (${altUploadFiles.length})` : "",
                      ],
                    }),
                  ],
                }),
                c.jsx("input", {
                  ref: altUploadFileInputRef,
                  type: "file",
                  accept: "image/*",
                  multiple: !0,
                  onChange: (o) =>
                    setAltUploadFiles(Array.from(o.target.files || [])),
                  className: "hidden",
                }),
                c.jsx("textarea", {
                  rows: 1,
                  value: altUploadDescription,
                  onChange: (o) => setAltUploadDescription(o.target.value),
                  onKeyDown: (o) => {
                    if (o.key !== "Enter" || o.shiftKey) return;
                    o.preventDefault();
                    sendReviewAlternatives({ closeAfterSave: !1 });
                  },
                  onInput: (o) => {
                    o.target.style.height = "0px";
                    o.target.style.height = `${Math.min(o.target.scrollHeight, 128)}px`;
                  },
                  placeholder: "Comentario opcional para este cambio",
                  className:
                    "w-full min-h-[38px] max-h-32 px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary resize-none overflow-y-auto ios-scroll",
                }),
                c.jsxs("div", {
                  className:
                    "flex items-center justify-between gap-3 text-[10px] text-gray-500 dark:text-slate-400",
                  children: [
                    c.jsx("span", {
                      children: "Comentario opcional",
                    }),
                    altUploadFiles.length > 0 &&
                    c.jsxs("span", {
                      children: ["Archivos: ", altUploadFiles.length],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: "grid grid-cols-2 gap-2",
                  children: [
                    c.jsx("button", {
                      onClick: () => dismissActiveOverlayRef.current(),
                      className:
                        "py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 text-xs font-semibold",
                      children: "Cerrar",
                    }),
                    c.jsx("button", {
                      onClick: () => sendReviewAlternatives({ closeAfterSave: !1 }),
                      className:
                        "py-2 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary-dark",
                      children: "Enviar",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      getFullscreenImageUrl(fullscreenImage) &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4 ui-backdrop",
          "fullscreen-image",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "relative max-w-[95vw] max-h-[90vh] ui-sheet",
            "fullscreen-image",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className: "absolute -top-11 right-0 flex items-center gap-2",
              children: [
                c.jsx("a", {
                  href: getFullscreenImageUrl(fullscreenImage),
                  target: "_blank",
                  rel: "noreferrer",
                  className:
                    "px-3 py-1.5 rounded-full bg-white text-gray-700 text-xs font-bold border border-gray-200 shadow hover:bg-gray-100",
                  children: "Abrir enlace",
                }),
                c.jsx("button", {
                  onClick: () => dismissActiveOverlayRef.current(),
                  className:
                    "w-9 h-9 rounded-full bg-white text-gray-700 border border-gray-200 flex items-center justify-center shadow",
                  children: c.jsx("span", {
                    className: "material-symbols-outlined",
                    children: "close",
                  }),
                }),
              ],
            }),
            c.jsx("img", {
              src: getFullscreenImageUrl(fullscreenImage),
              className:
                `max-w-[95vw] max-h-[90vh] object-contain rounded-xl bg-black ${typeof fullscreenImage == "object" && fullscreenImage && fullscreenImage.copyOnClick ? "cursor-copy" : ""}`,
              onClick: () => handleFullscreenImageCopy(),
              onError: (o) => {
                o.currentTarget.style.display = "none";
              },
            }),
            typeof fullscreenImage == "object" &&
            fullscreenImage &&
            fullscreenImage.copyOnClick &&
            c.jsx("p", {
              className:
                "mt-3 text-center text-xs font-medium text-white/80",
              children: "Toca la imagen para copiarla.",
            }),
          ],
        }),
      }),
      c.jsx("nav", {
        className: isDesktopLayout
          ? "fixed inset-y-0 left-0 w-80 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-lg border-r border-border-light dark:border-border-dark pt-4 px-4 z-[55] overflow-y-auto"
          : "fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-lg border-t border-border-light dark:border-border-dark pt-1 px-3 z-[55]",
        style: isDesktopLayout
          ? undefined
          : { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" },
        children: c.jsxs("div", {
          className: isDesktopLayout
            ? "flex h-full flex-col gap-2"
            : "flex justify-around items-center",
          children: [
            isDesktopLayout &&
            c.jsxs("div", {
              className:
                "px-2 pb-3 mb-2 border-b border-border-light dark:border-border-dark",
              children: [
                c.jsx("p", {
                  className:
                    "text-[10px] font-black uppercase tracking-[0.24em] text-text-sub",
                  children: "Modules",
                }),
                c.jsx("p", {
                  className: "mt-1 text-sm font-bold text-text-main dark:text-white",
                  children: "Personal Shopper",
                }),
              ],
            }),
            c.jsx("button", {
              onClick: () => navigateSection("HOME"),
              className: isDesktopLayout
                ? `ui-nav-item w-full px-4 py-4 rounded-3xl transition-colors flex items-center gap-3 text-left ${nl === "HOME" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "HOME" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      c.jsxs("div", {
                        className: "relative shrink-0",
                        children: [
                          c.jsx("span", {
                            className:
                              "material-symbols-outlined font-variation-settings-fill text-[22px]",
                            children: "dashboard",
                          }),
                          homeNeedsAttention &&
                          c.jsxs("span", {
                            className:
                              "absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5",
                            children: [
                              c.jsx("span", {
                                className:
                                  "animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75",
                              }),
                              c.jsx("span", {
                                className:
                                  "relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border border-white dark:border-gray-900",
                              }),
                            ],
                          }),
                        ],
                      }),
                      c.jsx("span", {
                        className: "text-sm font-semibold",
                        children: "Home",
                      }),
                    ],
                  })
                : c.jsxs("div", {
                    className: "relative",
                    children: [
                      c.jsx("span", {
                        className:
                          "material-symbols-outlined font-variation-settings-fill text-[20px]",
                        children: "dashboard",
                      }),
                      homeNeedsAttention &&
                      c.jsxs("span", {
                        className: "absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5",
                        children: [
                          c.jsx("span", {
                            className:
                              "animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75",
                          }),
                          c.jsx("span", {
                            className:
                              "relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600 border border-white dark:border-gray-900",
                          }),
                        ],
                      }),
                    ],
                  }),
            }),
            c.jsx("button", {
              onClick: () => navigateSection("MISSIONS"),
              className: isDesktopLayout
                ? `ui-nav-item w-full px-4 py-4 rounded-3xl transition-colors flex items-center gap-3 text-left ${nl === "MISSIONS" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "MISSIONS" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      c.jsxs("div", {
                        className: "relative shrink-0",
                        children: [
                          c.jsx("span", {
                            className:
                              "material-symbols-outlined text-[22px]",
                            children: "shopping_bag",
                          }),
                          w &&
                          c.jsx("span", {
                            className:
                              "absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900",
                          }),
                        ],
                      }),
                      c.jsx("span", {
                        className: "text-sm font-semibold",
                        children: "Shoppings",
                      }),
                    ],
                  })
                : c.jsxs("div", {
                    className: "relative",
                    children: [
                      c.jsx("span", {
                        className: "material-symbols-outlined text-[20px]",
                        children: "shopping_bag",
                      }),
                      w &&
                      c.jsx("span", {
                        className:
                          "absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900",
                      }),
                    ],
                  }),
            }),
            c.jsx("button", {
              onClick: () => navigateSection("CLIENTS"),
              className: isDesktopLayout
                ? `ui-nav-item w-full px-4 py-4 rounded-3xl transition-colors flex items-center gap-3 text-left ${nl === "CLIENTS" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "CLIENTS" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      c.jsx("div", {
                        className: "relative shrink-0",
                        children: c.jsx("span", {
                          className: "material-symbols-outlined text-[22px]",
                          children: "group",
                        }),
                      }),
                      c.jsx("span", {
                        className: "text-sm font-semibold",
                        children: "Clients",
                      }),
                    ],
                  })
                : c.jsx("div", {
                    className: "relative",
                    children: c.jsx("span", {
                      className: "material-symbols-outlined text-[20px]",
                      children: "group",
                    }),
                  }),
            }),
            c.jsx("button", {
              onClick: () => navigateSection("SHIPMENTS"),
              className: isDesktopLayout
                ? `ui-nav-item w-full px-4 py-4 rounded-3xl transition-colors flex items-center gap-3 text-left ${nl === "SHIPMENTS" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "SHIPMENTS" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      c.jsx("div", {
                        className: "relative shrink-0",
                        children: c.jsx("span", {
                          className: "material-symbols-outlined text-[22px]",
                          children: "local_shipping",
                        }),
                      }),
                      c.jsx("span", {
                        className: "text-sm font-semibold",
                        children: "Shipments",
                      }),
                    ],
                  })
                : c.jsx("span", {
                    className: "material-symbols-outlined text-[20px]",
                    children: "local_shipping",
                  }),
            }),
            c.jsx("button", {
              onClick: () => navigateSection("CALCULATOR"),
              className: isDesktopLayout
                ? `ui-nav-item w-full px-4 py-4 rounded-3xl transition-colors flex items-center gap-3 text-left ${nl === "CALCULATOR" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "CALCULATOR" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      c.jsx("div", {
                        className: "relative shrink-0",
                        children: c.jsx("span", {
                          className: "material-symbols-outlined text-[22px]",
                          children: "calculate",
                        }),
                      }),
                      c.jsx("span", {
                        className: "text-sm font-semibold",
                        children: "Calc",
                      }),
                    ],
                  })
                : c.jsx("span", {
                    className: "material-symbols-outlined text-[20px]",
                    children: "calculate",
                  }),
            }),
            c.jsx("button", {
              onClick: () => navigateSection("PROFILE"),
              className: isDesktopLayout
                ? `ui-nav-item w-full px-4 py-4 rounded-3xl transition-colors flex items-center gap-3 text-left ${nl === "PROFILE" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "PROFILE" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "flex items-center gap-3",
                    children: [
                      c.jsx("div", {
                        className: "relative shrink-0",
                        children: c.jsx("span", {
                          className: "material-symbols-outlined text-[22px]",
                          children: "person",
                        }),
                      }),
                      c.jsx("span", {
                        className: "text-sm font-semibold",
                        children: "Profile",
                      }),
                    ],
                  })
                : c.jsx("span", {
                    className: "material-symbols-outlined text-[20px]",
                    children: "person",
                  }),
            }),
          ],
        }),
      }),
    ],
  });
}

export default nh;
