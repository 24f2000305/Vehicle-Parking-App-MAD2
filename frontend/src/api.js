const DEFAULT_HEADERS = {
  Accept: "application/json",
};

async function apiFetch(url, options = {}) {
  const { json, ...rest } = options;
  const config = {
    method: rest.method ?? "GET",
    credentials: "include",
    headers: { ...DEFAULT_HEADERS, ...(rest.headers || {}) },
  };
  if (json !== undefined) {
    config.body = JSON.stringify(json);
    config.headers["Content-Type"] = "application/json";
  } else if (rest.body !== undefined) {
    config.body = rest.body;
  }

  const response = await fetch(url, config);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

export const api = {
  auth: {
    profile: () => apiFetch("/api/auth/profile"),
    login: (payload) => apiFetch("/api/auth/login", { method: "POST", json: payload }),
    register: (payload) => apiFetch("/api/auth/register", { method: "POST", json: payload }),
    logout: () => apiFetch("/api/auth/logout", { method: "POST" }),
  },
  admin: {
    listLots: () => apiFetch("/api/admin/lots"),
    createLot: (payload) => apiFetch("/api/admin/lots", { method: "POST", json: payload }),
    updateLot: (lotId, payload) =>
      apiFetch(`/api/admin/lots/${lotId}`, { method: "PATCH", json: payload }),
    deleteLot: (lotId) => apiFetch(`/api/admin/lots/${lotId}`, { method: "DELETE" }),
    listUsers: () => apiFetch("/api/admin/users"),
    listReservations: () => apiFetch("/api/admin/reservations"),
    dashboard: () => apiFetch("/api/admin/dashboard"),
  },
  user: {
    listLots: () => apiFetch("/api/user/lots"),
    listReservations: () => apiFetch("/api/user/reservations"),
    createReservation: (payload) =>
      apiFetch("/api/user/reservations", { method: "POST", json: payload }),
    releaseReservation: (reservationId) =>
      apiFetch(`/api/user/reservations/${reservationId}/release`, { method: "POST" }),
    requestExport: () => apiFetch("/api/user/exports", { method: "POST" }),
    listExports: () => apiFetch("/api/user/exports"),
  },
};
