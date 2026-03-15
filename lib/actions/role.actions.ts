'use server';

import { createClient } from '@/lib/supabase/server';
import type { 
  UserRole, 
  UserRoleType, 
  UserPermissions,
  UserWithRoles,
  ActionResponse 
} from '@/types/expanded.types';

// =============================================
// GET USER ROLES
// =============================================

export async function getUserRoles(
  userId?: string
): Promise<ActionResponse<UserRoleType[]>> {
  try {
    const supabase = await createClient();
    
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }
      targetUserId = user.id;
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', targetUserId)
      .eq('is_active', true);
    
    if (error) {
      console.error('Get user roles error:', error);
      return { success: false, error: error.message };
    }
    
    const roles = data.map(r => r.role as UserRoleType);
    return { success: true, data: roles };
  } catch (error) {
    console.error('Get user roles error:', error);
    return { success: false, error: 'Failed to fetch user roles' };
  }
}

// =============================================
// CHECK IF USER HAS ROLE
// =============================================

export async function hasRole(
  role: UserRoleType,
  userId?: string
): Promise<boolean> {
  const result = await getUserRoles(userId);
  if (!result.success || !result.data) return false;
  return result.data.includes(role);
}

// =============================================
// GET USER PERMISSIONS
// =============================================

export async function getUserPermissions(
  userId?: string
): Promise<ActionResponse<UserPermissions>> {
  try {
    const rolesResult = await getUserRoles(userId);
    if (!rolesResult.success || !rolesResult.data) {
      return { 
        success: true, 
        data: getDefaultPermissions() 
      };
    }
    
    const roles = rolesResult.data;
    
    const permissions: UserPermissions = {
      isAdmin: roles.includes('admin'),
      isCityPound: roles.includes('dvmf'),
      isNgo: roles.includes('ngo'),
      isShelter: roles.includes('shelter'),
      isVolunteer: roles.includes('volunteer'),
      isAdopter: roles.includes('adopter'),
      canViewReports: roles.includes('admin') || roles.includes('dvmf'),
      canManageReports: roles.includes('admin') || roles.includes('dvmf'),
      canCreateEvents: roles.includes('admin') || roles.includes('shelter') || 
                       roles.includes('ngo') || roles.includes('dvmf'),
      canManageVolunteers: roles.includes('admin'),
      canPostEducation: roles.includes('admin') || roles.includes('ngo') || 
                        roles.includes('dvmf'),
      canVerifyOrganizations: roles.includes('admin'),
    };
    
    return { success: true, data: permissions };
  } catch (error) {
    console.error('Get user permissions error:', error);
    return { success: false, error: 'Failed to fetch permissions' };
  }
}

function getDefaultPermissions(): UserPermissions {
  return {
    isAdmin: false,
    isCityPound: false,
    isNgo: false,
    isShelter: false,
    isVolunteer: false,
    isAdopter: false,
    canViewReports: false,
    canManageReports: false,
    canCreateEvents: false,
    canManageVolunteers: false,
    canPostEducation: false,
    canVerifyOrganizations: false,
  };
}

// =============================================
// GRANT ROLE (Admin only)
// =============================================

export async function grantRole(
  targetUserId: string,
  role: UserRoleType
): Promise<ActionResponse<UserRole>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Check if current user is admin
    const isAdmin = await hasRole('admin', user.id);
    if (!isAdmin) {
      return { success: false, error: 'Admin privileges required' };
    }
    
    // Special check: only admins can create dvmf roles
    if (role === 'dvmf') {
      // Already verified admin above
    }
    
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: targetUserId,
        role,
        granted_by: user.id,
        is_active: true,
      }, {
        onConflict: 'user_id,role'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Grant role error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as UserRole };
  } catch (error) {
    console.error('Grant role error:', error);
    return { success: false, error: 'Failed to grant role' };
  }
}

// =============================================
// REVOKE ROLE (Admin only)
// =============================================

export async function revokeRole(
  targetUserId: string,
  role: UserRoleType
): Promise<ActionResponse<void>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Check if current user is admin
    const isAdmin = await hasRole('admin', user.id);
    if (!isAdmin) {
      return { success: false, error: 'Admin privileges required' };
    }
    
    const { error } = await supabase
      .from('user_roles')
      .update({ is_active: false })
      .eq('user_id', targetUserId)
      .eq('role', role);
    
    if (error) {
      console.error('Revoke role error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Revoke role error:', error);
    return { success: false, error: 'Failed to revoke role' };
  }
}

// =============================================
// GET USER WITH ROLES
// =============================================

export async function getUserWithRoles(
  userId?: string
): Promise<ActionResponse<UserWithRoles | null>> {
  try {
    const supabase = await createClient();
    
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }
      targetUserId = user.id;
    }
    
    // Get user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, email, username, avatar_url, is_verified')
      .eq('id', targetUserId)
      .single();
    
    if (userError) {
      console.error('Get user error:', userError);
      return { success: false, error: userError.message };
    }
    
    // Get roles
    const rolesResult = await getUserRoles(targetUserId);
    const roles = rolesResult.success ? rolesResult.data || [] : [];
    
    // Get volunteer profile if applicable
    let volunteerProfile = null;
    if (roles.includes('volunteer')) {
      const { data } = await supabase
        .from('volunteer_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      volunteerProfile = data;
    }
    
    // Get organization profile if applicable
    let organizationProfile = null;
    if (roles.includes('ngo') || roles.includes('dvmf')) {
      const { data } = await supabase
        .from('organization_profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .single();
      organizationProfile = data;
    }
    
    const userWithRoles: UserWithRoles = {
      ...userData,
      roles,
      volunteer_profile: volunteerProfile,
      organization_profile: organizationProfile,
    };
    
    return { success: true, data: userWithRoles };
  } catch (error) {
    console.error('Get user with roles error:', error);
    return { success: false, error: 'Failed to fetch user' };
  }
}

// =============================================
// INITIALIZE DEFAULT ROLE FOR NEW USER
// =============================================

export async function initializeUserRole(
  userId: string,
  role: UserRoleType = 'regular_user'
): Promise<ActionResponse<UserRole>> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role,
        is_active: true,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Initialize user role error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as UserRole };
  } catch (error) {
    console.error('Initialize user role error:', error);
    return { success: false, error: 'Failed to initialize role' };
  }
}
