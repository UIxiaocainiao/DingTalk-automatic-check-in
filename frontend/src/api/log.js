import { request } from "./request";

export function fetchLogs() {
  return request("/api/logs");
}

export function fetchCheckinRecords(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/checkin-records${query ? `?${query}` : ""}`);
}

export function addCheckinRecord(record) {
  return request("/api/checkin-records", {
    method: "POST",
    body: JSON.stringify(record),
  });
}

export function deleteCheckinRecord(index) {
  return request("/api/checkin-records/delete", {
    method: "POST",
    body: JSON.stringify({ index }),
  });
}
