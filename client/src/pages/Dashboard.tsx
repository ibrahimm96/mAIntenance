import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Badge, Card, Ledger, LedgerCell } from '../components/Layout';
import { Forecast, ServiceRecord, Vehicle } from '../types';

type FleetCostHistoryMonth = {
  month: string;
  label: string;
  total_cost: number;
  services: string[];
};

function buildFleetCostHistory(recordsByVehicle: Array<{ vehicle: Vehicle; services: ServiceRecord[] }>): FleetCostHistoryMonth[] {
  const buckets = new Map<string, FleetCostHistoryMonth>();

  recordsByVehicle.forEach(({ vehicle, services }) => {
    services.forEach((service) => {
      const date = new Date(`${service.service_date}T00:00:00`);
      const month = service.service_date.slice(0, 7);
      const label = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      const existing = buckets.get(month) || { month, label, total_cost: 0, services: [] };
      existing.total_cost += Number(service.cost || 0);
      existing.services.push(`${vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}: ${service.service_type}`);
      buckets.set(month, existing);
    });
  });

  return Array.from(buckets.values()).sort((a, b) => a.month.localeCompare(b.month));
}

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [costHistory, setCostHistory] = useState<FleetCostHistoryMonth[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ vehicles: Vehicle[] }>('/vehicles')
      .then(async (data) => {
        setVehicles(data.vehicles);
        const serviceGroups = await Promise.all(
          data.vehicles.map(async (vehicle) => {
            const serviceData = await api<{ services: ServiceRecord[] }>(`/vehicles/${vehicle.id}/services`);
            return { vehicle, services: serviceData.services };
          })
        );
        setCostHistory(buildFleetCostHistory(serviceGroups));
        if (data.vehicles[0]) {
          const firstForecast = await api<Forecast>(`/vehicles/${data.vehicles[0].id}/forecast`);
          setForecast(firstForecast);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Card title="ERROR"><p className="text-orange">{error}</p></Card>;

  if (!vehicles.length) {
    return (
      <Card title="FLEET_OVERVIEW" className="text-center">
        <h1 className="font-display text-xl font-bold">NO_VEHICLES_FOUND</h1>
        <p className="mt-2 text-sm text-muted">Add a vehicle to start forecasting maintenance.</p>
        <Link to="/vehicles" className="btn btn-solid mt-6 inline-flex">+ ADD VEHICLE</Link>
      </Card>
    );
  }

  const next = forecast?.next_service;
  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-line pb-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-label text-lg font-bold tracking-tight text-ink">FLEET_OVERVIEW</h1>
          <p className="font-label text-xs text-muted">real-time status // vehicle maintenance plan</p>
        </div>
        <Link to="/vehicles" className="btn btn-solid">MANAGE GARAGE</Link>
      </div>

      <Ledger>
        <LedgerCell label="NEXT_SERVICE" value={next?.display_name || 'Needs history'} status={next?.status} />
        <LedgerCell label="OVERDUE" value={String(forecast?.overdue_count || 0)} status={(forecast?.overdue_count || 0) > 0 ? 'Overdue' : 'Completed'} />
        <LedgerCell label="12MO_EST" value={`$${forecast?.twelve_month_min || 0}-${forecast?.twelve_month_max || 0}`} />
        <LedgerCell label="PEAK_MONTH" value={forecast?.most_expensive_month?.label || 'None'} />
      </Ledger>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card title="FLEET_COST_HISTORY">
          <div className="h-72">
            {costHistory.length ? (
              <ResponsiveContainer>
                <BarChart data={costHistory}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#2a2d28" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#7d8177' }} axisLine={{ stroke: '#2a2d28' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#7d8177' }} axisLine={{ stroke: '#2a2d28' }} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#141714', border: '1px solid #2a2d28', borderRadius: 0, fontSize: 12 }}
                    formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Fleet cost']}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload as FleetCostHistoryMonth | undefined;
                      return item ? `${label}: ${item.services.join(', ')}` : label;
                    }}
                  />
                  <Bar dataKey="total_cost" fill="#ff6a1f" radius={0} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted">Add service records to build fleet cost history.</div>
            )}
          </div>
        </Card>
        <Card title="GARAGE_INDEX">
          <table className="data-table">
            <thead>
              <tr><th>Vehicle</th><th>Mileage</th><th /></tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id}>
                  <td>
                    <Link to={`/vehicles/${vehicle.id}`} className="font-semibold text-ink hover:text-primary-bright">
                      {vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    </Link>
                  </td>
                  <td className="readout text-muted">{vehicle.current_mileage.toLocaleString()} mi</td>
                  <td className="text-right"><Badge>OPEN</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
