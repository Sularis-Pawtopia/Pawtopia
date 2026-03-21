'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { callApiAction } from '@/lib/api/action-client';
import { notify } from '@/lib/ui/notify';
import { Skeleton } from '@/components/ui/Skeleton';

interface OrganizerEventRegistrantsBoardProps {
  organizerId: string;
  title?: string;
}

function roleBadge(role?: string | null) {
  if (role === 'dvmf') return 'bg-amber-100 text-amber-700';
  if (role === 'shelter') return 'bg-blue-100 text-blue-700';
  if (role === 'ngo') return 'bg-indigo-100 text-indigo-700';
  if (role === 'adopter') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
}

export function OrganizerEventRegistrantsBoard({
  organizerId,
  title = 'Event Registrants Overview',
}: OrganizerEventRegistrantsBoardProps) {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionPendingId, setActionPendingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId),
    [events, selectedEventId]
  );

  const registeredParticipants = useMemo(
    () => participants.filter((entry) => entry.status === 'registered'),
    [participants]
  );

  const waitlistedParticipants = useMemo(
    () => participants.filter((entry) => entry.status === 'waitlisted'),
    [participants]
  );

  const pendingParticipants = useMemo(
    () => participants.filter((entry) => entry.status === 'pending'),
    [participants]
  );

  const approvedVolunteers = useMemo(
    () => volunteers.filter((entry) => entry.status === 'approved'),
    [volunteers]
  );

  const pendingVolunteers = useMemo(
    () => volunteers.filter((entry) => entry.status === 'pending'),
    [volunteers]
  );

  useEffect(() => {
    let active = true;

    (async () => {
      const result = await callApiAction<any[]>('events', 'getEvents', [{ shelterId: organizerId }]);
      if (!active) return;

      if (!result.success) {
        const message = result.error || 'Failed to load organizer events.';
        setError(message);
        notify.error({ title: 'Load failed', description: message });
        return;
      }

      const loadedEvents = Array.isArray(result.data) ? result.data : [];
      setEvents(loadedEvents);
      if (loadedEvents.length > 0) {
        setSelectedEventId((prev) => prev || loadedEvents[0].id);
      }
    })();

    return () => {
      active = false;
    };
  }, [organizerId]);

  const loadRegistrants = async (eventId: string) => {
    if (!eventId) return;
    setError('');
    setLoading(true);

    const [participantsResult, volunteersResult] = await Promise.all([
      callApiAction<any[]>('events', 'getEventParticipantsForOrganizer', [eventId]),
      callApiAction<any[]>('volunteer', 'getEventVolunteerApplicationsForOrganizer', [eventId]),
    ]);

    setLoading(false);

    if (!participantsResult.success) {
      const message = participantsResult.error || 'Failed to load participants.';
      setError(message);
      notify.error({ title: 'Load failed', description: message });
      return;
    }

    if (!volunteersResult.success) {
      const message = volunteersResult.error || 'Failed to load volunteers.';
      setError(message);
      notify.error({ title: 'Load failed', description: message });
      return;
    }

    setParticipants(Array.isArray(participantsResult.data) ? participantsResult.data : []);
    setVolunteers(Array.isArray(volunteersResult.data) ? volunteersResult.data : []);
  };

  useEffect(() => {
    loadRegistrants(selectedEventId);
  }, [selectedEventId]);

  const reviewParticipant = async (attendeeId: string, decision: 'approved' | 'declined') => {
    setActionPendingId(attendeeId);
    const result = await callApiAction<any>('events', 'reviewParticipantRegistration', [attendeeId, decision]);
    setActionPendingId(null);
    if (!result.success) {
      const message = result.error || 'Failed to update participant registration.';
      setError(message);
      notify.error({ title: 'Review failed', description: message });
      return;
    }
    notify.success({ title: `Participant ${decision}` });
    await loadRegistrants(selectedEventId);
  };

  const reviewVolunteer = async (applicationId: string, status: 'approved' | 'rejected') => {
    setActionPendingId(applicationId);
    const result = await callApiAction<any>('volunteer', 'reviewEventVolunteer', [applicationId, { status }]);
    setActionPendingId(null);
    if (!result.success) {
      const message = result.error || 'Failed to update volunteer application.';
      setError(message);
      notify.error({ title: 'Review failed', description: message });
      return;
    }
    notify.success({ title: `Volunteer ${status}` });
    await loadRegistrants(selectedEventId);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <span className="text-sm text-gray-500">{events.length} events</span>
      </div>

      {error && (
        <div className="mx-5 mt-4 px-3 py-2 text-sm rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {events.length === 0 ? (
        <div className="px-5 py-8 text-sm text-gray-500">No events yet.</div>
      ) : (
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 items-center">
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.event_name}
                </option>
              ))}
            </select>
            {selectedEvent && (
              <Link href={`/events/${selectedEvent.id}`} className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                Open Event Post
              </Link>
            )}
          </div>

          {selectedEvent && (
            <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                  {selectedEvent.posts?.media_urls?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedEvent.posts.media_urls[0]}
                      alt={selectedEvent.event_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No Image</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{selectedEvent.event_name}</p>
                  {selectedEvent.posts?.description && (
                    <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">{selectedEvent.posts.description}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedEvent.capacity
                      ? `${selectedEvent.attendee_count || 0}/${selectedEvent.capacity} participants`
                      : `${selectedEvent.attendee_count || 0} participants`}
                    {' · '}
                    {selectedEvent.volunteers_needed
                      ? `${selectedEvent.volunteers_confirmed || 0}/${selectedEvent.volunteers_needed} approved volunteers`
                      : `${selectedEvent.volunteers_confirmed || 0} approved volunteers`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Skeleton className="h-6 w-44" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`participant-skeleton-${index}`} className="h-20 w-full" />
                ))}
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-44" />
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={`volunteer-skeleton-${index}`} className="h-20 w-full" />
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Participants ({registeredParticipants.length})</h4>
                  {registeredParticipants.length === 0 ? (
                    <p className="text-sm text-gray-500">No approved participants yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {registeredParticipants.map((entry) => {
                        const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${user?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                                {user?.username || 'Unknown user'}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(user?.role)}`}>
                                {user?.role || 'user'}
                              </span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => reviewParticipant(entry.id, 'declined')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-yellow-200 bg-yellow-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Waitlisted Participants ({waitlistedParticipants.length})</h4>
                  {waitlistedParticipants.length === 0 ? (
                    <p className="text-sm text-gray-500">No waitlisted participants.</p>
                  ) : (
                    <div className="space-y-2">
                      {waitlistedParticipants.map((entry) => {
                        const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
                        return (
                          <div key={entry.id} className="border border-yellow-300 bg-white rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${user?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                                {user?.username || 'Unknown user'}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(user?.role)}`}>
                                {user?.role || 'user'}
                              </span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => reviewParticipant(entry.id, 'approved')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve to Participant
                              </button>
                              <button
                                onClick={() => reviewParticipant(entry.id, 'declined')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Pending Participant Requests ({pendingParticipants.length})</h4>
                  {pendingParticipants.length === 0 ? (
                    <p className="text-sm text-gray-500">No pending participant requests.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingParticipants.map((entry) => {
                        const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${user?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                                {user?.username || 'Unknown user'}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(user?.role)}`}>
                                {user?.role || 'user'}
                              </span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => reviewParticipant(entry.id, 'approved')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => reviewParticipant(entry.id, 'declined')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Approved Volunteers ({approvedVolunteers.length})</h4>
                  {approvedVolunteers.length === 0 ? (
                    <p className="text-sm text-gray-500">No approved volunteers yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {approvedVolunteers.map((entry) => {
                        const volunteer = Array.isArray(entry.volunteer)
                          ? entry.volunteer[0]
                          : entry.volunteer;
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${volunteer?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                                {volunteer?.username || 'Unknown user'}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(volunteer?.role)}`}>
                                {volunteer?.role || 'user'}
                              </span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => reviewVolunteer(entry.id, 'rejected')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Pending Volunteer Applications ({pendingVolunteers.length})</h4>
                  {pendingVolunteers.length === 0 ? (
                    <p className="text-sm text-gray-500">No pending volunteer applications.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingVolunteers.map((entry) => {
                        const volunteer = Array.isArray(entry.volunteer)
                          ? entry.volunteer[0]
                          : entry.volunteer;
                        return (
                          <div key={entry.id} className="border border-gray-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2">
                              <Link href={`/profile/${volunteer?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                                {volunteer?.username || 'Unknown user'}
                              </Link>
                              <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(volunteer?.role)}`}>
                                {volunteer?.role || 'user'}
                              </span>
                            </div>
                            <div className="mt-2 flex gap-2">
                              <button
                                onClick={() => reviewVolunteer(entry.id, 'approved')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => reviewVolunteer(entry.id, 'rejected')}
                                disabled={actionPendingId === entry.id}
                                className="px-2.5 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
