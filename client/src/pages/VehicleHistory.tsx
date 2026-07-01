import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import { Card } from '../components/Layout';
import { ServiceRecord, Vehicle } from '../types';
import { VehicleTabs } from './VehicleDetail';

const serviceTypes = ['Oil change', 'Tire rotation', 'Tire replacement', 'Brake service', 'Brake fluid', 'Battery', 'Spark plugs', 'Coolant', 'Transmission fluid', 'Air filter', 'Registration', 'Custom service'];
const emptyServiceForm = { service_type: 'Oil change', service_date: '', service_mileage: '', cost: '', notes: '' };

export function VehicleHistory() {
  const { vehicleId } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [editingServiceId, setEditingServiceId] = useState<number | null>(null);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [error, setError] = useState('');

  const load = async () => {
    if (!vehicleId) return;
    const [vehicleData, serviceData] = await Promise.all([
      api<{ vehicle: Vehicle }>(`/vehicles/${vehicleId}`),
      api<{ services: ServiceRecord[] }>(`/vehicles/${vehicleId}/services`),
    ]);
    setVehicle(vehicleData.vehicle);
    setServices(serviceData.services);
  };

  useEffect(() => { load().catch((err) => setError(err.message)); }, [vehicleId]);

  async function saveService(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      await api(editingServiceId ? `/services/${editingServiceId}` : `/vehicles/${vehicleId}/services`, {
        method: editingServiceId ? 'PUT' : 'POST',
        body: JSON.stringify({
          service_type: serviceForm.service_type,
          service_date: serviceForm.service_date,
          service_mileage: Number(serviceForm.service_mileage),
          cost: Number(serviceForm.cost || 0),
          notes: serviceForm.notes,
        }),
      });
      cancelServiceEdit();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save service');
    }
  }

  function editService(service: ServiceRecord) {
    setEditingServiceId(service.id);
    setServiceForm({
      service_type: service.service_type,
      service_date: service.service_date,
      service_mileage: String(service.service_mileage),
      cost: String(service.cost),
      notes: service.notes || '',
    });
  }

  function cancelServiceEdit() {
    setEditingServiceId(null);
    setServiceForm(emptyServiceForm);
  }

  async function deleteService(id: number) {
    await api(`/services/${id}`, { method: 'DELETE' });
    if (editingServiceId === id) cancelServiceEdit();
    await load();
  }

  if (error) return <Card><p className="text-orange">{error}</p></Card>;
  if (!vehicle) return <Card><p className="text-muted">Loading history...</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-4xl font-semibold">{vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`}</h1>
          <p className="text-muted">Service history and maintenance records</p>
        </div>
        <div className="font-label text-sm font-semibold text-muted">{services.length} records</div>
      </div>
      <VehicleTabs vehicleId={vehicle.id} />

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-semibold">{editingServiceId ? 'Edit Service' : 'Add Service'}</h2>
              {editingServiceId && <p className="mt-1 text-sm text-muted">Update the selected service record.</p>}
            </div>
            {editingServiceId && <button onClick={cancelServiceEdit} className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-primary">Cancel</button>}
          </div>
          <form onSubmit={saveService} className="mt-4 grid gap-3">
            <select value={serviceForm.service_type} onChange={(event) => setServiceForm({ ...serviceForm, service_type: event.target.value })} className="field" required>{serviceTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <input value={serviceForm.service_date} onChange={(event) => setServiceForm({ ...serviceForm, service_date: event.target.value })} className="field" type="date" required />
            <input value={serviceForm.service_mileage} onChange={(event) => setServiceForm({ ...serviceForm, service_mileage: event.target.value })} className="field" type="number" placeholder="Mileage completed" required />
            <input value={serviceForm.cost} onChange={(event) => setServiceForm({ ...serviceForm, cost: event.target.value })} className="field" type="number" min="0" step="0.01" placeholder="Cost" />
            <textarea value={serviceForm.notes} onChange={(event) => setServiceForm({ ...serviceForm, notes: event.target.value })} className="field" placeholder="Notes" />
            <button className="rounded-xl bg-primary px-5 py-3 font-label font-semibold text-white">{editingServiceId ? 'Save Service' : 'Add Service'}</button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-2xl font-semibold">Service History</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-soft font-label text-xs uppercase tracking-wider text-muted">
                <tr><th className="p-3">Date</th><th className="p-3">Service</th><th className="p-3">Mileage</th><th className="p-3">Cost</th><th className="p-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {services.map((service) => (
                  <tr key={service.id}>
                    <td className="p-3">{service.service_date}</td>
                    <td className="p-3">{service.service_type}</td>
                    <td className="p-3">{service.service_mileage.toLocaleString()}</td>
                    <td className="p-3">${service.cost}</td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button onClick={() => editService(service)} className="font-semibold text-primary">Edit</button>
                        <button onClick={() => deleteService(service.id)} className="font-semibold text-orange">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!services.length && <p className="py-6 text-muted">Add the last completed service to improve this forecast.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
