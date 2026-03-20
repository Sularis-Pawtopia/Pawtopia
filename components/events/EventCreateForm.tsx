'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { callApiAction } from '@/lib/api/action-client';

type CreateMode = 'event' | 'donation';

interface EventCreateFormProps {
  initialMode?: CreateMode;
}

export function EventCreateForm({ initialMode = 'event' }: EventCreateFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [mode, setMode] = useState<CreateMode>(initialMode);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [eventForm, setEventForm] = useState({
    event_name: '',
    event_type: 'adoption',
    event_date: '',
    end_date: '',
    location: '',
    description: '',
    max_attendees: '',
    registration_required: true,
    participant_approval_mode: 'auto' as 'auto' | 'manual',
    is_volunteer_event: false,
    volunteers_needed: '',
  });

  const [donationForm, setDonationForm] = useState({
    campaign_name: '',
    campaign_date: '',
    campaign_end_date: '',
    location: 'Online',
    beneficiary: '',
    goal_php: '',
    campaign_description: '',
    monetary_enabled: true,
    in_kind_enabled: true,
    dropoff_instructions: '',
    dropoff_location_name: '',
    dropoff_address: '',
    dropoff_latitude: '',
    dropoff_longitude: '',
    dropoff_map_url: '',
  });

  const donationPreview = useMemo(() => {
    const goal = Number(donationForm.goal_php || 0);
    const raised = 0;
    const percent = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
    return {
      goal,
      raised,
      percent,
      remaining: Math.max(0, goal - raised),
    };
  }, [donationForm.goal_php]);

  const uploadEventImages = async (files: File[]) => {
    if (files.length === 0) return [] as string[];

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/events/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(path, file);

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(path);

      urls.push(publicUrlData.publicUrl);
    }

    return urls;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    startTransition(async () => {
      let mediaUrls: string[] = [];

      try {
        mediaUrls = await uploadEventImages(selectedFiles);
      } catch (uploadError: any) {
        setError(uploadError?.message || 'Failed to upload event images');
        return;
      }

      const payload = mode === 'event'
        ? {
          event_name: eventForm.event_name,
          event_type: eventForm.event_type,
          event_date: eventForm.event_date,
          end_date: eventForm.end_date || undefined,
          location: eventForm.location,
          description: eventForm.description,
          post_title: eventForm.event_name,
          post_tags: ['event', `event_type:${eventForm.event_type}`],
          max_attendees: eventForm.max_attendees ? Number(eventForm.max_attendees) : undefined,
          registration_required: eventForm.registration_required,
          participant_approval_mode: eventForm.participant_approval_mode,
          is_volunteer_event: eventForm.is_volunteer_event,
          volunteers_needed:
            eventForm.is_volunteer_event && eventForm.volunteers_needed
              ? Number(eventForm.volunteers_needed)
              : undefined,
          media_urls: mediaUrls,
        }
        : {
          event_name: donationForm.campaign_name,
          event_type: 'donation_drive',
          event_date: donationForm.campaign_date,
          end_date: donationForm.campaign_end_date || undefined,
          location: donationForm.location || 'Online',
          description: donationForm.campaign_description,
          post_title: donationForm.campaign_name,
          post_tags: [
            'donation_drive',
            `goal_php:${Number(donationForm.goal_php || 0)}`,
            `beneficiary:${donationForm.beneficiary}`,
            donationForm.monetary_enabled ? 'monetary_enabled' : 'monetary_disabled',
            donationForm.in_kind_enabled ? 'in_kind_enabled' : 'in_kind_disabled',
          ],
          max_attendees: undefined,
          registration_required: false,
          participant_approval_mode: 'auto' as const,
          is_volunteer_event: false,
          volunteers_needed: undefined,
          media_urls: mediaUrls,
          donation_monetary_enabled: donationForm.monetary_enabled,
          donation_in_kind_enabled: donationForm.in_kind_enabled,
          donation_goal_php: donationForm.goal_php ? Number(donationForm.goal_php) : undefined,
          donation_beneficiary: donationForm.beneficiary,
          donation_notes: donationForm.dropoff_instructions || undefined,
          donation_dropoff_place_id: donationForm.dropoff_location_name || undefined,
          donation_dropoff_address: donationForm.dropoff_address || undefined,
          donation_dropoff_lat: donationForm.dropoff_latitude ? Number(donationForm.dropoff_latitude) : undefined,
          donation_dropoff_lng: donationForm.dropoff_longitude ? Number(donationForm.dropoff_longitude) : undefined,
          donation_dropoff_map_url: donationForm.dropoff_map_url || undefined,
        };

      const result = await callApiAction('events', 'createEvent', [payload]);

      if (!result.success) {
        setError(result.error || 'Failed to create event');
        return;
      }

      router.push('/events');
      router.refresh();
    });
  };

  return (
    <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-1 grid grid-cols-2 gap-1">
        <button
          type="button"
          onClick={() => setMode('event')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === 'event' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Event Post
        </button>
        <button
          type="button"
          onClick={() => setMode('donation')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === 'donation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Donation Drive
        </button>
      </div>

      {mode === 'event' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={eventForm.event_name}
              onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
              placeholder="Event name"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <select
              value={eventForm.event_type}
              onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="adoption">Adoption Drive</option>
              <option value="vaccination">Vaccination</option>
              <option value="seminar">Seminar</option>
              <option value="fundraiser">Fundraiser</option>
              <option value="other">Other</option>
            </select>
            <input
              type="datetime-local"
              value={eventForm.event_date}
              onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="datetime-local"
              value={eventForm.end_date}
              onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              value={eventForm.location}
              onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
              placeholder="Location"
              className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <textarea
            value={eventForm.description}
            onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
            placeholder="Describe the event details"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={5}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <input
              type="number"
              min="1"
              value={eventForm.max_attendees}
              onChange={(e) => setEventForm({ ...eventForm, max_attendees: e.target.value })}
              placeholder="Capacity (optional)"
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={eventForm.registration_required}
                onChange={(e) => setEventForm({ ...eventForm, registration_required: e.target.checked })}
              />
              Enable RSVP / participant registration
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <label className="text-sm text-gray-700 font-medium">Participant approval mode</label>
            <select
              value={eventForm.participant_approval_mode}
              onChange={(e) =>
                setEventForm({
                  ...eventForm,
                  participant_approval_mode: e.target.value as 'auto' | 'manual',
                })
              }
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="auto">Auto approve participants</option>
              <option value="manual">Manual review participants</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={eventForm.is_volunteer_event}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    is_volunteer_event: e.target.checked,
                    volunteers_needed: e.target.checked ? eventForm.volunteers_needed : '',
                  })
                }
              />
              Accept volunteer applications
            </label>

            <input
              type="number"
              min="1"
              value={eventForm.volunteers_needed}
              onChange={(e) => setEventForm({ ...eventForm, volunteers_needed: e.target.value })}
              placeholder="Volunteer slots (optional)"
              disabled={!eventForm.is_volunteer_event}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:text-gray-400"
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              value={donationForm.campaign_name}
              onChange={(e) => setDonationForm({ ...donationForm, campaign_name: e.target.value })}
              placeholder="Campaign title"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              value={donationForm.beneficiary}
              onChange={(e) => setDonationForm({ ...donationForm, beneficiary: e.target.value })}
              placeholder="Beneficiary (shelter, district, rescue unit)"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="datetime-local"
              value={donationForm.campaign_date}
              onChange={(e) => setDonationForm({ ...donationForm, campaign_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="datetime-local"
              value={donationForm.campaign_end_date}
              onChange={(e) => setDonationForm({ ...donationForm, campaign_end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            />
            <input
              value={donationForm.location}
              onChange={(e) => setDonationForm({ ...donationForm, location: e.target.value })}
              placeholder="Drop-off or campaign location"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
            <input
              type="number"
              min="1"
              value={donationForm.goal_php}
              onChange={(e) => setDonationForm({ ...donationForm, goal_php: e.target.value })}
              placeholder="Goal amount (PHP)"
              className="px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <textarea
            value={donationForm.campaign_description}
            onChange={(e) => setDonationForm({ ...donationForm, campaign_description: e.target.value })}
            placeholder="Describe the cause, urgency, and expected impact"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            rows={5}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={donationForm.monetary_enabled}
                onChange={(e) => setDonationForm({ ...donationForm, monetary_enabled: e.target.checked })}
              />
              Accept monetary donations
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={donationForm.in_kind_enabled}
                onChange={(e) => setDonationForm({ ...donationForm, in_kind_enabled: e.target.checked })}
              />
              Accept in-kind donations
            </label>
          </div>

          {donationForm.in_kind_enabled && (
            <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-900">In-kind Drop-off Details</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  value={donationForm.dropoff_location_name}
                  onChange={(e) => setDonationForm({ ...donationForm, dropoff_location_name: e.target.value })}
                  placeholder="Drop-off place name"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  value={donationForm.dropoff_address}
                  onChange={(e) => setDonationForm({ ...donationForm, dropoff_address: e.target.value })}
                  placeholder="Drop-off address"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  value={donationForm.dropoff_latitude}
                  onChange={(e) => setDonationForm({ ...donationForm, dropoff_latitude: e.target.value })}
                  placeholder="Latitude (optional)"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  value={donationForm.dropoff_longitude}
                  onChange={(e) => setDonationForm({ ...donationForm, dropoff_longitude: e.target.value })}
                  placeholder="Longitude (optional)"
                  className="px-3 py-2 border border-gray-300 rounded-lg"
                />
                <input
                  value={donationForm.dropoff_map_url}
                  onChange={(e) => setDonationForm({ ...donationForm, dropoff_map_url: e.target.value })}
                  placeholder="Google Maps URL (optional)"
                  className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <textarea
                value={donationForm.dropoff_instructions}
                onChange={(e) => setDonationForm({ ...donationForm, dropoff_instructions: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={3}
                placeholder="Drop-off instructions for donors"
              />
            </div>
          )}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-semibold text-gray-900">Campaign Quota Preview</p>
            <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary-600 rounded-full" style={{ width: `${donationPreview.percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-600">
              PHP {donationPreview.raised.toLocaleString()} raised of PHP {donationPreview.goal.toLocaleString()} goal. Remaining: PHP {donationPreview.remaining.toLocaleString()}.
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Monetary: {donationForm.monetary_enabled ? 'Enabled' : 'Disabled'} | In-kind: {donationForm.in_kind_enabled ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {mode === 'event' ? 'Event Photos (optional)' : 'Donation Drive Photos (optional)'}
        </label>
        <input
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setSelectedFiles(Array.from(e.target.files || []).slice(0, 6))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
        />
        <p className="text-xs text-gray-500 mt-1">
          Up to 6 images. JPG, PNG, or WEBP.
        </p>
        {selectedFiles.length > 0 && (
          <div className="mt-2 text-xs text-gray-600">
            Selected: {selectedFiles.map((f) => f.name).join(', ')}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/events')} className="px-4 py-2 border border-gray-300 rounded-lg">
          Cancel
        </button>
        <button disabled={isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
          {isPending ? 'Creating...' : mode === 'event' ? 'Create Event' : 'Create Donation Drive'}
        </button>
      </div>
    </form>
  );
}
