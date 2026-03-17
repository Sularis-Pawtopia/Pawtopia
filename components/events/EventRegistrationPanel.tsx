'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { callApiAction } from '@/lib/api/action-client';

type ParticipantStatus = 'pending' | 'registered' | 'waitlisted' | 'cancelled' | null;
type VolunteerStatus = 'pending' | 'approved' | 'rejected' | 'attended' | 'no_show' | null;

interface EventRegistrationPanelProps {
  event: {
    id: string;
    event_name: string;
    capacity?: number | null;
    attendee_count?: number | null;
    waitlist_count?: number | null;
    volunteers_needed?: number | null;
    volunteers_confirmed?: number | null;
    is_volunteer_event?: boolean | null;
    participant_approval_mode?: 'auto' | 'manual' | null;
    shelter_id?: string | null;
    organizer_id?: string | null;
  };
  currentUser?: {
    id?: string;
    role?: string;
  };
}

function statusBadge(status: string | null) {
  if (status === 'registered' || status === 'approved' || status === 'attended') {
    return 'bg-green-100 text-green-700';
  }
  if (status === 'waitlisted' || status === 'pending') {
    return 'bg-yellow-100 text-yellow-700';
  }
  if (status === 'rejected' || status === 'cancelled' || status === 'no_show') {
    return 'bg-red-100 text-red-700';
  }
  return 'bg-gray-100 text-gray-700';
}

function roleBadge(role?: string | null) {
  if (role === 'dvmf') return 'bg-amber-100 text-amber-700';
  if (role === 'shelter') return 'bg-blue-100 text-blue-700';
  if (role === 'ngo') return 'bg-indigo-100 text-indigo-700';
  if (role === 'adopter') return 'bg-green-100 text-green-700';
  return 'bg-gray-100 text-gray-700';
}

export function EventRegistrationPanel({ event, currentUser }: EventRegistrationPanelProps) {
  const [participantStatus, setParticipantStatus] = useState<ParticipantStatus>(null);
  const [volunteerStatus, setVolunteerStatus] = useState<VolunteerStatus>(null);
  const [attendeeCount, setAttendeeCount] = useState<number>(event.attendee_count || 0);
  const [waitlistCount, setWaitlistCount] = useState<number>(event.waitlist_count || 0);
  const [volunteerApprovedCount, setVolunteerApprovedCount] = useState<number>(event.volunteers_confirmed || 0);
  const [participants, setParticipants] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  const isOrganizer = useMemo(() => {
    if (!currentUser?.id) return false;
    return currentUser.id === event.organizer_id || currentUser.id === event.shelter_id;
  }, [currentUser?.id, event.organizer_id, event.shelter_id]);

  const registeredText =
    typeof event.capacity === 'number' && event.capacity > 0
      ? `${attendeeCount}/${event.capacity} registered`
      : `${attendeeCount} registered`;

  const volunteersText =
    typeof event.volunteers_needed === 'number' && event.volunteers_needed > 0
      ? `${volunteerApprovedCount}/${event.volunteers_needed} approved volunteers`
      : `${volunteerApprovedCount} approved volunteers`;

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

  const pendingVolunteers = useMemo(
    () => volunteers.filter((entry) => entry.status === 'pending'),
    [volunteers]
  );

  const approvedVolunteers = useMemo(
    () => volunteers.filter((entry) => entry.status === 'approved'),
    [volunteers]
  );

  const refreshOrganizerLists = async () => {
    if (!isOrganizer) return;

    const [participantsResult, volunteersResult] = await Promise.all([
      callApiAction<any[]>('events', 'getEventParticipantsForOrganizer', [event.id]),
      callApiAction<any[]>('volunteer', 'getEventVolunteerApplicationsForOrganizer', [event.id]),
    ]);

    if (participantsResult.success) {
      setParticipants(Array.isArray(participantsResult.data) ? participantsResult.data : []);
    }

    if (volunteersResult.success) {
      const list = Array.isArray(volunteersResult.data) ? volunteersResult.data : [];
      setVolunteers(list);
      setVolunteerApprovedCount(list.filter((entry) => entry.status === 'approved').length);
    }
  };

  useEffect(() => {
    if (!currentUser?.id) return;

    let mounted = true;
    (async () => {
      const [participantResult, volunteerResult] = await Promise.all([
        callApiAction<any>('events', 'getMyParticipantRegistrationStatus', [event.id]),
        callApiAction<any>('volunteer', 'getMyEventVolunteerApplication', [event.id]),
      ]);

      if (!mounted) return;

      if (participantResult.success && participantResult.data) {
        setParticipantStatus((participantResult.data as any).status || null);
      }

      if (volunteerResult.success && volunteerResult.data) {
        setVolunteerStatus((volunteerResult.data as any).status || null);
      }

      if (isOrganizer) {
        await refreshOrganizerLists();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [currentUser?.id, event.id, isOrganizer]);

  const handleParticipantRegister = () => {
    setError('');
    startTransition(async () => {
      const result = await callApiAction<any>('events', 'registerParticipant', [event.id]);
      if (!result.success) {
        setError(result.error || 'Failed to register for event');
        return;
      }

      const data = result.data as any;
      setParticipantStatus((data?.status as ParticipantStatus) || 'registered');
      setAttendeeCount(typeof data?.attendee_count === 'number' ? data.attendee_count : attendeeCount);
      setWaitlistCount(typeof data?.waitlist_count === 'number' ? data.waitlist_count : waitlistCount);
      if (isOrganizer) {
        await refreshOrganizerLists();
      }
    });
  };

  const handleParticipantCancel = () => {
    setError('');
    startTransition(async () => {
      const result = await callApiAction<any>('events', 'cancelParticipantRegistration', [event.id]);
      if (!result.success) {
        setError(result.error || 'Failed to cancel registration');
        return;
      }

      const data = result.data as any;
      setParticipantStatus('cancelled');
      setAttendeeCount(typeof data?.attendee_count === 'number' ? data.attendee_count : attendeeCount);
      setWaitlistCount(typeof data?.waitlist_count === 'number' ? data.waitlist_count : waitlistCount);
      if (isOrganizer) {
        await refreshOrganizerLists();
      }
    });
  };

  const handleVolunteerApply = () => {
    setError('');
    startTransition(async () => {
      const result = await callApiAction<any>('volunteer', 'applyToEvent', [
        {
          event_id: event.id,
          volunteer_id: currentUser?.id,
          application_message: 'Interested in helping for this event.',
        },
      ]);

      if (!result.success) {
        setError(result.error || 'Failed to apply as volunteer');
        return;
      }

      setVolunteerStatus('pending');
      if (isOrganizer) {
        await refreshOrganizerLists();
      }
    });
  };

  const handleVolunteerCancel = () => {
    setError('');
    startTransition(async () => {
      const result = await callApiAction<any>('volunteer', 'cancelMyEventVolunteerApplication', [event.id]);
      if (!result.success) {
        setError(result.error || 'Failed to cancel volunteer registration');
        return;
      }

      setVolunteerStatus(null);
      if (isOrganizer) {
        await refreshOrganizerLists();
      }
    });
  };

  const handleReviewVolunteer = (applicationId: string, status: 'approved' | 'rejected') => {
    setError('');
    startTransition(async () => {
      const result = await callApiAction<any>('volunteer', 'reviewEventVolunteer', [
        applicationId,
        { status },
      ]);

      if (!result.success) {
        setError(result.error || `Failed to ${status} volunteer`);
        return;
      }

      await refreshOrganizerLists();
    });
  };

  const handleReviewParticipant = (attendeeId: string, decision: 'approved' | 'declined') => {
    setError('');
    startTransition(async () => {
      const result = await callApiAction<any>('events', 'reviewParticipantRegistration', [
        attendeeId,
        decision,
      ]);

      if (!result.success) {
        setError(result.error || `Failed to ${decision} participant`);
        return;
      }

      await refreshOrganizerLists();
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Event Registration</h3>
          <p className="text-sm text-gray-600 mt-1">{registeredText}</p>
          {event.participant_approval_mode === 'manual' && (
            <p className="text-xs text-gray-500 mt-1">Manual participant approval enabled</p>
          )}
          {waitlistCount > 0 && <p className="text-xs text-yellow-700 mt-1">{waitlistCount} currently waitlisted</p>}
        </div>
      </div>

      {error && <div className="text-sm px-3 py-2 rounded-lg border border-red-200 bg-red-50 text-red-700">{error}</div>}

      {!currentUser?.id ? (
        <div className="text-sm text-gray-600">
          Please <Link href="/auth/login" className="text-primary-600 hover:underline">log in</Link> to register.
        </div>
      ) : !isOrganizer ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleParticipantRegister}
            disabled={
              isPending ||
              participantStatus === 'registered' ||
              participantStatus === 'waitlisted' ||
              participantStatus === 'pending'
            }
            className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
          >
            {participantStatus === 'registered' && 'Registered'}
            {participantStatus === 'waitlisted' && 'Waitlisted'}
            {participantStatus === 'pending' && 'Pending Approval'}
            {!participantStatus || participantStatus === 'cancelled' ? 'Register as Participant' : ''}
          </button>

          {(participantStatus === 'registered' || participantStatus === 'waitlisted' || participantStatus === 'pending') && (
            <button
              onClick={handleParticipantCancel}
              disabled={isPending}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel Registration
            </button>
          )}

          {participantStatus && (
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(participantStatus)}`}>
              Participant: {participantStatus}
            </span>
          )}
        </div>
      ) : null}

      {event.is_volunteer_event && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-sm font-semibold text-gray-900">Volunteer Registration</p>
            <span className="text-xs text-gray-600">{volunteersText}</span>
          </div>

          {currentUser?.id && !isOrganizer ? (
            <div className="flex flex-wrap items-center gap-3">
              {!volunteerStatus && (
                <button
                  onClick={handleVolunteerApply}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  Apply as Volunteer
                </button>
              )}

              {volunteerStatus && (
                <>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(volunteerStatus)}`}>
                    Volunteer: {volunteerStatus}
                  </span>
                  {(volunteerStatus === 'pending' || volunteerStatus === 'approved') && (
                    <button
                      onClick={handleVolunteerCancel}
                      disabled={isPending}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel Volunteer Registration
                    </button>
                  )}
                </>
              )}
            </div>
          ) : !currentUser?.id ? (
            <p className="text-sm text-gray-600">Log in to apply as a volunteer.</p>
          ) : (
            <p className="text-sm text-gray-600">Organizer view: volunteer applications are managed below.</p>
          )}
        </div>
      )}

      {isOrganizer && (
        <div className="pt-4 border-t border-gray-200 space-y-5">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Participants ({registeredParticipants.length})</h4>
            <div className="space-y-2">
              {registeredParticipants.length === 0 ? (
                <p className="text-sm text-gray-500">No approved participants yet.</p>
              ) : (
                registeredParticipants.map((entry) => {
                  const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
                  return (
                    <div key={entry.id} className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2">
                      <div>
                        <Link href={`/profile/${user?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                          {user?.username || 'Unknown user'}
                        </Link>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(user?.role)}`}>
                            {user?.role || 'user'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewParticipant(entry.id, 'declined')}
                          disabled={isPending}
                          className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Waitlisted Participants ({waitlistedParticipants.length})</h4>
            <div className="space-y-2">
              {waitlistedParticipants.length === 0 ? (
                <p className="text-sm text-gray-500">No waitlisted participants.</p>
              ) : (
                waitlistedParticipants.map((entry) => {
                  const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
                  return (
                    <div key={entry.id} className="flex items-center justify-between gap-3 border border-yellow-200 bg-yellow-50 rounded-lg px-3 py-2">
                      <div>
                        <Link href={`/profile/${user?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                          {user?.username || 'Unknown user'}
                        </Link>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(user?.role)}`}>
                            {user?.role || 'user'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewParticipant(entry.id, 'approved')}
                          disabled={isPending}
                          className="px-2.5 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve to Participant
                        </button>
                        <button
                          onClick={() => handleReviewParticipant(entry.id, 'declined')}
                          disabled={isPending}
                          className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Pending Participant Requests ({pendingParticipants.length})</h4>
            <div className="space-y-2">
              {pendingParticipants.length === 0 ? (
                <p className="text-sm text-gray-500">No pending participant requests.</p>
              ) : (
                pendingParticipants.map((entry) => {
                  const user = Array.isArray(entry.user) ? entry.user[0] : entry.user;
                  return (
                    <div key={entry.id} className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2">
                      <div>
                        <Link href={`/profile/${user?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                          {user?.username || 'Unknown user'}
                        </Link>
                        <div className="mt-1">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(user?.role)}`}>
                            {user?.role || 'user'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReviewParticipant(entry.id, 'approved')}
                          disabled={isPending}
                          className="px-2.5 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewParticipant(entry.id, 'declined')}
                          disabled={isPending}
                          className="px-2.5 py-1 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Approved Volunteers ({approvedVolunteers.length})</h4>
            <div className="space-y-2">
              {approvedVolunteers.length === 0 ? (
                <p className="text-sm text-gray-500">No approved volunteers yet.</p>
              ) : (
                approvedVolunteers.map((entry) => {
                  const volunteer = Array.isArray(entry.volunteer) ? entry.volunteer[0] : entry.volunteer;
                  return (
                    <div key={entry.id} className="border border-gray-200 rounded-lg px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/profile/${volunteer?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                            {volunteer?.username || 'Unknown user'}
                          </Link>
                          <div className="mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(volunteer?.role)}`}>
                              {volunteer?.role || 'user'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleReviewVolunteer(entry.id, 'rejected')}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Pending Volunteer Applications ({pendingVolunteers.length})</h4>
            <div className="space-y-2">
              {pendingVolunteers.length === 0 ? (
                <p className="text-sm text-gray-500">No pending volunteer applications.</p>
              ) : (
                pendingVolunteers.map((entry) => {
                  const volunteer = Array.isArray(entry.volunteer) ? entry.volunteer[0] : entry.volunteer;
                  return (
                    <div key={entry.id} className="border border-gray-200 rounded-lg px-3 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <Link href={`/profile/${volunteer?.id || '#'}`} className="text-sm font-medium text-gray-900 hover:underline">
                            {volunteer?.username || 'Unknown user'}
                          </Link>
                          <div className="mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${roleBadge(volunteer?.role)}`}>
                              {volunteer?.role || 'user'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleReviewVolunteer(entry.id, 'approved')}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewVolunteer(entry.id, 'rejected')}
                          disabled={isPending}
                          className="px-3 py-1.5 rounded-md bg-red-600 text-white text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
