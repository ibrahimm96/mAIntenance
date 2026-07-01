const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export function getToken() {
  return localStorage.getItem('maintenance_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('maintenance_token', token);
  else localStorage.removeItem('maintenance_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}
