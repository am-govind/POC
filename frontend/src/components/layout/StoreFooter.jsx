import { Link } from 'react-router-dom';

export default function StoreFooter() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12 py-10">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm text-flipkart-muted">
        <div>
          <h3 className="text-flipkart-text font-semibold mb-3">BottleShop</h3>
          <p>India&apos;s trusted online liquor store. Must be {21}+ to purchase. Drink responsibly.</p>
        </div>
        <div>
          <h4 className="text-flipkart-text font-medium mb-2">Shop</h4>
          <ul className="space-y-1">
            <li><Link to="/shop" className="hover:text-flipkart-blue">All Products</Link></li>
            <li><Link to="/shop?category=whisky" className="hover:text-flipkart-blue">Whisky</Link></li>
            <li><Link to="/shop?category=wine" className="hover:text-flipkart-blue">Wine</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-flipkart-text font-medium mb-2">Help</h4>
          <ul className="space-y-1">
            <li><Link to="/login" className="hover:text-flipkart-blue">My Account</Link></li>
            <li><Link to="/admin" className="hover:text-flipkart-blue">Admin</Link></li>
          </ul>
        </div>
      </div>
      <p className="text-center text-xs text-gray-400 mt-8">© {new Date().getFullYear()} BottleShop</p>
    </footer>
  );
}
