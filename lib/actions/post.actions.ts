'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { PostType } from '@/types';

export async function likePost(postId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if already liked
  const { data: existingLike } = await supabase
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single();

  if (existingLike) {
    // Unlike
    const { error } = await supabase
      .from('likes')
      .delete()
      .eq('id', existingLike.id);

    if (error) {
      return { error: error.message };
    }

    // Count likes directly and update posts table
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const newCount = count || 0;
    await supabase
      .from('posts')
      .update({ like_count: newCount })
      .eq('id', postId);

    // Don't revalidate - client handles updates via realtime and optimistic updates
    return { success: true, liked: false, count: newCount };
  } else {
    // Like
    const { error } = await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        post_id: postId,
      });

    if (error) {
      return { error: error.message };
    }

    // Count likes directly and update posts table
    const { count } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    const newCount = count || 0;
    await supabase
      .from('posts')
      .update({ like_count: newCount })
      .eq('id', postId);

    // Don't revalidate - client handles updates via realtime and optimistic updates
    return { success: true, liked: true, count: newCount };
  }
}

export async function createComment(postId: string, content: string, parentCommentId?: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_comment_id: parentCommentId,
    })
    .select(`
      *,
      user:users(id, username, avatar_url)
    `)
    .single();

  if (error) {
    return { error: error.message };
  }

  // Count comments directly and update posts table
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId);

  const newCount = count || 0;
  await supabase
    .from('posts')
    .update({ comment_count: newCount })
    .eq('id', postId);

  // Don't revalidate - client handles updates via realtime
  return { success: true, data, count: newCount };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

export async function getFeedPosts(filters?: {
  post_type?: PostType;
  limit?: number;
  offset?: number;
}) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url, role, city, state),
      pet:pets(*),
      lost_pet:lost_pets(*),
      event:events(*),
      story:stories(*),
      comments(
        id,
        content,
        created_at,
        user:users(id, username, avatar_url)
      )
    `, { count: 'exact' })
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.post_type) {
    query = query.eq('post_type', filters.post_type);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  if (filters?.offset) {
    query = query.range(filters.offset, (filters.offset + (filters.limit || 10)) - 1);
  }

  const { data: posts, error, count } = await query;

  if (error) {
    return { error: error.message };
  }

  // Check if user liked and saved each post
  if (user && posts) {
    const [likesResult, savesResult] = await Promise.all([
      supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', posts.map((p: any) => p.id)),
      supabase
        .from('saved_posts')
        .select('post_id')
        .eq('user_id', user.id)
        .in('post_id', posts.map((p: any) => p.id))
    ]);

    const likedPostIds = new Set(likesResult.data?.map((l: any) => l.post_id));
    const savedPostIds = new Set(savesResult.data?.map((s: any) => s.post_id));

    const postsWithLikesAndSaves = posts.map((post: any) => ({
      ...post,
      is_liked_by_user: likedPostIds.has(post.id),
      is_saved_by_user: savedPostIds.has(post.id),
    }));

    return { data: postsWithLikesAndSaves, count };
  }

  return { data: posts, count };
}

export async function getPostWithComments(postId: string) {
  const supabase = await createClient();

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:users(id, username, avatar_url, role, city, state),
      pet:pets(*),
      lost_pet:lost_pets(*),
      event:events(*),
      story:stories(*),
      comments(
        *,
        user:users(id, username, avatar_url)
      )
    `)
    .eq('id', postId)
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data: post };
}

export async function deletePost(postId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  // Verify ownership
  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!post || post.user_id !== user.id) {
    return { error: 'Not authorized' };
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/shelter');
  revalidatePath('/dvmf');
  revalidatePath('/events');
  return { success: true };
}

export async function updatePost(postId: string, data: { description: string }) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: existing } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single();

  if (!existing || existing.user_id !== user.id) {
    return { error: 'Not authorized' };
  }

  const { data: updated, error } = await supabase
    .from('posts')
    .update({ description: data.description })
    .eq('id', postId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/shelter');
  revalidatePath('/dvmf');
  revalidatePath('/events');
  return { success: true, data: updated };
}

export async function getEventPostByEventId(eventId: string) {
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, post_id')
    .eq('id', eventId)
    .single();

  if (eventError || !event) {
    return { error: eventError?.message || 'Event not found' };
  }

  return getPostWithComments(event.post_id);
}

export async function createFeedPost(
  description: string,
  mediaUrls: string[],
  tags: string[]
) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      post_type: 'feed',
      description,
      media_urls: mediaUrls,
      tags,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, data };
}

export async function savePost(postId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  // Check if already saved
  const { data: existingSave } = await supabase
    .from('saved_posts')
    .select('id')
    .eq('user_id', user.id)
    .eq('post_id', postId)
    .single();

  if (existingSave) {
    // Unsave
    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('id', existingSave.id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true, saved: false };
  } else {
    // Save
    const { error } = await supabase
      .from('saved_posts')
      .insert({
        user_id: user.id,
        post_id: postId,
      });

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/dashboard');
    return { success: true, saved: true };
  }
}

export async function getSavedPosts(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('saved_posts')
    .select(`
      *,
      post:posts(
        *,
        user:users(id, username, avatar_url, role, city, state),
        pet:pets(*),
        lost_pet:lost_pets(*),
        event:events(*),
        story:stories(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    return { error: error.message };
  }

  return { data };
}
