import {
  getUserPermissions,
  getUserRoles,
  getUserWithRoles,
  grantRole,
  hasRole,
  initializeUserRole,
  revokeRole,
} from '@/lib/actions/role.actions';
import { createActionRoute } from '@/lib/server/api/action-route';

export const POST = createActionRoute({
  getUserRoles,
  hasRole,
  getUserPermissions,
  grantRole,
  revokeRole,
  getUserWithRoles,
  initializeUserRole,
});