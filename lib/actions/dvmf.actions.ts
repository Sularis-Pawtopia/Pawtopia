'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

interface CreateRegistryInput {
  pet_name: string;
  markings: string;
  sex: 'male' | 'female';
  birth_date?: string;
  is_vaccinated: boolean;
  last_vaccination_date?: string;
  is_spayed_neutered: boolean;
  owner_name: string;
  owner_address: string;
  pet_photo_url?: string;
  notes?: string;
}

interface UpdateRegistryInput extends CreateRegistryInput {
  id: string;
}

async function getAuthedDvmfUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { supabase, user: null, profile: null };

  const { data: profile } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single();

  return { supabase, user, profile };
}

export async function getDvmfRegistryRecords() {
  const { supabase, user, profile } = await getAuthedDvmfUser();
  if (!user || !profile) return { success: false, error: 'Not authenticated' };
  if (!['dvmf', 'admin'].includes(profile.role)) {
    return { success: false, error: 'Not authorized' };
  }

  const query = (supabase as any)
    .from('dvmf_pet_registry')
    .select('*')
    .order('created_at', { ascending: false });

  const scopedQuery = profile.role === 'admin' ? query : query.eq('dvmf_id', user.id);
  const { data, error } = await scopedQuery;

  if (error) return { success: false, error: error.message };
  return { success: true, data: data || [] };
}

export async function createDvmfRegistryRecord(input: CreateRegistryInput) {
  const { supabase, user, profile } = await getAuthedDvmfUser();
  if (!user || !profile) return { success: false, error: 'Not authenticated' };
  if (profile.role !== 'dvmf') {
    return { success: false, error: 'Only DVMF accounts can register records' };
  }

  if (input.is_vaccinated && !input.last_vaccination_date) {
    return { success: false, error: 'Last vaccination date is required when vaccinated is yes' };
  }

  if (!input.is_vaccinated && input.last_vaccination_date) {
    return { success: false, error: 'Last vaccination date must be empty when vaccinated is no' };
  }

  const { data, error } = await (supabase as any)
    .from('dvmf_pet_registry')
    .insert({
      dvmf_id: user.id,
      registered_by: user.id,
      pet_name: input.pet_name,
      markings: input.markings,
      sex: input.sex,
      birth_date: input.birth_date || null,
      is_vaccinated: input.is_vaccinated,
      last_vaccination_date: input.last_vaccination_date || null,
      is_spayed_neutered: input.is_spayed_neutered,
      owner_name: input.owner_name,
      owner_address: input.owner_address,
      pet_photo_url: input.pet_photo_url || null,
      notes: input.notes || null,
    })
    .select('*')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dvmf');
  return { success: true, data };
}

export async function updateDvmfRegistryRecord(input: UpdateRegistryInput) {
  const { supabase, user, profile } = await getAuthedDvmfUser();
  if (!user || !profile) return { success: false, error: 'Not authenticated' };
  if (profile.role !== 'dvmf') {
    return { success: false, error: 'Only DVMF accounts can update records' };
  }

  if (input.is_vaccinated && !input.last_vaccination_date) {
    return { success: false, error: 'Last vaccination date is required when vaccinated is yes' };
  }

  if (!input.is_vaccinated && input.last_vaccination_date) {
    return { success: false, error: 'Last vaccination date must be empty when vaccinated is no' };
  }

  const { data: existing, error: existingError } = await (supabase as any)
    .from('dvmf_pet_registry')
    .select('id, dvmf_id')
    .eq('id', input.id)
    .single();

  if (existingError || !existing) {
    return { success: false, error: 'Registry record not found' };
  }

  if (existing.dvmf_id !== user.id) {
    return { success: false, error: 'Not authorized to update this record' };
  }

  const { data, error } = await (supabase as any)
    .from('dvmf_pet_registry')
    .update({
      pet_name: input.pet_name,
      markings: input.markings,
      sex: input.sex,
      birth_date: input.birth_date || null,
      is_vaccinated: input.is_vaccinated,
      last_vaccination_date: input.last_vaccination_date || null,
      is_spayed_neutered: input.is_spayed_neutered,
      owner_name: input.owner_name,
      owner_address: input.owner_address,
      pet_photo_url: input.pet_photo_url || null,
      notes: input.notes || null,
    })
    .eq('id', input.id)
    .eq('dvmf_id', user.id)
    .select('*')
    .single();

  if (error) return { success: false, error: error.message };

  revalidatePath('/dvmf');
  return { success: true, data };
}

export async function deleteDvmfRegistryRecord(id: string) {
  const { supabase, user, profile } = await getAuthedDvmfUser();
  if (!user || !profile) return { success: false, error: 'Not authenticated' };
  if (profile.role !== 'dvmf') {
    return { success: false, error: 'Only DVMF accounts can delete records' };
  }

  const { data: existing, error: existingError } = await (supabase as any)
    .from('dvmf_pet_registry')
    .select('id, dvmf_id')
    .eq('id', id)
    .single();

  if (existingError || !existing) {
    return { success: false, error: 'Registry record not found' };
  }

  if (existing.dvmf_id !== user.id) {
    return { success: false, error: 'Not authorized to delete this record' };
  }

  const { error } = await (supabase as any)
    .from('dvmf_pet_registry')
    .delete()
    .eq('id', id)
    .eq('dvmf_id', user.id);

  if (error) return { success: false, error: error.message };

  revalidatePath('/dvmf');
  return { success: true };
}
