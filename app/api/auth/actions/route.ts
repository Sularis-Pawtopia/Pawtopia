import {
  checkUsernameAvailability,
  clientLogout,
  getCurrentUser,
  getSession,
  getUserProfile,
  login,
  logout,
  resetPassword,
  signUp,
  updatePassword,
  updateUserProfile,
} from '@/lib/actions/auth.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  signUp,
  login,
  logout,
  clientLogout,
  getSession,
  getCurrentUser,
  getUserProfile,
  updateUserProfile,
  checkUsernameAvailability,
  resetPassword,
  updatePassword,
});