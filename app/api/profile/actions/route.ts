import {
  followUser,
  getShelterEvents,
  getShelterPetsByStatus,
  getUserPosts,
  getUserProfile,
  updateAdopterProfileByUserId,
  updateShelterProfileByUserId,
  updateUserBasicInfo,
  updateUserPhotos,
} from '@/lib/actions/profile.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getUserProfile,
  updateAdopterProfileByUserId,
  updateShelterProfileByUserId,
  updateUserBasicInfo,
  updateUserPhotos,
  getShelterPetsByStatus,
  getShelterEvents,
  getUserPosts,
  followUser,
});