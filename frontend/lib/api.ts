const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  city_sector: string;
  city: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface PredictionResponse {
  id: string;
  city_sector: string;
  disease: string;
  probability: number;
  days_until_peak?: number;
}

export interface HeatmapResponse {
  city: string;
  sectors: Array<{
    sector: string;
    risk_score: number;
    top_disease?: string;
    report_count_7d: number;
    trend: string;
  }>;
}

export interface AlertResponse {
  id: string;
  city_sector: string;
  disease: string;
  probability: number;
  sent_at: string;
  days_until_peak?: number;
  message?: string;
  alert_type?: string;
  severity?: 'low' | 'medium' | 'high';
}

export async function apiFetch<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const authToken = token || (typeof window !== "undefined" ? localStorage.getItem("fahin_token") : null);
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(authToken && { Authorization: `Bearer ${authToken}` }),
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
  auth: {
    login: (data: any) => apiFetch<AuthResponse>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
    register: (data: any) => apiFetch<AuthResponse>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
    me: (token?: string) => apiFetch<UserResponse>("/auth/me", {}, token),
  },
  symptoms: {
    report: (data: object, token?: string) => apiFetch<any>("/symptoms/report", { method: "POST", body: JSON.stringify(data) }, token),
    trends: (city: string, token?: string) => apiFetch<any>(`/symptoms/trends?city=${city}`, {}, token),
  },
  dashboard: {
    heatmap: (city: string) => apiFetch<HeatmapResponse>(`/dashboard/city-heatmap?city=${city}`),
    stats: (city: string) => apiFetch<any>(`/dashboard/city-stats?city=${city}`),
  },
  predictions: {
    city: (city: string, token?: string) => apiFetch<PredictionResponse[]>(`/predictions/city?city=${city}`, {}, token),
    sector: (sector: string, token?: string) => apiFetch<PredictionResponse>(`/predictions/sector/${encodeURIComponent(sector)}`, {}, token),
  },
  alerts: {
    active: (city: string) => apiFetch<AlertResponse[]>(`/alerts/active?city=${city}`),
  },
  pharmacy: {
    submit: (data: object, token?: string) => apiFetch<any>("/pharmacy/sales", { method: "POST", body: JSON.stringify(data) }, token),
    spikes: (city: string) => apiFetch<any[]>(`/pharmacy/spikes?city=${city}`),
  },
  hospitals: {
    submitStats: (data: object, token?: string) => apiFetch<any>("/hospitals/stats", { method: "POST", body: JSON.stringify(data) }, token),
  },
  agents: {
    status: () => apiFetch<any>("/agents/status"),
  },
  knowledge: {
    upload: (data: object, token?: string) => apiFetch<any>("/knowledge/", { method: "POST", body: JSON.stringify(data) }, token),
    list: (token?: string) => apiFetch<any[]>("/knowledge/", {}, token),
  },
};
