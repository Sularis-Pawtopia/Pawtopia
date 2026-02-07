'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PetFormData } from '@/lib/validations';
import type { PetStatus } from '@/types';

export async function createPet(
  shelterId: string,
  formData: PetFormData,
  mediaUrls: string[]
) {
  const supabase = await createClient();

  // 0. Verify shelter is approved before allowing pet creation
  const { data: shelterUser } = await supabase
    .from('users')
    .select('is_verified')
    .eq('id', shelterId)
    .single();

  if (!shelterUser?.is_verified) {
    return { error: 'Your shelter account is pending verification. You cannot post pets until an admin approves your account.' };
  }

  // 1. Create post
  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      user_id: shelterId,
      post_type: 'adoptable',
      title: `Meet ${formData.name}!`,
      description: formData.description,
      media_urls: mediaUrls,
      tags: formData.tags || [],
    })
    .select()
    .single();

  if (postError || !post) {
    return { error: postError?.message || 'Failed to create post' };
  }

  // 2. Create pet
  const { data: pet, error: petError } = await supabase
    .from('pets')
    .insert({
      post_id: post.id,
      shelter_id: shelterId,
      name: formData.name,
      species: formData.species,
      breed: formData.breed,
      age_years: formData.age_years,
      age_months: formData.age_months,
      gender: formData.gender,
      size: formData.size,
      color: formData.color,
      weight: formData.weight,
      status: 'available',
      is_vaccinated: formData.is_vaccinated,
      is_spayed_neutered: formData.is_spayed_neutered,
      medical_history: formData.medical_history,
      temperament: formData.temperament,
      good_with_kids: formData.good_with_kids,
      good_with_dogs: formData.good_with_dogs,
      good_with_cats: formData.good_with_cats,
      energy_level: formData.energy_level,
      special_needs: formData.special_needs,
      adoption_fee: formData.adoption_fee,
    })
    .select()
    .single();

  if (petError) {
    return { error: petError.message };
  }

  revalidatePath('/shelter');
  revalidatePath('/dashboard');
  return { success: true, data: pet };
}

export async function updatePet(
  petId: string,
  formData: Partial<PetFormData>,
  mediaUrls?: string[]
) {
  const supabase = await createClient();

  // Get pet with post
  const { data: pet } = await supabase
    .from('pets')
    .select('post_id')
    .eq('id', petId)
    .single();

  if (!pet) {
    return { error: 'Pet not found' };
  }

  // Update post if description or media changed
  if (formData.description || mediaUrls) {
    const postUpdate: Record<string, unknown> = {};
    if (formData.description) postUpdate.description = formData.description;
    if (mediaUrls) postUpdate.media_urls = mediaUrls;
    if (formData.tags) postUpdate.tags = formData.tags;

    const { error: postError } = await supabase
      .from('posts')
      .update(postUpdate)
      .eq('id', pet.post_id);

    if (postError) {
      return { error: postError.message };
    }
  }

  // Update pet
  const petUpdate: Record<string, unknown> = {};
  Object.entries(formData).forEach(([key, value]) => {
    if (value !== undefined && key !== 'description' && key !== 'tags' && key !== 'media') {
      petUpdate[key] = value;
    }
  });

  const { error: petError } = await supabase
    .from('pets')
    .update(petUpdate)
    .eq('id', petId);

  if (petError) {
    return { error: petError.message };
  }

  revalidatePath('/shelter');
  revalidatePath(`/pets/${petId}`);
  return { success: true };
}

export async function updatePetStatus(petId: string, status: PetStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('pets')
    .update({ status })
    .eq('id', petId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/shelter');
  revalidatePath(`/pets/${petId}`);
  return { success: true };
}

export async function deletePet(petId: string) {
  const supabase = await createClient();

  // Get post_id first
  const { data: pet } = await supabase
    .from('pets')
    .select('post_id')
    .eq('id', petId)
    .single();

  if (!pet) {
    return { error: 'Pet not found' };
  }

  // Delete pet (will cascade to post due to FK constraint)
  const { error } = await supabase
    .from('pets')
    .delete()
    .eq('id', petId);

  if (error) {
    return { error: error.message };
  }

  // Delete post
  await supabase.from('posts').delete().eq('id', pet.post_id);

  revalidatePath('/shelter');
  return { success: true };
}

export async function getPet(petId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      post:posts(*),
      shelter:users!pets_shelter_id_fkey(
        id,
        username,
        avatar_url,
        bio,
        city,
        state,
        shelter_profile:shelter_profiles(*)
      )
    `)
    .eq('id', petId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getAvailablePets(filters?: {
  species?: string;
  breed?: string;
  size?: string;
  gender?: string;
  shelter_id?: string;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();

  let query = supabase
    .from('pets')
    .select(`
      *,
      post:posts(*),
      shelter:users!pets_shelter_id_fkey(
        id,
        username,
        avatar_url,
        city,
        state,
        shelter_profile:shelter_profiles(
          shelter_name,
          phone
        )
      )
    `, { count: 'exact' })
    .eq('status', 'available')
    .order('created_at', { ascending: false });

  // Apply filters
  if (filters?.species) query = query.eq('species', filters.species);
  if (filters?.breed) query = query.ilike('breed', `%${filters.breed}%`);
  if (filters?.size) query = query.eq('size', filters.size);
  if (filters?.gender) query = query.eq('gender', filters.gender);
  if (filters?.shelter_id) query = query.eq('shelter_id', filters.shelter_id);

  // Pagination
  if (filters?.limit) {
    query = query.limit(filters.limit);
  }
  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data, count };
}

export async function getShelterPets(shelterId: string, status?: PetStatus) {
  const supabase = await createClient();

  let query = supabase
    .from('pets')
    .select('*, post:posts(*)', { count: 'exact' })
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error, count } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data, count };
}

export async function searchPets(searchTerm: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('pets')
    .select(`
      *,
      post:posts(*),
      shelter:users!pets_shelter_id_fkey(
        id,
        username,
        avatar_url,
        city,
        state
      )
    `)
    .eq('status', 'available')
    .or(`name.ilike.%${searchTerm}%,breed.ilike.%${searchTerm}%,species.ilike.%${searchTerm}%`)
    .limit(20);

  if (error) {
    return { error: error.message };
  }

  return { data };
}
