import {
  createLostPet,
  getLostPets,
  updateLostPetStatus,
} from '@/lib/actions/lost-pet.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getLostPets,
  createLostPet,
  updateLostPetStatus,
});