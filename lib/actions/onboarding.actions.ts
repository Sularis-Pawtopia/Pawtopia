'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AdopterProfileFormData, ShelterProfileFormData } from '@/lib/validations';

export async function submitAdopterOnboarding(
  userId: string,
  formData: AdopterProfileFormData,
  fileUrls: { home_photos: string[]; valid_ids: string[] }
) {
  const supabase = await createClient();

  // Create adopter profile
  const { error: profileError } = await supabase.from('adopter_profiles').insert({
    user_id: userId,
    first_name: formData.first_name,
    last_name: formData.last_name,
    date_of_birth: formData.date_of_birth,
    occupation: formData.occupation,
    income_range: formData.income_range,
    household_size: formData.household_size,
    has_children: formData.has_children,
    has_other_pets: formData.has_other_pets,
    pet_experience: formData.pet_experience,
    home_type: formData.home_type,
    home_ownership: formData.home_ownership,
    yard_size: formData.yard_size,
    home_photos: fileUrls.home_photos,
    valid_id_urls: fileUrls.valid_ids,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  // Update user as verified
  const { error: userError } = await supabase
    .from('users')
    .update({
      is_verified: true,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
    })
    .eq('id', userId);

  if (userError) {
    return { error: userError.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard');
}

export async function submitShelterOnboarding(
  userId: string,
  formData: ShelterProfileFormData,
  fileUrls: { license_document?: string; verification_documents: string[] }
) {
  const supabase = await createClient();

  // Create shelter profile
  const { error: profileError } = await supabase.from('shelter_profiles').insert({
    user_id: userId,
    shelter_name: formData.shelter_name,
    description: formData.description,
    website: formData.website,
    registration_number: formData.registration_number,
    license_document_url: fileUrls.license_document,
    verification_documents: fileUrls.verification_documents,
    capacity: formData.capacity,
    social_media: (formData as any).social_media,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  // Update user as verified
  const { error: userError } = await supabase
    .from('users')
    .update({
      is_verified: true,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
    })
    .eq('id', userId);

  if (userError) {
    return { error: userError.message };
  }

  revalidatePath('/shelter');
  redirect('/shelter');
}

export async function updateAdopterProfile(
  profileId: string,
  data: Partial<AdopterProfileFormData>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('adopter_profiles')
    .update(data)
    .eq('id', profileId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function updateShelterProfile(
  profileId: string,
  data: Partial<ShelterProfileFormData>
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('shelter_profiles')
    .update(data)
    .eq('id', profileId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/profile');
  return { success: true };
}

export async function getAdopterProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('adopter_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getShelterProfile(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('shelter_profiles')
    .select('*, users(*)')
    .eq('user_id', userId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data };
}
