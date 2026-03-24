const BASE_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchAPI<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const apiService = {
  submitSymptomReport: (data: {
    symptoms: string[]; severity: number; duration_days: number;
    city_sector: string; city: string;
  }, token: string) => fetchAPI("/symptoms/report", { method: "POST", body: JSON.stringify(data) }, token),

  getActiveAlerts: (city = "Gurugram") => fetchAPI(`/alerts/active?city=${city}`),
  getCityHeatmap:  (city = "Gurugram") => fetchAPI(`/dashboard/city-heatmap?city=${city}`),
  getAgentStatus:  () => fetchAPI("/agents/status"),
  submitPrescription: async (imageUri: string, sector: string, city: string, token: string) => {
    const form = new FormData();
    form.append("city_sector", sector);
    form.append("city", city);
    form.append("image", { uri: imageUri, name: "prescription.jpg", type: "image/jpeg" } as any);
    return fetchAPI("/prescriptions/upload", { method: "POST", body: form, headers: { Authorization: `Bearer ${token}` } });
  },
};
