'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { AdoptionStatus } from '@/types';

export async function createAdoptionRequest(
  petId: string,
  applicationData?: Record<string, unknown>
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Verify the user is an adopter
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userData || userData.role !== 'adopter') {
    return { error: 'Only adopters can submit adoption requests' };
  }

  // Get pet to find shelter_id
  const { data: pet } = await supabase
    .from('pets')
    .select('shelter_id')
    .eq('id', petId)
    .single();

  if (!pet) {
    return { error: 'Pet not found' };
  }

  // Check if already applied
  const { data: existing } = await supabase
    .from('adoption_requests')
    .select('id')
    .eq('pet_id', petId)
    .eq('adopter_id', user.id)
    .single();

  if (existing) {
    return { error: 'You have already applied for this pet' };
  }

  // Auto-attach adopter profile + user info as application data
  const { data: adopterProfile } = await supabase
    .from('adopter_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  const { data: adopterUser } = await supabase
    .from('users')
    .select('email, phone, address, city, state, username')
    .eq('id', user.id)
    .single();

  const fullApplicationData = {
    ...applicationData,
    adopter_profile: adopterProfile || {},
    adopter_user: adopterUser || {},
  };

  const { data, error } = await supabase
    .from('adoption_requests')
    .insert({
      pet_id: petId,
      adopter_id: user.id,
      shelter_id: pet.shelter_id,
      application_data: fullApplicationData,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Update pet status to pending
  await supabase
    .from('pets')
    .update({ status: 'pending' })
    .eq('id', petId);

  revalidatePath(`/pets/${petId}`);
  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function cancelAdoptionRequest(
  requestId: string,
  _reason?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Get the request to verify ownership and get pet_id
  const { data: request } = await supabase
    .from('adoption_requests')
    .select('id, adopter_id, pet_id, status')
    .eq('id', requestId)
    .single();

  if (!request) return { error: 'Request not found' };
  if (request.adopter_id !== user.id) return { error: 'Not authorized' };
  if (request.status !== 'pending') return { error: 'Only pending requests can be cancelled' };

  // Delete the request
  const { error } = await supabase
    .from('adoption_requests')
    .delete()
    .eq('id', requestId);

  if (error) return { error: error.message };

  // Check if any other pending requests exist for this pet — if not, reset to available
  const { data: otherRequests } = await supabase
    .from('adoption_requests')
    .select('id')
    .eq('pet_id', request.pet_id)
    .in('status', ['pending', 'approved']);

  if (!otherRequests || otherRequests.length === 0) {
    await supabase
      .from('pets')
      .update({ status: 'available' })
      .eq('id', request.pet_id);
  }

  revalidatePath('/dashboard');
  revalidatePath('/shelter');
  return { success: true };
}

export async function updateAdoptionRequestStatus(
  requestId: string,
  status: AdoptionStatus,
  notes?: string,
  rejectionReason?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const updateData: Record<string, unknown> = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: user.id,
  };

  if (notes) updateData.notes = notes;
  if (rejectionReason) updateData.rejection_reason = rejectionReason;

  const { data: request, error } = await supabase
    .from('adoption_requests')
    .update(updateData)
    .eq('id', requestId)
    .eq('shelter_id', user.id)
    .select(`
      *,
      pet:pets(*),
      adopter:users!adoption_requests_adopter_id_fkey(
        id,
        username,
        email,
        phone,
        adopter_profile:adopter_profiles(*)
      )
    `)
    .single();

  if (error) {
    return { error: error.message };
  }

  // If approved, update pet status
  if (status === 'approved') {
    await supabase
      .from('pets')
      .update({ status: 'pending' })
      .eq('id', request.pet.id);
  }

  // If rejected, check if there are other pending requests
  if (status === 'rejected') {
    const { data: otherRequests } = await supabase
      .from('adoption_requests')
      .select('id')
      .eq('pet_id', request.pet.id)
      .eq('status', 'pending');

    if (!otherRequests || otherRequests.length === 0) {
      await supabase
        .from('pets')
        .update({ status: 'available' })
        .eq('id', request.pet.id);
    }
  }

  revalidatePath('/shelter');
  revalidatePath(`/pets/${request.pet.id}`);
  return { success: true, data: request };
}

export async function completeAdoption(
  requestId: string,
  adoptionFee: number,
  contractUrl?: string
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Get adoption request
  const { data: request } = await supabase
    .from('adoption_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!request) {
    return { error: 'Adoption request not found' };
  }

  // Create adoption record
  const { data: adoption, error: adoptionError } = await supabase
    .from('adoptions')
    .insert({
      pet_id: request.pet_id,
      adopter_id: request.adopter_id,
      shelter_id: request.shelter_id,
      adoption_request_id: requestId,
      adoption_fee_paid: adoptionFee,
      contract_url: contractUrl,
      contract_signed: !!contractUrl,
    })
    .select()
    .single();

  if (adoptionError) {
    return { error: adoptionError.message };
  }

  // Update request status
  await supabase
    .from('adoption_requests')
    .update({ status: 'completed' })
    .eq('id', requestId);

  // Update pet status
  await supabase
    .from('pets')
    .update({
      status: 'adopted',
      owner_id: request.adopter_id,
      is_for_adoption: false,
    })
    .eq('id', request.pet_id);

  // Reject other pending requests for this pet
  await supabase
    .from('adoption_requests')
    .update({ 
      status: 'rejected',
      rejection_reason: 'Pet has been adopted by another applicant'
    })
    .eq('pet_id', request.pet_id)
    .eq('status', 'pending');

  revalidatePath('/shelter');
  revalidatePath(`/pets/${request.pet_id}`);
  return { success: true, data: adoption };
}

export async function getAdoptionRequests(shelterId: string, status?: AdoptionStatus) {
  const supabase = await createClient();

  let query = supabase
    .from('adoption_requests')
    .select(`
      *,
      pet:pets(
        *,
        post:posts(*)
      ),
      adopter:users!adoption_requests_adopter_id_fkey(
        id,
        username,
        email,
        phone,
        avatar_url,
        address,
        city,
        state,
        adopter_profile:adopter_profiles(*)
      )
    `)
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getUserAdoptionRequests(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('adoption_requests')
    .select(`
      *,
      pet:pets(
        *,
        post:posts(*),
        shelter:users!pets_shelter_id_fkey(
          id,
          username,
          avatar_url,
          phone,
          email,
          shelter_profile:shelter_profiles(*)
        )
      )
    `)
    .eq('adopter_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}

export async function getAdoptionRequestForPet(petId: string, adopterId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('adoption_requests')
    .select('id, status, created_at')
    .eq('pet_id', petId)
    .eq('adopter_id', adopterId)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { error: error.message };
  }

  return { data };
}

export async function getMyAdoptionRequestForPet(petId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null };

  const { data, error } = await supabase
    .from('adoption_requests')
    .select('id, status, created_at')
    .eq('pet_id', petId)
    .eq('adopter_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') {
    return { error: error.message };
  }

  return { data: data || null };
}

export async function getAdoptionRequestCountForPet(petId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from('adoption_requests')
    .select('*', { count: 'exact', head: true })
    .eq('pet_id', petId);

  if (error) {
    return { error: error.message };
  }

  return { count: count || 0 };
}

export async function getAdoptedPets(userId: string, role: 'adopter' | 'shelter') {
  const supabase = await createClient();

  const column = role === 'adopter' ? 'adopter_id' : 'shelter_id';

  const { data, error } = await supabase
    .from('adoptions')
    .select(`
      *,
      pet:pets(
        *,
        post:posts(*)
      ),
      adopter:users!adoptions_adopter_id_fkey(
        id,
        username,
        avatar_url
      ),
      shelter:users!adoptions_shelter_id_fkey(
        id,
        username,
        avatar_url
      )
    `)
    .eq(column, userId)
    .order('adoption_date', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}
