const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function apiFetch<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  symptoms: {
    report: (data: object, token: string) => apiFetch("/symptoms/report", { method: "POST", body: JSON.stringify(data) }, token),
    trends: (city: string, token: string) => apiFetch(`/symptoms/trends?city=${city}`, {}, token),
  },
  dashboard: {
    heatmap: (city: string) => apiFetch(`/dashboard/city-heatmap?city=${city}`),
    stats: (city: string) => apiFetch(`/dashboard/city-stats?city=${city}`),
  },
  predictions: {
    city: (city: string, token: string) => apiFetch(`/predictions/city?city=${city}`, {}, token),
    sector: (sector: string, token: string) => apiFetch(`/predictions/sector/${encodeURIComponent(sector)}`, {}, token),
  },
  alerts: {
    active: (city: string) => apiFetch(`/alerts/active?city=${city}`),
  },
  pharmacy: {
    submit: (data: object, token: string) => apiFetch("/pharmacy/sales", { method: "POST", body: JSON.stringify(data) }, token),
    spikes: (city: string) => apiFetch(`/pharmacy/spikes?city=${city}`),
  },
  hospitals: {
    submitStats: (data: object, token: string) => apiFetch("/hospitals/stats", { method: "POST", body: JSON.stringify(data) }, token),
  },
  agents: {
    status: () => apiFetch("/agents/status"),
  },
};
