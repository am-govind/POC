import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import { api, formatPrice } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const STATUS_COLORS = {
  pending: 'bg-yellow-500/20 text-yellow-300',
  confirmed: 'bg-blue-500/20 text-blue-300',
  packed: 'bg-purple-500/20 text-purple-300',
  shipped: 'bg-cyan-500/20 text-cyan-300',
  delivered: 'bg-green-500/20 text-green-300',
  cancelled: 'bg-red-500/20 text-red-300',
};

export default function Orders() {
  const { isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (isAuthenticated) api('/api/orders').then(setOrders).catch(() => {});
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink">
        <StoreNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <Link to="/login" className="btn-primary">Sign in to view orders</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <StoreNav />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl mb-8">Your Orders</h1>
        {!orders.length ? (
          <p className="text-white/50">No orders yet.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o, i) => (
              <motion.div
                key={o.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5"
              >
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="font-semibold">Order #{o.id.slice(0, 8)}</p>
                    <p className="text-white/50 text-sm mt-1">{o.delivery_address}</p>
                    <p className="text-white/40 text-xs mt-2">
                      {new Date(o.created_at).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_COLORS[o.status] || ''}`}>
                      {o.status}
                    </span>
                    <p className="text-gold font-bold mt-2">{formatPrice(o.total_amount)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
