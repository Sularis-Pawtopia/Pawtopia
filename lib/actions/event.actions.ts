'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getEvents(filters?: {
  upcoming?: boolean;
  shelterId?: string;
  eventType?: string;
}) {
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
          full_name,
          avatar_url
        )
      `)
      .order('event_date', { ascending: true });

    if (filters?.upcoming) {
      const now = new Date().toISOString();
      query = query.gte('event_date', now);
    }

    if (filters?.shelterId) {
      query = query.eq('shelter_id', filters.shelterId);
    }

    if (filters?.eventType) {
      query = query.eq('event_type', filters.eventType);
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching events:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: events || [] };
  } catch (error) {
    console.error('Get events error:', error);
    return { success: false, error: 'Failed to fetch events' };
  }
}

export async function createEvent(formData: {
  event_name: string;
  event_type: string;
  event_date: string;
  end_date?: string;
  location: string;
  description: string;
  max_attendees?: number;
  registration_required?: boolean;
  media_urls?: string[];
}) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if user is a shelter
    if (user.user_metadata?.role !== 'shelter') {
      return { success: false, error: 'Only shelters can create events' };
    }

    // First create a post
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
      console.error('Error creating post:', postError);
      return { success: false, error: postError.message };
    }

    // Then create the event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        post_id: post.id,
        shelter_id: user.id,
        event_name: formData.event_name,
        event_type: formData.event_type,
        event_date: formData.event_date,
        end_date: formData.end_date,
        location: formData.location,
        max_attendees: formData.max_attendees,
        registration_required: formData.registration_required || false,
      })
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return { success: false, error: eventError.message };
    }

    revalidatePath('/events');
    revalidatePath('/shelter');
    return { success: true, data: event };
  } catch (error) {
    console.error('Create event error:', error);
    return { success: false, error: 'Failed to create event' };
  }
}

export async function rsvpEvent(eventId: string) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Check if already RSVP'd
    const { data: existing } = await supabase
      .from('event_attendees')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      // Un-RSVP
      const { error } = await supabase
        .from('event_attendees')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath('/events');
      return { success: true, rsvp: false };
    } else {
      // RSVP
      const { error } = await supabase
        .from('event_attendees')
        .insert({
          event_id: eventId,
          user_id: user.id,
        });

      if (error) {
        return { success: false, error: error.message };
      }

      revalidatePath('/events');
      return { success: true, rsvp: true };
    }
  } catch (error) {
    console.error('RSVP event error:', error);
    return { success: false, error: 'Failed to RSVP' };
  }
}
