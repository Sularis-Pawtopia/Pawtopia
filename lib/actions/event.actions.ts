'use server';

import { revalidatePath } from 'next/cache';
import {
  createEventService,
  getEventsService,
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
  }
  return result;
}
