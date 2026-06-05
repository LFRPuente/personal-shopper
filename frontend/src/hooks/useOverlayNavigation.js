import { V } from "../utils.js";

export function useOverlayNavigation({
  overlays = [],
  closeActiveOverlay,
  animationMs = 170,
  clientHomeKey = "client-home",
}) {
  const [closingOverlayKey, setClosingOverlayKey] = V.useState("");
  const overlayHistorySkipRef = V.useRef(!1);
  const closingOverlayKeyRef = V.useRef("");
  const overlayDismissTimerRef = V.useRef(null);
  const activeOverlayKeyRef = V.useRef("");
  const dismissActiveOverlayRef = V.useRef(() => {});

  const activeOverlayKey = overlays.find((entry) => !!entry.open)?.key || "";

  V.useEffect(() => {
    closingOverlayKeyRef.current = closingOverlayKey;
  }, [closingOverlayKey]);

  V.useEffect(() => {
    activeOverlayKeyRef.current = activeOverlayKey;
    dismissActiveOverlayRef.current = (fromHistory = !1, immediate = !1) => {
      const key = activeOverlayKeyRef.current;
      if (!key) return;
      const closeNow = () => {
        setClosingOverlayKey("");
        closeActiveOverlay();
      };

      if (key === clientHomeKey) {
        if (immediate) {
          overlayDismissTimerRef.current &&
            clearTimeout(overlayDismissTimerRef.current);
          overlayDismissTimerRef.current = null;
          closeNow();
          return;
        }
        if (closingOverlayKeyRef.current === key) return;
        setClosingOverlayKey(key);
        overlayDismissTimerRef.current &&
          clearTimeout(overlayDismissTimerRef.current);
        overlayDismissTimerRef.current = setTimeout(() => {
          overlayDismissTimerRef.current = null;
          closeNow();
        }, animationMs);
        return;
      }

      if (
        !fromHistory &&
        typeof window !== "undefined" &&
        window.history.state &&
        window.history.state.__ps_overlay
      ) {
        overlayHistorySkipRef.current = !0;
        window.history.back();
      }
      if (immediate) {
        overlayDismissTimerRef.current &&
          clearTimeout(overlayDismissTimerRef.current);
        overlayDismissTimerRef.current = null;
        closeNow();
        return;
      }
      if (closingOverlayKeyRef.current === key) return;
      setClosingOverlayKey(key);
      overlayDismissTimerRef.current &&
        clearTimeout(overlayDismissTimerRef.current);
      overlayDismissTimerRef.current = setTimeout(() => {
        overlayDismissTimerRef.current = null;
        closeNow();
      }, animationMs);
    };
  }, [activeOverlayKey, animationMs, clientHomeKey, closeActiveOverlay]);

  V.useEffect(() => {
    if (
      !activeOverlayKey ||
      activeOverlayKey === clientHomeKey ||
      typeof window === "undefined"
    )
      return;
    const state = window.history.state || {};
    if (state.__ps_overlay !== activeOverlayKey) {
      window.history.pushState({ ...state, __ps_overlay: activeOverlayKey }, "");
    }
  }, [activeOverlayKey, clientHomeKey]);

  V.useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handlePopState = () => {
      if (overlayHistorySkipRef.current) {
        overlayHistorySkipRef.current = !1;
        return;
      }
      activeOverlayKeyRef.current && dismissActiveOverlayRef.current(!0);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  V.useEffect(() => {
    const handleKeyDown = (event) => {
      const key = String(event.key || "");
      if (key !== "Escape" && key !== "Esc" && event.keyCode !== 27) return;
      if (!activeOverlayKeyRef.current) return;
      event.preventDefault();
      event.stopPropagation();
      dismissActiveOverlayRef.current(!0);
    };
    document.addEventListener("keydown", handleKeyDown, !0);
    return () => document.removeEventListener("keydown", handleKeyDown, !0);
  }, []);

  V.useEffect(
    () => () => {
      overlayDismissTimerRef.current &&
        clearTimeout(overlayDismissTimerRef.current);
    },
    [],
  );

  const overlayBackdropClass = V.useCallback(
    (baseClass, key) =>
      `${baseClass}${closingOverlayKey === key ? " ui-backdrop-out" : ""}`,
    [closingOverlayKey],
  );

  const overlaySheetClass = V.useCallback(
    (baseClass, key) =>
      `${baseClass}${closingOverlayKey === key ? " ui-sheet-out" : ""}`,
    [closingOverlayKey],
  );

  return {
    activeOverlayKey,
    activeOverlayKeyRef,
    closingOverlayKey,
    setClosingOverlayKey,
    dismissActiveOverlayRef,
    overlayBackdropClass,
    overlaySheetClass,
  };
}
