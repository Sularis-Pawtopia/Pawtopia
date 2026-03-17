'use server';

import { revalidatePath } from 'next/cache';
import {
  cancelParticipantRegistrationService,
  createEventService,
  getEventParticipantsForOrganizerService,
  getMyParticipantRegistrationStatusService,
  getEventsService,
  registerParticipantService,
  reviewParticipantRegistrationService,
  rsvpEventService,
  type CreateEventInput,
  type EventFilters,
} from '@/lib/server/services/events.service';

export async function getEvents(filters?: EventFilters) {
  return getEventsService(filters);
}

export async function createEvent(formData: CreateEventInput) {
  const result = await createEventService(formData);
  if (result.success) {
    revalidatePath('/events');
    revalidatePath('/shelter');
    revalidatePath('/dvmf');
  }
  return result;
}

export async function rsvpEvent(eventId: string) {
  const result = await rsvpEventService(eventId);
  if (result.success) {
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);
  }
  return result;
}

export async function registerParticipant(eventId: string) {
  const result = await registerParticipantService(eventId);
  if (result.success) {
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);
  }
  return result;
}

export async function cancelParticipantRegistration(eventId: string) {
  const result = await cancelParticipantRegistrationService(eventId);
  if (result.success) {
    revalidatePath('/events');
    revalidatePath(`/events/${eventId}`);
  }
  return result;
}

export async function getMyParticipantRegistrationStatus(eventId: string) {
  return getMyParticipantRegistrationStatusService(eventId);
}

export async function getEventParticipantsForOrganizer(eventId: string) {
  return getEventParticipantsForOrganizerService(eventId);
}

export async function reviewParticipantRegistration(attendeeId: string, decision: 'approved' | 'declined') {
  const result = await reviewParticipantRegistrationService(attendeeId, decision);
  if (result.success && result.data?.event_id) {
    revalidatePath('/events');
    revalidatePath(`/events/${result.data.event_id}`);
  }
  return result;
}
