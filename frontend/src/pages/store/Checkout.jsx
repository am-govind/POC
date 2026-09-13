import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import StoreNav from '../../components/layout/StoreNav';
import { api, formatPrice } from '../../lib/api';
import { useCart } from '../../context/CartContext';

export default function Checkout() {
  const { cart, refresh } = useCart();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ delivery_address: address }),
      });
      await refresh();
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-card p-12 text-center max-w-md"
        >
          <CheckCircle className="text-gold mx-auto mb-4" size={48} />
          <h1 className="font-display text-3xl mb-2">Order Placed!</h1>
          <p className="text-white/60 mb-8">Thank you. We&apos;ll deliver your spirits soon.</p>
          <Link to="/orders" className="btn-primary">View Orders</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <StoreNav />
      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl mb-8">Checkout</h1>
        <div className="grid md:grid-cols-5 gap-8">
          <form onSubmit={submit} className="md:col-span-3 space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Delivery address</label>
              <textarea
                required
                rows={4}
                className="input-field"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Full address with pincode"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Placing order…' : `Place order · ${formatPrice(cart.total)}`}
            </button>
          </form>
          <aside className="md:col-span-2 glass-card p-6">
            <h2 className="font-semibold mb-4">Order summary</h2>
            <ul className="space-y-2 text-sm text-white/70">
              {cart.items.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span>{i.name} × {i.quantity}</span>
                  <span>{formatPrice(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-white/10 mt-4 pt-4 flex justify-between font-semibold text-gold">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
