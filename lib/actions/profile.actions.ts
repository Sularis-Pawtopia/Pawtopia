'use server';

import { createClient } from '@/lib/supabase/server';

export async function getUserProfile(userId: string) {
  try {
    const supabase = await createClient();

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
    let profileData = null;
    
    if (user.role === 'shelter') {
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
        .eq('shelter_profile_id', userId);

      const { count: adoptionsCount } = await supabase
        .from('adoptions')
        .select('*', { count: 'exact', head: true })
        .eq('shelter_profile_id', userId);

      profileData = {
        ...profileData,
        stats: {
          totalPets: petsCount || 0,
          successfulAdoptions: adoptionsCount || 0,
        }
      };
    } else if (user.role === 'adopter') {
      const { data: adopterProfile } = await supabase
        .from('adopter_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      profileData = adopterProfile;

      // Get adopter stats
      const { count: adoptedPetsCount } = await supabase
        .from('adoptions')
        .select('*', { count: 'exact', head: true })
        .eq('adopter_profile_id', userId);

      profileData = {
        ...profileData,
        stats: {
          adoptedPets: adoptedPetsCount || 0,
        }
      };
    }

    return {
      success: true,
      data: {
        ...user,
        profile: profileData,
      }
    };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { success: false, error: 'Failed to fetch profile' };
  }
}

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

export async function followUser(userIdToFollow: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userIdToFollow)
      .single();

    if (existing) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userIdToFollow);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, following: false };
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userIdToFollow,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, following: true };
    }
  } catch (error) {
    return { success: false, error: 'Failed to follow/unfollow user' };
  }
}
