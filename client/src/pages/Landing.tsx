import { Link } from 'react-router-dom';
import { BarChart3, Car, ShieldCheck, Wrench } from 'lucide-react';

export function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-6 md:px-12">
        <div className="font-display text-2xl font-bold text-primary">mAIntenance</div>
        <div className="flex gap-3">
          <Link className="rounded-xl border border-line px-4 py-2 font-label text-sm text-primary" to="/login">Log in</Link>
          <Link className="rounded-xl bg-primary px-4 py-2 font-label text-sm text-white" to="/register">Register</Link>
        </div>
      </header>
      <section className="mx-auto grid max-w-[1280px] gap-8 px-4 py-10 md:grid-cols-[1fr_1.1fr] md:px-12">
        <div className="flex flex-col justify-center">
          <h1 className="font-display text-5xl font-bold leading-tight text-ink">mAIntenance</h1>
          <p className="mt-4 font-display text-3xl font-semibold text-primary">See what&apos;s due before it becomes overdue.</p>
          <p className="mt-5 max-w-xl text-lg text-muted">Track vehicles, maintenance history, upcoming service, cost exposure, and AI-powered vehicle-specific recommendations in one focused dashboard.</p>
          <div className="mt-8 flex gap-3">
            <Link className="rounded-xl bg-primary px-5 py-3 font-label font-semibold text-white" to="/register">Start tracking</Link>
            <Link className="rounded-xl border border-line px-5 py-3 font-label font-semibold text-primary" to="/login">Log in</Link>
          </div>
        </div>
        <div className="card p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="font-label text-xs uppercase tracking-wider text-muted">Example dashboard</div>
              <div className="font-display text-2xl font-semibold">2014 BMW 328i</div>
            </div>
            <Car className="text-primary" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['Next Service', 'Oil change', Wrench],
              ['12-Month Estimate', '$1,125 - $2,540', BarChart3],
              ['AI Recommendation', 'Timing chain inspection', ShieldCheck],
              ['Most Expensive Month', 'Oct 2026', BarChart3],
            ].map(([label, value, Icon]) => (
              <div key={label as string} className="rounded-lg border border-line-soft bg-surface-soft p-4">
                <Icon className="mb-4 text-primary" />
                <div className="font-label text-xs uppercase tracking-wider text-muted">{label as string}</div>
                <div className="mt-1 font-display text-xl font-semibold">{value as string}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
