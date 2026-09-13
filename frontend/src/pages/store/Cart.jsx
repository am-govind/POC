import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus, Trash2 } from 'lucide-react';
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import { formatPrice } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { isAuthenticated } = useAuth();
  const { cart, updateItem, removeItem } = useCart();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-ink">
        <StoreNav />
        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <p className="text-white/60 mb-6">Sign in to view your cart.</p>
          <Link to="/login" className="btn-primary">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <StoreNav />
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl mb-8">Your Cart</h1>
        {!cart.items.length ? (
          <div className="glass-card p-12 text-center text-white/50">
            <p>Your cart is empty.</p>
            <Link to="/shop" className="btn-primary inline-block mt-6">Continue shopping</Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {cart.items.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-4 flex gap-4 items-center"
                >
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-16 h-16 object-cover rounded-lg" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-white/50 text-sm">{formatPrice(item.price)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-1 glass rounded" onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}>
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button className="p-1 glass rounded" onClick={() => updateItem(item.id, item.quantity + 1)}>
                      <Plus size={14} />
                    </button>
                  </div>
                  <strong className="text-gold w-24 text-right">{formatPrice(item.line_total)}</strong>
                  <button onClick={() => removeItem(item.id)} className="text-white/40 hover:text-red-400 p-2">
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </div>
            <div className="glass-card p-6 mt-8 flex justify-between items-center">
              <span className="text-white/60">Total</span>
              <strong className="text-gold text-2xl">{formatPrice(cart.total)}</strong>
            </div>
            <Link to="/checkout" className="btn-primary w-full text-center block mt-6">Proceed to Checkout</Link>
          </>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
