'use client';

import { useMemo, useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface HealthcareBranchSettingsProps {
  initialProfile: any;
}

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function defaultSchedule() {
  const days = DAY_KEYS.reduce((acc, day) => {
    acc[day] = {
      is_open: day !== 'sunday',
      open_time: '08:00',
      close_time: day === 'saturday' ? '14:00' : '17:00',
      capacity_per_slot: 1,
    };
    return acc;
  }, {} as Record<string, { is_open: boolean; open_time: string; close_time: string; capacity_per_slot: number }>);

  return {
    slot_minutes: 60,
    days,
  };
}

export function HealthcareBranchSettings({ initialProfile }: HealthcareBranchSettingsProps) {
  const [profile, setProfile] = useState<any>(initialProfile || {});
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const schedule = useMemo(
    () => profile.operating_hours || defaultSchedule(),
    [profile.operating_hours]
  );

  const updateField = (field: string, value: string) => {
    setProfile((current: any) => ({ ...current, [field]: value }));
  };

  const updateScheduleMeta = (field: 'slot_minutes', value: number) => {
    setProfile((current: any) => ({
      ...current,
      operating_hours: {
        ...(current.operating_hours || defaultSchedule()),
        [field]: value,
      },
    }));
  };

  const updateDay = (day: string, changes: Partial<{ is_open: boolean; open_time: string; close_time: string; capacity_per_slot: number }>) => {
    setProfile((current: any) => {
      const existing = current.operating_hours || defaultSchedule();
      return {
        ...current,
        operating_hours: {
          ...existing,
          days: {
            ...existing.days,
            [day]: {
              ...existing.days?.[day],
              ...changes,
            },
          },
        },
      };
    });
  };

  const saveProfile = () => {
    setError(null);
    setSuccess(null);

    const payload = {
      organization_name: String(profile.organization_name || '').trim(),
      description: String(profile.description || '').trim(),
      phone: String(profile.phone || '').trim(),
      email: String(profile.email || '').trim(),
      address: String(profile.address || '').trim(),
      city: String(profile.city || '').trim(),
      state: String(profile.state || '').trim(),
      zip_code: String(profile.zip_code || '').trim(),
      operating_hours: schedule,
    };

    if (!payload.organization_name) {
      setError('Branch name is required.');
      return;
    }

    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'updateDvmfBranchProfile', [payload]);
      if (!result.success || result.error) {
        setError(result.error || 'Failed to save branch settings');
        return;
      }

      setSuccess('Branch profile and operating schedule updated.');
      setTimeout(() => setSuccess(null), 3000);
    });
  };

  return (
    <div className="space-y-4">
      {error ? <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div> : null}
      {success ? <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div> : null}

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Branch Profile</h3>
          <p className="text-sm text-gray-500">These details are visible to requesters choosing a DVMF branch.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Branch Name</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={profile.organization_name || ''} onChange={(event) => updateField('organization_name', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={profile.email || ''} onChange={(event) => updateField('email', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={profile.phone || ''} onChange={(event) => updateField('phone', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={profile.address || ''} onChange={(event) => updateField('address', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={profile.city || ''} onChange={(event) => updateField('city', event.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">State</label>
            <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" value={profile.state || ''} onChange={(event) => updateField('state', event.target.value)} />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
          <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" rows={3} value={profile.description || ''} onChange={(event) => updateField('description', event.target.value)} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Operating Schedule</h3>
            <p className="text-sm text-gray-500">Requester time options are generated from these opening days and hours.</p>
          </div>
          <div className="w-44">
            <label className="block text-xs font-medium text-gray-700 mb-1">Slot Duration (minutes)</label>
            <input
              type="number"
              min={15}
              step={5}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={Number(schedule.slot_minutes || 60)}
              onChange={(event) => updateScheduleMeta('slot_minutes', Math.max(15, Number(event.target.value || 60)))}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-2 py-2">Day</th>
                <th className="px-2 py-2">Open</th>
                <th className="px-2 py-2">Opening Time</th>
                <th className="px-2 py-2">Closing Time</th>
                <th className="px-2 py-2">Capacity / Slot</th>
              </tr>
            </thead>
            <tbody>
              {DAY_KEYS.map((day) => {
                const dayConfig = schedule.days?.[day] || {
                  is_open: false,
                  open_time: '08:00',
                  close_time: '17:00',
                  capacity_per_slot: 1,
                };

                return (
                  <tr key={day} className="border-t border-gray-100">
                    <td className="px-2 py-2 text-sm font-medium text-gray-800 capitalize">{day}</td>
                    <td className="px-2 py-2">
                      <input type="checkbox" checked={Boolean(dayConfig.is_open)} onChange={(event) => updateDay(day, { is_open: event.target.checked })} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="time" className="border border-gray-200 rounded-lg px-2 py-1 text-sm" value={dayConfig.open_time || '08:00'} onChange={(event) => updateDay(day, { open_time: event.target.value })} disabled={!dayConfig.is_open} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="time" className="border border-gray-200 rounded-lg px-2 py-1 text-sm" value={dayConfig.close_time || '17:00'} onChange={(event) => updateDay(day, { close_time: event.target.value })} disabled={!dayConfig.is_open} />
                    </td>
                    <td className="px-2 py-2">
                      <input type="number" min={1} className="w-24 border border-gray-200 rounded-lg px-2 py-1 text-sm" value={Number(dayConfig.capacity_per_slot || 1)} onChange={(event) => updateDay(day, { capacity_per_slot: Math.max(1, Number(event.target.value || 1)) })} disabled={!dayConfig.is_open} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
        <button type="button" onClick={saveProfile} disabled={isPending} className="px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-60">
          {isPending ? 'Saving...' : 'Save Branch Settings'}
        </button>
      </div>
    </div>
  );
}
