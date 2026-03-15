import {
  applyAsVolunteer,
  applyToEvent,
  checkInVolunteer,
  checkOutVolunteer,
  getMyEventApplications,
  getVolunteerApplications,
  getVolunteerProfile,
  getVolunteerStats,
  reviewEventVolunteer,
  reviewVolunteerApplication,
  updateVolunteerProfile,
} from '@/lib/actions/volunteer.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  applyAsVolunteer,
  getVolunteerProfile,
  getVolunteerApplications,
  reviewVolunteerApplication,
  updateVolunteerProfile,
  applyToEvent,
  reviewEventVolunteer,
  checkInVolunteer,
  checkOutVolunteer,
  getMyEventApplications,
  getVolunteerStats,
});