import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Minus, Plus, History, Download } from 'lucide-react';
import { api } from '../../lib/api';

const REASONS = ['restock', 'damage', 'correction', 'return', 'manual_set'];
const STATUS_STYLES = {
  in_stock: 'bg-green-100 text-green-700',
  low_stock: 'bg-amber-100 text-amber-700',
  out_of_stock: 'bg-red-100 text-red-700',
};

export default function Inventory() {
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [adjustModal, setAdjustModal] = useState(null);
  const [historyModal, setHistoryModal] = useState(null);
  const [history, setHistory] = useState([]);
  const [bulkDelta, setBulkDelta] = useState(10);
  const [bulkReason, setBulkReason] = useState('restock');

  const status = params.get('status') || '';
  const category = params.get('category') || '';
  const search = params.get('search') || '';

  const load = () => {
    const q = new URLSearchParams();
    if (status) q.set('status', status);
    if (category) q.set('category', category);
    if (search) q.set('search', search);
    api(`/api/admin/inventory?${q}`).then(setRows).catch(() => {});
  };

  useEffect(() => { load(); }, [status, category, search]);

  const patchStock = async (id, stock, reorder) => {
    await api(`/api/admin/inventory/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_quantity: stock, reorder_level: reorder }),
    });
    load();
  };

  const adjust = async (id, delta, reason) => {
    await api(`/api/admin/inventory/${id}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ delta, reason }),
    });
    setAdjustModal(null);
    load();
  };

  const bulkRestock = async () => {
    await api('/api/admin/inventory/bulk-restock', {
      method: 'POST',
      body: JSON.stringify({ product_ids: [...selected], delta: bulkDelta, reason: bulkReason }),
    });
    setSelected(new Set());
    load();
  };

  const showHistory = async (id) => {
    const h = await api(`/api/admin/inventory/${id}/history`);
    setHistory(h);
    setHistoryModal(id);
  };

  const exportCsv = () => {
    const header = 'name,brand,category,stock,reorder_level,status\n';
    const body = rows.map((r) =>
      `"${r.name}","${r.brand}","${r.category}",${r.stock_quantity},${r.reorder_level},${r.status}`
    ).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'inventory.csv';
    a.click();
  };

  const setFilter = (key, val) => {
    const next = new URLSearchParams(params);
    if (val) next.set(key, val);
    else next.delete(key);
    setParams(next);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button onClick={bulkRestock} className="bg-emerald-600 text-white px-3 py-2 rounded-lg text-sm">
              Restock {selected.size} selected (+{bulkDelta})
            </button>
          )}
          <button onClick={exportCsv} className="border border-slate-200 px-3 py-2 rounded-lg text-sm flex items-center gap-1">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'in_stock', 'low_stock', 'out_of_stock'].map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setFilter('status', s)}
            className={`px-3 py-1.5 rounded-full text-sm ${status === s ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200'}`}
          >
            {s ? s.replace('_', ' ') : 'All'}
          </button>
        ))}
        <input
          className="admin-input max-w-xs ml-auto"
          placeholder="Search..."
          value={search}
          onChange={(e) => setFilter('search', e.target.value)}
        />
      </div>

      {selected.size > 0 && (
        <div className="bg-slate-50 border rounded-lg p-3 mb-4 flex gap-3 items-center text-sm">
          <span>Bulk add:</span>
          <input type="number" className="admin-input w-20" value={bulkDelta} onChange={(e) => setBulkDelta(Number(e.target.value))} />
          <select className="admin-input w-auto" value={bulkReason} onChange={(e) => setBulkReason(e.target.value)}>
            {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-left">
            <tr>
              <th className="p-3 w-8" />
              <th className="p-3">Product</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Reorder</th>
              <th className="p-3">Status</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-slate-100">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(r.id);
                      else next.delete(r.id);
                      setSelected(next);
                    }}
                  />
                </td>
                <td className="p-3">
                  <strong>{r.name}</strong>
                  <div className="text-slate-400 text-xs">{r.brand} · {r.category}</div>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => adjust(r.id, -1, 'correction')} className="p-1 border rounded"><Minus size={12} /></button>
                    <InlineEdit value={r.stock_quantity} onSave={(v) => patchStock(r.id, v, r.reorder_level)} />
                    <button onClick={() => adjust(r.id, 1, 'restock')} className="p-1 border rounded"><Plus size={12} /></button>
                  </div>
                </td>
                <td className="p-3">
                  <InlineEdit value={r.reorder_level} onSave={(v) => patchStock(r.id, r.stock_quantity, v)} />
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                    {r.status.replace('_', ' ')}
                  </span>
                </td>
                <td className="p-3">
                  <button onClick={() => setAdjustModal(r)} className="text-emerald-600 text-xs mr-2">Adjust</button>
                  <button onClick={() => showHistory(r.id)} className="text-slate-400 hover:text-slate-700"><History size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {adjustModal && (
        <AdjustModal row={adjustModal} onClose={() => setAdjustModal(null)} onSave={adjust} reasons={REASONS} />
      )}
      {historyModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-end z-50">
          <div className="bg-white w-full max-w-md h-full p-6 overflow-y-auto">
            <h2 className="font-bold mb-4">Adjustment history</h2>
            {history.map((h) => (
              <div key={h.id} className="border-b py-3 text-sm">
                <div className="flex justify-between">
                  <span className={h.delta > 0 ? 'text-green-600' : 'text-red-600'}>{h.delta > 0 ? '+' : ''}{h.delta}</span>
                  <span className="text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                </div>
                <p className="text-slate-500">{h.reason} · {h.admin_email}</p>
                <p className="text-xs text-slate-400">{h.quantity_before} → {h.quantity_after}</p>
              </div>
            ))}
            <button onClick={() => setHistoryModal(null)} className="mt-4 text-sm text-slate-500">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

function InlineEdit({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [v, setV] = useState(value);
  if (!editing) {
    return (
      <button onClick={() => { setV(value); setEditing(true); }} className="font-medium min-w-[2rem] text-center hover:bg-slate-100 rounded px-1">
        {value}
      </button>
    );
  }
  return (
    <input
      type="number"
      className="admin-input w-16 py-1"
      value={v}
      autoFocus
      onBlur={() => { onSave(Number(v)); setEditing(false); }}
      onKeyDown={(e) => { if (e.key === 'Enter') { onSave(Number(v)); setEditing(false); } }}
      onChange={(e) => setV(e.target.value)}
    />
  );
}

function AdjustModal({ row, onClose, onSave, reasons }) {
  const [delta, setDelta] = useState(10);
  const [reason, setReason] = useState('restock');
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-sm">
        <h2 className="font-bold mb-2">Adjust stock</h2>
        <p className="text-sm text-slate-500 mb-4">{row.name} (current: {row.stock_quantity})</p>
        <label className="text-xs text-slate-500">Delta (+/-)</label>
        <input type="number" className="admin-input mb-3" value={delta} onChange={(e) => setDelta(Number(e.target.value))} />
        <label className="text-xs text-slate-500">Reason</label>
        <select className="admin-input mb-4" value={reason} onChange={(e) => setReason(e.target.value)}>
          {reasons.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <div className="flex gap-2">
          <button onClick={() => onSave(row.id, delta, reason)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm">Apply</button>
          <button onClick={onClose} className="text-slate-500 text-sm">Cancel</button>
        </div>
      </div>
    </div>
  );
}
