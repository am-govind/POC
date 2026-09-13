import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function StoreNav() {
  const { user, logout, isAuthenticated } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = (e) => {
    e.preventDefault();
    navigate(`/shop?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="fk-header">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
        <Link to="/" className="shrink-0 flex flex-col leading-tight">
          <span className="text-flipkart-blue font-bold text-xl italic">BottleShop</span>
          <span className="text-[10px] text-flipkart-muted hidden sm:block">Premium Spirits</span>
        </Link>

        <form onSubmit={submit} className="flex-1 flex max-w-2xl">
          <input
            className="fk-input rounded-r-none flex-1 py-2"
            placeholder="Search for whisky, wine, beer and more"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="bg-flipkart-blue text-white px-4 rounded-r-sm hover:bg-flipkart-blue-dark">
            <Search size={18} />
          </button>
        </form>

        <nav className="flex items-center gap-4 shrink-0">
          {isAuthenticated ? (
            <>
              <Link to="/orders" className="text-flipkart-blue font-medium text-sm hidden md:block hover:underline">
                Orders
              </Link>
              <span className="text-xs text-flipkart-muted hidden lg:block max-w-[100px] truncate">
                {user.full_name || user.email}
              </span>
              <button onClick={logout} className="text-flipkart-muted hover:text-flipkart-blue p-1" title="Sign out">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <Link to="/login" className="text-flipkart-blue font-semibold text-sm flex items-center gap-1">
              <User size={18} /> Login
            </Link>
          )}
          <Link to="/cart" className="flex items-center gap-1 text-flipkart-blue font-semibold text-sm">
            <ShoppingCart size={20} />
            <span className="hidden sm:inline">Cart</span>
            {count > 0 && (
              <span className="bg-flipkart-yellow text-white text-xs font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
