import { Car, Gauge, LogOut, Plus, Search } from 'lucide-react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const nav = [
  { to: '/dashboard', label: 'DASHBOARD', icon: Gauge },
  { to: '/vehicles', label: 'GARAGE', icon: Car },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="sticky top-0 z-40 flex h-12 items-center gap-4 border-b border-line bg-surface px-3 md:px-4">
        <Link to="/dashboard" className="flex items-center gap-2 pr-4">
          <span className="inline-block h-2 w-2 bg-primary-bright" />
          <span className="font-label text-sm font-bold tracking-tight text-ink">Maintenance Tracker</span>
        </Link>
        <nav className="hidden items-stretch gap-0 border-l border-line md:flex">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 border-r border-line px-4 font-label text-xs font-bold tracking-widest transition ${
                    isActive ? 'bg-surface-blue text-primary-bright' : 'text-muted hover:bg-surface-soft hover:text-ink'
                  }`
                }
              >
                <Icon size={14} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="relative hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-muted" size={14} />
          <input className="field h-8 border-line bg-surface-soft py-0 pl-7 text-xs" placeholder="search vehicles or services..." />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => navigate('/vehicles')} className="btn btn-outline hidden h-8 py-0 md:inline-flex">
            <Plus size={14} /> VEHICLE
          </button>
          <div className="flex h-7 w-7 items-center justify-center border border-line bg-surface-soft font-label text-xs font-bold text-primary-bright">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <button onClick={logout} className="flex h-7 w-7 items-center justify-center border border-line text-muted hover:border-primary-bright hover:text-primary-bright" title="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </header>
      <nav className="flex border-b border-line bg-surface md:hidden">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-1 items-center justify-center gap-2 border-r border-line py-2 font-label text-xs font-bold tracking-widest last:border-r-0 ${
                  isActive ? 'bg-surface-blue text-primary-bright' : 'text-muted'
                }`
              }
            >
              <Icon size={14} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
      <main className="mx-auto max-w-[1400px] p-3 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

export function Card({ children, className = '', title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="panel-head">
          <span><span className="dot" />{title}</span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export function Ledger({ children }: { children: React.ReactNode }) {
  return <div className="ledger" style={{ gridTemplateColumns: `repeat(${Array.isArray(children) ? children.length : 1}, minmax(0, 1fr))` }}>{children}</div>;
}

export function LedgerCell({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <div className="ledger-cell">
      <div className="ledger-label">{label}</div>
      <div className="ledger-value truncate">{value}</div>
      {status && <div className="mt-2"><Badge status={status}>{status}</Badge></div>}
    </div>
  );
}

export function Badge({ children, status = 'neutral' }: { children: React.ReactNode; status?: string }) {
  const color =
    status === 'Overdue' ? 'text-orange' :
    status === 'Due soon' ? 'text-primary-bright' :
    status === 'Needs history' ? 'text-muted' :
    'text-emerald-400';
  return <span className={`tag ${color}`}>{children}</span>;
}
