import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/Layout';
import { Vehicle } from '../types';

const emptyVehicle = { nickname: '', year: '', make: '', model: '', trim: '', engine: '', current_mileage: '', monthly_mileage: '' };

export function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState<Record<string, string>>(emptyVehicle);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = () => api<{ vehicles: Vehicle[] }>('/vehicles').then((data) => setVehicles(data.vehicles)).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    const body = JSON.stringify({ ...form, year: Number(form.year), current_mileage: Number(form.current_mileage), monthly_mileage: Number(form.monthly_mileage) });
    try {
      if (editing) await api(`/vehicles/${editing}`, { method: 'PUT', body });
      else await api('/vehicles', { method: 'POST', body });
      setForm(emptyVehicle);
      setEditing(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save vehicle');
    }
  }

  function edit(vehicle: Vehicle) {
    setEditing(vehicle.id);
    setForm({
      nickname: vehicle.nickname || '',
      year: String(vehicle.year),
      make: vehicle.make,
      model: vehicle.model,
      trim: vehicle.trim || '',
      engine: vehicle.engine || '',
      current_mileage: String(vehicle.current_mileage),
      monthly_mileage: String(vehicle.monthly_mileage),
    });
  }

  async function remove(id: number) {
    await api(`/vehicles/${id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <Card>
        <h1 className="font-display text-3xl font-semibold">{editing ? 'Edit Vehicle' : 'Register New Vehicle'}</h1>
        <p className="mt-1 text-muted">Add details to start tracking maintenance.</p>
        <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
          {['nickname', 'year', 'make', 'model', 'trim', 'engine', 'current_mileage', 'monthly_mileage'].map((key) => (
            <label key={key} className={key === 'nickname' ? 'sm:col-span-2' : ''}>
              <span className="mb-1 block font-label text-xs font-bold uppercase tracking-wider text-muted">{key.replace('_', ' ')}</span>
              <input className="field" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={['year', 'make', 'model', 'current_mileage', 'monthly_mileage'].includes(key)} type={['year', 'current_mileage', 'monthly_mileage'].includes(key) ? 'number' : 'text'} />
            </label>
          ))}
          {error && <div className="rounded-lg bg-orange-soft p-3 text-orange sm:col-span-2">{error}</div>}
          <div className="flex justify-end gap-3 sm:col-span-2">
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyVehicle); }} className="rounded-xl border border-line px-5 py-3 font-label font-semibold text-primary">Cancel</button>}
            <button className="rounded-xl bg-primary px-5 py-3 font-label font-semibold text-white">{editing ? 'Save Changes' : 'Save Vehicle'}</button>
          </div>
        </form>
      </Card>
      <Card>
        <h2 className="font-display text-2xl font-semibold">My Garage</h2>
        <div className="mt-4 divide-y divide-line-soft">
          {vehicles.map((vehicle) => (
            <div key={vehicle.id} className="py-4">
              <Link to={`/vehicles/${vehicle.id}`} className="font-semibold text-primary">{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</Link>
              <div className="font-label text-sm text-muted">{vehicle.current_mileage.toLocaleString()} mi · {vehicle.monthly_mileage.toLocaleString()} mi/mo</div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => edit(vehicle)} className="rounded-lg border border-line px-3 py-2 text-sm text-primary">Edit</button>
                <button onClick={() => remove(vehicle.id)} className="rounded-lg border border-line px-3 py-2 text-sm text-orange">Delete</button>
              </div>
            </div>
          ))}
          {!vehicles.length && <p className="py-6 text-muted">No vehicles added yet.</p>}
        </div>
      </Card>
    </div>
  );
}
