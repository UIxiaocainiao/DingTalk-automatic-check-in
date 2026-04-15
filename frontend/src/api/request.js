const PRODUCTION_API_BASE_URL = "https://dingtalk-api-production.up.railway.app";
const PRODUCTION_FRONTEND_HOSTS = new Set([
  "www.dingtalk.pengshz.cn",
  "dingtalk-web-production.up.railway.app",
]);

function normalizeBaseUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const configuredBaseUrl = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL);
  if (configuredBaseUrl) return configuredBaseUrl;

  if (typeof window !== "undefined" && PRODUCTION_FRONTEND_HOSTS.has(window.location.hostname)) {
    return PRODUCTION_API_BASE_URL;
  }

  return "";
}

const API_BASE_URL = resolveApiBaseUrl();

function withBase(path) {
  if (!API_BASE_URL) return path;
  return `${API_BASE_URL}${path}`;
}

export async function request(path, options = {}) {
  const response = await fetch(withBase(path), {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }
  return data;
}
