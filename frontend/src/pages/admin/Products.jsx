import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, formatPrice } from '../../lib/api';

const empty = {
  name: '', brand: '', category_id: '', description: '', alcohol_percentage: '',
  volume_ml: 750, price: '', mrp: '', image_url: '', images: [''],
  country_of_origin: '', highlights: '', sku: '',
  stock_quantity: 0, reorder_level: 10,
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(empty);
  const [search, setSearch] = useState('');

  const load = () => {
    const q = search ? `?search=${encodeURIComponent(search)}&limit=100` : '?limit=100';
    api(`/api/products${q}`).then((r) => setProducts(r.items)).catch(() => {});
  };

  useEffect(() => {
    load();
    api('/api/categories').then(setCategories).catch(() => {});
  }, []);

  const openCreate = () => {
    setForm(empty);
    setModal('create');
  };

  const openEdit = async (p) => {
    const full = await api(`/api/products/${p.id}`);
    setForm({
      name: full.name, brand: full.brand,
      category_id: categories.find((c) => c.name === full.category)?.id || '',
      description: full.description || '', alcohol_percentage: full.alcohol_percentage,
      volume_ml: full.volume_ml, price: full.price, mrp: full.mrp || full.price,
      image_url: full.image_url || '', images: full.images?.length ? full.images : [''],
      country_of_origin: full.country_of_origin || '',
      highlights: (full.highlights || []).join(', '),
      sku: full.sku || '',
      stock_quantity: full.stock_quantity, reorder_level: full.reorder_level,
    });
    setModal(p.id);
  };

  const save = async (e) => {
    e.preventDefault();
    const images = form.images.filter(Boolean);
    const body = JSON.stringify({
      name: form.name,
      brand: form.brand,
      category_id: form.category_id || null,
      description: form.description,
      alcohol_percentage: Number(form.alcohol_percentage),
      volume_ml: Number(form.volume_ml),
      price: Number(form.price),
      mrp: Number(form.mrp) || Number(form.price),
      image_url: form.image_url || images[0] || null,
      images,
      country_of_origin: form.country_of_origin || null,
      highlights: form.highlights ? form.highlights.split(',').map((s) => s.trim()).filter(Boolean) : [],
      sku: form.sku || null,
      stock_quantity: Number(form.stock_quantity),
      reorder_level: Number(form.reorder_level),
    });
    if (modal === 'create') {
      await api('/api/products', { method: 'POST', body });
    } else {
      await api(`/api/products/${modal}`, { method: 'PUT', body });
    }
    setModal(null);
    load();
  };

  const remove = async (id) => {
    if (!confirm('Deactivate this product?')) return;
    await api(`/api/products/${id}`, { method: 'DELETE' });
    load();
  };

  const setImage = (i, val) => {
    const images = [...form.images];
    images[i] = val;
    setForm({ ...form, images });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Products</h1>
        <button onClick={openCreate} className="bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium hover:bg-emerald-700">
          <Plus size={16} /> Add product
        </button>
      </div>
      <input
        className="admin-input max-w-sm mb-4"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && load()}
      />
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="p-3">
                  <strong>{p.name}</strong>
                  <div className="text-slate-400 text-xs">{p.brand} · {p.category}</div>
                </td>
                <td className="p-3 text-xs font-mono">{p.sku || '—'}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">{p.stock_quantity}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={() => openEdit(p)} className="text-slate-400 hover:text-emerald-600"><Pencil size={16} /></button>
                  <button onClick={() => remove(p.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <form onSubmit={save} className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-3">
            <h2 className="font-bold text-lg">{modal === 'create' ? 'New product' : 'Edit product'}</h2>
            {['name', 'brand', 'sku', 'description', 'country_of_origin'].map((f) => (
              <div key={f}>
                <label className="text-xs text-slate-500 capitalize">{f.replace('_', ' ')}</label>
                <input className="admin-input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required={f === 'name' || f === 'brand'} />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500">Highlights (comma-separated)</label>
              <input className="admin-input" value={form.highlights} onChange={(e) => setForm({ ...form, highlights: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-slate-500">Category</label>
              <select className="admin-input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['alcohol_percentage', 'volume_ml', 'price', 'mrp', 'stock_quantity', 'reorder_level'].map((f) => (
                <div key={f}>
                  <label className="text-xs text-slate-500">{f.replace('_', ' ')}</label>
                  <input type="number" className="admin-input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required={['price', 'alcohol_percentage', 'volume_ml'].includes(f)} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-slate-500">Primary image URL</label>
              <input className="admin-input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
            </div>
            {form.images.map((url, i) => (
              <div key={i}>
                <label className="text-xs text-slate-500">Image URL {i + 1}</label>
                <input className="admin-input" value={url} onChange={(e) => setImage(i, e.target.value)} />
              </div>
            ))}
            <button type="button" className="text-sm text-emerald-600" onClick={() => setForm({ ...form, images: [...form.images, ''] })}>+ Add image</button>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              <button type="button" onClick={() => setModal(null)} className="text-slate-500 text-sm">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
