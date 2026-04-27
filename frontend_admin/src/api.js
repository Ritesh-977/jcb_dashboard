const API_BASE = import.meta.env.PROD ? import.meta.env.VITE_API_URL : 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('access_token');
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401 && !path.includes('login')) {
    localStorage.removeItem('access_token');
    window.location.href = '/login';
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}
