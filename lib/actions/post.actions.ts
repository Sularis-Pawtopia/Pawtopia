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

    revalidatePath('/dashboard');
    return { success: true, liked: false };
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

    revalidatePath('/dashboard');
    return { success: true, liked: true };
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

  revalidatePath('/dashboard');
  return { success: true, data };
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
      comments(count)
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

  // Check if user liked each post
  if (user && posts) {
    const { data: likes } = await supabase
      .from('likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', posts.map((p: any) => p.id));

    const likedPostIds = new Set(likes?.map((l: any) => l.post_id));

    const postsWithLikes = posts.map((post: any) => ({
      ...post,
      is_liked_by_user: likedPostIds.has(post.id),
    }));

    return { data: postsWithLikes, count };
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

export async function deletePost(postId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)
    .eq('user_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/shelter');
  return { success: true };
}
