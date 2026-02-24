// api/client.ts
const API_BASE_URL = 'http:192.168.7.246:3000' // or ngrok / local tunnel

export type ApiError = {
  message: string;
  status?: number;
};

export default async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const text = await res.text();
    throw {
      message: text || 'API request failed!!!',
      status: res.status,
    } as ApiError;
  }

  return res.json() as Promise<T>;
}
