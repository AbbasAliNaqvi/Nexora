const DEFAULT_PRIMARY_BACKEND = "https://nexora-production-5cac.up.railway.app";
const DEFAULT_FALLBACK_BACKEND = "https://nexora-vmyq.onrender.com";
const ACTIVE_BACKEND_STORAGE_KEY = "nxr_active_backend";

export const REQUEST_TIMEOUT_MS = Number(
  import.meta.env.VITE_BACKEND_TIMEOUT_MS || 10000,
);

function trimTrailingSlash(value) {
  return value.replace(/\/+$/, "");
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(value);
}

function normalizeServiceBase(rawValue, service) {
  if (!rawValue) return null;

  const trimmed = trimTrailingSlash(String(rawValue).trim());
  if (!trimmed) return null;

  const defaultPath = `/${service}`;

  if (isHttpUrl(trimmed)) {
    const url = new URL(trimmed);
    const pathname = trimTrailingSlash(url.pathname || "");

    if (!pathname || pathname === "/") {
      return `${url.origin}${defaultPath}`;
    }

    if (pathname === "/api" || pathname === "/gateway") {
      return `${url.origin}${defaultPath}`;
    }

    return `${url.origin}${pathname}`;
  }

  if (!trimmed.startsWith("/")) {
    return `/${trimmed}`;
  }

  if (trimmed === "/api" || trimmed === "/gateway") {
    return defaultPath;
  }

  return trimmed;
}

function createBackend({ id, label, base, api, gateway }) {
  const apiBase = normalizeServiceBase(api ?? base, "api");
  const gatewayBase = normalizeServiceBase(gateway ?? base ?? api, "gateway");
  const key = apiBase || gatewayBase;

  if (!key) return null;

  return {
    id,
    key,
    label,
    apiBase,
    gatewayBase,
  };
}

const primaryBase =
  import.meta.env.VITE_PRIMARY_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_GATEWAY_URL ||
  DEFAULT_PRIMARY_BACKEND;

const fallbackBase =
  import.meta.env.VITE_FALLBACK_BACKEND_URL ||
  import.meta.env.VITE_FALLBACK_API_URL ||
  import.meta.env.VITE_FALLBACK_GATEWAY_URL ||
  DEFAULT_FALLBACK_BACKEND;

const BACKENDS = [
  createBackend({
    id: "railway",
    label: "Railway",
    base: primaryBase,
    api: import.meta.env.VITE_API_URL,
    gateway: import.meta.env.VITE_GATEWAY_URL,
  }),
  createBackend({
    id: "render",
    label: "Render",
    base: fallbackBase,
    api: import.meta.env.VITE_FALLBACK_API_URL,
    gateway: import.meta.env.VITE_FALLBACK_GATEWAY_URL,
  }),
].filter(
  (backend, index, list) =>
    backend && list.findIndex((entry) => entry?.key === backend.key) === index,
);

function readStoredBackendKey() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem(ACTIVE_BACKEND_STORAGE_KEY);
  } catch {
    return null;
  }
}

let activeBackendKey = readStoredBackendKey();

function persistActiveBackend(backend) {
  if (!backend) return;

  activeBackendKey = backend.key;

  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(ACTIVE_BACKEND_STORAGE_KEY, backend.key);
  } catch {
    // Ignore storage failures and keep the in-memory state.
  }
}

function getBaseKey(service) {
  return service === "gateway" ? "gatewayBase" : "apiBase";
}

function getOrderedBackends(service) {
  const baseKey = getBaseKey(service);
  const available = BACKENDS.filter((backend) => backend[baseKey]);
  const active = available.find((backend) => backend.key === activeBackendKey);

  if (!active) return available;

  return [active, ...available.filter((backend) => backend.key !== active.key)];
}

function buildRequestUrl(base, path = "") {
  const normalizedBase = trimTrailingSlash(base);

  if (!path) return normalizedBase;

  return path.startsWith("/")
    ? `${normalizedBase}${path}`
    : `${normalizedBase}/${path}`;
}

function findBackendByBase(service, base) {
  if (!base) return null;

  const normalizedBase = trimTrailingSlash(base);
  const baseKey = getBaseKey(service);

  return BACKENDS.find((backend) => backend[baseKey] === normalizedBase) || null;
}

function createRequestSignal(externalSignal) {
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = globalThis.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const abortFromExternal = () => controller.abort();

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternal();
    } else {
      externalSignal.addEventListener("abort", abortFromExternal, {
        once: true,
      });
    }
  }

  return {
    signal: controller.signal,
    didTimeout: () => timedOut,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);

      if (externalSignal) {
        externalSignal.removeEventListener("abort", abortFromExternal);
      }
    },
  };
}

function shouldRetryFetchError(error) {
  if (!error) return false;

  if (error.__nxrTimedOut) return true;
  if (error.name === "AbortError" || error.name === "TimeoutError") return true;
  if (error instanceof TypeError) return true;

  return /network|fetch|load failed|timed out/i.test(error.message || "");
}

export function shouldFailoverStatus(status) {
  return [502, 503, 504].includes(status);
}

export function getApiBaseUrl() {
  return getOrderedBackends("api")[0]?.apiBase || "/api";
}

export function getGatewayBaseUrl() {
  return getOrderedBackends("gateway")[0]?.gatewayBase || "/gateway";
}

export function getNextBackendBase(service, currentBase) {
  const baseKey = getBaseKey(service);
  const normalizedCurrentBase = currentBase ? trimTrailingSlash(currentBase) : "";

  return (
    getOrderedBackends(service).find(
      (backend) => backend[baseKey] !== normalizedCurrentBase,
    )?.[baseKey] || null
  );
}

export function setActiveBackendByBase(service, base) {
  const backend = findBackendByBase(service, base);
  if (backend) persistActiveBackend(backend);
}

export async function fetchGateway(path, init = {}) {
  const backends = getOrderedBackends("gateway");

  if (backends.length === 0) {
    return fetch(buildRequestUrl("/gateway", path), init);
  }

  let lastResponse = null;
  let lastError = null;

  for (let index = 0; index < backends.length; index += 1) {
    const backend = backends[index];
    const { signal, didTimeout, cleanup } = createRequestSignal(init.signal);

    try {
      const response = await fetch(buildRequestUrl(backend.gatewayBase, path), {
        ...init,
        signal,
      });

      if (shouldFailoverStatus(response.status) && index < backends.length - 1) {
        lastResponse = response;
        continue;
      }

      persistActiveBackend(backend);
      return response;
    } catch (error) {
      if (didTimeout()) {
        error.__nxrTimedOut = true;
      }

      lastError = error;

      if (
        init.signal?.aborted ||
        !shouldRetryFetchError(error) ||
        index === backends.length - 1
      ) {
        throw error;
      }
    } finally {
      cleanup();
    }
  }

  return lastResponse || Promise.reject(lastError || new Error("Gateway request failed."));
}
