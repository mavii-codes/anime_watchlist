// ── API base URL ──────────────────────────────────────────────
// Adjust this if your backend runs on a different port/host,
// or set VITE_API_BASE in the client environment.
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

// ── Shared request helper (JWT attached automatically) ────────
async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('nightwave-token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({ success: false, message: 'Server returned an unexpected response.' }));
  if (!res.ok) throw Object.assign(new Error(data.message || 'Request failed'), { status: res.status });
  return data;
}

export { API_BASE, apiRequest };
