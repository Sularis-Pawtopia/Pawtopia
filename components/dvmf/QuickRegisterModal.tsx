'use client';

import { useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { notify } from '@/lib/ui/notify';

interface QuickRegisterModalProps {
  pet: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickRegisterModal({ pet, onClose, onSuccess }: QuickRegisterModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    markings: '',
    owner_name: '',
    owner_address: '',
    notes: '',
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!form.markings.trim() || !form.owner_name.trim() || !form.owner_address.trim()) {
      setError('Markings, owner name, and owner address are required.');
      return;
    }

    startTransition(async () => {
      const result = await callApiAction<any>('dvmf', 'createDvmfRegistryFromAdoptable', [{
        petId: pet.id,
        markings: form.markings.trim(),
        owner_name: form.owner_name.trim(),
        owner_address: form.owner_address.trim(),
        notes: form.notes.trim() || undefined,
      }]);

      if (!result.success || result.error) {
        const message = result.error || 'Failed to register pet';
        setError(message);
        notify.error({ title: 'Quick register failed', description: message });
        return;
      }

      notify.success({ title: 'Pet registered', description: `${pet.name} has been added to pet registry.` });
      onSuccess?.();
      onClose();
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Quick Register {pet.name}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {error ? <div className="text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">{error}</div> : null}

          <div className="grid grid-cols-2 gap-3 bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">Pet</p>
              <p className="font-semibold text-gray-900">{pet.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Sex</p>
              <p className="font-semibold text-gray-900 capitalize">{pet.gender || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Vaccinated</p>
              <p className="font-semibold text-gray-900">{pet.is_vaccinated ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Spayed/Neutered</p>
              <p className="font-semibold text-gray-900">{pet.is_spayed_neutered ? 'Yes' : 'No'}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Markings *</label>
            <textarea
              value={form.markings}
              onChange={(event) => setForm((prev) => ({ ...prev, markings: event.target.value }))}
              rows={2}
              placeholder="Distinct physical markings"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
            <input
              value={form.owner_name}
              onChange={(event) => setForm((prev) => ({ ...prev, owner_name: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Owner Address *</label>
            <input
              value={form.owner_address}
              onChange={(event) => setForm((prev) => ({ ...prev, owner_address: event.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((prev) => ({ ...prev, notes: event.target.value }))}
              rows={2}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm">Cancel</button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
              {isPending ? 'Registering...' : 'Register Pet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
