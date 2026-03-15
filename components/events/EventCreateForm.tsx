'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/actions/event.actions';
import { createClient } from '@/lib/supabase/client';

export function EventCreateForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    event_name: '',
    event_type: 'adoption',
    event_date: '',
    end_date: '',
    location: '',
    description: '',
    max_attendees: '',
    registration_required: true,
  });

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

      const result = await createEvent({
        event_name: form.event_name,
        event_type: form.event_type,
        event_date: form.event_date,
        end_date: form.end_date || undefined,
        location: form.location,
        description: form.description,
        max_attendees: form.max_attendees ? Number(form.max_attendees) : undefined,
        registration_required: form.registration_required,
        media_urls: mediaUrls,
      });

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          value={form.event_name}
          onChange={(e) => setForm({ ...form, event_name: e.target.value })}
          placeholder="Event name"
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <select
          value={form.event_type}
          onChange={(e) => setForm({ ...form, event_type: e.target.value })}
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
          value={form.event_date}
          onChange={(e) => setForm({ ...form, event_date: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
        <input
          type="datetime-local"
          value={form.end_date}
          onChange={(e) => setForm({ ...form, end_date: e.target.value })}
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <input
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          placeholder="Location"
          className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
          required
        />
      </div>

      <textarea
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        placeholder="Describe the event details"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
        rows={5}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Event Photos (optional)
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <input
          type="number"
          min="1"
          value={form.max_attendees}
          onChange={(e) => setForm({ ...form, max_attendees: e.target.value })}
          placeholder="Capacity (optional)"
          className="px-3 py-2 border border-gray-300 rounded-lg"
        />
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={form.registration_required}
            onChange={(e) => setForm({ ...form, registration_required: e.target.checked })}
          />
          Require registration
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button type="button" onClick={() => router.push('/events')} className="px-4 py-2 border border-gray-300 rounded-lg">
          Cancel
        </button>
        <button disabled={isPending} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
          {isPending ? 'Creating...' : 'Create Event'}
        </button>
      </div>
    </form>
  );
}
