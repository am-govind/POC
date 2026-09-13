import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import ProductCard from '../../components/store/ProductCard';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState({ items: [], pages: 1, page: 1 });
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const page = Number(params.get('page') || 1);
  const sort = params.get('sort') || 'name';
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();

  useEffect(() => {
    const search = new URLSearchParams({ page, limit: '12', sort });
    if (q) search.set('search', q);
    if (category) search.set('category', category);
    api(`/api/products?${search}`).then(setData).catch(() => {});
  }, [q, category, page, sort]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setParams(next);
  };

  const handleAdd = async (product) => {
    if (!isAuthenticated) { window.location.href = '/login'; return; }
    await addItem(product.id);
  };

  return (
    <div className="min-h-screen bg-ink bg-grain">
      <StoreNav />
      <main className="max-w-7xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl mb-6">Shop</h1>
        <div className="flex flex-wrap gap-3 mb-8">
          <select className="input-field w-auto" value={sort} onChange={(e) => setFilter('sort', e.target.value)}>
            <option value="name">Name</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
          <select className="input-field w-auto" value={category} onChange={(e) => setFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {['whisky','wine','beer','gin','vodka','rum','tequila','liqueurs'].map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {data.items.map((p, i) => <ProductCard key={p.id} product={p} index={i} onAdd={handleAdd} />)}
        </div>
        {data.pages > 1 && (
          <div className="flex justify-center gap-2 mt-10">
            {Array.from({ length: data.pages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setFilter('page', String(p))}
                className={`px-4 py-2 rounded-lg ${p === page ? 'bg-gold text-ink' : 'glass'}`}
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
