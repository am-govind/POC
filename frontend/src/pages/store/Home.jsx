import { lazy, Suspense, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const HeroScene = lazy(() => import('../../components/three/HeroScene'));
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import ProductCard from '../../components/store/ProductCard';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

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

  useEffect(() => {
    const params = new URLSearchParams({ limit: '8' });
    if (category) params.set('category', category);
    api(`/api/products?${params}`).then((r) => setProducts(r.items)).catch(() => {});
  }, [category]);

  const handleAdd = async (product) => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    await addItem(product.id);
  };

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <StoreNav />
      <section className="relative h-[85vh] min-h-[500px] flex items-center overflow-hidden">
        <Suspense fallback={<div className="absolute inset-0 bg-gradient-to-br from-ink via-ink-light to-[#2a1f10]" />}>
          <HeroScene />
        </Suspense>
        <div className="relative z-10 max-w-7xl mx-auto px-4 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-xl"
          >
            <p className="text-gold tracking-[0.3em] text-sm uppercase mb-4">Premium Spirits</p>
            <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6">
              Discover Your <span className="text-gold italic">Next Bottle</span>
            </h1>
            <p className="text-white/60 text-lg mb-8">
              Curated whisky, wine, beer and spirits — delivered to your door.
            </p>
            <Link to="/shop" className="btn-primary inline-block">Explore Collection</Link>
          </motion.div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <button
            onClick={() => setCategory('')}
            className={`shrink-0 px-4 py-2 rounded-full text-sm transition-all ${
              !category ? 'bg-gold text-ink font-semibold' : 'glass text-white/70 hover:text-gold'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              onClick={() => setCategory(c.slug)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm transition-all ${
                category === c.slug ? 'bg-gold text-ink font-semibold' : 'glass text-white/70 hover:text-gold'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-20">
        <h2 className="font-display text-3xl mb-8">Featured Selection</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} onAdd={handleAdd} />
          ))}
        </div>
        <div className="text-center mt-10">
          <Link to="/shop" className="btn-ghost">View all products</Link>
        </div>
      </section>
      <StoreFooter />
    </div>
  );
}
