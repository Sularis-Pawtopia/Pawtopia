import { createClient } from '@/lib/supabase/server';

export type EventFilters = {
  upcoming?: boolean;
  shelterId?: string;
  eventType?: string;
};

export type CreateEventInput = {
  event_name: string;
  event_type: string;
  event_date: string;
  end_date?: string;
  location: string;
  description: string;
  post_title?: string;
  post_tags?: string[];
  max_attendees?: number;
  registration_required?: boolean;
  participant_approval_mode?: 'auto' | 'manual';
  is_volunteer_event?: boolean;
  volunteers_needed?: number;
  media_urls?: string[];
  donation_monetary_enabled?: boolean;
  donation_in_kind_enabled?: boolean;
  donation_goal_php?: number;
  donation_beneficiary?: string;
  donation_notes?: string;
  donation_dropoff_place_id?: string;
  donation_dropoff_address?: string;
  donation_dropoff_lat?: number;
  donation_dropoff_lng?: number;
  donation_dropoff_map_url?: string;
};

type RegistrationStatus = 'pending' | 'registered' | 'waitlisted' | 'cancelled';

async function requireEventOwner(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' as const };
  }

  const { data: event, error } = await supabase
    .from('events')
    .select('id, shelter_id, organizer_id')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    return { error: 'Event not found' as const };
  }

  if (event.shelter_id !== user.id && event.organizer_id !== user.id) {
    return { error: 'Forbidden' as const };
  }

  return { supabase, user, event };
}

export async function getEventsService(filters?: EventFilters) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('events')
      .select(`
        *,
        posts:post_id (
          id,
          description,
          media_urls,
          created_at,
          like_count,
          comment_count
        ),
        users:shelter_id (
          id,
          username,
          avatar_url,
          role
        )
      `)
      .order('event_date', { ascending: true });

    if (filters?.upcoming) {
      query = query.gte('event_date', new Date().toISOString());
    }

    if (filters?.shelterId) {
      query = query.eq('shelter_id', filters.shelterId);
    }

    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    const { data: events, error } = await query;

    if (error) {
      return { success: false, error: error.message };
    }

    if (!events || events.length === 0) {
      return { success: true, data: [] };
    }

    const postIds = events
      .map((event: any) => event.posts?.id)
      .filter((id: string | undefined): id is string => Boolean(id));

    if (postIds.length === 0) {
      return { success: true, data: events };
    }

    const [likesResult, commentsResult] = await Promise.all([
      supabase
        .from('likes')
        .select('post_id')
        .in('post_id', postIds),
      supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds),
    ]);

    const likeCounts = new Map<string, number>();
    for (const row of likesResult.data || []) {
      if (!row.post_id) continue;
      likeCounts.set(row.post_id, (likeCounts.get(row.post_id) || 0) + 1);
    }

    const commentCounts = new Map<string, number>();
    for (const row of commentsResult.data || []) {
      if (!row.post_id) continue;
      commentCounts.set(row.post_id, (commentCounts.get(row.post_id) || 0) + 1);
    }

    const eventsWithAccurateEngagement = events.map((event: any) => {
      const postId = event.posts?.id;
      if (!postId || !event.posts) {
        return event;
      }

      return {
        ...event,
        posts: {
          ...event.posts,
          like_count: likeCounts.get(postId) || 0,
          comment_count: commentCounts.get(postId) || 0,
        },
      };
    });

    return { success: true, data: eventsWithAccurateEngagement };
  } catch {
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function createEventService(formData: CreateEventInput) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role, city, state')
      .eq('id', user.id)
      .single();

    if (!profile || !['shelter', 'ngo', 'dvmf'].includes(profile.role)) {
      return { success: false, error: 'Only verified organizers can create events' };
    }

    if (!profile.city && !profile.state) {
      return {
        success: false,
        error: 'Please complete your profile location (city or state) before creating events.',
      };
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        post_type: 'event',
        title: formData.post_title || formData.event_name,
        description: formData.description,
        media_urls: formData.media_urls || [],
        tags: formData.post_tags || [],
      })
      .select()
      .single();

    if (postError) {
      return { success: false, error: postError.message };
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        post_id: post.id,
        shelter_id: user.id,
        organizer_id: user.id,
        organizer_type: profile.role,
        event_name: formData.event_name,
        event_type: formData.event_type,
        event_date: formData.event_date,
        end_date: formData.end_date,
        location: formData.location,
        capacity: formData.max_attendees,
        registration_required: formData.registration_required || false,
        participant_approval_mode: formData.participant_approval_mode || 'auto',
        is_volunteer_event: formData.is_volunteer_event || false,
        volunteers_needed: formData.volunteers_needed || 0,
        donation_monetary_enabled:
          formData.event_type === 'donation_drive' ? formData.donation_monetary_enabled !== false : false,
        donation_in_kind_enabled:
          formData.event_type === 'donation_drive' ? Boolean(formData.donation_in_kind_enabled) : false,
        donation_goal_php:
          formData.event_type === 'donation_drive' ? formData.donation_goal_php || null : null,
        donation_beneficiary:
          formData.event_type === 'donation_drive' ? formData.donation_beneficiary || null : null,
        donation_notes: formData.event_type === 'donation_drive' ? formData.donation_notes || null : null,
        donation_dropoff_place_id:
          formData.event_type === 'donation_drive' ? formData.donation_dropoff_place_id || null : null,
        donation_dropoff_address:
          formData.event_type === 'donation_drive' ? formData.donation_dropoff_address || null : null,
        donation_dropoff_lat:
          formData.event_type === 'donation_drive' ? formData.donation_dropoff_lat || null : null,
        donation_dropoff_lng:
          formData.event_type === 'donation_drive' ? formData.donation_dropoff_lng || null : null,
        donation_dropoff_map_url:
          formData.event_type === 'donation_drive' ? formData.donation_dropoff_map_url || null : null,
      } as any)
      .select()
      .single();

    if (eventError) {
      return { success: false, error: eventError.message };
    }

    return { success: true, data: event };
  } catch {
    return { success: false, error: 'Failed to create event' };
  }
}

export async function rsvpEventService(eventId: string) {
  return registerParticipantService(eventId);
}

export async function registerParticipantService(eventId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, capacity, attendee_count, waitlist_count, shelter_id, organizer_id, participant_approval_mode')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      return { success: false, error: 'Event not found' };
    }

    if (event.shelter_id === user.id || event.organizer_id === user.id) {
      return { success: false, error: 'Organizers cannot register to their own event.' };
    }

    const isAtCapacity =
      typeof event.capacity === 'number' &&
      event.capacity > 0 &&
      (event.attendee_count || 0) >= event.capacity;

    const isManualApproval = event.participant_approval_mode === 'manual';
    const targetStatus: RegistrationStatus = isAtCapacity
      ? 'waitlisted'
      : isManualApproval
        ? 'pending'
        : 'registered';

    const { data: existing } = await supabase
      .from('event_attendees')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      if (existing.status === targetStatus) {
        return {
          success: true,
          data: {
            status: existing.status,
            attendee_count: event.attendee_count || 0,
            waitlist_count: event.waitlist_count || 0,
          },
        };
      }

      const { error } = await supabase
        .from('event_attendees')
        .update({ status: targetStatus })
        .eq('id', existing.id);

      if (error) {
        return { success: false, error: error.message };
      }

      const { data: updatedEvent } = await supabase
        .from('events')
        .select('attendee_count, waitlist_count')
        .eq('id', eventId)
        .single();

      return {
        success: true,
        data: {
          status: targetStatus,
          attendee_count: updatedEvent?.attendee_count || 0,
          waitlist_count: updatedEvent?.waitlist_count || 0,
        },
      };
    }

    const { error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: targetStatus,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    const { data: updatedEvent } = await supabase
      .from('events')
      .select('attendee_count, waitlist_count')
      .eq('id', eventId)
      .single();

    return {
      success: true,
      data: {
        status: targetStatus,
        attendee_count: updatedEvent?.attendee_count || 0,
        waitlist_count: updatedEvent?.waitlist_count || 0,
      },
    };
  } catch {
    return { success: false, error: 'Failed to register participant' };
  }
}

export async function cancelParticipantRegistrationService(eventId: string) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: existing } = await supabase
      .from('event_attendees')
      .select('id, status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (!existing || existing.status === 'cancelled') {
      return { success: false, error: 'No active registration found' };
    }

    const { error: cancelError } = await supabase
      .from('event_attendees')
      .update({ status: 'cancelled' })
      .eq('id', existing.id);

    if (cancelError) {
      return { success: false, error: cancelError.message };
    }

    if (existing.status === 'registered') {
      const { data: nextWaitlisted } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', eventId)
        .eq('status', 'waitlisted')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (nextWaitlisted) {
        await supabase
          .from('event_attendees')
          .update({ status: 'registered' })
          .eq('id', nextWaitlisted.id);
      }
    }

    const { data: updatedEvent } = await supabase
      .from('events')
      .select('attendee_count, waitlist_count')
      .eq('id', eventId)
      .single();

    return {
      success: true,
      data: {
        status: 'cancelled' as RegistrationStatus,
        attendee_count: updatedEvent?.attendee_count || 0,
        waitlist_count: updatedEvent?.waitlist_count || 0,
      },
    };
  } catch {
    return { success: false, error: 'Failed to cancel registration' };
  }
}

export async function getMyParticipantRegistrationStatusService(eventId: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data, error } = await supabase
      .from('event_attendees')
      .select('id, status, created_at, updated_at')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: true, data: null };
      }
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to fetch registration status' };
  }
}

export async function getEventParticipantsForOrganizerService(eventId: string) {
  try {
    const auth = await requireEventOwner(eventId);
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { supabase } = auth;

    const { data, error } = await supabase
      .from('event_attendees')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        user:users(
          id,
          username,
          email,
          role,
          avatar_url,
          city,
          state,
          phone,
          address
        )
      `)
      .eq('event_id', eventId)
      .neq('status', 'cancelled')
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch participants' };
  }
}

export async function reviewParticipantRegistrationService(
  attendeeId: string,
  decision: 'approved' | 'declined'
) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    const { data: attendee, error: attendeeError } = await supabase
      .from('event_attendees')
      .select('id, event_id, status')
      .eq('id', attendeeId)
      .single();

    if (attendeeError || !attendee) {
      return { success: false, error: 'Participant registration not found' };
    }

    const auth = await requireEventOwner(attendee.event_id);
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const targetStatus: RegistrationStatus = decision === 'approved' ? 'registered' : 'cancelled';
    const originalStatus: RegistrationStatus = attendee.status as RegistrationStatus;

    // Organizer approval can promote waitlisted registrations even beyond nominal capacity.

    const { error: updateError } = await supabase
      .from('event_attendees')
      .update({ status: targetStatus })
      .eq('id', attendee.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (decision === 'declined' && originalStatus === 'registered') {
      const { data: nextWaitlisted } = await supabase
        .from('event_attendees')
        .select('id')
        .eq('event_id', attendee.event_id)
        .eq('status', 'waitlisted')
        .neq('id', attendee.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (nextWaitlisted) {
        await supabase
          .from('event_attendees')
          .update({ status: 'registered' })
          .eq('id', nextWaitlisted.id);
      }
    }

    const { data: updatedAttendee } = await supabase
      .from('event_attendees')
      .select('id, event_id, status, updated_at')
      .eq('id', attendee.id)
      .single();

    return { success: true, data: updatedAttendee };
  } catch {
    return { success: false, error: 'Failed to review participant registration' };
  }
}