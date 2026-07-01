import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../api/client';
import { Badge, Card, Tile } from '../components/Layout';
import { Forecast, Vehicle } from '../types';

export function Dashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ vehicles: Vehicle[] }>('/vehicles')
      .then(async (data) => {
        setVehicles(data.vehicles);
        if (data.vehicles[0]) {
          const firstForecast = await api<Forecast>(`/vehicles/${data.vehicles[0].id}/forecast`);
          setForecast(firstForecast);
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <Card><p className="text-orange">{error}</p></Card>;

  if (!vehicles.length) {
    return (
      <Card className="text-center">
        <h1 className="font-display text-3xl font-semibold">No vehicles yet</h1>
        <p className="mt-2 text-muted">Add a vehicle to start forecasting maintenance.</p>
        <Link to="/vehicles" className="mt-6 inline-block rounded-xl bg-primary px-5 py-3 font-label font-semibold text-white">Add Vehicle</Link>
      </Card>
    );
  }

  const next = forecast?.next_service;
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold">Fleet Overview</h1>
          <p className="text-muted">Real-time status of your vehicle maintenance plan.</p>
        </div>
        <Link to="/vehicles" className="rounded-xl bg-primary px-5 py-3 font-label font-semibold text-white">Manage Garage</Link>
      </div>
      <div className="grid gap-px overflow-hidden border border-line bg-line md:grid-cols-5">
        <Tile wide label="Next Service" value={next?.display_name || 'Needs history'} status={next?.status} />
        <Tile label="Overdue" value={String(forecast?.overdue_count || 0)} status={(forecast?.overdue_count || 0) > 0 ? 'Overdue' : 'Completed'} />
        <Tile label="Twelve-Month Estimate" value={`$${forecast?.twelve_month_min || 0}-${forecast?.twelve_month_max || 0}`} />
        <Tile label="Most Expensive Month" value={forecast?.most_expensive_month?.label || 'None'} />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <h2 className="font-display text-2xl font-semibold">12-Month Cost Timeline</h2>
          <div className="mt-6 h-80">
            <ResponsiveContainer>
              <BarChart data={forecast?.timeline || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="max_cost" fill="#003ec7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-2xl font-semibold">Garage</h2>
          <div className="mt-4 divide-y divide-line-soft">
            {vehicles.map((vehicle) => (
              <Link key={vehicle.id} to={`/vehicles/${vehicle.id}`} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-semibold">{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</div>
                  <div className="font-label text-sm text-muted">{vehicle.current_mileage.toLocaleString()} mi</div>
                </div>
                <Badge>Open</Badge>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
