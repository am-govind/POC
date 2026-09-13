import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { api, formatPrice } from '../../lib/api';

const empty = {
  name: '', brand: '', category_id: '', description: '', alcohol_percentage: '',
  volume_ml: 750, price: '', image_url: '', stock_quantity: 0, reorder_level: 10,
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

  const openEdit = (p) => {
    setForm({
      name: p.name, brand: p.brand,
      category_id: categories.find((c) => c.name === p.category)?.id || '',
      description: p.description || '', alcohol_percentage: p.alcohol_percentage,
      volume_ml: p.volume_ml, price: p.price, image_url: p.image_url || '',
      stock_quantity: p.stock_quantity, reorder_level: p.reorder_level,
    });
    setModal(p.id);
  };

  const save = async (e) => {
    e.preventDefault();
    const body = JSON.stringify({
      ...form,
      alcohol_percentage: Number(form.alcohol_percentage),
      volume_ml: Number(form.volume_ml),
      price: Number(form.price),
      stock_quantity: Number(form.stock_quantity),
      reorder_level: Number(form.reorder_level),
      category_id: form.category_id || null,
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
              <th className="p-3">Category</th>
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
                  <div className="text-slate-400 text-xs">{p.brand}</div>
                </td>
                <td className="p-3">{p.category}</td>
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
            {['name', 'brand', 'description', 'image_url'].map((f) => (
              <div key={f}>
                <label className="text-xs text-slate-500 capitalize">{f.replace('_', ' ')}</label>
                <input className="admin-input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required={f === 'name' || f === 'brand'} />
              </div>
            ))}
            <div>
              <label className="text-xs text-slate-500">Category</label>
              <select className="admin-input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">—</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['alcohol_percentage', 'volume_ml', 'price', 'stock_quantity', 'reorder_level'].map((f) => (
                <div key={f}>
                  <label className="text-xs text-slate-500">{f.replace('_', ' ')}</label>
                  <input type="number" className="admin-input" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} required={['price', 'alcohol_percentage', 'volume_ml'].includes(f)} />
                </div>
              ))}
            </div>
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
