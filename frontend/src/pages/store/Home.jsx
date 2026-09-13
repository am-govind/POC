import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import ProductCard from '../../components/store/ProductCard';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useLocation, useNavigate } from 'react-router-dom';

const CATEGORIES = [
  { slug: 'whisky', label: 'Whisky' },
  { slug: 'wine', label: 'Wine' },
  { slug: 'beer', label: 'Beer' },
  { slug: 'gin', label: 'Gin' },
  { slug: 'vodka', label: 'Vodka' },
  { slug: 'rum', label: 'Rum' },
  { slug: 'tequila', label: 'Tequila' },
  { slug: 'liqueurs', label: 'Liqueurs' },
];

export default function Home() {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('');
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams({ limit: '12' });
    if (category) params.set('category', category);
    api(`/api/products?${params}`).then((r) => setProducts(r.items)).catch(() => {});
  }, [category]);

  const handleAdd = async (product) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    await addItem(product.id);
  };

  return (
    <div className="min-h-screen bg-flipkart-bg">
      <StoreNav />
      <section className="bg-flipkart-blue text-white">
        <div className="max-w-7xl mx-auto px-4 py-10 md:py-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold">Premium Spirits, Delivered</h1>
            <p className="text-blue-100 mt-2 text-lg">Whisky · Wine · Beer · Spirits — best prices online</p>
            <Link to="/shop" className="inline-block mt-6 bg-white text-flipkart-blue font-semibold px-6 py-2.5 rounded-sm hover:bg-blue-50">
              Shop now
            </Link>
          </div>
          <div className="hidden md:block text-6xl opacity-30">🍾</div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 px-4 py-2 rounded-sm text-sm font-medium ${
              !category ? 'bg-flipkart-blue text-white' : 'fk-card text-flipkart-text'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`shrink-0 px-4 py-2 rounded-sm text-sm font-medium ${
                category === c.slug ? 'bg-flipkart-blue text-white' : 'fk-card text-flipkart-text'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold text-flipkart-text mb-4">Deals of the Day</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAdd={handleAdd} />
          ))}
        </div>
        <div className="text-center mt-8">
          <Link to="/shop" className="fk-btn-primary inline-block">View all products</Link>
        </div>
      </section>
      <StoreFooter />
    </div>
  );
}
