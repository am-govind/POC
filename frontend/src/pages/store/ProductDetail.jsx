import { lazy, Suspense, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';

const BottleViewer = lazy(() => import('../../components/three/BottleViewer'));
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import ProductCard from '../../components/store/ProductCard';
import { api, CATEGORY_MODEL, formatPrice, stockBadge } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api(`/api/products/${id}`).then(setProduct).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!product?.category_slug) return;
    api(`/api/products?category=${product.category_slug}&limit=4`).then((r) => {
      setRelated(r.items.filter((p) => p.id !== id));
    }).catch(() => {});
  }, [product, id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-ink flex items-center justify-center">
        <div className="animate-pulse text-gold">Loading...</div>
      </div>
    );
  }

  const badge = stockBadge(product.stock_quantity, product.reorder_level);
  const outOfStock = product.stock_quantity <= 0;
  const modelType = CATEGORY_MODEL[product.category_slug] || 'spirits-amber';

  const buy = async (redirect) => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setBusy(true);
    try {
      await addItem(product.id, qty);
      if (redirect) navigate('/checkout');
      else navigate('/cart');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <StoreNav />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card aspect-square lg:aspect-auto lg:min-h-[480px]"
          >
            {product.image_url ? (
              <div className="relative w-full h-full min-h-[320px]">
                <img src={product.image_url} alt={product.name} className="absolute inset-0 w-full h-full object-contain p-8 lg:hidden" />
                <div className="hidden lg:block h-full">
                  <Suspense fallback={<div className="h-full flex items-center justify-center text-gold/50">Loading 3D…</div>}>
                    <BottleViewer modelType={modelType} imageUrl={product.image_url} />
                  </Suspense>
                </div>
              </div>
            ) : (
              <Suspense fallback={null}>
                <BottleViewer modelType={modelType} />
              </Suspense>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <p className="text-gold uppercase tracking-wider text-sm">{product.category}</p>
            <h1 className="font-display text-4xl md:text-5xl mt-2">{product.name}</h1>
            <p className="text-white/50 mt-2">{product.brand}</p>
            <p className="text-gold text-3xl font-bold mt-6">{formatPrice(product.price)}</p>
            <div className="flex gap-3 mt-4 flex-wrap">
              <span className="glass px-3 py-1 rounded-full text-sm">{product.alcohol_percentage}% ABV</span>
              <span className="glass px-3 py-1 rounded-full text-sm">{product.volume_ml} ml</span>
              {badge && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  badge.tone === 'red' ? 'bg-red-500/20 text-red-300' : 'bg-amber-glow/20 text-amber-glow'
                }`}>{badge.label}</span>
              )}
            </div>
            <p className="text-white/70 mt-6 leading-relaxed">{product.description}</p>

            {!outOfStock && (
              <div className="flex items-center gap-4 mt-8">
                <div className="flex items-center glass rounded-lg">
                  <button type="button" className="p-3" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
                  <span className="w-10 text-center">{qty}</span>
                  <button type="button" className="p-3" onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}><Plus size={16} /></button>
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6 flex-wrap">
              <button className="btn-primary" disabled={outOfStock || busy} onClick={() => buy(false)}>
                Add to Cart
              </button>
              <button className="btn-ghost border-gold/50 text-gold" disabled={outOfStock || busy} onClick={() => buy(true)}>
                Buy Now
              </button>
            </div>
          </motion.div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-2xl mb-6">You may also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
