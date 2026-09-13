import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { discountPercent, formatPrice, stockBadge } from '../../lib/api';

export default function ProductCard({ product, onAdd }) {
  const badge = stockBadge(product.stock_quantity, product.reorder_level);
  const outOfStock = product.stock_quantity <= 0;
  const off = discountPercent(product.price, product.mrp);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (onAdd) await onAdd(product);
  };

  return (
    <article className="fk-card overflow-hidden hover:shadow-md transition-shadow group">
      <Link to={`/products/${product.id}`} className="block">
        <div className="aspect-square bg-gray-50 relative p-4">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl font-bold">
              {product.brand?.[0]}
            </div>
          )}
          {off > 0 && (
            <span className="absolute top-2 left-2 bg-flipkart-green text-white text-xs font-semibold px-1.5 py-0.5 rounded-sm">
              {off}% off
            </span>
          )}
          {badge && (
            <span className={`absolute top-2 right-2 text-xs font-medium px-1.5 py-0.5 rounded-sm ${
              badge.tone === 'red' ? 'bg-red-500 text-white' : 'bg-orange-100 text-orange-700'
            }`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="p-3 border-t border-gray-100">
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
            className="fk-btn-cart w-full mt-3 flex items-center justify-center gap-1 text-sm py-2"
          >
            <Plus size={16} /> {outOfStock ? 'Out of stock' : 'Add to cart'}
          </button>
        </div>
      </Link>
    </article>
  );
}
