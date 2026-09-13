import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import { api, formatPrice } from '../../lib/api';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  packed: 'bg-purple-100 text-purple-800',
  shipped: 'bg-cyan-100 text-cyan-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    api('/api/orders').then(setOrders).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-flipkart-bg">
      <StoreNav />
      <main className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-xl font-semibold text-flipkart-text mb-6">My Orders</h1>
        {!orders.length ? (
          <div className="fk-card p-8 text-center text-flipkart-muted">
            <p>No orders yet.</p>
            <Link to="/shop" className="fk-btn-primary inline-block mt-4">Start shopping</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => (
              <div key={o.id} className="fk-card p-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-medium text-flipkart-text">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-flipkart-muted text-sm mt-1">{o.delivery_address}</p>
                    <p className="text-xs text-gray-400 mt-2">{new Date(o.created_at).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-sm capitalize ${STATUS_COLORS[o.status] || ''}`}>
                      {o.status}
                    </span>
                    <p className="font-semibold text-flipkart-text mt-2">{formatPrice(o.total_amount)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
