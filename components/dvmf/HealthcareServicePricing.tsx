'use client';

import { useEffect, useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface HealthcareServicePricingProps {
  services: any[];
}

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

export function HealthcareServicePricing({ services }: HealthcareServicePricingProps) {
  const [rows, setRows] = useState<any[]>(services || []);
  const [editing, setEditing] = useState<any | null>(null);
  const [formState, setFormState] = useState<any>({
    service_name: '',
    description: '',
    is_paid: false,
    base_fee: 0,
    duration_minutes: 60,
    is_active: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(services || []);
  }, [services]);

  const openCreate = () => {
    setEditing({ id: null });
    setFormState({
      service_name: '',
      description: '',
      is_paid: false,
      base_fee: 0,
      duration_minutes: 60,
      is_active: true,
    });
    setError(null);
  };

  const openEdit = (service: any) => {
    setEditing(service);
    setFormState({
      id: service.id,
      service_name: service.service_name,
      description: service.description || '',
      is_paid: Boolean(service.is_paid),
      base_fee: Number(service.base_fee || 0),
      duration_minutes: Number(service.duration_minutes || 60),
      is_active: Boolean(service.is_active),
    });
    setError(null);
  };

  const saveService = () => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const payload = {
        ...(formState.id ? { id: formState.id } : {}),
        service_name: String(formState.service_name || '').trim(),
        description: String(formState.description || '').trim(),
        is_paid: Boolean(formState.is_paid),
        base_fee: Number(formState.base_fee || 0),
        duration_minutes: Math.max(15, Number(formState.duration_minutes || 60)),
        is_active: Boolean(formState.is_active),
      };

      if (!payload.service_name) {
        setError('Service name is required.');
        return;
      }

      const result = await callApiAction<any>('healthcare', 'saveDvmfHealthcareService', [payload]);
      if (!result.success || result.error || !result.data) {
        setError(result.error || 'Failed to save healthcare service');
        return;
      }

      const saved = result.data;
      setRows((current) => {
        const exists = current.some((row) => row.id === saved.id);
        if (exists) {
          return current.map((row) => (row.id === saved.id ? saved : row));
        }
        return [...current, saved].sort((a, b) => String(a.service_name).localeCompare(String(b.service_name)));
      });

      setSuccess('Healthcare service saved.');
      setEditing(null);
      setTimeout(() => setSuccess(null), 2500);
    });
  };

  const deactivateService = (serviceId: string) => {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'removeDvmfHealthcareService', [serviceId]);
      if (!result.success || result.error) {
        setError(result.error || 'Failed to deactivate service');
        return;
      }

      setRows((current) => current.map((row) => (row.id === serviceId ? { ...row, is_active: false } : row)));
      setSuccess('Service deactivated.');
      setTimeout(() => setSuccess(null), 2500);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Service Pricing</h3>
          <p className="text-sm text-gray-500">Manage healthcare services, pricing, billing type, and consultation duration.</p>
        </div>
        <button type="button" onClick={openCreate} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700">
          Add Service
        </button>
      </div>

      {error ? <div className="mx-5 mt-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div> : null}
      {success ? <div className="mx-5 mt-4 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">{success}</div> : null}

      {!rows.length ? (
        <div className="p-8 text-center">
          <div className="text-4xl mb-3">💉</div>
          <p className="text-gray-600 font-medium">No healthcare services configured yet.</p>
          <p className="text-gray-400 text-sm mt-1">Create your branch services so requesters can book by branch and availability.</p>
        </div>
      ) : null}

      {rows.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Service</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Billing</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Duration</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Base Fee</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((service) => (
              <tr key={service.id} className="border-b last:border-b-0 border-gray-100 hover:bg-orange-50/60 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{service.service_name}</p>
                  {service.description ? <p className="text-xs text-gray-500 mt-0.5">{service.description}</p> : null}
                </td>
                <td className="px-4 py-3">
                  {service.is_paid ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800">Paid</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">Free</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700">{Number(service.duration_minutes || 60)} min</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {service.is_paid ? currencyFormatter.format(Number(service.base_fee || 0)) : 'PHP 0.00'}
                </td>
                <td className="px-4 py-3">
                  {service.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Active</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">Inactive</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => openEdit(service)} className="px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50">
                      Edit
                    </button>
                    {service.is_active ? (
                      <button type="button" disabled={isPending} onClick={() => deactivateService(service.id)} className="px-2.5 py-1 rounded-lg border border-red-300 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-60">
                        Deactivate
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      ) : null}

      {editing ? (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-xl p-5 space-y-3">
            <h4 className="text-lg font-semibold text-gray-900">{formState.id ? 'Edit Healthcare Service' : 'Add Healthcare Service'}</h4>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Service Name</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={formState.service_name} onChange={(event) => setFormState((current: any) => ({ ...current, service_name: event.target.value }))} />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} value={formState.description} onChange={(event) => setFormState((current: any) => ({ ...current, description: event.target.value }))} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={Boolean(formState.is_paid)} onChange={(event) => setFormState((current: any) => ({ ...current, is_paid: event.target.checked }))} />
                Paid Service
              </label>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Base Fee (PHP)</label>
                <input type="number" min={0} step={0.01} disabled={!formState.is_paid} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={Number(formState.base_fee || 0)} onChange={(event) => setFormState((current: any) => ({ ...current, base_fee: Number(event.target.value || 0) }))} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Duration (minutes)</label>
                <input type="number" min={15} step={5} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={Number(formState.duration_minutes || 60)} onChange={(event) => setFormState((current: any) => ({ ...current, duration_minutes: Number(event.target.value || 60) }))} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button>
              <button type="button" onClick={saveService} disabled={isPending} className="px-3 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
                {isPending ? 'Saving...' : 'Save Service'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
