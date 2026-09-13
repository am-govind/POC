import { Link } from 'react-router-dom';

export default function StoreFooter() {
  return (
    <footer className="border-t border-white/10 mt-20 py-12 bg-ink-light/50">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm text-white/60">
        <div>
          <h3 className="font-display text-gold text-lg mb-3">BottleShop</h3>
          <p>Premium spirits delivered with care. Must be 21+ to purchase.</p>
        </div>
        <div>
          <h4 className="text-white mb-3 font-semibold">Shop</h4>
          <ul className="space-y-2">
            <li><Link to="/shop" className="hover:text-gold">All Products</Link></li>
            <li><Link to="/shop?category=whisky" className="hover:text-gold">Whisky</Link></li>
            <li><Link to="/shop?category=wine" className="hover:text-gold">Wine</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white mb-3 font-semibold">Support</h4>
          <ul className="space-y-2">
            <li><Link to="/login" className="hover:text-gold">Account</Link></li>
            <li><Link to="/admin" className="hover:text-gold">Admin</Link></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-white/30 text-xs mt-8">© {new Date().getFullYear()} BottleShop. Drink responsibly.</p>
    </footer>
  );
}
