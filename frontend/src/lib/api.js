const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const MIN_AGE_YEARS = 21;

export function getToken() {
  return localStorage.getItem('access_token');
}

export function setToken(token) {
  if (token) localStorage.setItem('access_token', token);
  else localStorage.removeItem('access_token');
}

function formatError(detail) {
  if (!detail) return 'Request failed';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg || JSON.stringify(d)).join(', ');
  }
  return String(detail);
}

export async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(formatError(body.detail));
  }
  if (res.status === 204) return null;
  return res.json();
}

export function formatPrice(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`;
}

export function discountPercent(price, mrp) {
  const p = Number(price);
  const m = Number(mrp);
  if (!m || m <= p) return 0;
  return Math.round(((m - p) / m) * 100);
}

export function stockBadge(stock, reorder = 10) {
  if (stock <= 0) return { label: 'Out of stock', tone: 'red' };
  if (stock <= reorder) return { label: `Only ${stock} left`, tone: 'amber' };
  return null;
}

export function ageFromDob(dobStr) {
  const [y, m, d] = dobStr.split('-').map(Number);
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age -= 1;
  return age;
}

export function isOldEnough(dobStr) {
  if (!dobStr) return false;
  return ageFromDob(dobStr) >= MIN_AGE_YEARS;
}
