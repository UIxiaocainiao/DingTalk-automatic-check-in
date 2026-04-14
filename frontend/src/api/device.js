import { request } from "./request";

export function fetchDevices() {
  return request("/api/devices");
}

export function fetchDashboard() {
  return request("/api/dashboard");
}

export function fetchDashboardStatus() {
  return fetchDashboard();
}
