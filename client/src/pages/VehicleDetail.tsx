import { useEffect, useState } from 'react';
import { NavLink, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Badge, Card, Ledger, LedgerCell } from '../components/Layout';
import { Forecast, ServiceRecord, Vehicle } from '../types';

type CostHistoryMonth = {
  month: string;
  label: string;
  total_cost: number;
  services: string[];
};

function buildCostHistory(services: ServiceRecord[]): CostHistoryMonth[] {
  const buckets = new Map<string, CostHistoryMonth>();

  services.forEach((service) => {
    const date = new Date(`${service.service_date}T00:00:00`);
    const month = service.service_date.slice(0, 7);
    const label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
    const existing = buckets.get(month) || { month, label, total_cost: 0, services: [] };
    existing.total_cost += Number(service.cost || 0);
    existing.services.push(service.service_type);
    buckets.set(month, existing);
  });

  return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function VehicleDetail() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [error, setError] = useState('');

  const load = async () => {
    if (!vehicleId) return;
    const [vehicleData, forecastData, serviceData] = await Promise.all([
      api<{ vehicle: Vehicle }>(`/vehicles/${vehicleId}`),
      api<Forecast>(`/vehicles/${vehicleId}/forecast`),
      api<{ services: ServiceRecord[] }>(`/vehicles/${vehicleId}/services`),
    ]);
    setVehicle(vehicleData.vehicle);
    setForecast(forecastData);
    setServices(serviceData.services);
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, [vehicleId]);

  if (error) return <Card title="ERROR"><p className="text-orange">{error}</p></Card>;
  if (!vehicle || !forecast) return <Card title="LOADING"><p className="text-muted">Loading vehicle...</p></Card>;
  const costHistory = buildCostHistory(services);

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

      <Card title="COST_HISTORY">
        <div className="h-64">
          {costHistory.length ? (
            <ResponsiveContainer>
              <BarChart data={costHistory}>
                <CartesianGrid strokeDasharray="2 4" stroke="#2a2d28" />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7d8177' }} axisLine={{ stroke: '#2a2d28' }} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#7d8177' }} axisLine={{ stroke: '#2a2d28' }} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#141714', border: '1px solid #2a2d28', borderRadius: 0, fontSize: 12 }}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Cost']}
                  labelFormatter={(label, payload) => {
                    const item = payload?.[0]?.payload as CostHistoryMonth | undefined;
                    return item ? `${label}: ${item.services.join(', ')}` : label;
                  }}
                />
                <Bar dataKey="total_cost" fill="#ff6a1f" radius={0} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">Add service records to build the vehicle cost history.</div>
          )}
        </div>
      </Card>

      <Card title="UPCOMING_MAINTENANCE">
        <table className="data-table">
          <thead>
            <tr><th>Item</th><th>Due</th><th /></tr>
          </thead>
          <tbody>
            {forecast.items.map((item, index) => (
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
