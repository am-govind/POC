import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingBag, AlertTriangle } from 'lucide-react';
import { api, formatPrice } from '../../lib/api';

function Stat({ label, value, icon: Icon, warning, to }) {
  const inner = (
    <div className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${warning ? 'border-amber-200' : 'border-slate-200'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${warning ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-slate-500 text-sm">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value ?? '—'}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{inner}</Link> : inner;
}

export default function Dashboard() {
  const [summary, setSummary] = useState({});
  const [lowStock, setLowStock] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api('/api/admin/dashboard/summary').then(setSummary).catch(() => {});
    api('/api/admin/dashboard/low-stock').then(setLowStock).catch(() => {});
    api('/api/orders').then((o) => setOrders(o.slice(0, 10))).catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <Stat label="Active products" value={summary.products} icon={Package} />
        <Stat label="Units in stock" value={summary.units} icon={ShoppingBag} />
        <Stat label="Low stock items" value={summary.low_stock} icon={AlertTriangle} warning to="/admin/inventory?status=low_stock" />
      </div>

      {lowStock.length > 0 && (
        <section className="bg-white rounded-xl border border-amber-200 p-5 mb-8">
          <h2 className="font-semibold text-amber-800 mb-4">Low stock alerts</h2>
          <div className="space-y-2">
            {lowStock.map((p) => (
              <div key={p.id} className="flex justify-between items-center text-sm">
                <span className="text-slate-700">{p.name} <span className="text-slate-400">({p.brand})</span></span>
                <span className="text-amber-600 font-medium">{p.stock_quantity} left (reorder at {p.reorder_level})</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="bg-white rounded-xl border border-slate-200 p-5">
        <h2 className="font-semibold text-slate-900 mb-4">Recent orders</h2>
        {!orders.length ? (
          <p className="text-slate-500 text-sm">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-500 text-left border-b">
                <th className="pb-2">Order</th>
                <th className="pb-2">Customer</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-slate-100">
                  <td className="py-3 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td className="py-3">{o.customer_email || o.user_id?.slice(0, 8)}</td>
                  <td className="py-3 capitalize">{o.status}</td>
                  <td className="py-3 text-right font-medium">{formatPrice(o.total_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
