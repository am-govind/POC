const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function getToken() {
  return localStorage.getItem('access_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Request failed');
  }
  if (res.status === 204) return null;
  return res.json();
}

export function formatPrice(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export const CATEGORY_MODEL = {
  whisky: 'spirits-amber',
  wine: 'wine',
  beer: 'beer',
  gin: 'spirits-clear',
  vodka: 'spirits-clear',
  rum: 'spirits-amber',
  tequila: 'tequila',
  liqueurs: 'liqueur',
};

export function stockBadge(stock, reorder = 10) {
  if (stock <= 0) return { label: 'Out of stock', tone: 'red' };
  if (stock <= reorder) return { label: `Only ${stock} left`, tone: 'amber' };
  return null;
}
