import { V, Zs } from "../utils.js";

export function stripHtmlText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getReadableServerMessage(
  value,
  fallback = "No se pudo completar la solicitud.",
) {
  const raw = String(value || "").trim();
  if (!raw) return fallback;
  if (/<!doctype html/i.test(raw) || /<html[\s>]/i.test(raw)) {
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = stripHtmlText(titleMatch ? titleMatch[1] : "");
    if (/bad gateway|502/i.test(title) || /bad gateway|502/i.test(raw)) {
      return "El servidor respondio 502 Bad Gateway. Revisa que la URL de WAHA este activa y que no sea la URL de PS.";
    }
    return title
      ? `El servidor regreso HTML en lugar de JSON: ${title}`
      : "El servidor regreso una pagina HTML en lugar de JSON.";
  }
  return raw.length > 400 ? `${raw.slice(0, 400).trim()}...` : raw;
}

export function getApiErrorMessage(
  error,
  fallback = "No se pudo completar la solicitud.",
) {
  const payload = error && error.payload;
  return getReadableServerMessage(
    (payload && (payload.error || payload.detail || payload.message)) ||
      (error && error.message),
    fallback,
  );
}

async function parseApiResponse(response) {
  if (response.status === 204) return null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  const text = await response.text();
  return text ? { detail: getReadableServerMessage(text) } : null;
}

function createApiError(response, payload) {
  const error = new Error(
    (payload && (payload.detail || payload.message)) || `HTTP ${response.status}`,
  );
  error.status = response.status;
  error.payload = payload;
  return error;
}

export function useApiClient(accessToken, handleUnauthorized) {
  const apiFetch = V.useCallback(
    async (path, options = {}) => {
      const headers = { "Content-Type": "application/json" };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
      if (options.body instanceof FormData) delete headers["Content-Type"];
      const response = await fetch(`${Zs}${path}`, { ...options, headers });
      const payload = await parseApiResponse(response);
      if (response.status === 401) {
        handleUnauthorized();
        throw new Error((payload && (payload.detail || payload.message)) || "Unauthorized");
      }
      if (!response.ok) throw createApiError(response, payload);
      return payload;
    },
    [accessToken, handleUnauthorized],
  );

  const publicApiFetch = V.useCallback(async (path, options = {}) => {
    const headers = { "Content-Type": "application/json" };
    if (options.body instanceof FormData) delete headers["Content-Type"];
    const response = await fetch(`${Zs}${path}`, { ...options, headers });
    const payload = await parseApiResponse(response);
    if (!response.ok) throw createApiError(response, payload);
    return payload;
  }, []);

  return { apiFetch, publicApiFetch };
}
