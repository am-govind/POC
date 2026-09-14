import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { discountPercent, formatPrice, stockBadge } from '../../lib/api';

export default function ProductCard({ product, onAdd }) {
  const [imageFailed, setImageFailed] = useState(false);
  const badge = stockBadge(product.stock_quantity, product.reorder_level);
  const outOfStock = product.stock_quantity <= 0;
  const off = discountPercent(product.price, product.mrp);
  const imageUrl = product.image_url || product.images?.[0];

  const handleAdd = async (e) => {
    e.preventDefault();
    if (onAdd) await onAdd(product);
  };

  return (
    <article className="product-card group">
      <Link to={`/products/${product.id}`} className="block">
        <div className="product-card-media aspect-square relative p-4">
          {imageUrl && !imageFailed ? (
            <img
              src={imageUrl}
              alt={product.name}
              loading="lazy"
              decoding="async"
              onError={() => setImageFailed(true)}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="bottle-fallback" aria-label={`${product.name} product image placeholder`}>
              <span className="bottle-fallback-cap" />
              <span className="bottle-fallback-neck" />
              <span className="bottle-fallback-body">{product.category?.[0] || 'B'}</span>
            </div>
          )}
          {off > 0 && (
            <span className="absolute top-3 left-3 bg-flipkart-green text-white text-xs font-semibold px-2 py-1 rounded-full">
              {off}% off
            </span>
          )}
          {badge && (
            <span className={`absolute top-3 right-3 text-xs font-medium px-2 py-1 rounded-full ${
              badge.tone === 'red' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'
            }`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="p-4 border-t border-slate-100">
          <p className="text-flipkart-muted text-xs">{product.brand}</p>
          <h3 className="text-sm text-flipkart-text line-clamp-2 mt-0.5 min-h-[2.5rem]">{product.name}</h3>
          <div className="flex items-baseline gap-2 mt-2">
            <strong className="text-flipkart-text">{formatPrice(product.price)}</strong>
            {off > 0 && (
              <>
                <span className="text-flipkart-muted text-xs line-through">{formatPrice(product.mrp)}</span>
              </>
            )}
          </div>
          <button
            type="button"
            disabled={outOfStock}
            onClick={handleAdd}
            className="fk-btn-cart w-full mt-4 flex items-center justify-center gap-1 text-sm py-2.5 rounded-lg"
          >
            <Plus size={16} /> {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </Link>
    </article>
  );
}
