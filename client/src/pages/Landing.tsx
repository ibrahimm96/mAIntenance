import { Link } from 'react-router-dom';
import { BarChart3, Car, Gauge, Wrench } from 'lucide-react';

export function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="flex h-12 items-center gap-4 border-b border-line bg-surface px-3 md:px-6">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 bg-primary-bright" />
          <span className="font-label text-sm font-bold text-ink">Maintenance Tracker</span>
        </div>
        <div className="ml-auto flex gap-2">
          <Link className="btn btn-outline" to="/login">LOG_IN</Link>
          <Link className="btn btn-solid" to="/register">REGISTER</Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1280px] gap-6 p-3 md:grid-cols-[1fr_1.1fr] md:p-6">
        <div className="flex flex-col justify-center border border-line bg-surface p-6">
          <div className="font-label text-xs tracking-widest text-muted">// VEHICLE_MAINTENANCE_TRACKER</div>
          <h1 className="mt-2 font-label text-4xl font-bold leading-tight text-ink">Maintenance Tracker</h1>
          <p className="mt-3 font-label text-xl font-semibold text-primary-bright">See what&apos;s due before it becomes overdue.</p>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted">Track vehicles, maintenance history, upcoming service, and cost exposure in one focused dashboard.</p>
          <div className="mt-6 flex gap-2">
            <Link className="btn btn-solid" to="/register">START_TRACKING</Link>
            <Link className="btn btn-outline" to="/login">LOG_IN</Link>
          </div>
        </div>

        <div className="card">
          <div className="panel-head">
            <span><span className="dot" />EXAMPLE_DASHBOARD // 2014 BMW 328i</span>
            <Car size={14} className="text-muted" />
          </div>
          <div className="grid grid-cols-2">
            {[
              ['NEXT_SERVICE', 'Oil change', Wrench],
              ['12MO_ESTIMATE', '$1,125-2,540', BarChart3],
              ['CURRENT_MILEAGE', '82,000 mi', Gauge],
              ['PEAK_MONTH', 'Oct 2026', BarChart3],
            ].map(([label, value, Icon], index) => (
              <div key={label as string} className={`border-line p-4 ${index % 2 === 0 ? 'border-r' : ''} ${index < 2 ? 'border-b' : ''}`}>
                <Icon size={16} className="mb-3 text-primary-bright" />
                <div className="font-label text-[0.65rem] uppercase tracking-widest text-muted">{label as string}</div>
                <div className="readout mt-1 text-lg font-bold text-ink">{value as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
