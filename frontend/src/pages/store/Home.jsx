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
      <section className="store-hero">
        <div className="store-hero-inner">
          <div className="store-hero-copy">
            <span className="store-eyebrow">Curated spirits · Delivered with care</span>
            <h1>Good bottles for<br /><em>great evenings.</em></h1>
            <p>Explore thoughtful picks across whisky, wine, beer and more — with trusted delivery at your door.</p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <Link to="/shop" className="store-hero-cta">Explore the collection</Link>
              <span className="store-hero-note">Age-verified delivery</span>
            </div>
          </div>
          <div className="store-hero-art" aria-hidden="true">
            <div className="hero-bottle hero-bottle-back" />
            <div className="hero-bottle hero-bottle-front"><span>BS</span></div>
            <div className="hero-spark">✦</div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-7">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="store-section-kicker">Find your pour</p>
            <h2 className="text-xl font-semibold text-flipkart-text">Shop by category</h2>
          </div>
          <Link to="/shop" className="hidden sm:block text-sm font-semibold text-flipkart-blue hover:underline">View all</Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 px-4 py-2 rounded-sm text-sm font-medium ${
              !category ? 'category-chip category-chip-active' : 'category-chip'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`shrink-0 px-4 py-2 rounded-sm text-sm font-medium ${
                category === c.slug ? 'category-chip category-chip-active' : 'category-chip'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="store-section-kicker">Handpicked for you</p>
            <h2 className="text-2xl font-semibold text-flipkart-text">Popular bottles</h2>
          </div>
          <span className="hidden sm:block text-sm text-flipkart-muted">Fresh picks, fair prices</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
