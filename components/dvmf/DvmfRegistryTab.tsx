'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { createClient } from '@/lib/supabase/client';
import { PetDetailModal } from '@/components/pets/PetDetailModal';

interface RegistryRecord {
  id: string;
  pet_name: string;
  markings: string;
  sex: 'male' | 'female';
  birth_date: string | null;
  is_vaccinated: boolean;
  last_vaccination_date: string | null;
  is_spayed_neutered: boolean;
  owner_name: string;
  owner_address: string;
  pet_photo_url?: string | null;
  created_at: string;
  notes?: string | null;
}

interface DvmfRegistryTabProps {
  initialRecords: RegistryRecord[];
}

const defaultForm = {
  pet_name: '',
  markings: '',
  sex: 'male' as 'male' | 'female',
  birth_date: '',
  is_vaccinated: false,
  last_vaccination_date: '',
  is_spayed_neutered: false,
  owner_name: '',
  owner_address: '',
  pet_photo_url: '',
  notes: '',
};

const dateOnlyFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Manila',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Manila',
});

function formatDateMDY(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return dateOnlyFormatter.format(date);
}

function formatDateTimeMDY(value?: string | null) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${dateTimeFormatter.format(date)} PHT`;
}

function calculateAgeLabel(birthDate?: string | null) {
  if (!birthDate) return 'Age unknown';
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return 'Age unknown';

  const now = new Date();
  let years = now.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = now.getUTCDate() - birth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    years -= 1;
  }

  if (years < 0) return 'Age unknown';
  if (years === 0) return '< 1 year old';
  if (years === 1) return '1 year old';
  return `${years} years old`;
}

export function DvmfRegistryTab({ initialRecords }: DvmfRegistryTabProps) {
  const [records, setRecords] = useState(initialRecords);
  const [form, setForm] = useState(defaultForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [removeCurrentPhoto, setRemoveCurrentPhoto] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sexFilter, setSexFilter] = useState<'all' | 'male' | 'female'>('all');
  const [vaccinatedFilter, setVaccinatedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [spayedFilter, setSpayedFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [viewingRecord, setViewingRecord] = useState<RegistryRecord | null>(null);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const selectedPhotoPreview = useMemo(() => {
    if (!selectedPhoto) return '';
    return URL.createObjectURL(selectedPhoto);
  }, [selectedPhoto]);

  useEffect(() => {
    return () => {
      if (selectedPhotoPreview) {
        URL.revokeObjectURL(selectedPhotoPreview);
      }
    };
  }, [selectedPhotoPreview]);

  const uploadPetPhoto = async (file: File) => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const ext = file.name.split('.').pop();
    const path = `${user.id}/dvmf-registry/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('pet-images')
      .upload(path, file);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data: publicUrlData } = supabase.storage
      .from('pet-images')
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  };

  const resetForm = () => {
    setForm(defaultForm);
    setEditingId(null);
    setSelectedPhoto(null);
    setRemoveCurrentPhoto(false);
  };

  const startEdit = (record: RegistryRecord) => {
    setEditingId(record.id);
    setError('');
    setSelectedPhoto(null);
    setRemoveCurrentPhoto(false);
    setForm({
      pet_name: record.pet_name,
      markings: record.markings,
      sex: record.sex,
      birth_date: record.birth_date || '',
      is_vaccinated: record.is_vaccinated,
      last_vaccination_date: record.last_vaccination_date || '',
      is_spayed_neutered: record.is_spayed_neutered,
      owner_name: record.owner_name,
      owner_address: record.owner_address,
      pet_photo_url: record.pet_photo_url || '',
      notes: record.notes || '',
    });
  };

  const onDelete = (id: string) => {
    setError('');

    const confirmed = window.confirm('Delete this registry record? This action cannot be undone.');
    if (!confirmed) return;

    startTransition(async () => {
      const result = await callApiAction('dvmf', 'deleteDvmfRegistryRecord', [id]);
      if (!result.success) {
        setError(result.error || 'Failed to delete record');
        return;
      }

      setRecords((prev) => prev.filter((r) => r.id !== id));
      if (editingId === id) {
        resetForm();
      }
    });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (editingId) {
      const confirmed = window.confirm('Confirm updating this registry record?');
      if (!confirmed) return;
    }

    startTransition(async () => {
      let petPhotoUrl = removeCurrentPhoto ? '' : form.pet_photo_url;

      if (selectedPhoto) {
        try {
          petPhotoUrl = await uploadPetPhoto(selectedPhoto);
        } catch (uploadError: any) {
          setError(uploadError?.message || 'Failed to upload pet photo');
          return;
        }
      }

      const payload = {
        ...form,
        pet_photo_url: petPhotoUrl || undefined,
        birth_date: form.birth_date || undefined,
        last_vaccination_date: form.last_vaccination_date || undefined,
        notes: form.notes || undefined,
      };

      const result = editingId
        ? await callApiAction('dvmf', 'updateDvmfRegistryRecord', [{ id: editingId, ...payload }])
        : await callApiAction('dvmf', 'createDvmfRegistryRecord', [payload]);

      if (!result.success || !result.data) {
        setError(result.error || (editingId ? 'Failed to update record' : 'Failed to create record'));
        return;
      }

      if (editingId) {
        setRecords((prev) => prev.map((r) => (r.id === editingId ? (result.data as RegistryRecord) : r)));
      } else {
        setRecords((prev) => [result.data as RegistryRecord, ...prev]);
      }
      resetForm();
    });
  };

  const filteredRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return records.filter((record) => {
      if (sexFilter !== 'all' && record.sex !== sexFilter) {
        return false;
      }

      if (vaccinatedFilter === 'yes' && !record.is_vaccinated) {
        return false;
      }

      if (vaccinatedFilter === 'no' && record.is_vaccinated) {
        return false;
      }

      if (spayedFilter === 'yes' && !record.is_spayed_neutered) {
        return false;
      }

      if (spayedFilter === 'no' && record.is_spayed_neutered) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        record.pet_name,
        record.markings,
        record.sex,
        record.owner_name,
        record.owner_address,
        record.notes || '',
        record.is_vaccinated ? 'vaccinated yes true' : 'vaccinated no false',
        record.is_spayed_neutered ? 'spayed neutered yes true' : 'spayed neutered no false',
        formatDateMDY(record.birth_date),
        calculateAgeLabel(record.birth_date),
        formatDateMDY(record.last_vaccination_date),
        formatDateTimeMDY(record.created_at),
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [records, searchQuery, sexFilter, vaccinatedFilter, spayedFilter]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 xl:h-[calc(100vh-13rem)]">
        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[560px] xl:min-h-0">
          <div className="px-5 py-4 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit Pet Owner Record' : 'Register Pet Owner Record'}
            </h3>
            <p className="text-xs text-gray-500 mt-1">Capture pet and owner details with complete vaccination and sterilization data.</p>
          </div>

          <div className="p-5 overflow-y-auto">
            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pet_name" className="block text-sm font-medium text-gray-700 mb-1">Pet Name</label>
            <input id="pet_name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Panpan" value={form.pet_name} onChange={(e) => setForm({ ...form, pet_name: e.target.value })} required />
          </div>

          <div>
            <label htmlFor="markings" className="block text-sm font-medium text-gray-700 mb-1">Markings</label>
            <input id="markings" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Brown ears, white paws" value={form.markings} onChange={(e) => setForm({ ...form, markings: e.target.value })} required />
          </div>

          <div>
            <label htmlFor="sex" className="block text-sm font-medium text-gray-700 mb-1">Sex</label>
            <select id="sex" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value as 'male' | 'female' })}>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div>
            <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">Birth Date (MM/DD/YYYY)</label>
            <input id="birth_date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
          </div>

          <div className="flex items-center gap-3">
            <input id="is_vaccinated" type="checkbox" checked={form.is_vaccinated} onChange={(e) => setForm({ ...form, is_vaccinated: e.target.checked, last_vaccination_date: e.target.checked ? form.last_vaccination_date : '' })} />
            <label htmlFor="is_vaccinated" className="text-sm text-gray-700">Vaccinated?</label>
          </div>

          <div>
            <label htmlFor="last_vaccination_date" className="block text-sm font-medium text-gray-700 mb-1">Last Vaccination Date (MM/DD/YYYY)</label>
            <input id="last_vaccination_date" type="date" className="w-full px-3 py-2 border border-gray-300 rounded-lg" value={form.last_vaccination_date} onChange={(e) => setForm({ ...form, last_vaccination_date: e.target.value })} disabled={!form.is_vaccinated} />
          </div>

          <div className="flex items-center gap-3">
            <input id="is_spayed_neutered" type="checkbox" checked={form.is_spayed_neutered} onChange={(e) => setForm({ ...form, is_spayed_neutered: e.target.checked })} />
            <label htmlFor="is_spayed_neutered" className="text-sm text-gray-700">Spayed/Neutered?</label>
          </div>
          <div />

          <div>
            <label htmlFor="owner_name" className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
            <input id="owner_name" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Yurii" value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} required />
          </div>

          <div>
            <label htmlFor="owner_address" className="block text-sm font-medium text-gray-700 mb-1">Owner Address</label>
            <input id="owner_address" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Street, City" value={form.owner_address} onChange={(e) => setForm({ ...form, owner_address: e.target.value })} required />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="pet_photo" className="block text-sm font-medium text-gray-700 mb-1">Pet Photo (optional)</label>
            <input
              id="pet_photo"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setSelectedPhoto(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />

            <div className="mt-2 flex flex-wrap items-start gap-4">
              {form.pet_photo_url && !removeCurrentPhoto && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Current</p>
                  <img src={form.pet_photo_url} alt="Current pet" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                </div>
              )}

              {selectedPhotoPreview && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Preview</p>
                  <img src={selectedPhotoPreview} alt="Selected preview" className="w-20 h-20 rounded-lg object-cover border border-gray-200" />
                </div>
              )}
            </div>

            {(form.pet_photo_url && !removeCurrentPhoto) && (
              <button
                type="button"
                className="mt-2 text-sm text-red-600 hover:text-red-700"
                onClick={() => setRemoveCurrentPhoto(true)}
              >
                Remove current photo
              </button>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea id="notes" className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Additional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="md:col-span-2 flex gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel Edit
              </button>
            )}
            <button disabled={isPending} className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {isPending ? 'Saving...' : editingId ? 'Update Registry Record' : 'Save Registry Record'}
            </button>
          </div>
            </form>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-[560px] xl:min-h-0">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <h3 className="font-semibold text-gray-900">Registry Records</h3>
            <span className="text-sm text-gray-500">{filteredRecords.length} of {records.length} total</span>
          </div>

          <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search everything (pet, owner, birth date, age, vaccine status, address, notes, created date...)"
              className="md:col-span-4 px-3 py-2 border border-gray-300 rounded-lg"
            />
            <select value={sexFilter} onChange={(e) => setSexFilter(e.target.value as 'all' | 'male' | 'female')} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Sex</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select value={vaccinatedFilter} onChange={(e) => setVaccinatedFilter(e.target.value as 'all' | 'yes' | 'no')} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Vaccination</option>
              <option value="yes">Vaccinated</option>
              <option value="no">Not Vaccinated</option>
            </select>
            <select value={spayedFilter} onChange={(e) => setSpayedFilter(e.target.value as 'all' | 'yes' | 'no')} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="all">All Spay/Neuter</option>
              <option value="yes">Spayed/Neutered</option>
              <option value="no">Not Spayed/Neutered</option>
            </select>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSexFilter('all');
                setVaccinatedFilter('all');
                setSpayedFilter('all');
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-white"
            >
              Reset Filters
            </button>
          </div>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="w-full text-sm min-w-[920px]">
              <thead className="sticky top-0 bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">Pet</th>
                <th className="text-left px-4 py-3">Birth Date / Age</th>
                <th className="text-left px-4 py-3">Owner</th>
                <th className="text-left px-4 py-3">Vaccinated</th>
                <th className="text-left px-4 py-3">Spayed/Neutered</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
              </thead>
              <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan={7}>No records found.</td>
                </tr>
              ) : filteredRecords.map((record) => (
                <tr
                  key={record.id}
                  className="border-t border-gray-100 cursor-pointer hover:bg-orange-50 transition-colors"
                  onClick={() => setViewingRecord(record)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {record.pet_photo_url ? (
                        <img src={record.pet_photo_url} alt={record.pet_name} className="w-10 h-10 rounded object-cover border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gray-100 border border-gray-200" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{record.pet_name}</p>
                        <p className="text-xs text-gray-500">{record.markings}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{formatDateMDY(record.birth_date)}</p>
                    <p className="text-xs text-gray-500">{calculateAgeLabel(record.birth_date)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-900">{record.owner_name}</p>
                    <p className="text-xs text-gray-500">{record.owner_address}</p>
                  </td>
                  <td className="px-4 py-3">
                    {record.is_vaccinated ? `Yes (${formatDateMDY(record.last_vaccination_date)})` : 'No'}
                  </td>
                  <td className="px-4 py-3">{record.is_spayed_neutered ? 'Yes' : 'No'}</td>
                  <td className="px-4 py-3">{formatDateTimeMDY(record.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => startEdit(record)}
                        className="px-2.5 py-1.5 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        disabled={isPending}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(record.id)}
                        className="px-2.5 py-1.5 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {viewingRecord && (
        <PetDetailModal
          pet={{
            id: viewingRecord.id,
            name: viewingRecord.pet_name,
            species: 'registry',
            breed: viewingRecord.markings,
            gender: viewingRecord.sex,
            size: 'recorded',
            status: 'registered',
            birth_date: viewingRecord.birth_date,
            last_vaccination_date: viewingRecord.last_vaccination_date,
            owner_name: viewingRecord.owner_name,
            owner_address: viewingRecord.owner_address,
            is_vaccinated: viewingRecord.is_vaccinated,
            is_spayed_neutered: viewingRecord.is_spayed_neutered,
            medical_history: viewingRecord.notes || undefined,
            _registry: {
              birth_date: viewingRecord.birth_date,
              last_vaccination_date: viewingRecord.last_vaccination_date,
            },
            post: {
              description: viewingRecord.notes || `Owner: ${viewingRecord.owner_name} | Address: ${viewingRecord.owner_address}`,
              media_urls: viewingRecord.pet_photo_url ? [viewingRecord.pet_photo_url] : [],
              tags: ['DVMF Registry'],
            },
          }}
          ownerContext={{
            full_name: viewingRecord.owner_name,
            address: viewingRecord.owner_address,
          }}
          showIdCard
          userRole="dvmf"
          showAdoptSection={false}
          onEdit={() => {
            setViewingRecord(null);
            startEdit(viewingRecord);
          }}
          onChangePicture={() => {
            setViewingRecord(null);
            startEdit(viewingRecord);
          }}
          onClose={() => setViewingRecord(null)}
          actions={[
            {
              label: 'Delete Record',
              tone: 'danger',
              onClick: () => {
                setViewingRecord(null);
                onDelete(viewingRecord.id);
              },
            },
          ]}
        />
      )}
    </div>
  );
}
