import {
  createAdopterPet,
  createPet,
  deleteAdopterPet,
  deletePet,
  getAdopterAllPets,
  getAdopterOwnPets,
  getAvailablePets,
  getPet,
  getShelterPets,
  searchPets,
  updateAdopterPet,
  updatePet,
  updatePetStatus,
} from '@/lib/actions/pet.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  createPet,
  updatePet,
  updatePetStatus,
  deletePet,
  getPet,
  getAvailablePets,
  getShelterPets,
  searchPets,
  createAdopterPet,
  updateAdopterPet,
  getAdopterOwnPets,
  getAdopterAllPets,
  deleteAdopterPet,
});