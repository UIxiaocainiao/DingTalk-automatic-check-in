import { request } from "./request";

export function login(payload) {
  return request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
}

export function fetchHealth() {
  return request("/api/health");
}
