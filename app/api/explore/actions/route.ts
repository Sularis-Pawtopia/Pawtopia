import {
  getExplorePets,
  getFeaturedShelters,
  getRecommendedPets,
} from '@/lib/actions/explore.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getExplorePets,
  getFeaturedShelters,
  getRecommendedPets,
});