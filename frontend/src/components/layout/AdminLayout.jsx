import { NavLink, Navigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Boxes, Wine, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/inventory', icon: Boxes, label: 'Inventory' },
  { to: '/admin/orders', icon: ShoppingBag, label: 'Orders' },
];

export default function AdminLayout() {
  const { user, loading, isAdmin, logout } = useAuth();

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading…</div>;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen flex bg-slate-100">
      <aside className="w-56 bg-slate-900 text-slate-300 flex flex-col p-4 shrink-0">
        <div className="flex items-center gap-2 text-white font-bold text-lg mb-8 px-2">
          <Wine className="text-emerald-400" size={22} />
          Admin
        </div>
        <nav className="space-y-1 flex-1">
          {links.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-slate-800 pt-4 text-xs text-slate-500 px-2">
          {user.email}
          <button onClick={logout} className="flex items-center gap-2 mt-2 text-slate-400 hover:text-white text-sm">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
