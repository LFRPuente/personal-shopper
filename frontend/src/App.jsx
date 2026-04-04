import * as React from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

const V = React;
const c = { jsx, jsxs, Fragment };
const IS_FIREFOX =
  typeof navigator != "undefined" &&
  /firefox/i.test(String(navigator.userAgent || ""));
const optimizeMediaElementProps = (type, props) => {
  if (!props || typeof props != "object") return props;
  if (type === "img") {
    const nextProps = { ...props };
    typeof nextProps.loading == "undefined" && (nextProps.loading = "lazy");
    typeof nextProps.decoding == "undefined" && (nextProps.decoding = "async");
    return nextProps;
  }
  if (type === "video") {
    const nextProps = { ...props };
    typeof nextProps.preload == "undefined" &&
      (nextProps.preload = "metadata");
    typeof nextProps.playsInline == "undefined" &&
      (nextProps.playsInline = !0);
    return nextProps;
  }
  return props;
};
const jsxRuntimeOriginal = c.jsx;
const jsxsRuntimeOriginal = c.jsxs;
(c.jsx = (type, props, key) =>
  jsxRuntimeOriginal(type, optimizeMediaElementProps(type, props), key)),
  (c.jsxs = (type, props, key) =>
    jsxsRuntimeOriginal(type, optimizeMediaElementProps(type, props), key));
typeof document != "undefined" &&
  document.documentElement &&
  document.documentElement.classList.toggle("browser-firefox", IS_FIREFOX);

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

const clampNumber = (value, min, max) =>
  Math.min(max, Math.max(min, value));

const HOME_DESKTOP_LAYOUT_DEFAULTS = Object.freeze({
  left_width_percent: 62,
  top_height: 232,
});

const normalizeHomeDesktopLayout = (layout) => {
  const source = layout && typeof layout === "object" ? layout : {};
  const leftWidth = parseFloat(
    source.left_width_percent ?? HOME_DESKTOP_LAYOUT_DEFAULTS.left_width_percent,
  );
  const topHeight = parseFloat(
    source.top_height ?? HOME_DESKTOP_LAYOUT_DEFAULTS.top_height,
  );
  return {
    left_width_percent: Math.round(
      clampNumber(
        Number.isFinite(leftWidth)
          ? leftWidth
          : HOME_DESKTOP_LAYOUT_DEFAULTS.left_width_percent,
        44,
        72,
      ),
    ),
    top_height: Math.round(
      clampNumber(
        Number.isFinite(topHeight)
          ? topHeight
          : HOME_DESKTOP_LAYOUT_DEFAULTS.top_height,
        188,
        360,
      ),
    ),
  };
};

const DEFAULT_PRODUCT_FORM = {
  name: "",
  real_price: "",
  charged_price: "",
  shopping: "",
  payer: "",
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

const DARK_NATIVE_SELECT_STYLE = {
  color: "#ffffff",
  backgroundColor: "#0f172a",
};

const NATIVE_DROPDOWN_OPTION_STYLE = {
  color: "#0f172a",
  backgroundColor: "#ffffff",
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
const revokeBlobUrl = (o) => {
  const N = String(o || "").trim();
  if (!N.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(N);
  } catch {}
};
const toFormUserId = (o) =>
  o === null || typeof o === "undefined" || o === ""
    ? ""
    : String(o);
const toFormShoppingId = (o) =>
  o === null || typeof o === "undefined" || o === ""
    ? ""
    : String(o);
const getUserOptionLabel = (o) => {
  if (!o) return "";
  const N = String(
    (o && o.profile && o.profile.display_name) || "",
  ).trim();
  const A = String((o && o.username) || "").trim();
  const vl = N || A;
  const El = String((o && o.profile && o.profile.role) || "").trim();
  return vl && El ? `${vl} (${El})` : vl || El || "Usuario";
};
const normalizeClientCountryCode = (o) => {
  const N = String(o || "").replace(/[^\d]/g, "");
  return N ? `+${N.slice(0, 4)}` : "+52";
};
const normalizeClientPhoneDigits = (o) =>
  String(o || "")
    .replace(/\D/g, "")
    .slice(0, 10);
const sanitizeClientCountryCodeInput = (o) => {
  const N = String(o || "")
    .replace(/\D/g, "")
    .slice(0, 7);
  return N ? `+${N}` : "+";
};
const sanitizeClientPhoneInput = (o) =>
  String(o || "")
    .replace(/\D/g, "")
    .slice(0, 10);
const normalizeClientShippingAddresses = (o, N = "") => {
  const A = Array.isArray(o) ? o : [];
  const vl = String(N || "").trim();
  const El = vl ? new Set([vl.toLowerCase()]) : new Set();
  return A.reduce((Se, ea) => {
    const gl = String(ea || "").trim();
    if (!gl) return Se;
    const ae = gl.toLowerCase();
    if (El.has(ae)) return Se;
    El.add(ae);
    Se.push(gl);
    return Se;
  }, []);
};
const getClientPhoneDisplay = (o) => {
  const N = normalizeClientPhoneDigits(o && o.phone);
  if (!N) return "";
  return `${normalizeClientCountryCode(o && o.phone_country_code)} ${N}`;
};
const normalizeShipmentStatusValue = (o) => {
  const N = String(o || "").trim().toUpperCase();
  return N === "SHIPPED"
    ? "SHIPPED"
    : N === "DELIVERED"
      ? "DELIVERED"
      : N === "CANCELLED"
        ? "CANCELLED"
        : "PENDING";
};
const getShipmentStatusLabel = (o) => {
  const N = normalizeShipmentStatusValue(o);
  return N === "SHIPPED"
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
const SHIPMENT_CARRIER_OPTIONS = [
  { value: "", label: "Sin definir" },
  { value: "Estafeta", label: "Estafeta" },
  { value: "DHL", label: "DHL" },
];
const canEditShipmentBox = (shipment) => {
  return normalizeShipmentStatusValue(shipment && shipment.status) === "PENDING";
};
const getPublicShareInfoFromPath = () => {
  const o = window.location.pathname.match(/^\/share\/(client|shipment)\/([^/]+)\/?$/i);
  return o
    ? { type: String(o[1] || "").toLowerCase(), token: decodeURIComponent(o[2]) }
    : { type: "", token: "" };
};
const getPublicShareFocusShipmentIdFromSearch = () => {
  try {
    const o = new URLSearchParams(window.location.search || ""),
      N = String(o.get("focus_shipment_id") || o.get("shipment") || "").trim();
    if (!N) return null;
    const A = parseInt(N, 10);
    return Number.isFinite(A) ? A : null;
  } catch {
    return null;
  }
};
function nh() {
  const publicShareInfo = V.useMemo(() => getPublicShareInfoFromPath(), []),
    publicClientShareToken = publicShareInfo.token,
    publicShareType = publicShareInfo.type,
    publicFocusShipmentIdFromSearch = V.useMemo(
      () => getPublicShareFocusShipmentIdFromSearch(),
      [],
    ),
    DEFAULT_BREAKDOWN_TEMPLATE =
      "DESGLOSE DE TU CUENTA:\n\n{items}\n\nTOTAL TIENDA: ${total}\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗\n\nTe lo puedo asegurar por 10 minutos en lo que haces transferencia.💕",
    [C, jl] = V.useState(localStorage.getItem("access_token") || null),
    [J, b] = V.useState(null),
    [Q, al] = V.useState("LOGIN"),
    [cl, Ql] = V.useState({ username: "", password: "", role: "AV" }),
    [U, T] = V.useState(""),
    [X, H] = V.useState("AV"),
    [layoutMode, setLayoutMode] = V.useState("MOBILE"),
    [homeDesktopLayout, setHomeDesktopLayout] = V.useState(() =>
      normalizeHomeDesktopLayout(null),
    ),
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
    [clientPhoneCountryCode, setClientPhoneCountryCode] = V.useState("+52"),
    [p, z] = V.useState(""),
    [q, sl] = V.useState(""),
    [rl, d] = V.useState(""),
    [clientShippingAddresses, setClientShippingAddresses] = V.useState([]),
    [j, _] = V.useState(""),
    [O, Y] = V.useState(null),
    [K, tl] = V.useState(!1),
    [ml, hl] = V.useState({
      name: "",
      tags: "",
      status: "",
      phone_country_code: "+52",
      phone: "",
      email: "",
      shipping_address: "",
      shipping_addresses: [],
    }),
    [kt, Kt] = V.useState(null),
    [va, we] = V.useState(null),
    [ct, ke] = V.useState([]),
    [he, Ke] = V.useState(null),
    [st, Gt] = V.useState(() => createEmptyProductForm()),
    [productModalMode, setProductModalMode] = V.useState("edit"),
    [pendingProductFile, setPendingProductFile] = V.useState(null),
    [productPriceAutoInfoOpen, setProductPriceAutoInfoOpen] = V.useState(!1),
    [productPriceAutoSync, setProductPriceAutoSync] = V.useState(!0),
    [productPriceSyncSource, setProductPriceSyncSource] = V.useState("real"),
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
    [clientGalleryMissionScopeMeta, setClientGalleryMissionScopeMeta] = V.useState(
      null,
    ),
    [clientGalleryAllowsShoppingChoice, setClientGalleryAllowsShoppingChoice] = V.useState(
      !1,
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
    [profileSettingsForm, setProfileSettingsForm] = V.useState({
      display_name: "",
      phone: "",
    }),
    [profileSettingsSaving, setProfileSettingsSaving] = V.useState(!1),
    [calcCopied, setCalcCopied] = V.useState(!1),
    [fullscreenImage, setFullscreenImage] = V.useState(null),
    [users, setUsers] = V.useState([]),
    [stores, setStores] = V.useState([]),
    [storeRecommendations, setStoreRecommendations] = V.useState([]),
    [shippingCarrierRecommendations, setShippingCarrierRecommendations] = V.useState([]),
    [productModalShoppingSearch, setProductModalShoppingSearch] = V.useState(""),
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
    [publicPendingShipmentSelection, setPublicPendingShipmentSelection] = V.useState([]),
    [publicBuildingShipment, setPublicBuildingShipment] = V.useState(!1),
    [publicShipmentInfoOpen, setPublicShipmentInfoOpen] = V.useState(!1),
    [publicShipmentHistoryExpanded, setPublicShipmentHistoryExpanded] = V.useState(!1),
    [requests, setRequests] = V.useState([]),
    [shipments, setShipments] = V.useState([]),
    [shipmentSearch, setShipmentSearch] = V.useState(""),
    [shipmentEvidenceUploadingId, setShipmentEvidenceUploadingId] = V.useState(null),
    [shipmentEvidenceDeletingId, setShipmentEvidenceDeletingId] = V.useState(null),
    [shipmentEvidenceReplacingId, setShipmentEvidenceReplacingId] = V.useState(null),
    [openShipmentEvidenceMenuId, setOpenShipmentEvidenceMenuId] = V.useState(null),
    [expandedShipmentIds, setExpandedShipmentIds] = V.useState([]),
    [shipmentSaving, setShipmentSaving] = V.useState(!1),
    [shipmentModalOpen, setShipmentModalOpen] = V.useState(!1),
    [shipmentClientPickerOpen, setShipmentClientPickerOpen] = V.useState(!1),
    [shipmentClientSearch, setShipmentClientSearch] = V.useState(""),
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
      initial_product_ids: [],
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
      product_ids: [],
    }),
    [paymentEntryEditingId, setPaymentEntryEditingId] = V.useState(null),
    [paymentEntryDraftAmount, setPaymentEntryDraftAmount] = V.useState(""),
    [paymentEntrySavingId, setPaymentEntrySavingId] = V.useState(null),
    [clientPaymentModalOpen, setClientPaymentModalOpen] = V.useState(!1),
    [clientPaymentSaving, setClientPaymentSaving] = V.useState(!1),
    [clientPaymentAmountManual, setClientPaymentAmountManual] = V.useState(!1),
    [clientPaymentForm, setClientPaymentForm] = V.useState({
      client: "",
      amount: "",
    }),
    [clientPaymentEntryEditingId, setClientPaymentEntryEditingId] = V.useState(
      null,
    ),
    [clientPaymentEntryDraftAmount, setClientPaymentEntryDraftAmount] = V.useState(
      "",
    ),
    [clientPaymentEntrySavingId, setClientPaymentEntrySavingId] = V.useState(
      null,
    ),
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
    [imageSourceDialog, setImageSourceDialog] = V.useState(null),
    [imageSourceInfoOpen, setImageSourceInfoOpen] = V.useState(null),
    [openProductMenuId, setOpenProductMenuId] = V.useState(null),
    [openProductInfoId, setOpenProductInfoId] = V.useState(null),
    [openProductStatusId, setOpenProductStatusId] = V.useState(null),
    [reviewConversationEntry, setReviewConversationEntry] = V.useState(null),
    [openHistoryMissionByClient, setOpenHistoryMissionByClient] = V.useState({}),
    [showMissionStartModal, setShowMissionStartModal] = V.useState(!1),
    [missionStartForm, setMissionStartForm] = V.useState({
      name: "",
      store_name: "",
      payer: "",
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
    [productStatusUpdatingId, setProductStatusUpdatingId] = V.useState(null),
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
    reviewConversationScrollRef = V.useRef(null),
    reviewConversationStateRef = V.useRef(""),
    currentTabRef = V.useRef("HOME"),
    selectedClientIdRef = V.useRef(null),
    activeMissionIdRef = V.useRef(null),
    coreRefreshTimerRef = V.useRef(null),
    coreRefreshPendingRef = V.useRef(!1),
    coreRefreshInFlightRef = V.useRef(!1),
    selectedClientRefreshTimerRef = V.useRef(null),
    selectedClientRefreshPendingRef = V.useRef(!1),
    selectedClientRefreshInFlightRef = V.useRef(!1),
    homeDesktopGridRef = V.useRef(null),
    homeDesktopLayoutRef = V.useRef(normalizeHomeDesktopLayout(null)),
    homeDesktopResizeRef = V.useRef(null),
    toastTimeoutsRef = V.useRef(new Map()),
    toastIdRef = V.useRef(0),
    shoppingCalcPersistTimerRef = V.useRef(null),
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
        const [N, A, yl, qs, Vs] = await Promise.all([
          I("/clients/"),
          I("/shoppings/"),
          I("/shipments/"),
          I("/shipping-carrier-recommendations/"),
          I("/users/"),
        ]);
        _l(N || []);
        zl(A || []);
        setShipments(yl || []);
        setShippingCarrierRecommendations(qs || []);
        setUsers(Vs || []);
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
    runQueuedCoreRefresh = async () => {
      if (coreRefreshInFlightRef.current) {
        coreRefreshPendingRef.current = !0;
        return;
      }
      coreRefreshInFlightRef.current = !0;
      try {
        await refreshCoreData();
      } finally {
        coreRefreshInFlightRef.current = !1;
        if (coreRefreshPendingRef.current) {
          coreRefreshPendingRef.current = !1;
          queueCoreRefresh(180);
        }
      }
    },
    queueCoreRefresh = (o = 120) => {
      coreRefreshPendingRef.current = !0;
      coreRefreshTimerRef.current && clearTimeout(coreRefreshTimerRef.current);
      coreRefreshTimerRef.current = setTimeout(() => {
        coreRefreshTimerRef.current = null;
        coreRefreshPendingRef.current = !1;
        runQueuedCoreRefresh().catch((N) => {
          console.error("Failed queued core refresh", N);
        });
      }, o);
    },
    runQueuedSelectedClientRefresh = async () => {
      if (selectedClientRefreshInFlightRef.current) {
        selectedClientRefreshPendingRef.current = !0;
        return;
      }
      selectedClientRefreshInFlightRef.current = !0;
      try {
        await refreshSelectedClient();
      } finally {
        selectedClientRefreshInFlightRef.current = !1;
        if (selectedClientRefreshPendingRef.current) {
          selectedClientRefreshPendingRef.current = !1;
          queueSelectedClientRefresh(220);
        }
      }
    },
    queueSelectedClientRefresh = (o = 150) => {
      selectedClientRefreshPendingRef.current = !0;
      selectedClientRefreshTimerRef.current &&
        clearTimeout(selectedClientRefreshTimerRef.current);
      selectedClientRefreshTimerRef.current = setTimeout(() => {
        selectedClientRefreshTimerRef.current = null;
        selectedClientRefreshPendingRef.current = !1;
        runQueuedSelectedClientRefresh().catch((N) => {
          console.error("Failed queued selected client refresh", N);
        });
      }, o);
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
      : imageSourceDialog
        ? "image-source"
      : inputDialog
        ? "input"
        : clientPaymentModalOpen
          ? "client-payment-modal"
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
  V.useEffect(
    () => () => {
      coreRefreshTimerRef.current && clearTimeout(coreRefreshTimerRef.current);
      selectedClientRefreshTimerRef.current &&
        clearTimeout(selectedClientRefreshTimerRef.current);
    },
    [],
  );
  V.useEffect(() => {
    activeOverlayKeyRef.current = activeOverlayKey;
    const o = () => {
      setClosingOverlayKey("");
      if (confirmDialog) {
        closeConfirmDialog(!1);
        return;
      }
      if (imageSourceDialog) {
        closeImageSourceDialog();
        return;
      }
      if (inputDialog) {
        closeInputDialog(null);
        return;
      }
      if (clientPaymentModalOpen) {
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
        return;
      }
      if (paymentModalOpen) {
        setPaymentModalOpen(!1);
        setPaymentAmountManual(!1);
        setPaymentProductSearch("");
        setPaymentEntryEditingId(null);
        setPaymentEntryDraftAmount("");
        setPaymentEntrySavingId(null);
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
    imageSourceDialog,
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
    setProfileSettingsForm({
      display_name: String((J && J.profile && J.profile.display_name) || ""),
      phone: String((J && J.profile && J.profile.phone) || ""),
    });
  }, [J]);
  V.useEffect(() => {
    if (!me || !he || !productPriceAutoSync) return;
    if (productPriceSyncSource === "charged") {
      const o = computeProductModalStorePrice(st.charged_price);
      const N = Number.isFinite(o) ? o.toFixed(2) : "";
      Gt((A) =>
        String((A && A.real_price) || "") === N ? A : { ...A, real_price: N },
      );
      return;
    }
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
    st.charged_price,
    calcMode,
    calcFactor,
    calcDiscount,
    calcTaxes,
    calcCommission,
    calcExchangeRate,
    productPriceAutoSync,
    productPriceSyncSource,
  ]);
  V.useEffect(() => {
    if (!paymentModalOpen || paymentAmountManual || paymentForm.id) return;
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
            paymentLocalShoppingDiscount(paymentForm.shopping),
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
    if (!clientPaymentModalOpen || clientPaymentAmountManual) return;
    const o = Kl.find(
        (A) => String(A.id) === String(clientPaymentForm.client || ""),
      ) || null,
      N = (o ? getClientPaymentTargets(o) : []).reduce(
        (A, vl) => A + Math.max(toNumber(vl && vl.balance, 0), 0),
        0,
      ),
      A = N > 0 ? N.toFixed(2) : "";
    setClientPaymentForm((vl) =>
      String((vl && vl.amount) || "") === A ? vl : { ...vl, amount: A },
    );
  }, [
    clientPaymentModalOpen,
    clientPaymentAmountManual,
    clientPaymentForm.client,
    Kl,
    Al,
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
            queueCoreRefresh();
            return;
          }
          if (vl === "shipments") {
            queueCoreRefresh();
            queueSelectedClientRefresh();
            return;
          }
          if (vl === "products" || vl === "receipts") {
            queueCoreRefresh();
            queueSelectedClientRefresh();
            refreshUnreadSummaryForActiveMission().catch((ea) => {
              console.error("Failed refreshing unread summary", ea);
            });
            return;
          }
          if (vl === "requests") {
            await refreshRequestsForMission();
            return;
          }
          if (vl === "reviews") {
            queueCoreRefresh();
            queueSelectedClientRefresh();
            refreshReviewsForCurrentContext().catch((ea) => {
              console.error("Failed refreshing reviews", ea);
            });
            refreshUnreadSummaryForActiveMission().catch((ea) => {
              console.error("Failed refreshing unread summary", ea);
            });
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
  V.useEffect(
    () => () => {
      revokeBlobUrl(va);
    },
    [va],
  );
  V.useEffect(
    () => () => {
      revokeBlobUrl(newRequestImagePreview);
    },
    [newRequestImagePreview],
  );
  V.useEffect(
    () => () => {
      revokeBlobUrl(editingRequestImagePreview);
    },
    [editingRequestImagePreview],
  );
  V.useEffect(() => {
    if (
      openProductMenuId === null &&
      openProductInfoId === null &&
      openProductStatusId === null
    )
      return;
    const closeMenuOnOutsideClick = (o) => {
      const N = o.target;
      if (
        N &&
        N.closest &&
        (N.closest("[data-product-menu]") ||
          N.closest("[data-product-info]") ||
          N.closest("[data-product-status]"))
      )
        return;
      (setOpenProductMenuId(null),
        setOpenProductInfoId(null),
        setOpenProductStatusId(null));
    };
    const closeMenuOnEscape = (o) => {
      o.key === "Escape" &&
        (setOpenProductMenuId(null),
        setOpenProductInfoId(null),
        setOpenProductStatusId(null));
    };
    document.addEventListener("click", closeMenuOnOutsideClick);
    document.addEventListener("keydown", closeMenuOnEscape);
    return () => {
      document.removeEventListener("click", closeMenuOnOutsideClick);
      document.removeEventListener("keydown", closeMenuOnEscape);
    };
  }, [openProductMenuId, openProductInfoId, openProductStatusId]);
  V.useEffect(() => {
    if (openShipmentEvidenceMenuId === null) return;
    const closeShipmentEvidenceMenuOnOutsideClick = (o) => {
      const N = o.target;
      if (
        N &&
        N.closest &&
        N.closest("[data-shipment-evidence-menu]")
      )
        return;
      setOpenShipmentEvidenceMenuId(null);
    };
    const closeShipmentEvidenceMenuOnEscape = (o) => {
      o.key === "Escape" && setOpenShipmentEvidenceMenuId(null);
    };
    document.addEventListener("click", closeShipmentEvidenceMenuOnOutsideClick);
    document.addEventListener("keydown", closeShipmentEvidenceMenuOnEscape);
    return () => {
      document.removeEventListener("click", closeShipmentEvidenceMenuOnOutsideClick);
      document.removeEventListener("keydown", closeShipmentEvidenceMenuOnEscape);
    };
  }, [openShipmentEvidenceMenuId]);
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
  V.useEffect(
    () => () => {
      shoppingCalcPersistTimerRef.current &&
        clearTimeout(shoppingCalcPersistTimerRef.current);
    },
    [],
  );
  const getShoppingCalcPayload = (o = w, N = {}) => {
      const A = (vl, El, Se) =>
        Object.prototype.hasOwnProperty.call(N, vl)
          ? N[vl]
          : o && typeof o[vl] != "undefined" && o[vl] !== null && `${o[vl]}`.trim() !== ""
            ? o[vl]
            : El ?? Se;
      return {
        calc_mode:
          String(A("calc_mode", calcMode, "FACTOR")).toUpperCase() === "PERCENTAGE"
            ? "PERCENTAGE"
            : "FACTOR",
        factor_value: toNumber(A("factor_value", calcFactor, 1.5), 1.5).toFixed(4),
        tax_percentage: toNumber(A("tax_percentage", calcTaxes, 8), 8).toFixed(2),
        commission_percentage: toNumber(
          A("commission_percentage", calcCommission, 10),
          10,
        ).toFixed(2),
        exchange_rate: toNumber(
          A("exchange_rate", calcExchangeRate, 17.5),
          17.5,
        ).toFixed(4),
        discount_percentage: toNumber(
          A("discount_percentage", calcDiscount, 0),
          0,
        ).toFixed(2),
      };
    },
    mergeShoppingIntoState = (o, N) => {
      (zl((A) => A.map((vl) => (vl.id === o ? { ...vl, ...N } : vl))),
        Dl((A) => (A && A.id === o ? { ...A, ...N } : A)));
    },
    syncCalcStateFromShopping = (o) => {
      if (!o) return;
      const N = String(o.calc_mode || "FACTOR").toUpperCase();
      (N === "FACTOR" || N === "PERCENTAGE") && setCalcMode(N);
      setCalcFactor(toNumber(o.factor_value, 1.5));
      setCalcTaxes(toNumber(o.tax_percentage, 8));
      setCalcCommission(toNumber(o.commission_percentage, 10));
      setCalcExchangeRate(toNumber(o.exchange_rate, 17.5));
      setCalcDiscount(toNumber(o.discount_percentage, 0));
    },
    queueCurrentShoppingCalcPersist = (o = {}) => {
      if (!w || !w.id) return;
      const N = w.id,
        A = getShoppingCalcPayload(w),
        vl = getShoppingCalcPayload(w, o);
      if (JSON.stringify(A) === JSON.stringify(vl)) return;
      (mergeShoppingIntoState(N, vl),
        shoppingCalcPersistTimerRef.current &&
          clearTimeout(shoppingCalcPersistTimerRef.current),
        shoppingCalcPersistTimerRef.current = setTimeout(async () => {
          shoppingCalcPersistTimerRef.current = null;
          try {
            const El = await I(`/shoppings/${N}/`, {
              method: "PATCH",
              body: JSON.stringify(vl),
            });
            El && mergeShoppingIntoState(N, El);
          } catch (El) {
            console.error("Failed saving shopping calc settings", El);
            notifyError("No se pudo guardar la configuracion del shopping.");
            try {
              const Se = await I(`/shoppings/${N}/`);
              Se &&
                (mergeShoppingIntoState(N, Se),
                  activeMissionIdRef.current === N && syncCalcStateFromShopping(Se));
            } catch (Se) {
              console.error("Failed reloading shopping after calc save error", Se);
            }
          }
        }, 500));
    },
    applyCalcModeChange = (o) => {
      const N = String(o || "FACTOR").toUpperCase() === "PERCENTAGE"
        ? "PERCENTAGE"
        : "FACTOR";
      (setCalcMode(N), queueCurrentShoppingCalcPersist({ calc_mode: N }));
    },
    applyCalcFactorChange = (o) => {
      const N = parseFloat(o),
        A = Number.isFinite(N) ? N : 0;
      (setCalcFactor(A), queueCurrentShoppingCalcPersist({ factor_value: A }));
    },
    applyCalcDiscountChange = (o) => {
      const N = parseFloat(o),
        A = Number.isFinite(N) ? N : 0;
      (setCalcDiscount(A), queueCurrentShoppingCalcPersist({ discount_percentage: A }));
    },
    applyCalcTaxesChange = (o) => {
      const N = parseFloat(o),
        A = Number.isFinite(N) ? N : 0;
      (setCalcTaxes(A), queueCurrentShoppingCalcPersist({ tax_percentage: A }));
    },
    applyCalcCommissionChange = (o) => {
      const N = parseFloat(o),
        A = Number.isFinite(N) ? N : 0;
      (setCalcCommission(A),
        queueCurrentShoppingCalcPersist({ commission_percentage: A }));
    },
    applyCalcExchangeRateChange = (o) => {
      const N = parseFloat(o),
        A = Number.isFinite(N) ? N : 0;
      (setCalcExchangeRate(A), queueCurrentShoppingCalcPersist({ exchange_rate: A }));
    };
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
    buildClientPayload = ({
      name = "",
      status = "Pending",
      tags = "",
      phone_country_code = "+52",
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
    Na = async (o) => {
      if ((o.preventDefault(), !!Vl))
        try {
          const A = buildClientPayload({
            name: Vl,
            status: "Pending",
            tags: Nt,
            phone_country_code: clientPhoneCountryCode,
            phone: p,
            email: q,
            shipping_address: rl,
            shipping_addresses: clientShippingAddresses,
          });
          if (A.phone && A.phone.length !== 10) {
            notifyInfo("El telefono debe tener exactamente 10 numeros.");
            return;
          }
          const N = await I("/clients/", {
            method: "POST",
            body: JSON.stringify(A),
          });
          (_l([...Kl, N]),
            Yt(""),
            it(""),
            setClientPhoneCountryCode("+52"),
            z(""),
            sl(""),
            d(""),
            setClientShippingAddresses([]),
            k(!1));
        } catch (N) {
          notifyError((N && N.message) || "Error creating client");
        }
    },
    ja = async (o) => {
      if ((o.preventDefault(), !!ml.name))
        try {
          const Nl = buildClientPayload(ml);
          if (Nl.phone && Nl.phone.length !== 10) {
            notifyInfo("El telefono debe tener exactamente 10 numeros.");
            return;
          }
          const N = await I(`/clients/${O.id}/`, {
            method: "PATCH",
            body: JSON.stringify(Nl),
          });
          (_l(Kl.map((A) => (A.id === O.id ? N : A))), tl(!1), Y(null));
        } catch (N) {
          notifyError((N && N.message) || "Error updating client");
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
        payer: toFormUserId((w && w.payer) || (J && J.id)),
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
      const yl = parseInt(o.payer, 10);
      if (!Number.isInteger(yl) || yl <= 0) {
        notifyInfo("Selecciona quien pagara el shopping.");
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
              payer: yl,
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
              payer: yl,
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
        setClientGalleryMissionScopeMeta(null),
        setClientGalleryAllowsShoppingChoice(
          N === null || typeof N === "undefined" || String(N).trim() === "",
        ),
        et(o),
        jt("REVIEW"));
    },
    openClientShoppingGallery = (o, N = null) => {
      const A =
        N && typeof N == "object"
          ? Number(N.id || N.key || N.shopping || N.mission || 0)
          : Number(N || 0);
      (setClientGalleryMissionScopeId(A || null),
        setClientGalleryMissionScopeMeta(N && typeof N == "object" ? N : null),
        setClientGalleryAllowsShoppingChoice(!1),
        et(o),
        jt("ANNOTATED"));
    },
    Aa = () => {
      (et(null),
        setFullscreenImage(null),
        setClientGalleryAllowsShoppingChoice(!1),
        setClientGalleryMissionScopeMeta(null),
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
    // <-------- seccion 8: selector de imagen robusto y unificado para dispositivo/portapapeles
    dispatchImageSelection = (o, N = []) => {
      const A = Array.isArray(N) ? N.filter(Boolean) : [];
      A.length > 0 &&
        o &&
        o({ target: { files: A, value: "" } });
    },
    openDeviceImagePicker = (o, N = {}) => {
      const A = !!N.multiple,
        vl = String(N.accept || "image/*").trim() || "image/*";
      try {
        const El = document.createElement("input");
        (El.type = "file",
          El.accept = vl,
          El.multiple = A,
          El.style.position = "fixed",
          El.style.left = "-9999px",
          El.style.top = "-9999px",
          El.onchange = () => {
            const Se = Array.from(El.files || []);
            if (Se.length > 0) {
              // Use a stable File[] copy before removing the temporary input.
              dispatchImageSelection(o, Se);
            }
            El.remove();
          },
          document.body.appendChild(El),
          El.click());
      } catch (El) {
        (console.error("Failed opening image picker", El),
          notifyError("No se pudo abrir el selector de imagen."));
      }
    },
    openImageSourcePicker = (o, N = {}) => {
      const A = N.title || "Seleccionar imagen",
        vl = !!N.multiple;
      setImageSourceInfoOpen(null);
      setImageSourceDialog({
        title: A,
        description:
          N.description ||
          "Elige si quieres tomar la imagen del dispositivo o del portapapeles.",
        multiple: vl,
        accept: String(N.accept || "image/*").trim() || "image/*",
        eyebrow: N.eyebrow || "Fuente de imagen",
        deviceLabel: N.deviceLabel || "Elegir del dispositivo",
        deviceDescription:
          N.deviceDescription ||
          (vl
            ? "Abre tu galeria o archivos y selecciona una o varias imagenes."
            : "Abre tu galeria o archivos y selecciona una imagen."),
        clipboardLabel: N.clipboardLabel || "Usar portapapeles",
        clipboardDescription:
          N.clipboardDescription ||
          "Pega la imagen que ya copiaste y usala al instante sin buscar archivos.",
        onSelect: o,
      });
    },
    readClipboardImages = async (o = {}) => {
      if (
        !navigator.clipboard ||
        typeof navigator.clipboard.read != "function"
      )
        throw new Error("Clipboard image read is not supported in this browser.");
      const N = !!o.multiple,
        A = await navigator.clipboard.read(),
        vl = [];
      for (const El of A) {
        for (const Se of El.types || []) {
          if (!String(Se || "").startsWith("image/")) continue;
          const ea = await El.getType(Se),
            gl = Se.split("/")[1] || "png";
          vl.push(
            new File([ea], `clipboard-image-${Date.now()}-${vl.length + 1}.${gl}`, {
              type: Se,
              lastModified: Date.now(),
            }),
          );
          if (!N) return vl;
        }
      }
      return vl;
    },
    closeImageSourceDialog = () => {
      (setImageSourceDialog(null), setImageSourceInfoOpen(null));
    },
    pickImageFromDevice = () => {
      const o = imageSourceDialog;
      if (!o || !o.onSelect) return;
      (setImageSourceDialog(null), setImageSourceInfoOpen(null));
      openDeviceImagePicker(o.onSelect, {
        multiple: o.multiple,
        accept: o.accept,
      });
    },
    pickImageFromClipboard = async () => {
      const o = imageSourceDialog;
      if (!o || !o.onSelect) return;
      (setImageSourceDialog(null), setImageSourceInfoOpen(null));
      try {
        const N = await readClipboardImages({ multiple: o.multiple });
        if (!N.length) {
          notifyInfo("No se encontró ninguna imagen en el portapapeles.");
          return;
        }
        dispatchImageSelection(o.onSelect, N);
      } catch (N) {
        (console.error("Failed reading clipboard image", N),
          notifyError(
            "No se pudo leer una imagen del portapapeles. Verifica permisos o copia una imagen primero.",
          ));
      }
    },
    su = () => {
      if (receiptUploading) return;
      openImageSourcePicker(ru, { title: "Subir ticket" });
    },
    openMissionTicketPicker = () => {
      if (!w || missionTicketUploading) return;
      openImageSourcePicker(uploadMissionTicket, {
        title: "Subir ticket de shopping",
      });
    },
    fu = () => {
      if (newProductUploading) return;
      openImageSourcePicker(lt, { title: "Agregar producto" });
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
      (Ke(o), openImageSourcePicker(Xl, { title: "Cambiar foto" }));
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
    getShipmentEvidenceKind = (o = null) => {
      const N = String((o && o.media_type) || "").toUpperCase();
      if (N === "VIDEO" || N === "IMAGE") return N;
      const A = String((o && o.file) || "").toLowerCase();
      return /\.(mp4|mov|m4v|webm|ogg)$/i.test(A) ? "VIDEO" : "IMAGE";
    },
    prepareShipmentEvidenceFile = async (o) => {
      if (!o) return null;
      return String(o.type || "").toLowerCase().startsWith("image/")
        ? compressImage(o).catch(() => o)
        : o;
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
    getProductModalPriceMultiplier = () => {
      const o = Math.max(0, 1 - (parseFloat(calcDiscount) || 0) / 100);
      if (String(calcMode).toUpperCase() === "FACTOR")
        return (parseFloat(calcFactor) || 0) * o;
      return (
        o *
        (1 + (parseFloat(calcCommission) || 0) / 100) *
        (1 + (parseFloat(calcTaxes) || 0) / 100) *
        (parseFloat(calcExchangeRate) || 0)
      );
    },
    computeProductModalFinalPrice = (o) => {
      const N = parseFloat(o);
      const A = getProductModalPriceMultiplier();
      return Number.isFinite(N) && Number.isFinite(A) ? N * A : Number.NaN;
    },
    computeProductModalStorePrice = (o) => {
      const N = parseFloat(o);
      const A = getProductModalPriceMultiplier();
      return Number.isFinite(N) && Number.isFinite(A) && A > 0
        ? N / A
        : Number.NaN;
    },
    computeProductModalDiscountedPrice = (o) => {
      const N = parseFloat(o);
      const A = parseFloat(calcDiscount);
      return Number.isFinite(N) && Number.isFinite(A) && A > 0
        ? N * (1 - A / 100)
        : Number.NaN;
    },
    getProductModalPriceError = (o = null) => {
      const N = o || st;
      const A = String(N.real_price || "").trim();
      const vl = String(N.charged_price || "").trim();
      if (!A || !Number.isFinite(parseFloat(A)))
        return "Debes capturar un Store Price (USD) valido para guardar.";
      if (!vl || !Number.isFinite(parseFloat(vl)))
        return "Debes capturar un Final Price (MXN) valido para guardar.";
      return "";
    },
    getProductModalRequiredError = (o = null) => {
      const N = o || st;
      if (!String(N.name || "").trim())
        return "Debes capturar el nombre del producto para guardar.";
      if (
        productModalMode === "create" &&
        W &&
        clientGalleryAllowsShoppingChoice &&
        !String(N.shopping || "").trim()
      )
        return "Debes seleccionar la shopping para este producto.";
      if (!Number.isInteger(parseInt(N.payer, 10)) || parseInt(N.payer, 10) <= 0)
        return "Debes seleccionar quien pagara este producto.";
      return getProductModalPriceError(N);
    },
    openProductModal = (o, N = "edit", A = {}) => {
      const vlScopedShoppingId =
          clientGalleryMissionScopeId !== null &&
          typeof clientGalleryMissionScopeId !== "undefined" &&
          String(clientGalleryMissionScopeId).trim() !== ""
            ? Number(clientGalleryMissionScopeId)
            : null,
        vlScopedShopping =
          Number.isFinite(vlScopedShoppingId) && vlScopedShoppingId > 0
            ? clientGalleryScopeMission ||
              Al.find((qa) => Number(qa.id) === Number(vlScopedShoppingId)) ||
              null
            : null,
        vlContextShopping =
          !clientGalleryAllowsShoppingChoice && vlScopedShopping
            ? vlScopedShopping
            : w || null,
        vl = String(o && o.tags ? o.tags : "")
          .split(",")
          .map((Se) => Se.trim())
          .filter((Se) => Se.length > 0),
        El = (o && o.store) || ((vlContextShopping && vlContextShopping.store) || ""),
        SeRealPrice = formatProductPriceField((o && o.real_price) || ""),
        SeChargedPrice = formatProductPriceField((o && o.charged_price) || ""),
        computedFinalPrice = computeProductModalFinalPrice(SeRealPrice),
        computedFinalPriceText = Number.isFinite(computedFinalPrice)
          ? computedFinalPrice.toFixed(2)
          : "",
        SeShopping = toFormShoppingId(
          (o && o.shopping) ||
            (clientGalleryAllowsShoppingChoice
              ? ""
              : (vlScopedShoppingId !== null &&
              typeof vlScopedShoppingId !== "undefined" &&
              String(vlScopedShoppingId).trim() !== "")
              ? vlScopedShoppingId
              : (w && w.id) || ""),
        ),
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
            shopping: SeShopping,
            payer: toFormUserId(
              (o && o.payer) || (vlContextShopping && vlContextShopping.payer) || (J && J.id),
            ),
            tags: (o && o.tags) || "",
            store: El,
            status: Se,
          }),
        ),
        setModalTags(vl),
        setNewModalTag(""),
        setProductModalShoppingSearch(""),
        setStoreSearch(""),
        setShowAddStoreInput(!1),
        setNewStoreName(""),
        setPendingProductFile(A.file || null),
        setProductPriceAutoInfoOpen(!1),
        setProductPriceAutoSync(!ea),
        setProductPriceSyncSource(ea ? "charged" : "real"),
        setProductModalMode(N),
        ut(!0));
    },
    closeProductModal = (o = !1) => {
      if (newProductUploading && !o) return;
      (ut(!1),
        Ke(null),
        Gt(createEmptyProductForm()),
        setProductModalMode("edit"),
        setPendingProductFile(null),
        setProductPriceAutoInfoOpen(!1),
        setProductPriceAutoSync(!0),
        setProductPriceSyncSource("real"),
        setModalTags([]),
        setNewModalTag(""),
        setProductModalShoppingSearch(""),
        setStoreSearch(""),
        setShowAddStoreInput(!1),
        setNewStoreName(""));
    },
    lt = async (o) => {
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = N[0],
        vl = getDraftProductFlowState(wl, X),
        ElScopedShoppingId =
          !clientGalleryAllowsShoppingChoice &&
          clientGalleryMissionScopeId !== null &&
          typeof clientGalleryMissionScopeId !== "undefined" &&
          String(clientGalleryMissionScopeId).trim() !== ""
            ? Number(clientGalleryMissionScopeId)
            : null,
        ElScopedShopping =
          Number.isFinite(ElScopedShoppingId) && ElScopedShoppingId > 0
            ? clientGalleryScopeMission ||
              Al.find((Se) => Number(Se.id) === Number(ElScopedShoppingId)) ||
              null
            : null,
        ElContextShopping = ElScopedShopping || w || null,
        Se = (ElContextShopping && ElContextShopping.store) || "";
      openProductModal(
        createEmptyProductForm({
          shopping:
            Number.isFinite(ElScopedShoppingId) && ElScopedShoppingId > 0
              ? String(ElScopedShoppingId)
              : "",
          store: Se,
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
    setShipmentProductStatusQuick = async (o, N) => {
      if (!o || !N || productStatusUpdatingId === o) return;
      setProductStatusUpdatingId(o);
      try {
        await I(`/products/${o}/`, {
          method: "PATCH",
          body: JSON.stringify({ status: N }),
        });
        await refreshCoreData();
        await refreshSelectedClient();
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Status del producto actualizado.");
      } catch (A) {
        console.error("Failed updating shipment product status", A);
        notifyError((A && A.message) || "No se pudo cambiar el status del producto.");
      } finally {
        setProductStatusUpdatingId(null);
      }
    },
    setGalleryProductStatus = async (o, N = null, A) => {
      if (!o || !A || productStatusUpdatingId === o.id) return;
      setProductStatusUpdatingId(o.id);
      try {
        (await syncProductReviewState(o, N, A),
          await refreshProductReviews(W && W.id),
          await Qt(),
          setOpenProductStatusId(null));
      } catch (El) {
        (console.error("Failed updating gallery product status", El),
          notifyError("No se pudo cambiar el status."));
      } finally {
        setProductStatusUpdatingId(null);
      }
    },
    hn = (o) => {
      openProductModal(o, "edit");
    },
    buildProductModalPayload = () => {
      const o = computeProductModalFinalPrice(st.real_price),
        N = Number.isFinite(o) ? o.toFixed(2) : "",
        AScopedShoppingId =
          productModalMode === "create" &&
          W &&
          !clientGalleryAllowsShoppingChoice &&
          clientGalleryMissionScopeId !== null &&
          typeof clientGalleryMissionScopeId !== "undefined" &&
          String(clientGalleryMissionScopeId).trim() !== ""
            ? parseInt(clientGalleryMissionScopeId, 10)
            : null,
        A = (gl) => {
          if (gl === null || typeof gl === "undefined" || String(gl).trim() === "")
            return null;
          const ae = parseFloat(gl);
          return Number.isFinite(ae) ? ae.toFixed(2) : null;
        };
      const vlResolvedShoppingId = (() => {
        const gl = parseInt(st.shopping, 10);
        if (Number.isInteger(gl) && gl > 0) return gl;
        if (Number.isInteger(AScopedShoppingId) && AScopedShoppingId > 0)
          return AScopedShoppingId;
        return null;
      })();
      return {
        payload: {
          ...st,
          name: String(st.name || "").trim(),
          tags: modalTags.join(", "),
          shopping: vlResolvedShoppingId,
          store: vlResolvedShoppingId ? null : st.store ? Number(st.store) : null,
          status: normalizeProductModalStatus(st.status),
          payer: (() => {
            const gl = parseInt(st.payer, 10);
            return Number.isInteger(gl) && gl > 0 ? gl : null;
          })(),
          real_price: A(st.real_price),
          charged_price: A(st.charged_price) || N,
        },
        reviewState: st.status,
      };
    },
    zi = async (o) => {
      o.preventDefault();
      if (!he) return;
      const { payload: N, reviewState: A } = buildProductModalPayload(),
        vl = productModalMode === "create";
      const El = getProductModalRequiredError(N);
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
          const glScopedShoppingId =
            productModalMode === "create" &&
            W &&
            !clientGalleryAllowsShoppingChoice &&
            clientGalleryMissionScopeId !== null &&
            typeof clientGalleryMissionScopeId !== "undefined" &&
            String(clientGalleryMissionScopeId).trim() !== ""
              ? parseInt(clientGalleryMissionScopeId, 10)
              : null;
          Se.append("image", ea);
          Se.append("client", W.id);
          Se.append("name", N.name);
          Se.append("status", N.status);
          Se.append("purchase_date", new Date().toISOString().slice(0, 10));
          N.shopping !== null
            ? Se.append("shopping", String(N.shopping))
            : Number.isInteger(glScopedShoppingId) && glScopedShoppingId > 0
              ? Se.append("shopping", String(glScopedShoppingId))
            : w && w.id && Se.append("shopping", w.id);
          N.payer !== null && Se.append("payer", String(N.payer));
          N.real_price !== null && Se.append("real_price", N.real_price);
          N.charged_price !== null && Se.append("charged_price", N.charged_price);
          N.tags && Se.append("tags", N.tags);
          !N.shopping && N.store !== null && Se.append("store", String(N.store));
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
    getBreakdownBaseAmount = (o) => {
      const N = toNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(N)) return N;
      const A = toNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(A) ? A : 0;
    },
    resolveBreakdownShopping = (o = null) =>
      o && typeof o === "object"
        ? o
        : Al.find((N) => Number(N && N.id) === Number(o)) || null,
    formatBreakdownPercent = (o) => {
      const N = toNumber(o, Number.NaN);
      return Number.isFinite(N) ? `${N}` : "";
    },
    isBreakdownTemplateTruthy = (o) => {
      if (typeof o == "number") return Number.isFinite(o) && Math.abs(o) > 1e-9;
      if (typeof o == "boolean") return o;
      if (Array.isArray(o)) return o.length > 0;
      return !!String(o || "").trim();
    },
    renderBreakdownTemplate = (o, N = {}, A = {}) => {
      let vl = String(o || "");
      return (
        (vl = vl.replace(
          /\{\{if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
          (El, Se, ea) => (isBreakdownTemplateTruthy(A[Se]) ? ea : ""),
        )),
        Object.entries(N).forEach(([El, Se]) => {
          vl = vl.replaceAll(`{${El}}`, Se == null ? "" : String(Se));
        }),
        vl
      );
    },
    buildBreakdownMessage = ({
      title = "DESGLOSE DE TU CUENTA:",
      items = [],
      itemsText = "",
      total = 0,
      subtotal = null,
      discountPercentage = 0,
      discountAmount = null,
      itemBullet = "*",
      shoppingName = "",
      clientName = "",
      storeName = "",
      factorValue = "",
      calcMode = "",
      exchangeRate = "",
      taxPercentage = "",
      commissionPercentage = "",
      itemsCount = null,
    }) => {
      const o = new Intl.NumberFormat("es-MX"),
        N =
          itemsText ||
          (items.length > 0
            ? items
                .map((A) => `${itemBullet} ${A.name} – $${o.format(A.finalPrice)}`)
                .join("\n")
            : "Sin productos."),
        A = Number.isFinite(itemsCount) ? itemsCount : items.length,
        vl = {
          title,
          items: N,
          total: o.format(total),
          subtotal: o.format(Number.isFinite(subtotal) ? subtotal : total),
          discount_percentage: formatBreakdownPercent(discountPercentage),
          discount_amount: o.format(
            Number.isFinite(discountAmount) ? discountAmount : 0,
          ),
          items_count: String(A),
          shopping_name: shoppingName || "",
          client_name: clientName || "",
          store_name: storeName || "",
          factor_value: factorValue == null ? "" : String(factorValue),
          calc_mode: calcMode || "",
          exchange_rate: exchangeRate == null ? "" : String(exchangeRate),
          tax_percentage:
            taxPercentage == null ? "" : String(taxPercentage),
          commission_percentage:
            commissionPercentage == null ? "" : String(commissionPercentage),
        },
        El = {
          ...vl,
          items: items.length > 0 ? items : N,
          total,
          subtotal: Number.isFinite(subtotal) ? subtotal : total,
          discount_percentage: toNumber(discountPercentage, 0),
          discount_amount: Number.isFinite(discountAmount) ? discountAmount : 0,
          items_count: A,
        };
      return renderBreakdownTemplate(
        defaultBreakdownTemplate || DEFAULT_BREAKDOWN_TEMPLATE,
        vl,
        El,
      );
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
      const A = resolveBreakdownShopping(o),
        vl = paymentLocalShoppingDiscount(A || o),
        El = ((N && N.products) || []).filter(
          (ea) => Number(ea && ea.shopping) === Number(A && A.id || o && o.id),
        ),
        Se = El.map((ea) => ({
          name: ea.name,
          basePrice: getBreakdownBaseAmount(ea),
          finalPrice: getProductPaymentAmount(ea, vl),
        })),
        gl = Se.reduce((ea, oi) => ea + oi.basePrice, 0),
        ae = Se.reduce((ea, oi) => ea + oi.finalPrice, 0),
        oi = buildBreakdownMessage({
          items: Se,
          total: ae,
          subtotal: gl,
          discountPercentage: vl,
          discountAmount: Math.max(0, gl - ae),
          shoppingName: String((A && (A.store_name || A.name)) || "").trim(),
          clientName: String((N && N.name) || "").trim(),
          storeName: String((A && (A.store_name || A.name)) || "").trim(),
          factorValue: A && A.factor_value,
          calcMode: A && A.calc_mode,
          exchangeRate: A && A.exchange_rate,
          taxPercentage: A && A.tax_percentage,
          commissionPercentage: A && A.commission_percentage,
          itemsCount: Se.length,
        });
      try {
        await navigator.clipboard.writeText(oi);
      } catch (Nn) {
        console.error("Failed to copy shopping breakdown", Nn);
      }
    },
    copyAnnotatedMissionBreakdown = async (o, N) => {
      const A = resolveBreakdownShopping(o),
        vl = paymentLocalShoppingDiscount(A || o),
        El = ((N && N.products) || []).filter((ea) => {
          const gl = String(ea.status || "").toUpperCase();
          return Number(ea.shopping) === Number(A && A.id || o && o.id) && gl === "ANNOTATED";
        }),
        Se = El.map((ea) => ({
          name: ea.name,
          basePrice: getBreakdownBaseAmount(ea),
          finalPrice: getProductPaymentAmount(ea, vl),
        })),
        gl = Se.reduce((ea, oi) => ea + oi.basePrice, 0),
        ae = Se.reduce((ea, oi) => ea + oi.finalPrice, 0),
        oi = buildBreakdownMessage({
          items: Se,
          total: ae,
          subtotal: gl,
          discountPercentage: vl,
          discountAmount: Math.max(0, gl - ae),
          shoppingName: String((A && (A.store_name || A.name)) || "").trim(),
          clientName: String((N && N.name) || "").trim(),
          storeName: String((A && (A.store_name || A.name)) || "").trim(),
          factorValue: A && A.factor_value,
          calcMode: A && A.calc_mode,
          exchangeRate: A && A.exchange_rate,
          taxPercentage: A && A.tax_percentage,
          commissionPercentage: A && A.commission_percentage,
          itemsCount: Se.length,
        });
      try {
        await navigator.clipboard.writeText(oi);
        const Nn = `home-${o.id}-${N.id}`;
        setCopiedMissionClients((ae) =>
          ae.includes(Nn) ? ae : [...ae, Nn],
        );
      } catch (Nn) {
        console.error("Failed to copy annotated shopping breakdown", Nn);
      }
    },
    copyMissionClientsBreakdown = async (o, N = []) => {
      if (!o) return;
      const A = resolveBreakdownShopping(o),
        vl = paymentLocalShoppingDiscount(A || o),
        El = new Intl.NumberFormat("es-MX"),
        Se = N.map((ea) => {
          const gl = ((ea && ea.products) || []).filter((oi) => {
              const Nn = String(oi.status || "").toUpperCase();
              return Number(oi.shopping) === Number(A && A.id || o.id) && Nn === "ANNOTATED";
            }),
            oi = gl.map((Nn) => ({
              name: Nn.name,
              basePrice: getBreakdownBaseAmount(Nn),
              finalPrice: getProductPaymentAmount(Nn, vl),
            })),
            Nn = oi.reduce((Ta, qa) => Ta + qa.basePrice, 0),
            Ta = oi.reduce((qa, za) => qa + za.finalPrice, 0);
          return {
            name: ea.name,
            items: oi,
            subtotal: Nn,
            total: Ta,
          };
        }).filter((ea) => ea.items.length > 0);
      if (Se.length === 0) {
        notifyInfo("No hay productos anotados para copiar en esta misión.");
        return;
      }
      const gl = Se.reduce((ea, oi) => ea + oi.subtotal, 0),
        ae = Se.reduce((ea, oi) => ea + oi.total, 0),
        oi = Se.reduce((ea, Nn) => ea + Nn.items.length, 0),
        Nn = buildBreakdownMessage({
          title: "DESGLOSE DE LA MISION:",
          itemsText: Se
            .map(
              (Ta) =>
                `${Ta.name}:\n` +
                Ta.items
                  .map((qa) => `* ${qa.name} – $${El.format(qa.finalPrice)}`)
                  .join("\n") +
                `\nTOTAL CLIENTE: $${El.format(Ta.total)}`,
            )
            .join("\n\n"),
          total: ae,
          subtotal: gl,
          discountPercentage: vl,
          discountAmount: Math.max(0, gl - ae),
          shoppingName: String((A && (A.store_name || A.name)) || "").trim(),
          storeName: String((A && (A.store_name || A.name)) || "").trim(),
          factorValue: A && A.factor_value,
          calcMode: A && A.calc_mode,
          exchangeRate: A && A.exchange_rate,
          taxPercentage: A && A.tax_percentage,
          commissionPercentage: A && A.commission_percentage,
          itemsCount: oi,
        });
      try {
        await navigator.clipboard.writeText(Nn);
      } catch (Ta) {
        console.error("Failed to copy clients shopping breakdown", Ta);
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
    copyClientShipmentHistoryLink = async (o) => {
      if (!o || !o.id || !o.client) return;
      try {
        const N = await generateClientHistoryShareLink({ id: o.client }),
          A = new URL(N.share_url, window.location.origin);
        A.searchParams.set("focus_shipment_id", String(o.id));
        await navigator.clipboard.writeText(A.toString());
        const vl = `shipment-client-history-share-${o.id}`;
        setCopiedClientShareLinks((El) =>
          El.includes(vl) ? El : [...El, vl],
        );
        notifySuccess("Link copiado.");
      } catch (N) {
        console.error("Failed to copy client shipment history link", N);
        notifyError(
          (N && N.message) || "No se pudo generar el link del cliente.",
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
    saveHomeDesktopLayout = async (o) => {
      if (!J) return;
      const N = normalizeHomeDesktopLayout(o),
        A = normalizeHomeDesktopLayout(J && J.profile && J.profile.home_layout);
      if (
        N.left_width_percent === A.left_width_percent &&
        N.top_height === A.top_height
      )
        return;
      try {
        const vl = await I("/auth/me/", {
          method: "PATCH",
          body: JSON.stringify({ home_layout: N }),
        });
        vl &&
          (b(vl),
            setHomeDesktopLayout(
              normalizeHomeDesktopLayout(vl.profile && vl.profile.home_layout),
            ));
      } catch (vl) {
        console.error("Failed saving home desktop layout", vl);
        setHomeDesktopLayout(A);
        notifyError("No se pudo guardar el tamano de Home en tu perfil.");
      }
    },
    stopHomeDesktopResize = (o = !0) => {
      const N = homeDesktopResizeRef.current;
      if (!N) return;
      document.removeEventListener("mousemove", N.handleMove);
      document.removeEventListener("mouseup", N.handleUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      homeDesktopResizeRef.current = null;
      o && saveHomeDesktopLayout(homeDesktopLayoutRef.current);
    },
    startHomeDesktopResize = (o) => (N) => {
      if (!isDesktopLayout) return;
      const A = homeDesktopGridRef.current;
      if (!A) return;
      N.preventDefault();
      const vl = A.getBoundingClientRect(),
        El = {
          type: o,
          rect: vl,
        },
        Se = (ea) => {
          if (El.type === "column") {
            const gl = ((ea.clientX - El.rect.left) / El.rect.width) * 100;
            setHomeDesktopLayout((ae) => {
              const yl = {
                ...ae,
                left_width_percent: Math.round(clampNumber(gl, 44, 72)),
              };
              homeDesktopLayoutRef.current = yl;
              return yl;
            });
            return;
          }
          const gl = ea.clientY - El.rect.top;
          setHomeDesktopLayout((ae) => {
            const yl = {
              ...ae,
              top_height: Math.round(clampNumber(gl, 188, 360)),
            };
            homeDesktopLayoutRef.current = yl;
            return yl;
          });
        },
        ea = () => stopHomeDesktopResize();
      homeDesktopResizeRef.current = {
        ...El,
        handleMove: Se,
        handleUp: ea,
      };
      document.addEventListener("mousemove", Se);
      document.addEventListener("mouseup", ea);
      document.body.style.userSelect = "none";
      document.body.style.cursor = o === "column" ? "col-resize" : "row-resize";
    },
    getShipmentClientProducts = (o = null) => {
      const N = Kl.find((A) => Number(A.id) === Number(o || 0));
      if (!N) return [];
      return ((N && N.products) || []).map((A) => ({
        ...A,
        client_name: N.name,
        shipping_address:
          A.shipping_address || N.shipping_address || "",
      }));
    },
    getShipmentProductPickerState = (o = null, N = null, A = null) => {
      const vl = Array.isArray(A) ? A : getShipmentClientProducts(o);
      const El = new Map(
        (Al || []).map((qa) => [
          Number(qa.id),
          String(qa.status || "").toUpperCase(),
        ]),
      );
      const Se = Number(N || 0);
      const ea = {
        totalEligible: 0,
        totalHidden: 0,
        hiddenByStatus: 0,
        hiddenByOpenShopping: 0,
        hiddenByOtherShipment: 0,
      };
      const gl = [];
      for (const qa of vl) {
        const yo = String(qa.status || "").toUpperCase();
        if (!["ANNOTATED", "BOUGHT", "SHIPPED"].includes(yo)) {
          ea.hiddenByStatus += 1;
          continue;
        }
        const el = Number(qa.shopping || qa.mission || qa.mission_id || 0);
        if (el && El.get(el) !== "COMPLETED") {
          ea.hiddenByOpenShopping += 1;
          continue;
        }
        const tn = Number((((qa || {}).shipment || {}).id) || 0);
        if (tn && tn !== Se) {
          ea.hiddenByOtherShipment += 1;
          continue;
        }
        gl.push(qa);
      }
      ea.totalEligible = gl.length;
      ea.totalHidden =
        ea.hiddenByStatus +
        ea.hiddenByOpenShopping +
        ea.hiddenByOtherShipment;
      return {
        products: gl.sort((qa, yo) => {
          const el = String(
            qa.shopping_name || qa.mission_name || qa.store_name || "",
          ).localeCompare(
            String(
              yo.shopping_name || yo.mission_name || yo.store_name || "",
            ),
          );
          if (el !== 0) return el;
          return String(qa.name || "").localeCompare(String(yo.name || ""));
        }),
        hiddenSummary: ea,
      };
    },
    formatShipmentHiddenProductsMessage = (o = null) => {
      if (!o || !o.totalHidden) return "";
      const N = [];
      o.hiddenByOpenShopping &&
        N.push(`${o.hiddenByOpenShopping} por shopping abierta`);
      o.hiddenByOtherShipment &&
        N.push(`${o.hiddenByOtherShipment} en otro envio`);
      o.hiddenByStatus &&
        N.push(`${o.hiddenByStatus} por status no elegible`);
      return N.length ? `Ocultos: ${N.join(", ")}.` : "";
    },
    getClientShipmentAddressOptions = (o = "") => {
      const N = Kl.find((A) => String(A.id) === String(o || ""));
      if (!N) return [];
      const A = [];
      const vl = new Set();
      const El = (Se) => {
        const qa = String(Se || "").trim();
        if (!qa) return;
        const yo = qa.toLowerCase();
        if (vl.has(yo)) return;
        vl.add(yo);
        A.push(qa);
      };
      El(N.shipping_address);
      (Array.isArray(N.shipping_addresses) ? N.shipping_addresses : []).forEach(El);
      return A;
    },
    getShipmentFormState = (o = null, N = null) => {
      const A = String((N && N.client) || (o && o.client) || ((Kl[0] || {}).id || ""));
      const Se =
        (o && (o.products_detail || o.products)) || (N && N.id ? [N] : []);
      const vl =
          o && o.guide_price !== null && typeof o.guide_price != "undefined"
            ? String(o.guide_price)
            : o && o.client_price !== null && typeof o.client_price != "undefined"
              ? String(o.client_price)
              : "",
        El =
          o && o.client_price !== null && typeof o.client_price != "undefined"
            ? String(o.client_price)
            : o && o.guide_price !== null && typeof o.guide_price != "undefined"
              ? String(o.guide_price)
              : "";
      return {
        id: (o && o.id) || null,
        client: A,
        carrier: String((o && o.carrier) || "").trim(),
        status: normalizeShipmentStatusValue((o && o.status) || "PENDING"),
        tracking_number: (o && o.tracking_number) || "",
        guide_price: vl,
        client_price: El,
        shipping_address:
          (o && o.shipping_address) ||
          getClientShipmentAddressOptions(A)[0] ||
          ((N && (N.shipping_address || "")) || ""),
        product_ids: Se.map((qa) =>
            Number(typeof qa == "object" ? qa.id : qa),
          ),
        initial_product_ids: Se.map((qa) =>
            Number(typeof qa == "object" ? qa.id : qa),
          ),
      };
    },
    loadShipmentForm = (o = null, N = null) => {
      setShipmentForm(getShipmentFormState(o, N));
      setShipmentClientPickerOpen(!1);
      setShipmentClientSearch("");
      setShipmentProductSearch("");
      setShipmentProductPickerOpen(!1);
    },
    isShipmentExpanded = (o) =>
      (expandedShipmentIds || []).includes(Number((o && o.id) || o || 0)),
    toggleExpandedShipment = (o) => {
      if (!o) return;
      const N = Number(o.id);
      if (isShipmentExpanded(N)) {
        setExpandedShipmentIds((A) =>
          (A || []).filter((vl) => Number(vl) !== N),
        );
        return;
      }
      loadShipmentForm(o);
      setExpandedShipmentIds((A) => [...new Set([...(A || []), N])]);
    },
    resetExpandedShipmentForm = (o) => {
      if (!o) return;
      loadShipmentForm(o);
    },
    openShipmentEditor = (o = null, N = null) => {
      if (!Kl.length) {
        notifyInfo("Necesitas al menos un cliente para crear envios.");
        return;
      }
      loadShipmentForm(o, N);
      setShipmentModalOpen(!0);
    },
    updateShipmentForm = (o, N) => {
      setShipmentForm((A) => {
        const vl = { ...A, [o]: N };
        if (o === "client" && String(A.client || "") !== String(N || "")) {
          const El = getClientShipmentAddressOptions(N);
          vl.product_ids = [];
          vl.shipping_address = El[0] || "";
        }
        return vl;
      });
    },
    selectShipmentClient = (o) => {
      updateShipmentForm("client", String(o || ""));
      setShipmentClientPickerOpen(!1);
      setShipmentClientSearch("");
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
        String(shipmentForm.guide_price || "").trim() === ""
          ? null
          : String(shipmentForm.guide_price || "").trim();
      const vl =
        String(shipmentForm.client_price || "").trim() === ""
          ? null
          : String(shipmentForm.client_price || "").trim();
      if (!o) {
        notifyInfo("Selecciona un cliente.");
        return;
      }
      if (!(shipmentForm.product_ids || []).length) {
        notifyInfo("Selecciona al menos un producto.");
        return;
      }
      const qa = getShipmentProductPickerState(o.id, shipmentForm.id);
      const shipmentProductsById = new Map(
        qa.products.map((El) => [Number(El.id), El]),
      );
      const invalidShipmentSelection = (shipmentForm.product_ids || []).some(
        (El) => !shipmentProductsById.has(Number(El)),
      );
      if (invalidShipmentSelection) {
        notifyInfo(
          "Solo puedes enviar productos de shoppings cerradas y que no pertenezcan a otro envio. Quita los demas productos para guardar.",
        );
        return;
      }
      const sameShipmentProductSelection =
        [...(shipmentForm.product_ids || [])]
          .map((El) => Number(El))
          .sort((El, Se) => El - Se)
          .join(",") ===
        [...(shipmentForm.initial_product_ids || [])]
          .map((El) => Number(El))
          .sort((El, Se) => El - Se)
          .join(",");
      setShipmentSaving(!0);
      try {
        const El = await I(
          shipmentForm.id ? `/shipments/${shipmentForm.id}/` : "/shipments/",
          {
            method: shipmentForm.id ? "PATCH" : "POST",
            body: JSON.stringify({
              client: o.id,
              carrier: N,
              status: normalizeShipmentStatusValue(shipmentForm.status || "PENDING"),
              tracking_number: String(
                shipmentForm.tracking_number || "",
              ).trim(),
              guide_price: A,
              client_price: vl,
              shipping_address: String(
                shipmentForm.shipping_address || "",
              ).trim(),
            }),
          },
        );
        const Se = sameShipmentProductSelection
          ? El
          : await I(`/shipments/${El.id}/set-products/`, {
              method: "POST",
              body: JSON.stringify({
                products: (shipmentForm.product_ids || []).map((vl) => Number(vl)),
              }),
            });
        const ea = Se || El;
        setShipmentModalOpen(!1);
        setShipmentProductPickerOpen(!1);
        setPublicExpandedShipmentId(Number(El.id));
        setExpandedShipmentIds((gl) => [
          ...new Set([...(gl || []), Number(El.id)]),
        ]);
        upsertShipmentListItem(ea);
        setShipmentForm(getShipmentFormState(ea));
        notifySuccess(shipmentForm.id ? "Envio actualizado." : "Envio creado.");
        queueCoreRefresh(260);
        queueSelectedClientRefresh(320);
        publicClientShareToken &&
          reloadPublicShareData().catch((gl) => {
            console.error("Failed refreshing public share after saving shipment", gl);
          });
      } catch (El) {
        console.error("Failed saving shipment", El);
        notifyError((El && El.message) || "No se pudo guardar el envio.");
      } finally {
        setShipmentSaving(!1);
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
        queueCoreRefresh(120);
        queueSelectedClientRefresh(180);
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
        setShipments((A) => (A || []).filter((vl) => Number(vl.id) !== Number(o.id)));
        setExpandedShipmentIds((A) =>
          (A || []).filter((vl) => Number(vl) !== Number(o.id)),
        );
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        notifySuccess("Envio eliminado.");
      } catch (A) {
        console.error("Failed deleting shipment", A);
        notifyError((A && A.message) || "No se pudo eliminar el envio.");
      }
    },
    openShipmentEvidencePicker = (o) => {
      if (!o || !o.id) return;
      openImageSourcePicker(
        (N) => {
          const A = N && N.target && N.target.files;
          A && A.length > 0 && uploadShipmentEvidence(o, A);
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
    uploadShipmentEvidence = async (o, N) => {
      if (!o || !o.id || !N || !N.length) return;
      setShipmentEvidenceUploadingId(o.id);
      setOpenShipmentEvidenceMenuId(null);
      try {
        const A = new FormData();
        for (const vl of Array.from(N)) {
          const El = await prepareShipmentEvidenceFile(vl);
          El && A.append("files", El);
        }
        await I(`/shipments/${o.id}/upload-evidence/`, {
          method: "POST",
          body: A,
        });
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Evidencia agregada.");
      } catch (A) {
        console.error("Failed uploading shipment evidence", A);
        notifyError((A && A.message) || "No se pudo subir la evidencia.");
      } finally {
        setShipmentEvidenceUploadingId(null);
      }
    },
    openShipmentEvidenceReplacePicker = (o, N) => {
      if (!o || !o.id || !N || !N.id) return;
      setOpenShipmentEvidenceMenuId(null);
      openImageSourcePicker(
        (A) => {
          const vl = A && A.target && A.target.files;
          vl && vl.length > 0 && replaceShipmentEvidence(o, N, vl[0]);
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
    replaceShipmentEvidence = async (o, N, A) => {
      if (!o || !o.id || !N || !N.id || !A) return;
      setShipmentEvidenceReplacingId(N.id);
      try {
        const vl = new FormData(),
          El = await prepareShipmentEvidenceFile(A);
        if (!El) {
          notifyError("No se pudo preparar el archivo de evidencia.");
          return;
        }
        vl.append("file", El);
        await I(`/shipments/${o.id}/evidence/${N.id}/replace/`, {
          method: "POST",
          body: vl,
        });
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Evidencia actualizada.");
      } catch (vl) {
        console.error("Failed replacing shipment evidence", vl);
        notifyError((vl && vl.message) || "No se pudo cambiar la evidencia.");
      } finally {
        setShipmentEvidenceReplacingId(null);
      }
    },
    deleteShipmentEvidence = async (o, N) => {
      if (!o || !o.id || !N) return;
      const A = await confirmAction({
        title: "Eliminar evidencia",
        message: "Este archivo ya no se mostrara al cliente.",
        confirmLabel: "Eliminar",
        cancelLabel: "Cancelar",
        tone: "danger",
      });
      if (!A) return;
      setOpenShipmentEvidenceMenuId(null);
      setShipmentEvidenceDeletingId(N);
      try {
        await I(`/shipments/${o.id}/evidence/${N}/`, {
          method: "DELETE",
        });
        queueCoreRefresh(180);
        queueSelectedClientRefresh(240);
        publicClientShareToken && (await reloadPublicShareData());
        notifySuccess("Evidencia eliminada.");
      } catch (vl) {
        console.error("Failed deleting shipment evidence", vl);
        notifyError((vl && vl.message) || "No se pudo eliminar la evidencia.");
      } finally {
        setShipmentEvidenceDeletingId(null);
      }
    },
    shipmentModalClient = Kl.find(
      (o) => String(o.id) === String(shipmentForm.client || ""),
    ),
    filteredShipmentClients = Kl.filter((o) => {
      const N = String(shipmentClientSearch || "").trim().toLowerCase();
      return !N || String(o.name || "").toLowerCase().includes(N);
    }),
    shipmentModalClientProducts = getShipmentClientProducts(
      shipmentForm.client,
    ),
    shipmentModalProductState = shipmentProductPickerOpen
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
    shipmentModalProducts = shipmentModalProductState.products,
    shipmentHiddenProductsMessage = formatShipmentHiddenProductsMessage(
      shipmentModalProductState.hiddenSummary,
    ),
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
    shipmentSelectedProducts = (() => {
      const o = new Map();
      shipmentModalClientProducts.forEach((N) => {
        o.set(Number(N.id), N);
      });
      const N = shipments.find(
        (A) => Number(A.id) === Number(shipmentForm.id || 0),
      );
      ((N && (N.products_detail || [])) || []).forEach((A) => {
        const vl = Number(A.id);
        o.has(vl) || o.set(vl, A);
      });
      return (shipmentForm.product_ids || [])
        .map((A) => o.get(Number(A)))
        .filter(Boolean);
    })(),
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
    paymentLocalShoppingDiscount = (o = null) => {
      const N =
        o && typeof o === "object"
          ? o
          : Al.find((A) => Number(A && A.id) === Number(o)) || null;
      return Math.max(paymentLocalToNumber(N && N.discount_percentage, 0), 0);
    },
    paymentLocalProductAmount = (o, N = null) => {
      const A =
          N === null
            ? paymentLocalShoppingDiscount((o && (o.shopping || o.mission)) || null)
            : N,
        vl = Math.max(0, 1 - paymentLocalToNumber(A, 0) / 100),
        El = paymentLocalToNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(El)) return El * vl;
      const Se = paymentLocalToNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(Se) ? Se : 0;
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
    paymentLocalProductsTotal = (o = [], N = 0) =>
      (o || []).reduce((A, vl) => A + paymentLocalProductAmount(vl, N), 0),
    paymentLocalRecordProducts = (o = null) =>
      (o && (o.products_detail || [])) || [],
    paymentLocalRecordShoppingId = (o = null) =>
      Number((o && (o.shopping || o.mission)) || 0),
    paymentLocalRecordAmount = (o = null) =>
      paymentLocalToNumber(o && o.amount, 0),
    paymentLocalRecordEntries = (o = null) =>
      [...((o && o.entries) || [])].sort(
        (N, A) =>
          new Date(A.created_at || 0).getTime() -
          new Date(N.created_at || 0).getTime(),
      ),
    paymentLocalRecordProductsTotal = (o = null) =>
      paymentLocalProductsTotal(
        paymentLocalRecordProducts(o),
        paymentLocalShoppingDiscount(paymentLocalRecordShoppingId(o)),
      ),
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
    paymentModalDiscountPercent = paymentLocalShoppingDiscount(
      paymentModalShopping || paymentForm.shopping,
    ),
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
    paymentCurrentRecord = paymentModalClient && paymentForm.shopping
      ? paymentLocalShoppingPayments(paymentModalClient, paymentForm.shopping).find(
        (o) => Number(o.id) === Number(paymentForm.id || 0),
      ) || null
      : null,
    paymentHistoryEntries = paymentLocalRecordEntries(paymentCurrentRecord),
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
    paymentSelectedProductsTotal = paymentLocalProductsTotal(
      paymentSelectedProducts,
      paymentModalDiscountPercent,
    ),
    paymentCurrentAmountValue = paymentLocalRecordAmount(paymentCurrentRecord),
    paymentDraftAmountValue = paymentLocalToNumber(paymentForm.amount, 0),
    paymentPreviewAmountValue = paymentForm.id
      ? paymentCurrentAmountValue + paymentDraftAmountValue
      : paymentDraftAmountValue,
    paymentSuggestedEntryAmount = paymentForm.id
      ? Math.max(paymentSelectedProductsTotal - paymentCurrentAmountValue, 0)
      : paymentSelectedProductsTotal,
    paymentFormBalance = paymentSelectedProductsTotal - paymentPreviewAmountValue,
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
          : [],
        gl = paymentLocalShoppingProducts(o, vl, ea),
        ae = gl.map((oi) => Number(oi.id)),
        oi = paymentLocalProductsTotal(gl, paymentLocalShoppingDiscount(vl)),
        Pi = oi > 0 ? oi.toFixed(2) : "",
        bi = paymentLocalFormatAmountField(Se && Se.amount),
        xa = bi !== "" && bi !== Pi;
      Se
        ? (setPaymentForm({
          id: (Se && Se.id) || null,
          client: String(o.id),
          shopping: String(vl),
          amount: "",
          product_ids: ae,
        }),
          setPaymentAmountManual(!0))
        : (setPaymentForm({
          id: null,
          client: String(o.id),
          shopping: String(vl),
          amount: xa ? bi : (bi || Pi),
          product_ids: ae,
        }),
          setPaymentAmountManual(xa));
      setPaymentProductSearch("");
      setPaymentEntryEditingId(null);
      setPaymentEntryDraftAmount("");
      setPaymentEntrySavingId(null);
      setPaymentModalOpen(!0);
    },
    openClientPaymentModal = (o) => {
      if (!o) return;
      const N = getClientPaymentTargets(o).reduce(
        (A, vl) => A + Math.max(toNumber(vl && vl.balance, 0), 0),
        0,
      );
      setClientPaymentForm({
        client: String(o.id),
        amount: N > 0 ? N.toFixed(2) : "",
      });
      setClientPaymentAmountManual(!1);
      setClientPaymentModalOpen(!0);
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
    startEditingPaymentEntry = (o) => {
      if (!o) return;
      setPaymentEntryEditingId(String(o.id));
      setPaymentEntryDraftAmount(paymentLocalFormatAmountField(o.amount));
    },
    cancelEditingPaymentEntry = () => {
      setPaymentEntryEditingId(null);
      setPaymentEntryDraftAmount("");
    },
    savePaymentEntry = async (o) => {
      const N = paymentModalClient || clientPaymentModalClient,
        A = String(paymentEntryDraftAmount || "").trim();
      if (!N || !o) return;
      if (A === "" || !Number.isFinite(parseFloat(A))) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      const vl = paymentLocalToNumber(A, Number.NaN);
      if (!Number.isFinite(vl) || vl < 0) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      setPaymentEntrySavingId(String(o.id));
      try {
        if (
          String((o && o.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
          String((o && o.group_token) || "").trim()
        ) {
          const El = getClientBatchEditPlan(N, o, vl),
            Se = ((o && o.grouped_entries) || []).reduce((ea, gl) => {
              const ae = Number(gl && gl.shopping_id);
              return (
                Number.isFinite(ae) &&
                  (ea.has(ae) || ea.set(ae, []), ea.get(ae).push(gl)),
                ea
              );
            }, new Map());
          for (const ea of El) {
            const gl = Number(ea && ea.key),
              ae = Math.max(toNumber(ea && ea.desiredAmount, 0), 0),
              qa = Se.get(gl) || [],
              oi = qa[0] || null,
              Pi = qa.slice(1);
            for (const pa of Pi)
              await I(`/payments/${pa.payment_id}/entries/${pa.id}/`, {
                method: "DELETE",
              });
            if (oi) {
              if (ae > 0)
                await I(`/payments/${oi.payment_id}/entries/${oi.id}/`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    amount: ae.toFixed(2),
                  }),
                });
              else
                await I(`/payments/${oi.payment_id}/entries/${oi.id}/`, {
                  method: "DELETE",
                });
            } else if (ae > 0) {
              const pa = getClientShoppingPayments(N, gl)[0] || null,
                mi = getClientPaymentTargetProductIds(N, gl);
              await I(pa ? `/payments/${pa.id}/` : "/payments/", {
                method: pa ? "PATCH" : "POST",
                body: JSON.stringify({
                  client: N.id,
                  shopping: gl,
                  amount: (
                    (pa ? getPaymentRecordAmount(pa) : 0) + ae
                  ).toFixed(2),
                  products: mi,
                  entry_kind: "CLIENT_BATCH",
                  entry_group_token: o.group_token,
                }),
              });
            }
          }
        } else {
          const El = o.payment_id || paymentForm.id;
          if (!El || !o.id) {
            notifyError("No se pudo identificar el abono.");
            return;
          }
          await I(`/payments/${El}/entries/${o.id}/`, {
            method: "PATCH",
            body: JSON.stringify({
              amount: vl.toFixed(2),
            }),
          });
        }
        setPaymentForm((El) => ({
          ...El,
          amount: "",
        }));
        setPaymentAmountManual(!0);
        setPaymentEntryEditingId(null);
        setPaymentEntryDraftAmount("");
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Abono actualizado.");
      } catch (El) {
        console.error("Failed updating payment entry", El);
        notifyError((El && El.message) || "No se pudo actualizar el abono.");
      } finally {
        setPaymentEntrySavingId(null);
      }
    },
    deletePaymentEntry = async (o) => {
      if (!o) return;
      const N =
        String((o && o.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
        String((o && o.group_token) || "").trim();
      if (
        !(await confirmAction({
          title: N ? "Eliminar abono general" : "Eliminar abono",
          message: N
            ? "Se eliminara este abono general y todas sus asignaciones por shopping."
            : "Se eliminara este abono del historial y se recalculara el total del pago.",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      setPaymentEntrySavingId(String(o.id));
      try {
        const A = N
          ? (o.grouped_entries || []).map((vl) => ({
            payment_id: vl.payment_id,
            id: vl.id,
          }))
          : [{ payment_id: o.payment_id || paymentForm.id, id: o.id }];
        for (const vl of A)
          vl &&
            vl.payment_id &&
            vl.id &&
            (await I(`/payments/${vl.payment_id}/entries/${vl.id}/`, {
              method: "DELETE",
            }));
        String(paymentEntryEditingId || "") === String(o.id) &&
          (setPaymentEntryEditingId(null), setPaymentEntryDraftAmount(""));
        setPaymentForm((vl) => ({
          ...vl,
          amount: "",
        }));
        setPaymentAmountManual(!0);
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Abono eliminado.");
      } catch (A) {
        console.error("Failed deleting payment entry", A);
        notifyError((A && A.message) || "No se pudo eliminar el abono.");
      } finally {
        setPaymentEntrySavingId(null);
      }
    },
    savePayment = async () => {
      const o = Kl.find((A) => String(A.id) === String(paymentForm.client || ""));
      const N = Al.find((A) => String(A.id) === String(paymentForm.shopping || ""));
      const A = String(paymentForm.amount || "").trim();
      const vl =
        A === ""
          ? 0
          : paymentLocalToNumber(A, Number.NaN);
      if (!o || !N) {
        notifyInfo("Selecciona cliente y shopping.");
        return;
      }
      if ((!paymentForm.id && A === "") || !Number.isFinite(vl)) {
        notifyInfo("Captura un monto valido.");
        return;
      }
      setPaymentSaving(!0);
      try {
        const El = paymentForm.id
          ? paymentCurrentAmountValue + vl
          : vl;
        await I(
          paymentForm.id ? `/payments/${paymentForm.id}/` : "/payments/",
          {
            method: paymentForm.id ? "PATCH" : "POST",
            body: JSON.stringify({
              client: o.id,
              shopping: N.id,
              amount: El.toFixed(2),
              products: (paymentForm.product_ids || []).map((vl) => Number(vl)),
            }),
          },
        );
        setPaymentModalOpen(!1);
        setPaymentAmountManual(!1);
        setPaymentProductSearch("");
        setPaymentEntryEditingId(null);
        setPaymentEntryDraftAmount("");
        setPaymentEntrySavingId(null);
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess(
          paymentForm.id
            ? vl > 0
              ? "Abono guardado."
              : "Pago actualizado."
            : "Pago guardado.",
        );
      } catch (vl) {
        console.error("Failed saving payment", vl);
        notifyError((vl && vl.message) || "No se pudo guardar el pago.");
      } finally {
        setPaymentSaving(!1);
      }
    },
    saveClientPayment = async () => {
      const o = clientPaymentModalClient,
        N = paymentLocalToNumber(clientPaymentForm.amount, Number.NaN);
      if (!o) {
        notifyInfo("Selecciona un cliente valido.");
        return;
      }
      if (!Number.isFinite(N) || N <= 0) {
        notifyInfo("Captura un monto valido.");
        return;
      }
      const A = getClientPaymentPlan(o, N).filter(
        (vl) => paymentLocalToNumber(vl && vl.appliedAmount, 0) > 0,
      );
      if (A.length === 0) {
        notifyInfo("Este cliente no tiene shoppings con deuda pendiente.");
        return;
      }
      setClientPaymentSaving(!0);
      try {
        const vl = `client-batch-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        for (const El of A) {
          const Se = Number(El && El.key),
            ea = getClientShoppingPayments(o, Se)[0] || null,
            gl = ea ? getPaymentRecordAmount(ea) : 0,
            ae = getClientPaymentTargetProductIds(o, Se);
          await I(ea ? `/payments/${ea.id}/` : "/payments/", {
            method: ea ? "PATCH" : "POST",
            body: JSON.stringify({
              client: o.id,
              shopping: Se,
              amount: (gl + paymentLocalToNumber(El.appliedAmount, 0)).toFixed(2),
              products: ae,
              entry_kind: "CLIENT_BATCH",
              entry_group_token: vl,
            }),
          });
        }
        setClientPaymentModalOpen(!1);
        setClientPaymentAmountManual(!1);
        setClientPaymentForm({
          client: "",
          amount: "",
        });
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Pago guardado.");
      } catch (vl) {
        console.error("Failed saving client payment", vl);
        notifyError((vl && vl.message) || "No se pudo guardar el pago.");
      } finally {
        setClientPaymentSaving(!1);
      }
    },
    startEditingClientPaymentEntry = (o) => {
      if (!o) return;
      setClientPaymentEntryEditingId(String(o.id));
      setClientPaymentEntryDraftAmount(paymentLocalFormatAmountField(o.amount));
    },
    cancelEditingClientPaymentEntry = () => {
      setClientPaymentEntryEditingId(null);
      setClientPaymentEntryDraftAmount("");
    },
    getClientBatchEditPlan = (o, N, A = 0) => {
      if (!o || !N) return [];
      const vl = ((N && N.grouped_entries) || []).reduce((El, Se) => {
          const ea = Number(Se && Se.shopping_id);
          return (
            Number.isFinite(ea) &&
              El.set(
                ea,
                (El.get(ea) || 0) + paymentLocalToNumber(Se && Se.amount, 0),
              ),
            El
          );
        }, new Map()),
        El = getClientShoppingHistoryEntries(o)
          .map((Se) => {
            const ea = Number(Se && Se.key),
              gl = vl.get(ea) || 0,
              ae = Math.max(toNumber(Se && Se.balance, 0), 0) + gl;
            return {
              ...Se,
              existingAmount: gl,
              desiredAmount: 0,
              batchAvailable: ae,
            };
          })
          .filter((Se) => Se.batchAvailable > 0 || Se.existingAmount > 0)
          .sort(
            (Se, ea) =>
              new Date(Se.date || 0).getTime() - new Date(ea.date || 0).getTime(),
          );
      let Se = Math.max(toNumber(A, 0), 0);
      return (
        El.forEach((ea) => {
          if (!(Se > 0)) return;
          const gl = Math.min(Se, Math.max(toNumber(ea.batchAvailable, 0), 0));
          ((ea.desiredAmount = gl), (Se -= gl));
        }),
        Se > 0 &&
          El.length > 0 &&
          (El[0].desiredAmount = toNumber(El[0].desiredAmount, 0) + Se),
        El
      );
    },
    saveClientPaymentHistoryRow = async (o) => {
      const N = clientPaymentModalClient,
        A = String(clientPaymentEntryDraftAmount || "").trim();
      if (!N || !o) return;
      if (A === "" || !Number.isFinite(parseFloat(A))) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      const vl = paymentLocalToNumber(A, Number.NaN);
      if (!Number.isFinite(vl) || vl < 0) {
        notifyInfo("Captura un monto valido para el abono.");
        return;
      }
      setClientPaymentEntrySavingId(String(o.id));
      try {
        if (
          String((o && o.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
          String((o && o.group_token) || "").trim()
        ) {
          const El = getClientBatchEditPlan(N, o, vl),
            Se = ((o && o.grouped_entries) || []).reduce((ae, qa) => {
              const oi = Number(qa && qa.shopping_id);
              return (
                Number.isFinite(oi) &&
                  (ae.has(oi) || ae.set(oi, []), ae.get(oi).push(qa)),
                ae
              );
            }, new Map());
          for (const ae of El) {
            const qa = Number(ae && ae.key),
              oi = Math.max(toNumber(ae && ae.desiredAmount, 0), 0),
              Pi = Se.get(qa) || [],
              pa = Pi[0] || null,
              mi = Pi.slice(1);
            for (const Ri of mi)
              await I(`/payments/${Ri.payment_id}/entries/${Ri.id}/`, {
                method: "DELETE",
              });
            if (pa) {
              if (oi > 0)
                await I(`/payments/${pa.payment_id}/entries/${pa.id}/`, {
                  method: "PATCH",
                  body: JSON.stringify({
                    amount: oi.toFixed(2),
                  }),
                });
              else
                await I(`/payments/${pa.payment_id}/entries/${pa.id}/`, {
                  method: "DELETE",
                });
            } else if (oi > 0) {
              const Ri = getClientShoppingPayments(N, qa)[0] || null,
                bi = getClientPaymentTargetProductIds(N, qa);
              await I(Ri ? `/payments/${Ri.id}/` : "/payments/", {
                method: Ri ? "PATCH" : "POST",
                body: JSON.stringify({
                  client: N.id,
                  shopping: qa,
                  amount: (
                    (Ri ? getPaymentRecordAmount(Ri) : 0) + oi
                  ).toFixed(2),
                  products: bi,
                  entry_kind: "CLIENT_BATCH",
                  entry_group_token: o.group_token,
                }),
              });
            }
          }
        } else {
          if (!o.payment_id || !o.id) {
            notifyError("No se pudo identificar el abono.");
            return;
          }
          await I(`/payments/${o.payment_id}/entries/${o.id}/`, {
            method: "PATCH",
            body: JSON.stringify({
              amount: vl.toFixed(2),
            }),
          });
        }
        setClientPaymentEntryEditingId(null);
        setClientPaymentEntryDraftAmount("");
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Abono actualizado.");
      } catch (El) {
        console.error("Failed updating client payment history row", El);
        notifyError((El && El.message) || "No se pudo actualizar el abono.");
      } finally {
        setClientPaymentEntrySavingId(null);
      }
    },
    deleteClientPaymentHistoryRow = async (o) => {
      if (!o) return;
      const N =
        String((o && o.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
        String((o && o.group_token) || "").trim();
      if (
        !(await confirmAction({
          title: N ? "Eliminar abono general" : "Eliminar abono",
          message: N
            ? "Se eliminara este abono general y todas sus asignaciones por shopping."
            : "Se eliminara este abono del historial.",
          confirmLabel: "Eliminar",
          tone: "danger",
        }))
      )
        return;
      setClientPaymentEntrySavingId(String(o.id));
      try {
        const A = N
          ? (o.grouped_entries || []).map((vl) => ({
            payment_id: vl.payment_id,
            id: vl.id,
          }))
          : [{ payment_id: o.payment_id, id: o.id }];
        for (const vl of A)
          vl &&
            vl.payment_id &&
            vl.id &&
            (await I(`/payments/${vl.payment_id}/entries/${vl.id}/`, {
              method: "DELETE",
            }));
        String(clientPaymentEntryEditingId || "") === String(o.id) &&
          (setClientPaymentEntryEditingId(null), setClientPaymentEntryDraftAmount(""));
        await refreshCoreData();
        await refreshSelectedClient();
        notifySuccess("Abono eliminado.");
      } catch (A) {
        console.error("Failed deleting client payment history row", A);
        notifyError((A && A.message) || "No se pudo eliminar el abono.");
      } finally {
        setClientPaymentEntrySavingId(null);
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
      openImageSourcePicker(handleRequestImageSelection, {
        title: "Agregar imagen a petición",
      });
    },
    pickEditingRequestImage = () => {
      if (editingRequestSaving) return;
      openImageSourcePicker(handleEditingRequestImageSelection, {
        title: "Cambiar imagen de petición",
      });
    },
    pickAlternativeUploadImages = () => {
      openImageSourcePicker(
        (o) => setAltUploadFiles(Array.from(o.target.files || [])),
        {
          title: "Adjuntar imágenes",
          multiple: !0,
        },
      );
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
    hasShipmentTrackingReady = (o) =>
      !!String((o && o.carrier) || "").trim() &&
      !!String((o && o.tracking_number) || "").trim(),
    getShipmentPurchasePriceAmount = (o) => {
      const N =
        o &&
        o.guide_price !== null &&
        typeof o.guide_price != "undefined" &&
        String(o.guide_price).trim() !== ""
          ? o.guide_price
          : o &&
              o.client_price !== null &&
              typeof o.client_price != "undefined" &&
              String(o.client_price).trim() !== ""
            ? o.client_price
            : 0;
      return toNumber(N, 0);
    },
    getShipmentSalePriceAmount = (o) => {
      const N =
        o &&
        o.client_price !== null &&
        typeof o.client_price != "undefined" &&
        String(o.client_price).trim() !== ""
          ? o.client_price
          : o &&
              o.guide_price !== null &&
              typeof o.guide_price != "undefined" &&
              String(o.guide_price).trim() !== ""
            ? o.guide_price
            : 0;
      return toNumber(N, 0);
    },
    getShipmentSalePriceSummary = (o) => {
      const N = getShipmentSalePriceAmount(o);
      return N <= 0 ? "Costo de envio gratis" : `Costo de venta: $${formatAmount(N)}`;
    },
    getPublicShipmentSalePriceSummary = (o) => {
      if (!hasShipmentTrackingReady(o)) return "";
      return getShipmentSalePriceSummary(o);
    },
    upsertShipmentListItem = (o) => {
      if (!o || !o.id) return;
      setShipments((N) => {
        const A = Array.isArray(N) ? N : [];
        const vl = A.findIndex((El) => Number(El.id) === Number(o.id));
        if (vl === -1) return [o, ...A];
        const El = [...A];
        El[vl] = { ...El[vl], ...o };
        return El;
      });
    },
    getHomeVisibleProducts = (o) =>
      (o.products || []).filter(
        (N) =>
          N.shopping !== null &&
          typeof N.shopping !== "undefined" &&
          N.status !== "IN_REVIEW" &&
          N.status !== "REJECTED",
      ),
    getClientVisibleShoppingIds = (o) => {
      const N = new Set();
      getHomeVisibleProducts(o).forEach((A) => {
        const vl = Number((A && A.shopping) || 0);
        Number.isFinite(vl) && vl > 0 && N.add(vl);
      });
      ((o && o.payments) || []).forEach((A) => {
        const vl = Number((A && (A.shopping || A.mission)) || 0);
        Number.isFinite(vl) && vl > 0 && N.add(vl);
      });
      return N;
    },
    getHomeClientTotals = (o) =>
      o.reduce(
        (N, A) => ({
          usd: N.usd + toNumber(A.real_price, 0),
          sale: N.sale + getProductPaymentAmount(A),
        }),
        { usd: 0, sale: 0 },
      ),
    getHomeClientMissionTotals = (o, missionId) =>
      (o || []).filter(A => A.shopping === missionId).reduce(
        (N, A) => ({
          usd: N.usd + toNumber(A.real_price, 0),
          sale: N.sale + getProductPaymentAmount(A),
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
            sale: N.sale + getProductPaymentAmount(A),
          }),
          { usd: 0, sale: 0 },
        ),
    getProductPaymentAmount = (o, N = null) => {
      const A =
          N === null
            ? hasValue(o && o.discount_percentage)
              ? toNumber(o && o.discount_percentage, 0)
              : paymentLocalShoppingDiscount((o && (o.shopping || o.mission)) || null)
            : N,
        vl = Math.max(0, 1 - toNumber(A, 0) / 100),
        El = toNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(El)) return El * vl;
      const Se = toNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(Se) ? Se : 0;
    },
    getProductQuickFinalPrice = (o) => {
      const N = getProductPaymentAmount(o);
      return Number.isFinite(N) ? N : Number.NaN;
    },
    getProductBaseFinalPrice = (o) => {
      const N = toNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(N)) return N;
      const A = toNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(A) ? A : Number.NaN;
    },
    getProductImagePrimaryPrice = (o) => {
      const N = getProductBaseFinalPrice(o);
      return Number.isFinite(N) ? N : getProductQuickFinalPrice(o);
    },
    hasProductDiscountedFinalPrice = (o) => {
      const N = getProductBaseFinalPrice(o),
        A = getProductQuickFinalPrice(o);
      return (
        Number.isFinite(N) &&
        Number.isFinite(A) &&
        Math.abs(N - A) > 0.009
      );
    },
    formatProductQuickFinalPrice = (o) => {
      const N = getProductQuickFinalPrice(o);
      return Number.isFinite(N) ? formatAmount(N) : "";
    },
    getClientShoppingProducts = (o, N) =>
      ((o && o.products) || []).filter(
        (A) =>
          Number(A && A.shopping) === Number(N) &&
          String(A && A.status || "").toUpperCase() !== "REJECTED",
      ),
    getPaymentProductsTotal = (o = [], N = 0) =>
      (o || []).reduce((A, vl) => A + getProductPaymentAmount(vl, N), 0),
    getPaymentRecordProducts = (o = null) => (o && (o.products_detail || [])) || [],
    getPaymentRecordShoppingId = (o = null) =>
      Number((o && (o.shopping || o.mission)) || 0),
    getPaymentRecordAmount = (o = null) => toNumber(o && o.amount, 0),
    getPaymentRecordProductsTotal = (o = null) =>
      getPaymentProductsTotal(
        getPaymentRecordProducts(o),
        paymentLocalShoppingDiscount(getPaymentRecordShoppingId(o)),
      ),
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
      const A = getClientShoppingPayments(o, N),
        vl = A[0] || null,
        El = vl
          ? getPaymentRecordProducts(vl).map((Se) => Number(Se && Se.id))
          : [],
        Se = getPaymentProductsTotal(
          paymentLocalShoppingProducts(o, N, El),
          paymentLocalShoppingDiscount(N),
        ),
        ea = vl ? getPaymentRecordAmount(vl) : 0;
      return {
        amount: ea,
        productsTotal: Se,
        balance: Se - ea,
      };
    },
    getClientShoppingHistoryEntries = (o) => {
      if (!o) return [];
      const N = getHomeVisibleProducts(o),
        A = N.reduce((gl, ae) => {
          const qa = String(ae.shopping || "");
          return (gl[qa] || (gl[qa] = []), gl[qa].push(ae), gl);
        }, {});
      return Array.from(
        new Set([
          ...Object.keys(A),
          ...(((o && o.payments) || []).map((gl) =>
            String((gl && (gl.shopping || gl.mission)) || ""),
          ).filter(Boolean)),
        ]),
      )
        .map((gl) => {
          const ae = A[gl] || [],
            qa = ae.filter(
              (miProduct) =>
                String((miProduct && miProduct.status) || "").toUpperCase() ===
                "ANNOTATED",
            ),
            Pi = getClientShoppingPayments(o, gl),
            pa = getClientShoppingPaymentSummary(o, gl),
            oiPaymentName =
              (Pi[0] && (Pi[0].shopping_name || Pi[0].mission_name)) || "",
            oiPaymentDate =
              (Pi[0] && (Pi[0].updated_at || Pi[0].created_at)) || "",
            oi = Al.find((mi) => mi.id === Number(gl)),
            mi =
              oi && oi.name
                ? oi.name
                : ae[0] && (ae[0].shopping_name || ae[0].mission_name)
                  ? String(ae[0].shopping_name || ae[0].mission_name).trim()
                  : oiPaymentName
                    ? oiPaymentName
                    : `Tienda #${gl}`,
            Ri =
              (oi && oi.start_time) ||
              (ae[0] &&
                (ae[0].shopping_date || ae[0].mission_date || ae[0].created_at)) ||
              oiPaymentDate ||
              "";
          return {
            key: gl,
            shopping: oi,
            title: mi,
            date: Ri,
            items: ae,
            annotatedItems: qa,
            annotatedCount: qa.length,
            payments: Pi,
            productsTotal: getPaymentProductsTotal(
              ae,
              paymentLocalShoppingDiscount(gl),
            ),
            paymentsTotal: pa.amount,
            balance: pa.balance,
          };
        })
        .sort(
          (gl, ae) =>
            new Date(ae.date || 0).getTime() - new Date(gl.date || 0).getTime(),
        );
    },
    getClientPaymentTargets = (o) =>
      getClientShoppingHistoryEntries(o)
        .filter((N) => toNumber(N && N.balance, 0) > 0)
        .sort(
          (N, A) =>
            new Date(N.date || 0).getTime() - new Date(A.date || 0).getTime(),
        ),
    getClientPaymentPlan = (o, N = 0) => {
      let A = Math.max(toNumber(N, 0), 0);
      const vl = getClientPaymentTargets(o).map((El) => {
        const Se = Math.max(toNumber(El && El.balance, 0), 0);
        let ea = 0;
        A > 0 && ((ea = Math.min(A, Se)), (A -= ea));
        return {
          ...El,
          debtAmount: Se,
          appliedAmount: ea,
          isReceiving: ea > 0,
        };
      });
      if (A > 0 && vl.length > 0) {
        const El = vl[0];
        vl[0] = {
          ...El,
          appliedAmount: El.appliedAmount + A,
          isReceiving: !0,
        };
      }
      return vl;
    },
    getClientPaymentTargetProductIds = (o, N) => {
      if (!o) return [];
      const A = getClientShoppingPayments(o, N),
        vl = A[0] || null,
        El = vl
          ? getPaymentRecordProducts(vl).map((Se) => Number(Se && Se.id))
          : [];
      return paymentLocalShoppingProducts(o, N, El).map((Se) => Number(Se.id));
    },
    getClientPaymentHistoryEntries = (o) =>
      getClientShoppingHistoryEntries(o)
        .flatMap((N) =>
          (N.payments || []).flatMap((A) =>
            paymentLocalRecordEntries(A).map((vl) => ({
              ...vl,
              payment_id: A.id,
              shopping_id: Number(N.key),
              shopping_title: N.title,
            })),
          ),
        )
        .sort(
          (N, A) =>
            new Date(A.created_at || 0).getTime() -
            new Date(N.created_at || 0).getTime(),
        ),
    getClientPaymentHistoryRows = (o) => {
      const N = getClientPaymentHistoryEntries(o),
        A = new Set(),
        vl = [];
      N.forEach((El) => {
        const Se = String((El && El.entry_kind) || "").toUpperCase(),
          ea = String((El && El.group_token) || "").trim();
        if (Se === "CLIENT_BATCH" && ea) {
          if (A.has(ea)) return;
          A.add(ea);
          const gl = N.filter(
              (ae) =>
                String((ae && ae.entry_kind) || "").toUpperCase() === "CLIENT_BATCH" &&
                String((ae && ae.group_token) || "").trim() === ea,
            ),
            ae = gl.reduce(
              (oi, Pi) => oi + paymentLocalToNumber(Pi && Pi.amount, 0),
              0,
            ),
            qa = Array.from(
              gl.reduce((oi, Pi) => {
                const pa = Number(Pi && Pi.shopping_id),
                  mi = String(
                    Pi && (Pi.shopping_title || Pi.shopping_name) || "",
                  ).trim() || `Shopping #${pa || "?"}`,
                  Ri = oi.get(pa) || {
                    shopping_id: pa,
                    shopping_title: mi,
                    amount: 0,
                  };
                return (
                  Ri.amount += paymentLocalToNumber(Pi && Pi.amount, 0),
                  oi.set(pa, Ri),
                  oi
                );
              }, new Map()).values(),
            );
          vl.push({
            id: `client-batch-${ea}`,
            entry_kind: "CLIENT_BATCH",
            group_token: ea,
            amount: ae,
            total_after: ae,
            created_at: gl[0] && gl[0].created_at,
            created_by_username: gl[0] && gl[0].created_by_username,
            shopping_title: "Abono general",
            shopping_tags: qa.map((oi) => oi.shopping_title),
            shopping_allocations: qa,
            grouped_entries: gl.map((oi) => ({
              id: oi.id,
              payment_id: oi.payment_id,
              shopping_id: Number(oi.shopping_id),
              shopping_title:
                String(oi && (oi.shopping_title || oi.shopping_name) || "").trim() ||
                `Shopping #${oi && oi.shopping_id}`,
              amount: paymentLocalToNumber(oi && oi.amount, 0),
            })),
          });
          return;
        }
        vl.push({
          ...El,
          shopping_tags: [],
          shopping_allocations: [
            {
              shopping_id: Number(El && El.shopping_id),
              shopping_title:
                String(El && (El.shopping_title || El.shopping_name) || "").trim() ||
                `Shopping #${El && El.shopping_id}`,
              amount: paymentLocalToNumber(El && El.amount, 0),
            },
          ],
        });
      });
      return vl;
    },
    clientPaymentModalClient = Kl.find(
      (o) => String(o.id) === String(clientPaymentForm.client || ""),
    ) || null,
    clientPaymentTargets = clientPaymentModalClient
      ? getClientPaymentTargets(clientPaymentModalClient)
      : [],
    clientPaymentAmountValue = paymentLocalToNumber(clientPaymentForm.amount, 0),
    clientPaymentPlan = clientPaymentModalClient
      ? getClientPaymentPlan(
        clientPaymentModalClient,
        clientPaymentAmountValue,
      )
      : [],
    clientPaymentReceivingTargets = clientPaymentPlan.filter(
      (o) => toNumber(o && o.appliedAmount, 0) > 0,
    ),
    clientPaymentTotalDebt = clientPaymentTargets.reduce(
      (o, N) => o + Math.max(paymentLocalToNumber(N && N.balance, 0), 0),
      0,
    ),
    clientPaymentAllocatedTotal = clientPaymentPlan.reduce(
      (o, N) => o + Math.max(paymentLocalToNumber(N && N.appliedAmount, 0), 0),
      0,
    ),
    clientPaymentBalance = clientPaymentTotalDebt - clientPaymentAllocatedTotal,
    clientPaymentHistoryEntries = clientPaymentModalClient
      ? getClientPaymentHistoryEntries(clientPaymentModalClient)
      : [],
    clientPaymentHistoryRows = clientPaymentModalClient
      ? getClientPaymentHistoryRows(clientPaymentModalClient)
      : [],
    paymentHistoryRows = paymentModalClient
      ? getClientPaymentHistoryRows(paymentModalClient)
      : [],
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
          : o === "BOUGHT"
            ? "Comprado"
          : o === "SHIPPED"
            ? "Enviado"
            : "Anotado",
    getProductStatusChipClassName = (o) =>
      o === "IN_REVIEW"
        ? "bg-amber-100/92 text-amber-800"
        : o === "REJECTED"
          ? "bg-rose-100/92 text-rose-700"
          : o === "BOUGHT"
            ? "bg-emerald-100/92 text-emerald-700"
            : o === "SHIPPED"
              ? "bg-blue-100/92 text-blue-700"
              : "bg-white/90 text-gray-700",
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
    modalHasRequiredProductFields = !getProductModalRequiredError(st),
    productDiscountPercent = parseFloat(calcDiscount),
    showProductDiscountFields =
      Number.isFinite(productDiscountPercent) &&
      productDiscountPercent > 0 &&
      Number.isInteger(productDiscountPercent),
    productStoreDiscountedPrice = showProductDiscountFields
      ? computeProductModalDiscountedPrice(st.real_price)
      : Number.NaN,
    productFinalDiscountedPrice = showProductDiscountFields
      ? computeProductModalDiscountedPrice(st.charged_price)
      : Number.NaN,
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
    payerUserOptions = (users || []).filter((o) => !!(o && o.id)),
    activeMissionPayerUser = payerUserOptions.find(
      (o) => String((o && o.id) || "") === String((w && w.payer) || ""),
    ),
    activeMissionPayerLabel = activeMissionPayerUser
      ? getUserOptionLabel(activeMissionPayerUser)
      : String((w && w.payer_username) || "").trim(),
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
    activeMissionSummaryProducts = activeMissionProducts.filter((o) => {
      const N = String((o && o.status) || "").toUpperCase();
      return N === "ANNOTATED";
    }),
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
    clientVisibleShoppingIdSet = W ? getClientVisibleShoppingIds(W) : new Set(),
    clientGalleryHasMissionScope =
      clientGalleryMissionScopeId !== null &&
      typeof clientGalleryMissionScopeId !== "undefined" &&
      String(clientGalleryMissionScopeId).trim() !== "",
    clientGalleryScopeMission = clientGalleryHasMissionScope
      ? Al.find((o) => Number(o.id) === Number(clientGalleryMissionScopeId)) ||
        (clientGalleryMissionScopeMeta
          ? {
              id: Number(clientGalleryMissionScopeId),
              name:
                clientGalleryMissionScopeMeta.title ||
                clientGalleryMissionScopeMeta.shopping_name ||
                clientGalleryMissionScopeMeta.mission_name ||
                "",
              store_name:
                clientGalleryMissionScopeMeta.title ||
                clientGalleryMissionScopeMeta.shopping_name ||
                clientGalleryMissionScopeMeta.mission_name ||
                "",
              start_time:
                clientGalleryMissionScopeMeta.date ||
                clientGalleryMissionScopeMeta.shopping_date ||
                clientGalleryMissionScopeMeta.mission_date ||
                "",
              status:
                clientGalleryMissionScopeMeta.status ||
                (clientGalleryMissionScopeMeta.shopping &&
                typeof clientGalleryMissionScopeMeta.shopping === "object"
                  ? clientGalleryMissionScopeMeta.shopping.status
                  : "") ||
                "",
              store:
                clientGalleryMissionScopeMeta.shopping &&
                typeof clientGalleryMissionScopeMeta.shopping === "object"
                  ? clientGalleryMissionScopeMeta.shopping.store
                  : null,
            }
          : null)
      : null,
    productModalCanChooseShopping =
      !!W && productModalMode === "create" && clientGalleryAllowsShoppingChoice,
    productModalShoppingOptions = [...Al].sort(
      (o, N) =>
        new Date(N && N.start_time || 0).getTime() -
        new Date(o && o.start_time || 0).getTime(),
    ),
    productModalShoppingSearchTokens = getSearchTokens(productModalShoppingSearch),
    productModalFilteredShoppingOptions = productModalCanChooseShopping
      ? productModalShoppingOptions.filter((o) => {
        if (!productModalShoppingSearchTokens.length) return !0;
        const N = getMissionSearchBlob(o);
        return productModalShoppingSearchTokens.every((A) => N.includes(A));
      })
      : [],
    productModalSelectedShopping = productModalCanChooseShopping
      ? Al.find((o) => Number(o && o.id) === Number(st.shopping || 0)) || null
      : null,
    productModalPinnedShopping =
      !productModalCanChooseShopping && Number(st.shopping || 0) > 0
        ? clientGalleryScopeMission ||
          Al.find((o) => Number(o && o.id) === Number(st.shopping || 0)) ||
          null
        : null,
    missionTaxPercentage = toNumber(w && w.tax_percentage, toNumber(calcTaxes, 0)),
    missionDiscountPercentage = Math.max(
      0,
      toNumber(w && w.discount_percentage, toNumber(calcDiscount, 0)),
    ),
    missionProductsCount = activeMissionSummaryProducts.length,
    missionPurchaseCost = activeMissionSummaryProducts.reduce((o, N) => {
      const A = toNumber(N && N.real_price, Number.NaN);
      return Number.isFinite(A) ? o + A : o;
    }, 0),
    missionPurchaseCostWithDiscount = missionDiscountPercentage > 0
      ? activeMissionSummaryProducts.reduce((o, N) => {
        const A = toNumber(N && N.real_price, Number.NaN);
        return Number.isFinite(A)
          ? o + A * Math.max(0, 1 - missionDiscountPercentage / 100)
          : o;
      }, 0)
      : 0,
    missionTotalWithTaxes = activeMissionSummaryProducts.reduce((o, N) => {
      const A = toNumber(N.charged_price, Number.NaN);
      if (Number.isFinite(A)) return o + A;
      const vl = toNumber(N.real_price, Number.NaN);
      if (!Number.isFinite(vl)) return o;
      return o + vl * (1 + missionTaxPercentage / 100);
    }, 0),
    missionTotalWithDiscount = missionDiscountPercentage > 0
      ? activeMissionSummaryProducts.reduce(
        (o, N) =>
          o + getProductPaymentAmount(N, missionDiscountPercentage),
        0,
      )
      : 0,
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
    selectedClientHomeScopeId = clientGalleryHasMissionScope
      ? Number(clientGalleryMissionScopeId || 0) || null
      : null,
    selectedClientHomeAnnotatedProducts = W
      ? ((W.products || []).filter(
        (o) =>
          (selectedClientHomeScopeId
            ? Number((o && o.shopping) || 0) === Number(selectedClientHomeScopeId)
            : clientVisibleShoppingIdSet.has(Number((o && o.shopping) || 0))) &&
          String((o.status || "")).toUpperCase() === "ANNOTATED",
      ))
      : [],
    selectedClientHomeAnnotatedTotals = selectedClientHomeScopeId
      ? getHomeClientMissionAnnotatedTotals((W && W.products) || [], selectedClientHomeScopeId)
      : getHomeClientTotals(selectedClientHomeAnnotatedProducts),
    selectedClientHomeHistoryEntries = W ? getClientShoppingHistoryEntries(W) : [],
    selectedClientHomeGlobalBalance = selectedClientHomeHistoryEntries.reduce(
      (o, N) => o + toNumber(N && N.balance, 0),
      0,
    ),
    galleryProducts = (((W && W.products) || []).filter((o) =>
      clientGalleryHasMissionScope
        ? Number(o.shopping) === Number(clientGalleryMissionScopeId) &&
          (clientGalleryScopeMission &&
          clientGalleryScopeMission.status === "COMPLETED"
            ? o.status === "ANNOTATED"
            : !0)
        : clientVisibleShoppingIdSet.has(Number((o && (o.shopping || o.mission)) || 0)),
    )),
    galleryReviewProducts = clientGalleryHasMissionScope
      ? []
      : galleryProducts.filter((o) => o.status === "IN_REVIEW"),
    galleryAnnotatedProducts = galleryProducts.filter((o) =>
      clientGalleryHasMissionScope
        ? o.status === "ANNOTATED"
        : o.status === "ANNOTATED" || o.status === "BOUGHT",
    ),
    galleryRejectedProducts = clientGalleryHasMissionScope
      ? []
      : galleryProducts.filter((o) => o.status === "REJECTED"),
    galleryReviewCount = galleryReviewProducts.length,
    galleryAnnotatedCount = galleryAnnotatedProducts.length,
    galleryRejectedCount = galleryRejectedProducts.length,
    visibleGalleryProducts =
      wl === "REVIEW"
        ? galleryReviewProducts
        : wl === "REJECTED"
            ? galleryRejectedProducts
            : galleryAnnotatedProducts,
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
    publicOrderedShipments = publicClientShareData
      ? [...(publicClientShareData.shipments || [])].sort((o, N) => {
          const A = String((o && o.status) || "").toUpperCase() === "PENDING" ? 0 : 1,
            vl = String((N && N.status) || "").toUpperCase() === "PENDING" ? 0 : 1;
          if (A !== vl) return A - vl;
          const El = new Date(
              (o && (o.updated_at || o.created_at)) || 0,
            ).getTime(),
            Se = new Date(
              (N && (N.updated_at || N.created_at)) || 0,
            ).getTime();
          return Se - El;
        })
      : [],
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
    publicPendingShipmentSelectionSet = new Set(
      publicPendingShipmentSelection.map((o) => Number(o)),
    ),
    publicClientBalanceTotal = publicClientShareData
      ? toNumber(publicClientShareData.client_balance, 0)
      : 0,
    publicClientBalanceLabel = publicClientBalanceTotal < 0
      ? "A favor"
      : publicClientBalanceTotal > 0
        ? "Deuda"
        : "Sin saldo",
    missionReviewAlertCount = missionReviewAlerts.length,
    isDesktopLayout = layoutMode === "WEB" && isWideViewport;
  V.useEffect(() => {
    homeDesktopLayoutRef.current = homeDesktopLayout;
  }, [homeDesktopLayout]);
  V.useEffect(() => {
    setHomeDesktopLayout(
      normalizeHomeDesktopLayout(J && J.profile && J.profile.home_layout),
    );
  }, [J]);
  V.useEffect(
    () => () => {
      stopHomeDesktopResize(!1);
    },
    [],
  );
  const getPublicShareDataPath = () =>
      publicShareType === "shipment"
        ? `/public/shipment-share/${encodeURIComponent(publicClientShareToken)}/`
        : `/public/client-share/${encodeURIComponent(publicClientShareToken)}/`,
    reloadPublicShareData = async ({ showLoading = !1 } = {}) => {
      if (!publicClientShareToken) return null;
      showLoading && setPublicClientShareLoading(!0);
      setPublicClientShareError("");
      try {
        const o = await publicApiFetch(getPublicShareDataPath());
        setPublicClientShareData(o || null);
        return o || null;
      } catch (o) {
        setPublicClientShareError(
          (o && o.message) || "No se pudo cargar este enlace.",
        );
        throw o;
      } finally {
        showLoading && setPublicClientShareLoading(!1);
      }
    },
    togglePublicPendingShipmentSelection = (o) => {
      const N = Number(o);
      setPublicPendingShipmentSelection((A) =>
        A.includes(N) ? A.filter((vl) => vl !== N) : [...A, N],
      );
    },
    createPublicShipmentFromSelection = async () => {
      if (publicShareType === "shipment" || !publicClientShareToken) return;
      if (publicPendingShipmentSelection.length === 0) {
        notifyInfo("Selecciona al menos un producto para armar la caja.");
        return;
      }
      setPublicBuildingShipment(!0);
      try {
        const o = await publicApiFetch(
            `/public/client-share/${encodeURIComponent(publicClientShareToken)}/build-shipment/`,
            {
              method: "POST",
              body: JSON.stringify({
                products: publicPendingShipmentSelection,
              }),
            },
          ),
          N = await reloadPublicShareData();
        setPublicPendingShipmentSelection([]);
        o &&
          o.shipment &&
          o.shipment.id &&
          setPublicExpandedShipmentId(Number(o.shipment.id));
        notifySuccess("Caja armada. El envio ya aparece en el historial.");
        return N;
      } catch (o) {
        console.error("Failed building public shipment", o);
        notifyError(
          (o && o.message) || "No se pudo armar la caja.",
        );
        return null;
      } finally {
        setPublicBuildingShipment(!1);
      }
    };
  V.useEffect(() => {
    if (!publicClientShareToken) return;
    let o = !0;
    setPublicClientShareLoading(!0);
    setPublicClientShareError("");
    publicApiFetch(getPublicShareDataPath())
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
    const o =
      publicShareType === "shipment"
        ? publicClientShareData.focus_shipment_id
        : publicFocusShipmentIdFromSearch || publicClientShareData.focus_shipment_id;
    if (o) {
      setPublicExpandedShipmentId(Number(o));
      setPublicShipmentHistoryExpanded(!0);
      return;
    }
    setPublicExpandedShipmentId(null);
  }, [
    publicShareType,
    publicFocusShipmentIdFromSearch,
    publicClientShareData &&
    publicClientShareData.focus_shipment_id,
    publicClientShareData &&
    (publicClientShareData.shipments || []).length,
  ]);
  V.useEffect(() => {
    const o = new Set(
      publicPendingShipmentProducts.map((N) => Number(N.id)),
    );
    setPublicPendingShipmentSelection((N) =>
      N.filter((A) => o.has(Number(A))),
    );
  }, [publicPendingShipmentProducts]);
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
  const savePublicShipmentProductsOnly = async () => {
      if (!shipmentForm.id) return;
      if (!publicCanEditSelectedShipmentProducts) {
        notifyInfo("Solo puedes modificar la caja mientras el envio siga pendiente.");
        return;
      }
      if (!(shipmentForm.product_ids || []).length) {
        notifyInfo("Selecciona al menos un producto.");
        return;
      }
      try {
        await I(`/shipments/${shipmentForm.id}/set-products/`, {
          method: "POST",
          body: JSON.stringify({
            products: (shipmentForm.product_ids || []).map((o) => Number(o)),
          }),
        });
        setShipmentModalOpen(!1);
        setShipmentProductPickerOpen(!1);
        await refreshCoreData();
        await refreshSelectedClient();
        publicClientShareToken && (await reloadPublicShareData());
        setPublicExpandedShipmentId(Number(shipmentForm.id));
        notifySuccess("Caja actualizada.");
      } catch (o) {
        console.error("Failed updating public shipment products", o);
        notifyError((o && o.message) || "No se pudo actualizar la caja.");
      }
    },
    publicCanModifySelectedShipment = !1,
    publicCanEditSelectedShipmentProducts =
      publicCanModifySelectedShipment &&
      String((publicSelectedShipment && publicSelectedShipment.status) || "").toUpperCase() ===
        "PENDING",
    publicShipmentEditorOverlay =
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
                      children: "Modificar caja",
                    }),
                    c.jsx("p", {
                      className: "text-[11px] text-text-sub mt-0.5",
                      children: "Desde este link solo puedes ajustar los productos.",
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
                              children: "Productos de la caja",
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
                            "Productos",
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
                              `shipment-public-picked-${o.id}`,
                            ),
                          ),
                        })
                      : c.jsx("p", {
                          className: "text-xs text-text-sub",
                          children:
                            "Abre la galeria para elegir los productos que iran en esta caja.",
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
                  onClick: savePublicShipmentProductsOnly,
                  className:
                    "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold",
                  children: "Guardar",
                }),
              ],
            }),
          ],
        }),
      }),
    publicShipmentProductPickerOverlay =
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
                shipmentHiddenProductsMessage &&
                c.jsx("p", {
                  className:
                    "text-[11px] text-amber-700 dark:text-amber-300",
                  children: shipmentHiddenProductsMessage,
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
                                (o.shopping_date || o.mission_date) &&
                                c.jsx("p", {
                                  className: "text-[10px] text-white/70 truncate",
                                  children: new Date(
                                    o.shopping_date || o.mission_date,
                                  ).toLocaleDateString(),
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
                      `shipment-public-picker-${o.id}`,
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
      });
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
              c.jsxs("div", {
                className: "flex items-start justify-between gap-3",
                children: [
                  c.jsxs("div", {
                    className: "min-w-0 flex-1",
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
                  publicClientShareData &&
                  c.jsxs("div", {
                    className: `shrink-0 min-w-[116px] rounded-2xl border px-3 py-2 text-right ${publicClientBalanceTotal < 0 ? "border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/20" : publicClientBalanceTotal > 0 ? "border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20" : "border-border-light dark:border-border-dark bg-white/70 dark:bg-slate-900/60"}`,
                    children: [
                      c.jsx("p", {
                        className: "text-[10px] font-black uppercase tracking-[0.2em] text-text-sub",
                        children: "Saldo",
                      }),
                      c.jsx("p", {
                        className: `mt-1 text-[11px] font-bold ${publicClientBalanceTotal < 0 ? "text-emerald-700 dark:text-emerald-300" : publicClientBalanceTotal > 0 ? "text-rose-700 dark:text-rose-300" : "text-text-sub dark:text-slate-300"}`,
                        children: publicClientBalanceLabel,
                      }),
                      c.jsxs("p", {
                        className: `mt-1 text-base font-black ${publicClientBalanceTotal < 0 ? "text-emerald-800 dark:text-emerald-100" : publicClientBalanceTotal > 0 ? "text-rose-800 dark:text-rose-100" : "text-text-main dark:text-white"}`,
                        children: ["$", formatAmount(Math.abs(publicClientBalanceTotal))],
                      }),
                    ],
                  }),
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
                  className: "px-4 py-4 flex flex-col gap-3",
                  children: [
                    c.jsx("div", {
                      className: `order-2 ui-disclosure-panel ${
                        publicSelectedShipment ? "ui-disclosure-panel-open" : ""
                      }`,
                      children: c.jsx("div", {
                        className: "ui-disclosure-inner",
                        children: publicSelectedShipment &&
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
                            getPublicShipmentSalePriceSummary(
                              publicSelectedShipment,
                            ) &&
                            c.jsx("p", {
                              className:
                                "text-[11px] font-bold text-emerald-700 dark:text-emerald-300",
                              children: getPublicShipmentSalePriceSummary(
                                publicSelectedShipment,
                              ),
                            }),
                            publicCanModifySelectedShipment &&
                            c.jsxs("button", {
                              type: "button",
                              onClick: () =>
                                publicCanEditSelectedShipmentProducts &&
                                openShipmentEditor(publicSelectedShipment),
                              disabled: !publicCanEditSelectedShipmentProducts,
                              title: publicCanEditSelectedShipmentProducts
                                ? "Modificar los productos de esta caja"
                                : "Solo se puede modificar mientras el envio esta pendiente",
                              className:
                                `inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                                  publicCanEditSelectedShipmentProducts
                                    ? "border-primary/20 bg-primary/10 text-primary hover:bg-primary/15"
                                    : "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
                                }`,
                              children: [
                                c.jsx("span", {
                                  className:
                                    "material-symbols-outlined text-[14px]",
                                  children: "edit",
                                }),
                                "Modificar caja",
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
                        (publicSelectedShipment.evidence || []).length > 0 &&
                        c.jsxs("div", {
                          className:
                            "rounded-xl bg-violet-50 dark:bg-violet-950/20 px-3 py-2 space-y-2",
                          children: [
                            c.jsx("p", {
                              className:
                                "text-[10px] font-bold uppercase text-violet-700 dark:text-violet-300",
                              children: "Evidencia del envio",
                            }),
                            c.jsx("div", {
                              className: "grid grid-cols-2 gap-2",
                              children: (publicSelectedShipment.evidence || []).map(
                                (o) => {
                                  const N = getShipmentEvidenceKind(o);
                                  return c.jsx(
                                    "div",
                                    {
                                      className:
                                        "overflow-hidden rounded-xl border border-violet-100 dark:border-violet-900 bg-white/90 dark:bg-slate-900/80 ui-media-card",
                                      children:
                                        N === "VIDEO"
                                          ? c.jsx("video", {
                                              src: resolveMediaUrl(o.file),
                                              controls: !0,
                                              preload: "metadata",
                                              className:
                                                "w-full aspect-[4/5] bg-black object-cover",
                                            })
                                          : c.jsx("img", {
                                              src: resolveMediaUrl(o.file),
                                              onClick: () =>
                                                setFullscreenImage(
                                                  resolveMediaUrl(o.file),
                                                ),
                                              className:
                                                "w-full aspect-[4/5] object-cover cursor-zoom-in",
                                            }),
                                    },
                                    `public-shipment-evidence-${o.id}`,
                                  );
                                },
                              ),
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
                                        "rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 p-2 flex gap-2 items-start ui-media-card",
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
                      }),
                    }),
                    publicPendingShipmentProducts.length > 0 &&
                    c.jsxs("div", {
                      className:
                        "order-3 rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50/80 dark:bg-amber-950/20 px-4 py-3 space-y-2",
                      children: [
                        c.jsxs("div", {
                          className: "flex items-center justify-between gap-2",
                          children: [
                            c.jsx("h3", {
                              className: "text-sm font-bold text-amber-900 dark:text-amber-100",
                              children: "Compras",
                            }),
                            c.jsxs("span", {
                              className: "text-[11px] text-amber-700 dark:text-amber-300 shrink-0",
                              children: [
                                publicPendingShipmentProducts.length,
                                " item",
                                publicPendingShipmentProducts.length === 1 ? "" : "s",
                              ],
                            }),
                          ],
                        }),
                        c.jsx("div", {
                          className: "grid grid-cols-3 gap-1.5 justify-items-center",
                          children: publicPendingShipmentProducts.map((o) =>
                            c.jsxs(
                              "div",
                              {
                                className:
                                  "relative w-full max-w-[128px] sm:max-w-[138px] overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-900 bg-slate-100 dark:bg-slate-900 aspect-[1.18]",
                                children: [
                                  o.image
                                    ? c.jsx("img", {
                                        src: resolveMediaUrl(o.image),
                                        onClick: () =>
                                          setFullscreenImage(resolveMediaUrl(o.image)),
                                        className:
                                          "w-full h-full object-cover cursor-zoom-in",
                                      })
                                    : c.jsx("div", {
                                        className:
                                          "w-full h-full flex items-center justify-center text-amber-300 dark:text-amber-700",
                                        children: c.jsx("span", {
                                          className:
                                            "material-symbols-outlined text-[22px]",
                                          children: "image",
                                        }),
                                      }),
                                  c.jsx("div", {
                                    className:
                                      "absolute inset-0 bg-gradient-to-b from-black/18 via-transparent to-black/24 pointer-events-none",
                                  }),
                                  c.jsx("div", {
                                    className:
                                      "absolute top-0.5 left-0.5 right-0.5 z-10 pointer-events-none",
                                    children: c.jsx("div", {
                                      className:
                                        "inline-flex max-w-full rounded-full bg-white/18 px-1.5 py-0.5 text-[8px] font-semibold text-white backdrop-blur-sm",
                                      children: c.jsx("span", {
                                        className: "truncate",
                                        children: o.name,
                                      }),
                                    }),
                                  }),
                                  Number.isFinite(getProductImagePrimaryPrice(o)) &&
                                  c.jsx("div", {
                                    className:
                                      "absolute inset-x-0 bottom-0.5 z-10 flex justify-center pointer-events-none",
                                    children: hasProductDiscountedFinalPrice(o)
                                      ? c.jsxs("div", {
                                        className:
                                          "inline-flex flex-col items-center gap-0 rounded-2xl bg-white/82 dark:bg-slate-900/82 px-1.5 py-0.5 text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                        children: [
                                          c.jsxs("span", {
                                            className:
                                              "whitespace-nowrap text-[7px] font-bold",
                                            children: [
                                              "Venta $",
                                              formatAmount(
                                                getProductBaseFinalPrice(o),
                                              ),
                                            ],
                                          }),
                                          c.jsxs("span", {
                                            className:
                                              "whitespace-nowrap text-[7px] font-black text-emerald-700 dark:text-emerald-300",
                                            children: [
                                              "C/desc $",
                                              formatProductQuickFinalPrice(o),
                                            ],
                                          }),
                                        ],
                                      })
                                      : c.jsxs("span", {
                                        className:
                                          "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-1.5 py-[2px] text-[8px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                        children: [
                                          "$",
                                          formatAmount(
                                            getProductImagePrimaryPrice(o),
                                          ),
                                        ],
                                      }),
                                  }),
                                ],
                              },
                              `public-pending-product-${o.id}`,
                            ),
                          ),
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      className:
                        "order-1 rounded-2xl border border-border-light dark:border-border-dark bg-white dark:bg-slate-900 px-4 py-3 space-y-2",
                      children: [
                        c.jsxs("button", {
                          type: "button",
                          onClick: () =>
                            setPublicShipmentHistoryExpanded((o) => !o),
                          className:
                            "w-full flex items-center justify-between gap-2 text-left",
                          children: [
                            c.jsxs("div", {
                              className: "min-w-0",
                              children: [
                                c.jsx("h3", {
                                  className:
                                    "text-sm font-bold text-text-main dark:text-white",
                                  children: "Historial de envios",
                                }),
                                c.jsxs("p", {
                                  className: "text-[11px] text-text-sub",
                                  children: [
                                    publicOrderedShipments.length,
                                    " total",
                                  ],
                                }),
                              ],
                            }),
                            c.jsx("span", {
                              className:
                                `material-symbols-outlined text-[18px] text-text-sub ui-disclosure-chevron ${
                                  publicShipmentHistoryExpanded
                                    ? "ui-disclosure-chevron-open"
                                    : ""
                                }`,
                              children: "expand_more",
                            }),
                          ],
                        }),
                        c.jsx("div", {
                          className: `ui-disclosure-panel ${
                            publicShipmentHistoryExpanded
                              ? "ui-disclosure-panel-open"
                              : ""
                          }`,
                          children: c.jsx("div", {
                            className: "ui-disclosure-inner",
                            children: publicOrderedShipments.length > 0
                          ? c.jsx("div", {
                              className: "space-y-2",
                              children: publicOrderedShipments.map((o) =>
                                c.jsxs(
                                  "button",
                                  {
                                    type: "button",
                                    onClick: () =>
                                      setPublicExpandedShipmentId(Number(o.id)),
                                    className:
                                      `w-full text-left rounded-xl border px-3 py-2 transition ${Number(publicExpandedShipmentId) === Number(o.id) || Number(publicClientShareData.focus_shipment_id) === Number(o.id) ? "border-primary bg-primary/5" : "border-border-light dark:border-border-dark bg-slate-50/70 dark:bg-slate-800/50"}`,
                                    children: [
                                      c.jsxs("div", {
                                        className: "flex items-center justify-between gap-2",
                                        children: [
                                          c.jsxs("div", {
                                            className: "min-w-0",
                                            children: [
                                              c.jsx("p", {
                                                className:
                                                  "text-xs font-bold text-text-main dark:text-white truncate",
                                                children:
                                                  o.tracking_number ||
                                                  o.carrier ||
                                                  `Envio #${o.id}`,
                                              }),
                                              getPublicShipmentSalePriceSummary(o) &&
                                              c.jsx("p", {
                                                className:
                                                  "mt-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300",
                                                children:
                                                  getPublicShipmentSalePriceSummary(o),
                                              }),
                                            ],
                                          }),
                                          c.jsxs("div", {
                                            className: "flex items-center gap-2 shrink-0",
                                            children: [
                                              c.jsx("span", {
                                                className:
                                                  "text-[10px] font-bold uppercase text-sky-700 dark:text-sky-300",
                                                children: getShipmentStatusLabel(o.status),
                                              }),
                                              c.jsx("span", {
                                                className:
                                                  "material-symbols-outlined text-[18px] text-text-sub",
                                                children: "chevron_right",
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                      o.shipping_address &&
                                      c.jsx("p", {
                                        className:
                                          "mt-1 text-[11px] text-text-sub line-clamp-2",
                                        children: o.shipping_address,
                                      }),
                                    ],
                                  },
                                  `public-shipment-${o.id}`,
                                ),
                              ),
                            })
                          : c.jsx("div", {
                              className:
                                "rounded-xl border border-dashed border-border-light dark:border-border-dark px-4 py-8 text-center text-sm text-text-sub",
                              children: "No hay envios para mostrar.",
                            }),
                          }),
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
                  ],
                }),
        ],
      }),
      publicShipmentEditorOverlay,
      publicShipmentProductPickerOverlay,
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
      ref: isDesktopLayout ? homeDesktopGridRef : null,
      className: isDesktopLayout
        ? "grid gap-0 items-stretch min-h-[720px]"
        : "flex flex-col gap-0 pb-24 rounded-2xl overflow-hidden shadow-sm border border-border-light dark:border-border-dark",
      style: isDesktopLayout
        ? w
          ? {
              gridTemplateColumns: `minmax(0, ${homeDesktopLayout.left_width_percent}%) 6px minmax(340px, 1fr)`,
              gridTemplateRows: `${homeDesktopLayout.top_height}px 6px minmax(420px, 1fr)`,
            }
          : {
              gridTemplateColumns: "minmax(0, 1fr)",
              gridTemplateRows: `${homeDesktopLayout.top_height}px 6px minmax(420px, 1fr)`,
            }
        : void 0,
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
                  ? `Shopping pausado en ${getMissionStoreLabel(w)}${activeMissionPayerLabel ? ` • Paga: ${activeMissionPayerLabel}` : ""}.`
                  : `Comprando en ${getMissionStoreLabel(w)}${activeMissionPayerLabel ? ` • Paga: ${activeMissionPayerLabel}` : ""}.`
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
        isDesktopLayout &&
        c.jsx("div", {
          className:
            "col-start-1 row-start-2 flex items-center justify-center select-none",
          children: c.jsx("button", {
            type: "button",
            onMouseDown: startHomeDesktopResize("row"),
            className:
              "group flex h-[6px] w-full items-center justify-center cursor-row-resize",
            title: "Ajustar altura de secciones",
            children: c.jsx("span", {
              className:
                "block h-1 w-12 rounded-full bg-gray-300 transition group-hover:bg-primary/60 dark:bg-gray-700 dark:group-hover:bg-primary/70",
            }),
          }),
        }),
        isDesktopLayout &&
        w &&
        c.jsx("div", {
          className:
            "col-start-2 row-start-1 row-span-3 flex items-center justify-center select-none",
          children: c.jsx("button", {
            type: "button",
            onMouseDown: startHomeDesktopResize("column"),
            className:
              "group flex h-full w-[6px] items-center justify-center cursor-col-resize",
            title: "Ajustar ancho de secciones",
            children: c.jsx("span", {
              className:
                "block h-16 w-1 rounded-full bg-gray-300 transition group-hover:bg-primary/60 dark:bg-gray-700 dark:group-hover:bg-primary/70",
            }),
          }),
        }),
        c.jsxs("div", {
          className: isDesktopLayout
            ? w
              ? "col-start-1 row-start-3 bg-surface-light dark:bg-surface-dark p-5 rounded-3xl border border-border-light dark:border-border-dark shadow-card min-h-0 h-full overflow-hidden flex flex-col"
              : "col-start-1 row-start-3 bg-surface-light dark:bg-surface-dark p-5 rounded-3xl border border-border-light dark:border-border-dark shadow-card min-h-0 h-full overflow-hidden flex flex-col"
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
                    ? "space-y-2 pr-1 flex-1 min-h-0 overflow-y-auto ios-scroll"
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
            ? "col-start-3 row-start-1 row-span-3 bg-surface-light dark:bg-surface-dark p-4 rounded-3xl border border-border-light dark:border-border-dark shadow-card min-h-0 h-full flex flex-col"
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
                ? "pr-0 flex-1 min-h-0 overflow-y-auto overscroll-contain ios-scroll"
                : "pr-1 max-h-[240px] overflow-y-auto overscroll-contain ios-scroll",
              children: filteredHomeClientsInMission.map((o) => {
                const N = getHomeClientMissionAnnotatedTotals(o.products || [], w.id),
                  A = getClientShoppingHistoryEntries(o),
                  vl = A.reduce(
                    (El, Se) => El + toNumber(Se && Se.balance, 0),
                    0,
                  );
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
                                  `inline-flex items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 rounded-md text-[9px] font-bold ${vl < 0 ? "bg-emerald-100 text-emerald-800" : vl > 0 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"}`,
                                children: [
                                  vl < 0 ? "A favor: " : "Deuda: ",
                                  "$",
                                  formatAmount(Math.abs(vl)),
                                ],
                              }),
                              c.jsxs("span", {
                                className:
                                  "inline-flex items-center gap-0.5 whitespace-nowrap px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[9px] font-bold",
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
                              const A = `client-history-${o.id}`;
                              if (copiedClientShareLinks.includes(A)) {
                                setCopiedClientShareLinks((vl) =>
                                  vl.filter((El) => El !== A),
                                );
                                return;
                              }
                              copyClientMissionShareLink(null, o);
                            },
                            className:
                              `w-8 h-8 rounded-md border flex items-center justify-center transition ${
                                copiedClientShareLinks.includes(`client-history-${o.id}`)
                                  ? "border-sky-300 bg-sky-100 text-sky-700 dark:border-sky-700 dark:bg-sky-950/35 dark:text-sky-200"
                                  : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-200"
                              }`,
                            title: copiedClientShareLinks.includes(`client-history-${o.id}`)
                              ? "Link copiado"
                              : "Copiar link del cliente",
                            children: c.jsx("span", {
                              className: "material-symbols-outlined text-[14px]",
                              children: copiedClientShareLinks.includes(`client-history-${o.id}`)
                                ? "done"
                                : "share",
                            }),
                          }),
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
            ? "col-start-3 row-start-1 row-span-3 text-center py-12 bg-surface-light dark:bg-surface-dark rounded-3xl border border-border-light dark:border-border-dark shadow-card min-h-0 h-full flex flex-col items-center justify-center"
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
              ? "col-start-1 row-start-1 bg-surface-light dark:bg-surface-dark p-4 rounded-3xl border border-border-light dark:border-border-dark shadow-card h-full overflow-y-auto"
              : "col-start-1 row-start-1 bg-surface-light dark:bg-surface-dark p-4 rounded-3xl border border-border-light dark:border-border-dark shadow-card h-full overflow-y-auto"
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
                        ? `${getMissionStoreLabel(w)} • ${w.status}${activeMissionPayerLabel ? ` • Paga: ${activeMissionPayerLabel}` : ""}`
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
                  className: "grid grid-cols-2 gap-2 text-right shrink-0",
                  children: [
                    c.jsxs("div", {
                      className:
                        "min-w-[118px] rounded-xl border border-white/10 bg-white/5 px-3 py-2",
                      children: [
                        c.jsx("p", {
                          className: isDesktopLayout
                            ? "text-[9px] font-black uppercase tracking-[0.14em] text-white/70"
                            : "text-[10px] font-black uppercase tracking-[0.12em] text-white/70",
                          children: "Compra",
                        }),
                        c.jsxs("span", {
                          className: isDesktopLayout
                            ? "mt-1 block text-[10px] font-semibold text-white"
                            : "mt-1 block text-[11px] font-semibold text-white",
                          children: [
                            "$",
                            missionPurchaseCost.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }),
                          ],
                        }),
                        missionPurchaseCostWithDiscount > 0 &&
                        c.jsxs("span", {
                          className: isDesktopLayout
                            ? "mt-0.5 block text-[10px] font-semibold text-white"
                            : "mt-0.5 block text-[11px] font-semibold text-white",
                          children: [
                            "C/desc $",
                            missionPurchaseCostWithDiscount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }),
                          ],
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      className:
                        "min-w-[118px] rounded-xl border border-white/10 bg-white/5 px-3 py-2",
                      children: [
                        c.jsx("p", {
                          className: isDesktopLayout
                            ? "text-[9px] font-black uppercase tracking-[0.14em] text-white/70"
                            : "text-[10px] font-black uppercase tracking-[0.12em] text-white/70",
                          children: "Venta",
                        }),
                        c.jsxs("span", {
                          className: isDesktopLayout
                            ? "mt-1 block text-[10px] font-semibold text-white"
                            : "mt-1 block text-[11px] font-semibold text-white",
                          children: [
                            "$",
                            missionTotalWithTaxes.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }),
                          ],
                        }),
                        missionTotalWithDiscount > 0 &&
                        c.jsxs("span", {
                          className: isDesktopLayout
                            ? "mt-0.5 block text-[10px] font-semibold text-white"
                            : "mt-0.5 block text-[11px] font-semibold text-white",
                          children: [
                            "C/desc $",
                            missionTotalWithDiscount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
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
                                                    Number.isFinite(getProductQuickFinalPrice(gl)) &&
                                                      c.jsxs("span", {
                                                        className:
                                                          "shrink-0 rounded-full bg-white/18 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm",
                                                        children: [
                                                          "$",
                                                          formatProductQuickFinalPrice(gl),
                                                        ],
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
      const o = [...Kl]
        .filter(
          (N) =>
            N.name.toLowerCase().includes(j.toLowerCase()) ||
            (N.tags && N.tags.toLowerCase().includes(j.toLowerCase())),
        )
        .sort((N, A) => Number(N.id || 0) - Number(A.id || 0));
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
              ["AV", "PS", "BOTH"].includes(X) &&
              c.jsxs("button", {
                onClick: () => {
                  (Yt(""),
                    it(""),
                    setClientPhoneCountryCode("+52"),
                    z(""),
                    sl(""),
                    d(""),
                    setClientShippingAddresses([]),
                    k(!0));
                },
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
            : c.jsx("div", {
              className: isDesktopLayout
                ? "grid grid-cols-1 xl:grid-cols-2 gap-3"
                : "space-y-3",
              children: o.map((N) => {
              const A = Ei === N.id,
                vl = getHomeVisibleProducts(N),
                El = getHomeClientTotals(vl),
                ea = getClientShoppingHistoryEntries(N),
                totalClientItems = ea.reduce(
                  (gl, ae) =>
                    gl +
                    (Number.isFinite(ae.annotatedCount)
                      ? ae.annotatedCount
                      : ae.items.length),
                  0,
                ),
                totalClientSale = ea.reduce(
                  (gl, ae) => gl + ae.productsTotal,
                  0,
                ),
                totalClientBalance = ea.reduce(
                  (gl, ae) => gl + ae.balance,
                  0,
                );
                return c.jsxs(
                "div",
                {
                  className:
                    "rounded-3xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark overflow-hidden group shadow-card ui-card-quiet",
                  children: [
                    c.jsxs("div", {
                      className:
                        "px-3 py-3 sm:px-4 sm:py-4 flex flex-wrap items-start gap-3 relative",
                      children: [
                        c.jsx("div", {
                          className:
                            "w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base uppercase border border-primary/15",
                          children: N.name.charAt(0),
                        }),
                        c.jsxs("div", {
                          className: "flex-1 basis-0 min-w-0 cursor-pointer",
                          onClick: () => ge(A ? null : N.id),
                          children: [
                            c.jsx("h3", {
                              className: "font-bold text-sm",
                              children: N.name,
                            }),
                            c.jsxs("p", {
                              className: "text-xs text-gray-500",
                              children: [
                                totalClientItems,
                                " items • ",
                                (N.receipts || []).length,
                                " tickets",
                              ],
                            }),
                            c.jsxs("div", {
                              className:
                                "mt-2 grid grid-cols-2 gap-2 w-full max-w-none sm:max-w-[18rem] min-w-0",
                              children: [
                                c.jsxs("div", {
                                  className:
                                    `rounded-xl border px-2 py-2 min-w-0 overflow-hidden ${
                                      totalClientBalance < 0
                                        ? "border-emerald-200 bg-emerald-50/90 shadow-[0_12px_24px_-22px_rgba(5,150,105,0.45)]"
                                        : totalClientBalance > 0
                                          ? "border-slate-300 bg-slate-100/95 shadow-[0_12px_24px_-22px_rgba(71,85,105,0.35)]"
                                          : "border-slate-200 bg-slate-50/95 shadow-[0_12px_24px_-22px_rgba(100,116,139,0.22)]"
                                    }`,
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        `text-[9px] font-black uppercase tracking-[0.08em] ${
                                          totalClientBalance < 0
                                            ? "text-emerald-700/75"
                                            : totalClientBalance > 0
                                              ? "text-slate-700/75"
                                              : "text-slate-500/75"
                                        }`,
                                      children:
                                        totalClientBalance < 0 ? "A favor" : "Deuda",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        `mt-0.5 text-[11px] sm:text-[13px] font-extrabold leading-none truncate tabular-nums ${
                                          totalClientBalance < 0
                                            ? "text-emerald-800"
                                            : totalClientBalance > 0
                                              ? "text-slate-800"
                                              : "text-slate-600"
                                        }`,
                                      children: [
                                        "$",
                                        formatAmount(Math.abs(totalClientBalance)),
                                      ],
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
                                      children: [
                                        "$",
                                        formatAmount(totalClientSale || El.sale),
                                      ],
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
                            "w-full sm:w-auto shrink-0 self-start flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1.5 pt-0.5",
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
                                  onClick: () => Ta(N),
                                  className:
                                    "w-7 h-7 rounded-full flex items-center justify-center hover:bg-primary/10 text-primary dark:text-violet-300 dark:hover:bg-violet-950/30",
                                  title: "Open Full Gallery",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[15px]",
                                    children: "photo_library",
                                  }),
                                }),
                                c.jsx("button", {
                                  onClick: () => openClientPaymentModal(N),
                                  className:
                                    "w-7 h-7 rounded-full flex items-center justify-center hover:bg-emerald-100 text-emerald-600 dark:text-emerald-300 dark:hover:bg-emerald-950/30",
                                  title: "Pago del cliente",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[15px]",
                                    children: "payments",
                                  }),
                                }),
                                c.jsx("button", {
                                  onClick: () => {
                                    (Y(N),
                                      hl({
                                        name: N.name,
                                        tags: N.tags || "",
                                        status: N.status,
                                        phone_country_code:
                                          N.phone_country_code || "+52",
                                        phone: N.phone || "",
                                        email: N.email || "",
                                        shipping_address:
                                          N.shipping_address || "",
                                        shipping_addresses:
                                          Array.isArray(N.shipping_addresses)
                                            ? N.shipping_addresses
                                            : [],
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
                                    `material-symbols-outlined text-gray-400 text-[15px] cursor-pointer ui-disclosure-chevron ${
                                      A ? "ui-disclosure-chevron-open" : ""
                                    }`,
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
                    c.jsx("div", {
                      className: "ui-disclosure-panel ui-disclosure-panel-open",
                      children: c.jsx("div", {
                        className: "ui-disclosure-inner",
                        children: c.jsxs("div", {
                          className:
                            "border-t border-border-light dark:border-border-dark px-4 py-3",
                          children: [
                        !!getClientPhoneDisplay(N) &&
                        c.jsxs("p", {
                          className: "text-[10px] text-gray-500 mb-1",
                          children: ["📱 ", getClientPhoneDisplay(N)],
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
                        Array.isArray(N.shipping_addresses) &&
                        N.shipping_addresses.length > 0 &&
                        c.jsx("div", {
                          className: "mb-2 space-y-1",
                          children: N.shipping_addresses.map((o, A) =>
                            c.jsxs(
                              "p",
                              {
                                className: "text-[10px] text-gray-500",
                                children: ["📍 ", o],
                              },
                              `client-extra-shipping-${N.id}-${A}`,
                            ),
                          ),
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
                                            openClientShoppingGallery(
                                              N,
                                              ea,
                                            ),
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
                                                    Number.isFinite(ea.annotatedCount)
                                                      ? ea.annotatedCount
                                                      : ea.items.length,
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
                                                        "inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700",
                                                      children: [
                                                        "Venta: $",
                                                        formatAmount(ea.productsTotal),
                                                      ],
                                                    }),
                                                    c.jsxs("span", {
                                                      className:
                                                        "inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700",
                                                      children: [
                                                        "Pagado: $",
                                                        formatAmount(ea.paymentsTotal),
                                                      ],
                                                    }),
                                                    c.jsxs("span", {
                                                      className:
                                                        `inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                                          ea.balance < 0
                                                            ? "bg-emerald-50 text-emerald-700"
                                                            : "bg-slate-100 text-slate-700"
                                                        }`,
                                                      children: [
                                                        ea.balance < 0
                                                          ? "A favor: $"
                                                          : "Deuda: $",
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
                                                c.jsx("button", {
                                                  type: "button",
                                                  onClick: (gl) => {
                                                    gl.stopPropagation();
                                                    setOpenHistoryMissionByClient(
                                                      (ae) => ({
                                                        ...ae,
                                                        [N.id]:
                                                          ae[N.id] === ea.key
                                                            ? null
                                                            : ea.key,
                                                      }),
                                                    );
                                                  },
                                                  className:
                                                    "w-7 h-7 rounded-md text-gray-500 hover:bg-gray-200/70 dark:hover:bg-gray-700/70 flex items-center justify-center",
                                                  title: "Ver desglose",
                                                  children: c.jsx("span", {
                                                    className:
                                                      `material-symbols-outlined text-[14px] ui-disclosure-chevron ${
                                                        openHistoryMissionByClient[N.id] ===
                                                        ea.key
                                                          ? "ui-disclosure-chevron-open"
                                                          : ""
                                                      }`,
                                                    children: "expand_more",
                                                  }),
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        openHistoryMissionByClient[N.id] ===
                                        ea.key &&
                                        c.jsx("div", {
                                          className:
                                            "ui-disclosure-panel ui-disclosure-panel-open",
                                          children: c.jsx("div", {
                                            className: "ui-disclosure-inner",
                                            children: c.jsx("div", {
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
                                                  children: "Historial de abonos",
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
                                                                    gl.updated_at ||
                                                                    gl.created_at
                                                                      ? new Date(
                                                                        gl.updated_at ||
                                                                          gl.created_at,
                                                                      ).toLocaleString()
                                                                      : "Sin fecha",
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
                                                                "inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700",
                                                              children: [
                                                                "Venta: $",
                                                                formatAmount(Pi),
                                                              ],
                                                            }),
                                                            c.jsxs("span", {
                                                              className:
                                                                `inline-flex items-center gap-0.5 whitespace-nowrap rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                                                  bi < 0
                                                                    ? "bg-emerald-100 text-emerald-700"
                                                                    : bi > 0
                                                                      ? "bg-slate-200 text-slate-700"
                                                                      : "bg-emerald-100 text-emerald-700"
                                                                }`,
                                                              children: [
                                                                bi < 0
                                                                  ? "A favor: $"
                                                                  : "Deuda: $",
                                                                formatAmount(
                                                                  bi < 0
                                                                    ? Math.abs(bi)
                                                                    : bi,
                                                                ),
                                                              ],
                                                            }),
                                                          ],
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
                                                                            paymentLocalShoppingDiscount(gl),
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
                                            c.jsx("div", {
                                              className:
                                                "rounded-lg border border-sky-100 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/20 px-2.5 py-2",
                                              children: c.jsxs("button", {
                                                type: "button",
                                                onClick: () =>
                                                  openClientShoppingGallery(
                                                    N,
                                                    ea,
                                                  ),
                                                className:
                                                  "w-full flex items-center justify-between gap-2 text-left text-sky-700 dark:text-sky-200",
                                                children: [
                                                  c.jsxs("div", {
                                                    className: "min-w-0",
                                                    children: [
                                                      c.jsx("p", {
                                                        className:
                                                          "text-[10px] font-bold uppercase tracking-wide",
                                                        children: "Galeria",
                                                      }),
                                                      c.jsxs("p", {
                                                        className:
                                                          "text-[10px] text-sky-700/80 dark:text-sky-200/80",
                                                        children: [
                                                          "Abre la galeria de esta shopping para ver ",
                                                          ea.items.length,
                                                          " producto(s).",
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-[15px]",
                                                    children: "open_in_new",
                                                  }),
                                                ],
                                              }),
                                            }),
                                          ],
                                        }),
                                      }),
                                    }),
                                      ],
                                    },
                                    ea.key,
                                  ),
                                ),
                              }),
                            ],
                          }),
                        ],
                      }),
                    }),
                  }),
                ],
              },
              N.id,
            );
          }),
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
                children: o.map((N) => {
                  const A = isShipmentExpanded(N.id),
                    vl =
                      Number(shipmentForm.id) === Number(N.id)
                        ? shipmentForm
                        : getShipmentFormState(N),
                    El = canEditShipmentBox(N),
                    Se =
                      A && Number(shipmentForm.id) === Number(N.id)
                        ? shipmentSelectedProducts
                        : N.products_detail || [];
                  return c.jsxs(
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
                                    ? "text-base font-bold text-text-main dark:text-white truncate"
                                    : "text-sm font-bold text-text-main dark:text-white truncate",
                                  children: N.client_name || "Cliente",
                                }),
                                c.jsxs("p", {
                                  className: isDesktopLayout
                                    ? "text-[12px] text-text-sub truncate"
                                    : "text-[11px] text-text-sub truncate",
                                  children: [
                                    N.carrier || "Paqueteria sin definir",
                                    " - ",
                                    N.product_count || 0,
                                    " items - ",
                                    N.created_at
                                      ? new Date(N.created_at).toLocaleDateString() : "Sin fecha",
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
                                      children: getShipmentSalePriceAmount(N) <= 0
                                        ? "Gratis"
                                        : [
                                            "$",
                                            formatAmount(
                                              getShipmentSalePriceAmount(N),
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
                                  onClick: () => toggleExpandedShipment(N),
                                  className:
                                    "w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                  children: c.jsx("span", {
                                    className: `material-symbols-outlined text-[16px] ui-disclosure-chevron ${
                                      A ? "ui-disclosure-chevron-open" : ""
                                    }`,
                                    children: "expand_more",
                                  }),
                                }),
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () => openShipmentEvidencePicker(N),
                                  disabled: shipmentEvidenceUploadingId === N.id,
                                  className:
                                    "w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60",
                                  title: "Agregar evidencia",
                                  children: c.jsx("span", {
                                    className:
                                      `material-symbols-outlined text-[16px] ${
                                        shipmentEvidenceUploadingId === N.id ? "animate-spin" : ""
                                      }`,
                                    children:
                                      shipmentEvidenceUploadingId === N.id
                                        ? "progress_activity"
                                        : "add",
                                  }),
                                }),
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () => copyClientShipmentHistoryLink(N),
                                  className:
                                    "w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                                  title: "Copiar link del cliente con este envio abierto",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[16px]",
                                    children: copiedClientShareLinks.includes(
                                      `shipment-client-history-share-${N.id}`,
                                    )
                                      ? "done"
                                      : "link",
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
                        c.jsx("div", {
                          className: `ui-disclosure-panel ${
                            A ? "ui-disclosure-panel-open" : ""
                          }`,
                          children: c.jsx("div", {
                            className: "ui-disclosure-inner",
                            children: c.jsxs("div", {
                              className: "space-y-2.5 pt-0.5",
                              children: [
                            c.jsxs("div", {
                              className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
                              children: [
                                c.jsxs("label", {
                                  className:
                                    "rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-text-sub",
                                      children: "Paqueteria",
                                    }),
                                    c.jsx("select", {
                                      value: vl.carrier,
                                      onChange: (qa) =>
                                        updateShipmentForm("carrier", qa.target.value),
                                      className:
                                        "mt-1 w-full bg-transparent text-xs font-semibold outline-none",
                                      children: SHIPMENT_CARRIER_OPTIONS.map((qa) =>
                                        c.jsx(
                                          "option",
                                          {
                                            value: qa.value,
                                            children: qa.label,
                                          },
                                          `shipment-inline-carrier-${qa.value || "empty"}`,
                                        ),
                                      ),
                                    }),
                                  ],
                                }),
                                c.jsxs("label", {
                                  className:
                                    "rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-text-sub",
                                      children: "Guia",
                                    }),
                                    c.jsx("input", {
                                      type: "text",
                                      value: vl.tracking_number,
                                      onChange: (qa) =>
                                        updateShipmentForm("tracking_number", qa.target.value),
                                      placeholder: "Numero de rastreo",
                                      className:
                                        "mt-1 w-full bg-transparent text-xs font-semibold outline-none",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: "grid grid-cols-1 sm:grid-cols-4 gap-2",
                              children: [
                                c.jsxs("label", {
                                  className:
                                    "rounded-lg bg-slate-50 dark:bg-slate-900/50 px-2.5 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-text-sub",
                                      children: "Status",
                                    }),
                                    c.jsx("select", {
                                      value: vl.status,
                                      onChange: (qa) =>
                                        updateShipmentForm("status", qa.target.value),
                                      style: DARK_NATIVE_SELECT_STYLE,
                                      className:
                                        "mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-primary/40",
                                      children: [
                                        c.jsx("option", { value: "PENDING", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Pendiente" }, "shipment-inline-status-pending"),
                                        c.jsx("option", { value: "SHIPPED", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Enviado" }, "shipment-inline-status-shipped"),
                                        c.jsx("option", { value: "DELIVERED", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Entregado" }, "shipment-inline-status-delivered"),
                                        c.jsx("option", { value: "CANCELLED", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Cancelado" }, "shipment-inline-status-cancelled"),
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("label", {
                                  className:
                                    "rounded-lg bg-amber-50 dark:bg-amber-950/20 px-2.5 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300",
                                      children: "Costo de compra",
                                    }),
                                    c.jsx("input", {
                                      type: "text",
                                      inputMode: "decimal",
                                      value: vl.guide_price,
                                      onChange: (qa) =>
                                        updateShipmentForm("guide_price", qa.target.value),
                                      placeholder: "0.00",
                                      className:
                                        "mt-1 w-full bg-transparent text-xs font-semibold text-amber-800 dark:text-amber-200 outline-none",
                                    }),
                                  ],
                                }),
                                c.jsxs("label", {
                                  className:
                                    "rounded-lg bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300",
                                      children: "Costo de venta",
                                    }),
                                    c.jsx("input", {
                                      type: "text",
                                      inputMode: "decimal",
                                      value: vl.client_price,
                                      onChange: (qa) =>
                                        updateShipmentForm("client_price", qa.target.value),
                                      placeholder: "0.00",
                                      className:
                                        "mt-1 w-full bg-transparent text-xs font-semibold text-emerald-800 dark:text-emerald-200 outline-none",
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className:
                                    "rounded-lg bg-sky-50 dark:bg-sky-950/20 px-2.5 py-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300",
                                      children: "Items",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "mt-1 text-xs font-semibold text-sky-800 dark:text-sky-100",
                                      children: [Se.length || 0, " producto(s)"],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("label", {
                              className:
                                "block rounded-lg bg-gray-50 dark:bg-gray-900/40 px-2.5 py-2",
                              children: [
                                c.jsx("p", {
                                  className:
                                    "text-[10px] uppercase font-bold text-text-sub",
                                  children: "Direccion de envio",
                                }),
                                getClientShipmentAddressOptions(vl.client).length > 1 &&
                                c.jsxs("select", {
                                  value: vl.shipping_address,
                                  onChange: (qa) =>
                                    updateShipmentForm("shipping_address", qa.target.value),
                                  style: DARK_NATIVE_SELECT_STYLE,
                                  className:
                                    "mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs font-semibold text-white outline-none focus:ring-2 focus:ring-primary/40",
                                  children: getClientShipmentAddressOptions(vl.client).map((qa, yo) =>
                                    c.jsx(
                                      "option",
                                      {
                                        value: qa,
                                        style: NATIVE_DROPDOWN_OPTION_STYLE,
                                        children: qa,
                                      },
                                      `shipment-inline-address-${yo}`,
                                    ),
                                  ),
                                }),
                                c.jsx("textarea", {
                                  rows: 2,
                                  value: vl.shipping_address,
                                  onChange: (qa) =>
                                    updateShipmentForm("shipping_address", qa.target.value),
                                  className:
                                    "mt-1 w-full bg-transparent text-xs text-text-main dark:text-slate-200 outline-none resize-none whitespace-pre-wrap",
                                  placeholder: "Sin direccion capturada",
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className:
                                "rounded-lg bg-sky-50 dark:bg-sky-950/20 px-2.5 py-2",
                              children: [
                                c.jsxs("div", {
                                  className: "flex items-center justify-between gap-2",
                                  children: [
                                    c.jsxs("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-sky-700 dark:text-sky-300",
                                      children: ["Productos (", Se.length || 0, ")"],
                                    }),
                                    El &&
                                    c.jsxs("button", {
                                      type: "button",
                                      onClick: () => setShipmentProductPickerOpen(!0),
                                      className:
                                        "inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 dark:text-sky-300",
                                      children: [
                                        c.jsx("span", {
                                          className:
                                            "material-symbols-outlined text-[13px]",
                                          children: "photo_library",
                                        }),
                                        "Galeria",
                                      ],
                                    }),
                                  ],
                                }),
                                Se.length > 0
                                  ? c.jsx("div", {
                                      className: "mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2",
                                      children: Se.map((qa) => {
                                        const vl = getProductPaymentAmount(qa),
                                          productStatusValue = String(
                                            (qa && qa.status) || "ANNOTATED",
                                          ).toUpperCase(),
                                          shipmentDisplayStatusValue =
                                            productStatusValue === "BOUGHT"
                                              ? "ANNOTATED"
                                              : productStatusValue,
                                          shipmentProductStatusActions = [
                                            {
                                              value: "ANNOTATED",
                                              label: "Anotado",
                                              icon: "edit_note",
                                            },
                                            {
                                              value: "SHIPPED",
                                              label: "Enviado",
                                              icon: "local_shipping",
                                            },
                                          ];
                                        return c.jsxs(
                                          "div",
                                          {
                                            className:
                                              "relative overflow-visible rounded-xl border border-sky-100 dark:border-sky-900 bg-white/90 dark:bg-slate-900/80 ui-media-card",
                                            children: [
                                              c.jsxs("div", {
                                                className: "relative text-left w-full",
                                                children: [
                                                  c.jsxs("div", {
                                                    className:
                                                      `absolute top-2 left-2 ${openProductStatusId === qa.id ? "z-50" : "z-20"}`,
                                                    "data-product-status": "1",
                                                    children: [
                                                      c.jsx("button", {
                                                        type: "button",
                                                        onClick: (o) => {
                                                          (o.stopPropagation(),
                                                            setOpenProductMenuId(null),
                                                            setOpenProductInfoId(null),
                                                            setOpenProductStatusId((N) =>
                                                              N === qa.id ? null : qa.id,
                                                            ));
                                                        },
                                                        className:
                                                          `w-6 h-6 rounded-full border shadow-sm backdrop-blur-[2px] flex items-center justify-center ${getProductStatusChipClassName(shipmentDisplayStatusValue)} ${productStatusUpdatingId === qa.id ? "opacity-70 cursor-wait" : ""}`,
                                                        title: `Cambiar status (${getProductStatusLabel(shipmentDisplayStatusValue)})`,
                                                        children: c.jsx("span", {
                                                          className:
                                                            `material-symbols-outlined text-[12px] ${productStatusUpdatingId === qa.id ? "animate-spin" : ""}`,
                                                          children:
                                                            productStatusUpdatingId === qa.id
                                                              ? "progress_activity"
                                                              : shipmentDisplayStatusValue ===
                                                                  "SHIPPED"
                                                                  ? "local_shipping"
                                                                  : "edit_note",
                                                        }),
                                                      }),
                                                      openProductStatusId === qa.id &&
                                                      c.jsxs("div", {
                                                        className:
                                                          "absolute left-0 top-8 z-40 min-w-[118px] rounded-xl border border-slate-200/90 bg-white/96 p-1 shadow-xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/96",
                                                        children: [
                                                          c.jsx("div", {
                                                            className:
                                                              "px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400",
                                                            children: "Cambiar status",
                                                          }),
                                                          shipmentProductStatusActions.map((o) =>
                                                            c.jsxs(
                                                              "button",
                                                              {
                                                                type: "button",
                                                                onClick: (N) => {
                                                                  (N.stopPropagation(),
                                                                    setOpenProductStatusId(null),
                                                                    setShipmentProductStatusQuick(
                                                                      qa.id,
                                                                      o.value,
                                                                    ));
                                                                },
                                                                disabled:
                                                                  productStatusUpdatingId === qa.id,
                                                                className:
                                                                  "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 disabled:opacity-60 disabled:cursor-wait",
                                                                children: [
                                                                  c.jsx("span", {
                                                                    children: o.label,
                                                                  }),
                                                                  c.jsx("span", {
                                                                    className:
                                                                      "material-symbols-outlined text-[13px]",
                                                                    children: o.icon,
                                                                  }),
                                                                ],
                                                              },
                                                              `shipment-status-${qa.id}-${o.value}`,
                                                            ),
                                                          ),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  qa.image
                                                    ? c.jsx("img", {
                                                        src: resolveMediaUrl(qa.image),
                                                        className:
                                                          "w-full aspect-[4/5] object-cover cursor-zoom-in rounded-t-xl",
                                                        onClick: (o) => {
                                                          o.stopPropagation();
                                                          setFullscreenImage({
                                                            url: resolveMediaUrl(qa.image),
                                                            copyOnClick: !0,
                                                            copyMessage: "Imagen copiada.",
                                                          });
                                                        },
                                                        title: "Abrir imagen",
                                                      })
                                                    : c.jsx("div", {
                                                        className:
                                                          "w-full aspect-[4/5] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 rounded-t-xl",
                                                        children: c.jsx("span", {
                                                          className:
                                                            "material-symbols-outlined text-[18px]",
                                                          children: "image",
                                                        }),
                                                      }),
                                                  Number.isFinite(vl) &&
                                                  c.jsx("div", {
                                                    className:
                                                      "absolute inset-x-0 bottom-2 z-20 flex justify-center pointer-events-none",
                                                    children: c.jsxs("span", {
                                                      className:
                                                        "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                                      children: [
                                                        "$",
                                                        formatAmount(vl),
                                                      ],
                                                    }),
                                                  }),
                                                  c.jsx("div", {
                                                    className:
                                                      "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/78 via-black/45 to-transparent px-2 py-2 pb-8",
                                                    children: [
                                                      c.jsx("p", {
                                                        className:
                                                          "text-[10px] font-bold text-white truncate",
                                                        children: qa.name,
                                                      }),
                                                      c.jsxs("div", {
                                                        className:
                                                          "mt-1 flex flex-wrap items-center gap-1",
                                                        children: [
                                                          c.jsx("span", {
                                                            className:
                                                              "inline-flex max-w-full truncate rounded-full bg-white/16 px-1.5 py-0.5 text-[9px] font-semibold text-white/92 backdrop-blur-sm",
                                                            children:
                                                              qa.shopping_name ||
                                                              qa.mission_name ||
                                                              qa.store_name ||
                                                              "Sin shopping",
                                                          }),
                                                          (qa.shopping_date ||
                                                            qa.mission_date) &&
                                                          c.jsx("span", {
                                                            className:
                                                              "inline-flex shrink-0 rounded-full bg-white/14 px-1.5 py-0.5 text-[9px] font-semibold text-white/80 backdrop-blur-sm",
                                                            children: new Date(
                                                              qa.shopping_date ||
                                                                qa.mission_date,
                                                            ).toLocaleDateString(),
                                                          }),
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                  El &&
                                                  c.jsx("button", {
                                                    type: "button",
                                                    onClick: (o) => {
                                                      (o.stopPropagation(),
                                                        toggleShipmentProductSelection(qa));
                                                    },
                                                    className:
                                                      "absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-black/55 text-white flex items-center justify-center hover:bg-black/70",
                                                    children: c.jsx("span", {
                                                      className:
                                                        "material-symbols-outlined text-[14px]",
                                                      children: "close",
                                                    }),
                                                  }),
                                                ],
                                              }),
                                            ],
                                          },
                                          `shipment-inline-product-${N.id}-${qa.id}`,
                                        );
                                      }),
                                    })
                                  : c.jsx("p", {
                                      className:
                                        "mt-1 text-xs text-sky-700/80 dark:text-sky-300/80",
                                      children: El
                                        ? "Abre la galeria para elegir productos."
                                        : "Sin productos asignados.",
                                    }),
                              ],
                            }),
                            c.jsxs("div", {
                              className: "flex items-center gap-2",
                              children: [
                                c.jsx("button", {
                                  type: "button",
                                  onClick: () => resetExpandedShipmentForm(N),
                                  disabled: shipmentSaving,
                                  className:
                                    "flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-60",
                                  children: "Restablecer",
                                }),
                                c.jsx("button", {
                                  type: "button",
                                  onClick: saveShipmentEditor,
                                  disabled: shipmentSaving,
                                  className:
                                    "flex-1 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark text-xs font-semibold disabled:opacity-60",
                                  children: shipmentSaving ? "Guardando..." : "Guardar cambios",
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className:
                                "rounded-lg bg-violet-50 dark:bg-violet-950/20 px-2.5 py-1.5",
                              children: [
                                c.jsxs("div", {
                                  className: "flex items-center justify-between gap-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-[10px] uppercase font-bold text-violet-700 dark:text-violet-300",
                                      children: "Evidencia",
                                    }),
                                    c.jsxs("button", {
                                      type: "button",
                                      onClick: () => openShipmentEvidencePicker(N),
                                      disabled: shipmentEvidenceUploadingId === N.id,
                                      className:
                                        "inline-flex items-center gap-1 text-[10px] font-bold text-violet-700 dark:text-violet-300 disabled:opacity-60",
                                      children: [
                                        c.jsx("span", {
                                          className:
                                            `material-symbols-outlined text-[13px] ${
                                              shipmentEvidenceUploadingId === N.id ? "animate-spin" : ""
                                            }`,
                                          children:
                                            shipmentEvidenceUploadingId === N.id
                                              ? "progress_activity"
                                              : "add",
                                        }),
                                        "Agregar",
                                      ],
                                    }),
                                  ],
                                }),
                                (N.evidence || []).length > 0
                                  ? c.jsx("div", {
                                      className:
                                        "mt-2 grid grid-cols-3 sm:grid-cols-4 gap-1.5",
                                      children: (N.evidence || []).map((A) => {
                                        const vl = getShipmentEvidenceKind(A);
                                        return c.jsxs(
                                          "div",
                                          {
                                            className:
                                              "relative overflow-visible rounded-xl border border-violet-100 dark:border-violet-900 bg-white/90 dark:bg-slate-900/80",
                                            children: [
                                              c.jsxs("div", {
                                                className: "absolute top-1.5 right-1.5 z-20",
                                                "data-shipment-evidence-menu": "1",
                                                children: [
                                                  c.jsx("button", {
                                                    type: "button",
                                                    onClick: (o) => {
                                                      (o.stopPropagation(),
                                                        setOpenShipmentEvidenceMenuId((N) =>
                                                          N === A.id ? null : A.id,
                                                        ));
                                                    },
                                                    className:
                                                      "w-5 h-5 rounded-full bg-white/38 text-gray-700 hover:bg-white/56 border border-white/35 shadow-sm backdrop-blur-[2px] flex items-center justify-center",
                                                    title: "Opciones de evidencia",
                                                    children: c.jsx("span", {
                                                      className:
                                                        "material-symbols-outlined text-[12px]",
                                                      children: "more_vert",
                                                    }),
                                                  }),
                                                  openShipmentEvidenceMenuId === A.id &&
                                                  c.jsxs("div", {
                                                    className:
                                                      "absolute right-0 top-7 z-30 w-36 rounded-xl border border-slate-200 bg-white shadow-lg p-1 dark:border-slate-700 dark:bg-slate-900",
                                                    children: [
                                                      c.jsxs("button", {
                                                        type: "button",
                                                        onClick: (o) => {
                                                          (o.stopPropagation(),
                                                            openShipmentEvidenceReplacePicker(N, A));
                                                        },
                                                        disabled:
                                                          shipmentEvidenceReplacingId === A.id,
                                                        className:
                                                          `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-blue-700 dark:text-blue-200 ${shipmentEvidenceReplacingId === A.id ? "opacity-60 cursor-wait bg-blue-50 dark:bg-blue-950/30" : "hover:bg-blue-50 dark:hover:bg-blue-950/30"}`,
                                                        children: [
                                                          c.jsx("span", {
                                                            className:
                                                              `material-symbols-outlined text-[14px] ${shipmentEvidenceReplacingId === A.id ? "animate-spin" : ""}`,
                                                            children:
                                                              shipmentEvidenceReplacingId === A.id
                                                                ? "progress_activity"
                                                                : "edit",
                                                          }),
                                                          shipmentEvidenceReplacingId === A.id
                                                            ? "Cambiando"
                                                            : "Cambiar",
                                                        ],
                                                      }),
                                                      c.jsxs("button", {
                                                        type: "button",
                                                        onClick: (o) => {
                                                          (o.stopPropagation(),
                                                            deleteShipmentEvidence(N, A.id));
                                                        },
                                                        disabled:
                                                          shipmentEvidenceDeletingId === A.id,
                                                        className:
                                                          `w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-red-700 dark:text-red-300 ${shipmentEvidenceDeletingId === A.id ? "opacity-60 cursor-wait bg-red-50 dark:bg-red-950/30" : "hover:bg-red-50 dark:hover:bg-red-950/30"}`,
                                                        children: [
                                                          c.jsx("span", {
                                                            className:
                                                              `material-symbols-outlined text-[14px] ${shipmentEvidenceDeletingId === A.id ? "animate-spin" : ""}`,
                                                            children:
                                                              shipmentEvidenceDeletingId === A.id
                                                                ? "progress_activity"
                                                                : "delete",
                                                          }),
                                                          shipmentEvidenceDeletingId === A.id
                                                            ? "Eliminando"
                                                            : "Eliminar",
                                                        ],
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              }),
                                              vl === "VIDEO"
                                                ? c.jsx("video", {
                                                    src: resolveMediaUrl(A.file),
                                                    controls: !0,
                                                    preload: "metadata",
                                                    className:
                                                      "w-full aspect-square bg-black object-cover",
                                                  })
                                                : c.jsx("img", {
                                                    src: resolveMediaUrl(A.file),
                                                    onClick: () =>
                                                      setFullscreenImage({
                                                        url: resolveMediaUrl(A.file),
                                                        copyOnClick: !0,
                                                        copyMessage: "Evidencia copiada.",
                                                      }),
                                                    className:
                                                      "w-full aspect-square object-cover cursor-zoom-in",
                                                  }),
                                              c.jsxs("div", {
                                                className:
                                                  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-1.5 py-1 flex items-end justify-between gap-1",
                                                children: [
                                                  c.jsx("span", {
                                                    className:
                                                      "text-[9px] font-bold uppercase text-white/90",
                                                    children:
                                                      vl === "VIDEO" ? "Video" : "Imagen",
                                                  }),
                                                  c.jsx("span", {
                                                    className:
                                                      "inline-flex h-5 w-5 shrink-0",
                                                  }),
                                                ],
                                              }),
                                            ],
                                          },
                                          `shipment-evidence-${N.id}-${A.id}`,
                                        );
                                      }),
                                    })
                                  : c.jsx("p", {
                                      className:
                                        "mt-1 text-xs text-violet-700/80 dark:text-violet-300/80",
                                      children: "Sin evidencia cargada.",
                                    }),
                              ],
                            }),
                          ],
                        }),
                      }),
                    }),
                  ],
                },
                N.id,
              );
                }),
              }),
        ],
      });
    },
    persistDefaultBreakdownTemplate = (o) => {
      setDefaultBreakdownTemplate(o);
      localStorage.setItem("default_breakdown_template", o);
    },
    saveProfileSettings = async () => {
      if (!J || profileSettingsSaving) return;
      const o = String((profileSettingsForm.display_name || "")).trim(),
        N = String((profileSettingsForm.phone || "")).trim(),
        A = String((J && J.profile && J.profile.display_name) || "").trim(),
        vl = String((J && J.profile && J.profile.phone) || "").trim();
      if (o === A && N === vl) return;
      setProfileSettingsSaving(!0);
      try {
        const El = await I("/auth/me/", {
          method: "PATCH",
          body: JSON.stringify({
            display_name: o,
            phone: N,
          }),
        });
        El && (b(El), notifySuccess("Perfil guardado."));
      } catch (El) {
        console.error("Failed saving profile settings", El);
        notifyError("No se pudo guardar la configuracion del perfil.");
      } finally {
        setProfileSettingsSaving(!1);
      }
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
                children: String(
                  (profileSettingsForm.display_name || "").trim() || J.username,
                )
                  .charAt(0)
                  .toUpperCase(),
              }),
              c.jsx("h2", {
                className: "text-2xl font-bold text-center",
                children:
                  String((profileSettingsForm.display_name || "").trim()) ||
                  J.username,
              }),
              c.jsxs("p", {
                className: "mt-1 text-center text-sm text-text-sub",
                children: ["@", J.username],
              }),
              c.jsx("span", {
                className:
                  "inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-700 font-bold text-xs uppercase rounded-full",
                children: J.profile.role,
              }),
              !!String((profileSettingsForm.phone || "").trim()) &&
                c.jsxs("p", {
                  className: "mt-4 text-sm text-text-main text-center",
                  children: ["Tel: ", String((profileSettingsForm.phone || "").trim())],
                }),
            ],
          }),
          c.jsxs("div", {
            className: isDesktopLayout
              ? "bg-surface-light p-5 rounded-3xl border shadow-card space-y-4"
              : "bg-surface-light p-4 rounded-2xl border shadow-card space-y-3",
            children: [
              c.jsxs("div", {
                className: "space-y-1 pb-1 border-b border-border-light dark:border-border-dark",
                children: [
                  c.jsx("h3", {
                    className: "text-base font-bold text-text-main",
                    children: "Configuraciones",
                  }),
                  c.jsx("p", {
                    className: "text-xs text-text-sub",
                    children:
                      "Tabla base del perfil para ir agregando ajustes por seccion.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className: "space-y-3",
                children: [
                  c.jsxs("div", {
                    children: [
                      c.jsx("h3", {
                        className: "text-sm font-bold text-text-main",
                        children: "Datos del perfil",
                      }),
                      c.jsx("p", {
                        className: "text-xs text-text-sub mt-1",
                        children: "Nombre visible y telefono del usuario.",
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: "grid gap-3 md:grid-cols-2",
                    children: [
                      c.jsxs("label", {
                        className: "block",
                        children: [
                          c.jsx("span", {
                            className:
                              "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: "Nombre",
                          }),
                          c.jsx("input", {
                            type: "text",
                            value: profileSettingsForm.display_name,
                            onChange: (o) =>
                              setProfileSettingsForm((N) => ({
                                ...N,
                                display_name: o.target.value,
                              })),
                            placeholder: J.username,
                            className:
                              "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                          }),
                        ],
                      }),
                      c.jsxs("label", {
                        className: "block",
                        children: [
                          c.jsx("span", {
                            className:
                              "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                            children: "Telefono",
                          }),
                          c.jsx("input", {
                            type: "text",
                            value: profileSettingsForm.phone,
                            onChange: (o) =>
                              setProfileSettingsForm((N) => ({
                                ...N,
                                phone: o.target.value,
                              })),
                            placeholder: "5512345678",
                            className:
                              "w-full px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary/40",
                          }),
                        ],
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: "flex flex-wrap items-center gap-2",
                    children: [
                      c.jsxs("span", {
                        className:
                          "inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-[11px] font-semibold text-text-sub",
                        children: ["Usuario: @", J.username],
                      }),
                      c.jsx("button", {
                        type: "button",
                        onClick: saveProfileSettings,
                        disabled:
                          profileSettingsSaving ||
                          (String((profileSettingsForm.display_name || "")).trim() ===
                            String((J.profile && J.profile.display_name) || "").trim() &&
                            String((profileSettingsForm.phone || "")).trim() ===
                              String((J.profile && J.profile.phone) || "").trim()),
                        className:
                          `px-4 py-2 rounded-xl text-xs font-bold transition ${
                            profileSettingsSaving ||
                            (String((profileSettingsForm.display_name || "")).trim() ===
                              String((J.profile && J.profile.display_name) || "").trim() &&
                              String((profileSettingsForm.phone || "")).trim() ===
                                String((J.profile && J.profile.phone) || "").trim())
                              ? "bg-gray-200 text-gray-400 dark:bg-gray-800 dark:text-gray-500 cursor-not-allowed"
                              : "bg-primary text-white hover:bg-primary-dark"
                          }`,
                        children: profileSettingsSaving
                          ? "Guardando..."
                          : "Guardar datos",
                      }),
                    ],
                  }),
                ],
              }),
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
                    children: "Configuracion de desglose",
                  }),
                  c.jsx("p", {
                    className: "mt-1 text-xs text-text-sub",
                    children:
                      "Editor libre del texto por default. Ya no usa bloques visuales.",
                  }),
                ],
              }),
              c.jsx("p", {
                className: "text-[11px] text-text-sub",
                children:
                  "Variables disponibles: {title} • {items} • {total} • {subtotal} • {discount_percentage} • {discount_amount} • {client_name} • {shopping_name}",
              }),
              c.jsx("textarea", {
                value: defaultBreakdownTemplate,
                onChange: (o) => {
                  persistDefaultBreakdownTemplate(o.target.value);
                },
                rows: 10,
                className:
                  "w-full rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 px-3 py-3 text-xs text-text-main dark:text-white outline-none focus:ring-2 focus:ring-primary/40 whitespace-pre-wrap",
              }),
              c.jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  c.jsx("button", {
                    type: "button",
                    onClick: () =>
                      persistDefaultBreakdownTemplate(
                        DEFAULT_BREAKDOWN_TEMPLATE,
                      ),
                    className:
                      "px-3 py-2 rounded-lg bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200 text-xs font-bold",
                    children: "Reset",
                  }),
                  c.jsx("p", {
                    className: "text-[11px] text-text-sub",
                    children:
                      "Se guarda en este navegador y puedes editarlo manualmente.",
                  }),
                ],
              }),
              c.jsxs("div", {
                className:
                  "rounded-2xl border border-dashed border-border-light dark:border-border-dark px-4 py-4",
                children: [
                  c.jsx("h3", {
                    className: "text-sm font-bold text-text-main",
                    children: "Por definir",
                  }),
                  c.jsx("p", {
                    className: "mt-1 text-xs text-text-sub",
                    children:
                      "Espacio reservado para mas cambios dentro de esta tabla de configuraciones.",
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
              onClick={() => applyCalcModeChange("FACTOR")}
              className={`py-2 text-xs font-bold rounded-lg transition ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`}
            >
              Factor
            </button>
            <button
              onClick={() => applyCalcModeChange("PERCENTAGE")}
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
                onChange={(e) => applyCalcFactorChange(e.target.value)}
                className="calc-input mt-1 w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-amber-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Descuento (%)</label>
              <input
                type="number"
                step="0.01"
                value={calcDiscount}
                onChange={(e) => applyCalcDiscountChange(e.target.value)}
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
                  onChange={(e) => applyCalcDiscountChange(e.target.value)}
                  className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Taxes (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={calcTaxes}
                  onChange={(e) => applyCalcTaxesChange(e.target.value)}
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
                  onChange={(e) => applyCalcCommissionChange(e.target.value)}
                  className="calc-input mt-1 w-full px-2 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white caret-gray-900 dark:caret-white outline-none focus:ring-2 focus:ring-emerald-300"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-300">Tipo de Cambio</label>
                <input
                  type="number"
                  step="0.01"
                  value={calcExchangeRate}
                  onChange={(e) => applyCalcExchangeRateChange(e.target.value)}
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
          ? "bg-emerald-600 text-white text-xs p-2 flex justify-center gap-4 z-50 relative shadow-md ml-20"
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
          ? "sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark transition-colors duration-200 ml-20"
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
          ? "flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark ml-20"
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
                  children: [
                    c.jsx("label", {
                      className: "text-[10px] font-semibold text-gray-500",
                      children: "Quien pagara",
                    }),
                    c.jsxs("select", {
                      value: missionStartForm.payer,
                      onChange: (o) =>
                        setMissionStartForm({
                          ...missionStartForm,
                          payer: o.target.value,
                        }),
                      className:
                        "mt-1 w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                      children: [
                        c.jsx("option", {
                          value: "",
                          disabled: !0,
                          children: payerUserOptions.length
                            ? "Selecciona quien pagara"
                            : "Sin usuarios disponibles",
                        }),
                        payerUserOptions.map((o) =>
                          c.jsx(
                            "option",
                            {
                              value: o.id,
                              children: getUserOptionLabel(o),
                            },
                            `mission-payer-${o.id}`,
                          ),
                        ),
                      ],
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
                                    Number.isFinite(getProductQuickFinalPrice(o)) &&
                                      c.jsxs("span", {
                                        className:
                                          "shrink-0 rounded-full bg-white/18 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur-sm",
                                        children: [
                                          "$",
                                          formatProductQuickFinalPrice(o),
                                        ],
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
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                          children: "Phone",
                        }),
                        c.jsxs("div", {
                          className:
                            "grid grid-cols-[112px_minmax(0,1fr)] gap-3",
                          children: [
                            c.jsx("input", {
                              type: "text",
                              value: clientPhoneCountryCode,
                              onChange: (o) =>
                                setClientPhoneCountryCode(
                                  sanitizeClientCountryCodeInput(
                                    o.target.value,
                                  ),
                                ),
                              placeholder: "+52",
                              maxLength: 8,
                              className:
                                "w-full px-4 py-3 text-lg border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                            }),
                            c.jsx("input", {
                              type: "tel",
                              inputMode: "numeric",
                              value: p,
                              onChange: (o) =>
                                z(sanitizeClientPhoneInput(o.target.value)),
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
                      value: rl,
                      onChange: (o) => d(o.target.value),
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
                          ? clientShippingAddresses.map((o, N) =>
                              c.jsxs(
                                "div",
                                {
                                  className: "flex gap-2 items-start",
                                  children: [
                                    c.jsx("textarea", {
                                      value: o,
                                      onChange: (A) =>
                                        setClientShippingAddresses(
                                          clientShippingAddresses.map(
                                            (vl, El) =>
                                              El === N ? A.target.value : vl,
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
                                            (A, vl) => vl !== N,
                                          ),
                                        ),
                                      className:
                                        "px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100",
                                      children: "Remove",
                                    }),
                                  ],
                                },
                                `create-client-shipping-${N}`,
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
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                          children: "Phone",
                        }),
                        c.jsxs("div", {
                          className:
                            "grid grid-cols-[112px_minmax(0,1fr)] gap-3",
                          children: [
                            c.jsx("input", {
                              type: "text",
                              value: ml.phone_country_code,
                              onChange: (o) =>
                                hl({
                                  ...ml,
                                  phone_country_code:
                                    sanitizeClientCountryCodeInput(
                                      o.target.value,
                                    ),
                                }),
                              placeholder: "+52",
                              maxLength: 8,
                              className:
                                "w-full px-4 py-3 text-lg border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                            }),
                            c.jsx("input", {
                              type: "tel",
                              inputMode: "numeric",
                              value: ml.phone,
                              onChange: (o) =>
                                hl({
                                  ...ml,
                                  phone: sanitizeClientPhoneInput(
                                    o.target.value,
                                  ),
                                }),
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
                      value: ml.shipping_address,
                      onChange: (o) =>
                        hl({ ...ml, shipping_address: o.target.value }),
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
                                hl({
                                  ...ml,
                                  shipping_addresses: [
                                    ...(Array.isArray(ml.shipping_addresses)
                                      ? ml.shipping_addresses
                                      : []),
                                    "",
                                  ],
                                }),
                              className:
                                "px-3 py-1.5 text-xs font-semibold rounded-xl ui-btn-secondary",
                              children: ["+", " Add"],
                            }),
                          ],
                        }),
                        Array.isArray(ml.shipping_addresses) &&
                        ml.shipping_addresses.length
                          ? ml.shipping_addresses.map((o, N) =>
                              c.jsxs(
                                "div",
                                {
                                  className: "flex gap-2 items-start",
                                  children: [
                                    c.jsx("textarea", {
                                      value: o,
                                      onChange: (A) =>
                                        hl({
                                          ...ml,
                                          shipping_addresses:
                                            ml.shipping_addresses.map(
                                              (vl, El) =>
                                                El === N ? A.target.value : vl,
                                            ),
                                        }),
                                      rows: 2,
                                      placeholder: "Additional shipping address",
                                      className:
                                        "flex-1 px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none resize-none",
                                    }),
                                    c.jsx("button", {
                                      type: "button",
                                      onClick: () =>
                                        hl({
                                          ...ml,
                                          shipping_addresses:
                                            ml.shipping_addresses.filter(
                                              (A, vl) => vl !== N,
                                            ),
                                        }),
                                      className:
                                        "px-3 py-2 text-xs font-semibold rounded-xl bg-red-50 text-red-500 hover:bg-red-100",
                                      children: "Remove",
                                    }),
                                  ],
                                },
                                `edit-client-shipping-${N}`,
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
            `bg-surface-light dark:bg-surface-dark w-full ${isDesktopLayout ? "sm:max-w-5xl rounded-3xl max-h-[92vh] overflow-y-auto" : "sm:max-w-md rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto"} p-6 shadow-2xl ui-sheet`,
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
                  className: isDesktopLayout ? "col-span-2" : "",
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Quien paga",
                    }),
                    c.jsxs("select", {
                      value: st.payer,
                      onChange: (o) => Gt({ ...st, payer: o.target.value }),
                      className:
                        "w-full px-4 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                      children: [
                        c.jsx("option", {
                          value: "",
                          disabled: !0,
                          children: payerUserOptions.length
                            ? "Selecciona quien pagara"
                            : "Sin usuarios disponibles",
                        }),
                        payerUserOptions.map((o) =>
                          c.jsx(
                            "option",
                            {
                              value: o.id,
                              children: getUserOptionLabel(o),
                            },
                            `product-payer-${o.id}`,
                          ),
                        ),
                      ],
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
                          onChange: (o) => {
                            setProductPriceSyncSource("real");
                            Gt({ ...st, real_price: o.target.value });
                          },
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
                            setProductPriceSyncSource("charged");
                            Gt({ ...st, charged_price: o.target.value });
                          },
                          className: productFinalInputClass,
                          required: !0,
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className:
                    `${isDesktopLayout ? "col-span-2 " : ""}flex items-center justify-between gap-3 rounded-xl px-1 py-1`,
                  children: [
                    c.jsxs("div", {
                      className: "flex items-center gap-2 min-w-0",
                      children: [
                        c.jsx("span", {
                          className:
                            "text-xs font-semibold text-text-sub dark:text-slate-300 truncate",
                          children: "Calculo automatico",
                        }),
                        c.jsxs("div", {
                          className: "relative shrink-0",
                          onMouseEnter: () => setProductPriceAutoInfoOpen(!0),
                          onMouseLeave: () => setProductPriceAutoInfoOpen(!1),
                          children: [
                            c.jsx("button", {
                              type: "button",
                              onClick: () =>
                                setProductPriceAutoInfoOpen((o) => !o),
                              onFocus: () => setProductPriceAutoInfoOpen(!0),
                              onBlur: () => setProductPriceAutoInfoOpen(!1),
                              title:
                                "Si esta activo, al cambiar Store Price o Final Price se recalcula el otro segun el factor o porcentaje. Si lo desactivas, ambos precios se editan por separado.",
                              className:
                                "w-5 h-5 rounded-full border border-fuchsia-200 text-fuchsia-700 dark:border-fuchsia-800 dark:text-fuchsia-300 inline-flex items-center justify-center hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950/40 transition",
                              "aria-label": "Info de calculo automatico",
                              "aria-expanded": productPriceAutoInfoOpen,
                              "aria-describedby": "product-price-auto-info",
                              children: c.jsx("span", {
                                className: "material-symbols-outlined text-[12px] leading-none",
                                children: "info",
                              }),
                            }),
                            productPriceAutoInfoOpen &&
                            c.jsx("div", {
                              id: "product-price-auto-info",
                              className:
                                "absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-2xl border border-fuchsia-200 bg-white/98 px-3 py-2 text-[11px] leading-5 text-fuchsia-900 shadow-xl dark:border-fuchsia-900 dark:bg-slate-950 dark:text-fuchsia-100",
                              children:
                                "Si esta activo, al cambiar Store Price o Final Price se recalcula el otro segun el factor o porcentaje. Si lo desactivas, ambos precios se editan por separado.",
                            }),
                          ],
                        }),
                      ],
                    }),
                    c.jsx("button", {
                      type: "button",
                      role: "switch",
                      "aria-checked": productPriceAutoSync,
                      onClick: () => setProductPriceAutoSync((o) => !o),
                      className:
                        `relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition ${productPriceAutoSync ? "bg-primary border-primary" : "bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700"}`,
                      children: c.jsx("span", {
                        className:
                          `inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition ${productPriceAutoSync ? "translate-x-6" : "translate-x-1"}`,
                      }),
                    }),
                  ],
                }),
                showProductDiscountFields &&
                c.jsxs("div", {
                  className:
                    `${isDesktopLayout ? "col-span-2 " : ""}grid grid-cols-2 gap-4`,
                  children: [
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-xs font-medium text-amber-700 dark:text-amber-300 mb-1",
                          children: "Store Price con descuento (USD)",
                        }),
                        c.jsx("input", {
                          type: "text",
                          readOnly: !0,
                          value: Number.isFinite(productStoreDiscountedPrice)
                            ? productStoreDiscountedPrice.toFixed(2)
                            : "",
                          className:
                            "w-full px-3 py-2 border rounded-xl border-amber-200 bg-amber-50/85 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-100 font-semibold outline-none",
                        }),
                      ],
                    }),
                    c.jsxs("div", {
                      children: [
                        c.jsx("label", {
                          className:
                            "block text-xs font-medium text-amber-700 dark:text-amber-300 mb-1",
                          children: "Final Price con descuento (MXN)",
                        }),
                        c.jsx("input", {
                          type: "text",
                          readOnly: !0,
                          value: Number.isFinite(productFinalDiscountedPrice)
                            ? productFinalDiscountedPrice.toFixed(2)
                            : "",
                          className:
                            "w-full px-3 py-2 border rounded-xl border-amber-200 bg-amber-50/85 dark:bg-amber-950/20 dark:border-amber-800 text-amber-800 dark:text-amber-100 font-semibold outline-none",
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
                          onClick: () => applyCalcModeChange("FACTOR"),
                          className: `py-2 text-xs font-bold rounded-lg transition ${calcMode === "FACTOR" ? "bg-primary text-white" : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"}`,
                          children: "Factor",
                        }),
                        c.jsx("button", {
                          type: "button",
                          onClick: () => applyCalcModeChange("PERCENTAGE"),
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
                      c.jsxs("div", {
                        className: "grid grid-cols-2 gap-3",
                        children: [
                          c.jsxs("div", {
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
                                onChange: (o) => applyCalcFactorChange(o.target.value),
                                className:
                                  `${productCalcInputClass} px-4 py-2`,
                              }),
                            ],
                          }),
                          c.jsxs("div", {
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
                                onChange: (o) => applyCalcDiscountChange(o.target.value),
                                className:
                                  `${productCalcInputClass} px-4 py-2`,
                              }),
                            ],
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
                            onChange: (o) => applyCalcDiscountChange(o.target.value),
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
                            onChange: (o) => applyCalcTaxesChange(o.target.value),
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
                            onChange: (o) => applyCalcCommissionChange(o.target.value),
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
                            onChange: (o) => applyCalcExchangeRateChange(o.target.value),
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
                      children:
                        productModalCanChooseShopping || productModalPinnedShopping
                          ? "Shopping"
                          : "Store",
                    }),
                    productModalCanChooseShopping
                      ? c.jsxs("div", {
                        className:
                          "rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-3 dark:border-sky-800 dark:bg-sky-950/30 space-y-2",
                        children: [
                          c.jsx("input", {
                            type: "text",
                            value: productModalShoppingSearch,
                            onChange: (o) =>
                              setProductModalShoppingSearch(o.target.value),
                            placeholder: "Buscar shopping o fecha...",
                            className:
                              "w-full px-3 py-2 border rounded-xl dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none",
                          }),
                          productModalSelectedShopping &&
                          c.jsxs("div", {
                            className:
                              "rounded-xl border border-sky-300/60 bg-white/80 px-3 py-2 dark:border-sky-700 dark:bg-slate-900/60",
                            children: [
                              c.jsx("p", {
                                className:
                                  "text-sm font-semibold text-sky-900 dark:text-sky-100",
                                children:
                                  getMissionStoreLabel(productModalSelectedShopping) ||
                                  productModalSelectedShopping.name ||
                                  "Sin shopping asignada",
                              }),
                              c.jsx("p", {
                                className:
                                  "mt-1 text-[11px] text-sky-700/80 dark:text-sky-300/80",
                                children: productModalSelectedShopping.start_time
                                  ? new Date(productModalSelectedShopping.start_time).toLocaleDateString()
                                  : "Sin fecha",
                              }),
                            ],
                          }),
                          c.jsx("div", {
                            className:
                              "max-h-36 overflow-y-auto ios-scroll space-y-1 pr-1",
                            children: productModalFilteredShoppingOptions.length > 0
                              ? productModalFilteredShoppingOptions
                                .slice(0, 6)
                                .map((o) =>
                                  c.jsxs(
                                    "button",
                                    {
                                      type: "button",
                                      onClick: () => {
                                        Gt({
                                          ...st,
                                          shopping: String(o.id),
                                          store:
                                            o && o.store !== null &&
                                            typeof o.store !== "undefined"
                                              ? String(o.store)
                                              : "",
                                        });
                                        setProductModalShoppingSearch("");
                                      },
                                      className:
                                        `w-full text-left rounded-xl border px-3 py-2 transition ${
                                          Number(st.shopping || 0) === Number(o.id)
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-sky-200 bg-white/80 text-slate-700 hover:border-primary/40 hover:bg-white dark:border-sky-900 dark:bg-slate-900/60 dark:text-slate-100 dark:hover:border-primary/50 dark:hover:bg-slate-900"
                                        }`,
                                      children: [
                                        c.jsx("p", {
                                          className: "text-sm font-semibold truncate",
                                          children:
                                            getMissionStoreLabel(o) ||
                                            o.name ||
                                            `Shopping #${o.id}`,
                                        }),
                                        c.jsx("p", {
                                          className:
                                            "mt-0.5 text-[11px] text-slate-500 dark:text-slate-400",
                                          children: o.start_time
                                            ? new Date(o.start_time).toLocaleDateString()
                                            : "Sin fecha",
                                        }),
                                      ],
                                    },
                                    `product-shopping-search-${o.id}`,
                                  ),
                                )
                              : c.jsx("p", {
                                className:
                                  "px-1 py-2 text-xs text-sky-700/80 dark:text-sky-300/80",
                                children: productModalShoppingOptions.length
                                  ? "Sin coincidencias."
                                  : "Sin shoppings disponibles.",
                              }),
                          }),
                        ],
                      })
                      : productModalPinnedShopping
                      ? c.jsxs("div", {
                        className:
                          "rounded-xl border border-sky-200 bg-sky-50/80 px-3 py-2 dark:border-sky-800 dark:bg-sky-950/30",
                        children: [
                          c.jsx("p", {
                            className: "text-sm font-semibold text-sky-900 dark:text-sky-100",
                            children:
                              getMissionStoreLabel(productModalPinnedShopping) ||
                              productModalPinnedShopping.name ||
                              "Sin shopping asignada",
                          }),
                          productModalPinnedShopping.start_time &&
                          c.jsx("p", {
                            className:
                              "mt-1 text-[11px] text-sky-700/80 dark:text-sky-300/80",
                            children: new Date(
                              productModalPinnedShopping.start_time,
                            ).toLocaleDateString(),
                          }),
                        ],
                      })
                      : w
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
                      className: "grid grid-cols-3 gap-2",
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
                            className: `px-2 py-2 rounded-xl text-[11px] leading-tight font-bold border transition ${st.status === o ? "bg-primary text-white border-primary" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary/50"}`,
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
                        !modalHasRequiredProductFields,
                      className:
                        `flex-1 py-3 font-semibold rounded-xl ui-btn-primary ${(productModalMode === "create" && newProductUploading) || !modalHasRequiredProductFields ? "opacity-75 cursor-not-allowed" : ""}`,
                      children:
                        productModalMode === "create"
                          ? newProductUploading
                            ? "Creando..."
                            : "Crear producto"
                          : "Save Changes",
                    }),
                  ],
                }),
                !modalHasRequiredProductFields &&
                c.jsx("p", {
                  className: `${isDesktopLayout ? "col-span-2" : ""} text-xs font-medium text-rose-600 dark:text-rose-300`,
                  children:
                    "Debes capturar el nombre, Store Price (USD) y Final Price (MXN) para guardar este producto. Cancelar sigue disponible.",
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
                    className: "flex items-start justify-between gap-3",
                    children: [
                      c.jsxs("div", {
                        className: "min-w-0 flex items-center gap-4 flex-1",
                        children: [
                          c.jsx("div", {
                            className:
                              "w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl uppercase border shrink-0",
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
                                      `inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold ${selectedClientHomeGlobalBalance < 0 ? "text-emerald-700 dark:text-emerald-300" : selectedClientHomeGlobalBalance > 0 ? "text-rose-700 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"}`,
                                    children: [
                                      selectedClientHomeGlobalBalance < 0
                                        ? "A favor: "
                                        : "Deuda: ",
                                      "$",
                                      formatAmount(Math.abs(selectedClientHomeGlobalBalance)),
                                    ],
                                  }),
                                  c.jsxs("p", {
                                    className:
                                      "inline-flex items-center gap-0.5 whitespace-nowrap text-[11px] font-bold text-blue-700 dark:text-blue-300",
                                    children: [
                                      "Venta: $",
                                      formatAmount(selectedClientHomeAnnotatedTotals.sale),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        ],
                      }),
                      c.jsx("button", {
                        type: "button",
                        onClick: () => {
                          const o = `client-history-${W.id}`;
                          if (copiedClientShareLinks.includes(o)) {
                            setCopiedClientShareLinks((N) =>
                              N.filter((A) => A !== o),
                            );
                            return;
                          }
                          copyClientMissionShareLink(null, W);
                        },
                        className:
                          `w-9 h-9 rounded-full border shrink-0 flex items-center justify-center transition ${copiedClientShareLinks.includes(`client-history-${W.id}`) ? "border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-800 dark:bg-sky-950/35 dark:text-sky-200" : "border-border-light dark:border-border-dark bg-white/80 dark:bg-slate-900/70 text-violet-600 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-950/30"}`,
                        title: "Copiar link del cliente",
                        children: c.jsx("span", {
                          className: "material-symbols-outlined text-[18px]",
                          children: "share",
                        }),
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: "flex gap-2",
                    children: [
                      c.jsxs("span", {
                        className:
                          `flex-1 rounded-lg border px-2 py-1.5 shadow-sm text-center flex flex-col items-center justify-center gap-0.5 ${selectedClientHomeGlobalBalance < 0 ? "border-emerald-200 bg-emerald-50/90" : selectedClientHomeGlobalBalance > 0 ? "border-rose-200 bg-rose-50/95" : "border-slate-200 bg-slate-50/95"}`,
                        children: [
                          c.jsx("span", {
                            className:
                              `text-[9px] font-black uppercase ${selectedClientHomeGlobalBalance < 0 ? "text-emerald-700/75" : selectedClientHomeGlobalBalance > 0 ? "text-rose-700/75" : "text-slate-700/75"}`,
                            children:
                              selectedClientHomeGlobalBalance < 0
                                ? "A favor"
                                : "Deuda",
                          }),
                          c.jsxs("span", {
                            className:
                              selectedClientHomeGlobalBalance < 0
                                ? "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-emerald-800"
                                : selectedClientHomeGlobalBalance > 0
                                  ? "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-rose-800"
                                  : "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-slate-800",
                            children: [
                              "$",
                              formatAmount(Math.abs(selectedClientHomeGlobalBalance)),
                            ],
                          }),
                        ],
                      }),
                      c.jsxs("span", {
                        className:
                          "flex-1 rounded-lg border border-blue-200 bg-blue-50/95 px-2 py-1.5 shadow-sm text-center flex flex-col items-center justify-center gap-0.5",
                        children: [
                          c.jsx("span", {
                            className:
                              "text-[9px] font-black uppercase text-blue-700/75",
                            children: "Venta",
                          }),
                          c.jsxs("span", {
                            className:
                              "inline-flex items-center justify-center whitespace-nowrap text-sm font-bold text-blue-800",
                            children: ["$", formatAmount(selectedClientHomeAnnotatedTotals.sale)],
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
                          currentGalleryStatus = getUnifiedReviewState(
                            getProductReviewState(o, reviewEntry || null),
                          ),
                          galleryStatusActions = getChatStatusActionOptions(
                            currentGalleryStatus,
                          ),
                          galleryStatusButtonTone =
                            currentGalleryStatus === "REVIEW"
                              ? "bg-amber-100/88 text-amber-800 border-amber-200/80 hover:bg-amber-100"
                              : currentGalleryStatus === "REJECTED"
                                ? "bg-rose-100/88 text-rose-800 border-rose-200/80 hover:bg-rose-100"
                                : "bg-emerald-100/88 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100",
                          isPendingReview =
                            reviewEntry && reviewEntry.status === "PENDING",
                          isAltReady =
                            reviewEntry &&
                            reviewEntry.status === "ALTERNATIVE_SENT";
                        return c.jsxs(
                          "div",
                          {
                            className: `bg-surface-light dark:bg-surface-dark ${isDesktopLayout ? "rounded-2xl" : "rounded-lg"} overflow-visible shadow-card border flex flex-col relative group ui-card-quiet ui-media-card ${hasPulse ? "review-item-alert border-red-400 bg-red-50/40 dark:bg-red-950/18" : "border-border-light dark:border-border-dark"}`,
                            children: [
                              hasPulse &&
                              c.jsx("span", {
                                className:
                                  "absolute top-1.5 left-1.5 z-20 w-2.5 h-2.5 rounded-full bg-red-500 border border-white dark:border-slate-900",
                              }),
                              c.jsxs("div", {
                                className: "absolute top-1.5 right-1.5 z-30",
                                "data-product-menu": "1",
                                children: [
                                  c.jsx("button", {
                                    onClick: (N) => {
                                      (N.stopPropagation(),
                                        setOpenProductInfoId(null),
                                        setOpenProductStatusId(null),
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
                                      "absolute right-0 top-9 z-40 w-36 rounded-xl border border-gray-200 bg-white shadow-lg p-1 ui-pop",
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
                                      setOpenProductStatusId(null),
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
                                  c.jsxs("div", {
                                    className: "absolute left-0.5 bottom-0.5 z-20",
                                    "data-product-status": "1",
                                    children: [
                                      c.jsx("button", {
                                        onClick: (N) => {
                                          (N.stopPropagation(),
                                            setOpenProductInfoId(null),
                                            setOpenProductMenuId(null),
                                            setOpenProductStatusId((A) =>
                                              A === o.id ? null : o.id,
                                            ));
                                        },
                                        disabled: productStatusUpdatingId === o.id,
                                        className:
                                          `w-6 h-6 rounded-full border shadow-sm backdrop-blur-[2px] flex items-center justify-center ${galleryStatusButtonTone} ${productStatusUpdatingId === o.id ? "opacity-70 cursor-wait" : ""}`,
                                        title: `Cambiar status (${getReviewFlowLabel(currentGalleryStatus)})`,
                                        children: c.jsx("span", {
                                          className:
                                            `material-symbols-outlined text-[12px] ${productStatusUpdatingId === o.id ? "animate-spin" : ""}`,
                                          children:
                                            productStatusUpdatingId === o.id
                                              ? "progress_activity"
                                              : currentGalleryStatus === "REVIEW"
                                                ? "pending_actions"
                                                : currentGalleryStatus === "REJECTED"
                                                  ? "cancel"
                                                  : "task_alt",
                                        }),
                                      }),
                                      openProductStatusId === o.id &&
                                      c.jsxs("div", {
                                        className:
                                          "absolute left-0 bottom-7 min-w-[116px] rounded-xl border border-slate-200/90 bg-white/96 p-1 shadow-xl backdrop-blur-md dark:border-slate-700/80 dark:bg-slate-900/96",
                                        children: [
                                          c.jsx("div", {
                                            className:
                                              "px-2 pb-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400",
                                            children: "Cambiar status",
                                          }),
                                          galleryStatusActions.map((N) =>
                                            c.jsxs(
                                              "button",
                                              {
                                                onClick: (A) => {
                                                  (A.stopPropagation(),
                                                    setGalleryProductStatus(
                                                      o,
                                                      reviewEntry || null,
                                                      N.value,
                                                    ));
                                                },
                                                disabled:
                                                  productStatusUpdatingId === o.id,
                                                className:
                                                  "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-[11px] text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80 disabled:opacity-60 disabled:cursor-wait",
                                                children: [
                                                  c.jsx("span", {
                                                    children: N.label,
                                                  }),
                                                  c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-[13px]",
                                                    children:
                                                      N.value === "REVIEW"
                                                        ? "pending_actions"
                                                        : N.value === "REJECTED"
                                                          ? "cancel"
                                                          : "task_alt",
                                                  }),
                                                ],
                                              },
                                              N.value,
                                            ),
                                          ),
                                        ],
                                      }),
                                    ],
                                  }),
                                  Number.isFinite(getProductImagePrimaryPrice(o)) &&
                                  c.jsx("div", {
                                    className:
                                      "absolute inset-x-0 bottom-0.5 z-20 flex justify-center pointer-events-none",
                                    children: hasProductDiscountedFinalPrice(o)
                                      ? c.jsxs("div", {
                                        className:
                                          "inline-flex flex-col items-center gap-0.5 rounded-2xl bg-white/82 dark:bg-slate-900/82 px-2.5 py-1 text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                        children: [
                                          c.jsxs("span", {
                                            className:
                                              "whitespace-nowrap text-[9px] font-bold",
                                            children: [
                                              "Venta $",
                                              formatAmount(
                                                getProductBaseFinalPrice(o),
                                              ),
                                            ],
                                          }),
                                          c.jsxs("span", {
                                            className:
                                              "whitespace-nowrap text-[9px] font-black text-emerald-700 dark:text-emerald-300",
                                            children: [
                                              "C/desc $",
                                              formatProductQuickFinalPrice(o),
                                            ],
                                          }),
                                        ],
                                      })
                                      : c.jsxs("span", {
                                        className:
                                          "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                        children: [
                                          "$",
                                          formatAmount(
                                            getProductImagePrimaryPrice(o),
                                          ),
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
                                          setOpenProductStatusId(null),
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
          "fixed inset-x-0 top-4 z-[120] flex flex-col items-center gap-2 px-4 pointer-events-none",
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
      imageSourceDialog &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[99] bg-black/50 flex items-end sm:items-center justify-center p-4 ui-backdrop",
          "image-source",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl p-5 sm:p-6 ui-sheet overflow-hidden",
            "image-source",
          ),
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className:
                "relative overflow-hidden rounded-3xl border border-sky-200/70 dark:border-sky-500/20 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.16),transparent_48%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(245,248,252,0.96))] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_46%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(10,15,29,0.98))] p-4 sm:p-5 flex items-start gap-3",
              children: [
                c.jsx("div", {
                  className:
                    "w-11 h-11 rounded-2xl grid place-items-center bg-white/90 dark:bg-sky-500/14 text-sky-700 dark:text-sky-300 shadow-sm",
                  children: c.jsx("span", {
                    className:
                      "material-symbols-outlined inline-flex items-center justify-center leading-none text-[22px]",
                    children: "imagesmode",
                  }),
                }),
                c.jsxs("div", {
                  className: "flex-1",
                  children: [
                    c.jsx("p", {
                      className:
                        "text-[10px] font-black uppercase tracking-[0.18em] text-sky-700/75 dark:text-sky-300/75",
                      children: imageSourceDialog.eyebrow || "Fuente de imagen",
                    }),
                    c.jsxs("div", {
                      className: "mt-1 flex items-center gap-2",
                      children: [
                        c.jsx("h3", {
                          className:
                            "text-lg font-black text-text-main dark:text-white leading-tight",
                          children: imageSourceDialog.title || "Seleccionar imagen",
                        }),
                        c.jsx("button", {
                          type: "button",
                          onClick: () =>
                            setImageSourceInfoOpen((o) =>
                              o === "header" ? null : "header",
                            ),
                          title:
                            imageSourceDialog.description ||
                            "Elige si quieres tomar la imagen del dispositivo o del portapapeles.",
                          className:
                            "shrink-0 w-5 h-5 rounded-full border border-sky-200 text-sky-700 dark:border-sky-700 dark:text-sky-300 inline-flex items-center justify-center hover:bg-sky-50 dark:hover:bg-sky-950/40 transition",
                          "aria-label": "Informacion del selector",
                          "aria-expanded": imageSourceInfoOpen === "header",
                          children: c.jsx("span", {
                            className:
                              "material-symbols-outlined text-[12px] leading-none",
                            children: "info",
                          }),
                        }),
                      ],
                    }),
                    imageSourceInfoOpen === "header" &&
                    c.jsx("div", {
                      className:
                        "mt-2 rounded-2xl border border-sky-200/80 bg-white/92 px-3 py-2 text-[11px] leading-5 text-sky-900 shadow-sm dark:border-sky-800 dark:bg-slate-950/80 dark:text-sky-100",
                      children:
                        imageSourceDialog.description ||
                        "Elige si quieres tomar la imagen del dispositivo o del portapapeles.",
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "mt-5 grid grid-cols-1 gap-3",
              children: [
                c.jsxs("button", {
                  type: "button",
                  onClick: pickImageFromDevice,
                  className:
                    "group w-full rounded-3xl border border-border-light dark:border-border-dark px-4 py-4 text-left bg-white/88 dark:bg-slate-900/75 hover:bg-white dark:hover:bg-slate-900 transition flex items-center gap-3 shadow-sm hover:shadow-md",
                  children: [
                    c.jsx("span", {
                      className:
                        "shrink-0 w-12 h-12 rounded-2xl bg-violet-100 dark:bg-violet-500/14 text-violet-700 dark:text-violet-300 grid place-items-center",
                      children: c.jsx("span", {
                        className:
                          "material-symbols-outlined inline-flex items-center justify-center leading-none text-[24px]",
                        children: "folder_open",
                      }),
                    }),
                    c.jsxs("span", {
                      className: "flex-1 flex flex-col min-w-0",
                      children: [
                        c.jsxs("span", {
                          className: "flex items-center gap-2 min-w-0",
                          children: [
                            c.jsx("span", {
                              className:
                                "text-sm font-bold text-text-main dark:text-white truncate",
                              children:
                                imageSourceDialog.deviceLabel ||
                                "Elegir del dispositivo",
                            }),
                            c.jsx("span", {
                              role: "button",
                              tabIndex: 0,
                              onClick: (o) => {
                                o.stopPropagation(),
                                  setImageSourceInfoOpen((N) =>
                                    N === "device" ? null : "device",
                                  );
                              },
                              onKeyDown: (o) => {
                                (o.key === "Enter" || o.key === " ") &&
                                  (o.preventDefault(),
                                  setImageSourceInfoOpen((N) =>
                                    N === "device" ? null : "device",
                                  ));
                              },
                              title:
                                imageSourceDialog.deviceDescription ||
                                (imageSourceDialog.multiple
                                  ? "Abre tu galeria o archivos y selecciona una o varias imagenes."
                                  : "Abre tu galeria o archivos y selecciona una imagen."),
                              className:
                                "shrink-0 w-5 h-5 rounded-full border border-violet-200 text-violet-700 dark:border-violet-800 dark:text-violet-300 inline-flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-950/40 transition cursor-pointer",
                              children: c.jsx("span", {
                                className:
                                  "material-symbols-outlined text-[12px] leading-none",
                                children: "info",
                              }),
                            }),
                          ],
                        }),
                        c.jsx("span", {
                          className:
                            "hidden",
                          children:
                            imageSourceDialog.multiple
                              ? "Abre tu galeria o archivos y selecciona una o varias imagenes."
                              : "Abre tu galeria o archivos y selecciona una imagen.",
                        }),
                        imageSourceInfoOpen === "device" &&
                        c.jsx("span", {
                          className:
                            "mt-2 rounded-2xl border border-violet-200 bg-white/92 px-3 py-2 text-[11px] leading-5 text-violet-900 shadow-sm dark:border-violet-900 dark:bg-slate-950/80 dark:text-violet-100",
                          children:
                            imageSourceDialog.deviceDescription ||
                            (imageSourceDialog.multiple
                              ? "Abre tu galeria o archivos y selecciona una o varias imagenes."
                              : "Abre tu galeria o archivos y selecciona una imagen."),
                        }),
                      ],
                    }),
                    c.jsx("span", {
                      className:
                        "material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5",
                      children: "arrow_forward_ios",
                    }),
                  ],
                }),
                c.jsxs("button", {
                  type: "button",
                  onClick: pickImageFromClipboard,
                  className:
                    "group w-full rounded-3xl border border-border-light dark:border-border-dark px-4 py-4 text-left bg-white/88 dark:bg-slate-900/75 hover:bg-white dark:hover:bg-slate-900 transition flex items-center gap-3 shadow-sm hover:shadow-md",
                  children: [
                    c.jsx("span", {
                      className:
                        "shrink-0 w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/14 text-emerald-700 dark:text-emerald-300 grid place-items-center",
                      children: c.jsx("span", {
                        className:
                          "material-symbols-outlined inline-flex items-center justify-center leading-none text-[24px]",
                        children: "content_paste",
                      }),
                    }),
                    c.jsxs("span", {
                      className: "flex-1 flex flex-col min-w-0",
                      children: [
                        c.jsxs("span", {
                          className: "flex items-center gap-2 min-w-0",
                          children: [
                            c.jsx("span", {
                              className:
                                "text-sm font-bold text-text-main dark:text-white truncate",
                              children:
                                imageSourceDialog.clipboardLabel ||
                                "Usar portapapeles",
                            }),
                            c.jsx("span", {
                              role: "button",
                              tabIndex: 0,
                              onClick: (o) => {
                                o.stopPropagation(),
                                  setImageSourceInfoOpen((N) =>
                                    N === "clipboard" ? null : "clipboard",
                                  );
                              },
                              onKeyDown: (o) => {
                                (o.key === "Enter" || o.key === " ") &&
                                  (o.preventDefault(),
                                  setImageSourceInfoOpen((N) =>
                                    N === "clipboard" ? null : "clipboard",
                                  ));
                              },
                              title:
                                imageSourceDialog.clipboardDescription ||
                                "Pega la imagen que ya copiaste y usala al instante sin buscar archivos.",
                              className:
                                "shrink-0 w-5 h-5 rounded-full border border-emerald-200 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300 inline-flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer",
                              children: c.jsx("span", {
                                className:
                                  "material-symbols-outlined text-[12px] leading-none",
                                children: "info",
                              }),
                            }),
                          ],
                        }),
                        c.jsx("span", {
                          className:
                            "hidden",
                          children:
                            "Pega la imagen que ya copiaste y usala al instante sin buscar archivos.",
                        }),
                        imageSourceInfoOpen === "clipboard" &&
                        c.jsx("span", {
                          className:
                            "mt-2 rounded-2xl border border-emerald-200 bg-white/92 px-3 py-2 text-[11px] leading-5 text-emerald-900 shadow-sm dark:border-emerald-900 dark:bg-slate-950/80 dark:text-emerald-100",
                          children:
                            imageSourceDialog.clipboardDescription ||
                            "Pega la imagen que ya copiaste y usala al instante sin buscar archivos.",
                        }),
                      ],
                    }),
                    c.jsx("span", {
                      className:
                        "material-symbols-outlined text-[18px] text-slate-400 dark:text-slate-500 transition-transform group-hover:translate-x-0.5",
                      children: "arrow_forward_ios",
                    }),
                  ],
                }),
              ],
            }),
            c.jsx("button", {
              type: "button",
              onClick: () => dismissActiveOverlayRef.current(),
              className:
                "mt-4 w-full py-2.5 rounded-2xl border border-border-light dark:border-border-dark bg-white/75 dark:bg-slate-900/70 hover:bg-white dark:hover:bg-slate-900 text-sm font-semibold text-text-main dark:text-white transition",
              children: "Cerrar",
            }),
          ],
        }),
      }),
      confirmDialog &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[96] bg-black/45 flex items-end sm:items-center justify-center p-4 ui-backdrop",
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
      clientPaymentModalOpen &&
      c.jsx("div", {
        className: overlayBackdropClass(
          "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
          "client-payment-modal",
        ),
        onClick: () => dismissActiveOverlayRef.current(),
        children: c.jsxs("div", {
          className: overlaySheetClass(
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-6xl max-h-[88vh] rounded-t-3xl sm:rounded-3xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet flex flex-col overflow-hidden",
            "client-payment-modal",
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
                      children: "Pago del cliente",
                    }),
                    c.jsxs("p", {
                      className: "text-[11px] text-text-sub mt-0.5",
                      children: [
                        clientPaymentModalClient
                          ? clientPaymentModalClient.name
                          : "Cliente",
                        " • se abona del shopping mas antiguo al mas reciente",
                      ],
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
                                      children: "Shoppings del pago",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "text-[11px] text-text-sub mt-0.5",
                                      children: [
                                        clientPaymentReceivingTargets.length,
                                        " de ",
                                        clientPaymentTargets.length,
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("span", {
                                  className:
                                    "inline-flex rounded-full bg-violet-100 px-2 py-1 text-[10px] font-bold text-violet-700",
                                  children: [
                                    "Abono: $",
                                    formatAmount(clientPaymentAllocatedTotal),
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        clientPaymentTargets.length === 0
                          ? c.jsx("div", {
                            className:
                              "px-4 py-10 text-sm text-center text-text-sub",
                            children:
                              "Este cliente no tiene shoppings con deuda pendiente.",
                          })
                          : c.jsx("div", {
                            className:
                              "max-h-[52vh] overflow-y-auto ios-scroll p-3 space-y-2",
                            children: clientPaymentPlan.map((o) =>
                              c.jsxs(
                                "div",
                                {
                                  className:
                                    `rounded-2xl border px-3 py-3 transition ${
                                      o.isReceiving
                                        ? "border-violet-400 bg-violet-50 dark:border-violet-700 dark:bg-violet-950/30"
                                        : "border-border-light bg-white dark:border-border-dark dark:bg-slate-900/50"
                                    }`,
                                  children: [
                                    c.jsxs("div", {
                                      className:
                                        "flex items-start justify-between gap-3",
                                      children: [
                                        c.jsxs("div", {
                                          className: "min-w-0 flex-1",
                                          children: [
                                            c.jsx("p", {
                                              className:
                                                "text-sm font-semibold truncate text-text-main dark:text-white",
                                              children: o.title,
                                            }),
                                            c.jsxs("p", {
                                              className:
                                                "text-[11px] text-text-sub mt-0.5",
                                              children: [
                                                o.date
                                                  ? new Date(o.date).toLocaleDateString()
                                                  : "Sin fecha",
                                                " • ",
                                                Number.isFinite(o.annotatedCount)
                                                  ? o.annotatedCount
                                                  : o.items.length,
                                                " item(s)",
                                              ],
                                            }),
                                            c.jsxs("div", {
                                              className:
                                                "mt-2 flex flex-wrap gap-1",
                                              children: [
                                                c.jsxs("span", {
                                                  className:
                                                    "inline-flex rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-700",
                                                  children: [
                                                    "Venta: $",
                                                    formatAmount(o.productsTotal),
                                                  ],
                                                }),
                                                c.jsxs("span", {
                                                  className:
                                                    "inline-flex rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700",
                                                  children: [
                                                    "Pagado: $",
                                                    formatAmount(o.paymentsTotal),
                                                  ],
                                                }),
                                                c.jsxs("span", {
                                                  className:
                                                    "inline-flex rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold text-slate-700",
                                                  children: [
                                                    "Deuda: $",
                                                    formatAmount(o.debtAmount),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                        c.jsxs("div", {
                                          className:
                                            "shrink-0 text-right flex flex-col items-end gap-1",
                                          children: [
                                            o.isReceiving
                                              ? c.jsx("span", {
                                                className:
                                                  "inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700",
                                                children:
                                                  c.jsx("span", {
                                                    className:
                                                      "material-symbols-outlined text-[16px]",
                                                    children: "check_circle",
                                                  }),
                                              })
                                              : null,
                                            o.isReceiving &&
                                            c.jsxs("span", {
                                              className:
                                                "text-[11px] font-bold text-violet-700 dark:text-violet-300",
                                              children: [
                                                "Abona $",
                                                formatAmount(o.appliedAmount),
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                },
                                `client-payment-shopping-${o.key}`,
                              ),
                            ),
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
                                  value: clientPaymentForm.amount,
                                  onChange: (o) => {
                                    setClientPaymentAmountManual(!0);
                                    setClientPaymentForm((N) => ({
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
                                    c.jsx("span", {
                                      className:
                                        "text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80",
                                      children: `Deuda total: $${formatAmount(clientPaymentTotalDebt)}`,
                                    }),
                                    c.jsx("button", {
                                      type: "button",
                                      onClick: () => {
                                        setClientPaymentAmountManual(!1);
                                        setClientPaymentForm((N) => ({
                                          ...N,
                                          amount:
                                            clientPaymentTotalDebt > 0
                                              ? clientPaymentTotalDebt.toFixed(2)
                                              : "",
                                        }));
                                      },
                                      className:
                                        "text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
                                      children: "Usar deuda",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className:
                                "rounded-3xl border border-border-light dark:border-border-dark bg-slate-50/80 dark:bg-slate-950/30 px-4 py-3.5 space-y-3",
                              children: [
                                c.jsxs("div", {
                                  className:
                                    "flex items-center justify-between gap-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-xs font-bold uppercase tracking-wide text-text-sub",
                                      children: "Historial de abonos",
                                    }),
                                    c.jsxs("span", {
                                      className:
                                        "inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700",
                                      children: [
                                        clientPaymentHistoryRows.length,
                                        " movimiento(s)",
                                      ],
                                    }),
                                  ],
                                }),
                                clientPaymentHistoryRows.length === 0
                                  ? c.jsx("p", {
                                    className:
                                      "text-[11px] leading-5 text-text-sub",
                                    children:
                                      "Aun no hay abonos guardados para este cliente.",
                                  })
                                  : c.jsx("div", {
                                    className: "space-y-2 max-h-56 overflow-y-auto ios-scroll pr-1",
                                    children: clientPaymentHistoryRows.map((o) => {
                                      const N =
                                          String(clientPaymentEntryEditingId || "") ===
                                          String(o.id),
                                        A = Array.isArray(o.shopping_allocations)
                                          ? o.shopping_allocations
                                          : [],
                                        vl =
                                          String((o && o.entry_kind) || "").toUpperCase() ===
                                          "CLIENT_BATCH";
                                      return c.jsxs(
                                        "div",
                                        {
                                          className:
                                            "rounded-2xl border border-violet-100 dark:border-violet-900/60 bg-violet-50/60 dark:bg-violet-950/20 px-3 py-2.5",
                                          children: [
                                            c.jsxs("div", {
                                              className:
                                                "flex items-start justify-between gap-2",
                                              children: [
                                                c.jsxs("div", {
                                                  className: "min-w-0",
                                                  children: [
                                                    c.jsx("p", {
                                                      className:
                                                        "text-[11px] font-bold text-violet-700 dark:text-violet-200 truncate",
                                                      children:
                                                        o.shopping_title ||
                                                        `Shopping #${o.shopping_id}`,
                                                    }),
                                                    A.length > 0 &&
                                                    c.jsx("div", {
                                                      className:
                                                        "mt-1 flex flex-wrap gap-1",
                                                      children: A.map((El) =>
                                                        c.jsxs(
                                                          "span",
                                                          {
                                                            className:
                                                              "inline-flex rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 border border-violet-200 dark:bg-violet-900/40 dark:border-violet-800 dark:text-violet-100",
                                                            children: [
                                                              El.shopping_title,
                                                              " $",
                                                              formatAmount(
                                                                Math.abs(
                                                                  paymentLocalToNumber(
                                                                    El.amount,
                                                                    0,
                                                                  ),
                                                                ),
                                                              ),
                                                            ],
                                                          },
                                                          `client-payment-history-tag-${o.id}-${El.shopping_id}`,
                                                        ),
                                                      ),
                                                    }),
                                                    N
                                                      ? c.jsxs("div", {
                                                        className:
                                                          "mt-1 flex items-center gap-1.5",
                                                        children: [
                                                          c.jsx("input", {
                                                            type: "number",
                                                            step: "0.01",
                                                            inputMode: "decimal",
                                                            value:
                                                              clientPaymentEntryDraftAmount,
                                                            onChange: (El) =>
                                                              setClientPaymentEntryDraftAmount(
                                                                El.target.value,
                                                              ),
                                                            className:
                                                              "w-28 px-2.5 py-1.5 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                                                          }),
                                                          c.jsx("button", {
                                                            type: "button",
                                                            onClick: () =>
                                                              saveClientPaymentHistoryRow(
                                                                o,
                                                              ),
                                                            disabled:
                                                              clientPaymentEntrySavingId ===
                                                              String(o.id),
                                                            className:
                                                              "w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center disabled:opacity-60",
                                                            children: c.jsx(
                                                              "span",
                                                              {
                                                                className:
                                                                  `material-symbols-outlined text-[14px] ${clientPaymentEntrySavingId === String(o.id) ? "animate-spin" : ""}`,
                                                                children:
                                                                  clientPaymentEntrySavingId ===
                                                                  String(o.id)
                                                                    ? "progress_activity"
                                                                    : "check",
                                                              },
                                                            ),
                                                          }),
                                                          c.jsx("button", {
                                                            type: "button",
                                                            onClick:
                                                              cancelEditingClientPaymentEntry,
                                                            disabled:
                                                              clientPaymentEntrySavingId ===
                                                              String(o.id),
                                                            className:
                                                              "w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-60",
                                                            children: c.jsx(
                                                              "span",
                                                              {
                                                                className:
                                                                  "material-symbols-outlined text-[14px]",
                                                                children:
                                                                  "close",
                                                              },
                                                            ),
                                                          }),
                                                        ],
                                                      })
                                                      : c.jsxs("p", {
                                                        className:
                                                          "text-[12px] font-bold mt-0.5 text-emerald-700 dark:text-emerald-300",
                                                        children: [
                                                          paymentLocalToNumber(
                                                            o.amount,
                                                            0,
                                                          ) < 0
                                                            ? "-$"
                                                            : "+$",
                                                          formatAmount(
                                                            Math.abs(
                                                              paymentLocalToNumber(
                                                                o.amount,
                                                                0,
                                                              ),
                                                            ),
                                                          ),
                                                        ],
                                                      }),
                                                    c.jsxs("p", {
                                                      className:
                                                        "text-[10px] text-text-sub mt-0.5",
                                                      children: [
                                                        o.created_at
                                                          ? new Date(
                                                            o.created_at,
                                                          ).toLocaleString()
                                                          : "Sin fecha",
                                                        o.created_by_username
                                                          ? ` - ${o.created_by_username}`
                                                          : "",
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                                c.jsxs("div", {
                                                  className:
                                                    "text-right shrink-0 space-y-1",
                                                  children: [
                                                    c.jsxs("p", {
                                                      className:
                                                        "text-[10px] font-bold text-violet-700 dark:text-violet-200",
                                                      children: [
                                                        vl ? "Global $" : "Total $",
                                                        formatAmount(
                                                          paymentLocalToNumber(
                                                            o.total_after,
                                                            0,
                                                          ),
                                                        ),
                                                      ],
                                                    }),
                                                    !N &&
                                                    c.jsxs("div", {
                                                      className:
                                                        "flex items-center justify-end gap-1",
                                                      children: [
                                                        c.jsx("button", {
                                                          type: "button",
                                                          onClick: () =>
                                                            startEditingClientPaymentEntry(
                                                              o,
                                                            ),
                                                          disabled:
                                                            clientPaymentEntrySavingId ===
                                                            String(o.id),
                                                          className:
                                                            "w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center disabled:opacity-60",
                                                          children: c.jsx(
                                                            "span",
                                                            {
                                                              className:
                                                                "material-symbols-outlined text-[14px]",
                                                              children:
                                                                "edit",
                                                            },
                                                          ),
                                                        }),
                                                        c.jsx("button", {
                                                          type: "button",
                                                          onClick: () =>
                                                            deleteClientPaymentHistoryRow(
                                                              o,
                                                            ),
                                                          disabled:
                                                            clientPaymentEntrySavingId ===
                                                            String(o.id),
                                                          className:
                                                            "w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center disabled:opacity-60",
                                                          children: c.jsx(
                                                            "span",
                                                            {
                                                              className:
                                                                `material-symbols-outlined text-[14px] ${clientPaymentEntrySavingId === String(o.id) ? "animate-spin" : ""}`,
                                                              children:
                                                                clientPaymentEntrySavingId ===
                                                                String(o.id)
                                                                  ? "progress_activity"
                                                                  : "delete",
                                                            },
                                                          ),
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        `client-payment-history-entry-${o.id}`,
                                      );
                                    }),
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
                                      children: "Deuda",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "text-lg font-bold text-blue-700 dark:text-blue-100 mt-1",
                                      children: [
                                        "$",
                                        formatAmount(clientPaymentTotalDebt),
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
                                        formatAmount(clientPaymentAllocatedTotal),
                                      ],
                                    }),
                                  ],
                                }),
                                c.jsxs("div", {
                                  className:
                                    `rounded-2xl border px-3 py-2 ${
                                      clientPaymentBalance < 0
                                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                                        : clientPaymentBalance > 0
                                          ? "bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800"
                                          : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900"
                                    }`,
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        `text-[10px] uppercase font-bold ${
                                          clientPaymentBalance < 0
                                            ? "text-emerald-700 dark:text-emerald-300"
                                            : clientPaymentBalance > 0
                                              ? "text-slate-700 dark:text-slate-300"
                                              : "text-emerald-700 dark:text-emerald-300"
                                        }`,
                                      children:
                                        clientPaymentBalance < 0
                                          ? "A favor"
                                          : "Deuda",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        `text-lg font-bold mt-1 ${
                                          clientPaymentBalance < 0
                                            ? "text-emerald-700 dark:text-emerald-100"
                                            : clientPaymentBalance > 0
                                              ? "text-slate-700 dark:text-slate-100"
                                              : "text-emerald-700 dark:text-emerald-100"
                                        }`,
                                      children: [
                                        "$",
                                        formatAmount(
                                          clientPaymentBalance < 0
                                            ? Math.abs(clientPaymentBalance)
                                            : clientPaymentBalance,
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
                                clientPaymentReceivingTargets.length > 0
                                  ? "El abono se reparte automaticamente empezando por la shopping mas antigua."
                                  : "Captura un monto para repartirlo automaticamente entre las shoppings con deuda.",
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
                  disabled: clientPaymentSaving,
                  className:
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 disabled:opacity-60",
                  children: "Cancelar",
                }),
                c.jsx("button", {
                  onClick: saveClientPayment,
                  disabled:
                    clientPaymentSaving ||
                    clientPaymentTargets.length === 0 ||
                    !Number.isFinite(clientPaymentAmountValue) ||
                    clientPaymentAmountValue <= 0,
                  className:
                    "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold disabled:opacity-70",
                  children: clientPaymentSaving ? "Guardando..." : "Guardar",
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
                                                              paymentModalDiscountPercent,
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
                                      children: paymentForm.id
                                        ? "Nuevo abono"
                                        : "Monto del pago",
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
                                        c.jsxs("div", {
                                          className: "flex flex-col gap-0.5",
                                          children: [
                                            paymentForm.id &&
                                            c.jsxs("span", {
                                              className:
                                                "text-[11px] font-medium text-sky-700/80 dark:text-sky-300/80",
                                              children: [
                                                "Abonado actual: $",
                                                formatAmount(paymentCurrentAmountValue),
                                              ],
                                            }),
                                            c.jsxs("span", {
                                              className:
                                                "text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80",
                                              children: [
                                                "Suma productos: $",
                                                formatAmount(paymentSelectedProductsTotal),
                                              ],
                                            }),
                                          ],
                                        }),
                                        (paymentAmountManual || paymentForm.id) &&
                                        c.jsx("button", {
                                          type: "button",
                                          onClick: () => {
                                            setPaymentAmountManual(
                                              paymentForm.id ? !0 : !1,
                                            );
                                            setPaymentForm((N) => ({
                                              ...N,
                                              amount:
                                                (paymentForm.product_ids || []).length > 0
                                                  ? paymentForm.id
                                                    ? paymentSuggestedEntryAmount > 0
                                                      ? paymentSuggestedEntryAmount.toFixed(2)
                                                      : "0.00"
                                                    : paymentSelectedProductsTotal.toFixed(2)
                                                  : paymentForm.id
                                                    ? "0.00"
                                                    : "",
                                            }));
                                          },
                                          className:
                                            "text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
                                          children: paymentForm.id
                                            ? "Usar saldo"
                                            : "Usar suma",
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              ],
                            }),
                            c.jsxs("div", {
                              className:
                                "rounded-3xl border border-border-light dark:border-border-dark bg-slate-50/80 dark:bg-slate-950/30 px-4 py-3.5 space-y-3",
                              children: [
                                c.jsxs("div", {
                                  className:
                                    "flex items-center justify-between gap-2",
                                  children: [
                                    c.jsx("p", {
                                      className:
                                        "text-xs font-bold uppercase tracking-wide text-text-sub",
                                      children: "Historial de abonos",
                                    }),
                                    c.jsxs("span", {
                                      className:
                                        "inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-[11px] font-bold text-violet-700",
                                      children: [
                                        paymentHistoryRows.length,
                                        " movimiento(s)",
                                      ],
                                    }),
                                  ],
                                }),
                                paymentHistoryRows.length === 0
                                  ? c.jsx("p", {
                                    className:
                                      "text-[11px] leading-5 text-text-sub",
                                    children:
                                      "Aun no hay abonos guardados para este cliente.",
                                  })
                                  : c.jsx("div", {
                                    className:
                                      "max-h-48 overflow-y-auto ios-scroll space-y-2 pr-1.5",
                                    children: paymentHistoryRows.map((o) => {
                                      const N = !0,
                                        A =
                                          String(paymentEntryEditingId || "") ===
                                          String(o.id),
                                        vl = Array.isArray(o.shopping_allocations)
                                          ? o.shopping_allocations.find(
                                            (El) =>
                                              Number(El && El.shopping_id) ===
                                              Number(paymentForm.shopping || 0),
                                          ) || null
                                          : null,
                                        El =
                                          String((o && o.entry_kind) || "").toUpperCase() ===
                                          "CLIENT_BATCH";
                                      return c.jsxs(
                                        "div",
                                        {
                                          className:
                                            "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/70 px-3 py-2.5",
                                          children: [
                                            c.jsxs("div", {
                                              className:
                                                "flex items-start justify-between gap-2",
                                              children: [
                                                c.jsxs("div", {
                                                  className: "min-w-0",
                                                  children: [
                                                    c.jsx("p", {
                                                      className:
                                                        "text-[11px] font-bold text-violet-700 dark:text-violet-200 truncate",
                                                      children:
                                                        o.shopping_title ||
                                                        `Shopping #${o.shopping_id}`,
                                                    }),
                                                    Array.isArray(o.shopping_tags) &&
                                                    o.shopping_tags.length > 0 &&
                                                    c.jsx("div", {
                                                      className:
                                                        "mt-1 flex flex-wrap gap-1",
                                                      children: o.shopping_tags.map((Se) =>
                                                        c.jsx(
                                                          "span",
                                                          {
                                                            className:
                                                              "inline-flex rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-violet-700 border border-violet-200 dark:bg-violet-900/40 dark:border-violet-800 dark:text-violet-100",
                                                            children: Se,
                                                          },
                                                          `payment-history-tag-${o.id}-${Se}`,
                                                        ),
                                                      ),
                                                    }),
                                                    A
                                                      ? c.jsxs("div", {
                                                        className:
                                                          "mt-1 flex items-center gap-1.5",
                                                        children: [
                                                          c.jsx("input", {
                                                            type: "number",
                                                            step: "0.01",
                                                            inputMode: "decimal",
                                                            value:
                                                              paymentEntryDraftAmount,
                                                            onChange: (vl) =>
                                                              setPaymentEntryDraftAmount(
                                                                vl.target.value,
                                                              ),
                                                            className:
                                                              "w-28 px-2.5 py-1.5 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40",
                                                          }),
                                                          c.jsx("button", {
                                                            type: "button",
                                                            onClick: () =>
                                                              savePaymentEntry(o),
                                                            disabled:
                                                              String(paymentEntrySavingId || "") ===
                                                              String(o.id),
                                                            className:
                                                              "w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center disabled:opacity-60",
                                                            children: c.jsx(
                                                              "span",
                                                              {
                                                                className:
                                                                  `material-symbols-outlined text-[14px] ${String(paymentEntrySavingId || "") === String(o.id) ? "animate-spin" : ""}`,
                                                                children:
                                                                  String(paymentEntrySavingId || "") ===
                                                                  String(o.id)
                                                                    ? "progress_activity"
                                                                    : "check",
                                                              },
                                                            ),
                                                          }),
                                                          c.jsx("button", {
                                                            type: "button",
                                                            onClick:
                                                              cancelEditingPaymentEntry,
                                                            disabled:
                                                              String(paymentEntrySavingId || "") ===
                                                              String(o.id),
                                                            className:
                                                              "w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center disabled:opacity-60",
                                                            children: c.jsx(
                                                              "span",
                                                              {
                                                                className:
                                                                  "material-symbols-outlined text-[14px]",
                                                                children:
                                                                  "close",
                                                              },
                                                            ),
                                                          }),
                                                        ],
                                                      })
                                                      : c.jsxs("p", {
                                                        className:
                                                          `text-[13px] font-bold mt-0.5 ${
                                                            paymentLocalToNumber(
                                                              o.amount,
                                                              0,
                                                            ) < 0
                                                              ? "text-rose-600 dark:text-rose-300"
                                                              : "text-emerald-700 dark:text-emerald-300"
                                                          }`,
                                                        children: [
                                                          paymentLocalToNumber(
                                                            o.amount,
                                                            0,
                                                          ) < 0
                                                            ? "-$"
                                                            : "+$",
                                                          formatAmount(
                                                            Math.abs(
                                                              paymentLocalToNumber(
                                                                o.amount,
                                                                0,
                                                              ),
                                                            ),
                                                          ),
                                                        ],
                                                      }),
                                                    c.jsxs("p", {
                                                      className:
                                                        "text-[10px] text-text-sub mt-0.5",
                                                      children: [
                                                        o.created_at
                                                          ? new Date(
                                                            o.created_at,
                                                          ).toLocaleString()
                                                          : "Sin fecha",
                                                        o.created_by_username
                                                          ? ` - ${o.created_by_username}`
                                                          : "",
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                                c.jsxs("div", {
                                                  className:
                                                    "text-right shrink-0 space-y-1",
                                                  children: [
                                                    c.jsxs("p", {
                                                      className:
                                                        "text-[10px] font-bold text-violet-700 dark:text-violet-200",
                                                      children: [
                                                        El ? "Global " : "Total ",
                                                        "$",
                                                        formatAmount(
                                                          paymentLocalToNumber(
                                                            o.total_after,
                                                            0,
                                                          ),
                                                        ),
                                                      ],
                                                    }),
                                                    El &&
                                                    vl &&
                                                    c.jsxs("p", {
                                                      className:
                                                        "text-[10px] font-bold text-emerald-700 dark:text-emerald-300",
                                                      children: [
                                                        "Esta shopping $",
                                                        formatAmount(
                                                          Math.abs(
                                                            paymentLocalToNumber(
                                                              vl.amount,
                                                              0,
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    }),
                                                    N &&
                                                    !A &&
                                                    c.jsxs("div", {
                                                      className:
                                                        "flex items-center justify-end gap-1",
                                                      children: [
                                                        c.jsx("button", {
                                                          type: "button",
                                                          onClick: () =>
                                                            startEditingPaymentEntry(
                                                              o,
                                                            ),
                                                          disabled:
                                                            String(paymentEntrySavingId || "") ===
                                                            String(o.id),
                                                          className:
                                                            "w-7 h-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center disabled:opacity-60",
                                                          children: c.jsx(
                                                            "span",
                                                            {
                                                              className:
                                                                "material-symbols-outlined text-[14px]",
                                                              children:
                                                                "edit",
                                                            },
                                                          ),
                                                        }),
                                                        c.jsx("button", {
                                                          type: "button",
                                                          onClick: () =>
                                                            deletePaymentEntry(
                                                              o,
                                                            ),
                                                          disabled:
                                                            String(paymentEntrySavingId || "") ===
                                                            String(o.id),
                                                          className:
                                                            "w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center disabled:opacity-60",
                                                          children: c.jsx(
                                                            "span",
                                                            {
                                                              className:
                                                                `material-symbols-outlined text-[14px] ${String(paymentEntrySavingId || "") === String(o.id) ? "animate-spin" : ""}`,
                                                              children:
                                                                String(paymentEntrySavingId || "") ===
                                                                String(o.id)
                                                                  ? "progress_activity"
                                                                  : "delete",
                                                            },
                                                          ),
                                                        }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                              ],
                                            }),
                                          ],
                                        },
                                        `payment-history-entry-${o.id}`,
                                      );
                                    }),
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
                                      children: paymentForm.id ? "Pagado" : "Pago",
                                    }),
                                    c.jsxs("p", {
                                      className:
                                        "text-lg font-bold text-emerald-700 dark:text-emerald-100 mt-1",
                                      children: [
                                        "$",
                                        formatAmount(paymentPreviewAmountValue),
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
                                          ? "A favor"
                                          : "Deuda",
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
                                paymentForm.id
                                  ? paymentDraftAmountValue > 0
                                    ? "Este monto se agregara como un abono nuevo al historial."
                                    : "Puedes capturar un nuevo abono o dejarlo en 0 para solo ajustar los productos."
                                  : paymentFormBalance < 0
                                  ? "A favor: el cliente pago mas de lo seleccionado."
                                  : "Puedes quitar o agregar productos para ajustar lo que cubre este pago.",
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
                      children: "Selecciona cliente y productos.",
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
                    c.jsxs("div", {
                      className: "relative mt-1",
                      children: [
                        c.jsxs("button", {
                          type: "button",
                          onClick: () =>
                            setShipmentClientPickerOpen((o) => !o),
                          className:
                            "w-full px-3 py-2.5 text-sm border rounded-xl bg-white dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary/40 flex items-center justify-between gap-3 text-left",
                          children: [
                            c.jsx("span", {
                              className: shipmentModalClient
                                ? "text-text-main dark:text-white"
                                : "text-text-sub",
                              children: shipmentModalClient
                                ? shipmentModalClient.name
                                : "Selecciona un cliente",
                            }),
                            c.jsx("span", {
                              className:
                                "material-symbols-outlined text-[18px] text-text-sub",
                              children: shipmentClientPickerOpen
                                ? "expand_less"
                                : "expand_more",
                            }),
                          ],
                        }),
                        shipmentClientPickerOpen &&
                        c.jsxs("div", {
                          className:
                            "absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 shadow-xl p-2",
                          children: [
                            c.jsx("input", {
                              type: "text",
                              value: shipmentClientSearch,
                              onChange: (o) =>
                                setShipmentClientSearch(o.target.value),
                              placeholder: "Buscar cliente...",
                              className:
                                "w-full px-2.5 py-2 text-[11px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                            }),
                            c.jsx("div", {
                              className: "mt-2 max-h-56 overflow-y-auto ios-scroll",
                              children:
                                filteredShipmentClients.length > 0
                                  ? filteredShipmentClients.map((o) =>
                                      c.jsx(
                                        "button",
                                        {
                                          type: "button",
                                          onClick: () => selectShipmentClient(o.id),
                                          className:
                                            "w-full text-left px-2.5 py-2 rounded-lg text-[11px] font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-slate-800",
                                          children:
                                            String(shipmentForm.client) === String(o.id)
                                              ? `${o.name} ✓`
                                              : o.name,
                                        },
                                        `shipment-client-option-${o.id}`,
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
                  ],
                }),
                c.jsxs("label", {
                  className: "block",
                  children: [
                    c.jsx("span", {
                      className: "text-[11px] font-semibold text-text-sub",
                      children: "Paqueteria",
                    }),
                    c.jsx("select", {
                      value: shipmentForm.carrier,
                      onChange: (o) =>
                        updateShipmentForm("carrier", o.target.value),
                      style: DARK_NATIVE_SELECT_STYLE,
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl border-slate-700 bg-slate-900 text-white outline-none focus:ring-2 focus:ring-primary/40",
                      children: SHIPMENT_CARRIER_OPTIONS.map((o) =>
                        c.jsx(
                          "option",
                          {
                            value: o.value,
                            style: NATIVE_DROPDOWN_OPTION_STYLE,
                            children: o.label,
                          },
                          `shipment-carrier-option-${o.value || "empty"}`,
                        ),
                      ),
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
                          style: DARK_NATIVE_SELECT_STYLE,
                          className:
                            "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl border-slate-700 bg-slate-900 text-white outline-none focus:ring-2 focus:ring-primary/40",
                          children: [
                            c.jsx("option", { value: "PENDING", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Pendiente" }, "shipment-status-pending"),
                            c.jsx("option", { value: "SHIPPED", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Enviado" }, "shipment-status-shipped"),
                            c.jsx("option", { value: "DELIVERED", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Entregado" }, "shipment-status-delivered"),
                            c.jsx("option", { value: "CANCELLED", style: NATIVE_DROPDOWN_OPTION_STYLE, children: "Cancelado" }, "shipment-status-cancelled"),
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
                          children: "Costo de compra",
                        }),
                        c.jsx("input", {
                          type: "text",
                          inputMode: "decimal",
                          value: shipmentForm.guide_price,
                          onChange: (o) =>
                            updateShipmentForm("guide_price", o.target.value),
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
                          children: "Costo de venta",
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
                    getClientShipmentAddressOptions(shipmentForm.client).length > 1 &&
                    c.jsxs("select", {
                      value: shipmentForm.shipping_address,
                      onChange: (o) =>
                        updateShipmentForm("shipping_address", o.target.value),
                      style: DARK_NATIVE_SELECT_STYLE,
                      className:
                        "mt-1 w-full px-3 py-2.5 text-sm border rounded-xl border-slate-700 bg-slate-900 text-white outline-none focus:ring-2 focus:ring-primary/40",
                      children: getClientShipmentAddressOptions(shipmentForm.client).map((o, N) =>
                        c.jsx(
                          "option",
                          {
                            value: o,
                            style: NATIVE_DROPDOWN_OPTION_STYLE,
                            children: o,
                          },
                          `shipment-address-${N}`,
                        ),
                      ),
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
                          children: shipmentSelectedProducts.map((o) => {
                            const N = getProductPaymentAmount(o);
                            return c.jsxs(
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
                                  Number.isFinite(N) &&
                                  c.jsx("div", {
                                    className:
                                      "absolute inset-x-0 bottom-1.5 z-20 flex justify-center pointer-events-none",
                                    children: c.jsxs("span", {
                                      className:
                                        "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                                      children: ["$", formatAmount(N)],
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
                            );
                          }),
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
                  disabled: shipmentSaving,
                  className:
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 disabled:opacity-60",
                  children: "Cancelar",
                }),
                c.jsx("button", {
                  onClick: saveShipmentEditor,
                  disabled: shipmentSaving,
                  className:
                    "py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark text-sm font-semibold disabled:opacity-60",
                  children: shipmentSaving
                    ? "Guardando..."
                    : shipmentForm.id
                      ? "Guardar"
                      : "Crear",
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
                      ),
                      A = getProductPaymentAmount(o);
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
                          Number.isFinite(A) &&
                          c.jsx("div", {
                            className:
                              "absolute inset-x-0 bottom-1.5 z-20 flex justify-center pointer-events-none",
                            children: c.jsxs("span", {
                              className:
                                "inline-flex items-center justify-center whitespace-nowrap rounded-full bg-white/82 dark:bg-slate-900/82 px-2 py-[3px] text-[10px] font-bold text-slate-800 dark:text-slate-100 border border-white/70 dark:border-slate-700/80 shadow-sm backdrop-blur-md",
                              children: ["$", formatAmount(A)],
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
                                (o.shopping_date || o.mission_date) &&
                                c.jsx("p", {
                                  className: "text-[10px] text-white/70 truncate",
                                  children: new Date(
                                    o.shopping_date || o.mission_date,
                                  ).toLocaleDateString(),
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
                      onClick: pickAlternativeUploadImages,
                      className:
                        "shrink-0 px-2.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white/92 dark:bg-slate-900/92 text-[11px] font-medium text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
                      children: [
                        "Adjuntar",
                        altUploadFiles.length > 0 ? ` (${altUploadFiles.length})` : "",
                      ],
                    }),
                  ],
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
          ? "fixed inset-y-0 left-0 w-20 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-lg border-r border-border-light dark:border-border-dark py-3 px-2 z-[55] overflow-y-auto"
          : "fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-lg border-t border-border-light dark:border-border-dark pt-1 px-3 z-[55]",
        style: isDesktopLayout
          ? undefined
          : { paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.5rem)" },
        children: c.jsxs("div", {
          className: isDesktopLayout
            ? "flex h-full flex-col items-center gap-3"
            : "flex justify-around items-center",
          children: [
            c.jsx("button", {
              onClick: () => navigateSection("HOME"),
              title: "Home",
              className: isDesktopLayout
                ? `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "HOME" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "HOME" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "relative",
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
              title: "Shoppings",
              className: isDesktopLayout
                ? `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "MISSIONS" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "MISSIONS" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsxs("div", {
                    className: "relative",
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
              title: "Clients",
              className: isDesktopLayout
                ? `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "CLIENTS" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "CLIENTS" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsx("div", {
                    className: "relative",
                    children: c.jsx("span", {
                      className: "material-symbols-outlined text-[22px]",
                      children: "group",
                    }),
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
              title: "Shipments",
              className: isDesktopLayout
                ? `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "SHIPMENTS" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "SHIPMENTS" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsx("div", {
                    className: "relative",
                    children: c.jsx("span", {
                      className: "material-symbols-outlined text-[22px]",
                      children: "local_shipping",
                    }),
                  })
                : c.jsx("span", {
                    className: "material-symbols-outlined text-[20px]",
                    children: "local_shipping",
                  }),
            }),
            c.jsx("button", {
              onClick: () => navigateSection("CALCULATOR"),
              title: "Calc",
              className: isDesktopLayout
                ? `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "CALCULATOR" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "CALCULATOR" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsx("div", {
                    className: "relative",
                    children: c.jsx("span", {
                      className: "material-symbols-outlined text-[22px]",
                      children: "calculate",
                    }),
                  })
                : c.jsx("span", {
                    className: "material-symbols-outlined text-[20px]",
                    children: "calculate",
                  }),
            }),
            c.jsx("button", {
              onClick: () => navigateSection("PROFILE"),
              title: "Profile",
              className: isDesktopLayout
                ? `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "PROFILE" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`
                : `ui-nav-item relative p-1.5 transition-colors ${nl === "PROFILE" ? "ui-nav-item-active text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: isDesktopLayout
                ? c.jsx("div", {
                    className: "relative",
                    children: c.jsx("span", {
                      className: "material-symbols-outlined text-[22px]",
                      children: "person",
                    }),
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

