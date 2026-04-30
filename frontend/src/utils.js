import * as React from 'react';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';

export const V = React;
export const c = { jsx, jsxs, Fragment };

export const IS_FIREFOX =
  typeof navigator != "undefined" &&
  /firefox/i.test(String(navigator.userAgent || ""));
export const ENABLE_REALTIME_UPDATES = !IS_FIREFOX;

export const scheduleIdleTask = (task, timeout = 250) => {
  if (typeof window != "undefined" && typeof window.requestIdleCallback == "function") {
    const handle = window.requestIdleCallback(task, { timeout });
    return () => {
      try {
        window.cancelIdleCallback(handle);
      } catch {}
    };
  }
  const handle = window.setTimeout(task, timeout);
  return () => window.clearTimeout(handle);
};

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
  (document.documentElement.classList.toggle("browser-firefox", IS_FIREFOX),
   IS_FIREFOX && (document.documentElement.classList.add("ff-loading"),
     setTimeout(() => document.documentElement.classList.remove("ff-loading"), 3000)));

export const getStoredNumber = (key, fallback) => {
  const raw = localStorage.getItem(key);
  const parsed = raw === null ? Number.NaN : parseFloat(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const getStoredPercent = (key, fallbackPercent) => {
  const raw = localStorage.getItem(key);
  const parsed = raw === null ? Number.NaN : parseFloat(raw);
  if (!Number.isFinite(parsed)) return fallbackPercent;
  if (parsed > 0 && parsed <= 1) return parsed * 100;
  return parsed;
};

export const clampNumber = (value, min, max) =>
  Math.min(max, Math.max(min, value));

export const HOME_DESKTOP_LAYOUT_DEFAULTS = Object.freeze({
  left_width_percent: 62,
  top_height: 232,
});

export const normalizeHomeDesktopLayout = (layout) => {
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

export const DEFAULT_PRODUCT_FORM = {
  name: "",
  real_price: "",
  charged_price: "",
  shopping: "",
  payer: "",
  tags: "",
  store: "",
  status: "ANNOTATED",
  apply_discount: true,
  discount_percentage: "0",
  discount_uses_global: true,
};

export const createEmptyProductForm = (overrides = {}) => ({
  ...DEFAULT_PRODUCT_FORM,
  ...overrides,
});

export const getDraftProductFlowState = (galleryState, role) =>
  galleryState === "REVIEW" || galleryState === "REJECTED" || galleryState === "ANNOTATED"
    ? galleryState
    : role === "AV"
      ? "REVIEW"
      : "ANNOTATED";

export const normalizeProductModalStatus = (statusValue) => {
  const normalized = String(statusValue || "").trim().toUpperCase();
  if (!normalized) return "ANNOTATED";
  return normalized === "REVIEW" || normalized === "PS_REVIEW" || normalized === "AV_REVIEW"
    ? "IN_REVIEW"
    : normalized;
};

export const DARK_NATIVE_SELECT_STYLE = {
  color: "#ffffff",
  backgroundColor: "#0f172a",
};

export const NATIVE_DROPDOWN_OPTION_STYLE = {
  color: "#0f172a",
  backgroundColor: "#ffffff",
};

// API base configurable por entorno
const ENV_API_URL = (import.meta.env.VITE_API_URL || "").trim();
export const Zs = ENV_API_URL
  ? ENV_API_URL.replace(/\/$/, "")
  : window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000/api"
    : `${window.location.origin}/api`;
export const WS_UPDATES_URL = `${Zs.replace("https://", "wss://").replace("http://", "ws://").replace(/\/api$/, "")}/ws/updates/`;
export const BACKEND_ORIGIN = Zs.replace(/\/api$/, "");
const isLocalHostName = (o) => o === "localhost" || o === "127.0.0.1";
export const resolveMediaUrl = (o) => {
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
export const isPdfMediaUrl = (o) => /\.pdf(?:[?#]|$)/i.test(String(o || "").trim());
export const revokeBlobUrl = (o) => {
  const N = String(o || "").trim();
  if (!N.startsWith("blob:")) return;
  try {
    URL.revokeObjectURL(N);
  } catch {}
};
export const toFormUserId = (o) =>
  o === null || typeof o === "undefined" || o === ""
    ? ""
    : String(o);
export const toFormShoppingId = (o) =>
  o === null || typeof o === "undefined" || o === ""
    ? ""
    : String(o);
export const getUserOptionLabel = (o) => {
  if (!o) return "";
  const N = String(
    (o && o.profile && o.profile.display_name) || "",
  ).trim();
  const A = String((o && o.username) || "").trim();
  const vl = N || A;
  const El = String((o && o.profile && o.profile.role) || "").trim();
  return vl && El ? `${vl} (${El})` : vl || El || "Usuario";
};
export const normalizeClientCountryCode = (o) => {
  const N = String(o || "").replace(/[^\d]/g, "");
  return N ? `+${N.slice(0, 4)}` : "+52";
};
export const normalizeClientPhoneDigits = (o) =>
  String(o || "")
    .replace(/\D/g, "")
    .slice(0, 10);
export const sanitizeClientCountryCodeInput = (o) => {
  const N = String(o || "")
    .replace(/\D/g, "")
    .slice(0, 7);
  return N ? `+${N}` : "+";
};
export const sanitizeClientPhoneInput = (o) =>
  String(o || "")
    .replace(/\D/g, "")
    .slice(0, 10);
export const normalizeClientShippingAddresses = (o, N = "") => {
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
export const getClientPhoneDisplay = (o) => {
  const N = normalizeClientPhoneDigits(o && o.phone);
  if (!N) return "";
  return `${normalizeClientCountryCode(o && o.phone_country_code)} ${N}`;
};
export const getUserPhoneDisplay = (o) => {
  const N = normalizeClientPhoneDigits(o && o.profile && o.profile.phone);
  if (!N) return "";
  return `${normalizeClientCountryCode(o && o.profile && o.profile.phone_country_code)} ${N}`;
};
export const getClientWahaChatId = (client, profile = null) => {
  const phoneDigits = normalizeClientPhoneDigits(client && client.phone);
  if (!phoneDigits) return "";
  const clientCountryCode = normalizeClientCountryCode(client && client.phone_country_code).replace(/\D+/g, "");
  const profileCountryCode = normalizeClientCountryCode(
    (profile && profile.phone_country_code) || "+52",
  ).replace(/\D+/g, "");
  const countryCode = clientCountryCode || profileCountryCode || "52";
  const fullPhone = phoneDigits.length > 10 && clientCountryCode && phoneDigits.startsWith(clientCountryCode)
    ? phoneDigits
    : `${countryCode}${phoneDigits}`;
  const suffix = String((profile && profile.waha_chat_id_suffix) || "@c.us").trim() || "@c.us";
  return `${fullPhone}${suffix}`;
};
export const getUserWahaChatId = (user) => {
  const phoneDigits = normalizeClientPhoneDigits(user && user.profile && user.profile.phone);
  if (!phoneDigits) return "";
  const countryCode = normalizeClientCountryCode(user && user.profile && user.profile.phone_country_code).replace(/\D+/g, "") || "52";
  const fullPhone = phoneDigits.length > 10 && phoneDigits.startsWith(countryCode)
    ? phoneDigits
    : `${countryCode}${phoneDigits}`;
  return `${fullPhone}@c.us`;
};
export const normalizeShipmentStatusValue = (o) => {
  const N = String(o || "").trim().toUpperCase();
  return N === "SHIPPED"
    ? "SHIPPED"
    : N === "DELIVERED"
      ? "DELIVERED"
      : N === "CANCELLED"
        ? "CANCELLED"
        : "PENDING";
};
export const getShipmentStatusLabel = (o) => {
  const N = normalizeShipmentStatusValue(o);
  return N === "SHIPPED"
    ? "Enviado"
    : N === "DELIVERED"
      ? "Entregado"
      : N === "CANCELLED"
        ? "Cancelado"
        : "Pendiente";
};
export const getShipmentTrackingUrl = (carrier, trackingNumber) => {
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
export const SHIPMENT_CARRIER_OPTIONS = [
  { value: "", label: "Sin definir" },
  { value: "Estafeta", label: "Estafeta" },
  { value: "DHL", label: "DHL" },
];
export const canEditShipmentBox = (shipment) => {
  return normalizeShipmentStatusValue(shipment && shipment.status) === "PENDING";
};
export const getPublicShareInfoFromPath = () => {
  const o = window.location.pathname.match(/^\/share\/(client|shipment)\/([^/]+)\/?$/i);
  return o
    ? { type: String(o[1] || "").toLowerCase(), token: decodeURIComponent(o[2]) }
    : { type: "", token: "" };
};
export const getPublicShareFocusShipmentIdFromSearch = () => {
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

export const MODULE_NUMBER_FORMAT = new Intl.NumberFormat("es-MX");
export const MODULE_AMOUNT_FORMAT = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
