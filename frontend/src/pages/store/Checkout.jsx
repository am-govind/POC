import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle, ChevronLeft } from 'lucide-react';
import StoreNav from '../../components/layout/StoreNav';
import CheckoutSteps from '../../components/layout/CheckoutSteps';
import { api, formatPrice, isOldEnough, MIN_AGE_YEARS } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Checkout() {
  const { cart, refresh, loading: cartLoading } = useCart();
  const { user, refresh: refreshUser } = useAuth();
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState(user?.date_of_birth || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const showAgeVerify =
    !user?.date_of_birth || !isOldEnough(user?.date_of_birth || '');

  useEffect(() => {
    if (!cartLoading && !done && !cart.items.length) {
      navigate('/cart', { replace: true });
    }
  }, [cart.items.length, cartLoading, done, navigate]);

  useEffect(() => {
    if (user?.date_of_birth) setDob(user.date_of_birth);
  }, [user]);

  const saveDob = async () => {
    if (!dob) {
      setError('Please enter your date of birth');
      return false;
    }
    if (!isOldEnough(dob)) {
      setError(`You must be at least ${MIN_AGE_YEARS} years old to order alcohol`);
      return false;
    }
    await api('/api/auth/me', {
      method: 'PATCH',
      body: JSON.stringify({ date_of_birth: dob }),
    });
    await refreshUser();
    return true;
  };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (showAgeVerify) {
        const ok = await saveDob();
        if (!ok) return;
      }
      await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ delivery_address: address }),
      });
      setDone(true);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-flipkart-bg flex items-center justify-center text-flipkart-muted">
        Loading cart…
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-flipkart-bg">
        <StoreNav />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <CheckCircle className="text-flipkart-green mx-auto mb-4" size={56} />
          <h1 className="text-2xl font-semibold text-flipkart-text">Order placed!</h1>
          <p className="text-flipkart-muted mt-2">Thank you for shopping with BottleShop.</p>
          <div className="flex gap-3 justify-center mt-8">
            <Link to="/shop" className="fk-btn-primary">Continue shopping</Link>
            <Link to="/orders" className="fk-btn-cart bg-white text-flipkart-blue border border-flipkart-blue">View orders</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-flipkart-bg">
      <StoreNav />
      <main className="max-w-4xl mx-auto px-4 py-6">
        <CheckoutSteps current="checkout" />
        <Link to="/cart" className="inline-flex items-center gap-1 text-flipkart-blue text-sm mb-4 hover:underline">
          <ChevronLeft size={16} /> Back to cart
        </Link>
        <h1 className="text-xl font-semibold text-flipkart-text mb-6">Checkout</h1>

        <div className="grid md:grid-cols-5 gap-6">
          <form onSubmit={submit} className="md:col-span-3 space-y-5">
            {showAgeVerify && (
              <div className="fk-card p-4 border-l-4 border-flipkart-blue">
                <h2 className="font-semibold text-flipkart-text mb-1">Age verification required</h2>
                <p className="text-sm text-flipkart-muted mb-3">
                  {user?.date_of_birth && !isOldEnough(user.date_of_birth)
                    ? `Your account does not meet the minimum age of ${MIN_AGE_YEARS}. Update your date of birth to continue.`
                    : `You must be ${MIN_AGE_YEARS}+ to purchase alcohol. Enter your date of birth to continue.`}
                </p>
                <label className="block text-sm text-flipkart-text mb-1">Date of birth</label>
                <input
                  type="date"
                  required
                  className="fk-input"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
            )}

            <div className="fk-card p-4">
              <h2 className="font-semibold text-flipkart-text mb-3">Delivery address</h2>
              <textarea
                required
                rows={4}
                className="fk-input"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House no., street, city, state, pincode"
              />
            </div>

            <p className="text-sm text-flipkart-muted">Payment: Cash on delivery</p>

            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" className="fk-btn-primary w-full py-3 text-lg" disabled={busy}>
              {busy ? 'Placing order…' : `Confirm order · ${formatPrice(cart.total)}`}
            </button>
          </form>

          <aside className="md:col-span-2 fk-card p-4 h-fit">
            <h2 className="font-semibold text-flipkart-text mb-3">Order summary</h2>
            <ul className="space-y-2 text-sm text-flipkart-muted">
              {cart.items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="line-clamp-1">{i.name} × {i.quantity}</span>
                  <span className="shrink-0">{formatPrice(i.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-200 mt-4 pt-3 flex justify-between font-semibold text-flipkart-text">
              <span>Total</span>
              <span>{formatPrice(cart.total)}</span>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
