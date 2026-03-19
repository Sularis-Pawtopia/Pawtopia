'use client';

import { useEffect, useMemo, useState, useTransition, type FormEvent } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface HealthcareBookingCardProps {
  initialBranches: any[];
  initialServices: any[];
  initialPets: any[];
  canAddPet?: boolean;
}

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function HealthcareBookingCard({ initialBranches, initialServices, initialPets, canAddPet = false }: HealthcareBookingCardProps) {
  const [branches] = useState<any[]>(initialBranches || []);
  const [services] = useState<any[]>(initialServices || []);
  const [pets, setPets] = useState<any[]>(initialPets || []);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedPetId, setSelectedPetId] = useState('');
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [slots, setSlots] = useState<any[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [addPetError, setAddPetError] = useState<string | null>(null);
  const [isAddingPet, startAddPetTransition] = useTransition();

  const servicesForBranch = useMemo(
    () => services.filter((service) => service.is_active !== false && service.dvmf_id === selectedBranchId),
    [services, selectedBranchId]
  );

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [services, selectedServiceId]
  );

  useEffect(() => {
    if (!selectedBranchId || !selectedService || !selectedDate) {
      setSlots([]);
      setSelectedSlotId('');
      return;
    }

    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'getBranchAvailabilitySlots', [selectedBranchId, selectedService.id, selectedDate]);

      if (!result.success || result.error) {
        setError(result.error || 'Failed to load available healthcare slots');
        setSlots([]);
        return;
      }

      setError(null);
      setSlots(result.data || []);
      setSelectedSlotId('');
    });
  }, [selectedBranchId, selectedService, selectedDate]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!selectedBranchId) {
      setError('Please choose a DVMF branch first.');
      return;
    }

    if (!selectedService) {
      setError('Please choose a branch service.');
      return;
    }

    if (!selectedDate) {
      setError('Please choose an appointment date.');
      return;
    }

    if (!selectedPetId) {
      setError('Please select an adopter-owned pet.');
      return;
    }

    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'createHealthcareAppointmentRequest', [
        {
          dvmf_id: selectedService.dvmf_id,
          pet_id: selectedPetId,
          service_id: selectedService.id,
          slot_id: selectedSlotId || undefined,
          reason: reason || undefined,
          requester_notes: notes || undefined,
        },
      ]);

      if (!result.success || result.error) {
        setError(result.error || 'Failed to submit healthcare appointment request');
        return;
      }

      setSuccess('Healthcare appointment request submitted for DVMF review.');
      setReason('');
      setNotes('');
      setSelectedDate('');
      setSelectedSlotId('');
      setTimeout(() => setSuccess(null), 3500);
    });
  };

  const today = new Date();
  const minDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().slice(0, 10);
  const maxDateObj = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  maxDateObj.setDate(maxDateObj.getDate() + 30);
  const maxDate = maxDateObj.toISOString().slice(0, 10);

  const serviceFee = Number(selectedService?.base_fee || 0);
  const platformFee = selectedService?.is_paid
    ? Number(process.env.NEXT_PUBLIC_HEALTHCARE_PLATFORM_SERVICE_FEE_PHP || 0)
    : 0;
  const totalFee = selectedService?.is_paid ? serviceFee + platformFee : 0;

  const onAddPetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAddPetError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') || '').trim();
    const species = String(formData.get('species') || '').trim();

    if (!name || !species) {
      setAddPetError('Pet name and species are required.');
      return;
    }

    startAddPetTransition(async () => {
      const payload = {
        name,
        species,
        breed: String(formData.get('breed') || '').trim() || undefined,
        age_years: formData.get('age_years') ? Number(formData.get('age_years')) : undefined,
        age_months: formData.get('age_months') ? Number(formData.get('age_months')) : undefined,
        gender: (String(formData.get('gender') || 'unknown') as 'male' | 'female' | 'unknown'),
        size: (String(formData.get('size') || 'medium') as 'small' | 'medium' | 'large' | 'extra_large'),
        color: String(formData.get('color') || '').trim() || undefined,
        weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
        is_vaccinated: formData.get('is_vaccinated') === 'on',
        is_spayed_neutered: formData.get('is_spayed_neutered') === 'on',
        medical_history: String(formData.get('medical_history') || '').trim() || undefined,
        temperament: String(formData.get('temperament') || 'friendly').split(',').map((value) => value.trim()).filter(Boolean),
        good_with_kids: undefined,
        good_with_dogs: undefined,
        good_with_cats: undefined,
        energy_level: (String(formData.get('energy_level') || 'medium') as 'low' | 'medium' | 'high'),
        special_needs: undefined,
        description: String(formData.get('description') || `Meet ${name}!`).trim(),
        tags: [],
      };

      if (!payload.temperament.length) {
        payload.temperament = ['friendly'];
      }

      const result = await callApiAction<any>('pets', 'createAdopterPet', [payload, []]);
      if (!result.success || result.error || !result.data) {
        setAddPetError(result.error || 'Failed to add pet');
        return;
      }

      const newPet = result.data;
      setPets((current) => {
        const next = [newPet, ...current];
        const deduped = next.filter((pet, index) => next.findIndex((candidate) => candidate.id === pet.id) === index);
        return deduped;
      });
      setSelectedPetId(newPet.id);
      setShowAddPetModal(false);
      setSuccess('Pet added successfully. You can now use it for healthcare requests.');
      setTimeout(() => setSuccess(null), 2500);
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">Book DVMF Healthcare Service</h3>
      <p className="text-xs text-gray-500 mb-4">Select an adopter-owned pet, service, and slot. DVMF approval is required before confirmation.</p>

      {error ? (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">{error}</div>
      ) : null}
      {success ? (
        <div className="mb-3 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-xs">{success}</div>
      ) : null}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">DVMF Branch</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={selectedBranchId}
            onChange={(event) => {
              setSelectedBranchId(event.target.value);
              setSelectedServiceId('');
              setSelectedDate('');
              setSelectedSlotId('');
              setSlots([]);
            }}
            disabled={isPending}
          >
            <option value="">Select a DVMF branch</option>
            {branches.map((branch) => (
              <option key={branch.user_id} value={branch.user_id}>
                {branch.organization_name || branch.user?.username || 'DVMF Branch'}
                {branch.city ? ` (${branch.city})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Branch Service</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={selectedServiceId}
            onChange={(event) => {
              setSelectedServiceId(event.target.value);
              setSelectedDate('');
              setSelectedSlotId('');
              setSlots([]);
            }}
            disabled={isPending || !selectedBranchId}
          >
            <option value="">Select a branch service</option>
            {servicesForBranch.map((service) => (
              <option key={service.id} value={service.id}>
                {service.service_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Date</label>
          <input
            type="date"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            min={minDate}
            max={maxDate}
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(event.target.value);
              setSelectedSlotId('');
            }}
            disabled={isPending || !selectedService}
          />
          <p className="mt-1 text-[11px] text-gray-500">Time options are generated from branch opening hours and existing bookings.</p>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-xs font-medium text-gray-700">Adopter-Owned Pet</label>
            {canAddPet ? (
              <button
                type="button"
                onClick={() => {
                  setAddPetError(null);
                  setShowAddPetModal(true);
                }}
                className="text-[11px] font-semibold text-primary-700 hover:text-primary-800"
              >
                + Add pet
              </button>
            ) : null}
          </div>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={selectedPetId}
            onChange={(event) => setSelectedPetId(event.target.value)}
            disabled={isPending}
          >
            <option value="">Select a pet</option>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name} ({pet.species}) - owner: {pet.owner?.username || 'Unknown'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Preferred Slot</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            value={selectedSlotId}
            onChange={(event) => setSelectedSlotId(event.target.value)}
            disabled={isPending || !selectedService || !selectedDate}
          >
            <option value="">Choose slot (optional)</option>
            {slots.map((slot) => (
              <option key={slot.id} value={slot.id}>
                {dateTimeFormatter.format(new Date(slot.slot_start))} ({slot.approved_bookings_count}/{slot.capacity} booked)
              </option>
            ))}
          </select>
          {selectedService && selectedDate && slots.length === 0 ? (
            <p className="mt-1 text-[11px] text-amber-700">No available time slots for this date. Try another date.</p>
          ) : null}
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Brief concern or request"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isPending}
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Notes for DVMF</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
            rows={3}
            placeholder="Additional context"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            disabled={isPending}
          />
        </div>

        {selectedService ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 space-y-1">
            <p className="font-semibold text-gray-800">Pricing Summary</p>
            <div className="flex justify-between">
              <span>Service Fee</span>
              <span>{selectedService.is_paid ? money.format(serviceFee) : 'PHP 0.00'}</span>
            </div>
            <div className="flex justify-between">
              <span>Platform Service Fee</span>
              <span>{selectedService.is_paid ? money.format(platformFee) : 'PHP 0.00'}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>{selectedService.is_paid ? money.format(totalFee) : 'PHP 0.00 (Free Service)'}</span>
            </div>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isPending}
          className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-60 text-sm font-medium"
        >
          {isPending ? 'Submitting...' : 'Submit Healthcare Request'}
        </button>
      </form>

      {showAddPetModal ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center">
          <div className="w-full max-w-2xl bg-white rounded-xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-gray-900">Add Pet</h4>
              <button type="button" onClick={() => setShowAddPetModal(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
            </div>

            {addPetError ? (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">{addPetError}</div>
            ) : null}

            <form className="space-y-3" onSubmit={onAddPetSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <input name="name" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Species</label>
                  <input name="species" required placeholder="Dog, Cat, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Breed</label>
                  <input name="breed" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Color</label>
                  <input name="color" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Gender</label>
                  <select name="gender" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Size</label>
                  <select name="size" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="extra_large">Extra Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Age (years)</label>
                  <input name="age_years" type="number" min={0} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Age (months)</label>
                  <input name="age_months" type="number" min={0} max={11} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input name="weight" type="number" min={0} step={0.1} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Energy Level</label>
                  <select name="energy_level" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Temperament (comma-separated)</label>
                <input name="temperament" placeholder="friendly, playful, calm" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} placeholder="Tell us about your pet..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Medical History (optional)</label>
                <textarea name="medical_history" rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-700">
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="is_vaccinated" /> Vaccinated</label>
                <label className="inline-flex items-center gap-2"><input type="checkbox" name="is_spayed_neutered" /> Spayed/Neutered</label>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAddPetModal(false)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">Cancel</button>
                <button type="submit" disabled={isAddingPet} className="px-3 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
                  {isAddingPet ? 'Adding...' : 'Add Pet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
