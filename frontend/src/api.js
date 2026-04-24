// Check if Vite is running a production build (automatically set to true during 'npm run build')
const isProduction = import.meta.env.PROD;

// Use an empty string (relative path) for Snowflake, and localhost for local development
const API_BASE = isProduction ? "" : "http://localhost:8000";

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
  if (res.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('isAuthenticated');
    window.location.href = '/login';
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}