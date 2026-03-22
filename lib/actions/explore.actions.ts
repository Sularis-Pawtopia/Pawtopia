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
        post:posts!inner(id, post_type, is_active, description, media_urls),
        shelter:users!pets_shelter_id_fkey (
          id,
          username,
          city,
          state,
          shelter_profile:shelter_profiles(shelter_name)
        )
      `)
      .eq('status', 'available')
      .eq('is_for_adoption', true)
      .is('owner_id', null)
      .not('shelter_id', 'is', null)
      .eq('post.post_type', 'adoptable')
      .eq('post.is_active', true)
      .order('created_at', { ascending: false })
      .limit(12);

    if (filters?.species) {
      query = query.eq('species', filters.species);
    }
    if (filters?.age) {
      if (filters.age === 'puppy_kitten') {
        query = query.lte('age_years', 1);
      } else if (filters.age === 'young') {
        query = query.gte('age_years', 1).lte('age_years', 3);
      } else if (filters.age === 'adult') {
        query = query.gte('age_years', 3).lte('age_years', 7);
      } else if (filters.age === 'senior') {
        query = query.gte('age_years', 7);
      }
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
      if (filters.goodWithPets) {
        query = query.or('good_with_dogs.eq.true,good_with_cats.eq.true');
      }
    }

    const { data: pets, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const normalized = (pets || []).map((pet: any) => ({
      ...pet,
      description: pet.post?.description || '',
      photos: Array.isArray(pet.post?.media_urls) ? pet.post.media_urls : [],
      shelter: {
        shelter_name: pet.shelter?.shelter_profile?.shelter_name || pet.shelter?.username || 'Shelter',
        city: pet.shelter?.city || '',
        state: pet.shelter?.state || '',
      },
      good_with_pets: Boolean(pet.good_with_dogs || pet.good_with_cats),
    }));

    return { success: true, data: normalized };
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
          .eq('shelter_id', shelter.user_id)
          .eq('status', 'available')
          .eq('is_for_adoption', true);

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
        post:posts!inner(id, post_type, is_active, description, media_urls),
        shelter:users!pets_shelter_id_fkey (
          id,
          username,
          city,
          state,
          shelter_profile:shelter_profiles(shelter_name)
        )
      `)
      .eq('status', 'available')
      .eq('is_for_adoption', true)
      .is('owner_id', null)
      .not('shelter_id', 'is', null)
      .eq('post.post_type', 'adoptable')
      .eq('post.is_active', true)
      .limit(8);

    if (profile?.preferred_species) {
      query = query.eq('species', profile.preferred_species);
    }
    if (profile?.preferred_age) {
      if (profile.preferred_age === 'puppy_kitten') {
        query = query.lte('age_years', 1);
      } else if (profile.preferred_age === 'young') {
        query = query.gte('age_years', 1).lte('age_years', 3);
      } else if (profile.preferred_age === 'adult') {
        query = query.gte('age_years', 3).lte('age_years', 7);
      } else if (profile.preferred_age === 'senior') {
        query = query.gte('age_years', 7);
      }
    }
    if (profile?.preferred_size) {
      query = query.eq('size', profile.preferred_size);
    }

    const { data: pets, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    const normalized = (pets || []).map((pet: any) => ({
      ...pet,
      description: pet.post?.description || '',
      photos: Array.isArray(pet.post?.media_urls) ? pet.post.media_urls : [],
      shelter: {
        shelter_name: pet.shelter?.shelter_profile?.shelter_name || pet.shelter?.username || 'Shelter',
        city: pet.shelter?.city || '',
        state: pet.shelter?.state || '',
      },
      good_with_pets: Boolean(pet.good_with_dogs || pet.good_with_cats),
    }));

    return { success: true, data: normalized };
  } catch (error) {
    return { success: false, error: 'Failed to fetch recommendations' };
  }
}
