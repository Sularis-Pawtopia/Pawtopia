import { createEvent, getEvents, rsvpEvent } from '@/lib/actions/event.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getEvents,
  createEvent,
  rsvpEvent,
});