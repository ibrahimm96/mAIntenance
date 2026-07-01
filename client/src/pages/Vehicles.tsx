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
    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
      <Card title={editing ? 'EDIT_VEHICLE' : 'REGISTER_VEHICLE'}>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
          {['nickname', 'year', 'make', 'model', 'trim', 'engine', 'current_mileage', 'monthly_mileage'].map((key) => (
            <label key={key} className={key === 'nickname' ? 'sm:col-span-2' : ''}>
              <span className="mb-1 block font-label text-[0.65rem] font-bold uppercase tracking-widest text-muted">{key.replace('_', ' ')}</span>
              <input className="field" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} required={['year', 'make', 'model', 'current_mileage', 'monthly_mileage'].includes(key)} type={['year', 'current_mileage', 'monthly_mileage'].includes(key) ? 'number' : 'text'} />
            </label>
          ))}
          {error && <div className="border border-orange bg-orange-soft p-2 text-sm text-orange sm:col-span-2">{error}</div>}
          <div className="flex justify-end gap-2 sm:col-span-2">
            {editing && <button type="button" onClick={() => { setEditing(null); setForm(emptyVehicle); }} className="btn btn-outline">CANCEL</button>}
            <button className="btn btn-solid">{editing ? 'SAVE_CHANGES' : 'SAVE_VEHICLE'}</button>
          </div>
        </form>
      </Card>
      <Card title="MY_GARAGE">
        <table className="data-table">
          <thead>
            <tr><th>Vehicle</th><th /></tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>
                  <Link to={`/vehicles/${vehicle.id}`} className="font-semibold text-ink hover:text-primary-bright">{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</Link>
                  <div className="readout text-xs text-muted">{vehicle.current_mileage.toLocaleString()} mi · {vehicle.monthly_mileage.toLocaleString()} mi/mo</div>
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => edit(vehicle)} className="btn btn-outline">EDIT</button>
                    <button onClick={() => remove(vehicle.id)} className="btn btn-outline text-orange">DEL</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!vehicles.length && <p className="py-6 text-center text-sm text-muted">No vehicles added yet.</p>}
      </Card>
    </div>
  );
}
