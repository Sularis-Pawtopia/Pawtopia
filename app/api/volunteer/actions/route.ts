import {
  applyAsVolunteer,
  applyToEvent,
  cancelMyEventVolunteerApplication,
  checkInVolunteer,
  checkOutVolunteer,
  getEventVolunteerApplicationsForOrganizer,
  getMyEventApplications,
  getMyEventVolunteerApplication,
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
  cancelMyEventVolunteerApplication,
  reviewEventVolunteer,
  checkInVolunteer,
  checkOutVolunteer,
  getMyEventApplications,
  getMyEventVolunteerApplication,
  getEventVolunteerApplicationsForOrganizer,
  getVolunteerStats,
});