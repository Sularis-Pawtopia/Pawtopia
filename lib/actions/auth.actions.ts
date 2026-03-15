'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { SignUpFormData, LoginFormData } from '@/lib/validations';

export async function signUp(formData: SignUpFormData) {
  const supabase = await createClient();

  const { email, password, username, role, organization_name, registration_number, organization_phone } = formData;

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        role: role,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'Failed to create user' };
  }

  // 2. Create user profile with the actual role
  const { error: userError } = await supabase.from('users').insert({
    id: authData.user.id,
    email,
    username,
    role: role,
    primary_role: role,
    is_verified: false,
  });

  if (userError) {
    return { error: userError.message };
  }

  // 3. The trigger will auto-insert into user_roles, but we can add manually too
  // This is handled by the on_user_created_sync_role trigger

  // 4. Create organization profile if applicable
  if (['ngo', 'shelter', 'dvmf'].includes(role) && organization_name) {
    const orgType = role === 'ngo' ? 'ngo' : role === 'shelter' ? 'shelter' : 'dvmf';
    
    const { error: orgError } = await supabase.from('organization_profiles').insert({
      user_id: authData.user.id,
      organization_type: orgType,
      organization_name: organization_name,
      registration_number: registration_number || null,
      phone: organization_phone || null,
      verification_status: 'pending',
      is_active: true,
    });

    if (orgError) {
      console.error('Failed to create organization profile:', orgError);
    }
  }

  return { success: true, userId: authData.user.id };
}

export async function login(formData: LoginFormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Check if user is verified and get their role
  const { data: user } = await supabase.auth.getUser();
  if (user.user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, primary_role, is_verified')
      .eq('id', user.user.id)
      .single();

    // Use primary_role if set, otherwise fall back to role
    const userRole = profile?.primary_role || profile?.role || 'regular_user';

    if (profile && !profile.is_verified) {
      // Redirect to appropriate onboarding based on role
      const onboardingRoutes: Record<string, string> = {
        regular_user: '/onboarding/user',
        volunteer: '/onboarding/volunteer',
        adopter: '/onboarding/adopter',
        ngo: '/onboarding/ngo',
        shelter: '/onboarding/shelter',
        dvmf: '/onboarding/dvmf',
      };
      return { success: true, redirectTo: onboardingRoutes[userRole] || '/onboarding/user' };
    }

    // Redirect to appropriate dashboard
    const dashboardRoutes: Record<string, string> = {
      admin: '/admin',
      regular_user: '/dashboard',
      volunteer: '/dashboard',
      adopter: '/dashboard',
      ngo: '/dashboard',
      shelter: '/shelter',
      dvmf: '/dvmf',
    };
    return { success: true, redirectTo: dashboardRoutes[userRole] || '/dashboard' };
  }

  return { success: true, redirectTo: '/dashboard' };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/auth/login');
}

export async function clientLogout() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function getSession() {
  const supabase = await createClient();
  
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  return { session, user };
}

export async function getCurrentUser() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
}

export async function getUserProfile(userId: string) {
  const supabase = await createClient();
  
  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (!user) {
    return null;
  }

  // Fetch role-specific profile
  if (user.role === 'shelter' || user.role === 'dvmf') {
    const { data: shelterProfile } = await supabase
      .from('shelter_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { ...user, shelter_profile: shelterProfile };
  } else {
    const { data: adopterProfile } = await supabase
      .from('adopter_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    return { ...user, adopter_profile: adopterProfile };
  }
}

export async function updateUserProfile(userId: string, data: Partial<{
  username: string;
  bio: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  avatar_url: string;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' };
  }

  if (user.id !== userId) {
    return { error: 'Forbidden' };
  }
  
  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function checkUsernameAvailability(username: string) {
  const supabase = await createClient();
  
  const { data } = await supabase
    .from('users')
    .select('username')
    .eq('username', username)
    .single();

  return { available: !data };
}

export async function resetPassword(email: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(newPassword: string) {
  const supabase = await createClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
