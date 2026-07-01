import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Badge, Card, Ledger, LedgerCell } from '../components/Layout';
import { Forecast, RecommendationSet, Vehicle } from '../types';

export function VehicleDetail() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationSet | null>(null);
  const [error, setError] = useState('');
  const [aiError, setAiError] = useState('');
  const [generating, setGenerating] = useState(false);

  const load = async () => {
    if (!vehicleId) return;
    const [vehicleData, forecastData, recommendationData] = await Promise.all([
      api<{ vehicle: Vehicle }>(`/vehicles/${vehicleId}`),
      api<Forecast>(`/vehicles/${vehicleId}/forecast`),
      api<{ recommendations: RecommendationSet | null }>(`/vehicles/${vehicleId}/recommendations`),
    ]);
    setVehicle(vehicleData.vehicle);
    setForecast(forecastData);
    setRecommendations(recommendationData.recommendations);
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, [vehicleId]);

  async function generateRecommendations() {
    setGenerating(true);
    setAiError('');
    try {
      const data = await api<{ recommendations: RecommendationSet }>(`/vehicles/${vehicleId}/recommendations/generate`, { method: 'POST' });
      setRecommendations(data.recommendations);
      await load();
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'AI recommendation generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function setRecommendationStatus(id: number, status: 'approved' | 'rejected' | 'pending') {
    await api(`/recommendation-items/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await load();
  }

  if (error) return <Card title="ERROR"><p className="text-orange">{error}</p></Card>;
  if (!vehicle || !forecast) return <Card title="LOADING"><p className="text-muted">Loading vehicle...</p></Card>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-line pb-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-label text-lg font-bold tracking-tight text-ink">{(vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`).toUpperCase()}</h1>
          <p className="font-label text-xs text-muted">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''} {vehicle.engine || ''}</p>
        </div>
        <div className="readout text-xs text-muted">{vehicle.current_mileage.toLocaleString()} mi · {vehicle.monthly_mileage.toLocaleString()} mi/mo</div>
      </div>
      <VehicleTabs vehicleId={vehicle.id} />

      <Ledger>
        <LedgerCell label="NEXT_SERVICE" value={forecast.next_service?.display_name || 'Needs history'} status={forecast.next_service?.status} />
        <LedgerCell label="MILEAGE" value={vehicle.current_mileage.toLocaleString()} />
        <LedgerCell label="OVERDUE" value={String(forecast.overdue_count)} status={forecast.overdue_count ? 'Overdue' : 'Completed'} />
        <LedgerCell label="12MO_COST" value={`$${forecast.twelve_month_min}-${forecast.twelve_month_max}`} />
      </Ledger>

      <Card title="COST_TIMELINE">
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={forecast.timeline}>
              <CartesianGrid strokeDasharray="2 4" stroke="#2a2d28" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7d8177' }} axisLine={{ stroke: '#2a2d28' }} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#7d8177' }} axisLine={{ stroke: '#2a2d28' }} tickLine={false} />
              <Tooltip contentStyle={{ background: '#141714', border: '1px solid #2a2d28', borderRadius: 0, fontSize: 12 }} />
              <Bar dataKey="max_cost" fill="#ff6a1f" radius={0} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card title="UPCOMING_MAINTENANCE">
          <table className="data-table">
            <thead>
              <tr><th>Item</th><th>Due</th><th /></tr>
            </thead>
            <tbody>
              {[...forecast.items, ...forecast.ai_items].map((item, index) => (
                <tr key={`${item.source}-${item.id || index}`}>
                  <td>
                    <div className="font-semibold text-ink">{item.display_name}</div>
                    <p className="mt-0.5 text-xs text-muted">{item.message}</p>
                  </td>
                  <td className="readout whitespace-nowrap text-xs text-muted">{item.due_date || 'No date'}<br />{item.due_mileage ? `${item.due_mileage.toLocaleString()} mi` : 'varies'}</td>
                  <td className="text-right"><Badge status={item.status}>{item.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="AI_RECOMMENDATIONS">
          <div className="flex items-start justify-between gap-4">
            <p className="text-xs text-muted">Structured, vehicle-specific items require approval before they affect totals.</p>
            <button disabled={generating} onClick={generateRecommendations} className="btn btn-solid shrink-0 disabled:opacity-60">{generating ? 'RUNNING...' : 'GENERATE'}</button>
          </div>
          {aiError && <div className="mt-3 border border-orange bg-orange-soft p-2 text-xs text-orange">{aiError}</div>}
          {recommendations ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-muted">{recommendations.summary}</p>
              <p className="border border-line-soft bg-surface-soft p-2 text-xs text-muted">{recommendations.disclaimer}</p>
              {recommendations.items.map((item) => (
                <div key={item.id} className="border border-line-soft p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-ink">{item.title}</div>
                      <div className="mt-1 font-label text-[0.65rem] uppercase tracking-wider text-muted">{item.category} · ${item.estimated_min_cost}-{item.estimated_max_cost}</div>
                    </div>
                    <Badge>{item.status}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted">{item.rationale}</p>
                  {item.symptoms && <p className="mt-2 text-sm text-muted"><strong className="text-ink">Watch for:</strong> {item.symptoms}</p>}
                  {item.mechanic_questions && <p className="mt-2 text-sm text-muted"><strong className="text-ink">Ask:</strong> {item.mechanic_questions}</p>}
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => setRecommendationStatus(item.id, 'approved')} className="btn btn-solid">APPROVE</button>
                    <button onClick={() => setRecommendationStatus(item.id, 'rejected')} className="btn btn-outline text-orange">REJECT</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-muted">Generate recommendations once vehicle history is ready. Existing recommendations are replaced when regenerated.</p>}
        </Card>
      </div>
    </div>
  );
}

export function VehicleTabs({ vehicleId }: { vehicleId: number }) {
  const tabClass = ({ isActive }: { isActive: boolean }) => `border-r border-line px-4 py-2 font-label text-xs font-bold tracking-widest last:border-r-0 ${isActive ? 'bg-surface-blue text-primary-bright' : 'text-muted hover:bg-surface-soft hover:text-ink'}`;
  return (
    <div className="flex border border-line" style={{ width: 'fit-content' }}>
      <NavLink to={`/vehicles/${vehicleId}`} end className={tabClass}>OVERVIEW</NavLink>
      <NavLink to={`/vehicles/${vehicleId}/history`} className={tabClass}>HISTORY</NavLink>
    </div>
  );
}
