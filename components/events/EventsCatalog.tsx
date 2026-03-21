'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

type EventsCatalogProps = {
  eventPosts: any[];
};

type EventTypeFilter = 'all' | 'donation' | 'regular';
type TimeFilter = 'upcoming' | 'past' | 'all';
type VenueFilter = 'all' | 'online' | 'onsite' | 'nearby';

function normalizeEventType(value: string | null | undefined): 'adoption' | Exclude<EventTypeFilter, 'all'> {
  const raw = String(value || '').toLowerCase();
  if (raw.includes('donation')) return 'donation';
  if (raw.includes('adoption')) return 'adoption';
  return 'regular';
}

function isOnlineLocation(value: string) {
  const normalized = value.toLowerCase();
  return (
    normalized.includes('online') ||
    normalized.includes('virtual') ||
    normalized.includes('zoom') ||
    normalized.includes('google meet') ||
    normalized.includes('teams')
  );
}

function toDate(value: string | undefined | null) {
  const parsed = value ? new Date(value) : null;
  return parsed && !Number.isNaN(parsed.getTime()) ? parsed : null;
}

function prettyType(type: 'adoption' | Exclude<EventTypeFilter, 'all'>) {
  if (type === 'adoption') return 'Adoption';
  if (type === 'donation') return 'Donation';
  return 'Regular';
}

export function EventsCatalog({ eventPosts }: EventsCatalogProps) {
  const [typeFilter, setTypeFilter] = useState<EventTypeFilter>('all');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [venueFilter, setVenueFilter] = useState<VenueFilter>('all');
  const [query, setQuery] = useState('');
  const [nearbyToken, setNearbyToken] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationHint, setLocationHint] = useState('');

  const rows = useMemo(() => {
    return (eventPosts || [])
      .filter((post) => Boolean(post?.event?.id))
      .map((post) => {
        const date = toDate(post?.event?.event_date);
        const eventType = normalizeEventType(post?.event?.event_type);
        const organizerCity = String(post?.user?.city || '');
        const organizerState = String(post?.user?.state || '');
        const location = String(post?.event?.location || '');
        return {
          id: String(post.id),
          eventId: String(post.event.id),
          title: String(post?.event?.event_name || post?.title || 'Untitled event'),
          description: String(post?.description || ''),
          location,
          organizer: String(post?.user?.username || 'Organizer'),
          eventType,
          date,
          isOnline: isOnlineLocation(location),
          organizerCity,
          organizerState,
          locationBlob: `${location} ${organizerCity} ${organizerState}`.toLowerCase(),
        };
      })
      .filter((row) => row.eventType !== 'adoption');
  }, [eventPosts]);

  const counts = useMemo(() => {
    const donation = rows.filter((row) => row.eventType === 'donation').length;
    const regular = rows.filter((row) => row.eventType === 'regular').length;
    return {
      all: rows.length,
      donation,
      regular,
      online: rows.filter((row) => row.isOnline).length,
      onsite: rows.filter((row) => !row.isOnline).length,
    };
  }, [rows]);

  const requestNearbyLocation = async () => {
    if (!navigator.geolocation) {
      setLocationHint('GPS is not available on this device/browser.');
      return;
    }

    setIsLocating(true);
    setLocationHint('Requesting GPS permission...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: {
                Accept: 'application/json',
              },
            }
          );

          if (!response.ok) {
            throw new Error('Failed to resolve your location.');
          }

          const data = await response.json();
          const city = data?.address?.city || data?.address?.town || data?.address?.municipality || data?.address?.village || '';
          const state = data?.address?.state || '';
          const token = `${city} ${state}`.trim().toLowerCase();

          if (!token) {
            throw new Error('Unable to derive city/state from GPS coordinates.');
          }

          setNearbyToken(token);
          setVenueFilter('nearby');
          setLocationHint(`Using nearby filter for ${city || state}.`);
        } catch (error: any) {
          setLocationHint(error?.message || 'Could not use GPS location right now.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setLocationHint('Location permission denied.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const filteredRows = useMemo(() => {
    const now = new Date();
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (typeFilter !== 'all' && row.eventType !== typeFilter) return false;

      if (venueFilter === 'online' && !row.isOnline) return false;
      if (venueFilter === 'onsite' && row.isOnline) return false;
      if (venueFilter === 'nearby') {
        if (!nearbyToken) return false;
        if (!row.locationBlob.includes(nearbyToken)) return false;
      }

      if (timeFilter !== 'all' && row.date) {
        const isPast = row.date.getTime() < now.getTime();
        if (timeFilter === 'upcoming' && isPast) return false;
        if (timeFilter === 'past' && !isPast) return false;
      }

      if (!normalizedQuery) return true;

      const haystack = [row.title, row.description, row.location, row.organizer, row.organizerCity, row.organizerState]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [rows, typeFilter, venueFilter, nearbyToken, timeFilter, query]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {([
              ['all', `All (${counts.all})`],
              ['donation', `Donation (${counts.donation})`],
              ['regular', `Regular (${counts.regular})`],
            ] as Array<[EventTypeFilter, string]>).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setTypeFilter(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  typeFilter === value
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, place, organizer"
            className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
          />
        </div>

        <div className="mt-3 flex gap-2">
          {([
            ['all', `All venues (${counts.all})`],
            ['online', `Online (${counts.online})`],
            ['onsite', `On-site (${counts.onsite})`],
            ['nearby', 'Near me'],
          ] as Array<[VenueFilter, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setVenueFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                venueFilter === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={requestNearbyLocation}
            disabled={isLocating}
            className="rounded-lg px-3 py-1.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            {isLocating ? 'Locating...' : 'Use GPS'}
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          {([
            ['upcoming', 'Upcoming'],
            ['past', 'Past'],
            ['all', 'All dates'],
          ] as Array<[TimeFilter, string]>).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setTimeFilter(value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                timeFilter === value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {locationHint ? <p className="mt-3 text-xs text-gray-500">{locationHint}</p> : null}
      </div>

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-lg font-semibold text-gray-900">No matching events</p>
          <p className="mt-1 text-sm text-gray-500">Adjust your filters or search terms to see more results.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRows.map((row) => (
            <Link
              key={row.id}
              href={`/events/${row.eventId}`}
              className="block rounded-2xl border border-gray-200 bg-white p-4 transition-colors hover:border-gray-300"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-gray-900">{row.title}</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                  {prettyType(row.eventType)}
                </span>
              </div>

              {row.description ? (
                <p className="line-clamp-2 text-sm text-gray-600">{row.description}</p>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {row.date ? <span>{row.date.toLocaleDateString()}</span> : null}
                {row.location ? <span>{row.location}</span> : null}
                <span>{row.isOnline ? 'Online' : 'On-site'}</span>
                <span>by {row.organizer}</span>
                {(row.organizerCity || row.organizerState) ? <span>{[row.organizerCity, row.organizerState].filter(Boolean).join(', ')}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
