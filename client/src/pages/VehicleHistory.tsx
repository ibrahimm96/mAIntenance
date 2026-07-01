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

  if (error) return <Card title="ERROR"><p className="text-orange">{error}</p></Card>;
  if (!vehicle) return <Card title="LOADING"><p className="text-muted">Loading history...</p></Card>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 border-b border-line pb-3 md:flex-row md:items-end">
        <div>
          <h1 className="font-label text-lg font-bold tracking-tight text-ink">{(vehicle.nickname || `${vehicle.year} ${vehicle.make} ${vehicle.model}`).toUpperCase()}</h1>
          <p className="font-label text-xs text-muted">service history // maintenance records</p>
        </div>
        <div className="readout text-xs text-muted">{services.length} records</div>
      </div>
      <VehicleTabs vehicleId={vehicle.id} />

      <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card title={editingServiceId ? 'EDIT_SERVICE' : 'ADD_SERVICE'}>
          {editingServiceId && (
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs text-muted">Update the selected service record.</p>
              <button onClick={cancelServiceEdit} className="btn btn-outline">CANCEL</button>
            </div>
          )}
          <form onSubmit={saveService} className="grid gap-3">
            <select value={serviceForm.service_type} onChange={(event) => setServiceForm({ ...serviceForm, service_type: event.target.value })} className="field" required>{serviceTypes.map((type) => <option key={type}>{type}</option>)}</select>
            <input value={serviceForm.service_date} onChange={(event) => setServiceForm({ ...serviceForm, service_date: event.target.value })} className="field" type="date" required />
            <input value={serviceForm.service_mileage} onChange={(event) => setServiceForm({ ...serviceForm, service_mileage: event.target.value })} className="field" type="number" placeholder="Mileage completed" required />
            <input value={serviceForm.cost} onChange={(event) => setServiceForm({ ...serviceForm, cost: event.target.value })} className="field" type="number" min="0" step="0.01" placeholder="Cost" />
            <textarea value={serviceForm.notes} onChange={(event) => setServiceForm({ ...serviceForm, notes: event.target.value })} className="field" placeholder="Notes" />
            <button className="btn btn-solid">{editingServiceId ? 'SAVE_SERVICE' : 'ADD_SERVICE'}</button>
          </form>
        </Card>

        <Card title="SERVICE_HISTORY">
          <table className="data-table">
            <thead>
              <tr><th>Date</th><th>Service</th><th>Mileage</th><th>Cost</th><th /></tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td className="readout whitespace-nowrap">{service.service_date}</td>
                  <td>{service.service_type}</td>
                  <td className="readout">{service.service_mileage.toLocaleString()}</td>
                  <td className="readout">${service.cost}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => editService(service)} className="font-label text-xs font-bold text-ink hover:text-primary-bright">EDIT</button>
                      <button onClick={() => deleteService(service.id)} className="font-label text-xs font-bold text-orange">DEL</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!services.length && <p className="py-6 text-center text-sm text-muted">Add the last completed service to improve this forecast.</p>}
        </Card>
      </div>
    </div>
  );
}
