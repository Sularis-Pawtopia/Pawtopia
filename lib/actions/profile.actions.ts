'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// =============================================
// GET PROFILE (public view + owner flag)
// =============================================
export async function getUserProfile(userId: string) {
  try {
    const supabase = await createClient();

    // Get the current auth user to determine if owner
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const isOwner = authUser?.id === userId;

    // Get user basic info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Get role-specific profile
    let profileData: any = null;

    if (user.role === 'shelter' || user.role === 'dvmf') {
      const { data: shelterProfile } = await supabase
        .from('shelter_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      profileData = shelterProfile;

      // Get shelter stats
      const { count: petsCount } = await supabase
        .from('pets')
        .select('*', { count: 'exact', head: true })
        .eq('shelter_id', userId);

      const { count: adoptionsCount } = await supabase
        .from('adoption_requests')
        .select('*', { count: 'exact', head: true })
        .eq('shelter_id', userId)
        .eq('status', 'completed');

      profileData = {
        ...profileData,
        stats: {
          totalPets: petsCount || 0,
          successfulAdoptions: adoptionsCount || 0,
        },
      };
    } else if (user.role === 'adopter') {
      const { data: adopterProfile } = await supabase
        .from('adopter_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Strip sensitive fields for all non-owners (including shelters and DVMF).
      if (adopterProfile && !isOwner) {
        profileData = {
          first_name: adopterProfile.first_name,
          last_name: adopterProfile.last_name,
          mi: adopterProfile.mi,
          email: adopterProfile.email,
          gender: adopterProfile.gender,
          social_media_link: adopterProfile.social_media_link,
          looking_to_adopt: adopterProfile.looking_to_adopt,
          first_time_adopter: adopterProfile.first_time_adopter,
        };
      } else {
        profileData = adopterProfile;
      }

      // Get adopter stats
      const { count: adoptedPetsCount } = await supabase
        .from('adoption_requests')
        .select('*', { count: 'exact', head: true })
        .eq('adopter_id', userId)
        .eq('status', 'completed');

      profileData = {
        ...profileData,
        stats: {
          adoptedPets: adoptedPetsCount || 0,
        },
      };
    }

    // Get the viewer's role so UI can conditionally show adopt button
    let viewerRole: string | null = null;
    if (authUser) {
      const { data: viewerUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .single();
      viewerRole = viewerUser?.role || null;
    }

    return {
      success: true,
      data: {
        ...user,
        profile: profileData,
        isOwner,
        viewerRole,
      },
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { success: false, error: 'Failed to fetch profile' };
  }
}

// =============================================
// UPDATE ADOPTER PROFILE
// =============================================
export async function updateAdopterProfileByUserId(
  userId: string,
  data: Record<string, any>
) {
  const supabase = await createClient();

  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Unauthorized' };
  }

  // Clean data - remove undefined values and ensure proper types
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );

  // Separate fields for adopter_profiles vs users tables
  const usersFields = ['contact_number', 'address'];
  const adopterProfileData = { ...cleanedData };
  const userUpdates: Record<string, any> = {};

  // Move users table fields to userUpdates and remove from adopter profile data
  usersFields.forEach(field => {
    if (cleanedData[field] !== undefined) {
      if (field === 'contact_number') {
        userUpdates.phone = cleanedData[field];
      } else {
        userUpdates[field] = cleanedData[field];
      }
      delete adopterProfileData[field];
    }
  });

  // Update adopter_profiles table (without users table fields)
  const { error: profileError } = await supabase
    .from('adopter_profiles')
    .update(adopterProfileData)
    .eq('user_id', userId);

  if (profileError) {
    console.error('Update adopter profile error:', profileError);
    return { error: `Profile update failed: ${profileError.message}` };
  }

  // Update users table for shared fields
  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userId);

    if (userError) {
      console.error('Update users table error:', userError);
      return { error: `User info update failed: ${userError.message}` };
    }
  }

  revalidatePath(`/profile/${userId}`);
  return { success: true };
}

// =============================================
// UPDATE SHELTER PROFILE
// =============================================
export async function updateShelterProfileByUserId(
  userId: string,
  data: Record<string, any>
) {
  const supabase = await createClient();

  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Unauthorized' };
  }

  // Clean data - remove undefined values and ensure proper types
  const cleanedData = Object.fromEntries(
    Object.entries(data).filter(([_, value]) => value !== undefined)
  );

  // Separate fields for shelter_profiles vs users tables
  const usersFields = ['phone', 'address'];
  const shelterProfileData = { ...cleanedData };
  const userUpdates: Record<string, any> = {};

  // Move users table fields to userUpdates and remove from shelter profile data
  usersFields.forEach(field => {
    if (cleanedData[field] !== undefined) {
      userUpdates[field] = cleanedData[field];
      delete shelterProfileData[field];
    }
  });

  // Update shelter_profiles table (without users table fields)
  const { error: profileError } = await supabase
    .from('shelter_profiles')
    .update(shelterProfileData)
    .eq('user_id', userId);

  if (profileError) {
    console.error('Update shelter profile error:', profileError);
    return { error: `Profile update failed: ${profileError.message}` };
  }

  // Update users table for shared fields
  if (Object.keys(userUpdates).length > 0) {
    const { error: userError } = await supabase
      .from('users')
      .update(userUpdates)
      .eq('id', userId);

    if (userError) {
      console.error('Update users table error:', userError);
      return { error: `User info update failed: ${userError.message}` };
    }
  }

  revalidatePath(`/profile/${userId}`);
  return { success: true };
}

// =============================================
// UPDATE USER (basic info, avatar, bio)
// =============================================
export async function updateUserBasicInfo(
  userId: string,
  data: { username?: string; bio?: string; avatar_url?: string; full_name?: string }
) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId);

  if (error) {
    console.error('Update user error:', error);
    return { error: error.message };
  }

  revalidatePath(`/profile/${userId}`);
  return { success: true };
}

// =============================================
// UPDATE USER PHOTOS (avatar & cover)
// =============================================
export async function updateUserPhotos(
  userId: string,
  data: { avatar_url?: string; cover_photo_url?: string }
) {
  const supabase = await createClient();

  // Verify ownership
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.id !== userId) {
    return { error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId);

  if (error) {
    console.error('Update user photos error:', error);
    return { error: error.message };
  }

  revalidatePath(`/profile/${userId}`);
  return { success: true };
}

// =============================================
// GET SHELTER PETS (Adoptable or Adopted)
// =============================================
export async function getShelterPetsByStatus(
  shelterId: string,
  status: 'available' | 'adopted',
  filters?: {
    gender?: string;
    minAgeYears?: number;
    maxAgeYears?: number;
    size?: string;
    is_spayed_neutered?: boolean;
    is_vaccinated?: boolean;
    search?: string;
  }
) {
  try {
    const supabase = await createClient();

    let query: any = supabase
      .from('pets')
      .select(`
        *,
        post:posts(id, media_urls, description, created_at)
      `)
      .eq('shelter_id', shelterId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (filters) {
      if (filters.gender) query = query.eq('gender', filters.gender);
      if (filters.size) query = query.eq('size', filters.size);
      if (typeof filters.is_spayed_neutered === 'boolean') query = query.eq('is_spayed_neutered', filters.is_spayed_neutered);
      if (typeof filters.is_vaccinated === 'boolean') query = query.eq('is_vaccinated', filters.is_vaccinated);
      if (typeof filters.minAgeYears === 'number') query = query.gte('age_years', filters.minAgeYears);
      if (typeof filters.maxAgeYears === 'number') query = query.lte('age_years', filters.maxAgeYears);
      if (filters.search) {
        const s = `%${filters.search}%`;
        query = query.or(`name.ilike.${s},breed.ilike.${s},species.ilike.${s}`);
      }
    }

    const { data: pets, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: pets || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch pets' };
  }
}

// =============================================
// GET SHELTER EVENTS
// =============================================
export async function getShelterEvents(shelterId: string) {
  try {
    const supabase = await createClient();

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        post:posts(id, media_urls, description, created_at)
      `)
      .eq('shelter_id', shelterId)
      .order('event_date', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: events || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch events' };
  }
}

// =============================================
// GET POSTS
// =============================================
export async function getUserPosts(userId: string) {
  try {
    const supabase = await createClient();

    const { data: posts, error } = await supabase
      .from('posts')
      .select(`
        *,
        pets:pet_id (
          id,
          name,
          species,
          breed
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: posts || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch posts' };
  }
}

// =============================================
// FOLLOW / UNFOLLOW
// =============================================
export async function followUser(userIdToFollow: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userIdToFollow)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userIdToFollow);

      if (error) return { success: false, error: error.message };
      return { success: true, following: false };
    } else {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userIdToFollow,
        });

      if (error) return { success: false, error: error.message };
      return { success: true, following: true };
    }
  } catch (error) {
    return { success: false, error: 'Failed to follow/unfollow user' };
  }
}
