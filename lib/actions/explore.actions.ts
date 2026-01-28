'use server';

import { createClient } from '@/lib/supabase/server';

export async function getExplorePets(filters?: {
  species?: string;
  age?: string;
  size?: string;
  gender?: string;
  goodWithKids?: boolean;
  goodWithPets?: boolean;
  city?: string;
  state?: string;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('pets')
      .select(`
        *,
        shelter:shelter_profile_id (
          id,
          user_id,
          shelter_name,
          city,
          state
        )
      `)
      .eq('adoption_status', 'available')
      .order('created_at', { ascending: false })
      .limit(12);

    if (filters?.species) {
      query = query.eq('species', filters.species);
    }
    if (filters?.age) {
      query = query.eq('age_category', filters.age);
    }
    if (filters?.size) {
      query = query.eq('size', filters.size);
    }
    if (filters?.gender) {
      query = query.eq('gender', filters.gender);
    }
    if (filters?.goodWithKids !== undefined) {
      query = query.eq('good_with_kids', filters.goodWithKids);
    }
    if (filters?.goodWithPets !== undefined) {
      query = query.eq('good_with_pets', filters.goodWithPets);
    }

    const { data: pets, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: pets || [] };
  } catch (error) {
    console.error('Get explore pets error:', error);
    return { success: false, error: 'Failed to fetch pets' };
  }
}

export async function getFeaturedShelters(limit: number = 6) {
  try {
    const supabase = await createClient();

    const { data: shelters, error } = await supabase
      .from('shelter_profiles')
      .select(`
        *,
        user:user_id (
          id,
          username,
          full_name,
          avatar_url,
          is_verified
        )
      `)
      .eq('is_verified', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { success: false, error: error.message };
    }

    // Get pet counts for each shelter
    const sheltersWithCounts = await Promise.all(
      (shelters || []).map(async (shelter: any) => {
        const { count } = await supabase
          .from('pets')
          .select('*', { count: 'exact', head: true })
          .eq('shelter_profile_id', shelter.user_id)
          .eq('adoption_status', 'available');

        return {
          ...shelter,
          availablePets: count || 0,
        };
      })
    );

    return { success: true, data: sheltersWithCounts };
  } catch (error) {
    return { success: false, error: 'Failed to fetch shelters' };
  }
}

export async function getRecommendedPets(userId: string) {
  try {
    const supabase = await createClient();

    // Get user preferences
    const { data: profile } = await supabase
      .from('adopter_profiles')
      .select('preferred_species, preferred_age, preferred_size')
      .eq('user_id', userId)
      .single();

    let query = supabase
      .from('pets')
      .select(`
        *,
        shelter:shelter_profile_id (
          id,
          user_id,
          shelter_name,
          city,
          state
        )
      `)
      .eq('adoption_status', 'available')
      .limit(8);

    if (profile?.preferred_species) {
      query = query.eq('species', profile.preferred_species);
    }
    if (profile?.preferred_age) {
      query = query.eq('age_category', profile.preferred_age);
    }
    if (profile?.preferred_size) {
      query = query.eq('size', profile.preferred_size);
    }

    const { data: pets, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: pets || [] };
  } catch (error) {
    return { success: false, error: 'Failed to fetch recommendations' };
  }
}
