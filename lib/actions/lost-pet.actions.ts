'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getLostPets(filters?: {
  status?: 'lost' | 'found' | 'reunited';
  species?: string;
  location?: string;
}) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('lost_pets')
      .select(`
        *,
        users:user_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.species) {
      query = query.eq('species', filters.species);
    }

    const { data: pets, error } = await query;

    if (error) {
      console.error('Error fetching lost pets:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: pets || [] };
  } catch (error) {
    console.error('Get lost pets error:', error);
    return { success: false, error: 'Failed to fetch lost pets' };
  }
}

export async function createLostPet(formData: {
  pet_name: string;
  species: string;
  breed?: string;
  color?: string;
  size?: string;
  last_seen_location: string;
  last_seen_date: string;
  description: string;
  contact_info: string;
  photo_urls?: string[];
  status: 'lost' | 'found';
  reward_offered?: number;
}) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: lostPet, error } = await supabase
      .from('lost_pets')
      .insert({
        user_id: user.id,
        ...formData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating lost pet post:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/lost-pets');
    return { success: true, data: lostPet };
  } catch (error) {
    console.error('Create lost pet error:', error);
    return { success: false, error: 'Failed to create lost pet post' };
  }
}

export async function updateLostPetStatus(
  petId: string,
  status: 'lost' | 'found' | 'reunited'
) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { error } = await supabase
      .from('lost_pets')
      .update({ status })
      .eq('id', petId)
      .eq('user_id', user.id); // Ensure user owns the post

    if (error) {
      console.error('Error updating lost pet status:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/lost-pets');
    return { success: true };
  } catch (error) {
    console.error('Update lost pet status error:', error);
    return { success: false, error: 'Failed to update status' };
  }
}
