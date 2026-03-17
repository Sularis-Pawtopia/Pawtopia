import {
  cancelParticipantRegistration,
  createEvent,
  getEventParticipantsForOrganizer,
  getEvents,
  getMyParticipantRegistrationStatus,
  reviewParticipantRegistration,
  registerParticipant,
  rsvpEvent,
} from '@/lib/actions/event.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getEvents,
  createEvent,
  rsvpEvent,
  registerParticipant,
  cancelParticipantRegistration,
  getMyParticipantRegistrationStatus,
  getEventParticipantsForOrganizer,
  reviewParticipantRegistration,
});