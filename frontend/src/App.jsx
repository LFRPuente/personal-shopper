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
function nh() {
  const [C, jl] = V.useState(localStorage.getItem("access_token") || null),
    [J, b] = V.useState(null),
    [Q, al] = V.useState("LOGIN"),
    [cl, Ql] = V.useState({ username: "", password: "", role: "AV" }),
    [U, T] = V.useState(""),
    [X, H] = V.useState("AV"),
    [nl, Ll] = V.useState("HOME"),
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
    [st, Gt] = V.useState({
      name: "",
      real_price: "",
      charged_price: "",
      tags: "",
      store: "",
      status: "ANNOTATED",
    }),
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
    [wl, jt] = V.useState("PS_REVIEW"),
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
    [calcCopied, setCalcCopied] = V.useState(!1),
    [fullscreenImage, setFullscreenImage] = V.useState(null),
    [stores, setStores] = V.useState([]),
    [storeSearch, setStoreSearch] = V.useState(""),
    [showAddStoreInput, setShowAddStoreInput] = V.useState(!1),
    [newStoreName, setNewStoreName] = V.useState(""),
    [modalTags, setModalTags] = V.useState([]),
    [newModalTag, setNewModalTag] = V.useState(""),
    [copiedImageItemId, setCopiedImageItemId] = V.useState(null),
    [copiedMissionClients, setCopiedMissionClients] = V.useState([]),
    [requests, setRequests] = V.useState([]),
    [newRequestText, setNewRequestText] = V.useState(""),
    [editingRequestId, setEditingRequestId] = V.useState(null),
    [editingRequestText, setEditingRequestText] = V.useState(""),
    [openProductMenuId, setOpenProductMenuId] = V.useState(null),
    [openProductInfoId, setOpenProductInfoId] = V.useState(null),
    [openHistoryMissionByClient, setOpenHistoryMissionByClient] = V.useState({}),
    [showMissionStartModal, setShowMissionStartModal] = V.useState(!1),
    [missionStartForm, setMissionStartForm] = V.useState({
      name: "",
      tax_percentage: "8",
      calc_mode: "FACTOR",
      factor_value: "1.5",
      commission_percentage: "10",
      exchange_rate: "17.5",
      discount_percentage: "0",
    }),
    [missionSummaryOpen, setMissionSummaryOpen] = V.useState(!1),
    [homeNeedsAttention, setHomeNeedsAttention] = V.useState(!1),
    [galleryDeliveryFilter, setGalleryDeliveryFilter] = V.useState("ALL"),
    // <-------- seccion 7: estado local para revisiones AV <-> PS
    [productReviews, setProductReviews] = V.useState([]),
    [missionReviewAlerts, setMissionReviewAlerts] = V.useState([]),
    [altUploadReviewId, setAltUploadReviewId] = V.useState(null),
    [altUploadDescription, setAltUploadDescription] = V.useState(""),
    [altUploadFiles, setAltUploadFiles] = V.useState([]),
    // <-------- seccion 8: refs para websocket y reconexion
    wsRef = V.useRef(null),
    wsReconnectTimerRef = V.useRef(null),
    wsStoppedRef = V.useRef(!1),
    currentTabRef = V.useRef("HOME"),
    selectedClientIdRef = V.useRef(null),
    activeMissionIdRef = V.useRef(null),
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
    Ti = async () => {
      try {
        const o = await I("/auth/me/");
        (b(o), o.profile.role === "BOTH" ? H("PS") : H(o.profile.role));
        const N = await I("/clients/");
        _l(N || []);
        const A = await I("/missions/");
        zl(A || []);
        const vl = A.find(
          (El) => El.status === "ACTIVE" || El.status === "PAUSED",
        );
        const El = await I("/stores/");
        setStores(El || []);
        Dl(vl || null);
      } catch (o) {
        console.error("Failed loading data", o);
      }
    },
    // <-------- seccion 8: refresh de clientes + misiones para eventos websocket
    refreshCoreData = async () => {
      try {
        const [N, A] = await Promise.all([I("/clients/"), I("/missions/")]);
        _l(N || []);
        zl(A || []);
        const vl = (A || []).find(
          (El) => El.status === "ACTIVE" || El.status === "PAUSED",
        );
        Dl(vl || null);
      } catch {}
    },
    // <-------- seccion 8: helper de recarga y update robusto para peticiones
    getMissionRequestDetailPath = (o) =>
      w && w.id ? `/requests/${o}/?mission=${w.id}` : `/requests/${o}/`,
    reloadMissionRequests = async (o = w && w.id) => {
      const N = o ? await I(`/requests/?mission=${o}`) : await I("/requests/");
      return (setRequests(N || []), N || []);
    };
  V.useEffect(() => {
    C && Ti();
  }, [C]);
  // <-------- seccion 8: guardar ids actuales para manejar mensajes websocket
  V.useEffect(() => {
    selectedClientIdRef.current = W ? W.id : null;
    activeMissionIdRef.current = w ? w.id : null;
  }, [W, w]);
  V.useEffect(() => {
    currentTabRef.current = nl;
    if (nl === "HOME") setHomeNeedsAttention(!1);
  }, [nl]);
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
      const o = activeMissionIdRef.current;
      try {
        const N = o ? await I(`/requests/?mission=${o}`) : await I("/requests/");
        setRequests(N || []);
      } catch (N) {
        console.error("Failed loading mission requests", N);
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
          const A = await I(`/reviews/?mission=${N}`);
          setMissionReviewAlerts(
            (A || []).filter(
              (vl) =>
                vl.status === "PENDING" || vl.status === "ALTERNATIVE_SENT",
            ),
          );
        } catch (A) {
          console.error("Failed loading mission reviews", A);
        }
      } else {
        setMissionReviewAlerts([]);
      }
    };
    const refreshSelectedClient = async () => {
      const o = selectedClientIdRef.current;
      if (!o) return;
      try {
        const N = await I(`/clients/${o}/`);
        (et(N), _l((A) => A.map((vl) => (vl.id === N.id ? N : vl))));
      } catch (N) {
        console.error("Failed refreshing selected client", N);
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
          if (vl === "clients" || vl === "missions") {
            await refreshCoreData();
            return;
          }
          if (vl === "products" || vl === "receipts") {
            await refreshSelectedClient();
            return;
          }
          if (vl === "requests") {
            await refreshRequestsForMission();
            return;
          }
          if (vl === "reviews") {
            await refreshReviewsForCurrentContext();
            return;
          }
          if (vl === "stores") {
            const ea = await I("/stores/");
            setStores(ea || []);
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
      (setOpenProductMenuId(null), setOpenProductInfoId(null));
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
        const o =
          w && (w.status === "ACTIVE" || w.status === "PAUSED")
            ? await I(`/requests/?mission=${w.id}`)
            : await I("/requests/");
        isMounted && setRequests(o || []);
      } catch (o) {
        console.error("Failed loading requests", o);
      }
    };
    loadRequests();
    return () => {
      isMounted = !1;
    };
  }, [C, w && w.id, w && w.status]);
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
  // <-------- seccion 8: carga inicial de alertas de revision por mision
  V.useEffect(() => {
    if (!C || !w || (w.status !== "ACTIVE" && w.status !== "PAUSED")) {
      setMissionReviewAlerts([]);
      return;
    }
    let isMounted = !0;
    const loadMissionReviews = async () => {
      try {
        const o = await I(`/reviews/?mission=${w.id}`);
        isMounted &&
          setMissionReviewAlerts(
            (o || []).filter(
              (N) => N.status === "PENDING" || N.status === "ALTERNATIVE_SENT",
            ),
          );
      } catch (o) {
        console.error("Failed loading mission reviews", o);
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
      (localStorage.removeItem("access_token"), jl(null), b(null));
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
          alert("Error creating client");
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
          alert("Error updating client");
        }
    },
    Ea = async (o) => {
      if (
        confirm(
          "Are you sure you want to delete this client and all their products?",
        )
      )
        try {
          (await I(`/clients/${o}/`, { method: "DELETE" }),
            _l(Kl.filter((N) => N.id !== o)),
            W && W.id === o && et(null));
        } catch {
          alert("Error deleting client");
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
      setMissionStartForm({
        name: (w && w.name) || `Mission ${new Date().toLocaleDateString()}`,
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
      const N = String(o.name || "").trim() || `Mission ${new Date().toLocaleDateString()}`;
      const A = String(o.calc_mode || "FACTOR").toUpperCase() === "PERCENTAGE"
        ? "PERCENTAGE"
        : "FACTOR";
      try {
        let vl = null;
        try {
          vl = await I("/missions/", {
            method: "POST",
            body: JSON.stringify({
              name: N,
              calc_mode: A,
              tax_percentage: toNumber(o.tax_percentage, 8).toFixed(2),
              factor_value: toNumber(o.factor_value, 1.5).toFixed(4),
              commission_percentage: toNumber(o.commission_percentage, 10).toFixed(2),
              exchange_rate: toNumber(o.exchange_rate, 17.5).toFixed(4),
              discount_percentage: toNumber(o.discount_percentage, 0).toFixed(2),
            }),
          });
        } catch {
          // Fallback para backend antiguo sin nuevos campos.
          vl = await I("/missions/", {
            method: "POST",
            body: JSON.stringify({ name: N }),
          });
        }
        const El = N.trim().toLowerCase();
        if (El && !stores.some((Se) => Se.name.toLowerCase().trim() === El)) {
          try {
            const Se = await I("/stores/", {
              method: "POST",
              body: JSON.stringify({ name: N.trim() }),
            });
            setStores((ea) =>
              [...ea, Se].sort((gl, ae) => gl.name.localeCompare(ae.name)),
            );
          } catch {}
        }
        (setShowMissionStartModal(!1),
          zl([...Al, vl]),
          Dl(vl),
          setCalcMode(A),
          setCalcTaxes(toNumber(o.tax_percentage, 8)),
          setCalcFactor(toNumber(o.factor_value, 1.5)),
          setCalcCommission(toNumber(o.commission_percentage, 10)),
          setCalcExchangeRate(toNumber(o.exchange_rate, 17.5)),
          setCalcDiscount(toNumber(o.discount_percentage, 0)));
      } catch (vl) {
        console.error("Failed creating mission", vl);
        alert(`No se pudo iniciar la misión. ${vl.message || ""}`.trim());
      }
    },
    be = async () => {
      if (w)
        try {
          const o = await I(`/missions/${w.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "PAUSED" }),
          });
          (zl(Al.map((N) => (N.id === w.id ? o : N))), Dl(o));
        } catch { }
    },
    cu = async () => {
      if (w)
        try {
          const o = await I(`/missions/${w.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "ACTIVE" }),
          });
          (zl(Al.map((N) => (N.id === w.id ? o : N))), Dl(o));
        } catch { }
    },
    on = async () => {
      if (w)
        try {
          const o = await I(`/missions/${w.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ status: "COMPLETED" }),
          });
          const N = await I("/clients/");
          (_l(N || []), zl(Al.map((A) => (A.id === w.id ? o : A))), Dl(null));
        } catch { }
    },
    mn = async (o) => {
      if (confirm("¿Eliminar esta misión y su historial?"))
        try {
          (await I(`/missions/${o}/`, { method: "DELETE" }),
            zl(Al.filter((N) => N.id !== o)),
            w && w.id === o && Dl(null),
            fn === o && rn(null));
        } catch {
          alert("Error deleting mission");
        }
    },
    Fe = async (o) => {
      if (Sa.trim())
        try {
          const N = await I(`/missions/${o}/`, {
            method: "PATCH",
            body: JSON.stringify({ name: Sa }),
          });
          (zl(Al.map((A) => (A.id === o ? N : A))),
            w && w.id === o && Dl(N),
            dn(null));
        } catch {
          alert("Error renaming mission");
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
        jt("PS_REVIEW"),
        setGalleryDeliveryFilter("ALL"));
    },
    Aa = () => {
      (et(null),
        setFullscreenImage(null),
        setClientGalleryMissionScopeId(null),
        setGalleryDeliveryFilter("ALL"));
    },
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
          alert("No se pudo abrir el selector de imagen."));
      }
    },
    su = () => {
      openSingleImagePicker(ru);
    },
    openMissionTicketPicker = () => {
      if (!w) return;
      openSingleImagePicker(uploadMissionTicket);
    },
    fu = () => {
      openSingleImagePicker(lt);
    },
    uploadMissionTicket = async (o) => {
      if (!w) return;
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = new FormData();
      A.append("image", N[0]);
      try {
        await I(`/missions/${w.id}/upload-ticket/`, {
          method: "POST",
          body: A,
        });
        await refreshCoreData();
        W && (await Qt());
        alert("Ticket de misión cargado y vinculado.");
      } catch (vl) {
        console.error("Mission ticket upload failed", vl);
        alert("No se pudo subir el ticket de misión.");
      }
      o.target.value = "";
    },
    Xt = (o) => {
      (Ke(o), openSingleImagePicker(Xl));
    },
    Xl = async (o) => {
      if (!he) return;
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = new FormData();
      A.append("image", N[0]);
      try {
        (await I(`/products/${he.id}/`, { method: "PATCH", body: A }), Qt());
      } catch {
        alert("Error updating photo");
      }
      ((o.target.value = ""), Ke(null));
    },
    lt = async (o) => {
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = (prompt("Nombre del producto:") || "").trim();
      if (!A) {
        alert("Debes capturar el nombre del producto antes de subir la imagen.");
        (o.target.value = "");
        return;
      }
      const vl =
        w && w.name
          ? stores.find(
            (El) => El.name.toLowerCase().trim() === String(w.name).toLowerCase().trim(),
          )
          : null;
      const El = X === "AV" ? "IN_REVIEW" : "ANNOTATED";
      const Se = new Date().toISOString().slice(0, 10);
      const ea = new FormData();
      (ea.append("image", N[0]),
        ea.append("client", W.id),
        ea.append("name", A),
        ea.append("status", El),
        ea.append("purchase_date", Se),
        w && ea.append("mission", w.id),
        vl && ea.append("store", vl.id));
      try {
        (await I("/products/", { method: "POST", body: ea }), Qt());
      } catch {
        alert("Error adding product");
      }
      o.target.value = "";
    },
    xe = async (o) => {
      if (confirm("Are you sure you want to delete this item?"))
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
      const N = (o.tags || "")
        .split(",")
        .map((A) => A.trim())
        .filter((A) => A.length > 0);
      const A =
        o.store ||
        (w && w.name
          ? (
            stores.find(
              (vl) =>
                vl.name.toLowerCase().trim() === String(w.name).toLowerCase().trim(),
            ) || {}
          ).id || ""
          : "");
      (Ke(o),
        Gt({
          name: o.name || "",
          real_price: o.real_price || "",
          charged_price: o.charged_price || "",
          tags: o.tags || "",
          store: A,
          status: o.status || "ANNOTATED",
        }),
        setModalTags(N),
        setNewModalTag(""),
        setStoreSearch(""),
        setShowAddStoreInput(!1),
        setNewStoreName(""),
        ut(!0));
    },
    zi = async (o) => {
      o.preventDefault();
      const N = parseFloat(st.real_price);
      const discountMult = Math.max(0, 1 - (parseFloat(calcDiscount) || 0) / 100);
      const A = Number.isFinite(N)
          ? calcMode === "FACTOR"
            ? N * calcFactor * discountMult
            : N *
              discountMult *
              (1 + calcCommission / 100) *
              (1 + calcTaxes / 100) *
              calcExchangeRate
          : Number.NaN,
        vl = {
          ...st,
          tags: modalTags.join(", "),
          store: st.store ? Number(st.store) : null,
          charged_price: Number.isFinite(A)
            ? A.toFixed(2)
            : st.charged_price || null,
        };
      try {
        (await I(`/products/${he.id}/`, {
          method: "PATCH",
          body: JSON.stringify(vl),
        }),
          ut(!1),
          Ke(null),
          Qt());
      } catch {
        alert("Error updating item");
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
        alert("Error updating ticket");
      }
    },
    ru = async (o) => {
      const N = o.target.files;
      if (!N || N.length === 0) return;
      const A = new FormData();
      (A.append("image", N[0]),
        A.append("uploaded_by_id", J.id),
        W && W.id && A.append("client", W.id));
      try {
        const vl = await I("/receipts/", { method: "POST", body: A });
        (Qt(), Kt(vl.id));
        const El = URL.createObjectURL(N[0]);
        (we(El), ke([]), at(!0));
      } catch {
        alert("Receipt upload failed");
      }
      o.target.value = "";
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
                body: JSON.stringify({ receipt: kt, status: "BOUGHT" }),
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
              alert(
                "Tu navegador no permite copiar imagen directa. Se copio el enlace de la imagen.",
              ));
            return;
          }
        } catch {}
        (console.error("Failed to copy image", vl),
          alert("No se pudo copiar la imagen. Intenta en Chrome o Edge."));
      }
    },
    copyMissionBreakdown = async (o, N) => {
      const A = (N.products || []).filter((vl) => vl.mission === o.id),
        vl = new Intl.NumberFormat("es-MX"),
        El = A.map((Se) => {
          const ea = parseFloat(Se.charged_price || 0);
          return { name: Se.name, finalPrice: Number.isFinite(ea) ? ea : 0 };
        }),
        Se = El.reduce((ea, gl) => ea + gl.finalPrice, 0),
        ea =
          "DESGLOSE DE TU CUENTA:\n\n" +
          El.map((gl) => `* ${gl.name} - $${vl.format(gl.finalPrice)}`).join("\n") +
          `\n\nTOTAL TIENDA: $${vl.format(Se)}\n\nPara poder pasar a caja ocupo la confirmacion de tu pago 💳 🤗`;
      try {
        await navigator.clipboard.writeText(ea);
        const gl = `${o.id}-${N.id}`;
        setCopiedMissionClients((ae) =>
          ae.includes(gl) ? ae : [...ae, gl],
        );
      } catch (gl) {
        console.error("Failed to copy mission breakdown", gl);
      }
    },
    exportMissionCsv = (o) => {
      const N = (ae) => `"${String(ae ?? "").replaceAll('"', '""')}"`,
        A = ["Cliente", "Producto", "Store Price (USD)", "Final Price (MXN)", "Status", "Tienda", "Tags"].join(","),
        vl = (o.clients_detail || []).flatMap((El) =>
          (El.products || [])
            .filter((Se) => Se.mission === o.id)
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
    createMissionRequest = async () => {
      const o = newRequestText.trim();
      if (!o) return;
      const Nl =
        w && (w.status === "ACTIVE" || w.status === "PAUSED") ? w.id : null;
      try {
        const N = await I("/requests/", {
          method: "POST",
          body: JSON.stringify({
            description: o,
            mission: Nl,
            status: "PENDING",
          }),
        });
        if (w && w.id) {
          await reloadMissionRequests(w.id);
        } else if (N && N.id) {
          setRequests((A) => [N, ...A.filter((vl) => vl.id !== N.id)]);
        } else {
          await reloadMissionRequests(null);
        }
        setNewRequestText("");
      } catch (N) {
        (console.error("Failed creating request", N),
          alert(`No se pudo crear la petición. ${N.message || ""}`.trim()));
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
        w && w.id && (await reloadMissionRequests(w.id));
      } catch (El) {
        (setRequests(vl),
          console.error("Failed updating request", El),
          alert(`No se pudo actualizar la petición. ${El.message || ""}`.trim()));
      }
    },
    startRequestModify = (o) => {
      (setEditingRequestId(o.id), setEditingRequestText(o.description || ""));
    },
    saveRequestModify = async (o) => {
      const N = editingRequestText.trim();
      if (!N) return;
      try {
        const A = await I(getMissionRequestDetailPath(o.id), {
          method: "PATCH",
          body: JSON.stringify({
            description: N,
            note: N,
            status: "MODIFIED",
          }),
        });
        if (!A || typeof A !== "object" || typeof A.id === "undefined")
          throw new Error("Respuesta invalida al modificar la peticion.");
        (setRequests((vl) => vl.map((El) => (El.id === o.id ? A : El))),
          setEditingRequestId(null),
          setEditingRequestText(""));
        w && w.id && (await reloadMissionRequests(w.id));
      } catch (A) {
        (console.error("Failed modifying request", A),
          alert(`No se pudo modificar la petición. ${A.message || ""}`.trim()));
      }
    },
    deleteMissionRequest = async (o) => {
      if (!confirm("¿Eliminar esta petición? Esta acción no se puede deshacer.")) return;
      const N = requests;
      setRequests((A) => A.filter((vl) => vl.id !== o));
      try {
        await I(getMissionRequestDetailPath(o), { method: "DELETE" });
        w && w.id && (await reloadMissionRequests(w.id));
      } catch (A) {
        (setRequests(N),
          console.error("Failed deleting request", A),
          alert(`No se pudo eliminar la petición. ${A.message || ""}`.trim()));
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
        alert("Este producto ya tiene una revision activa.");
        return;
      }
      const N = prompt("Nota de revision para PS:");
      if (!N || !N.trim()) return;
      const A = prompt(
        "Tipo de revision (CHECK_SIZE, CHECK_STOCK, CHECK_OTHER):",
        "CHECK_OTHER",
      );
      const vl = ["CHECK_SIZE", "CHECK_STOCK", "CHECK_OTHER"].includes(A)
        ? A
        : "CHECK_OTHER";
      try {
        await I("/reviews/", {
          method: "POST",
          body: JSON.stringify({
            product: o.id,
            review_note: N.trim(),
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
            review_note: N.trim(),
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
    openAlternativeUploadModal = (o) => {
      if (!o) return;
      (setAltUploadReviewId(o.id),
        setAltUploadDescription(""),
        setAltUploadFiles([]));
    },
    closeAlternativeUploadModal = () => {
      (setAltUploadReviewId(null),
        setAltUploadDescription(""),
        setAltUploadFiles([]));
    },
    sendReviewAlternatives = async () => {
      if (!altUploadReviewId || altUploadFiles.length === 0) return;
      const o = new FormData();
      altUploadFiles.forEach((N) => o.append("images", N));
      altUploadDescription.trim() &&
        o.append("description", altUploadDescription.trim());
      try {
        await I(`/reviews/${altUploadReviewId}/send-alternative/`, {
          method: "POST",
          body: o,
        });
        closeAlternativeUploadModal();
        await refreshProductReviews(W && W.id);
      } catch (N) {
        console.error("Failed sending alternatives", N);
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
    resendReviewToPs = async (o) => {
      if (!o) return;
      const N = prompt(
        "Nota para reenviar a PS (opcional):",
        o.review_note || "",
      );
      try {
        await I(`/reviews/${o.id}/`, {
          method: "PATCH",
          body: JSON.stringify({
            status: "PENDING",
            review_note: (N || o.review_note || "").trim(),
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
        ? "bg-blue-100/95 text-blue-800 border border-blue-200"
        : o === "AV"
          ? "bg-emerald-100/95 text-emerald-800 border border-emerald-200"
          : "bg-white/90 text-gray-700 border border-white",
    discountMultiplier = Math.max(0, 1 - toNumber(calcDiscount, 0) / 100),
    modalStorePrice = parseFloat(st.real_price),
    modalFinalPrice = Number.isFinite(modalStorePrice)
      ? calcMode === "FACTOR"
        ? modalStorePrice * toNumber(calcFactor, 1) * discountMultiplier
        : modalStorePrice *
        discountMultiplier *
        (1 + toNumber(calcCommission, 0) / 100) *
        (1 + toNumber(calcTaxes, 0) / 100) *
        toNumber(calcExchangeRate, 1)
      : Number.NaN,
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
      const vl = new Date(N.updated_at || N.created_at || 0).getTime(),
        El = new Date(A.updated_at || A.created_at || 0).getTime();
      vl >= El && (o[N.product] = N);
      return o;
    }, {}),
    activeMissionProducts = w
      ? (Kl || []).flatMap((o) =>
        (o.products || []).filter((N) => Number(N.mission) === Number(w.id)),
      )
      : [],
    missionTaxPercentage = toNumber(w && w.tax_percentage, toNumber(calcTaxes, 0)),
    missionProductsCount = activeMissionProducts.length,
    missionTotalWithTaxes = activeMissionProducts.reduce((o, N) => {
      const A = toNumber(N.charged_price, Number.NaN);
      if (Number.isFinite(A)) return o + A;
      const vl = toNumber(N.real_price, Number.NaN);
      if (!Number.isFinite(vl)) return o;
      return o + vl * (1 + missionTaxPercentage / 100);
    }, 0),
    galleryProducts = (((W && W.products) || []).filter((o) =>
      clientGalleryMissionScopeId
        ? Number(o.mission) === Number(clientGalleryMissionScopeId)
        : !0,
    )),
    galleryPsReviewCount = galleryProducts.filter((o) => {
      const N = latestReviewsByProduct[o.id];
      return o.status === "IN_REVIEW" && (!N || N.status === "PENDING");
    }).length,
    galleryAvReviewCount = galleryProducts.filter((o) => {
      const N = latestReviewsByProduct[o.id];
      return !!N && (N.status === "ALTERNATIVE_SENT" || N.status === "NO_STOCK");
    }).length,
    galleryAnnotatedCount = galleryProducts.filter((o) =>
      o.status === "ANNOTATED" || o.status === "BOUGHT" || o.status === "SHIPPED",
    ).length,
    galleryRejectedCount = galleryProducts.filter((o) => o.status === "REJECTED").length,
    visibleGalleryProducts =
      wl === "PS_REVIEW"
        ? galleryProducts.filter((o) => {
          const N = latestReviewsByProduct[o.id];
          return o.status === "IN_REVIEW" && (!N || N.status === "PENDING");
        })
        : wl === "AV_REVIEW"
          ? galleryProducts.filter((o) => {
            const N = latestReviewsByProduct[o.id];
            return !!N && (N.status === "ALTERNATIVE_SENT" || N.status === "NO_STOCK");
          })
          : wl === "REJECTED"
            ? galleryProducts.filter((o) => o.status === "REJECTED")
            : galleryProducts.filter((o) => {
              const N =
                o.status === "ANNOTATED" || o.status === "BOUGHT" || o.status === "SHIPPED";
              if (!N) return !1;
              if (galleryDeliveryFilter === "SHIPPED") return o.status === "SHIPPED";
              if (galleryDeliveryFilter === "PENDING") return o.status !== "SHIPPED";
              return !0;
            }),
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
    missionReviewAlertCount = missionReviewAlerts.length;
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
              className: "text-3xl font-black mb-2",
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
          className: "space-y-4",
          children: [
            c.jsx("div", {
              children: c.jsx("input", {
                placeholder: "Username",
                value: cl.username,
                onChange: (o) => Ql({ ...cl, username: o.target.value }),
                className:
                  "w-full border p-4 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 ring-primary",
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
                  "w-full border p-4 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 ring-primary",
                required: !0,
              }),
            }),
            Q === "REGISTER" &&
            c.jsx("div", {
              children: c.jsxs("select", {
                value: cl.role,
                onChange: (o) => Ql({ ...cl, role: o.target.value }),
                className:
                  "w-full border p-4 rounded-xl bg-gray-50 dark:bg-gray-800 outline-none focus:ring-2 ring-primary",
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
                "w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl shadow-lg transition",
              children: Q === "LOGIN" ? "Access Account" : "Register Account",
            }),
          ],
        }),
        c.jsx("div", {
          className: "mt-8 text-center text-sm",
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
      className: "space-y-6",
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
              children: "Shopping Mission",
            }),
            c.jsx("p", {
              className: "text-text-sub text-sm mb-6",
              children: w
                ? w.status === "PAUSED"
                  ? "Mission is paused. Resume when you're ready to continue."
                  : "You are currently shopping. The mission is active!"
                : "Start a mission when you are at the store to begin tracking purchases.",
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
                  " Start Mission",
                ],
            }),
          ],
        }),
        c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark shadow-sm",
          children: [
            c.jsxs("div", {
              className: "mb-4",
              children: [
                c.jsxs("h3", {
                  className: "font-bold text-sm mb-2 text-text-main dark:text-white",
                  children: ["Peticiones (", requests.length, ")"],
                }),
                c.jsx("div", {
                  className: "space-y-2 pr-1",
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
                              className: `relative rounded-2xl border-l-4 px-3 py-2.5 shadow-sm transition ${o.status === "ACKNOWLEDGED" ? "bg-emerald-100/95 border-emerald-500 border-l-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-700 dark:border-l-emerald-500" : o.status === "NO_STOCK" ? "bg-rose-100/95 border-rose-500 border-l-rose-700 dark:bg-rose-950/60 dark:border-rose-700 dark:border-l-rose-500" : o.status === "MODIFIED" ? "bg-amber-100/95 border-amber-500 border-l-amber-700 dark:bg-amber-950/60 dark:border-amber-700 dark:border-l-amber-500" : o.status === "DISCARDED" ? "bg-slate-100/95 border-slate-400 border-l-slate-600 dark:bg-slate-900 dark:border-slate-600 dark:border-l-slate-400" : "bg-sky-50 border-sky-300 border-l-sky-500 dark:bg-slate-900/70 dark:border-slate-600 dark:border-l-sky-400"}`,
                              children: [
                                editingRequestId === o.id
                                  ? c.jsxs("div", {
                                      className: "flex items-center gap-2",
                                      children: [
                                        c.jsx("input", {
                                          type: "text",
                                          value: editingRequestText,
                                          onChange: (N) => setEditingRequestText(N.target.value),
                                          className:
                                            "flex-1 px-2 py-1 text-xs border rounded-lg dark:bg-gray-800 dark:border-gray-700",
                                        }),
                                        c.jsx("button", {
                                          onClick: () => saveRequestModify(o),
                                          className:
                                            "text-[10px] px-3 py-1.5 rounded-full bg-amber-500 text-white font-semibold hover:bg-amber-600 transition",
                                          children: "Guardar",
                                        }),
                                        c.jsx("button", {
                                          onClick: () => {
                                            setEditingRequestId(null);
                                          },
                                          className:
                                            "text-[10px] px-3 py-1.5 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition",
                                          children: "X",
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
                                            c.jsx("button", {
                                              onClick: () =>
                                                updateMissionRequest(
                                                  o.id,
                                                  o.status === "ACKNOWLEDGED"
                                                    ? "PENDING"
                                                    : "ACKNOWLEDGED",
                                                ),
                                              className:
                                                "w-8 h-8 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-700 dark:bg-emerald-900/35 dark:text-emerald-200 dark:hover:bg-emerald-900/60 flex items-center justify-center",
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
                                                "w-8 h-8 rounded-lg border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 dark:border-red-700 dark:bg-red-900/35 dark:text-red-200 dark:hover:bg-red-900/60 flex items-center justify-center",
                                              title: "No existencia",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[14px]",
                                                children: "block",
                                              }),
                                            }),
                                            c.jsx("button", {
                                              onClick: () => startRequestModify(o),
                                              className:
                                                "w-8 h-8 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-900/35 dark:text-amber-200 dark:hover:bg-amber-900/60 flex items-center justify-center",
                                              title: "Modificar",
                                              children: c.jsx("span", {
                                                className: "material-symbols-outlined text-[14px]",
                                                children: "edit",
                                              }),
                                            }),
                                            c.jsx("button", {
                                              onClick: () => deleteMissionRequest(o.id),
                                              className:
                                                "w-8 h-8 rounded-lg border border-rose-300 bg-rose-50 text-rose-800 hover:bg-rose-100 dark:border-rose-700 dark:bg-rose-900/35 dark:text-rose-200 dark:hover:bg-rose-900/60 flex items-center justify-center",
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
                  className: "mt-2 flex gap-2",
                  children: [
                    c.jsx("input", {
                      type: "text",
                      value: newRequestText,
                      onChange: (o) => setNewRequestText(o.target.value),
                      placeholder: "Nueva petición...",
                      className:
                        "flex-1 px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary",
                    }),
                    c.jsx("button", {
                      onClick: createMissionRequest,
                      disabled: !newRequestText.trim(),
                      className: `px-4 py-2 rounded-xl text-sm font-semibold transition ${newRequestText.trim() ? "bg-primary text-white hover:bg-primary-dark" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`,
                      children: "Enviar",
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
          className:
            "bg-surface-light dark:bg-surface-dark rounded-xl p-4 border border-border-light dark:border-border-dark shadow-sm",
          children: [
            c.jsxs("h3", {
              className:
                "font-bold text-sm mb-3 text-text-main dark:text-white",
              children: ["Clients in Mission (", Rt.length, ")"],
            }),
            c.jsx("div", {
              className: "space-y-2",
              children: Rt.map((o) =>
                c.jsxs(
                  "div",
                  {
                    onClick: () => Ta(o, w && w.id),
                    className:
                      "flex items-center gap-3 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition",
                    children: [
                      c.jsx("div", {
                        className:
                          "w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg uppercase border border-primary/20",
                        children: o.name.charAt(0),
                      }),
                      c.jsxs("div", {
                        className: "flex-1 min-w-0",
                        children: [
                          c.jsx("p", {
                            className:
                              "font-semibold text-xs text-text-main dark:text-gray-100",
                            children: o.name,
                          }),
                          c.jsxs("p", {
                            className: "text-[10px] text-gray-500",
                            children: [
                              (o.products || []).filter(
                                (N) => N.mission === w.id,
                              ).length,
                              " items in this mission",
                            ],
                          }),
                        ],
                      }),
                      c.jsx("span", {
                        className:
                          "material-symbols-outlined text-gray-400 text-[18px]",
                        children: "chevron_right",
                      }),
                    ],
                  },
                  o.id,
                ),
              ),
            }),
          ],
        }),
        w &&
        Rt.length === 0 &&
        c.jsxs("div", {
          className:
            "text-center py-6 bg-surface-light dark:bg-surface-dark rounded-xl border border-dashed border-gray-300 dark:border-gray-700",
          children: [
            c.jsx("p", {
              className: "text-gray-400 text-sm",
              children: "No clients assigned to this mission yet.",
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
                              className: "flex gap-2 mb-2",
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
                                  onClick: () => saveRequestModify(o),
                                  className:
                                    "text-xs px-2 py-1 rounded bg-amber-500 text-white font-semibold",
                                  children: "Guardar",
                                }),
                              ],
                            })
                            : c.jsx("p", {
                              className:
                                "text-xs font-medium text-gray-700 dark:text-gray-200 mb-2",
                              children: o.description,
                            }),
                          c.jsxs("p", {
                            className: "text-[10px] text-gray-500 mb-2",
                            children: [
                              o.created_by_username || "Usuario",
                              " (",
                              o.created_by_role || "AV",
                              ") • ",
                              getRelativeTime(o.updated_at || o.created_at),
                            ],
                          }),
                          c.jsxs("div", {
                            className: "grid grid-cols-2 gap-1",
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
                            ],
                          }),
                        ],
                      },
                      o.id,
                    ),
                  ),
            }),
            c.jsxs("div", {
              className: "mt-3 flex gap-2",
              children: [
                c.jsx("input", {
                  type: "text",
                  value: newRequestText,
                  onChange: (o) => setNewRequestText(o.target.value),
                  placeholder: "Nueva peticion...",
                  className:
                    "flex-1 px-3 py-2 rounded-xl border dark:bg-gray-800 dark:border-gray-700 text-sm outline-none focus:ring-2 focus:ring-primary",
                }),
                c.jsx("button", {
                  onClick: createMissionRequest,
                  disabled: !newRequestText.trim(),
                  className: `px-4 py-2 rounded-xl text-sm font-semibold transition ${newRequestText.trim() ? "bg-primary text-white hover:bg-primary-dark" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`,
                  children: "Enviar",
                }),
              ],
            }),
          ],
        }),
        c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark rounded-xl px-4 py-3 border border-border-light dark:border-border-dark shadow-sm",
          children: [
            c.jsxs("div", {
              className: "flex items-center justify-between gap-2",
              children: [
                c.jsxs("div", {
                  className: "min-w-0",
                  children: [
                    c.jsx("h3", {
                      className: "font-bold text-sm text-text-main dark:text-white truncate",
                      children: "Shopping Mission",
                    }),
                    c.jsx("p", {
                      className: "text-[10px] text-gray-500 truncate",
                      children: w
                        ? `${w.name || `Mission #${w.id}`} • ${w.status}`
                        : "No active mission",
                    }),
                  ],
                }),
                c.jsx("span", {
                  className: `text-[10px] font-bold px-2 py-1 rounded-full ${w ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`,
                  children: w ? "ON" : "OFF",
                }),
              ],
            }),
            w &&
            c.jsxs("div", {
              className: "mt-2 flex items-center justify-between text-[11px] font-semibold",
              children: [
                c.jsxs("span", {
                  className: "text-gray-600 dark:text-gray-300",
                  children: ["Items: ", missionProductsCount],
                }),
                c.jsxs("span", {
                  className: "text-primary",
                  children: [
                    "Total+Tax: $",
                    missionTotalWithTaxes.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }),
                  ],
                }),
              ],
            }),
            c.jsxs("div", {
              className: "mt-2 grid grid-cols-4 gap-2",
              children: w
                ? [
                  w.status === "ACTIVE"
                    ? c.jsx(
                      "button",
                      {
                        onClick: be,
                        className:
                          "py-2 rounded-lg bg-amber-500 text-white text-[11px] font-bold hover:bg-amber-600",
                        children: "Pause",
                      },
                      "pause",
                    )
                    : c.jsx(
                      "button",
                      {
                        onClick: cu,
                        className:
                          "py-2 rounded-lg bg-green-600 text-white text-[11px] font-bold hover:bg-green-700",
                        children: "Resume",
                      },
                      "resume",
                    ),
                  c.jsx(
                    "button",
                    {
                      onClick: on,
                      className:
                        "py-2 rounded-lg bg-red-500 text-white text-[11px] font-bold hover:bg-red-600",
                      children: "End",
                    },
                    "end",
                  ),
                  c.jsx(
                    "button",
                    {
                      onClick: () => setMissionSummaryOpen(!0),
                      className:
                        "py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark",
                      children: "View",
                    },
                    "view",
                  ),
                  c.jsx(
                    "button",
                    {
                      onClick: openMissionTicketPicker,
                      className:
                        "py-2 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-700",
                      children: "Ticket",
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
                        "col-span-4 py-2 rounded-lg bg-primary text-white text-[11px] font-bold hover:bg-primary-dark",
                      children: "Start Mission",
                    },
                    "start",
                  ),
                ],
            }),
            w &&
            c.jsx("div", {
              className:
                "mt-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/70 dark:bg-gray-900/40 p-2",
              children: w.ticket_image
                ? c.jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    c.jsx("img", {
                      src: resolveMediaUrl(w.ticket_image),
                      className: "w-10 h-10 rounded object-cover border",
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
              : A === "BOUGHT"
                ? "bg-purple-100 text-purple-700"
              : "bg-amber-100 text-amber-700";
      return c.jsxs("div", {
        className: "space-y-4",
        children: [
          c.jsxs("div", {
            className: "flex items-center justify-between mt-2 mb-2",
            children: [
              c.jsx("h2", {
                className: "text-lg font-bold text-text-main dark:text-white",
                children: "Missions",
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
                  children: "No missions yet",
                }),
                c.jsx("p", {
                  className: "text-gray-500 text-sm mb-4",
                  children: "Start your first mission from here.",
                }),
                c.jsx("button", {
                  onClick: openMissionStart,
                  className:
                    "px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary-dark transition",
                  children: "Start Mission",
                }),
              ],
            })
            : c.jsx("div", {
              className: "space-y-3",
              children: Al.map((A) => {
                const vl = fn === A.id,
                  El = w && w.id === A.id,
                  Se = A.clients_detail || [],
                  qa = Se.filter((gl) =>
                    (gl.products || []).some((ae) => ae.mission === A.id),
                  ),
                  ea = A.products || [];
                return c.jsxs(
                  "div",
                  {
                    className: `bg-surface-light dark:bg-surface-dark rounded-xl border shadow-sm overflow-hidden transition-all ${El ? "border-primary/50 ring-1 ring-primary/20" : "border-border-light dark:border-border-dark"}`,
                    children: [
                      c.jsx("div", {
                        className:
                          "p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition",
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
                                        className:
                                          "font-bold text-sm truncate",
                                        children:
                                          A.name || `Mission #${A.id}`,
                                      }),
                                      c.jsxs("p", {
                                        className:
                                          "text-[10px] text-gray-500 mt-0.5",
                                        children: [
                                          new Date(
                                            A.start_time,
                                          ).toLocaleDateString(),
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
                                    className: "w-10 h-10 rounded object-cover border",
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
                                      (mi) => mi.mission === A.id,
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
                                          className: "flex gap-1",
                                          children: [
                                            c.jsx("button", {
                                              onClick: () => Ta(gl, A.id),
                                              className:
                                                "text-[10px] font-bold bg-primary/10 text-primary px-2.5 py-1 rounded-lg hover:bg-primary/20 transition",
                                              children: "View",
                                            }),
                                            c.jsxs("button", {
                                              onClick: () =>
                                                copyMissionBreakdown(
                                                  A,
                                                  gl,
                                                ),
                                              className:
                                                "text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-lg hover:bg-emerald-200 transition",
                                              children: [
                                                "📋 ",
                                                copiedMissionClients.includes(
                                                  ae,
                                                )
                                                  ? "Copiado"
                                                  : "Copiar",
                                              ],
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
                                className: "space-y-1.5",
                                children: ea.map((gl) =>
                                  c.jsxs(
                                    "div",
                                    {
                                      className:
                                        "flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg text-xs border border-gray-100 dark:border-gray-700",
                                      children: [
                                        c.jsxs("div", {
                                          className: "flex-1 min-w-0",
                                          children: [
                                            c.jsx("p", {
                                              className:
                                                "font-semibold truncate",
                                              children: gl.name,
                                            }),
                                            gl.tags &&
                                            c.jsx("p", {
                                              className:
                                                "text-[9px] text-purple-500 mt-0.5",
                                              children: gl.tags,
                                            }),
                                          ],
                                        }),
                                        c.jsxs("div", {
                                          className:
                                            "flex items-center gap-2 ml-2",
                                          children: [
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
                                              className: `text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${N(gl.status)}`,
                                              children: gl.status,
                                            }),
                                          ],
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
                                "No clients or products linked to this mission.",
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
        className: "space-y-4",
        children: [
          c.jsxs("div", {
            className: "flex items-center justify-between mb-2",
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
                children: "No clients defined or matched search.",
              }),
            })
            : o.map((N) => {
              const A = Ei === N.id,
                vl = (N.products || []).filter(
                  (ea) =>
                    ea.mission !== null &&
                    typeof ea.mission !== "undefined" &&
                    ea.status !== "IN_REVIEW" &&
                    ea.status !== "REJECTED",
                ),
                El = vl.reduce((Se, ea) => {
                  const gl = String(ea.mission);
                  return (Se[gl] || (Se[gl] = []), Se[gl].push(ea), Se);
                }, {}),
                Se = Object.entries(El)
                  .map(([ea, gl]) => {
                    const ae =
                        Al.find((oi) => oi.id === Number(ea)),
                      oiName = (gl[0] && gl[0].mission_name
                        ? String(gl[0].mission_name).trim()
                        : ""),
                      oi =
                        ae && ae.name
                          ? ae.name
                          : oiName
                            ? oiName
                            : `Mission #${ea}`,
                      mi =
                        (ae && ae.start_time) ||
                        (gl[0] && (gl[0].mission_date || gl[0].created_at)) ||
                        "";
                    return {
                      key: ea,
                      mission: ae,
                      title: oi,
                      date: mi,
                      items: gl,
                    };
                  })
                  .sort(
                    (ea, gl) =>
                      new Date(gl.date || 0).getTime() -
                      new Date(ea.date || 0).getTime(),
                  );
              return c.jsxs(
                "div",
                {
                  className:
                    "bg-surface-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light overflow-hidden group",
                  children: [
                    c.jsxs("div", {
                      className: "p-4 flex items-center gap-4 relative",
                      children: [
                        c.jsx("div", {
                          className:
                            "w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl uppercase border",
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
                            N.tags &&
                            c.jsx("p", {
                              className:
                                "text-[10px] text-gray-400 mt-0.5 max-w-[150px] truncate",
                              children: N.tags,
                            }),
                          ],
                        }),
                        w
                          ? c.jsxs("div", {
                            onClick: () => Jt(N),
                            className: `px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition flex items-center gap-1 cursor-pointer ${N.status === "Active" ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                            children: [
                              c.jsx("span", {
                                className:
                                  "material-symbols-outlined text-[14px]",
                                children:
                                  N.status === "Active"
                                    ? "check_circle"
                                    : "radio_button_unchecked",
                              }),
                              N.status === "Active" ? "In Mission" : "Idle",
                            ],
                          })
                          : null,
                        X !== "PS" &&
                        c.jsx("div", {
                          className:
                            "opacity-0 group-hover:opacity-100 transition-opacity flex items-center",
                          children: c.jsx("button", {
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
                              "w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center",
                            children: c.jsx("span", {
                              className: "material-symbols-outlined",
                              children: "more_vert",
                            }),
                          }),
                        }),
                        c.jsx("span", {
                          className:
                            "material-symbols-outlined text-gray-400 text-[18px] cursor-pointer transition-transform",
                          style: { transform: A ? "rotate(180deg)" : "" },
                          onClick: () => ge(A ? null : N.id),
                          children: "expand_more",
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
                        vl.length === 0
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
                                  "Purchase History (",
                                  vl.length,
                                  ")",
                                ],
                              }),
                              c.jsx("div", {
                                className:
                                  "space-y-1.5 max-h-[300px] overflow-y-auto",
                                children: Se.map((ea) =>
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
                                              ],
                                            }),
                                            c.jsx("span", {
                                              className:
                                                "material-symbols-outlined text-[16px] text-gray-500",
                                              children:
                                                openHistoryMissionByClient[N.id] ===
                                                ea.key
                                                  ? "expand_less"
                                                  : "expand_more",
                                            }),
                                          ],
                                        }),
                                        openHistoryMissionByClient[N.id] ===
                                        ea.key &&
                                        c.jsx("div", {
                                          className:
                                            "border-t border-gray-200 dark:border-gray-700 px-2 py-1.5 space-y-1",
                                          children: ea.items.map((gl) =>
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
                                                            "w-7 h-7 rounded object-cover border",
                                                        })
                                                        : c.jsx("div", {
                                                          className:
                                                            "w-7 h-7 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center",
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
                                                        className: `text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full ${gl.status === "SHIPPED" ? "bg-blue-100 text-blue-700" : gl.status === "REJECTED" ? "bg-red-100 text-red-700" : gl.status === "IN_REVIEW" ? "bg-orange-100 text-orange-700" : gl.status === "BOUGHT" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`,
                                                        children: gl.status,
                                                      }),
                                                    ],
                                                  }),
                                                ],
                                              },
                                              gl.id,
                                            ),
                                          ),
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
                            "w-full mt-3 py-2 text-xs font-bold bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition flex items-center justify-center gap-1",
                          children: [
                            c.jsx("span", {
                              className:
                                "material-symbols-outlined text-[14px]",
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
    du = () =>
      c.jsxs("div", {
        className: "space-y-6",
        children: [
          c.jsxs("div", {
            className:
              "bg-surface-light p-6 rounded-2xl border shadow-card text-center",
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
    className:
      "w-full max-w-[480px] h-screen bg-surface-light dark:bg-surface-dark shadow-2xl relative flex flex-col border-x border-border-light dark:border-border-dark overflow-hidden",
    children: [
      J &&
      J.profile.role === "BOTH" &&
      c.jsxs("div", {
        className:
          "bg-emerald-600 text-white text-xs p-2 flex justify-center gap-4 z-50 relative shadow-md",
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
        className:
          "sticky top-0 z-40 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur-md border-b border-border-light dark:border-border-dark transition-colors duration-200",
        children: c.jsx("div", {
          className: "px-5 py-4 flex items-center justify-between",
          children: c.jsxs("div", {
            className: "flex items-center gap-3",
            children: [
              c.jsx("div", {
                className:
                  "h-10 w-10 rounded-full bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center font-bold text-lg uppercase",
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
      }),
      c.jsxs("main", {
        className:
          "flex-1 overflow-y-auto p-5 bg-background-light dark:bg-background-dark",
        children: [
          nl === "HOME" && ta(),
          nl === "MISSIONS" && pe(),
          nl === "CLIENTS" && Hl(),
          nl === "CALCULATOR" && hu(),
          nl === "PROFILE" && du(),
          c.jsx("div", { className: "h-20" }),
        ],
      }),
      showMissionStartModal &&
      c.jsx("div", {
        className:
          "absolute inset-0 z-[65] bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
        children: c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-5 rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet",
          children: [
            c.jsx("h3", {
              className: "text-base font-bold mb-3",
              children: "Start Mission",
            }),
            c.jsxs("div", {
              className: "space-y-2",
              children: [
                c.jsx("input", {
                  type: "text",
                  value: missionStartForm.name,
                  onChange: (o) =>
                    setMissionStartForm({ ...missionStartForm, name: o.target.value }),
                  placeholder: "Tienda / nombre de misión",
                  className:
                    "w-full px-3 py-2 text-sm border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
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
                  onClick: () => setShowMissionStartModal(!1),
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
        className:
          "absolute inset-0 z-[66] bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
        children: c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-lg p-5 rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl max-h-[85vh] overflow-y-auto ui-sheet",
          children: [
            c.jsxs("div", {
              className: "flex items-center justify-between mb-3",
              children: [
                c.jsx("h3", {
                  className: "text-base font-bold",
                  children: "Mission Products",
                }),
                c.jsx("button", {
                  onClick: () => setMissionSummaryOpen(!1),
                  className:
                    "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center",
                  children: c.jsx("span", {
                    className: "material-symbols-outlined text-[16px]",
                    children: "close",
                  }),
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
                      className: "w-12 h-12 rounded object-cover border",
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
            activeMissionProducts.length === 0
              ? c.jsx("p", {
                className: "text-xs text-gray-500 text-center py-6",
                children: "No products linked to the active mission yet.",
              })
              : c.jsx("div", {
                className: "space-y-2",
                children: activeMissionProducts.map((o) =>
                  c.jsxs(
                    "div",
                    {
                      className:
                        "flex items-center gap-3 p-2 rounded-xl border border-gray-200 bg-white dark:bg-gray-800/30",
                      children: [
                        o.image
                          ? c.jsx("img", {
                            src: resolveMediaUrl(o.image),
                            className: "w-14 h-14 rounded-lg object-cover border",
                          })
                          : c.jsx("div", {
                            className:
                              "w-14 h-14 rounded-lg bg-gray-100 border flex items-center justify-center text-gray-400",
                            children: c.jsx("span", {
                              className: "material-symbols-outlined",
                              children: "image",
                            }),
                          }),
                        c.jsxs("div", {
                          className: "flex-1 min-w-0",
                          children: [
                            c.jsx("p", {
                              className: "text-xs font-bold truncate",
                              children: o.name,
                            }),
                            c.jsxs("p", {
                              className: "text-[10px] text-gray-500 truncate",
                              children: ["Cliente: ", o.client_name || `#${o.client}`],
                            }),
                          ],
                        }),
                        c.jsx("span", {
                          className:
                            "text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-gray-600",
                          children: o.status,
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
        className:
          "absolute inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
        children: c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl ui-sheet",
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
                      onClick: () => k(!1),
                      className:
                        "flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-semibold rounded-xl transition",
                      children: "Cancel",
                    }),
                    c.jsx("button", {
                      type: "submit",
                      className:
                        "flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition shadow-lg shadow-primary/30",
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
        className:
          "absolute inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
        children: c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl ui-sheet",
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
                      onClick: () => {
                        (tl(!1), Y(null));
                      },
                      className:
                        "flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-semibold rounded-xl transition",
                      children: "Cancel",
                    }),
                    c.jsx("button", {
                      type: "submit",
                      className:
                        "flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition shadow-lg shadow-primary/30",
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
        className:
          "absolute inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center overflow-y-auto p-2 sm:p-4 ui-backdrop",
        children: c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto ui-sheet",
          children: [
            c.jsx("h3", {
              className: "text-xl font-bold mb-4",
              children: "Edit Product Info",
            }),
            c.jsxs("form", {
              onSubmit: zi,
              className: "space-y-4",
              children: [
                c.jsxs("div", {
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
                  className: "grid grid-cols-2 gap-4",
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
                          children: "Final Price (MXN)",
                        }),
                        c.jsx("input", {
                          type: "number",
                          step: "0.01",
                          value: Number.isFinite(modalFinalPrice)
                            ? modalFinalPrice.toFixed(2)
                            : "",
                          readOnly: !0,
                          className:
                            "w-full px-3 py-2 border rounded-xl bg-gray-100 dark:bg-gray-700 dark:border-gray-700 text-gray-600",
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
                          "calc-input w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white caret-gray-900 dark:caret-white focus:ring-2 focus:ring-primary outline-none",
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
                              "calc-input w-full px-4 py-2 border rounded-xl bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white caret-gray-900 dark:caret-white focus:ring-2 focus:ring-primary outline-none",
                          }),
                        ],
                      }),
                    ],
                  })
                  : c.jsxs("div", {
                    className: "grid grid-cols-2 gap-2",
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
                              "calc-input w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white caret-gray-900 dark:caret-white focus:ring-2 focus:ring-primary outline-none",
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
                              "calc-input w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white caret-gray-900 dark:caret-white focus:ring-2 focus:ring-primary outline-none",
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
                              "calc-input w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white caret-gray-900 dark:caret-white focus:ring-2 focus:ring-primary outline-none",
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
                              "calc-input w-full px-2 py-2 border rounded-lg bg-white dark:bg-gray-900 dark:border-gray-700 text-gray-900 dark:text-white caret-gray-900 dark:caret-white focus:ring-2 focus:ring-primary outline-none",
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
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Store",
                    }),
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
                c.jsxs("div", {
                  children: [
                    c.jsx("label", {
                      className:
                        "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
                      children: "Status",
                    }),
                    c.jsxs("div", {
                      className: "grid grid-cols-2 gap-2",
                      children: [
                        ["ANNOTATED", "Anotado"],
                        ["IN_REVIEW", "PS Revision"],
                        ["SHIPPED", "Enviado"],
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
                  className: "flex gap-3 pt-4",
                  children: [
                    c.jsx("button", {
                      type: "button",
                      onClick: () => {
                        (ut(!1), Ke(null));
                      },
                      className:
                        "flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-semibold rounded-xl transition",
                      children: "Cancel",
                    }),
                    c.jsx("button", {
                      type: "submit",
                      className:
                        "flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition shadow-lg shadow-primary/30",
                      children: "Save Changes",
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
      ji &&
      Je &&
      c.jsx("div", {
        className:
          "absolute inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center ui-backdrop",
        children: c.jsxs("div", {
          className:
            "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-6 rounded-t-3xl sm:rounded-3xl shadow-2xl ui-sheet",
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
                      onClick: () => {
                        (sn(!1), We(null));
                      },
                      className:
                        "flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-semibold rounded-xl transition",
                      children: "Cancel",
                    }),
                    c.jsx("button", {
                      type: "submit",
                      className:
                        "flex-1 py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl transition shadow-lg shadow-primary/30",
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
          "absolute inset-0 z-50 bg-background-light dark:bg-background-dark flex flex-col overflow-x-hidden animate-in slide-in-from-bottom duration-300",
        children: [
          c.jsxs("div", {
            className:
              "sticky top-0 z-10 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md pb-0 border-b border-border-light dark:border-border-dark shadow-sm",
            children: [
              c.jsxs("div", {
                className: "p-4 flex items-center justify-between",
                children: [
                  c.jsx("button", {
                    onClick: Aa,
                    className:
                      "w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition",
                    children: c.jsx("span", {
                      className: "material-symbols-outlined",
                      children: "arrow_back",
                    }),
                  }),
                  c.jsx("h2", {
                    className: "font-bold text-lg truncate max-w-[200px]",
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
                  "flex px-4 gap-6 text-sm font-bold border-t border-border-light dark:border-border-dark pt-2",
                children: [
                  c.jsxs("button", {
                    onClick: () => jt("PS_REVIEW"),
                    className: `pb-3 border-b-2 transition-colors ${wl === "PS_REVIEW" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"}`,
                    children: ["PS Revision (", galleryPsReviewCount, ")"],
                  }),
                  c.jsxs("button", {
                    onClick: () => jt("AV_REVIEW"),
                    className: `pb-3 border-b-2 transition-colors ${wl === "AV_REVIEW" ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-white"}`,
                    children: ["AV Revision (", galleryAvReviewCount, ")"],
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
            className: "p-5 flex-1 overflow-y-auto space-y-6",
            children: [
              c.jsxs("div", {
                className:
                  "flex items-center gap-4 bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-border-light",
                children: [
                  c.jsx("div", {
                    className:
                      "w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl uppercase border",
                    children: W.name.charAt(0),
                  }),
                  c.jsxs("div", {
                    children: [
                      c.jsx("span", {
                        className: `text-[10px] uppercase font-bold px-2 py-0.5 rounded-full mb-1 inline-block ${W.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`,
                        children:
                          W.status === "Active" ? "In Mission" : "Idle",
                      }),
                      c.jsx("p", {
                        className:
                          "text-xs text-text-sub dark:text-slate-400",
                        children: W.tags,
                      }),
                    ],
                  }),
                ],
              }),
              (wl === "PS_REVIEW" ||
                wl === "AV_REVIEW" ||
                wl === "ANNOTATED" ||
                wl === "REJECTED") &&
              c.jsxs("div", {
                className: "animate-in fade-in duration-200",
                children: [
                  c.jsxs("div", {
                    className: "mb-4",
                    children: [
                      c.jsx("h4", {
                        className: "font-bold text-lg",
                        children:
                          wl === "PS_REVIEW"
                            ? "Productos por revisar (PS)"
                            : wl === "AV_REVIEW"
                              ? "Productos por revisar (AV)"
                              : wl === "REJECTED"
                                ? "Productos rechazados"
                                : "Productos Anotados",
                      }),
                      c.jsxs("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: [
                          "Anotado: ",
                          galleryAnnotatedCount,
                          " • PS Rev: ",
                          galleryPsReviewCount,
                          " • AV Rev: ",
                          galleryAvReviewCount,
                          " • Rechazado: ",
                          galleryRejectedCount,
                        ],
                      }),
                    ],
                  }),
                  wl === "ANNOTATED" &&
                  c.jsxs("div", {
                    className: "mb-3 flex gap-2",
                    children: [
                      c.jsx("button", {
                        onClick: () => setGalleryDeliveryFilter("ALL"),
                        className: `px-2.5 py-1 rounded-lg text-[10px] font-bold ${galleryDeliveryFilter === "ALL" ? "bg-primary text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                        children: "Todos",
                      }),
                      c.jsx("button", {
                        onClick: () => setGalleryDeliveryFilter("PENDING"),
                        className: `px-2.5 py-1 rounded-lg text-[10px] font-bold ${galleryDeliveryFilter === "PENDING" ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                        children: "Pendiente de enviar",
                      }),
                      c.jsx("button", {
                        onClick: () => setGalleryDeliveryFilter("SHIPPED"),
                        className: `px-2.5 py-1 rounded-lg text-[10px] font-bold ${galleryDeliveryFilter === "SHIPPED" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
                        children: "Enviados",
                      }),
                    ],
                  }),
                  c.jsxs("div", {
                    className: "grid grid-cols-2 gap-1",
                    children: [
                      // <-------- seccion 7: tarjetas con estado de revision y acciones por rol
                      sortedVisibleGalleryProducts.map((o) => {
                        const reviewEntry = latestReviewsByProduct[o.id],
                          hasPulse =
                            reviewEntry &&
                            (reviewEntry.status === "PENDING" ||
                              reviewEntry.status === "ALTERNATIVE_SENT"),
                          isPendingReview =
                            reviewEntry && reviewEntry.status === "PENDING",
                          isAltReady =
                            reviewEntry &&
                            reviewEntry.status === "ALTERNATIVE_SENT";
                        return c.jsxs(
                          "div",
                          {
                            className: `bg-surface-light dark:bg-surface-dark rounded-lg overflow-hidden shadow-card border flex flex-col relative group ${hasPulse ? "review-pending border-amber-300" : "border-border-light dark:border-border-dark"}`,
                            children: [
                              c.jsxs("div", {
                                className: "absolute top-2 right-2 z-20",
                                "data-product-menu": "1",
                                children: [
                                  c.jsx("button", {
                                    onClick: (N) => {
                                      (N.stopPropagation(),
                                        setOpenProductMenuId((A) =>
                                          A === o.id ? null : o.id,
                                        ));
                                    },
                                    className:
                                      "w-8 h-8 rounded-full bg-white/95 text-gray-700 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center",
                                    title: "Opciones",
                                    children: c.jsx("span", {
                                      className:
                                        "material-symbols-outlined text-[16px]",
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
                                        className:
                                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-purple-700 hover:bg-purple-50",
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              "material-symbols-outlined text-[14px]",
                                            children: "add_a_photo",
                                          }),
                                          "Cambiar foto",
                                        ],
                                      }),
                                      c.jsxs("button", {
                                        onClick: (N) => {
                                          (N.stopPropagation(),
                                            setOpenProductMenuId(null),
                                            setProductStatusQuick(o.id, "ANNOTATED"));
                                        },
                                        className:
                                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-emerald-700 hover:bg-emerald-50",
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              "material-symbols-outlined text-[14px]",
                                            children: "check_circle",
                                          }),
                                          "Anotado",
                                        ],
                                      }),
                                      c.jsxs("button", {
                                        onClick: (N) => {
                                          (N.stopPropagation(),
                                            setOpenProductMenuId(null),
                                            setProductStatusQuick(o.id, "SHIPPED"));
                                        },
                                        className:
                                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-blue-700 hover:bg-blue-50",
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              "material-symbols-outlined text-[14px]",
                                            children: "local_shipping",
                                          }),
                                          "Enviado",
                                        ],
                                      }),
                                      c.jsxs("button", {
                                        onClick: (N) => {
                                          (N.stopPropagation(),
                                            setOpenProductMenuId(null),
                                            setProductStatusQuick(o.id, "REJECTED"));
                                        },
                                        className:
                                          "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] text-amber-700 hover:bg-amber-50",
                                        children: [
                                          c.jsx("span", {
                                            className:
                                              "material-symbols-outlined text-[14px]",
                                            children: "block",
                                          }),
                                          "Rechazar",
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
                                className: "absolute top-2 left-2 z-20",
                                "data-product-info": "1",
                                children: c.jsx("button", {
                                  onClick: (N) => {
                                    (N.stopPropagation(),
                                      setOpenProductInfoId((A) =>
                                        A === o.id ? null : o.id,
                                      ));
                                  },
                                  className:
                                    "w-8 h-8 rounded-full bg-white/95 text-gray-700 hover:bg-white border border-gray-200 shadow-sm flex items-center justify-center",
                                  title: "Info del producto",
                                  children: c.jsx("span", {
                                    className:
                                      "material-symbols-outlined text-[16px]",
                                    children: "info",
                                  }),
                                }),
                              }),
                              c.jsxs("div", {
                                className:
                                  "w-full h-40 bg-gray-100 dark:bg-gray-800 relative flex items-center justify-center",
                                children: [
                                  o.image
                                    ? c.jsx("img", {
                                      src: resolveMediaUrl(o.image),
                                      className:
                                        "w-full h-full object-contain cursor-copy",
                                      onClick: () =>
                                        copyProductImageToClipboard(
                                          o.id,
                                          o.image,
                                        ),
                                      title: "Copiar imagen",
                                    })
                                    : c.jsxs("div", {
                                      className:
                                        "flex flex-col items-center justify-center text-gray-400",
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
                                  o.purchase_date &&
                                  c.jsx("span", {
                                    className:
                                      "absolute top-1 left-10 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded",
                                    children: new Date(o.purchase_date).toLocaleDateString(),
                                  }),
                                  o.tags &&
                                  c.jsx("div", {
                                    className:
                                      "absolute bottom-1 left-1 right-8 flex flex-wrap gap-1",
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
                                  o.image &&
                                  c.jsx("button", {
                                    onClick: () => setFullscreenImage(resolveMediaUrl(o.image)),
                                    className:
                                      "absolute bottom-1 right-1 w-6 h-6 rounded-md bg-white/90 hover:bg-white text-gray-600 flex items-center justify-center border border-gray-200",
                                    title: "Fullscreen",
                                    children: c.jsx("span", {
                                      className:
                                        "material-symbols-outlined text-[14px]",
                                      children: "fullscreen",
                                    }),
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
                                      o.mission_date &&
                                      c.jsxs("p", {
                                        className: "text-[10px] opacity-90",
                                        children: [
                                          "Mision: ",
                                          new Date(
                                            o.mission_date,
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
                                      reviewEntry &&
                                      reviewEntry.review_note &&
                                      c.jsxs("p", {
                                        className:
                                          "text-[10px] mt-1 break-words opacity-95",
                                        children: [
                                          "Revision: ",
                                          reviewEntry.review_note,
                                        ],
                                      }),
                                    ],
                                  }),
                                  openProductInfoId !== o.id &&
                                  c.jsxs("div", {
                                    className:
                                      "absolute left-1 bottom-1 max-w-[70%] bg-black/45 text-white rounded px-1.5 py-0.5 backdrop-blur-[1px]",
                                    children: [
                                      c.jsx("p", {
                                        className: "text-[10px] font-semibold truncate",
                                        children: o.name,
                                      }),
                                      c.jsx("p", {
                                        className: "text-[9px] uppercase tracking-wide",
                                        children: o.status,
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              c.jsxs("div", {
                                className: "hidden",
                                children: [
                                  c.jsxs("div", {
                                    children: [
                                      c.jsx("p", {
                                        className:
                                          "font-bold text-sm truncate",
                                        children: o.name,
                                      }),
                                      o.mission_date &&
                                      c.jsxs("p", {
                                        className:
                                          "text-[10px] text-gray-500 mt-0.5",
                                        children: [
                                          "Mission ",
                                          new Date(
                                            o.mission_date,
                                          ).toLocaleDateString(),
                                        ],
                                      }),
                                      o.tags &&
                                      c.jsx("div", {
                                        className:
                                          "flex flex-wrap gap-1 mt-1",
                                        children: o.tags
                                          .split(",")
                                          .map((N) => parseVisualTag(N))
                                          .filter((N) => N)
                                          .map((N, A) =>
                                            c.jsx(
                                              "span",
                                              {
                                                className: `${getTagClassName(N.type)} text-[9px] px-1.5 py-0.5 rounded font-medium`,
                                                children: N.label,
                                              },
                                              A,
                                            ),
                                          ),
                                      }),
                                      c.jsxs("div", {
                                        className:
                                          "flex flex-wrap gap-1 mt-1.5",
                                        children: [
                                          hasValue(o.charged_price) &&
                                          c.jsxs("span", {
                                            className:
                                              "text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold",
                                            children: [
                                              "$",
                                              o.charged_price,
                                            ],
                                          }),
                                          hasValue(o.real_price) &&
                                          c.jsxs("span", {
                                            className:
                                              "text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold",
                                            children: [
                                              "Store: $",
                                              o.real_price,
                                            ],
                                          }),
                                        ],
                                      }),
                                      copiedImageItemId === o.id &&
                                      c.jsx("p", {
                                        className:
                                          "text-[10px] mt-1 font-bold text-emerald-600",
                                        children: "📋 Imagen copiada",
                                      }),
                                      reviewEntry &&
                                      reviewEntry.review_note &&
                                      c.jsxs("div", {
                                        className:
                                          "mt-2 p-2 rounded-lg border border-amber-200 bg-amber-50",
                                        children: [
                                          c.jsxs("p", {
                                            className:
                                              "text-[10px] uppercase font-bold text-amber-700",
                                            children: [
                                              reviewEntry.review_type ||
                                              "CHECK_OTHER",
                                              " • ",
                                              reviewEntry.status,
                                            ],
                                          }),
                                          c.jsx("p", {
                                            className:
                                              "text-[10px] text-amber-800 mt-0.5",
                                            children:
                                              reviewEntry.review_note,
                                          }),
                                        ],
                                      }),
                                      X !== "PS" &&
                                      c.jsx("button", {
                                        onClick: () =>
                                          createProductReview(o),
                                        className:
                                          "mt-2 w-full text-[10px] py-1.5 rounded-lg bg-amber-100 text-amber-800 font-semibold hover:bg-amber-200",
                                        children: "Solicitar revision",
                                      }),
                                      X === "PS" &&
                                      isPendingReview &&
                                      c.jsxs("div", {
                                        className: "mt-2 grid grid-cols-1 gap-1",
                                        children: [
                                          c.jsx("button", {
                                            onClick: () =>
                                              updateProductReviewAction(
                                                reviewEntry,
                                                "confirm",
                                              ),
                                            className:
                                              "text-[10px] py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200",
                                            children: "✓ Confirmar",
                                          }),
                                          c.jsx("button", {
                                            onClick: () =>
                                              updateProductReviewAction(
                                                reviewEntry,
                                                "no-stock",
                                              ),
                                            className:
                                              "text-[10px] py-1.5 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200",
                                            children: "✕ No existe",
                                          }),
                                          c.jsx("button", {
                                            onClick: () =>
                                              openAlternativeUploadModal(
                                                reviewEntry,
                                              ),
                                            className:
                                              "text-[10px] py-1.5 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200",
                                            children:
                                              "📸 Enviar Alternativa",
                                          }),
                                        ],
                                      }),
                                      X !== "PS" &&
                                      isAltReady &&
                                      c.jsxs("div", {
                                        className:
                                          "mt-2 border border-sky-200 bg-sky-50 rounded-lg p-2",
                                        children: [
                                          c.jsx("p", {
                                            className:
                                              "text-[10px] font-bold text-sky-700 mb-1",
                                            children:
                                              "Alternativas disponibles",
                                          }),
                                          c.jsx("div", {
                                            className:
                                              "grid grid-cols-2 gap-1",
                                            children: (
                                              reviewEntry.alternatives ||
                                              []
                                            ).map((N) =>
                                              c.jsxs(
                                                "button",
                                                {
                                                  onClick: () =>
                                                    selectReviewAlternative(
                                                      reviewEntry,
                                                      N,
                                                    ),
                                                  className:
                                                    "text-left rounded border border-sky-200 bg-white hover:bg-sky-100 overflow-hidden",
                                                  children: [
                                                    N.image &&
                                                    c.jsx("img", {
                                                      src: resolveMediaUrl(N.image),
                                                      className:
                                                        "w-full h-14 object-cover",
                                                    }),
                                                    c.jsx("span", {
                                                      className:
                                                        "block p-1 text-[9px] text-sky-800 truncate",
                                                      children:
                                                        N.description ||
                                                        "Seleccionar",
                                                    }),
                                                  ],
                                                },
                                                N.id,
                                              ),
                                            ),
                                          }),
                                          c.jsxs("div", {
                                            className: "mt-2 grid grid-cols-1 gap-1",
                                            children: [
                                              c.jsx("button", {
                                                onClick: () =>
                                                  keepOriginalProduct(
                                                    reviewEntry,
                                                  ),
                                                className:
                                                  "text-[10px] py-1 rounded bg-emerald-100 text-emerald-700 font-semibold hover:bg-emerald-200",
                                                children:
                                                  "Quedarse original",
                                              }),
                                              c.jsx("button", {
                                                onClick: () =>
                                                  resendReviewToPs(
                                                    reviewEntry,
                                                  ),
                                                className:
                                                  "text-[10px] py-1 rounded bg-orange-100 text-orange-700 font-semibold hover:bg-orange-200",
                                                children: "Reenviar a PS",
                                              }),
                                              c.jsx("button", {
                                                onClick: () =>
                                                  discardReviewedProduct(
                                                    reviewEntry,
                                                  ),
                                                className:
                                                  "text-[10px] py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300",
                                                children: "Descartar",
                                              }),
                                            ],
                                          }),
                                        ],
                                      }),
                                    ],
                                  }),
                                  c.jsxs("div", {
                                    className:
                                      "mt-2 flex justify-between items-center",
                                    children: [
                                      c.jsx("span", {
                                        className: `text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${o.status === "SHIPPED" ? "bg-blue-100 text-blue-700" : o.status === "REJECTED" ? "bg-red-100 text-red-700" : o.status === "IN_REVIEW" ? "bg-orange-100 text-orange-700" : o.status === "BOUGHT" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"}`,
                                        children: o.status,
                                      }),
                                      o.receipt &&
                                      c.jsx("span", {
                                        className:
                                          "material-symbols-outlined text-gray-400 text-[14px]",
                                        title: "Linked to Ticket",
                                        children: "link",
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
                        onClick: fu,
                        className:
                          "bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 h-40 cursor-pointer hover:bg-primary/5 transition hover:border-primary/40 group",
                        children: [
                          c.jsx("span", {
                            className:
                              "material-symbols-outlined text-3xl text-primary mb-2 group-hover:scale-110 transition-transform",
                            children: "add_photo_alternate",
                          }),
                          c.jsx("span", {
                            className:
                              "text-sm font-semibold text-center px-4",
                            children:
                              X === "PS"
                                ? "+ Photo / Found Product"
                                : "+ Photo / Pre-order",
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
                              "bg-surface-light dark:bg-surface-dark rounded-xl overflow-hidden shadow-card border border-border-light dark:border-border-dark flex flex-col p-4 relative group",
                            children: [
                              c.jsxs("div", {
                                className: "flex gap-4 items-start",
                                children: [
                                  o.image
                                    ? c.jsx("img", {
                                      src: resolveMediaUrl(o.image),
                                      className:
                                        "w-16 h-20 rounded-md object-cover bg-gray-100 border border-gray-200",
                                    })
                                    : c.jsx("div", {
                                      className:
                                        "w-16 h-20 bg-gray-200 rounded-md flex items-center justify-center",
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
                        onClick: su,
                        className:
                          "bg-purple-50 dark:bg-purple-900/10 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-purple-300 dark:border-purple-700/50 py-8 cursor-pointer hover:bg-purple-100/50 transition",
                        children: [
                          c.jsx("span", {
                            className:
                              "material-symbols-outlined text-4xl text-purple-600 mb-2",
                            children: "receipt_long",
                          }),
                          c.jsx("span", {
                            className:
                              "text-sm font-semibold text-purple-700 dark:text-purple-400",
                            children: "Upload Store Ticket",
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
              // <-------- seccion 7: modal PS para subir alternativas
              altUploadReviewId &&
              c.jsx("div", {
                className:
                  "fixed inset-0 z-[72] bg-black/60 flex items-end sm:items-center justify-center ui-backdrop",
                children: c.jsxs("div", {
                  className:
                    "bg-surface-light dark:bg-surface-dark w-full sm:max-w-md p-5 rounded-t-3xl sm:rounded-2xl border border-border-light dark:border-border-dark shadow-2xl ui-sheet",
                  children: [
                    c.jsx("h3", {
                      className: "text-base font-bold mb-3",
                      children: "Enviar alternativas",
                    }),
                    c.jsx("input", {
                      type: "file",
                      accept: "image/*",
                      multiple: !0,
                      onChange: (o) =>
                        setAltUploadFiles(Array.from(o.target.files || [])),
                      className:
                        "w-full text-xs mb-3 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border file:border-gray-300",
                    }),
                    c.jsx("textarea", {
                      rows: 3,
                      value: altUploadDescription,
                      onChange: (o) =>
                        setAltUploadDescription(o.target.value),
                      placeholder: "Descripcion de alternativa (opcional)",
                      className:
                        "w-full px-3 py-2 text-xs border rounded-xl dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-primary",
                    }),
                    c.jsxs("p", {
                      className: "text-[10px] text-gray-500 mt-2",
                      children: ["Archivos seleccionados: ", altUploadFiles.length],
                    }),
                    c.jsxs("div", {
                      className: "mt-4 grid grid-cols-2 gap-2",
                      children: [
                        c.jsx("button", {
                          onClick: closeAlternativeUploadModal,
                          className:
                            "py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold",
                          children: "Cancelar",
                        }),
                        c.jsx("button", {
                          onClick: sendReviewAlternatives,
                          disabled: altUploadFiles.length === 0,
                          className: `py-2 rounded-lg text-xs font-semibold ${altUploadFiles.length === 0 ? "bg-gray-300 text-gray-500 cursor-not-allowed" : "bg-primary text-white hover:bg-primary-dark"}`,
                          children: "Enviar",
                        }),
                      ],
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
            className:
              "absolute inset-x-0 bottom-0 z-[60] bg-background-light dark:bg-background-dark flex flex-col animate-in slide-in-from-bottom duration-300 h-[85vh] rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.2)] border-t border-border-light dark:border-border-dark overflow-hidden",
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
                    onClick: () => {
                      (at(!1), we(null), Kt(null));
                    },
                    className:
                      "w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300",
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
                      "mb-4 flex items-center gap-4 bg-purple-50 border border-purple-100 p-3 rounded-xl",
                    children: [
                      va
                        ? c.jsx("img", {
                          src: va,
                          className:
                            "w-12 h-16 object-cover rounded shadow-sm border border-gray-300",
                        })
                        : c.jsx("div", {
                          className:
                            "w-12 h-16 bg-white border border-gray-300 rounded shadow-sm text-gray-300 flex items-center justify-center",
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
                                    "w-12 h-12 rounded object-cover border",
                                })
                                : c.jsx("div", {
                                  className:
                                    "w-12 h-12 bg-white flex items-center justify-center text-gray-400 rounded border",
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
      fullscreenImage &&
      c.jsx("div", {
        className:
          "fixed inset-0 z-[80] bg-black/85 flex items-center justify-center p-4 ui-backdrop",
        onClick: () => setFullscreenImage(null),
        children: c.jsxs("div", {
          className: "relative max-w-[95vw] max-h-[90vh] ui-sheet",
          onClick: (o) => o.stopPropagation(),
          children: [
            c.jsxs("div", {
              className: "absolute -top-11 right-0 flex items-center gap-2",
              children: [
                c.jsx("a", {
                  href: fullscreenImage,
                  target: "_blank",
                  rel: "noreferrer",
                  className:
                    "px-3 py-1.5 rounded-full bg-white text-gray-700 text-xs font-bold border border-gray-200 shadow hover:bg-gray-100",
                  children: "Abrir enlace",
                }),
                c.jsx("button", {
                  onClick: () => setFullscreenImage(null),
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
              src: fullscreenImage,
              className:
                "max-w-[95vw] max-h-[90vh] object-contain rounded-xl bg-black",
              onError: (o) => {
                o.currentTarget.style.display = "none";
              },
            }),
          ],
        }),
      }),
      c.jsx("nav", {
        className:
          "sticky bottom-0 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-lg border-t border-border-light dark:border-border-dark pb-5 pt-2 px-6 z-30",
        children: c.jsxs("div", {
          className: "flex justify-around items-center",
          children: [
            c.jsxs("button", {
              onClick: () => Ll("HOME"),
              className: `flex flex-col items-center gap-1 p-2 transition-colors ${nl === "HOME" ? "text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: [
                c.jsxs("div", {
                  className: "relative",
                  children: [
                    c.jsx("span", {
                      className:
                        "material-symbols-outlined font-variation-settings-fill",
                      children: "dashboard",
                    }),
                    homeNeedsAttention &&
                    c.jsxs("span", {
                      className: "absolute -top-1 -right-1 flex h-3 w-3",
                      children: [
                        c.jsx("span", {
                          className:
                            "animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75",
                        }),
                        c.jsx("span", {
                          className:
                            "relative inline-flex rounded-full h-3 w-3 bg-rose-600 border border-white dark:border-gray-900",
                        }),
                      ],
                    }),
                  ],
                }),
                c.jsx("span", {
                  className: "text-[10px] font-medium",
                  children: "Home",
                }),
              ],
            }),
            c.jsxs("button", {
              onClick: () => Ll("MISSIONS"),
              className: `flex flex-col items-center gap-1 p-2 transition-colors ${nl === "MISSIONS" ? "text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: [
                c.jsxs("div", {
                  className: "relative",
                  children: [
                    c.jsx("span", {
                      className: "material-symbols-outlined",
                      children: "shopping_bag",
                    }),
                    w &&
                    c.jsx("span", {
                      className:
                        "absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border border-white dark:border-gray-900",
                    }),
                  ],
                }),
                c.jsx("span", {
                  className: "text-[10px] font-medium",
                  children: "Missions",
                }),
              ],
            }),
            c.jsxs("button", {
              onClick: () => Ll("CLIENTS"),
              className: `flex flex-col items-center gap-1 p-2 transition-colors ${nl === "CLIENTS" ? "text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: [
                c.jsxs("div", {
                  className: "relative",
                  children: [
                    c.jsx("span", {
                      className: "material-symbols-outlined",
                      children: "group",
                    }),
                    // <-------- seccion 7: badge de alertas de revision
                    missionReviewAlertCount > 0 &&
                    c.jsx("span", {
                      className:
                        "absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-amber-500 text-white text-[9px] leading-[14px] text-center font-bold",
                      children:
                        missionReviewAlertCount > 9
                          ? "9+"
                          : missionReviewAlertCount,
                    }),
                  ],
                }),
                c.jsx("span", {
                  className: "text-[10px] font-medium",
                  children: "Clients",
                }),
              ],
            }),
            c.jsxs("button", {
              onClick: () => Ll("CALCULATOR"),
              className: `flex flex-col items-center gap-1 p-2 transition-colors ${nl === "CALCULATOR" ? "text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: [
                c.jsx("span", {
                  className: "material-symbols-outlined",
                  children: "calculate",
                }),
                c.jsx("span", {
                  className: "text-[10px] font-medium",
                  children: "Calculator",
                }),
              ],
            }),
            c.jsxs("button", {
              onClick: () => Ll("PROFILE"),
              className: `flex flex-col items-center gap-1 p-2 transition-colors ${nl === "PROFILE" ? "text-primary" : "text-text-sub dark:text-slate-400"}`,
              children: [
                c.jsx("span", {
                  className: "material-symbols-outlined",
                  children: "person",
                }),
                c.jsx("span", {
                  className: "text-[10px] font-medium",
                  children: "Profile",
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}

export default nh;
