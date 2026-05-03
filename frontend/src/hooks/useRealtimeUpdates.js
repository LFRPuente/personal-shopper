import { V, WS_UPDATES_URL } from "../utils.js";

const REALTIME_HEARTBEAT_MS = 10000;
const REALTIME_CATCHUP_MS = 12000;

function isRealtimeView(view) {
  return (
    view === "HOME" ||
    view === "MISSIONS" ||
    view === "CLIENTS" ||
    view === "SHIPMENTS"
  );
}

function useLatestRef(value) {
  const ref = V.useRef(value);
  V.useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function useRealtimeUpdates({
  accessToken,
  currentView,
  apiFetch,
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
}) {
  const wsRef = V.useRef(null);
  const wsReconnectTimerRef = V.useRef(null);
  const wsHeartbeatTimerRef = V.useRef(null);
  const realtimeCatchupTimerRef = V.useRef(null);
  const realtimeCatchupInFlightRef = V.useRef(!1);
  const wsStoppedRef = V.useRef(!1);
  const coreRefreshTimerRef = V.useRef(null);
  const coreRefreshPendingRef = V.useRef(!1);
  const coreRefreshInFlightRef = V.useRef(!1);
  const selectedClientRefreshTimerRef = V.useRef(null);
  const selectedClientRefreshPendingRef = V.useRef(!1);
  const selectedClientRefreshInFlightRef = V.useRef(!1);

  const apiFetchRef = useLatestRef(apiFetch);
  const currentViewRef = useLatestRef(currentView);
  const refreshCoreDataRef = useLatestRef(refreshCoreData);
  const refreshSelectedClientRef = useLatestRef(refreshSelectedClient);

  const runQueuedCoreRefresh = V.useCallback(async () => {
    if (coreRefreshInFlightRef.current) {
      coreRefreshPendingRef.current = !0;
      return;
    }
    coreRefreshInFlightRef.current = !0;
    try {
      await refreshCoreDataRef.current();
    } finally {
      coreRefreshInFlightRef.current = !1;
      if (coreRefreshPendingRef.current) {
        coreRefreshPendingRef.current = !1;
        queueCoreRefresh(600);
      }
    }
  }, [refreshCoreDataRef]);

  const queueCoreRefresh = V.useCallback(
    (delay = 500) => {
      coreRefreshPendingRef.current = !0;
      coreRefreshTimerRef.current && clearTimeout(coreRefreshTimerRef.current);
      coreRefreshTimerRef.current = setTimeout(() => {
        coreRefreshTimerRef.current = null;
        coreRefreshPendingRef.current = !1;
        runQueuedCoreRefresh().catch((error) => {
          console.error("Failed queued core refresh", error);
        });
      }, delay);
    },
    [runQueuedCoreRefresh],
  );

  const runQueuedSelectedClientRefresh = V.useCallback(async () => {
    if (selectedClientRefreshInFlightRef.current) {
      selectedClientRefreshPendingRef.current = !0;
      return;
    }
    selectedClientRefreshInFlightRef.current = !0;
    try {
      await refreshSelectedClientRef.current();
    } finally {
      selectedClientRefreshInFlightRef.current = !1;
      if (selectedClientRefreshPendingRef.current) {
        selectedClientRefreshPendingRef.current = !1;
        queueSelectedClientRefresh(220);
      }
    }
  }, [refreshSelectedClientRef]);

  const queueSelectedClientRefresh = V.useCallback(
    (delay = 400) => {
      selectedClientRefreshPendingRef.current = !0;
      selectedClientRefreshTimerRef.current &&
        clearTimeout(selectedClientRefreshTimerRef.current);
      selectedClientRefreshTimerRef.current = setTimeout(() => {
        selectedClientRefreshTimerRef.current = null;
        selectedClientRefreshPendingRef.current = !1;
        runQueuedSelectedClientRefresh().catch((error) => {
          console.error("Failed queued selected client refresh", error);
        });
      }, delay);
    },
    [runQueuedSelectedClientRefresh],
  );

  V.useEffect(
    () => () => {
      coreRefreshTimerRef.current && clearTimeout(coreRefreshTimerRef.current);
      selectedClientRefreshTimerRef.current &&
        clearTimeout(selectedClientRefreshTimerRef.current);
    },
    [],
  );

  V.useEffect(() => {
    const closeSocket = () => {
      wsStoppedRef.current = !0;
      wsReconnectTimerRef.current && clearTimeout(wsReconnectTimerRef.current);
      wsReconnectTimerRef.current = null;
      wsHeartbeatTimerRef.current && clearInterval(wsHeartbeatTimerRef.current);
      wsHeartbeatTimerRef.current = null;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };

    if (!accessToken) {
      closeSocket();
      return undefined;
    }
    if (!isRealtimeView(currentView)) {
      closeSocket();
      return undefined;
    }

    wsStoppedRef.current = !1;
    let reconnectAttempt = 0;

    const refreshRequestsForMission = async () => {
      try {
        const requests = await apiFetchRef.current("/requests/");
        setRequests(requests || []);
      } catch (error) {
        console.error("Failed loading shopping requests", error);
      }
    };

    const refreshReviewsForCurrentContext = async () => {
      const clientId = selectedClientIdRef.current;
      const missionId = activeMissionIdRef.current;
      if (clientId) {
        try {
          const reviews = await apiFetchRef.current(`/reviews/?client=${clientId}`);
          setProductReviews(reviews || []);
        } catch (error) {
          console.error("Failed loading product reviews", error);
        }
      }
      if (missionId) {
        try {
          const reviews = await apiFetchRef.current(`/reviews/?shopping=${missionId}`);
          setMissionReviewAlerts(
            (reviews || []).filter(
              (entry) =>
                entry.status === "PENDING" || entry.status === "ALTERNATIVE_SENT",
            ),
          );
        } catch (error) {
          console.error("Failed loading shopping reviews", error);
        }
      } else {
        setMissionReviewAlerts([]);
      }
    };

    const refreshUnreadSummaryForActiveMission = async () => {
      const missionId = activeMissionIdRef.current;
      if (!missionId) {
        setHomeUnreadSummary({});
        return;
      }
      try {
        const summary = await apiFetchRef.current(
          `/reviews/unread-summary/?shopping=${missionId}`,
        );
        setHomeUnreadSummary(summary || {});
      } catch (error) {
        console.error("Failed loading unread review summary", error);
      }
    };

    const refreshUnreadSummaryForOpenShoppings = async () => {
      const openShoppingTabs = openShoppingTabsRef.current || [];
      if (!openShoppingTabs.length) {
        setShoppingUnreadSummaryMap({});
        return;
      }
      try {
        const entries = await Promise.all(
          openShoppingTabs.map(async (mission) => {
            const missionId = Number(mission && mission.id) || 0;
            if (!missionId) return [null, null];
            try {
              const summary = await apiFetchRef.current(
                `/reviews/unread-summary/?shopping=${missionId}`,
              );
              return [String(missionId), summary || {}];
            } catch (error) {
              console.error(
                "Failed refreshing unread summary for shopping",
                missionId,
                error,
              );
              return [String(missionId), {}];
            }
          }),
        );
        setShoppingUnreadSummaryMap(
          entries.reduce((acc, entry) => {
            const [key, value] = entry || [];
            if (!key) return acc;
            acc[key] = value || {};
            return acc;
          }, {}),
        );
      } catch (error) {
        console.error("Failed refreshing unread summaries for open shoppings", error);
      }
    };

    const connect = () => {
      if (wsStoppedRef.current) return;
      const socket = new WebSocket(
        `${WS_UPDATES_URL}?token=${encodeURIComponent(accessToken)}`,
      );
      wsRef.current = socket;
      socket.onopen = () => {
        const shouldCatchUp = reconnectAttempt > 0;
        reconnectAttempt = 0;
        wsHeartbeatTimerRef.current && clearInterval(wsHeartbeatTimerRef.current);
        wsHeartbeatTimerRef.current = setInterval(() => {
          if (socket.readyState !== WebSocket.OPEN) return;
          try {
            socket.send(JSON.stringify({ type: "ping" }));
          } catch {}
        }, REALTIME_HEARTBEAT_MS);
        if (shouldCatchUp && isRealtimeView(currentViewRef.current)) {
          queueCoreRefresh(0);
          queueSelectedClientRefresh(120);
        }
      };
      socket.onmessage = async (event) => {
        try {
          const message = JSON.parse(event.data || "{}");
          const model = message.model;
          const action = String(message.action || "changed").toLowerCase();
          const view = currentViewRef.current;
          const markHomeNeedsAttention = () => {
            if (currentViewRef.current !== "HOME") setHomeNeedsAttention(!0);
          };
          if (!isRealtimeView(view)) return;
          if (
            (model === "clients" || model === "requests" || model === "reviews") &&
            action === "created"
          ) {
            markHomeNeedsAttention();
          }
          if (model === "clients" || model === "shoppings" || model === "missions") {
            if (
              view === "HOME" ||
              view === "MISSIONS" ||
              view === "CLIENTS" ||
              view === "SHIPMENTS"
            ) {
              queueCoreRefresh();
              queueSelectedClientRefresh();
            }
            return;
          }
          if (model === "shipments") {
            if (view === "SHIPMENTS") queueCoreRefresh();
            return;
          }
          if (model === "products" || model === "receipts") {
            if (
              view === "HOME" ||
              view === "MISSIONS" ||
              view === "CLIENTS" ||
              view === "SHIPMENTS"
            ) {
              queueCoreRefresh();
              queueSelectedClientRefresh();
              refreshReviewsForCurrentContext().catch((error) => {
                console.error("Failed refreshing reviews after product update", error);
              });
            }
            refreshUnreadSummaryForActiveMission().catch((error) => {
              console.error("Failed refreshing unread summary", error);
            });
            refreshUnreadSummaryForOpenShoppings().catch((error) => {
              console.error(
                "Failed refreshing unread summaries for open shoppings",
                error,
              );
            });
            return;
          }
          if (model === "requests") {
            if (view === "HOME" || view === "MISSIONS") {
              await refreshRequestsForMission();
            }
            return;
          }
          if (model === "reviews") {
            if (
              view === "HOME" ||
              view === "MISSIONS" ||
              view === "CLIENTS" ||
              view === "SHIPMENTS"
            ) {
              queueCoreRefresh();
              queueSelectedClientRefresh();
            }
            if (view === "HOME" || view === "MISSIONS" || view === "CLIENTS") {
              refreshReviewsForCurrentContext().catch((error) => {
                console.error("Failed refreshing reviews", error);
              });
            }
            refreshUnreadSummaryForActiveMission().catch((error) => {
              console.error("Failed refreshing unread summary", error);
            });
            refreshUnreadSummaryForOpenShoppings().catch((error) => {
              console.error(
                "Failed refreshing unread summaries for open shoppings",
                error,
              );
            });
            return;
          }
          if (model === "stores") {
            if (view === "HOME" || view === "MISSIONS") {
              const [stores, recommendations] = await Promise.all([
                apiFetchRef.current("/stores/"),
                apiFetchRef.current("/store-recommendations/"),
              ]);
              setStores(stores || []);
              setStoreRecommendations(recommendations || []);
            }
          }
        } catch (error) {
          console.error("Failed processing websocket message", error);
        }
      };
      socket.onerror = () => {
        try {
          socket.close();
        } catch {}
      };
      socket.onclose = () => {
        wsHeartbeatTimerRef.current && clearInterval(wsHeartbeatTimerRef.current);
        wsHeartbeatTimerRef.current = null;
        if (wsStoppedRef.current) return;
        reconnectAttempt += 1;
        const delay = Math.min(5000, 1000 * reconnectAttempt);
        wsReconnectTimerRef.current = setTimeout(connect, delay);
      };
    };

    connect();
    return closeSocket;
  }, [
    accessToken,
    currentView,
    apiFetchRef,
    currentViewRef,
    queueCoreRefresh,
    queueSelectedClientRefresh,
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
  ]);

  V.useEffect(() => {
    if (!accessToken || !isRealtimeView(currentView)) {
      realtimeCatchupTimerRef.current && clearInterval(realtimeCatchupTimerRef.current);
      realtimeCatchupTimerRef.current = null;
      return undefined;
    }
    realtimeCatchupTimerRef.current && clearInterval(realtimeCatchupTimerRef.current);
    realtimeCatchupTimerRef.current = setInterval(async () => {
      if (!isRealtimeView(currentViewRef.current)) return;
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      if (realtimeCatchupInFlightRef.current) return;
      realtimeCatchupInFlightRef.current = !0;
      try {
        queueCoreRefresh(0);
        const missionId = Number(activeMissionIdRef.current || 0);
        if (missionId > 0) {
          const [summary, reviews] = await Promise.all([
            apiFetchRef.current(`/reviews/unread-summary/?shopping=${missionId}`),
            apiFetchRef.current(`/reviews/?shopping=${missionId}`),
          ]);
          setHomeUnreadSummary(summary || {});
          setMissionReviewAlerts(
            (reviews || []).filter(
              (entry) =>
                entry.status === "PENDING" || entry.status === "ALTERNATIVE_SENT",
            ),
          );
        } else {
          setHomeUnreadSummary({});
          setMissionReviewAlerts([]);
        }
        const openShoppingTabs = openShoppingTabsRef.current || [];
        if (openShoppingTabs.length) {
          const entries = await Promise.all(
            openShoppingTabs.map(async (mission) => {
              const tabMissionId = Number(mission && mission.id) || 0;
              if (!tabMissionId) return [null, null];
              try {
                const summary = await apiFetchRef.current(
                  `/reviews/unread-summary/?shopping=${tabMissionId}`,
                );
                return [String(tabMissionId), summary || {}];
              } catch {
                return [String(tabMissionId), {}];
              }
            }),
          );
          setShoppingUnreadSummaryMap(
            entries.reduce((acc, entry) => {
              const [key, value] = entry || [];
              if (key) acc[key] = value || {};
              return acc;
            }, {}),
          );
        } else {
          setShoppingUnreadSummaryMap({});
        }
      } catch (error) {
        console.error("Failed realtime catchup refresh", error);
      } finally {
        realtimeCatchupInFlightRef.current = !1;
      }
    }, REALTIME_CATCHUP_MS);
    return () => {
      realtimeCatchupTimerRef.current && clearInterval(realtimeCatchupTimerRef.current);
      realtimeCatchupTimerRef.current = null;
    };
  }, [
    accessToken,
    currentView,
    activeMissionIdRef,
    apiFetchRef,
    currentViewRef,
    openShoppingTabsRef,
    queueCoreRefresh,
    setHomeUnreadSummary,
    setMissionReviewAlerts,
    setShoppingUnreadSummaryMap,
  ]);

  return {
    queueCoreRefresh,
    queueSelectedClientRefresh,
  };
}
