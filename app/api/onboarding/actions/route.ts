import {
  getAdopterProfile,
  getShelterProfile,
  submitAdopterOnboarding,
  submitCityPoundOnboarding,
  submitNgoOnboarding,
  submitRegularUserOnboarding,
  submitShelterOnboarding,
  submitVolunteerOnboarding,
  updateAdopterProfile,
  updateShelterProfile,
} from '@/lib/actions/onboarding.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  submitVolunteerOnboarding,
  submitNgoOnboarding,
  submitCityPoundOnboarding,
  submitAdopterOnboarding,
  submitShelterOnboarding,
  updateAdopterProfile,
  updateShelterProfile,
  getAdopterProfile,
  getShelterProfile,
  submitRegularUserOnboarding,
});