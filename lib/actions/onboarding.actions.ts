'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { AdopterProfileFormData, ShelterProfileFormData } from '@/lib/validations';

// Volunteer onboarding types
interface VolunteerOnboardingData {
  application_reason: string;
  skills: string[];
  preferred_activities: string[];
  experience_level: string;
  has_vehicle: boolean;
  can_handle_animals: boolean;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  availability: Record<string, boolean>;
  phone: string;
  address: string;
  city: string;
  state: string;
}

// NGO onboarding types
interface NgoOnboardingData {
  organization_name: string;
  description: string;
  registration_number?: string;
  website?: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  service_areas: string[];
}

// City Pound onboarding types
interface CityPoundOnboardingData {
  organization_name: string;
  description: string;
  registration_number: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  capacity: number;
  service_areas: string[];
}

export async function submitVolunteerOnboarding(
  userId: string,
  formData: VolunteerOnboardingData
) {
  const supabase = await createClient();

  // Create volunteer profile
  const { error: profileError } = await supabase.from('volunteer_profiles').insert({
    user_id: userId,
    status: 'pending',
    application_reason: formData.application_reason,
    skills: formData.skills,
    preferred_activities: formData.preferred_activities,
    experience_level: formData.experience_level,
    has_vehicle: formData.has_vehicle,
    can_handle_animals: formData.can_handle_animals,
    emergency_contact_name: formData.emergency_contact_name,
    emergency_contact_phone: formData.emergency_contact_phone,
    availability: formData.availability,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  // Update user contact info (verified after admin approval)
  const { error: userError } = await supabase
    .from('users')
    .update({
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
    })
    .eq('id', userId);

  if (userError) {
    return { error: userError.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard?onboarding=volunteer-submitted');
}

export async function submitNgoOnboarding(
  userId: string,
  formData: NgoOnboardingData
) {
  const supabase = await createClient();

  // Update or create organization profile
  const { error: orgError } = await supabase
    .from('organization_profiles')
    .upsert({
      user_id: userId,
      organization_type: 'ngo',
      organization_name: formData.organization_name,
      description: formData.description,
      registration_number: formData.registration_number || null,
      website: formData.website || null,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      service_areas: formData.service_areas,
      verification_status: 'pending',
      is_active: true,
    }, {
      onConflict: 'user_id',
    });

  if (orgError) {
    return { error: orgError.message };
  }

  // Update user as verified (NGOs can post events immediately)
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

export async function submitCityPoundOnboarding(
  userId: string,
  formData: CityPoundOnboardingData
) {
  const supabase = await createClient();

  // Update or create organization profile
  const { error: orgError } = await supabase
    .from('organization_profiles')
    .upsert({
      user_id: userId,
      organization_type: 'city_pound',
      organization_name: formData.organization_name,
      description: formData.description,
      registration_number: formData.registration_number,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip_code: formData.zip_code,
      service_areas: formData.service_areas,
      verification_status: 'pending',
      is_active: true,
    }, {
      onConflict: 'user_id',
    });

  if (orgError) {
    return { error: orgError.message };
  }

  // Create shelter profile for pet management
  const { error: shelterError } = await supabase.from('shelter_profiles').insert({
    user_id: userId,
    shelter_name: formData.organization_name,
    description: formData.description,
    capacity: formData.capacity,
  });

  if (shelterError && !shelterError.message.includes('duplicate')) {
    console.error('Shelter profile error:', shelterError);
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

// Regular User onboarding types
interface RegularUserOnboardingData {
  phone: string | null;
  city: string;
  state: string;
  bio: string;
  interests: string[];
  notification_preferences: {
    adoptionAlerts: boolean;
    eventUpdates: boolean;
    communityPosts: boolean;
    lostPetAlerts: boolean;
  };
}

export async function submitRegularUserOnboarding(
  userId: string,
  formData: RegularUserOnboardingData
) {
  const supabase = await createClient();

  // Update user profile
  const { error: userError } = await supabase
    .from('users')
    .update({
      phone: formData.phone,
      city: formData.city,
      state: formData.state,
      bio: formData.bio,
      is_verified: true,
    })
    .eq('id', userId);

  if (userError) {
    return { error: userError.message };
  }

  revalidatePath('/dashboard');
  redirect('/dashboard?onboarding=complete');
}
