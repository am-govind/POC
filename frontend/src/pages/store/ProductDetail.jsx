import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Minus, Plus, ChevronLeft } from 'lucide-react';
import StoreNav from '../../components/layout/StoreNav';
import StoreFooter from '../../components/layout/StoreFooter';
import ProductCard from '../../components/store/ProductCard';
import { api, discountPercent, formatPrice, stockBadge } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
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
    api(`/api/products?category=${product.category_slug}&limit=6`).then((r) => {
      setRelated(r.items.filter((p) => p.id !== id));
    }).catch(() => {});
  }, [product, id]);

  if (!product) {
    return (
      <div className="min-h-screen bg-flipkart-bg flex items-center justify-center text-flipkart-muted">
        Loading…
      </div>
    );
  }

  const images = product.images?.length ? product.images : (product.image_url ? [product.image_url] : []);
  const badge = stockBadge(product.stock_quantity, product.reorder_level);
  const outOfStock = product.stock_quantity <= 0;
  const off = discountPercent(product.price, product.mrp);

  const requireAuth = (redirect) => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent(redirect)}`);
      return false;
    }
    return true;
  };

  const buy = async (goCheckout) => {
    if (!requireAuth(goCheckout ? '/checkout' : '/cart')) return;
    setBusy(true);
    try {
      await addItem(product.id, qty);
      navigate(goCheckout ? '/checkout' : '/cart');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-flipkart-bg">
      <StoreNav />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Link to="/shop" className="inline-flex items-center gap-1 text-flipkart-blue text-sm mb-4 hover:underline">
          <ChevronLeft size={16} /> Back to shop
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="fk-card p-4">
            <div className="aspect-square bg-gray-50 flex items-center justify-center p-6">
              {images[activeImg] && (
                <img src={images[activeImg]} alt={product.name} className="max-h-full object-contain" />
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto">
                {images.map((url, i) => (
                  <button
                    key={url}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`w-16 h-16 border rounded-sm p-1 shrink-0 ${
                      i === activeImg ? 'border-flipkart-blue' : 'border-gray-200'
                    }`}
                  >
                    <img src={url} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-flipkart-muted text-sm">{product.brand}</p>
            <h1 className="text-2xl font-medium text-flipkart-text mt-1">{product.name}</h1>
            <div className="flex items-center gap-3 mt-4 flex-wrap">
              <span className="text-2xl font-semibold">{formatPrice(product.price)}</span>
              {off > 0 && (
                <>
                  <span className="text-flipkart-muted line-through">{formatPrice(product.mrp)}</span>
                  <span className="text-flipkart-green font-semibold text-sm">{off}% off</span>
                </>
              )}
            </div>
            {badge && (
              <p className={`text-sm mt-2 ${badge.tone === 'red' ? 'text-red-600' : 'text-orange-600'}`}>
                {badge.label}
              </p>
            )}
            <p className="text-flipkart-muted text-sm mt-4 leading-relaxed">{product.description}</p>

            {product.highlights?.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm text-flipkart-text list-disc pl-5">
                {product.highlights.map((h) => <li key={h}>{h}</li>)}
              </ul>
            )}

            {!outOfStock && (
              <div className="flex items-center gap-3 mt-6">
                <span className="text-sm text-flipkart-muted">Qty:</span>
                <div className="flex items-center border border-gray-300 rounded-sm">
                  <button type="button" className="p-2" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={14} /></button>
                  <span className="w-10 text-center text-sm">{qty}</span>
                  <button type="button" className="p-2" onClick={() => setQty(Math.min(product.stock_quantity, qty + 1))}><Plus size={14} /></button>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6 flex-wrap">
              <button className="fk-btn-cart px-8 py-3" disabled={outOfStock || busy} onClick={() => buy(false)}>
                ADD TO CART
              </button>
              <button className="fk-btn-primary px-8 py-3" disabled={outOfStock || busy} onClick={() => buy(true)}>
                BUY NOW
              </button>
            </div>

            <div className="fk-card mt-8 p-4 text-sm">
              <h2 className="font-semibold text-flipkart-text mb-3">Product Details</h2>
              <table className="w-full">
                <tbody className="text-flipkart-muted">
                  {[
                    ['Brand', product.brand],
                    ['Category', product.category],
                    ['ABV', `${product.alcohol_percentage}%`],
                    ['Volume', `${product.volume_ml} ml`],
                    ['Country', product.country_of_origin],
                    ['SKU', product.sku],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-100">
                      <td className="py-2 pr-4 text-flipkart-text">{k}</td>
                      <td className="py-2">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold mb-4">Similar products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {related.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </main>
      <StoreFooter />
    </div>
  );
}
