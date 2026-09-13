import { useEffect, useState } from 'react';
import { api, formatPrice } from '../../lib/api';

const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [orders, setOrders] = useState([]);

  const load = () => api('/api/orders').then(setOrders).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await api(`/api/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Address</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                <td className="p-3">{o.customer_email || '—'}</td>
                <td className="p-3 max-w-xs truncate text-slate-500">{o.delivery_address}</td>
                <td className="p-3 font-medium">{formatPrice(o.total_amount)}</td>
                <td className="p-3">
                  <select
                    className="admin-input py-1 text-xs capitalize"
                    value={o.status}
                    onChange={(e) => updateStatus(o.id, e.target.value)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="p-3 capitalize text-slate-500">{o.payment_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length && <p className="p-6 text-slate-500 text-sm">No orders yet.</p>}
      </div>
    </div>
  );
}
