import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ChevronLeft } from 'lucide-react';
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import CheckoutSteps from '../../components/layout/CheckoutSteps';
import { formatPrice } from '../../lib/api';
import { useCart } from '../../context/CartContext';

export default function Cart() {
  const { cart, updateItem, removeItem } = useCart();

  return (
    <div className="min-h-screen bg-flipkart-bg">
      <StoreNav />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <CheckoutSteps current="cart" />
        <Link to="/shop" className="inline-flex items-center gap-1 text-flipkart-blue text-sm mb-4 hover:underline">
          <ChevronLeft size={16} /> Continue shopping
        </Link>
        <h1 className="text-xl font-semibold text-flipkart-text mb-6">My Cart ({cart.items.length})</h1>

        {!cart.items.length ? (
          <div className="fk-card p-12 text-center text-flipkart-muted">
            <p>Your cart is empty.</p>
            <Link to="/shop" className="fk-btn-primary inline-block mt-6">Start shopping</Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="fk-card p-4 flex gap-4 items-center">
                  {item.image_url && (
                    <img src={item.image_url} alt="" className="w-20 h-20 object-contain bg-gray-50 rounded-sm" />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-flipkart-text line-clamp-2">{item.name}</h3>
                    <p className="text-flipkart-muted text-xs mt-1">{formatPrice(item.price)} each</p>
                  </div>
                  <div className="flex items-center border border-gray-200 rounded-sm">
                    <button type="button" className="p-1.5" onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))}>
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button
                      type="button"
                      className="p-1.5 disabled:opacity-40"
                      disabled={item.quantity >= (item.stock_quantity ?? 0)}
                      onClick={() => updateItem(item.id, Math.min(item.stock_quantity ?? item.quantity, item.quantity + 1))}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <strong className="text-sm w-20 text-right">{formatPrice(item.line_total)}</strong>
                  <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
            <div className="fk-card p-5 mt-6 flex justify-between items-center">
              <span className="text-flipkart-muted">Price details</span>
              <div className="text-right">
                <p className="text-xs text-flipkart-muted">Total amount</p>
                <strong className="text-xl text-flipkart-text">{formatPrice(cart.total)}</strong>
              </div>
            </div>
            <Link to="/checkout" className="fk-btn-primary w-full text-center block mt-4 py-3 text-lg">
              Place Order
            </Link>
          </>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
