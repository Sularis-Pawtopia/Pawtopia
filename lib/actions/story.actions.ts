'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getSuccessStories(shelterId?: string) {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('stories')
      .select(`
        *,
        posts:post_id (
          id,
          description,
          media_urls,
          created_at
        ),
        pets:pet_id (
          id,
          name,
          species,
          breed
        ),
        users:adopter_id (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .order('created_at', { ascending: false });

    if (shelterId) {
      query = query.eq('shelter_id', shelterId);
    }

    const { data: stories, error } = await query;

    if (error) {
      console.error('Error fetching stories:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: stories || [] };
  } catch (error) {
    console.error('Get stories error:', error);
    return { success: false, error: 'Failed to fetch stories' };
  }
}

export async function createSuccessStory(formData: {
  pet_id: string;
  adoption_id: string;
  title: string;
  story_content: string;
  media_urls?: string[];
}) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get adoption details
    const { data: adoption } = await supabase
      .from('adoptions')
      .select('shelter_profile_id, adopter_profile_id')
      .eq('id', formData.adoption_id)
      .single();

    if (!adoption) {
      return { success: false, error: 'Adoption not found' };
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        post_type: 'success_story',
        description: formData.story_content,
        media_urls: formData.media_urls || [],
      })
      .select()
      .single();

    if (postError) {
      return { success: false, error: postError.message };
    }

    // Create story
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({
        post_id: post.id,
        adoption_id: formData.adoption_id,
        pet_id: formData.pet_id,
        adopter_id: adoption.adopter_profile_id,
        shelter_id: adoption.shelter_profile_id,
        title: formData.title,
      })
      .select()
      .single();

    if (storyError) {
      return { success: false, error: storyError.message };
    }

    revalidatePath('/stories');
    return { success: true, data: story };
  } catch (error) {
    console.error('Create story error:', error);
    return { success: false, error: 'Failed to create story' };
  }
}
