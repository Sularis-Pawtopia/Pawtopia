import {
  cancelAdoptionRequest,
  completeAdoption,
  createAdoptionRequest,
  getAdoptedPets,
  getAdoptionRequestCountForPet,
  getAdoptionRequestForPet,
  getAdoptionRequests,
  getMyAdoptionRequestForPet,
  getUserAdoptionRequests,
  updateAdoptionRequestStatus,
} from '@/lib/actions/adoption.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  createAdoptionRequest,
  cancelAdoptionRequest,
  updateAdoptionRequestStatus,
  completeAdoption,
  getAdoptionRequests,
  getUserAdoptionRequests,
  getAdoptionRequestForPet,
  getMyAdoptionRequestForPet,
  getAdoptionRequestCountForPet,
  getAdoptedPets,
});