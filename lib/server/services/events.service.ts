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
  max_attendees?: number;
  registration_required?: boolean;
  media_urls?: string[];
};

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
          created_at
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

    return { success: true, data: events || [] };
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
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['shelter', 'ngo', 'dvmf'].includes(profile.role)) {
      return { success: false, error: 'Only verified organizers can create events' };
    }

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        post_type: 'event',
        description: formData.description,
        media_urls: formData.media_urls || [],
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
        event_name: formData.event_name,
        event_type: formData.event_type,
        event_date: formData.event_date,
        end_date: formData.end_date,
        location: formData.location,
        capacity: formData.max_attendees,
        registration_required: formData.registration_required || false,
      })
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
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, rsvp: false };
    }

    const { error } = await supabase
      .from('event_attendees')
      .insert({
        event_id: eventId,
        user_id: user.id,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, rsvp: true };
  } catch {
    return { success: false, error: 'Failed to RSVP' };
  }
}