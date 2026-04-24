import axios from "axios";
import {
  REQUEST_TIMEOUT_MS,
  getApiBaseUrl,
  getNextBackendBase,
  setActiveBackendByBase,
  shouldFailoverStatus,
} from "./backend";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("nxr_token");
  config.baseURL ||= getApiBaseUrl();
  config.timeout ||= REQUEST_TIMEOUT_MS;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (res) => {
    if (res.config?.baseURL) {
      setActiveBackendByBase("api", res.config.baseURL);
    }

    return res;
  },
  async (err) => {
    const originalRequest = err.config;
    const networkFailure = !err.response && err.code !== "ERR_CANCELED";
    const backendFailure = shouldFailoverStatus(err.response?.status);

    if (
      originalRequest &&
      !originalRequest.__nxrFailoverRetry &&
      (networkFailure || backendFailure)
    ) {
      const currentBase = originalRequest.baseURL || getApiBaseUrl();
      const nextBase = getNextBackendBase("api", currentBase);

      if (nextBase) {
        originalRequest.__nxrFailoverRetry = true;
        originalRequest.baseURL = nextBase;
        originalRequest.timeout = REQUEST_TIMEOUT_MS;
        setActiveBackendByBase("api", nextBase);
        return api(originalRequest);
      }
    }

    if (err.response?.status === 401) {
      localStorage.removeItem("nxr_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
