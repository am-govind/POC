import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { formatPrice, stockBadge } from '../../lib/api';

export default function ProductCard({ product, onAdd, index = 0 }) {
  const badge = stockBadge(product.stock_quantity, product.reorder_level);
  const outOfStock = product.stock_quantity <= 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05 }}
      className="glass-card overflow-hidden group"
    >
      <Link to={`/products/${product.id}`} className="block">
        <div className="aspect-square bg-ink-light relative overflow-hidden">
          {product.image_url ? (
            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gold/10 to-transparent text-gold/30 text-6xl font-display">
              {product.brand?.[0]}
            </div>
          )}
          {badge && (
            <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${
              badge.tone === 'red' ? 'bg-red-500/90 text-white' : 'bg-amber-glow/90 text-ink'
            }`}>
              {badge.label}
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-gold/70 text-xs uppercase tracking-wider">{product.category}</p>
          <h3 className="font-display text-lg mt-1 line-clamp-1">{product.name}</h3>
          <p className="text-white/50 text-sm">{product.brand} · {product.volume_ml}ml</p>
          <div className="flex items-center justify-between mt-3">
            <strong className="text-gold text-lg">{formatPrice(product.price)}</strong>
            <button
              type="button"
              disabled={outOfStock}
              onClick={(e) => { e.preventDefault(); onAdd?.(product); }}
              className="bg-amber-glow text-ink p-2 rounded-lg hover:shadow-glow disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
