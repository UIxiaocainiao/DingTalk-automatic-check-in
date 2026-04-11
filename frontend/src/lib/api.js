async function readErrorMessage(response) {
  try {
    const payload = await response.json();
    if (payload?.message) return payload.message;
  } catch {}
  return `请求失败 (${response.status})`;
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json();
}

export function fetchDashboard() {
  return request("/api/dashboard");
}

export function saveConfig(payload) {
  return request("/api/config", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function rerollSchedule() {
  return request("/api/actions/reroll", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function runDoctor() {
  return request("/api/actions/doctor", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function runOnce() {
  return request("/api/actions/run-once", {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function startScheduler(mode) {
  return request("/api/actions/start", {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export function stopScheduler() {
  return request("/api/actions/stop", {
    method: "POST",
    body: JSON.stringify({}),
  });
}
