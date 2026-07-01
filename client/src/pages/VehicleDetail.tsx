import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Badge, Card } from '../components/Layout';
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

  if (error) return <Card><p className="text-orange">{error}</p></Card>;
  if (!vehicle || !forecast) return <Card><p className="text-muted">Loading vehicle...</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold">{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h1>
          <p className="text-muted">{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim || ''} {vehicle.engine || ''}</p>
        </div>
        <div className="font-label text-sm font-semibold text-muted">{vehicle.current_mileage.toLocaleString()} current miles · {vehicle.monthly_mileage.toLocaleString()} mi/mo</div>
      </div>
      <VehicleTabs vehicleId={vehicle.id} />

      <div className="grid gap-6 md:grid-cols-4">
        <Summary label="Next Service" value={forecast.next_service?.display_name || 'Needs history'} status={forecast.next_service?.status} />
        <Summary label="Current Mileage" value={vehicle.current_mileage.toLocaleString()} />
        <Summary label="Overdue Count" value={String(forecast.overdue_count)} status={forecast.overdue_count ? 'Overdue' : 'Completed'} />
        <Summary label="12-Month Cost" value={`$${forecast.twelve_month_min} - $${forecast.twelve_month_max}`} />
      </div>

      <div className="grid gap-6">
        <Card>
          <h2 className="font-display text-2xl font-semibold">Cost Timeline</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={forecast.timeline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="max_cost" fill="#003ec7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-semibold">Upcoming Maintenance</h2>
          <div className="mt-4 divide-y divide-line-soft">
            {[...forecast.items, ...forecast.ai_items].map((item, index) => (
              <div key={`${item.source}-${item.id || index}`} className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{item.display_name}</div>
                    <p className="mt-1 text-sm text-muted">{item.message}</p>
                    <div className="mt-2 font-label text-xs text-muted">{item.due_date || 'No due date'} · {item.due_mileage ? `${item.due_mileage.toLocaleString()} mi` : 'Mileage varies'}</div>
                  </div>
                  <Badge status={item.status}>{item.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">AI Recommendations</h2>
              <p className="mt-1 text-sm text-muted">Structured, vehicle-specific items require approval before they affect totals.</p>
            </div>
            <button disabled={generating} onClick={generateRecommendations} className="rounded-xl bg-primary px-4 py-3 font-label text-sm font-semibold text-white disabled:opacity-60">{generating ? 'Generating...' : 'Generate'}</button>
          </div>
          {aiError && <div className="mt-4 rounded-lg bg-orange-soft p-3 text-sm text-orange">{aiError}</div>}
          {recommendations ? (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-muted">{recommendations.summary}</p>
              <p className="rounded-lg bg-surface-soft p-3 text-xs text-muted">{recommendations.disclaimer}</p>
              {recommendations.items.map((item) => (
                <div key={item.id} className="rounded-lg border border-line-soft p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold">{item.title}</div>
                      <div className="mt-1 font-label text-xs uppercase tracking-wider text-muted">{item.category} · ${item.estimated_min_cost} - ${item.estimated_max_cost}</div>
                    </div>
                    <Badge>{item.status}</Badge>
                  </div>
                  <p className="mt-3 text-sm text-muted">{item.rationale}</p>
                  {item.symptoms && <p className="mt-2 text-sm text-muted"><strong>Watch for:</strong> {item.symptoms}</p>}
                  {item.mechanic_questions && <p className="mt-2 text-sm text-muted"><strong>Ask:</strong> {item.mechanic_questions}</p>}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => setRecommendationStatus(item.id, 'approved')} className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white">Approve</button>
                    <button onClick={() => setRecommendationStatus(item.id, 'rejected')} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-orange">Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="mt-5 text-muted">Generate recommendations once vehicle history is ready. Existing recommendations are replaced when regenerated.</p>}
        </Card>
      </div>
    </div>
  );
}

export function VehicleTabs({ vehicleId }: { vehicleId: number }) {
  const tabClass = ({ isActive }: { isActive: boolean }) => `rounded-lg px-4 py-2 font-label text-sm font-semibold ${isActive ? 'bg-primary text-white' : 'border border-line text-primary hover:bg-surface-soft'}`;
  return (
    <div className="flex gap-3 border-b border-line-soft pb-4">
      <NavLink to={`/vehicles/${vehicleId}`} end className={tabClass}>Overview</NavLink>
      <NavLink to={`/vehicles/${vehicleId}/history`} className={tabClass}>History</NavLink>
    </div>
  );
}

function Summary({ label, value, status }: { label: string; value: string; status?: string }) {
  return (
    <Card>
      <div className="font-label text-xs font-bold uppercase tracking-wider text-muted">{label}</div>
      <div className="mt-3 font-display text-2xl font-semibold text-primary-bright">{value}</div>
      {status && <div className="mt-4"><Badge status={status}>{status}</Badge></div>}
    </Card>
  );
}
