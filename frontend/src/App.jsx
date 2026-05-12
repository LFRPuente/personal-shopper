import {
  V, c, scheduleIdleTask,
  getStoredNumber, getStoredPercent, clampNumber,
  HOME_DESKTOP_LAYOUT_DEFAULTS, normalizeHomeDesktopLayout,
  DEFAULT_PRODUCT_FORM, createEmptyProductForm, getDraftProductFlowState, normalizeProductModalStatus,
  Zs, isPdfMediaUrl, resolveMediaUrl, revokeBlobUrl,
  toFormUserId, toFormShoppingId, getUserOptionLabel,
  sanitizeClientCountryCodeInput, sanitizeClientPhoneInput,
  getClientPhoneDisplay, getClientWahaChatId,
  getUserPhoneDisplay, getUserWahaChatId,
  getShipmentStatusLabel, getShipmentTrackingUrl,
  getPublicShareInfoFromPath, getPublicShareFocusShipmentIdFromSearch,
  getAppRouteFromPath, buildAppPath, slugifyRouteToken,
  MODULE_NUMBER_FORMAT, MODULE_AMOUNT_FORMAT,
} from './utils.js';
import {
  AppServicesProvider,
  CalculatorProvider,
  LayoutProfileProvider,
  ShipmentsProvider,
  ShoppingsProvider,
  ClientsProvider,
  HomeProvider,
} from './AppContext.jsx';
import { useApiClient, getApiErrorMessage } from './hooks/useApiClient.js';
import { useClientsDomain } from './hooks/useClientsDomain.js';
import { useImageSource } from './hooks/useImageSource.js';
import { useOverlayNavigation } from './hooks/useOverlayNavigation.js';
import { usePaymentsDomain } from './hooks/usePaymentsDomain.js';
import { useRealtimeUpdates } from './hooks/useRealtimeUpdates.js';
import { useShipmentsDomain } from './hooks/useShipmentsDomain.js';
import { useShoppingsDomain } from './hooks/useShoppingsDomain.js';
import { useToastsAndDialogs } from './hooks/useToastsAndDialogs.js';
import { prepareCompressedImageFile } from './imageCompression.js';
import { sortShipmentEvidenceByNewest, sortShipmentProductsByNewest } from './shipmentEvidence.js';
import ClientPaymentModal from './components/ClientPaymentModal.jsx';
import ReportsSection from './sections/ReportsSection.jsx';
const CalculatorSection = V.lazy(() => import('./sections/CalculatorSection.jsx'));
const ClientsSection = V.lazy(() => import('./sections/ClientsSection.jsx'));
const ConfirmDialog = V.lazy(() => import('./components/ConfirmDialog.jsx'));
const EditTicketModal = V.lazy(() => import('./components/EditTicketModal.jsx'));
const FullscreenImageModal = V.lazy(() => import('./components/FullscreenImageModal.jsx'));
const HomeSection = V.lazy(() => import('./sections/HomeSection.jsx'));
const HomeClientOverlay = V.lazy(() => import('./components/HomeClientOverlay.jsx'));
const ImageSourceDialog = V.lazy(() => import('./components/ImageSourceDialog.jsx'));
const InputDialog = V.lazy(() => import('./components/InputDialog.jsx'));
const PaymentModal = V.lazy(() => import('./components/PaymentModal.jsx'));
const ProductModal = V.lazy(() => import('./components/ProductModal.jsx'));
const PublicStockCatalog = V.lazy(() => import('./components/PublicStockCatalog.jsx'));
const MissionStartModal = V.lazy(() => import('./components/MissionStartModal.jsx'));
const CreateClientModal = V.lazy(() => import('./components/CreateClientModal.jsx'));
const EditClientModal = V.lazy(() => import('./components/EditClientModal.jsx'));
const MissionSummaryModal = V.lazy(() => import('./components/MissionSummaryModal.jsx'));
const ReviewNotifyModal = V.lazy(() => import('./components/ReviewNotifyModal.jsx'));
const ShipmentProductPickerModal = V.lazy(() => import('./components/ShipmentProductPickerModal.jsx'));
const MissionsSection = V.lazy(() => import('./sections/MissionsSection.jsx'));
const ProfileSection = V.lazy(() => import('./sections/ProfileSection.jsx'));
const ReviewConversationModal = V.lazy(() => import('./components/ReviewConversationModal.jsx'));
const ShipmentsSection = V.lazy(() => import('./sections/ShipmentsSection.jsx'));
const StockCatalogSection = V.lazy(() => import('./sections/StockCatalogSection.jsx'));
const ShipmentModal = V.lazy(() => import('./components/ShipmentModal.jsx'));
const ExpensesSection = V.lazy(() => import('./sections/ExpensesSection.jsx'));

const MAX_OPEN_SHOPPINGS = 3;

class SectionErrorBoundary extends V.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Section render crashed", error, info);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return c.jsxs("div", {
        className:
          "rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-rose-800 shadow-sm",
        children: [
          c.jsx("p", {
            className: "text-sm font-bold",
            children: "Esta vista fallo al renderizar.",
          }),
          c.jsx("p", {
            className: "mt-1 text-xs text-rose-700/90",
            children:
              this.state.error && this.state.error.message
                ? this.state.error.message
                : "Error desconocido.",
          }),
          c.jsx("button", {
            type: "button",
            onClick: () => this.setState({ error: null }),
            className:
              "mt-3 rounded-xl bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700",
            children: "Intentar otra vez",
          }),
        ],
      });
    }
    return this.props.children;
  }
}

class OverlayErrorBoundary extends V.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Overlay render crashed", error, info);
    if (typeof this.props.onError === "function") {
      this.props.onError(error);
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      if (typeof this.props.renderFallback === "function") {
        return this.props.renderFallback(this.state.error, () =>
          this.setState({ error: null }),
        );
      }
      return null;
    }
    return this.props.children;
  }
}

async function copyTextToClipboard(value, promptLabel = "Copia este texto:") {
  const text = String(value || "");
  if (!text) return "empty";
  let clipboardError = null;
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof navigator.clipboard.writeText === "function"
  ) {
    try {
      await navigator.clipboard.writeText(text);
      return "clipboard";
    } catch (error) {
      clipboardError = error;
    }
  }
  if (typeof document !== "undefined" && document.body) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "0";
    textarea.style.width = "1px";
    textarea.style.height = "1px";
    textarea.style.opacity = "0";
    textarea.style.fontSize = "16px";
    textarea.style.pointerEvents = "none";
    document.body.appendChild(textarea);
    const selection = document.getSelection ? document.getSelection() : null;
    const previousRange =
      selection && selection.rangeCount ? selection.getRangeAt(0) : null;
    try {
      try {
        textarea.focus({ preventScroll: true });
      } catch {
        textarea.focus();
      }
      textarea.select();
      textarea.setSelectionRange(0, textarea.value.length);
      if (document.execCommand && document.execCommand("copy")) {
        return "legacy";
      }
    } catch (error) {
      clipboardError = error;
    } finally {
      document.body.removeChild(textarea);
      if (selection) {
        try {
          selection.removeAllRanges();
          if (previousRange) selection.addRange(previousRange);
        } catch {
          // Restoring the previous selection is best-effort only.
        }
      }
    }
  }
  if (typeof window !== "undefined" && typeof window.prompt === "function") {
    window.prompt(promptLabel, text);
    return "manual";
  }
  if (clipboardError) throw clipboardError;
  throw new Error("No se pudo copiar automaticamente.");
}

function nh() {
  const initialAppRoute = V.useMemo(
      () =>
        typeof window !== "undefined"
          ? getAppRouteFromPath(window.location.pathname)
          : { section: "HOME", homeClientSlug: null, isPublicShare: !1 },
      [],
    ),
    publicShareInfo = V.useMemo(() => getPublicShareInfoFromPath(), []),
    publicClientShareToken = publicShareInfo.token,
    publicShareType = publicShareInfo.type,
    isPublicStockCatalog = !!initialAppRoute.isPublicStockCatalog,
    publicFocusShipmentIdFromSearch = V.useMemo(
      () => getPublicShareFocusShipmentIdFromSearch(),
      [],
    ),
    LEGACY_BREAKDOWN_TEMPLATES = [
      "DESGLOSE DE TU CUENTA:\n\n{items}\n\nTOTAL TIENDA: ${total}\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗\n\nTe lo puedo asegurar por 10 minutos en lo que haces transferencia.💕",
      "DESGLOSE DE TU CUENTA:\n\n{items}\n{balance_line}\n\n*TOTAL TIENDA: ${total}*\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗\n\nTe lo puedo asegurar por 10 minutos en lo que haces transferencia.💕",
    ],
    DEFAULT_BREAKDOWN_TEMPLATE =
      "DESGLOSE DE TU CUENTA:\n\n{items}\n{balance_line}\n\n*{total_label}: ${total}*\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗\n\nTe lo puedo asegurar por 10 minutos en lo que haces transferencia.💕",
    [C, jl] = V.useState(localStorage.getItem("access_token") || null),
    [J, b] = V.useState(null),
    [Q, al] = V.useState("LOGIN"),
    [cl, Ql] = V.useState({ username: "", password: "", role: "AV" }),
    [U, T] = V.useState(""),
    [X, H] = V.useState("AV"),
    [layoutMode, setLayoutMode] = V.useState("MOBILE"),
    [themeMode, setThemeMode] = V.useState(() =>
      localStorage.getItem("theme_mode") === "DARK" ? "DARK" : "LIGHT",
    ),
    [homeDesktopLayout, setHomeDesktopLayout] = V.useState(() =>
      normalizeHomeDesktopLayout(null),
    ),
    [isWideViewport, setIsWideViewport] = V.useState(() =>
      typeof window !== "undefined" ? window.innerWidth >= 1024 : !1,
    ),
    [nl, Ll] = V.useState(initialAppRoute.section),
    [sectionTransitionStage, setSectionTransitionStage] = V.useState("idle"),
    [Kl, _l] = V.useState([]),
    [Pl, at] = V.useState(!1),
    [me, ut] = V.useState(!1),
    [j, _] = V.useState(""),
    [kt, Kt] = V.useState(null),
    [va, we] = V.useState(null),
    [ct, ke] = V.useState([]),
    [he, Ke] = V.useState(null),
    [st, Gt] = V.useState(() => createEmptyProductForm()),
    [productModalMode, setProductModalMode] = V.useState("edit"),
    [pendingProductFile, setPendingProductFile] = V.useState(null),
    [pendingProductPreviewUrl, setPendingProductPreviewUrl] = V.useState(""),
    [productPriceAutoInfoOpen, setProductPriceAutoInfoOpen] = V.useState(!1),
    [productPriceAutoSync, setProductPriceAutoSync] = V.useState(!0),
    [productPriceSyncSource, setProductPriceSyncSource] = V.useState("real"),
    [Je, We] = V.useState(null),
    [ji, sn] = V.useState(!1),
    [Ol, $e] = V.useState({
      total_real_price: "",
      total_charged_price: "",
      tax_percentage: "8.00",
      shipping_paid: !1,
    }),
    [Ei, ge] = V.useState(null),
    [wl, jt] = V.useState("REVIEW"),
    [calcMode, setCalcMode] = V.useState(
      localStorage.getItem("calc_mode") || "FACTOR",
    ),
    [calcFactor, setCalcFactor] = V.useState(() =>
      getStoredNumber("calc_factor", 1.5),
    ),
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
    [defaultBreakdownTemplate, setDefaultBreakdownTemplate] = V.useState(() => {
      const storedTemplate = localStorage.getItem("default_breakdown_template");
      if (!storedTemplate || LEGACY_BREAKDOWN_TEMPLATES.includes(storedTemplate))
        return DEFAULT_BREAKDOWN_TEMPLATE;
      return storedTemplate;
    }),
    [profileSettingsForm, setProfileSettingsForm] = V.useState({
      display_name: "",
      phone_country_code: "+52",
      phone: "",
      waha_api_url: "",
      waha_api_key: "",
      waha_session: "",
      waha_phone_prefix: "521",
      waha_chat_id_suffix: "@c.us",
    }),
    [profileSettingsSaving, setProfileSettingsSaving] = V.useState(!1),
    [fullscreenImage, setFullscreenImage] = V.useState(null),
    [users, setUsers] = V.useState([]),
    [reviewNotifyModalOpen, setReviewNotifyModalOpen] = V.useState(!1),
    [reviewNotifyProduct, setReviewNotifyProduct] = V.useState(null),
    [reviewNotifyClient, setReviewNotifyClient] = V.useState(null),
    [reviewNotifyMessage, setReviewNotifyMessage] = V.useState(""),
    [reviewNotifyRecipientIds, setReviewNotifyRecipientIds] = V.useState([]),
    [reviewNotifySending, setReviewNotifySending] = V.useState(!1),
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
    [openProductMenuId, setOpenProductMenuId] = V.useState(null),
    [openProductInfoId, setOpenProductInfoId] = V.useState(null),
    [openProductStatusId, setOpenProductStatusId] = V.useState(null),
    [reviewConversationEntry, setReviewConversationEntry] = V.useState(null),
    [reviewConversationWahaEnabled, setReviewConversationWahaEnabled] = V.useState(!1),
    [reviewConversationRecipientIds, setReviewConversationRecipientIds] = V.useState([]),
    [reviewConversationSendCooling, setReviewConversationSendCooling] = V.useState(!1),
    [homeClientSearch, setHomeClientSearch] = V.useState(""),
    [homeUnreadSummary, setHomeUnreadSummary] = V.useState({}),
    [shoppingUnreadSummaryMap, setShoppingUnreadSummaryMap] = V.useState({}),
    [seenReviewItemMap, setSeenReviewItemMap] = V.useState({}),
    [homeNeedsAttention, setHomeNeedsAttention] = V.useState(!1),
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
    handleUnauthorized = V.useCallback(() => {
      localStorage.removeItem("access_token");
      jl(null);
      b(null);
      setLayoutMode("MOBILE");
    }, []),
    apiClient = useApiClient(C, handleUnauthorized),
    I = apiClient.apiFetch,
    publicApiFetch = apiClient.publicApiFetch,
    toastDialogState = useToastsAndDialogs(),
    toasts = toastDialogState.toasts,
    confirmDialog = toastDialogState.confirmDialog,
    inputDialog = toastDialogState.inputDialog,
    dismissToast = toastDialogState.dismissToast,
    notifySuccess = toastDialogState.notifySuccess,
    notifyError = toastDialogState.notifyError,
    notifyInfo = toastDialogState.notifyInfo,
    confirmAction = toastDialogState.confirmAction,
    closeConfirmDialog = toastDialogState.closeConfirmDialog,
    openInputDialog = toastDialogState.openInputDialog,
    updateInputDialogField = toastDialogState.updateInputDialogField,
    closeInputDialog = toastDialogState.closeInputDialog,
    submitInputDialog = toastDialogState.submitInputDialog,
    imageSourceState = useImageSource({
      notifyInfo,
      notifyError,
      notifySuccess,
      setCopiedImageItemId,
    }),
    imageSourceDialog = imageSourceState.imageSourceDialog,
    imageSourceInfoOpen = imageSourceState.imageSourceInfoOpen,
    setImageSourceInfoOpen = imageSourceState.setImageSourceInfoOpen,
    openImageSourcePicker = imageSourceState.openImageSourcePicker,
    closeImageSourceDialog = imageSourceState.closeImageSourceDialog,
    pickImageFromDevice = imageSourceState.pickImageFromDevice,
    pickImageFromClipboard = imageSourceState.pickImageFromClipboard,
    copyProductImageToClipboard = imageSourceState.copyProductImageToClipboard,
    copyImageUrlToClipboard = imageSourceState.copyImageUrlToClipboard,
    reviewConversationScrollRef = V.useRef(null),
    reviewConversationStateRef = V.useRef(""),
    reviewConversationSendCooldownTimerRef = V.useRef(null),
    currentTabRef = V.useRef(initialAppRoute.section),
    pendingHomeClientRouteRef = V.useRef(initialAppRoute.homeClientSlug),
    selectedClientIdRef = V.useRef(null),
    activeMissionIdRef = V.useRef(null),
    openShoppingTabsRef = V.useRef([]),
    setClosingOverlayKeyActionRef = V.useRef(() => {}),
    clientsDomain = useClientsDomain({
      apiFetch: I,
      clients: Kl,
      setClients: _l,
      publicShareType,
      pendingHomeClientRouteRef,
      setFullscreenImage,
      setClosingOverlayKey: (value) => setClosingOverlayKeyActionRef.current(value),
      setProductGalleryTab: jt,
      notifyInfo,
      notifySuccess,
      notifyError,
      confirmAction,
      copyTextToClipboard,
      setCopiedClientShareLinks,
    }),
    W = clientsDomain.selectedClient,
    et = clientsDomain.setSelectedClient,
    hydrateClientDetail = clientsDomain.hydrateClientDetail,
    clientDetailLoadingId = clientsDomain.clientDetailLoadingId,
    Il = clientsDomain.createClientOpen,
    k = clientsDomain.setCreateClientOpen,
    Vl = clientsDomain.newClientName,
    Yt = clientsDomain.setNewClientName,
    Nt = clientsDomain.newClientTags,
    it = clientsDomain.setNewClientTags,
    clientPhoneCountryCode = clientsDomain.clientPhoneCountryCode,
    setClientPhoneCountryCode = clientsDomain.setClientPhoneCountryCode,
    p = clientsDomain.clientPhone,
    z = clientsDomain.setClientPhone,
    q = clientsDomain.clientEmail,
    sl = clientsDomain.setClientEmail,
    rl = clientsDomain.clientShippingAddress,
    d = clientsDomain.setClientShippingAddress,
    clientShippingAddresses = clientsDomain.clientShippingAddresses,
    setClientShippingAddresses = clientsDomain.setClientShippingAddresses,
    O = clientsDomain.editingClient,
    Y = clientsDomain.setEditingClient,
    K = clientsDomain.editClientOpen,
    tl = clientsDomain.setEditClientOpen,
    ml = clientsDomain.editClientForm,
    hl = clientsDomain.setEditClientForm,
    clientGalleryTabOrder = clientsDomain.clientGalleryTabOrder,
    setClientGalleryTabOrder = clientsDomain.setClientGalleryTabOrder,
    clientGalleryMissionScopeId = clientsDomain.clientGalleryMissionScopeId,
    setClientGalleryMissionScopeId = clientsDomain.setClientGalleryMissionScopeId,
    clientGalleryMissionScopeMeta = clientsDomain.clientGalleryMissionScopeMeta,
    setClientGalleryMissionScopeMeta = clientsDomain.setClientGalleryMissionScopeMeta,
    clientGalleryAllowsShoppingChoice = clientsDomain.clientGalleryAllowsShoppingChoice,
    setClientGalleryAllowsShoppingChoice = clientsDomain.setClientGalleryAllowsShoppingChoice,
    buildClientPayload = clientsDomain.buildClientPayload,
    openCreateClientModal = clientsDomain.openCreateClientModal,
    openEditClientModal = clientsDomain.openEditClientModal,
    Na = clientsDomain.createClient,
    ja = clientsDomain.updateClient,
    Ea = clientsDomain.deleteClient,
    Jt = clientsDomain.toggleClientStatus,
    Qt = clientsDomain.refreshSelectedClient,
    Ta = clientsDomain.openClientFullGallery,
    openMissionClientView = clientsDomain.openMissionClientView,
    openClientSectionGallery = clientsDomain.openClientSectionGallery,
    openClientShoppingGallery = clientsDomain.openClientShoppingGallery,
    Aa = clientsDomain.closeSelectedClient,
    generateClientHistoryShareLink = clientsDomain.generateClientHistoryShareLink,
    copyClientMissionShareLink = clientsDomain.copyClientMissionShareLink,
    copyClientShipmentHistoryLink = clientsDomain.copyClientShipmentHistoryLink,
    storesLoadedRef = V.useRef(!1),
    carrierRecommendationsLoadedRef = V.useRef(!1),
    homeDesktopGridRef = V.useRef(null),
    homeDesktopLayoutRef = V.useRef(normalizeHomeDesktopLayout(null)),
    homeDesktopResizeRef = V.useRef(null),
    queueCoreRefreshActionRef = V.useRef(() => {}),
    queueSelectedClientRefreshActionRef = V.useRef(() => {}),
    refreshCoreDataActionRef = V.useRef(() => {}),
    refreshSelectedClientActionRef = V.useRef(() => {}),
    paymentDomainRef = V.useRef({}),
    shoppingCalcPersistTimerRef = V.useRef(null),
    shoppingsDomain = useShoppingsDomain({
      accessToken: C,
      apiFetch: I,
      activeMissionIdRef,
      setClients: _l,
      currentUser: J,
      stores,
      setStores,
      setStoreRecommendations,
      notifyInfo,
      notifySuccess,
      notifyError,
      confirmAction,
      openImageSourcePicker,
      refreshCoreDataRef: refreshCoreDataActionRef,
      refreshSelectedClientRef: refreshSelectedClientActionRef,
      selectedClient: W,
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
    }),
    Al = shoppingsDomain.shoppings,
    zl = shoppingsDomain.setShoppings,
    w = shoppingsDomain.activeShopping,
    Dl = shoppingsDomain.setActiveShopping,
    fn = shoppingsDomain.expandedMissionId,
    rn = shoppingsDomain.setExpandedMissionId,
    pa = shoppingsDomain.editingMissionId,
    dn = shoppingsDomain.setEditingMissionId,
    Sa = shoppingsDomain.editingMissionName,
    uu = shoppingsDomain.setEditingMissionName,
    requests = shoppingsDomain.requests,
    setRequests = shoppingsDomain.setRequests,
    openHistoryMissionByClient = shoppingsDomain.openHistoryMissionByClient,
    setOpenHistoryMissionByClient = shoppingsDomain.setOpenHistoryMissionByClient,
    showMissionStartModal = shoppingsDomain.showMissionStartModal,
    setShowMissionStartModal = shoppingsDomain.setShowMissionStartModal,
    missionStartForm = shoppingsDomain.missionStartForm,
    setMissionStartForm = shoppingsDomain.setMissionStartForm,
    missionSummaryOpen = shoppingsDomain.missionSummaryOpen,
    setMissionSummaryOpen = shoppingsDomain.setMissionSummaryOpen,
    missionSummaryStatusFilter = shoppingsDomain.missionSummaryStatusFilter,
    setMissionSummaryStatusFilter = shoppingsDomain.setMissionSummaryStatusFilter,
    missionSearch = shoppingsDomain.missionSearch,
    setMissionSearch = shoppingsDomain.setMissionSearch,
    missionTicketUploading = shoppingsDomain.missionTicketUploading,
    shoppingClientAssignmentSavingId = shoppingsDomain.shoppingClientAssignmentSavingId,
    loadRequestsData = shoppingsDomain.loadRequestsData,
    getMissionRequestDetailPath = shoppingsDomain.getMissionRequestDetailPath,
    reloadMissionRequests = shoppingsDomain.reloadMissionRequests,
    resetShoppingsDomain = shoppingsDomain.resetShoppingsDomain,
    getMissionStoreLabel = shoppingsDomain.getMissionStoreLabel,
    getOpenShoppingMissions = shoppingsDomain.getOpenShoppingMissions,
    resolveSelectedShopping = shoppingsDomain.resolveSelectedShopping,
    openMissionStart = shoppingsDomain.openMissionStart,
    ye = shoppingsDomain.createShopping,
    be = shoppingsDomain.pauseMission,
    cu = shoppingsDomain.resumeMission,
    toggleShoppingClientAssignment = shoppingsDomain.toggleShoppingClientAssignment,
    on = shoppingsDomain.endMission,
    mn = shoppingsDomain.deleteMission,
    Fe = shoppingsDomain.saveEditedMission,
    openMissionTicketPicker = shoppingsDomain.openMissionTicketPicker,
    paymentsDomain = usePaymentsDomain({
      apiFetch: I,
      clients: Kl,
      shoppings: Al,
      paymentDomainRef,
      refreshCoreDataRef: refreshCoreDataActionRef,
      refreshSelectedClientRef: refreshSelectedClientActionRef,
      notifyInfo,
      notifySuccess,
      notifyError,
      confirmAction,
    }),
    paymentModalOpen = paymentsDomain.paymentModalOpen,
    paymentSaving = paymentsDomain.paymentSaving,
    paymentProductSearch = paymentsDomain.paymentProductSearch,
    setPaymentProductSearch = paymentsDomain.setPaymentProductSearch,
    paymentAmountManual = paymentsDomain.paymentAmountManual,
    setPaymentAmountManual = paymentsDomain.setPaymentAmountManual,
    paymentForm = paymentsDomain.paymentForm,
    setPaymentForm = paymentsDomain.setPaymentForm,
    paymentEntryEditingId = paymentsDomain.paymentEntryEditingId,
    setPaymentEntryEditingId = paymentsDomain.setPaymentEntryEditingId,
    paymentEntryDraftAmount = paymentsDomain.paymentEntryDraftAmount,
    setPaymentEntryDraftAmount = paymentsDomain.setPaymentEntryDraftAmount,
    paymentEntrySavingId = paymentsDomain.paymentEntrySavingId,
    clientPaymentModalOpen = paymentsDomain.clientPaymentModalOpen,
    clientPaymentSaving = paymentsDomain.clientPaymentSaving,
    clientPaymentAmountManual = paymentsDomain.clientPaymentAmountManual,
    setClientPaymentAmountManual = paymentsDomain.setClientPaymentAmountManual,
    clientPaymentForm = paymentsDomain.clientPaymentForm,
    setClientPaymentForm = paymentsDomain.setClientPaymentForm,
    clientPaymentEntryEditingId = paymentsDomain.clientPaymentEntryEditingId,
    clientPaymentEntryDraftAmount = paymentsDomain.clientPaymentEntryDraftAmount,
    setClientPaymentEntryDraftAmount = paymentsDomain.setClientPaymentEntryDraftAmount,
    clientPaymentEntrySavingId = paymentsDomain.clientPaymentEntrySavingId,
    closePaymentModal = paymentsDomain.closePaymentModal,
    closeClientPaymentModal = paymentsDomain.closeClientPaymentModal,
    openPaymentModal = paymentsDomain.openPaymentModal,
    openClientPaymentModal = paymentsDomain.openClientPaymentModal,
    togglePaymentProductSelection = paymentsDomain.togglePaymentProductSelection,
    startEditingPaymentEntry = paymentsDomain.startEditingPaymentEntry,
    cancelEditingPaymentEntry = paymentsDomain.cancelEditingPaymentEntry,
    savePaymentEntry = paymentsDomain.savePaymentEntry,
    deletePaymentEntry = paymentsDomain.deletePaymentEntry,
    savePayment = paymentsDomain.savePayment,
    saveClientPayment = paymentsDomain.saveClientPayment,
    startEditingClientPaymentEntry = paymentsDomain.startEditingClientPaymentEntry,
    cancelEditingClientPaymentEntry = paymentsDomain.cancelEditingClientPaymentEntry,
    saveClientPaymentHistoryRow = paymentsDomain.saveClientPaymentHistoryRow,
    deleteClientPaymentHistoryRow = paymentsDomain.deleteClientPaymentHistoryRow,
    deletePayment = paymentsDomain.deletePayment,
    shipmentsDomain = useShipmentsDomain({
      accessToken: C,
      apiFetch: I,
      clients: Kl,
      shoppings: Al,
      notifyInfo,
      notifySuccess,
      notifyError,
      confirmAction,
      openInputDialog,
      openImageSourcePicker,
      setPublicExpandedShipmentId,
      publicClientShareToken,
      reloadPublicShareData: (...args) => reloadPublicShareData(...args),
      queueCoreRefreshRef: queueCoreRefreshActionRef,
      queueSelectedClientRefreshRef: queueSelectedClientRefreshActionRef,
      refreshCoreDataRef: refreshCoreDataActionRef,
      refreshSelectedClientRef: refreshSelectedClientActionRef,
      currentTabRef,
      productStatusUpdatingId,
      setProductStatusUpdatingId,
    }),
    shipments = shipmentsDomain.shipments,
    setShipments = shipmentsDomain.setShipments,
    shipmentSearch = shipmentsDomain.shipmentSearch,
    setShipmentSearch = shipmentsDomain.setShipmentSearch,
    shipmentEvidenceUploadingId = shipmentsDomain.shipmentEvidenceUploadingId,
    shipmentEvidenceDeletingId = shipmentsDomain.shipmentEvidenceDeletingId,
    shipmentEvidenceReplacingId = shipmentsDomain.shipmentEvidenceReplacingId,
    openShipmentEvidenceMenuId = shipmentsDomain.openShipmentEvidenceMenuId,
    setOpenShipmentEvidenceMenuId = shipmentsDomain.setOpenShipmentEvidenceMenuId,
    shipmentDetailLoadingIds = shipmentsDomain.shipmentDetailLoadingIds,
    expandedShipmentIds = shipmentsDomain.expandedShipmentIds,
    setExpandedShipmentIds = shipmentsDomain.setExpandedShipmentIds,
    shipmentSaving = shipmentsDomain.shipmentSaving,
    shipmentModalOpen = shipmentsDomain.shipmentModalOpen,
    setShipmentModalOpen = shipmentsDomain.setShipmentModalOpen,
    shipmentClientPickerOpen = shipmentsDomain.shipmentClientPickerOpen,
    setShipmentClientPickerOpen = shipmentsDomain.setShipmentClientPickerOpen,
    shipmentClientSearch = shipmentsDomain.shipmentClientSearch,
    setShipmentClientSearch = shipmentsDomain.setShipmentClientSearch,
    shipmentProductPickerOpen = shipmentsDomain.shipmentProductPickerOpen,
    setShipmentProductPickerOpen = shipmentsDomain.setShipmentProductPickerOpen,
    shipmentProductSearch = shipmentsDomain.shipmentProductSearch,
    setShipmentProductSearch = shipmentsDomain.setShipmentProductSearch,
    setShipmentProductRenderLimit = shipmentsDomain.setShipmentProductRenderLimit,
    shipmentForm = shipmentsDomain.shipmentForm,
    setShipmentForm = shipmentsDomain.setShipmentForm,
    shipmentsLoadedRef = shipmentsDomain.shipmentsLoadedRef,
    loadShipmentsData = shipmentsDomain.loadShipmentsData,
    resetShipmentsDomain = shipmentsDomain.resetShipmentsDomain,
    getShipmentEvidenceKind = shipmentsDomain.getShipmentEvidenceKind,
    getShipmentPurchasePriceAmount = shipmentsDomain.getShipmentPurchasePriceAmount,
    getShipmentSalePriceAmount = shipmentsDomain.getShipmentSalePriceAmount,
    getPublicShipmentSalePriceSummary = shipmentsDomain.getPublicShipmentSalePriceSummary,
    upsertShipmentListItem = shipmentsDomain.upsertShipmentListItem,
    shipmentHasHydratedDetail = shipmentsDomain.shipmentHasHydratedDetail,
    mergeShipmentSummariesWithHydrated = shipmentsDomain.mergeShipmentSummariesWithHydrated,
    fetchShipmentDetail = shipmentsDomain.fetchShipmentDetail,
    getShipmentClientProducts = shipmentsDomain.getShipmentClientProducts,
    getShipmentProductPickerState = shipmentsDomain.getShipmentProductPickerState,
    getClientShipmentAddressOptions = shipmentsDomain.getClientShipmentAddressOptions,
    getShipmentFormState = shipmentsDomain.getShipmentFormState,
    isShipmentExpanded = shipmentsDomain.isShipmentExpanded,
    toggleExpandedShipment = shipmentsDomain.toggleExpandedShipment,
    resetExpandedShipmentForm = shipmentsDomain.resetExpandedShipmentForm,
    openShipmentEditor = shipmentsDomain.openShipmentEditor,
    updateShipmentForm = shipmentsDomain.updateShipmentForm,
    selectShipmentClient = shipmentsDomain.selectShipmentClient,
    toggleShipmentProductSelection = shipmentsDomain.toggleShipmentProductSelection,
    saveShipmentEditor = shipmentsDomain.saveShipmentEditor,
    openShipmentAssignmentPicker = shipmentsDomain.openShipmentAssignmentPicker,
    deleteShipment = shipmentsDomain.deleteShipment,
    openShipmentEvidencePicker = shipmentsDomain.openShipmentEvidencePicker,
    openShipmentEvidenceReplacePicker = shipmentsDomain.openShipmentEvidenceReplacePicker,
    deleteShipmentEvidence = shipmentsDomain.deleteShipmentEvidence,
    setShipmentProductStatusQuick = shipmentsDomain.setShipmentProductStatusQuick,
    shipmentModalClient = shipmentsDomain.shipmentModalClient,
    filteredShipmentClients = shipmentsDomain.filteredShipmentClients,
    shipmentHiddenProductsMessage = shipmentsDomain.shipmentHiddenProductsMessage,
    shipmentModalFilteredProducts = shipmentsDomain.shipmentModalFilteredProducts,
    shipmentVisibleProductCards = shipmentsDomain.shipmentVisibleProductCards,
    shipmentHasMoreProductCards = shipmentsDomain.shipmentHasMoreProductCards,
    shipmentSelectedProducts = shipmentsDomain.shipmentSelectedProducts,
    Ti = async () => {
      try {
        const o = await I("/auth/me/");
        (b(o),
          o.profile.role === "BOTH" ? H("AV") : H(o.profile.role),
          setLayoutMode(
            o.profile.layout_mode === "WEB" ? "WEB" : "MOBILE",
          ),
          setThemeMode(
            o.profile.theme_mode === "DARK" ? "DARK" : "LIGHT",
          ));
        const [N, A, yl, Vs] = await Promise.all([
          I("/clients/"),
          I("/shoppings/"),
          I("/shipments/"),
          I("/users/"),
        ]);
        _l(N || []);
        zl(A || []);
        setShipments((El) => mergeShipmentSummariesWithHydrated(El, yl || []));
        setUsers(Vs || []);
        Dl(resolveSelectedShopping(A || [], activeMissionIdRef.current));
      } catch (o) {
        console.error("Failed loading data", o);
      }
    },
    loadStoreData = async (o = !1) => {
      if (!C || (storesLoadedRef.current && !o)) return;
      try {
        const [N, A] = await Promise.all([
          I("/stores/"),
          I("/store-recommendations/"),
        ]);
        setStores(N || []);
        setStoreRecommendations(A || []);
        storesLoadedRef.current = !0;
      } catch (N) {
        console.error("Failed loading store data", N);
      }
    },
    loadCarrierRecommendations = async (o = !1) => {
      if (!C || (carrierRecommendationsLoadedRef.current && !o)) return;
      try {
        const N = await I("/shipping-carrier-recommendations/");
        setShippingCarrierRecommendations(N || []);
        carrierRecommendationsLoadedRef.current = !0;
      } catch (N) {
        console.error("Failed loading carrier recommendations", N);
      }
    },
    // <-------- seccion 8: refresh de clientes + misiones para eventos websocket
    refreshCoreData = async () => {
      try {
        const [N, A, yl] = await Promise.all([
          I("/clients/"),
          I("/shoppings/"),
          shipmentsLoadedRef.current || currentTabRef.current === "SHIPMENTS"
            ? I("/shipments/")
            : Promise.resolve(null),
        ]);
        _l(N || []);
        zl(A || []);
        yl && setShipments((El) => mergeShipmentSummariesWithHydrated(El, yl || []));
        Dl(resolveSelectedShopping(A || []));
      } catch {}
    },
    loadAuxiliaryData = async () => {
      await Promise.all([
        loadStoreData(!0),
        loadCarrierRecommendations(!0),
      ]);
    },
    refreshUsers = async () => {
      try {
        const o = await I("/users/");
        setUsers(o || []);
        return o || [];
      } catch (o) {
        console.error("Failed loading users", o);
        return [];
      }
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
    realtimeUpdates = useRealtimeUpdates({
      accessToken: C,
      currentView: nl,
      apiFetch: I,
      refreshCoreData,
      refreshSelectedClient,
      selectedClientIdRef,
      activeMissionIdRef,
      openShoppingTabsRef,
      setHomeNeedsAttention,
      setRequests,
      setProductReviews,
      setMissionReviewAlerts,
      setHomeUnreadSummary,
      setShoppingUnreadSummaryMap,
      setStores,
      setStoreRecommendations,
    }),
    queueCoreRefresh = realtimeUpdates.queueCoreRefresh,
    queueSelectedClientRefresh = realtimeUpdates.queueSelectedClientRefresh,
    overlayNavigation = useOverlayNavigation({
      overlays: [
        { key: "confirm", open: confirmDialog },
        { key: "image-source", open: imageSourceDialog },
        { key: "input", open: inputDialog },
        { key: "client-payment-modal", open: clientPaymentModalOpen },
        { key: "payment-modal", open: paymentModalOpen },
        { key: "shipment-product-picker", open: shipmentProductPickerOpen },
        { key: "fullscreen-image", open: fullscreenImage },
        { key: "shipment-modal", open: shipmentModalOpen },
        { key: "review-conversation", open: reviewConversationEntry },
        { key: "group-ticket", open: Pl },
        { key: "edit-ticket", open: ji && Je },
        { key: "edit-product", open: me && he },
        { key: "edit-client", open: K },
        { key: "client-home", open: W },
        { key: "add-client", open: Il },
        { key: "shopping-summary", open: missionSummaryOpen },
        { key: "shopping-start", open: showMissionStartModal },
      ],
      closeActiveOverlay: () => {
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
          closeClientPaymentModal();
          return;
        }
        if (paymentModalOpen) {
          closePaymentModal();
          return;
        }
        if (shipmentProductPickerOpen) {
          setShipmentProductPickerOpen(!1);
          return;
        }
        if (fullscreenImage) {
          setFullscreenImage(null);
          return;
        }
        if (shipmentModalOpen) {
          setShipmentModalOpen(!1);
          setShipmentProductPickerOpen(!1);
          return;
        }
        if (reviewConversationEntry) {
          setReviewConversationEntry(null);
          setReviewConversationWahaEnabled(!1);
          setReviewConversationRecipientIds([]);
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
      },
    }),
    closingOverlayKey = overlayNavigation.closingOverlayKey,
    setClosingOverlayKey = overlayNavigation.setClosingOverlayKey,
    dismissActiveOverlayRef = overlayNavigation.dismissActiveOverlayRef,
    overlayBackdropClass = overlayNavigation.overlayBackdropClass,
    overlaySheetClass = overlayNavigation.overlaySheetClass,
    sectionSwitchTimerRef = V.useRef(null),
    sectionSettleTimerRef = V.useRef(null);
  V.useEffect(() => {
    setClosingOverlayKeyActionRef.current = setClosingOverlayKey;
    queueCoreRefreshActionRef.current = queueCoreRefresh;
    queueSelectedClientRefreshActionRef.current = queueSelectedClientRefresh;
    refreshCoreDataActionRef.current = refreshCoreData;
    refreshSelectedClientActionRef.current = refreshSelectedClient;
  }, [
    queueCoreRefresh,
    queueSelectedClientRefresh,
    refreshCoreData,
    refreshSelectedClient,
    setClosingOverlayKey,
  ]);
  V.useEffect(() => {
    const normalized = themeMode === "DARK" ? "DARK" : "LIGHT";
    localStorage.setItem("theme_mode", normalized);
    document.documentElement.classList.toggle("dark", normalized === "DARK");
  }, [themeMode]);
  V.useEffect(() => {
    if (!pendingProductFile) {
      setPendingProductPreviewUrl("");
      return;
    }
    const previewUrl = URL.createObjectURL(pendingProductFile);
    setPendingProductPreviewUrl(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [pendingProductFile]);
  V.useEffect(() => {
    setProfileSettingsForm({
      display_name: String((J && J.profile && J.profile.display_name) || ""),
      phone_country_code: String((J && J.profile && J.profile.phone_country_code) || "+52"),
      phone: String((J && J.profile && J.profile.phone) || ""),
      waha_api_url: String((J && J.profile && J.profile.waha_api_url) || ""),
      waha_api_key: String((J && J.profile && J.profile.waha_api_key) || ""),
      waha_session: String((J && J.profile && J.profile.waha_session) || ""),
      waha_phone_prefix: String((J && J.profile && J.profile.waha_phone_prefix) || "521"),
      waha_chat_id_suffix: String((J && J.profile && J.profile.waha_chat_id_suffix) || "@c.us"),
    });
  }, [J]);
  V.useEffect(() => {
    if (!me || !he || !productPriceAutoSync) return;
    const productEffectiveDiscountPercentageNow = 0;
    if (productPriceSyncSource === "charged") {
      const o = computeProductModalStorePrice(
        st.charged_price,
        productEffectiveDiscountPercentageNow,
      );
      const N = Number.isFinite(o) ? o.toFixed(2) : "";
      Gt((A) =>
        String((A && A.real_price) || "") === N ? A : { ...A, real_price: N },
      );
      return;
    }
    const o = computeProductModalFinalPrice(
      st.real_price,
      productEffectiveDiscountPercentageNow,
    );
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
      N = o ? getClientPaymentGlobalDebtAmount(o) : 0,
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
    if (!C) {
      setSeenReviewItemMap({});
      resetShipmentsDomain();
      resetShoppingsDomain();
      storesLoadedRef.current = !1;
      carrierRecommendationsLoadedRef.current = !1;
      setStores([]);
      setStoreRecommendations([]);
      setShippingCarrierRecommendations([]);
      return;
    }
    let cancelled = !1;
    (async () => {
      try {
        const o = await I("/auth/me/");
        if (cancelled) return;
        b(o);
        o.profile.role === "BOTH" ? H("AV") : H(o.profile.role);
        setLayoutMode(
          o.profile.layout_mode === "WEB" ? "WEB" : "MOBILE",
        );
        setThemeMode(
          o.profile.theme_mode === "DARK" ? "DARK" : "LIGHT",
        );
        const [N, A, Vs] = await Promise.all([
          I("/clients/"),
          I("/shoppings/"),
          I("/users/"),
        ]);
        if (cancelled) return;
        _l(N || []);
        zl(A || []);
        setUsers(Vs || []);
        const vl = resolveSelectedShopping(A || [], activeMissionIdRef.current);
        Dl(vl || null);
        // Inline calc sync to avoid extra render cycle from the calc sync effect
        if (vl) {
          const cm = String(vl.calc_mode || "FACTOR").toUpperCase();
          (cm === "FACTOR" || cm === "PERCENTAGE") && setCalcMode(cm);
          const fv = parseFloat(vl.factor_value);
          Number.isFinite(fv) && setCalcFactor(fv);
          const tp = parseFloat(vl.tax_percentage);
          Number.isFinite(tp) && setCalcTaxes(tp);
          const cp = parseFloat(vl.commission_percentage);
          Number.isFinite(cp) && setCalcCommission(cp);
          const er = parseFloat(vl.exchange_rate);
          Number.isFinite(er) && setCalcExchangeRate(er);
          const dp = parseFloat(vl.discount_percentage);
          Number.isFinite(dp) && setCalcDiscount(dp);
        }
      } catch (o) {
        console.error("Failed loading data", o);
      }
    })();
    return () => { cancelled = !0; };
  }, [C]);
  V.useEffect(() => {
    if (!C) return;
    if (nl === "SHIPMENTS") {
      loadShipmentsData().catch((o) => {
        console.error("Failed lazy loading shipments", o);
      });
      loadCarrierRecommendations().catch((o) => {
        console.error("Failed lazy loading carrier recommendations", o);
      });
      return;
    }
    if (nl === "HOME" || nl === "MISSIONS") {
      loadStoreData().catch((o) => {
        console.error("Failed lazy loading store data", o);
      });
      loadRequestsData().catch((o) => {
        console.error("Failed lazy loading requests", o);
      });
      return;
    }
    if (nl === "CLIENTS") {
      loadStoreData().catch((o) => {
        console.error("Failed lazy loading store data", o);
      });
    }
  }, [C, nl]);
  V.useEffect(
    () => () => {
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
    openShoppingTabsRef.current = getOpenShoppingMissions(Al);
  }, [Al]);
  V.useEffect(() => {
    if (!Array.isArray(Al)) return;
    const selected = resolveSelectedShopping(Al, activeMissionIdRef.current);
    const selectedId = Number((selected && selected.id) || 0);
    const activeId = Number((w && w.id) || 0);
    if (selectedId !== activeId || (selected && selected !== w)) {
      Dl(selected || null);
    }
  }, [Al, w, Dl, resolveSelectedShopping]);
  V.useEffect(() => {
    if (publicShareType || typeof window === "undefined") return;
    const o = () => {
      const N = getAppRouteFromPath(window.location.pathname);
      if (N.isPublicShare) return;
      pendingHomeClientRouteRef.current = N.homeClientSlug;
      setSectionTransitionStage("idle");
      Ll(N.section);
      if (N.section !== "HOME" || !N.homeClientSlug) et(null);
    };
    window.addEventListener("popstate", o);
    return () => window.removeEventListener("popstate", o);
  }, [publicShareType]);
  V.useEffect(() => {
    if (!C || publicShareType || nl !== "HOME") return;
    const o = pendingHomeClientRouteRef.current;
    if (!o) return;
    const N = Kl.find((A) => {
      const vl = slugifyRouteToken(A.name || A.username || A.id);
      return vl === o || String(A.id) === String(o);
    });
      N &&
        (!W || Number(W.id) !== Number(N.id) || !Array.isArray(W.receipts)) &&
        hydrateClientDetail(N);
  }, [C, publicShareType, nl, Kl, W, hydrateClientDetail]);
  V.useEffect(() => {
    if (!C || publicShareType || typeof window === "undefined") return;
    const o =
      nl === "HOME"
        ? W
          ? slugifyRouteToken(W.name || W.username || W.id)
          : pendingHomeClientRouteRef.current
        : null;
    const N = buildAppPath(nl, { homeClientSlug: o });
    window.location.pathname !== N && window.history.replaceState({}, "", N);
  }, [C, publicShareType, nl, W]);
  V.useEffect(() => {
    if (!C) {
      setShoppingUnreadSummaryMap({});
      return;
    }
    const shoppingTabs = openShoppingTabsRef.current || [];
    if (!shoppingTabs.length) {
      setShoppingUnreadSummaryMap({});
      return;
    }
    let cancelled = !1;
    (async () => {
      try {
        const entries = await Promise.all(
          shoppingTabs.map(async (mission) => {
            const missionId = Number(mission && mission.id) || 0;
            if (!missionId) return [null, null];
            try {
              const summary = await I(`/reviews/unread-summary/?shopping=${missionId}`);
              return [String(missionId), summary || {}];
            } catch (error) {
              console.error("Failed loading unread summary for shopping", missionId, error);
              return [String(missionId), {}];
            }
          }),
        );
        if (cancelled) return;
        setShoppingUnreadSummaryMap(
          entries.reduce((acc, entry) => {
            const [key, value] = entry || [];
            if (!key) return acc;
            acc[key] = value || {};
            return acc;
          }, {}),
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Failed loading unread summaries for open shoppings", error);
          setShoppingUnreadSummaryMap({});
        }
      }
    })();
    return () => {
      cancelled = !0;
    };
  }, [C, Al]);
  V.useEffect(() => {
    const o = () => setIsWideViewport(window.innerWidth >= 1024);
    o();
    window.addEventListener("resize", o);
    return () => window.removeEventListener("resize", o);
  }, []);
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
    if (!C) {
      setRequests([]);
    }
  }, [C]);
  // <-------- seccion 8: carga inicial de revisiones por cliente (sin polling)
  V.useEffect(() => {
    const o = W && W.id ? Number(W.id) : null;
    if (!C || !o) {
      setProductReviews([]);
      return;
    }
    let isMounted = !0;
    const cancel = scheduleIdleTask(async () => {
      try {
        const N = await I(`/reviews/?client=${o}`);
        isMounted && setProductReviews(N || []);
      } catch (N) {
        console.error("Failed loading product reviews", N);
      }
    }, 800);
    return () => {
      isMounted = !1;
      cancel();
    };
  }, [C, W && W.id]);
  V.useEffect(() => {
    const o = w && w.id ? Number(w.id) : null;
    if (!C || !o) {
      setHomeUnreadSummary({});
      return;
    }
    let isMounted = !0;
    const cancel = scheduleIdleTask(async () => {
      try {
        const N = await I(`/reviews/unread-summary/?shopping=${o}`);
        isMounted && setHomeUnreadSummary(N || {});
      } catch (N) {
        console.error("Failed loading unread review summary", N);
      }
    }, 700);
    return () => {
      isMounted = !1;
      cancel();
    };
  }, [C, w && w.id]);
  // <-------- seccion 8: carga inicial de alertas de revision por mision
  V.useEffect(() => {
    const o = w && w.id ? Number(w.id) : null,
      N = String((w && w.status) || "");
    if (!C || !o || (N !== "ACTIVE" && N !== "PAUSED")) {
      setMissionReviewAlerts([]);
      return;
    }
    let isMounted = !0;
    const cancel = scheduleIdleTask(async () => {
      try {
        const A = await I(`/reviews/?shopping=${o}`);
        isMounted &&
          setMissionReviewAlerts(
            (A || []).filter(
              (vl) => vl.status === "PENDING" || vl.status === "ALTERNATIVE_SENT",
            ),
          );
      } catch (A) {
        console.error("Failed loading shopping reviews", A);
      }
    }, 900);
    return () => {
      isMounted = !1;
      cancel();
    };
  }, [C, w && w.id, w && w.status]);
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
  V.useEffect(
    () => () => {
      reviewConversationSendCooldownTimerRef.current &&
        clearTimeout(reviewConversationSendCooldownTimerRef.current);
    },
    [],
  );
  V.useEffect(
    () => () => {
      const resizeState = homeDesktopResizeRef.current;
      if (!resizeState) return;
      document.removeEventListener("mousemove", resizeState.handleMove);
      document.removeEventListener("mouseup", resizeState.handleUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      homeDesktopResizeRef.current = null;
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
    iu = handleUnauthorized,
    syncBrowserRoute = (o, N = {}, A = !0) => {
      if (typeof window === "undefined" || publicShareType) return;
      const vl = buildAppPath(o, N);
      if (window.location.pathname === vl) return;
      window.history[A ? "replaceState" : "pushState"]({}, "", vl);
    },
    navigateSection = (o) => {
      if (o === nl) return;
      sectionSwitchTimerRef.current && clearTimeout(sectionSwitchTimerRef.current);
      sectionSettleTimerRef.current && clearTimeout(sectionSettleTimerRef.current);
      setSectionTransitionStage("out");
      sectionSwitchTimerRef.current = setTimeout(() => {
        Ll(o);
        pendingHomeClientRouteRef.current = null;
        syncBrowserRoute(o, {}, !1);
        setSectionTransitionStage("in");
        sectionSwitchTimerRef.current = null;
        sectionSettleTimerRef.current = setTimeout(() => {
          setSectionTransitionStage("idle");
          sectionSettleTimerRef.current = null;
        }, 220);
      }, 110);
    },
    su = () => {
      if (receiptUploading) return;
      openImageSourcePicker(ru, { title: "Subir ticket" });
    },
    fu = () => {
      if (newProductUploading) return;
      openImageSourcePicker(lt, { title: "Agregar producto" });
    },
    Xt = (o) => {
      if (productImageUploadingId) return;
      (Ke(o), openImageSourcePicker((N) => Xl(N, o), { title: "Cambiar foto" }));
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
    Xl = async (o, selectedProduct = he) => {
      const targetProduct = selectedProduct || he;
      if (!targetProduct) return;
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const originalFile = N[0];
      const compressedFile = await compressImage(originalFile).catch(() => originalFile);
      const A = new FormData();
      A.append("image", compressedFile);
      const vl = targetProduct.id;
      setProductImageUploadingId(vl);
      try {
        const updatedProduct = await I(`/products/${vl}/`, { method: "PATCH", body: A });
        updateClientProductState(updatedProduct || { ...targetProduct, image: targetProduct.image });
        await refreshCoreData();
        await Qt();
        notifySuccess("Foto actualizada.");
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
    productModalAppliesDiscount = (o = st) =>
      !o || o.apply_discount !== !1,
    getProductModalPriceMultiplier = (o = st, discountPercent = null) => {
      const N =
          discountPercent === null
            ? toNumber(o && o.discount_percentage, 0)
            : toNumber(discountPercent, 0),
        A = productModalAppliesDiscount(o)
          ? Math.max(0, 1 - N / 100)
          : 1;
      if (String(calcMode).toUpperCase() === "FACTOR")
        return (parseFloat(calcFactor) || 0) * A;
      return (
        A *
        (1 + (parseFloat(calcCommission) || 0) / 100) *
        (1 + (parseFloat(calcTaxes) || 0) / 100) *
        (parseFloat(calcExchangeRate) || 0)
      );
    },
    computeProductModalFinalPrice = (o, discountPercent = null) => {
      const N = parseFloat(o);
      const A = getProductModalPriceMultiplier(st, discountPercent);
      return Number.isFinite(N) && Number.isFinite(A) ? N * A : Number.NaN;
    },
    computeProductModalStorePrice = (o, discountPercent = null) => {
      const N = parseFloat(o);
      const A = getProductModalPriceMultiplier(st, discountPercent);
      return Number.isFinite(N) && Number.isFinite(A) && A > 0
        ? N / A
        : Number.NaN;
    },
    computeProductModalDiscountedPrice = (o, discountPercent = null) => {
      const N = parseFloat(o);
      const A =
        discountPercent === null
          ? toNumber(st.discount_percentage, 0)
          : toNumber(discountPercent, 0);
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
        productDiscountUsesGlobal =
          o && typeof o.discount_uses_global !== "undefined"
            ? o.discount_uses_global !== !1
            : toNumber(calcDiscount, 0) > 0,
        productDiscountDefaultPercent =
          productDiscountUsesGlobal && toNumber(calcDiscount, 0) > 0
            ? toNumber(calcDiscount, 0)
            : toNumber(o && o.discount_percentage, 0),
        computedFinalPrice = computeProductModalFinalPrice(SeRealPrice, 0),
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
          getUnifiedReviewState(
            typeof A.formStatus === "string" && A.formStatus.trim()
              ? A.formStatus
              : getProductReviewState(
                o,
                o && o.id ? latestReviewsByProduct[o.id] || null : null,
              ),
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
            apply_discount: (o && o.apply_discount) !== !1,
            discount_percentage: productDiscountDefaultPercent,
            discount_uses_global: productDiscountUsesGlobal,
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
        setPendingProductPreviewUrl(""),
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
        Se = (ElContextShopping && ElContextShopping.store) || "",
        productDefaultDiscount = toNumber(calcDiscount, 0);
      openProductModal(
        createEmptyProductForm({
          shopping:
            Number.isFinite(ElScopedShoppingId) && ElScopedShoppingId > 0
              ? String(ElScopedShoppingId)
              : "",
          store: Se,
          status: vl,
          discount_uses_global: productDefaultDiscount > 0,
          discount_percentage: productDefaultDiscount > 0
            ? productDefaultDiscount.toFixed(2)
            : "0.00",
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
    updateClientProductState = (product) => {
      if (!product || !product.id) return;
      const normalizedProduct = {
        ...product,
        status: normalizeProductModalStatus(product.status),
        apply_discount: product.apply_discount !== !1,
        discount_uses_global: product.discount_uses_global !== !1,
        discount_percentage: String(
          product.discount_percentage ?? "0.00",
        ),
      };
      const upsertProduct = (items = []) => {
        const list = Array.isArray(items) ? [...items] : [];
        const index = list.findIndex((item) => Number(item && item.id) === Number(normalizedProduct.id));
        if (index >= 0) list[index] = { ...list[index], ...normalizedProduct };
        else list.push(normalizedProduct);
        return list;
      };
      if (W && Number(W.id) === Number(normalizedProduct.client)) {
        et((current) =>
          current && Number(current.id) === Number(normalizedProduct.client)
            ? { ...current, products: upsertProduct(current.products || []) }
            : current,
        );
      }
      _l((clients) =>
        (clients || []).map((client) =>
          Number(client && client.id) === Number(normalizedProduct.client)
            ? { ...client, products: upsertProduct(client.products || []) }
            : client,
        ),
      );
      if (w && Number(normalizedProduct.shopping || 0) === Number(w.id)) {
        Dl((current) =>
          current && Number(current.id) === Number(w.id)
            ? { ...current, products: upsertProduct(current.products || []) }
            : current,
        );
      }
    },
    buildProductModalPayload = () => {
      const o = computeProductModalFinalPrice(st.real_price, 0),
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
            apply_discount: st.apply_discount !== !1,
            discount_uses_global: st.discount_uses_global !== !1,
            discount_percentage:
              A(productEffectiveDiscountPercentage) || "0.00",
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
      const ElPreservedScopeId = clientGalleryMissionScopeId,
        SePreservedScopeMeta = clientGalleryMissionScopeMeta,
        eaPreservedAllowsChoice = clientGalleryAllowsShoppingChoice;
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
          Se.append("apply_discount", N.apply_discount ? "true" : "false");
          Se.append(
            "discount_uses_global",
            N.discount_uses_global ? "true" : "false",
          );
          Se.append(
            "discount_percentage",
            String(
              N.discount_percentage !== null &&
              typeof N.discount_percentage !== "undefined" &&
              String(N.discount_percentage).trim() !== ""
                ? N.discount_percentage
                : "0.00",
            ),
          );
          N.tags && Se.append("tags", N.tags);
          !N.shopping && N.store !== null && Se.append("store", String(N.store));
          const gl = await I("/products/", { method: "POST", body: Se });
          const shouldOpenReviewNotify =
            String(A || "").toUpperCase() === "REVIEW" ||
            String(N.status || "").toUpperCase() === "REVIEW" ||
            String(N.status || "").toUpperCase() === "IN_REVIEW";
          updateClientProductState({
            ...gl,
            ...N,
            status: normalizeProductModalStatus(
              (gl && gl.status) || N.status || "ANNOTATED",
            ),
          });
          A !== "ANNOTATED" &&
            (await syncProductReviewState(
              { ...gl, status: N.status },
              null,
              A,
            ));
          if (shouldOpenReviewNotify) {
            const reviewClientId = Number((gl && gl.client) || (W && W.id) || 0);
            const reviewClient =
              (W && Number(W.id) === reviewClientId && W) ||
              (Kl || []).find((El) => Number(El.id) === reviewClientId) ||
              W ||
              null;
            openReviewNotifyModal(
              {
                ...gl,
                ...N,
                status: normalizeProductModalStatus((gl && gl.status) || N.status || "ANNOTATED"),
              },
              reviewClient,
            );
          }
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
        closeProductModal(!0);
        await refreshProductReviews(W && W.id);
        queueCoreRefresh(0);
        if (vl) {
          setClientGalleryMissionScopeId(ElPreservedScopeId);
          setClientGalleryMissionScopeMeta(SePreservedScopeMeta);
          setClientGalleryAllowsShoppingChoice(eaPreservedAllowsChoice);
        } else {
          setClientGalleryMissionScopeId(ElPreservedScopeId);
          setClientGalleryMissionScopeMeta(SePreservedScopeMeta);
          setClientGalleryAllowsShoppingChoice(eaPreservedAllowsChoice);
        }
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
    getFullscreenImageUrl = (o) =>
      !o ? "" : typeof o == "string" ? o : o.url || "",
    getBreakdownBaseAmount = (o) => {
      const N = toNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(N)) return N;
      const A = toNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(A) ? A : 0;
    },
    resolveBreakdownShopping = (o = null) => {
      const N = o && typeof o === "object" ? Number(o.id || 0) : Number(o || 0),
        A = Al.find((vl) => Number(vl && vl.id) === N) || null;
      return A || (o && typeof o === "object" ? o : null);
    },
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
      itemBullet = "•",
      shoppingName = "",
      clientName = "",
      storeName = "",
      factorValue = "",
      calcMode = "",
      exchangeRate = "",
      taxPercentage = "",
      commissionPercentage = "",
      itemsCount = null,
      balanceAdjustment = 0,
    }) => {
      const o = MODULE_NUMBER_FORMAT,
        Qa = toNumber(balanceAdjustment, 0),
        Za = Math.abs(Qa) > 0.009,
        ta = total + (Za ? Qa : 0),
        ba = ta < -0.009 ? "TOTAL A FAVOR" : "TOTAL DEUDOR",
        xa = Za || ta < -0.009,
        va = ta < -0.009 ? Math.abs(ta) : Math.abs(Qa),
        za = xa && va > 0.009
          ? `${ta < -0.009 || Qa < -0.009 ? "Saldo a favor" : "Saldo deudor"}: $${o.format(va)}`
          : "",
        Ia = defaultBreakdownTemplate || DEFAULT_BREAKDOWN_TEMPLATE,
        Ya = Ia.includes("{balance_line}"),
        N =
          itemsText ||
          (items.length > 0
            ? items
                .map((A) => `${itemBullet} ${A.name} – $${o.format(A.finalPrice)}`)
                .join("\n")
            : "Sin productos."),
        ka = za && !Ya ? `${N}\n${za}` : N,
        A = Number.isFinite(itemsCount) ? itemsCount : items.length,
        vl = {
          title,
          items: ka,
          total: o.format(Math.abs(ta)),
          total_label: ba,
          products_total: o.format(total),
          subtotal: o.format(Number.isFinite(subtotal) ? subtotal : total),
          balance_line: za,
          balance_label: xa ? (ta < -0.009 || Qa < -0.009 ? "Saldo a favor" : "Saldo deudor") : "",
          balance_amount: xa ? o.format(va) : "",
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
          items: items.length > 0 ? items : ka,
          total: ta,
          total_label: ba,
          products_total: total,
          subtotal: Number.isFinite(subtotal) ? subtotal : total,
          balance_line: za,
          balance_label: xa ? (ta < -0.009 || Qa < -0.009 ? "Saldo a favor" : "Saldo deudor") : "",
          balance_amount: xa ? va : 0,
          balance_adjustment: Qa,
          discount_percentage: toNumber(discountPercentage, 0),
          discount_amount: Number.isFinite(discountAmount) ? discountAmount : 0,
          items_count: A,
        };
      return renderBreakdownTemplate(Ia, vl, El);
    },
    getClientBreakdownBalanceAdjustment = (o, N = 0) => {
      if (!o) return 0;
      const vl = getClientShoppingHistoryEntries(o),
        El = vl.reduce((Se, ea) => Se + toNumber(ea && ea.balance, 0), 0),
        Se = El - toNumber(N, 0);
      return Math.abs(Se) > 0.009 ? Se : 0;
    },
    getWahaChatPreview = (o) => {
      return getClientWahaChatId(o, J && J.profile ? J.profile : null);
    },
    sendBreakdownWhatsApp = async (o, N, A = "") => {
      if (!o) return !1;
      const vl = J && J.profile ? J.profile : {},
        El = String((vl && vl.waha_api_url) || "").trim(),
        Se = String((vl && vl.waha_session) || "").trim(),
        ea = getWahaChatPreview(o),
        gl = ea;
      if (!El || !Se) {
        notifyInfo("Configura WAHA API URL y session en Perfil antes de enviar.");
        return !1;
      }
      if (!ea) {
        notifyError("El cliente no tiene telefono configurado.");
        return !1;
      }
      const ae = await confirmAction({
        title: "Enviar desglose por WhatsApp",
        message: `Se enviara el desglose directo a ${o.name || "este cliente"} por WhatsApp (${gl}).`,
        confirmLabel: "Enviar",
        cancelLabel: "Cancelar",
        tone: "info",
      });
      if (!ae) return !1;
      try {
        await I("/whatsapp/send-text/", {
          method: "POST",
          body: JSON.stringify({
            chat_id: ea,
            text: N,
          }),
        });
        A &&
          setCopiedMissionClients((qa) =>
            qa.includes(A) ? qa : [...qa, A],
          );
        notifySuccess("Desglose enviado por WhatsApp.");
        return !0;
      } catch (qa) {
        console.error("Failed sending WAHA breakdown", qa);
        notifyError(
          getApiErrorMessage(qa, "No se pudo enviar el desglose por WhatsApp."),
        );
        return !1;
      }
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
          balanceAdjustment: getClientBreakdownBalanceAdjustment(N, ae),
        });
      await sendBreakdownWhatsApp(
        N,
        oi,
        `${(A && A.id) || (o && o.id)}-${N && N.id}`,
      );
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
          balanceAdjustment: getClientBreakdownBalanceAdjustment(N, ae),
        });
      await sendBreakdownWhatsApp(N, oi, `home-${o.id}-${N.id}`);
    },
    copyMissionClientsBreakdown = async (o, N = []) => {
      if (!o) return;
      const A = resolveBreakdownShopping(o),
        vl = paymentLocalShoppingDiscount(A || o),
        El = MODULE_NUMBER_FORMAT,
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
        const copyMode = await copyTextToClipboard(
          N.share_url,
          "Copia el link del envio:",
        );
        const A = `shipment-share-${o.id}`;
        if (copyMode !== "manual") {
          setCopiedClientShareLinks((vl) =>
            vl.includes(A) ? vl : [...vl, A],
          );
        }
        copyMode === "manual"
          ? notifyInfo("El navegador bloqueo la copia directa. Copia el link desde la ventana.")
          : notifySuccess("Link copiado.");
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
    saveThemeMode = async (o) => {
      if (!J) return;
      const N = String(o || "").toUpperCase() === "DARK" ? "DARK" : "LIGHT";
      const A = themeMode;
      if (A === N) return;
      setThemeMode(N);
      try {
        const vl = await I("/auth/me/", {
          method: "PATCH",
          body: JSON.stringify({ theme_mode: N }),
        });
        vl && b(vl);
      } catch (vl) {
        console.error("Failed saving theme mode", vl);
        setThemeMode(A);
        notifyError("No se pudo guardar el modo de color en tu perfil.");
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
    paymentModalClientGlobalBalance = paymentModalClient
      ? getClientShoppingHistoryEntries(paymentModalClient).reduce(
        (o, N) => o + toNumber(N && N.balance, 0),
        0,
      )
      : 0,
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
          .filter((Se) => Se.batchAvailable > 0 || Se.existingAmount !== 0)
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
    exportMissionCsv = (o) => {
      const N = (ae) => `"${String(ae ?? "").replaceAll('"', '""')}"`,
        A = ["Cliente", "Producto", "Store Price (USD)", "Final Price (MXN)", "Status", "Tienda", "Tags"].join(","),
        vl = ((o.products || []).map((El) =>
          [
            N(
              ((clientLookupById.get(Number(El && El.client)) || {}).name ||
                El.client_name ||
                ""),
            ),
            N(El.name),
            N(El.real_price),
            N(El.charged_price),
            N(El.status),
            N((stores.find((ea) => ea.id === El.store) || {}).name || ""),
            N(El.tags || ""),
          ].join(","),
        )),
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
      newRequestImageFile &&
        Nl.append("image", await prepareCompressedImageFile(newRequestImageFile));
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
      editingRequestImageFile &&
        A.append("image", await prepareCompressedImageFile(editingRequestImageFile));
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
        const reviewClient =
          (W && Number(W.id) === Number(o.client) && W) ||
          (Kl || []).find((El) => Number(El.id) === Number(o.client)) ||
          null;
        openReviewNotifyModal(o, reviewClient);
      } catch (El) {
        console.error("Failed creating product review", El);
      }
    },
    openReviewNotifyModal = (product, client = null) => {
      if (!product) return;
      const creatorId = Number(w && w.shopper && w.shopper.id ? w.shopper.id : w && w.shopper ? w.shopper : 0) || null;
      const defaultRecipients = creatorId ? [creatorId] : [];
      const clientName = String((client && client.name) || (W && W.name) || "").trim() || "cliente";
      const storeName = String(
        (product && product.store_name) ||
          (product && product.shopping_name) ||
          (product && product.mission_name) ||
          (product && product.shopping && product.shopping.name) ||
          (product && product.mission && product.mission.name) ||
          "",
      ).trim() || "la tienda";
      setReviewNotifyProduct(product);
      setReviewNotifyClient(client || null);
      setReviewNotifyMessage(`Tienes un producto para Revision del cliente ${clientName} en ${storeName}`);
      setReviewNotifyRecipientIds(defaultRecipients);
      setReviewNotifyModalOpen(!0);
    },
    closeReviewNotifyModal = () => {
      if (reviewNotifySending) return;
      setReviewNotifyModalOpen(!1);
      setReviewNotifyProduct(null);
      setReviewNotifyClient(null);
      setReviewNotifyMessage("");
      setReviewNotifyRecipientIds([]);
    },
    sendReviewNotifyMessage = async () => {
      if (!reviewNotifyProduct || reviewNotifySending) return;
      const recipientIds = Array.from(
        new Set(
          (reviewNotifyRecipientIds || [])
            .map((value) => Number(value))
            .filter((value) => Number.isFinite(value) && value > 0),
        ),
      );
      const recipientUsers = recipientIds
        .map((userId) => (users || []).find((value) => Number(value.id) === Number(userId)))
        .filter(Boolean);
      if (recipientUsers.length === 0) {
        notifyError("Selecciona al menos un usuario con telefono.");
        return;
      }
      const comment = String(reviewNotifyMessage || "").trim();
      if (!comment) {
        notifyError("Escribe un mensaje para enviar.");
        return;
      }
      const message = comment;
      setReviewNotifySending(!0);
      try {
        for (const recipient of recipientUsers) {
          const chatId = getUserWahaChatId(recipient);
          if (!chatId) {
            throw new Error(`El usuario ${recipient.username || recipient.id} no tiene telefono configurado.`);
          }
          await I("/whatsapp/send-text/", {
            method: "POST",
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
            }),
          });
        }
        notifySuccess("Mensaje enviado por WhatsApp.");
        closeReviewNotifyModal();
      } catch (El) {
        console.error("Failed sending review notify message", El);
        notifyError(
          getApiErrorMessage(
            El,
            "No se pudo enviar el mensaje de revisión por WhatsApp.",
          ),
        );
      } finally {
        setReviewNotifySending(!1);
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
    openProductConversation = (o, N = null, defaultRecipientIds = []) => {
      if (!o && !N) return;
      const A = N || (o && latestReviewsByProduct[o.id]) || null,
        vl = o || (A && W && (W.products || []).find((El) => Number(El.id) === Number(A.product))) || null,
        El = getUnifiedReviewState(getProductReviewState(vl, A));
      const Se = vl ? String(latestReviewMessageTokenByProduct[vl.id] || "") : "";
      const clientName = String(
        (vl && vl.client_name) ||
          ((clientLookupById.get(Number(vl && vl.client)) || {}).name) ||
          "Cliente",
      ).trim() || "Cliente";
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
        setReviewConversationWahaEnabled(!1),
        setReviewConversationRecipientIds(
          (
            Array.isArray(defaultRecipientIds) && defaultRecipientIds.length > 0
              ? defaultRecipientIds
              : (() => {
                  const creatorId = Number(
                    (W && W.shopper && W.shopper.id ? W.shopper.id : W && W.shopper ? W.shopper : 0) || 0,
                  ) || null;
                  const creatorUser = creatorId
                    ? (users || []).find((value) => Number(value && value.id) === Number(creatorId))
                    : null;
                  const hasPhone = !!String((creatorUser && creatorUser.profile && creatorUser.profile.phone) || "").trim();
                  return creatorId && hasPhone ? [creatorId] : [];
                })()
          ).filter((value) => Number.isFinite(Number(value)) && Number(value) > 0),
        ),
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
      if (!A) {
        notifyError("Escribe un comentario para poder enviar.");
        return;
      }
      reviewConversationSendCooldownTimerRef.current &&
        clearTimeout(reviewConversationSendCooldownTimerRef.current);
      setReviewConversationSendCooling(!0);
      reviewConversationSendCooldownTimerRef.current = setTimeout(() => {
        reviewConversationSendCooldownTimerRef.current = null;
        setReviewConversationSendCooling(!1);
      }, 3000);
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
        if (reviewConversationWahaEnabled) {
          const recipientIds = Array.from(
            new Set(
              (reviewConversationRecipientIds || [])
                .map((value) => Number(value))
                .filter((value) => Number.isFinite(value) && value > 0),
            ),
          );
          const recipientUsers = recipientIds
            .map((userId) => (users || []).find((value) => Number(value.id) === Number(userId)))
            .filter((user) => user && String((user.profile && user.profile.phone) || "").trim());
          if (recipientUsers.length === 0) {
            notifyInfo("Selecciona al menos un usuario con telefono para enviar por WAHA.");
          } else {
            const productName = String((Nl && Nl.name) || "").trim() || "Producto";
            const clientName = String(
              (Nl && Nl.client_name) ||
                ((clientLookupById.get(Number(Nl.client)) || {}).name) ||
                "Cliente",
            ).trim() || "Cliente";
            const wahaMessage = [A, `${productName} DEL CLIENTE ${clientName} 💬`]
              .filter((value) => String(value || "").trim())
              .join("\n");
            try {
              for (const recipient of recipientUsers) {
                const chatId = getUserWahaChatId(recipient);
                if (!chatId) continue;
                await I("/whatsapp/send-text/", {
                  method: "POST",
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: wahaMessage,
                  }),
                });
              }
              notifySuccess("Comentario enviado por WAHA.");
            } catch (wahaError) {
              console.error("Failed sending review conversation via WAHA", wahaError);
              notifyError(
                getApiErrorMessage(
                  wahaError,
                  "No se pudo enviar el comentario por WAHA.",
                ),
              );
            }
          }
        }
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
      const shoppingCreatorId = Number(
        (w && w.shopper && w.shopper.id ? w.shopper.id : w && w.shopper ? w.shopper : 0) || 0,
      ) || null;
      const shoppingCreator = shoppingCreatorId
        ? (users || []).find((value) => Number(value && value.id) === Number(shoppingCreatorId))
        : null;
      const hasCreatorPhone = !!String((shoppingCreator && shoppingCreator.profile && shoppingCreator.profile.phone) || "").trim();
      const defaultConversationRecipientIds = shoppingCreatorId && hasCreatorPhone ? [shoppingCreatorId] : [];
      openProductConversation(
        o,
        latestReviewsByProduct[o.id] || null,
        defaultConversationRecipientIds,
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
    Rt = V.useMemo(
      () => {
        const openShoppingClientIds = new Set();
        if (w && Array.isArray(w.clients)) {
          w.clients.forEach((value) => {
            const id = Number(value && typeof value === "object" ? value.id : value);
            if (Number.isFinite(id) && id > 0) openShoppingClientIds.add(id);
          });
        }
        if (w && Array.isArray(w.products)) {
          w.products.forEach((product) => {
            const id = Number(product && product.client);
            if (Number.isFinite(id) && id > 0) openShoppingClientIds.add(id);
          });
        }
        if (!openShoppingClientIds.size) {
          return Kl.filter((o) => String(o.status || "").toLowerCase() === "active");
        }
        return Kl.filter((client) => openShoppingClientIds.has(Number(client.id)));
      },
      [Kl, w],
    );
  const toNumber = (o, N = 0) => {
      const A = parseFloat(o);
      return Number.isFinite(A) ? A : N;
    },
    hasValue = (o) => o !== null && typeof o !== "undefined" && o !== "",
    formatAmount = (o) => MODULE_AMOUNT_FORMAT.format(toNumber(o, 0)),
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
    getHomeClientAnnotatedTotals = (o) =>
      (o || [])
        .filter(
          (A) =>
            String((A && A.status) || "").toUpperCase() === "ANNOTATED",
        )
        .reduce(
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
    getProductEffectiveDiscountPercentage = (o, N = null) => {
      if (!o || (o && o.apply_discount) === !1) return 0;
      const A = o && o.discount_uses_global !== !1,
        vl =
          N === null
            ? hasValue(o && o.discount_percentage)
              ? toNumber(o && o.discount_percentage, 0)
              : 0
            : toNumber(N, 0),
        El = paymentLocalShoppingDiscount((o && (o.shopping || o.mission)) || null);
      return A && El > 0 ? El : vl;
    },
    getProductPaymentAmount = (o, N = null) => {
      const A = getProductEffectiveDiscountPercentage(o, N),
        vl = Math.max(0, 1 - toNumber(A, 0) / 100),
        El = toNumber(o && o.charged_price, Number.NaN);
      if (Number.isFinite(El)) return El * vl;
      const Se = toNumber(o && o.real_price, Number.NaN);
      return Number.isFinite(Se) ? Se : 0;
    },
    getProductStoreAmount = (o, N = null) => {
      const A = getProductEffectiveDiscountPercentage(o, N),
        vl = Math.max(0, 1 - toNumber(A, 0) / 100),
        El = toNumber(o && o.real_price, Number.NaN);
      if (Number.isFinite(El)) return El * vl;
      const Se = toNumber(o && o.charged_price, Number.NaN);
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
        }, {}),
        vlStatusItems = ((o && o.products) || []).reduce((gl, ae) => {
          const qa = String((ae && (ae.shopping || ae.mission)) || "");
          if (!qa) return gl;
          return (gl[qa] || (gl[qa] = []), gl[qa].push(ae), gl);
        }, {});
      return Array.from(
        new Set([
          ...Object.keys(A),
          ...Object.keys(vlStatusItems),
          ...(((o && o.payments) || []).map((gl) =>
            String((gl && (gl.shopping || gl.mission)) || ""),
          ).filter(Boolean)),
        ]),
      )
        .map((gl) => {
          const ae = A[gl] || [],
            SeStatusItems = vlStatusItems[gl] || ae,
            qa = SeStatusItems.filter(
              (miProduct) =>
                ["ANNOTATED", "BOUGHT", "SHIPPED"].includes(
                  String((miProduct && miProduct.status) || "").toUpperCase(),
                ),
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
                  : SeStatusItems[0] && (SeStatusItems[0].shopping_name || SeStatusItems[0].mission_name)
                    ? String(SeStatusItems[0].shopping_name || SeStatusItems[0].mission_name).trim()
                  : oiPaymentName
                    ? oiPaymentName
                    : `Tienda #${gl}`,
            Ri =
              (oi && oi.start_time) ||
              (ae[0] &&
                (ae[0].shopping_date || ae[0].mission_date || ae[0].created_at)) ||
              (SeStatusItems[0] &&
                (SeStatusItems[0].shopping_date || SeStatusItems[0].mission_date || SeStatusItems[0].created_at)) ||
              oiPaymentDate ||
              "";
          return {
            key: gl,
            shopping: oi,
            title: mi,
            date: Ri,
            items: ae,
            statusItems: SeStatusItems,
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
    getClientPaymentGlobalBalanceAmount = (o) =>
      getClientShoppingHistoryEntries(o).reduce(
        (N, A) => N + toNumber(A && A.balance, 0),
        0,
      ),
    getClientPaymentGlobalDebtAmount = (o) =>
      Math.max(getClientPaymentGlobalBalanceAmount(o), 0),
    getClientPaymentBalanceAdjustmentTarget = (o) => {
      if (!o) return null;
      const N = getClientShoppingHistoryEntries(o)
        .filter((A) => Number(A && A.key) > 0)
        .sort(
          (A, vl) =>
            new Date(A.date || 0).getTime() - new Date(vl.date || 0).getTime(),
        );
      if (N[0]) return N[0];
      if (w && w.id) {
        return {
          key: String(w.id),
          shopping: w,
          title: w.name || w.title || `Shopping #${w.id}`,
          date: w.start_time || w.created_at || "",
          items: [],
          annotatedItems: [],
          annotatedCount: 0,
          payments: [],
          productsTotal: 0,
          paymentsTotal: 0,
          balance: 0,
        };
      }
      return null;
    },
    getClientPaymentPlan = (o, N = 0) => {
      const A = toNumber(N, 0);
      if (A < 0) {
        const vl = getClientPaymentBalanceAdjustmentTarget(o);
        return vl
          ? [
            {
              ...vl,
              debtAmount: Math.max(toNumber(vl && vl.balance, 0), 0),
              appliedAmount: A,
              isReceiving: !0,
              isDebtAdjustment: !0,
            },
          ]
          : [];
      }
      let vl = Math.max(A, 0);
      const El = getClientPaymentTargets(o).map((Se) => {
        const ea = Math.max(toNumber(Se && Se.balance, 0), 0);
        let gl = 0;
        vl > 0 && ((gl = Math.min(vl, ea)), (vl -= gl));
        return {
          ...Se,
          debtAmount: ea,
          appliedAmount: gl,
          isReceiving: gl > 0,
        };
      });
      if (vl > 0 && El.length > 0) {
        const Se = El[0];
        El[0] = {
          ...Se,
          appliedAmount: Se.appliedAmount + vl,
          isReceiving: !0,
        };
      }
      if (vl > 0 && El.length === 0) {
        const Se = getClientPaymentBalanceAdjustmentTarget(o);
        return Se
          ? [
            {
              ...Se,
              debtAmount: 0,
              appliedAmount: vl,
              isReceiving: !0,
              isCreditAdjustment: !0,
            },
          ]
          : [];
      }
      return El;
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
    safeClientPaymentArray = (o) => {
      try {
        const N = o();
        return Array.isArray(N) ? N : [];
      } catch (A) {
        console.error("Failed computing client payment data", A);
        return [];
      }
    },
    clientPaymentModalClient = Kl.find(
      (o) => String(o.id) === String(clientPaymentForm.client || ""),
    ) || null,
    clientPaymentTargets = clientPaymentModalClient
      ? safeClientPaymentArray(() =>
        getClientPaymentTargets(clientPaymentModalClient),
      )
      : [],
    clientPaymentAmountValue = paymentLocalToNumber(clientPaymentForm.amount, 0),
    clientPaymentPlan = clientPaymentModalClient
      ? safeClientPaymentArray(() =>
        getClientPaymentPlan(
          clientPaymentModalClient,
          clientPaymentAmountValue,
        ),
      )
      : [],
    clientPaymentReceivingTargets = clientPaymentPlan.filter(
      (o) => toNumber(o && o.appliedAmount, 0) !== 0,
    ),
    clientPaymentTotalDebt = clientPaymentModalClient
      ? getClientPaymentGlobalDebtAmount(clientPaymentModalClient)
      : 0,
    clientPaymentAllocatedTotal = clientPaymentPlan.reduce(
      (o, N) => o + paymentLocalToNumber(N && N.appliedAmount, 0),
      0,
    ),
    clientPaymentBalance = clientPaymentTotalDebt - clientPaymentAllocatedTotal,
    clientPaymentGlobalBalance = clientPaymentModalClient
      ? getClientPaymentGlobalBalanceAmount(clientPaymentModalClient)
      : 0,
    clientPaymentHistoryEntries = clientPaymentModalClient
      ? safeClientPaymentArray(() =>
        getClientPaymentHistoryEntries(clientPaymentModalClient),
      )
      : [],
    clientPaymentHistoryRows = clientPaymentModalClient
      ? safeClientPaymentArray(() =>
        getClientPaymentHistoryRows(clientPaymentModalClient),
      )
      : [],
    paymentHistoryRows = paymentModalClient
      ? getClientPaymentHistoryRows(paymentModalClient)
      : [],
    paymentDomainSnapshot = (paymentDomainRef.current = {
      activeShopping: w,
      paymentLocalToNumber,
      paymentLocalFormatAmountField,
      paymentLocalShoppingDiscount,
      paymentLocalShoppingProducts,
      paymentLocalProductsTotal,
      paymentLocalRecordProducts,
      paymentLocalShoppingPayments,
      paymentReservedProductIds,
      paymentModalClient,
      paymentCurrentAmountValue,
      clientPaymentModalClient,
      getClientPaymentGlobalDebtAmount,
      getClientPaymentBalanceAdjustmentTarget,
      getClientShoppingPayments,
      getPaymentRecordAmount,
      getClientPaymentTargetProductIds,
      getClientPaymentPlan,
      getClientBatchEditPlan,
      toNumber,
    }),
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
        for (const ae of El || []) {
          gl.append("files", await prepareCompressedImageFile(ae));
        }
        await I(`/reviews/${ea.id}/send-message/`, {
          method: "POST",
          body: gl,
        });
      }
    },
    modalHasRequiredProductFields = !getProductModalRequiredError(st),
    productDiscountUsesGlobal = st.discount_uses_global !== !1,
    productMissionDiscountPercent = toNumber(calcDiscount, 0),
    productDiscountPercent =
      productDiscountUsesGlobal && productMissionDiscountPercent > 0
        ? productMissionDiscountPercent
        : toNumber(st.discount_percentage, 0),
    productDiscountEnabled = st.apply_discount !== !1,
    productEffectiveDiscountPercentage = productDiscountEnabled
      ? productDiscountPercent
      : 0,
    productStoreDiscountedPrice = productDiscountEnabled
      ? computeProductModalDiscountedPrice(
          st.real_price,
          productDiscountPercent,
        )
      : Number.NaN,
    productFinalDiscountedPrice = productDiscountEnabled
      ? computeProductModalDiscountedPrice(
          st.charged_price,
          productDiscountPercent,
        )
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
    clientLookupById = V.useMemo(
      () => new Map((Kl || []).map((o) => [Number(o.id), o])),
      [Kl],
    ),
    activeMissionPayerUser = payerUserOptions.find(
      (o) => String((o && o.id) || "") === String((w && w.payer) || ""),
    ),
    activeMissionPayerLabel = activeMissionPayerUser
      ? getUserOptionLabel(activeMissionPayerUser)
      : String((w && w.payer_username) || "").trim(),
    filteredStores = V.useMemo(
      () => stores
        .filter((o) =>
          o.name.toLowerCase().includes(storeSearch.trim().toLowerCase()),
        )
        .sort((o, N) => o.name.localeCompare(N.name)),
      [stores, storeSearch],
    ),
    latestReviewsByProduct = V.useMemo(
      () => (productReviews || []).reduce((o, N) => {
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
      [productReviews],
    ),
    latestMissionReviewsByProduct = V.useMemo(
      () => [...(missionReviewAlerts || []), ...(productReviews || [])].reduce(
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
      [missionReviewAlerts, productReviews],
    ),
    latestReviewMessageTokenByProduct = V.useMemo(
      () => [...(missionReviewAlerts || []), ...(productReviews || [])].reduce(
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
      [missionReviewAlerts, productReviews],
    ),
    serverSeenReviewItemMap = V.useMemo(
      () => [...(missionReviewAlerts || []), ...(productReviews || [])].reduce(
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
      [missionReviewAlerts, productReviews],
    ),
    mergedSeenReviewItemMap = V.useMemo(
      () => Object.entries(serverSeenReviewItemMap).reduce(
        (o, [N, A]) => {
          const vl = String(seenReviewItemMap[N] || ""),
            El = String(A || "");
          o[N] = vl && !isReviewTokenUnread(vl, El) ? vl : El;
          return o;
        },
        { ...seenReviewItemMap },
      ),
      [serverSeenReviewItemMap, seenReviewItemMap],
    ),
    activeMissionProducts = V.useMemo(
      () =>
        w
          ? Array.isArray(w.products) && w.products.length
            ? w.products
            : (Kl || []).flatMap((o) =>
                (o.products || []).filter(
                  (N) => Number(N.shopping) === Number(w.id),
                ),
              )
          : [],
      [w, Kl],
    ),
    activeMissionSummaryProducts = V.useMemo(
      () =>
        activeMissionProducts.filter((o) => {
          const N = String((o && o.status) || "").toUpperCase();
          return N === "ANNOTATED";
        }),
      [activeMissionProducts],
    ),
    activeMissionReviewProducts = V.useMemo(
      () =>
        activeMissionProducts.filter(
          (o) => String((o && o.status) || "").toUpperCase() === "IN_REVIEW",
        ),
      [activeMissionProducts],
    ),
    activeMissionRejectedProducts = V.useMemo(
      () =>
        activeMissionProducts.filter(
          (o) => String((o && o.status) || "").toUpperCase() === "REJECTED",
        ),
      [activeMissionProducts],
    ),
    missionSummaryStatusCounts = V.useMemo(
      () => ({
        ALL: activeMissionProducts.length,
        ANNOTATED: activeMissionSummaryProducts.length,
        IN_REVIEW: activeMissionReviewProducts.length,
        REJECTED: activeMissionRejectedProducts.length,
      }),
      [
        activeMissionProducts.length,
        activeMissionSummaryProducts.length,
        activeMissionReviewProducts.length,
        activeMissionRejectedProducts.length,
      ],
    ),
    requestAssignableClients = V.useMemo(
      () =>
        [...(Kl || [])].sort((o, N) =>
          String(o.name || "").localeCompare(String(N.name || ""), "es", {
            sensitivity: "base",
          }),
        ),
      [Kl],
    ),
    getClientNameById = (o) => {
      if (!o) return "";
      const N = clientLookupById.get(Number(o)) || null;
      return (N && N.name) || "";
    },
    filteredNewRequestClients = requestAssignableClients.filter((o) =>
      normalizeSearchText(o.name || "").includes(normalizeSearchText(newRequestClientSearch)),
    ),
    filteredEditingRequestClients = requestAssignableClients.filter((o) =>
      normalizeSearchText(o.name || "").includes(normalizeSearchText(editingRequestClientSearch)),
    ),
    clientVisibleShoppingIdSet = V.useMemo(
      () => (W ? getClientVisibleShoppingIds(W) : new Set()),
      [W],
    ),
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
    productModalShoppingOptions = V.useMemo(
      () => [...Al].sort(
        (o, N) =>
          new Date(N && N.start_time || 0).getTime() -
          new Date(o && o.start_time || 0).getTime(),
      ),
      [Al],
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
    missionPurchaseCost = V.useMemo(
      () => activeMissionSummaryProducts.reduce((o, N) => {
        const A = toNumber(N && N.real_price, Number.NaN);
        return Number.isFinite(A) ? o + A : o;
      }, 0),
      [activeMissionSummaryProducts],
    ),
    missionHasAnyDiscount = V.useMemo(
      () =>
        missionDiscountPercentage > 0 ||
        activeMissionSummaryProducts.some(
          (product) => getProductEffectiveDiscountPercentage(product) > 0,
        ),
      [activeMissionSummaryProducts, missionDiscountPercentage],
    ),
    missionPurchaseCostWithDiscount = V.useMemo(
      () =>
        activeMissionSummaryProducts.reduce((o, N) => {
          const A = toNumber(N && N.real_price, Number.NaN);
          if (!Number.isFinite(A)) return o;
          const vl = getProductEffectiveDiscountPercentage(N);
          return o + A * ((N && N.apply_discount) === !1 ? 1 : Math.max(0, 1 - vl / 100));
        }, 0),
      [activeMissionSummaryProducts, missionDiscountPercentage],
    ),
    missionTotalWithTaxes = V.useMemo(
      () => activeMissionSummaryProducts.reduce((o, N) => {
        const A = toNumber(N.charged_price, Number.NaN);
        if (Number.isFinite(A)) return o + A;
        const vl = toNumber(N.real_price, Number.NaN);
        if (!Number.isFinite(vl)) return o;
        return o + vl * (1 + missionTaxPercentage / 100);
      }, 0),
      [activeMissionSummaryProducts, missionTaxPercentage],
    ),
    missionTotalWithDiscount = V.useMemo(
      () => activeMissionSummaryProducts.reduce(
        (o, N) => o + getProductPaymentAmount(N),
        0,
      ),
      [activeMissionSummaryProducts, missionDiscountPercentage],
    ),
    filteredMissionSummaryProducts = V.useMemo(
      () => activeMissionProducts.filter((o) =>
        missionSummaryStatusFilter === "ALL"
          ? !0
          : String(o.status || "").toUpperCase() === missionSummaryStatusFilter,
      ).sort((o, N) => {
        const A = String(o.client_name || ((clientLookupById.get(Number(o.client)) || {}).name) || "").localeCompare(
          String(N.client_name || ((clientLookupById.get(Number(N.client)) || {}).name) || ""),
          "es",
          { sensitivity: "base" },
        );
        if (A !== 0) return A;
        if (missionSummaryStatusFilter !== "ALL")
          return String(o.name || "").localeCompare(String(N.name || ""), "es", {
            sensitivity: "base",
          });
        const vl = (item) => {
            const El = String(item.status || "").toUpperCase();
            return El === "REJECTED" ? 2 : El === "IN_REVIEW" ? 1 : 0;
          },
          El = vl(o),
          Se = vl(N);
        if (El !== Se) return El - Se;
        return String(o.name || "").localeCompare(String(N.name || ""), "es", {
          sensitivity: "base",
        });
      }),
      [activeMissionProducts, missionSummaryStatusFilter, clientLookupById],
    ),
    filteredMissionSummaryTotal = V.useMemo(
      () =>
        filteredMissionSummaryProducts.reduce(
          (o, N) => o + getProductPaymentAmount(N),
          0,
        ),
      [filteredMissionSummaryProducts, missionDiscountPercentage],
    ),
    filteredMissionSummaryPurchaseTotal = V.useMemo(
      () =>
        filteredMissionSummaryProducts.reduce(
          (o, N) => o + getProductStoreAmount(N),
          0,
        ),
      [filteredMissionSummaryProducts, missionDiscountPercentage],
    ),
    getShoppingMissionTotals = (o, N = []) => {
      const A = Number((o && o.id) || 0),
        vl = String((o && o.status) || "").toUpperCase();
      if (w && Number(w.id) === A) {
        return {
          usd: missionPurchaseCostWithDiscount,
          sale: missionTotalWithDiscount,
        };
      }
      return (N || [])
        .filter((El) => {
          const Se = String((El && El.status) || "").toUpperCase();
          return vl === "COMPLETED"
            ? Se === "ANNOTATED" || Se === "BOUGHT" || Se === "SHIPPED"
            : Se === "ANNOTATED";
        })
        .reduce(
          (El, Se) => ({
            usd: El.usd + getProductStoreAmount(Se),
            sale: El.sale + getProductPaymentAmount(Se),
          }),
          { usd: 0, sale: 0 },
        );
    },
    homeClientMissionProductsMap = V.useMemo(() => {
      const o = {};
      activeMissionProducts.forEach((N) => {
        const A = Number((N && N.client) || 0);
        if (!Number.isFinite(A) || A <= 0) return;
        o[A] || (o[A] = []);
        o[A].push(N);
      });
      Rt.forEach((N) => {
        o[N.id] || (o[N.id] = []);
      });
      return o;
    }, [activeMissionProducts, Rt]),
    homeClientReviewItemStates = V.useMemo(
      () =>
        Rt.reduce((o, N) => {
          o[N.id] = (homeClientMissionProductsMap[N.id] || []).reduce((A, vl) => {
            A[vl.id] = String(latestReviewMessageTokenByProduct[vl.id] || "");
            return A;
          }, {});
          return o;
        }, {}),
      [Rt, homeClientMissionProductsMap, latestReviewMessageTokenByProduct],
    ),
    derivedHomeClientReviewUnreadMap = V.useMemo(
      () =>
        Rt.reduce((o, N) => {
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
      [Rt, homeClientReviewItemStates, mergedSeenReviewItemMap],
    ),
    backendHomeClientReviewUnreadMap = V.useMemo(
      () =>
        Rt.reduce((o, N) => {
          const A = homeUnreadSummary[String(N.id)] || homeUnreadSummary[N.id] || null;
          o[N.id] = (A && (A.product_ids || []).reduce((vl, El) => {
            vl[El] = String(A.latest_activity_at || "");
            return vl;
          }, {})) || {};
          return o;
        }, {}),
      [Rt, homeUnreadSummary],
    ),
    effectiveHomeClientReviewUnreadMap = V.useMemo(
      () =>
        Object.keys(homeUnreadSummary || {}).length
          ? backendHomeClientReviewUnreadMap
          : derivedHomeClientReviewUnreadMap,
      [
        homeUnreadSummary,
        backendHomeClientReviewUnreadMap,
        derivedHomeClientReviewUnreadMap,
      ],
    ),
    homeClientLatestUnreadActivityMap = V.useMemo(
      () =>
        Rt.reduce((o, N) => {
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
      [Rt, homeUnreadSummary, derivedHomeClientReviewUnreadMap],
    ),
    homeClientReviewStates = V.useMemo(
      () =>
        Rt.reduce((o, N) => {
          o[N.id] = getHomeClientReviewState(
            homeClientMissionProductsMap[N.id] || [],
            latestMissionReviewsByProduct,
          );
          return o;
        }, {}),
      [Rt, homeClientMissionProductsMap, latestMissionReviewsByProduct],
    ),
    clientShoppingHistoryEntriesByClientId = V.useMemo(
      () =>
        (Kl || []).reduce((o, N) => {
          o[N.id] = getClientShoppingHistoryEntries(N);
          return o;
        }, {}),
      [Kl, Al],
    ),
    homeClientMissionTotalsMap = V.useMemo(
      () =>
        Rt.reduce((o, N) => {
          o[N.id] = getHomeClientAnnotatedTotals(homeClientMissionProductsMap[N.id] || []);
          return o;
        }, {}),
      [Rt, homeClientMissionProductsMap],
    ),
    homeClientGlobalBalanceMap = V.useMemo(
      () =>
        Rt.reduce((o, N) => {
          o[N.id] = (clientShoppingHistoryEntriesByClientId[N.id] || []).reduce(
            (A, vl) => A + toNumber(vl && vl.balance, 0),
            0,
          );
          return o;
        }, {}),
      [Rt, clientShoppingHistoryEntriesByClientId],
    ),
    filteredHomeClientsInMission = V.useMemo(
      () =>
        Rt.filter((o) =>
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
      [
        Rt,
        homeClientSearch,
        effectiveHomeClientReviewUnreadMap,
        homeClientLatestUnreadActivityMap,
      ],
    ),
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
    currentConversationStatusActions = [
      "REVIEW",
      "ANNOTATED",
      "REJECTED",
    ].map((status) => ({
      value: status,
      label: getReviewFlowLabel(status),
    })),
    reviewConversationDefaultRecipientIds = V.useMemo(() => {
      const creatorId = Number(
        (w && w.shopper && w.shopper.id ? w.shopper.id : w && w.shopper ? w.shopper : 0) || 0,
      ) || null;
      if (!creatorId) return [];
      const creatorUser = (users || []).find((value) => Number(value && value.id) === Number(creatorId));
      const hasPhone = !!String((creatorUser && creatorUser.profile && creatorUser.profile.phone) || "").trim();
      return hasPhone ? [creatorId] : [];
    }, [w, users]),
    selectedClientHomeProducts = V.useMemo(
      () => (W ? getHomeVisibleProducts(W) : []),
      [W],
    ),
    selectedClientHomeScopeId = clientGalleryHasMissionScope
      ? Number(clientGalleryMissionScopeId || 0) || null
      : null,
    selectedClientHomeScopeMission = V.useMemo(
      () =>
        selectedClientHomeScopeId
          ? Al.find((o) => Number(o && o.id) === Number(selectedClientHomeScopeId)) || null
          : null,
      [Al, selectedClientHomeScopeId],
    ),
    selectedClientHomeBalanceSnapshot = V.useMemo(() => {
      if (
        !W ||
        !selectedClientHomeScopeMission ||
        String((selectedClientHomeScopeMission && selectedClientHomeScopeMission.status) || "").toUpperCase() !== "COMPLETED"
      )
        return null;
      const snapshots = selectedClientHomeScopeMission.client_balance_snapshots || {};
      return snapshots[String(W.id)] || snapshots[W.id] || null;
    }, [W, selectedClientHomeScopeMission]),
    selectedClientHomeAnnotatedProducts = V.useMemo(
      () =>
        W
          ? (W.products || []).filter(
              (o) =>
                (selectedClientHomeScopeId
                  ? Number((o && o.shopping) || 0) === Number(selectedClientHomeScopeId)
                  : clientVisibleShoppingIdSet.has(Number((o && o.shopping) || 0))) &&
                String((o.status || "")).toUpperCase() === "ANNOTATED",
            )
          : [],
      [W, selectedClientHomeScopeId, clientVisibleShoppingIdSet],
    ),
    selectedClientHomeAnnotatedTotals = V.useMemo(
      () =>
        selectedClientHomeScopeId
          ? getHomeClientMissionAnnotatedTotals(
              (W && W.products) || [],
              selectedClientHomeScopeId,
            )
          : getHomeClientAnnotatedTotals(selectedClientHomeAnnotatedProducts),
      [W, selectedClientHomeScopeId, selectedClientHomeAnnotatedProducts],
    ),
    selectedClientHomeHistoryEntries = V.useMemo(
      () => (W ? clientShoppingHistoryEntriesByClientId[W.id] || [] : []),
      [W, clientShoppingHistoryEntriesByClientId],
    ),
    selectedClientHomeGlobalBalance = V.useMemo(
      () => {
        const rawSnapshotGlobalBalance =
          selectedClientHomeBalanceSnapshot &&
          selectedClientHomeBalanceSnapshot.global_balance;
        const snapshotGlobalBalance = Number(rawSnapshotGlobalBalance);
        if (
          rawSnapshotGlobalBalance !== null &&
          typeof rawSnapshotGlobalBalance !== "undefined" &&
          String(rawSnapshotGlobalBalance).trim() !== "" &&
          Number.isFinite(snapshotGlobalBalance)
        )
          return snapshotGlobalBalance;
        return selectedClientHomeHistoryEntries.reduce(
          (o, N) => o + toNumber(N && N.balance, 0),
          0,
        );
      },
      [selectedClientHomeHistoryEntries, selectedClientHomeBalanceSnapshot],
    ),
    galleryProducts = V.useMemo(
      () => ((W && W.products) || []).filter((o) =>
        clientGalleryHasMissionScope
          ? Number(o.shopping) === Number(clientGalleryMissionScopeId)
          : clientVisibleShoppingIdSet.has(Number((o && (o.shopping || o.mission)) || 0)),
      ),
      [W, clientGalleryHasMissionScope, clientGalleryMissionScopeId, clientVisibleShoppingIdSet],
    ),
    galleryReviewProducts = V.useMemo(
      () => galleryProducts.filter((o) => o.status === "IN_REVIEW"),
      [galleryProducts],
    ),
    galleryAnnotatedProducts = V.useMemo(
      () => galleryProducts.filter((o) =>
        o.status === "ANNOTATED" || o.status === "BOUGHT" || o.status === "SHIPPED",
      ),
      [galleryProducts],
    ),
    galleryRejectedProducts = V.useMemo(
      () => galleryProducts.filter((o) => o.status === "REJECTED"),
      [galleryProducts],
    ),
    galleryReviewCount = galleryReviewProducts.length,
    galleryAnnotatedCount = galleryAnnotatedProducts.length,
    galleryRejectedCount = galleryRejectedProducts.length,
    visibleGalleryProducts =
      wl === "REVIEW"
        ? galleryReviewProducts
        : wl === "REJECTED"
            ? galleryRejectedProducts
            : galleryAnnotatedProducts,
    sortedVisibleGalleryProducts = V.useMemo(
      () => [...visibleGalleryProducts].sort((o, N) => {
        const A = new Date(N.created_at || 0).getTime() - new Date(o.created_at || 0).getTime();
        return A || Number(N.id || 0) - Number(o.id || 0);
      }),
      [visibleGalleryProducts],
    ),
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
    publicOrderedShipments = V.useMemo(
      () => publicClientShareData
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
      [publicClientShareData],
    ),
    publicSelectedShipmentTrackingUrl = publicSelectedShipment
      ? getShipmentTrackingUrl(
          publicSelectedShipment.carrier,
          publicSelectedShipment.tracking_number,
        )
      : "",
    publicShipmentProductIds = V.useMemo(
      () =>
        publicClientShareData
          ? new Set(
              (publicClientShareData.shipments || []).flatMap((o) =>
                (o.products_detail || []).map((N) => Number(N.id)),
              ),
            )
          : new Set(),
      [publicClientShareData],
    ),
    publicPendingShipmentProducts = V.useMemo(
      () =>
        publicClientShareData
          ? (publicClientShareData.products || []).filter(
              (o) =>
                o.status === "ANNOTATED" &&
                !publicShipmentProductIds.has(Number(o.id)),
            )
          : [],
      [publicClientShareData, publicShipmentProductIds],
    ),
    publicPendingShipmentSelectionSet = V.useMemo(
      () => new Set(publicPendingShipmentSelection.map((o) => Number(o))),
      [publicPendingShipmentSelection],
    ),
    publicClientBalanceTotal = publicClientShareData
      ? toNumber(publicClientShareData.client_balance, 0)
      : 0,
    publicClientBalanceLabel = publicClientBalanceTotal < 0
      ? "A favor"
      : publicClientBalanceTotal > 0
        ? "Deuda"
        : "Sin saldo",
    activeMissionUnreadReviewMessageCount = V.useMemo(
      () =>
        (missionReviewAlerts || []).reduce((total, review) => {
          const messages = Array.isArray(review && review.messages) ? review.messages : [];
          if (!messages.length) return total;
          const lastSeenMessageId = Number(
            (review && review.current_user_last_seen_message_id) || 0,
          );
          const unreadCount = messages.reduce(
            (count, message) =>
              count + (Number(message && message.id) > lastSeenMessageId ? 1 : 0),
            0,
          );
          return total + unreadCount;
        }, 0),
      [missionReviewAlerts],
    ),
    missionReviewUnreadMessageCount = (missionReviewAlerts || []).reduce(
      (o, N) => {
        const A = String((N && N.current_user_last_seen_message_at) || "");
        const vl = Array.isArray(N && N.messages) ? N.messages : [];
        return o + vl.reduce((El, Se) => {
          const ea = `REVIEW:${Se && Se.created_at ? Se.created_at : ""}`;
          return isReviewTokenUnread(ea, A ? `REVIEW:${A}` : "") ? El + 1 : El;
        }, 0);
      },
      0,
    ),
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
    setPublicPendingShipmentSelection((N) => {
      const A = N.filter((vl) => o.has(Number(vl)));
      return A.length === N.length && A.every((vl, El) => vl === N[El])
        ? N
        : A;
    });
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
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900",
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
                    "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900",
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
  if (isPublicStockCatalog)
    return c.jsx(V.Suspense, {
      fallback: c.jsx("div", {
        className: "min-h-[100dvh] bg-[#f7f3ed] px-6 py-12 text-center text-sm font-bold text-slate-500",
        children: "Cargando catalogo...",
      }),
      children: c.jsx(PublicStockCatalog, {}),
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
                  "block max-h-[calc(100dvh-5.5rem)] max-w-[calc(100dvw-2rem)] object-contain",
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
                              children: sortShipmentEvidenceByNewest(publicSelectedShipment.evidence).map(
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
                              children: sortShipmentProductsByNewest(publicSelectedShipment.products_detail).map(
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
                                            (o.shopping_date || o.mission_date) &&
                                            c.jsx("p", {
                                              className: "mt-0.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300",
                                              children: new Date(
                                                o.shopping_date || o.mission_date,
                                              ).toLocaleDateString(),
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
                                      "absolute left-0.5 top-0.5 right-0.5 z-10 pointer-events-none",
                                    children: c.jsx("div", {
                                      className:
                                        "inline-flex max-w-full rounded-xl bg-black/58 px-1.5 py-0.5 text-[8px] font-semibold leading-tight text-white backdrop-blur-sm",
                                      children: c.jsx("span", {
                                        className: "line-clamp-2 whitespace-normal break-words",
                                        children: o.name,
                                      }),
                                    }),
                                  }),
                                  Number.isFinite(getProductImagePrimaryPrice(o)) &&
                                  c.jsx("div", {
                                    className:
                                      "absolute right-0.5 bottom-0.5 z-10 pointer-events-none",
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
                                  (o.shopping_date || o.mission_date) &&
                                  c.jsx("div", {
                                    className:
                                      "absolute left-0.5 bottom-0.5 z-10 max-w-[58%] truncate rounded-full bg-black/54 px-1.5 py-[2px] text-[8px] font-bold text-white backdrop-blur-sm pointer-events-none",
                                    children: new Date(
                                      o.shopping_date || o.mission_date,
                                    ).toLocaleDateString(),
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
                                  (isPdfMediaUrl(resolveMediaUrl(o.image))
                                    ? window.open(
                                        resolveMediaUrl(o.image),
                                        "_blank",
                                        "noopener,noreferrer",
                                      )
                                    : setFullscreenImage(resolveMediaUrl(o.image))),
                                className:
                                  "overflow-hidden rounded-xl border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800 aspect-square",
                                children: o.image
                                  ? isPdfMediaUrl(resolveMediaUrl(o.image))
                                    ? c.jsx("div", {
                                        className:
                                          "w-full h-full flex items-center justify-center text-rose-500 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30",
                                        children: c.jsx("span", {
                                          className:
                                            "material-symbols-outlined text-[28px]",
                                          children: "picture_as_pdf",
                                        }),
                                      })
                                    : c.jsx("img", {
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
  const authScreen = c.jsxs("div", {
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
              children: "Compratelo con Pao",
            }),
            c.jsx("p", {
              className: "text-gray-500",
              children: "Inicia sesión para continuar.",
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
            c.jsx("button", {
              type: "submit",
              className:
                "w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 md:py-4 rounded-xl shadow-[0_8px_16px_rgba(139,92,246,0.25)] transition-all",
              children: "Access Account",
            }),
          ],
        }),
      ],
    });
  const persistDefaultBreakdownTemplate = (o) => {
      setDefaultBreakdownTemplate(o);
      localStorage.setItem("default_breakdown_template", o);
    },
    saveProfileSettings = async () => {
      if (!J || profileSettingsSaving) return;
      const o = String((profileSettingsForm.display_name || "")).trim(),
        Pc = String((profileSettingsForm.phone_country_code || "+52").trim()),
        N = String((profileSettingsForm.phone || "")).trim(),
        A = String((profileSettingsForm.waha_api_url || "").trim()),
        vl = String((profileSettingsForm.waha_api_key || "").trim()),
        El = String((profileSettingsForm.waha_session || "").trim()),
        Se = String((profileSettingsForm.waha_phone_prefix || "521").replace(/\D+/g, "") || "521"),
        ea = String((profileSettingsForm.waha_chat_id_suffix || "").trim()),
        gl = String((J && J.profile && J.profile.display_name) || "").trim(),
        qc = String((J && J.profile && J.profile.phone_country_code) || "+52").trim(),
        ae = String((J && J.profile && J.profile.phone) || "").trim(),
        qa = String((J && J.profile && J.profile.waha_api_url) || "").trim(),
        Nn = String((J && J.profile && J.profile.waha_api_key) || "").trim(),
        Ta = String((J && J.profile && J.profile.waha_session) || "").trim(),
        qaPrefix = String((J && J.profile && J.profile.waha_phone_prefix) || "521").replace(/\D+/g, "") || "521",
        za = String((J && J.profile && J.profile.waha_chat_id_suffix) || "").trim();
      if (o === gl && Pc === qc && N === ae && A === qa && vl === Nn && El === Ta && Se === qaPrefix && ea === za) return;
      setProfileSettingsSaving(!0);
      try {
        const oi = await I("/auth/me/", {
          method: "PATCH",
          body: JSON.stringify({
            display_name: o,
            phone_country_code: Pc,
            phone: N,
            waha_api_url: A,
            waha_api_key: vl,
            waha_session: El,
            waha_phone_prefix: Se,
            waha_chat_id_suffix: ea,
          }),
        });
        oi && (b(oi), notifySuccess("Configuracion guardada."));
      } catch (oi) {
        console.error("Failed saving profile settings", oi);
        notifyError("No se pudo guardar la configuracion del perfil.");
      } finally {
        setProfileSettingsSaving(!1);
      }
    },
    saveUserRecord = async (userId, payload) => {
      const targetId = Number(userId || 0);
      if (!targetId) return null;
      try {
        const updated = await I(`/users/${targetId}/`, {
          method: "PATCH",
          body: JSON.stringify(payload || {}),
        });
        if (updated && updated.id) {
          setUsers((values) =>
            (values || []).map((user) =>
              Number(user.id) === Number(updated.id) ? updated : user,
            ),
          );
          await refreshUsers();
          if (J && Number(J.id) === Number(updated.id)) {
            b(updated);
          }
        }
        return updated;
      } catch (error) {
        console.error("Failed saving user record", error);
        throw error;
      }
    },
    createUserRecord = async (payload) => {
      try {
        const created = await I("/auth/register/", {
          method: "POST",
          body: JSON.stringify(payload || {}),
        });
        if (created && created.id) {
          setUsers((values) => {
            const next = [...(values || []).filter((user) => Number(user.id) !== Number(created.id)), created];
            next.sort((a, b) =>
              String(a?.username || "").localeCompare(String(b?.username || ""), "es", {
                sensitivity: "base",
              }),
            );
            return next;
          });
          await refreshUsers();
        }
        return created;
      } catch (error) {
        console.error("Failed creating user record", error);
        throw error;
      }
    },
    deleteUserRecord = async (userId) => {
      const targetId = Number(userId || 0);
      if (!targetId) return false;
      try {
        await I(`/users/${targetId}/`, {
          method: "DELETE",
        });
        setUsers((values) => (values || []).filter((user) => Number(user.id) !== Number(targetId)));
        await refreshUsers();
        return true;
      } catch (error) {
        console.error("Failed deleting user record", error);
        throw error;
      }
    };
  // Calculator section extracted to sections/CalculatorSection.jsx
  // Missions section extracted to sections/MissionsSection.jsx
  // Profile section extracted to sections/ProfileSection.jsx
  // Shipments section extracted to sections/ShipmentsSection.jsx
  const appServicesContextValue = V.useMemo(() => ({
    apiFetch: I,
    notifySuccess,
    notifyError,
    notifyInfo,
    confirmAction,
    openImageSourcePicker,
    formatAmount,
  }), [
    I,
    notifySuccess,
    notifyError,
    notifyInfo,
    confirmAction,
    openImageSourcePicker,
    formatAmount,
  ]);
  const calculatorContextValue = V.useMemo(() => ({
    calcMode,
    calcFactor,
    calcTaxes,
    calcDiscount,
    calcCommission,
    calcExchangeRate,
    applyCalcModeChange,
    applyCalcFactorChange,
    applyCalcDiscountChange,
    applyCalcTaxesChange,
    applyCalcCommissionChange,
    applyCalcExchangeRateChange,
  }), [
    calcMode,
    calcFactor,
    calcTaxes,
    calcDiscount,
    calcCommission,
    calcExchangeRate,
    applyCalcModeChange,
    applyCalcFactorChange,
    applyCalcDiscountChange,
    applyCalcTaxesChange,
    applyCalcCommissionChange,
    applyCalcExchangeRateChange,
  ]);
  const layoutProfileContextValue = V.useMemo(() => ({
    user: J,
    isDesktopLayout,
    layoutMode,
    saveLayoutMode,
    themeMode,
    saveThemeMode,
    defaultBreakdownTemplate,
    persistDefaultBreakdownTemplate,
    profileSettingsForm,
    setProfileSettingsForm,
    profileSettingsSaving,
    saveProfileSettings,
    handleLogout: iu,
    refreshUsers,
    users,
    createUserRecord,
    saveUserRecord,
    deleteUserRecord,
  }), [
    J,
    isDesktopLayout,
    layoutMode,
    saveLayoutMode,
    themeMode,
    saveThemeMode,
    defaultBreakdownTemplate,
    persistDefaultBreakdownTemplate,
    profileSettingsForm,
    profileSettingsSaving,
    saveProfileSettings,
    iu,
    refreshUsers,
    users,
    createUserRecord,
    saveUserRecord,
    deleteUserRecord,
  ]);
  const shipmentsContextValue = V.useMemo(() => ({
    shipments,
    shipmentSearch,
    setShipmentSearch,
    isDesktopLayout,
    openShipmentEditor,
    isShipmentExpanded,
    shipmentHasHydratedDetail,
    shipmentDetailLoadingIds,
    shipmentForm,
    getShipmentFormState,
    shipmentSelectedProducts,
    toggleExpandedShipment,
    openShipmentEvidencePicker,
    shipmentEvidenceUploadingId,
    copyClientShipmentHistoryLink,
    copiedClientShareLinks,
    deleteShipment,
    formatAmount,
    getShipmentSalePriceAmount,
    updateShipmentForm,
    resetExpandedShipmentForm,
    shipmentSaving,
    saveShipmentEditor,
    getClientShipmentAddressOptions,
    toggleShipmentProductSelection,
    openShipmentEvidenceMenuId,
    setOpenShipmentEvidenceMenuId,
    getShipmentEvidenceKind,
    openShipmentEvidenceReplacePicker,
    shipmentEvidenceReplacingId,
    deleteShipmentEvidence,
    shipmentEvidenceDeletingId,
    setFullscreenImage,
    openProductStatusId,
    setOpenProductStatusId,
    setOpenProductMenuId,
    setOpenProductInfoId,
    setShipmentProductPickerOpen,
    getProductStatusChipClassName,
    getProductStatusLabel,
    productStatusUpdatingId,
    setShipmentProductStatusQuick,
    getProductPaymentAmount,
  }), [
    shipments,
    shipmentSearch,
    setShipmentSearch,
    isDesktopLayout,
    openShipmentEditor,
    isShipmentExpanded,
    shipmentHasHydratedDetail,
    shipmentDetailLoadingIds,
    shipmentForm,
    getShipmentFormState,
    shipmentSelectedProducts,
    toggleExpandedShipment,
    openShipmentEvidencePicker,
    shipmentEvidenceUploadingId,
    copyClientShipmentHistoryLink,
    copiedClientShareLinks,
    deleteShipment,
    formatAmount,
    getShipmentSalePriceAmount,
    updateShipmentForm,
    resetExpandedShipmentForm,
    shipmentSaving,
    saveShipmentEditor,
    getClientShipmentAddressOptions,
    toggleShipmentProductSelection,
    openShipmentEvidenceMenuId,
    setOpenShipmentEvidenceMenuId,
    getShipmentEvidenceKind,
    openShipmentEvidenceReplacePicker,
    shipmentEvidenceReplacingId,
    deleteShipmentEvidence,
    shipmentEvidenceDeletingId,
    openProductStatusId,
    productStatusUpdatingId,
    setShipmentProductStatusQuick,
    getProductPaymentAmount,
  ]);
  const shoppingsContextValue = V.useMemo(() => ({
    isDesktopLayout,
    missions: Al,
    activeMission: w,
    missionSearch,
    setMissionSearch,
    expandedMissionId: fn,
    setExpandedMissionId: rn,
    editingMissionId: pa,
    editingMissionName: Sa,
    setEditingMissionId: dn,
    setEditingMissionName: uu,
    openMissionStart,
    pauseMission: be,
    resumeMission: cu,
    endMission: on,
    saveEditedMission: Fe,
    deleteMission: mn,
    openMissionClientView,
    copiedMissionClients,
    clientLookupById,
    getMissionSearchBlob,
    getSearchTokens,
    getMissionStoreLabel,
    getTagClassName,
    parseVisualTag,
    getProductQuickFinalPrice,
    formatProductQuickFinalPrice,
    getProductStoreAmount,
    getShoppingMissionTotals,
    getClientShoppingHistoryEntries,
    formatAmount,
    setFullscreenImage,
    exportMissionCsv,
    openMissionTicketPicker,
    missionTicketUploading,
    clients: Kl,
    shoppingClientAssignmentSavingId,
    toggleShoppingClientAssignment,
  }), [
    isDesktopLayout,
    Al,
    w,
    missionSearch,
    fn,
    pa,
    Sa,
    openMissionStart,
    be,
    cu,
    on,
    Fe,
    mn,
    openMissionClientView,
    copiedMissionClients,
    clientLookupById,
    getMissionSearchBlob,
    getSearchTokens,
    getMissionStoreLabel,
    getTagClassName,
    parseVisualTag,
    getProductQuickFinalPrice,
    formatProductQuickFinalPrice,
    getProductStoreAmount,
    getShoppingMissionTotals,
    getClientShoppingHistoryEntries,
    formatAmount,
    exportMissionCsv,
    openMissionTicketPicker,
    missionTicketUploading,
    Kl,
    shoppingClientAssignmentSavingId,
    toggleShoppingClientAssignment,
  ]);
  const clientsContextValue = V.useMemo(() => ({
    clients: Kl,
    clientSearch: j,
    selectedClientId: W ? W.id : null,
    currentShopping: w,
    isDesktopLayout,
    getHomeVisibleProducts,
    getHomeClientTotals,
    getClientShoppingHistoryEntries,
    copyClientMissionShareLink,
    copyMissionBreakdown,
    copiedMissionClients,
    openClientShoppingGallery,
    openClientPaymentModal,
    openPaymentModal,
    deletePayment,
    onOpenClientCreate: openCreateClientModal,
    onEditClient: openEditClientModal,
    onToggleClientStatus: Jt,
    onOpenClientGallery: openClientSectionGallery,
    getClientPhoneDisplay,
    formatAmount,
    user: J,
  }), [
    Kl,
    j,
    W,
    w,
    isDesktopLayout,
    getHomeVisibleProducts,
    getHomeClientTotals,
    getClientShoppingHistoryEntries,
    copyClientMissionShareLink,
    copyMissionBreakdown,
    copiedMissionClients,
    openClientShoppingGallery,
    openClientPaymentModal,
    openPaymentModal,
    deletePayment,
    openCreateClientModal,
    openEditClientModal,
    Jt,
    openClientSectionGallery,
    formatAmount,
    J,
  ]);
  const homeContextValue = V.useMemo(() => ({
    isDesktopLayout,
    homeDesktopGridRef,
    homeDesktopLayout,
    activeMission: w,
    shoppingTabs: getOpenShoppingMissions(Al),
    shoppingTabLimit: MAX_OPEN_SHOPPINGS,
    selectShoppingTab: (missionId) => Dl(resolveSelectedShopping(Al, missionId)),
    startHomeDesktopResize,
    requests,
    openMissionStart,
    pauseMission: be,
    resumeMission: cu,
    endMission: on,
    setMissionSummaryOpen,
    openMissionTicketPicker,
    missionTicketUploading,
    activeMissionUnreadReviewMessageCount,
    setFullscreenImage,
    getMissionStoreLabel,
    activeMissionPayerLabel,
    missionProductsCount,
    missionPurchaseCost,
    missionPurchaseCostWithDiscount,
    missionTotalWithTaxes,
    missionTotalWithDiscount,
    missionHasAnyDiscount,
    homeUnreadSummary,
    shoppingUnreadSummaryMap,
    calcDiscount,
    applyCalcDiscountChange,
    newRequestText,
    setNewRequestText,
    newRequestClientId,
    setNewRequestClientId,
    newRequestClientPickerOpen,
    setNewRequestClientPickerOpen,
    newRequestClientSearch,
    setNewRequestClientSearch,
    newRequestImagePreview,
    newRequestImageFile,
    clearNewRequestImage,
    pickRequestImage,
    createMissionRequest,
    filteredNewRequestClients,
    filteredHomeClientsInMission,
    homeClientSearch,
    setHomeClientSearch,
    homeClientMissionTotalsMap,
    homeClientGlobalBalanceMap,
    homeClientMissionProductsMap,
    effectiveHomeClientReviewUnreadMap,
    openClientFullGallery: Ta,
    copiedClientShareLinks,
    setCopiedClientShareLinks,
    copyClientMissionShareLink,
    openPaymentModal,
    openClientPaymentModal,
    copiedMissionClients,
    setCopiedMissionClients,
    copyAnnotatedMissionBreakdown,
    formatAmount,
    updateMissionRequest,
    deleteMissionRequest,
    startRequestModify,
    editingRequestId,
    editingRequestText,
    setEditingRequestText,
    editingRequestClientId,
    setEditingRequestClientId,
    editingRequestClientPickerOpen,
    setEditingRequestClientPickerOpen,
    editingRequestClientSearch,
    setEditingRequestClientSearch,
    editingRequestImagePreview,
    editingRequestSaving,
    saveRequestModify,
    cancelRequestModify,
    pickEditingRequestImage,
    clearEditingRequestImage,
    filteredEditingRequestClients,
    getClientNameById,
    getRelativeTime,
  }), [
    isDesktopLayout,
    homeDesktopLayout,
    w,
    Al,
    resolveSelectedShopping,
    startHomeDesktopResize,
    requests,
    openMissionStart,
    be,
    cu,
    on,
    setMissionSummaryOpen,
    openMissionTicketPicker,
    missionTicketUploading,
    activeMissionUnreadReviewMessageCount,
    getMissionStoreLabel,
    activeMissionPayerLabel,
    missionProductsCount,
    missionPurchaseCost,
    missionPurchaseCostWithDiscount,
    missionTotalWithTaxes,
    missionTotalWithDiscount,
    missionHasAnyDiscount,
    homeUnreadSummary,
    shoppingUnreadSummaryMap,
    calcDiscount,
    applyCalcDiscountChange,
    newRequestText,
    newRequestClientId,
    newRequestClientPickerOpen,
    newRequestClientSearch,
    newRequestImagePreview,
    newRequestImageFile,
    clearNewRequestImage,
    pickRequestImage,
    createMissionRequest,
    filteredNewRequestClients,
    filteredHomeClientsInMission,
    homeClientSearch,
    homeClientMissionTotalsMap,
    homeClientGlobalBalanceMap,
    homeClientMissionProductsMap,
    effectiveHomeClientReviewUnreadMap,
    Ta,
    copiedClientShareLinks,
    copyClientMissionShareLink,
    openPaymentModal,
    openClientPaymentModal,
    copiedMissionClients,
    copyAnnotatedMissionBreakdown,
    formatAmount,
    updateMissionRequest,
    deleteMissionRequest,
    startRequestModify,
    editingRequestId,
    editingRequestText,
    editingRequestClientId,
    editingRequestClientPickerOpen,
    editingRequestClientSearch,
    editingRequestImagePreview,
    editingRequestSaving,
    saveRequestModify,
    cancelRequestModify,
    pickEditingRequestImage,
    clearEditingRequestImage,
    filteredEditingRequestClients,
    getClientNameById,
    getRelativeTime,
  ]);
  const lazySectionFallback = c.jsxs("div", {
    className:
      "rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6 text-sm text-text-sub flex items-center gap-3",
    children: [
      c.jsx("span", {
        className: "material-symbols-outlined animate-spin text-base",
        children: "progress_activity",
      }),
      "Cargando seccion...",
    ],
  });
  if (!C || !J) return authScreen;
  const canUseWebBothSections = isDesktopLayout && J && J.profile && J.profile.role === "BOTH";
  return c.jsx(AppServicesProvider, {
    value: appServicesContextValue,
    children: c.jsx(CalculatorProvider, {
      value: calculatorContextValue,
      children: c.jsx(LayoutProfileProvider, {
        value: layoutProfileContextValue,
        children: c.jsx(ShipmentsProvider, {
          value: shipmentsContextValue,
          children: c.jsx(ShoppingsProvider, {
            value: shoppingsContextValue,
            children: c.jsx(ClientsProvider, {
              value: clientsContextValue,
              children: c.jsx(HomeProvider, {
                value: homeContextValue,
                children: c.jsxs("div", {
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
          className: "px-5 py-4 flex items-center justify-between gap-3",
          children: [
            c.jsxs("div", {
              className: "flex items-center gap-3 min-w-0",
              children: [
                c.jsx("div", {
                  className:
                    "h-10 w-10 rounded-full bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center font-bold text-lg uppercase shrink-0",
                  children: J.username.charAt(0),
                }),
                c.jsxs("div", {
                  className: "min-w-0",
                  children: [
                    c.jsxs("h2", {
                      className:
                        "text-sm font-semibold text-text-main dark:text-white leading-tight truncate",
                      children: ["Hi, ", J.username],
                    }),
                    c.jsx("p", {
                      className:
                        "text-xs text-text-sub dark:text-slate-400 font-medium truncate",
                      children:
                      X === "PS"
                          ? "Compratelo con Pao (Tienda)"
                          : "Agente de Ventas (Oficina)",
                    }),
                  ],
                }),
              ],
            }),
            c.jsx("button", {
              type: "button",
              onClick: () => {
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              },
              title: "Refrescar la pagina",
              className:
                "shrink-0 h-10 w-10 rounded-full border border-border-light dark:border-border-dark bg-white/90 dark:bg-slate-900/70 text-slate-700 dark:text-slate-100 flex items-center justify-center shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition",
              children: c.jsx("span", {
                className: "material-symbols-outlined text-[20px]",
                children: "refresh",
              }),
            }),
          ],
        }),
      }),
      c.jsxs("main", {
        className: isDesktopLayout
          ? "flex-1 overflow-y-auto p-6 bg-background-light dark:bg-background-dark ml-20"
          : "flex-1 overflow-y-auto p-5 bg-background-light dark:bg-background-dark",
        children: [
          c.jsx(SectionErrorBoundary, {
            resetKey: nl,
            children: c.jsx("div", {
              className: sectionStageClass,
              children:
                nl === "HOME"
                  ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(HomeSection, {}) })
                  : nl === "MISSIONS"
                    ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(MissionsSection, {}) })
                    : nl === "CLIENTS"
                      ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(ClientsSection, {}) })
                      : nl === "SHIPMENTS"
                        ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(ShipmentsSection, {}) })
                        : nl === "EXPENSES" && canUseWebBothSections
                          ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(ExpensesSection, {}) })
                          : nl === "REPORTS" && canUseWebBothSections
                            ? c.jsx(ReportsSection, {})
                            : nl === "STOCK_CATALOG" && isDesktopLayout
                              ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(StockCatalogSection, {}) })
                              : nl === "CALCULATOR"
                                ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(CalculatorSection, {}) })
                                : nl === "PROFILE"
                                  ? c.jsx(V.Suspense, { fallback: lazySectionFallback, children: c.jsx(ProfileSection, {}) })
                                  : null,
            }, nl),
          }),
          c.jsx("div", {
            className: "shrink-0",
            style: isDesktopLayout
              ? { height: "1rem" }
              : { height: "calc(env(safe-area-inset-bottom, 0px) + 4.75rem)" },
          }),
        ],
      }),
      showMissionStartModal &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(MissionStartModal, {
          open: showMissionStartModal,
          missionStartForm,
          setMissionStartForm,
          onSubmit: ye,
          onClose: () => dismissActiveOverlayRef.current(),
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
          filteredMissionStoreSuggestions,
          removeStoreRecommendation,
          payerUserOptions,
        }),
      }),
      missionSummaryOpen &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(MissionSummaryModal, {
          open: missionSummaryOpen,
          activeMission: w,
          missionSummaryStatusFilter,
          setMissionSummaryStatusFilter,
          missionSummaryStatusCounts,
          filteredMissionSummaryTotal,
          filteredMissionSummaryPurchaseTotal,
          filteredMissionSummaryProducts,
          formatAmount,
          setFullscreenImage,
          getProductQuickFinalPrice,
          formatProductQuickFinalPrice,
          parseVisualTag,
          getTagClassName,
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
        }),
      }),
      Il &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(CreateClientModal, {
          open: Il,
          onSubmit: Na,
          clientName: Vl,
          setClientName: Yt,
          clientPhoneCountryCode,
          setClientPhoneCountryCode,
          sanitizeClientCountryCodeInput,
          clientPhone: p,
          setClientPhone: z,
          sanitizeClientPhoneInput,
          shippingAddress: rl,
          setShippingAddress: d,
          clientShippingAddresses,
          setClientShippingAddresses,
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
        }),
      }),
      K &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(EditClientModal, {
          open: K,
          clientForm: ml,
          setClientForm: hl,
          onSubmit: ja,
          onDelete: () => {
            (Ea(O.id), tl(!1), Y(null));
          },
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
          sanitizeClientCountryCodeInput,
          sanitizeClientPhoneInput,
        }),
      }),
      me &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(ProductModal, {
          open: me,
          selectedProduct: he,
          productForm: st,
          setProductForm: Gt,
          onSubmit: zi,
          onClose: () => dismissActiveOverlayRef.current(),
          productModalMode,
          isDesktopLayout,
          payerUserOptions,
          productStoreInputClass,
          productFinalInputClass,
          productPriceAutoInfoOpen,
          setProductPriceAutoInfoOpen,
          productPriceAutoSync,
          setProductPriceAutoSync,
          setProductPriceSyncSource,
          productDiscountEnabled,
          productDiscountUsesGlobal,
          productGlobalDiscountPercentage: calcDiscount,
          productDiscountPercentage: productDiscountPercent,
          productStoreDiscountedPrice,
          productFinalDiscountedPrice,
          calcMode,
          applyCalcModeChange,
          calcFactor,
          applyCalcFactorChange,
          calcTaxes,
          applyCalcTaxesChange,
          calcCommission,
          applyCalcCommissionChange,
          calcExchangeRate,
          applyCalcExchangeRateChange,
          productCalcInputClass,
          productCalcCompactInputClass,
          modalTags,
          newModalTag,
          setNewModalTag,
          addModalTag,
          removeModalTag,
          productModalCanChooseShopping,
          productModalPinnedShopping,
          productModalSelectedShopping,
          productModalShoppingSearch,
          setProductModalShoppingSearch,
          productModalShoppingOptionsCount: productModalShoppingOptions.length,
          productModalFilteredShoppingOptions,
          getMissionStoreLabel,
          activeShopping: w,
          storeSearch,
          setStoreSearch,
          filteredStores,
          userRole: X,
          showAddStoreInput,
          setShowAddStoreInput,
          newStoreName,
          setNewStoreName,
          createStoreFromModal,
          newProductUploading,
          productImagePreviewUrl: pendingProductPreviewUrl,
          openProductImagePreview: () =>
            pendingProductPreviewUrl && setFullscreenImage(pendingProductPreviewUrl),
          modalHasRequiredProductFields,
          overlayBackdropClass,
          overlaySheetClass,
        }),
      }),
      ji &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(EditTicketModal, {
          open: ji,
          ticket: Je,
          ticketForm: Ol,
          setTicketForm: $e,
          onSubmit: _i,
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
        }),
      }),
      W &&
      W &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(HomeClientOverlay, {
          client: W,
          isDesktopLayout,
          closingOverlayKey,
          overlayBackdropClass,
          overlaySheetClass,
          dismissActiveOverlayRef,
          onRefresh: Qt,
          copiedClientShareLinks,
          onToggleCopiedClientShareLink: (o) => {
            const N = `client-history-${o.id}`;
            if (copiedClientShareLinks.includes(N)) {
              setCopiedClientShareLinks((A) => A.filter((K) => K !== N));
              return;
            }
            copyClientMissionShareLink(null, o);
          },
          galleryTab: wl,
          setGalleryTab: jt,
          galleryTabOrder: clientGalleryTabOrder,
          galleryReviewCount,
          galleryAnnotatedCount,
          galleryRejectedCount,
          selectedClientHomeGlobalBalance,
          selectedClientHomeAnnotatedTotals,
          sortedVisibleGalleryProducts,
          latestReviewsByProduct,
          effectiveHomeClientReviewUnreadMap,
          openProductMenuId,
          openProductInfoId,
          openProductStatusId,
          productImageUploadingId,
          productStatusUpdatingId,
          newProductUploading,
          userRole: X,
          formatAmount,
          resolveMediaUrl,
          setFullscreenImage,
          onToggleProductMenu: setOpenProductMenuId,
          onToggleProductInfo: setOpenProductInfoId,
          onToggleProductStatus: setOpenProductStatusId,
          onEditProduct: hn,
          onChangeProductPhoto: Xt,
          onDeleteProduct: xe,
          onOpenConversation: openProductConversation,
          onSetProductStatus: setGalleryProductStatus,
          getUnifiedReviewState,
          getProductReviewState,
          getChatStatusActionOptions,
          getReviewFlowLabel,
          parseVisualTag,
          getTagClassName,
          hasValue,
          getProductImagePrimaryPrice,
          hasProductDiscountedFinalPrice,
          getProductBaseFinalPrice,
          formatProductQuickFinalPrice,
          missionDiscountPercentage,
          onAddNewProduct: fu,
        }),
      }),
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
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(ImageSourceDialog, {
          imageSourceDialog,
          imageSourceInfoOpen,
          setImageSourceInfoOpen,
          overlayBackdropClass,
          overlaySheetClass,
          dismissActiveOverlayRef,
          pickImageFromDevice,
          pickImageFromClipboard,
        }),
      }),
      confirmDialog &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(ConfirmDialog, {
          confirmDialog,
          overlayBackdropClass,
          overlaySheetClass,
          onDismiss: () => closeConfirmDialog(!1),
          onConfirm: () => closeConfirmDialog(!0),
        }),
      }),
      inputDialog &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(InputDialog, {
          inputDialog,
          overlayBackdropClass,
          overlaySheetClass,
          dismissActiveOverlayRef,
          updateInputDialogField,
          submitInputDialog,
        }),
      }),
      clientPaymentModalOpen &&
      c.jsx(OverlayErrorBoundary, {
        resetKey: `client-payment-${String(clientPaymentForm.client || "")}-${String(clientPaymentEntryEditingId || "")}-${clientPaymentModalOpen ? "open" : "closed"}`,
        onError: (error) =>
          notifyError(
            (error && error.message) ||
              "El modal de pago del cliente fallo al abrir.",
          ),
        renderFallback: (error, retry) =>
          c.jsx("div", {
            className: overlayBackdropClass(
              "fixed inset-0 z-[89] bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 ui-backdrop",
              "client-payment-modal-error",
            ),
            onClick: () => dismissActiveOverlayRef.current(),
            children: c.jsxs("div", {
              className: overlaySheetClass(
                "bg-surface-light dark:bg-surface-dark w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-rose-200 dark:border-rose-900 shadow-2xl overflow-hidden ui-sheet",
                "client-payment-modal-error",
              ),
              onClick: (event) => event.stopPropagation(),
              children: [
                c.jsxs("div", {
                  className:
                    "px-4 py-4 border-b border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/30",
                  children: [
                    c.jsx("p", {
                      className: "text-sm font-bold text-rose-800 dark:text-rose-100",
                      children: "El modal de pago del cliente fallo al renderizar.",
                    }),
                    c.jsx("p", {
                      className: "mt-1 text-xs text-rose-700/90 dark:text-rose-200/90",
                      children:
                        (error && error.message) || "Error desconocido.",
                    }),
                  ],
                }),
                c.jsxs("div", {
                  className: "px-4 py-4 grid grid-cols-2 gap-2",
                  children: [
                    c.jsx("button", {
                      type: "button",
                      onClick: () => dismissActiveOverlayRef.current(),
                      className:
                        "py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold dark:bg-white dark:hover:bg-gray-100 dark:text-gray-900",
                      children: "Cerrar",
                    }),
                    c.jsx("button", {
                      type: "button",
                      onClick: retry,
                      className:
                        "py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold",
                      children: "Intentar otra vez",
                    }),
                  ],
                }),
              ],
            }),
          }),
        children: c.jsx(ClientPaymentModal, {
          clientPaymentModalOpen,
          clientPaymentModalClient,
          clientPaymentReceivingTargets,
          clientPaymentTargets,
          clientPaymentAllocatedTotal,
          clientPaymentPlan,
          clientPaymentForm,
          setClientPaymentAmountManual,
          setClientPaymentForm,
          clientPaymentTotalDebt,
          clientPaymentHistoryRows,
          clientPaymentEntryEditingId,
          clientPaymentEntryDraftAmount,
          setClientPaymentEntryDraftAmount,
          saveClientPaymentHistoryRow,
          clientPaymentEntrySavingId,
          cancelEditingClientPaymentEntry,
          paymentLocalToNumber,
          formatAmount,
          startEditingClientPaymentEntry,
          deleteClientPaymentHistoryRow,
          clientPaymentBalance,
          clientPaymentGlobalBalance,
          clientPaymentSaving,
          saveClientPayment,
          clientPaymentAmountValue,
          onDismiss: () => dismissActiveOverlayRef.current(),
          overlayBackdropClass,
          overlaySheetClass,
        }),
      }),
      paymentModalOpen &&
      c.jsx(V.Suspense, {
        fallback: lazySectionFallback,
        children: c.jsx(PaymentModal, {
          paymentForm,
          paymentSaving,
          paymentModalClient,
          paymentModalShopping,
          paymentModalDiscountPercent,
          paymentModalClientGlobalBalance,
          paymentReservedProductIds,
          paymentFilteredProducts,
          paymentSelectedProducts,
          paymentSelectedProductsTotal,
          paymentPreviewAmountValue,
          paymentSuggestedEntryAmount,
          paymentFormBalance,
          paymentHistoryRows,
          paymentProductSearch,
          paymentAmountManual,
          paymentEntryEditingId,
          paymentEntryDraftAmount,
          paymentEntrySavingId,
          formatAmount,
          getProductPaymentAmount,
          setPaymentProductSearch,
          setPaymentAmountManual,
          setPaymentForm,
          setPaymentEntryEditingId,
          setPaymentEntryDraftAmount,
          togglePaymentProductSelection,
          startEditingPaymentEntry,
          cancelEditingPaymentEntry,
          savePaymentEntry,
          deletePaymentEntry,
          savePayment,
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
        }),
      }),
      shipmentModalOpen &&
      c.jsx(V.Suspense, {
        fallback: lazySectionFallback,
        children: c.jsx(ShipmentModal, {
          shipmentForm,
          shipmentSaving,
          shipmentModalClient,
          shipmentClientPickerOpen,
          shipmentClientSearch,
          filteredShipmentClients,
          shipmentSelectedProducts,
          formatAmount,
          getClientShipmentAddressOptions,
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
          getProductPaymentAmount,
          setShipmentClientPickerOpen,
          setShipmentClientSearch,
          setShipmentProductPickerOpen,
          selectShipmentClient,
          toggleShipmentProductSelection,
          updateShipmentForm,
          saveShipmentEditor,
        }),
      }),
      shipmentProductPickerOpen &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(ShipmentProductPickerModal, {
          shipmentProductPickerOpen,
          overlayBackdropClass,
          overlaySheetClass,
          dismissActiveOverlayRef,
          shipmentProductSearch,
          setShipmentProductSearch,
          shipmentSelectedProducts,
          shipmentModalFilteredProducts,
          shipmentVisibleProductCards,
          shipmentHasMoreProductCards,
          shipmentForm,
          resolveMediaUrl,
          getProductPaymentAmount,
          toggleShipmentProductSelection,
          setShipmentProductRenderLimit,
          setShipmentProductPickerOpen,
          formatAmount,
        }),
      }),
      reviewConversationEntry &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(ReviewConversationModal, {
          reviewConversationEntry,
          reviewConversationScrollRef,
          dismissActiveOverlayRef,
          overlayBackdropClass,
          overlaySheetClass,
          J,
          users,
          currentConversationStatusActions,
          altUploadTargetStatus,
          setAltUploadTargetStatus,
          altUploadDescription,
          setAltUploadDescription,
          altUploadFiles,
          pickAlternativeUploadImages,
          sendReviewAlternatives,
          reviewConversationWahaEnabled,
          setReviewConversationWahaEnabled,
          reviewConversationRecipientIds,
          setReviewConversationRecipientIds,
          reviewConversationDefaultRecipientIds,
          reviewConversationSendCooling,
          setFullscreenImage,
          resolveMediaUrl,
          getReviewFlowLabel,
        }),
      }),
      reviewNotifyModalOpen &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(ReviewNotifyModal, {
          open: reviewNotifyModalOpen,
          product: reviewNotifyProduct,
          client: reviewNotifyClient,
          users,
          selectedRecipientIds: reviewNotifyRecipientIds,
          setSelectedRecipientIds: setReviewNotifyRecipientIds,
          message: reviewNotifyMessage,
          setMessage: setReviewNotifyMessage,
          sending: reviewNotifySending,
          onSend: sendReviewNotifyMessage,
          onClose: closeReviewNotifyModal,
          overlayBackdropClass,
          overlaySheetClass,
        }),
      }),
      getFullscreenImageUrl(fullscreenImage) &&
      c.jsx(V.Suspense, {
        fallback: null,
        children: c.jsx(FullscreenImageModal, {
          fullscreenImage,
          overlayBackdropClass,
          overlaySheetClass,
          dismissActiveOverlayRef,
          getFullscreenImageUrl,
          handleFullscreenImageCopy,
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
            canUseWebBothSections &&
            c.jsx("button", {
              onClick: () => navigateSection("EXPENSES"),
              title: "Gastos",
              className: `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "EXPENSES" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`,
              children: c.jsx("span", {
                className: "material-symbols-outlined text-[22px]",
                children: "receipt_long",
              }),
            }),
            canUseWebBothSections &&
            c.jsx("button", {
              onClick: () => navigateSection("REPORTS"),
              title: "Reportes",
              className: `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "REPORTS" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`,
              children: c.jsx("span", {
                className: "material-symbols-outlined text-[22px]",
                children: "analytics",
              }),
            }),
            isDesktopLayout &&
            c.jsx("button", {
              onClick: () => navigateSection("STOCK_CATALOG"),
              title: "Catalogo de Stock",
              className: `ui-nav-item mx-auto w-12 h-12 rounded-2xl transition-colors flex items-center justify-center ${nl === "STOCK_CATALOG" ? "ui-nav-item-active bg-primary/10 text-primary" : "text-text-sub dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/5"}`,
              children: c.jsx("span", {
                className: "material-symbols-outlined text-[22px]",
                children: "inventory_2",
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
  }),
              }),
            }),
          }),
        }),
      }),
    }),
  });
}

export default nh;
