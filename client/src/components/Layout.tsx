import { Car, Gauge, LogOut, Plus, Search, Settings } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const nav = [
  { to: '/dashboard', label: 'Dashboard', icon: Gauge },
  { to: '/vehicles', label: 'My Garage', icon: Car },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-ink">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 flex-col border-r border-line bg-background px-4 py-6 md:flex">
        <Link to="/dashboard" className="mb-10 px-2">
          <div className="font-display text-2xl font-bold text-primary">mAIntenance</div>
          <div className="font-label text-xs font-semibold uppercase tracking-wider text-muted">Vehicle care</div>
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `flex items-center gap-3 rounded-lg px-4 py-3 transition ${isActive ? 'border-r-4 border-primary bg-surface-blue font-semibold text-primary' : 'text-muted hover:bg-surface-blue hover:text-primary'}`}>
                <Icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <button onClick={() => navigate('/vehicles')} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 font-label text-sm font-semibold text-white">
          <Plus size={18} /> Add Vehicle
        </button>
        <button onClick={logout} className="flex items-center gap-3 rounded-lg px-4 py-3 text-muted hover:bg-surface-blue hover:text-primary">
          <LogOut size={18} /> Sign out
        </button>
      </aside>
      <main className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-background px-4 shadow-sm md:px-12">
          <div className="relative hidden w-full max-w-md md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" size={18} />
            <input className="field rounded-full bg-surface-soft py-2 pl-10" placeholder="Search vehicles or services..." />
          </div>
          <div className="flex items-center gap-3 md:ml-auto">
            <button onClick={() => navigate('/vehicles')} className="rounded-full border border-line px-4 py-2 font-label text-sm text-muted hover:bg-surface-soft">Vehicle Selector</button>
            <Settings size={20} className="text-muted" />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{user?.name?.[0] || 'U'}</div>
          </div>
        </header>
        <div className="mx-auto max-w-[1280px] p-4 md:p-12">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card p-6 ${className}`}>{children}</section>;
}

export function Badge({ children, status = 'neutral' }: { children: React.ReactNode; status?: string }) {
  const color = status === 'Overdue' ? 'bg-orange-soft text-orange' : status === 'Due soon' ? 'bg-surface-blue text-primary' : status === 'Needs history' ? 'bg-surface-soft text-muted' : 'bg-emerald-50 text-emerald-700';
  return <span className={`rounded px-2 py-1 font-label text-xs font-bold uppercase tracking-wide ${color}`}>{children}</span>;
}
