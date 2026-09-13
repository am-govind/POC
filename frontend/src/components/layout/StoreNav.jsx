import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Wine, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function StoreNav({ onSearch }) {
  const { user, logout, isAuthenticated } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
    else navigate(`/shop?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Wine className="text-gold" size={24} />
          <span className="font-display text-xl font-bold text-gold">BottleShop</span>
        </Link>

        <form onSubmit={submit} className="flex-1 max-w-xl hidden sm:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
            <input
              className="input-field pl-10 py-2"
              placeholder="Search spirits, wine, beer..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </form>

        <nav className="flex items-center gap-3 ml-auto">
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="btn-ghost hidden md:inline-flex text-sm">Orders</Link>
              <span className="text-white/60 text-sm hidden md:inline">{user.full_name || user.email}</span>
              <button onClick={logout} className="btn-ghost p-2" title="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-ghost flex items-center gap-2 text-sm">
              <User size={18} /> Login
            </Link>
          )}
          <Link to="/cart" className="btn-ghost relative p-2">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-glow text-ink text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
