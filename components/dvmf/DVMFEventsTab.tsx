'use client';

import Link from 'next/link';

interface EventItem {
  id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  location: string;
  posts?: {
    description?: string;
    created_at?: string;
  };
}

interface DvmfEventsTabProps {
  events: EventItem[];
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Manila',
});

function formatDateTimeMDY(value?: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${dateTimeFormatter.format(date)} PHT`;
}

export function DvmfEventsTab({ events }: DvmfEventsTabProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Drives and Community Events</h3>
          <p className="text-sm text-gray-600 mt-1">
            Publish DVMF drives to the public feed and events tab instantly.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Create Drive/Event
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent DVMF Events</h3>
          <span className="text-sm text-gray-500">{events.length} total</span>
        </div>
        <div className="divide-y divide-gray-100">
          {events.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-500">No DVMF events yet.</div>
          ) : (
            events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block px-5 py-4 hover:bg-gray-50 transition"
              >
                <p className="font-medium text-gray-900">{event.event_name}</p>
                <p className="text-sm text-gray-600 mt-1">
                  {formatDateTimeMDY(event.event_date)} | {event.location} | {event.event_type}
                </p>
                {event.posts?.description && (
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.posts.description}</p>
                )}
                {event.posts?.created_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    Posted {formatDateTimeMDY(event.posts.created_at)}
                  </p>
                )}
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
