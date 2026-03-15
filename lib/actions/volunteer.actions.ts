'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { 
  VolunteerProfile, 
  VolunteerProfileInsert,
  VolunteerProfileUpdate,
  EventVolunteer,
  EventVolunteerInsert,
  EventVolunteerUpdate,
  ActionResponse,
  VolunteerFilters
} from '@/types/expanded.types';

async function requireEventOrganizerAccess(applicationId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Authentication required' as const };
  }

  const { data: application, error: applicationError } = await supabase
    .from('event_volunteers')
    .select('event_id')
    .eq('id', applicationId)
    .single();

  if (applicationError || !application) {
    return { error: 'Volunteer application not found' as const };
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, shelter_id, organizer_id')
    .eq('id', application.event_id)
    .single();

  if (eventError || !event) {
    return { error: 'Event not found' as const };
  }

  if (event.shelter_id !== user.id && event.organizer_id !== user.id) {
    return { error: 'Forbidden' as const };
  }

  return { supabase };
}

// =============================================
// APPLY AS VOLUNTEER
// =============================================

export async function applyAsVolunteer(
  data: VolunteerProfileInsert
): Promise<ActionResponse<VolunteerProfile>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Check if already applied
    const { data: existing } = await supabase
      .from('volunteer_profiles')
      .select('id, status')
      .eq('user_id', user.id)
      .single();
    
    if (existing) {
      if (existing.status === 'approved') {
        return { success: false, error: 'You are already an approved volunteer' };
      }
      if (existing.status === 'pending') {
        return { success: false, error: 'You already have a pending application' };
      }
    }
    
    const insertData: VolunteerProfileInsert = {
      ...data,
      user_id: user.id,
    };
    
    const { data: profile, error } = await supabase
      .from('volunteer_profiles')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Apply as volunteer error:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/volunteers');
    revalidatePath('/profile');
    return { success: true, data: profile as VolunteerProfile };
  } catch (error) {
    console.error('Apply as volunteer error:', error);
    return { success: false, error: 'Failed to submit volunteer application' };
  }
}

// =============================================
// GET VOLUNTEER PROFILE
// =============================================

export async function getVolunteerProfile(
  userId?: string
): Promise<ActionResponse<VolunteerProfile | null>> {
  try {
    const supabase = await createClient();
    
    let targetUserId = userId;
    if (!targetUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Authentication required' };
      }
      targetUserId = user.id;
    }
    
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') { // Not found is ok
      console.error('Get volunteer profile error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as VolunteerProfile | null };
  } catch (error) {
    console.error('Get volunteer profile error:', error);
    return { success: false, error: 'Failed to fetch volunteer profile' };
  }
}

// =============================================
// GET ALL VOLUNTEER APPLICATIONS (Admin)
// =============================================

export async function getVolunteerApplications(
  filters: VolunteerFilters = {}
): Promise<ActionResponse<VolunteerProfile[]>> {
  try {
    const supabase = await createClient();
    
    let query = supabase
      .from('volunteer_profiles')
      .select(`
        *,
        user:users(id, username, email, avatar_url)
      `);
    
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.has_vehicle !== undefined) {
      query = query.eq('has_vehicle', filters.has_vehicle);
    }
    if (filters.can_handle_animals !== undefined) {
      query = query.eq('can_handle_animals', filters.can_handle_animals);
    }
    if (filters.experience_level) {
      query = query.eq('experience_level', filters.experience_level);
    }
    
    const { data, error } = await query
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get volunteer applications error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as VolunteerProfile[] };
  } catch (error) {
    console.error('Get volunteer applications error:', error);
    return { success: false, error: 'Failed to fetch volunteer applications' };
  }
}

// =============================================
// REVIEW VOLUNTEER APPLICATION (Admin)
// =============================================

export async function reviewVolunteerApplication(
  profileId: string,
  update: VolunteerProfileUpdate
): Promise<ActionResponse<VolunteerProfile>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const updateData: VolunteerProfileUpdate = {
      ...update,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single();
    
    if (error) {
      console.error('Review volunteer error:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/volunteers');
    return { success: true, data: data as VolunteerProfile };
  } catch (error) {
    console.error('Review volunteer error:', error);
    return { success: false, error: 'Failed to review volunteer application' };
  }
}

// =============================================
// UPDATE VOLUNTEER PROFILE
// =============================================

export async function updateVolunteerProfile(
  update: VolunteerProfileUpdate
): Promise<ActionResponse<VolunteerProfile>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const { data, error } = await supabase
      .from('volunteer_profiles')
      .update(update)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) {
      console.error('Update volunteer profile error:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/profile');
    return { success: true, data: data as VolunteerProfile };
  } catch (error) {
    console.error('Update volunteer profile error:', error);
    return { success: false, error: 'Failed to update volunteer profile' };
  }
}

// =============================================
// APPLY TO EVENT
// =============================================

export async function applyToEvent(
  data: EventVolunteerInsert
): Promise<ActionResponse<EventVolunteer>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    // Verify user is an approved volunteer
    const { data: volunteerProfile } = await supabase
      .from('volunteer_profiles')
      .select('status')
      .eq('user_id', user.id)
      .single();
    
    if (!volunteerProfile || volunteerProfile.status !== 'approved') {
      return { success: false, error: 'You must be an approved volunteer to apply to events' };
    }
    
    const insertData: EventVolunteerInsert = {
      ...data,
      volunteer_id: user.id,
    };
    
    const { data: application, error } = await supabase
      .from('event_volunteers')
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error('Apply to event error:', error);
      return { success: false, error: error.message };
    }
    
    revalidatePath('/dashboard/events');
    return { success: true, data: application as EventVolunteer };
  } catch (error) {
    console.error('Apply to event error:', error);
    return { success: false, error: 'Failed to apply to event' };
  }
}

// =============================================
// REVIEW EVENT VOLUNTEER APPLICATION
// =============================================

export async function reviewEventVolunteer(
  applicationId: string,
  update: EventVolunteerUpdate
): Promise<ActionResponse<EventVolunteer>> {
  try {
    const auth = await requireEventOrganizerAccess(applicationId);
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }
    const { supabase } = auth;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    const updateData: EventVolunteerUpdate = {
      ...update,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('event_volunteers')
      .update(updateData)
      .eq('id', applicationId)
      .select()
      .single();
    
    if (error) {
      console.error('Review event volunteer error:', error);
      return { success: false, error: error.message };
    }
    
    // Update confirmed count on event if approved
    if (update.status === 'approved') {
      const eventVolunteer = data as EventVolunteer;
      await supabase.rpc('increment_event_volunteers', { 
        event_id: eventVolunteer.event_id 
      });
    }
    
    revalidatePath('/dashboard/events');
    return { success: true, data: data as EventVolunteer };
  } catch (error) {
    console.error('Review event volunteer error:', error);
    return { success: false, error: 'Failed to review event volunteer' };
  }
}

// =============================================
// CHECK IN/OUT VOLUNTEER
// =============================================

export async function checkInVolunteer(
  applicationId: string
): Promise<ActionResponse<EventVolunteer>> {
  try {
    const auth = await requireEventOrganizerAccess(applicationId);
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }
    const { supabase } = auth;
    
    const { data, error } = await supabase
      .from('event_volunteers')
      .update({
        check_in_time: new Date().toISOString(),
        status: 'attended'
      })
      .eq('id', applicationId)
      .select()
      .single();
    
    if (error) {
      console.error('Check in volunteer error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as EventVolunteer };
  } catch (error) {
    console.error('Check in volunteer error:', error);
    return { success: false, error: 'Failed to check in volunteer' };
  }
}

export async function checkOutVolunteer(
  applicationId: string,
  hoursLogged: number
): Promise<ActionResponse<EventVolunteer>> {
  try {
    if (!Number.isFinite(hoursLogged) || hoursLogged < 0 || hoursLogged > 24) {
      return { success: false, error: 'Hours logged must be between 0 and 24.' };
    }

    const auth = await requireEventOrganizerAccess(applicationId);
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }
    const { supabase } = auth;
    
    const { data, error } = await supabase
      .from('event_volunteers')
      .update({
        check_out_time: new Date().toISOString(),
        hours_logged: hoursLogged
      })
      .eq('id', applicationId)
      .select()
      .single();
    
    if (error) {
      console.error('Check out volunteer error:', error);
      return { success: false, error: error.message };
    }
    
    // Update volunteer's total hours
    const eventVol = data as EventVolunteer;
    await supabase.rpc('add_volunteer_hours', {
      volunteer_user_id: eventVol.volunteer_id,
      hours: hoursLogged
    });
    
    return { success: true, data: eventVol };
  } catch (error) {
    console.error('Check out volunteer error:', error);
    return { success: false, error: 'Failed to check out volunteer' };
  }
}

// =============================================
// GET MY EVENT APPLICATIONS
// =============================================

export async function getMyEventApplications(): Promise<ActionResponse<EventVolunteer[]>> {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Authentication required' };
    }
    
    const { data, error } = await supabase
      .from('event_volunteers')
      .select(`
        *,
        event:events(id, event_name, event_date, location)
      `)
      .eq('volunteer_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Get my event applications error:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as EventVolunteer[] };
  } catch (error) {
    console.error('Get my event applications error:', error);
    return { success: false, error: 'Failed to fetch event applications' };
  }
}

// =============================================
// GET VOLUNTEER STATS
// =============================================

export async function getVolunteerStats(): Promise<ActionResponse<{
  totalVolunteers: number;
  pendingApplications: number;
  approvedVolunteers: number;
  totalHoursLogged: number;
}>> {
  try {
    const supabase = await createClient();
    
    const { data: profiles, error } = await supabase
      .from('volunteer_profiles')
      .select('status, total_volunteer_hours');
    
    if (error) {
      console.error('Get volunteer stats error:', error);
      return { success: false, error: error.message };
    }
    
    const stats = {
      totalVolunteers: profiles.length,
      pendingApplications: profiles.filter(p => p.status === 'pending').length,
      approvedVolunteers: profiles.filter(p => p.status === 'approved').length,
      totalHoursLogged: profiles.reduce((sum, p) => sum + (p.total_volunteer_hours || 0), 0),
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Get volunteer stats error:', error);
    return { success: false, error: 'Failed to fetch volunteer statistics' };
  }
}
