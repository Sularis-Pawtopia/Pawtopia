'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, MapPin, Calendar, PawPrint } from 'lucide-react';
import { PostWithDetails, CommentWithUser } from '@/types';
import { likePost, savePost, createComment } from '@/lib/actions/post.actions';
import { createClient } from '@/lib/supabase/client';
import { ImageCarousel } from './ImageCarousel';

interface FeedListProps {
  initialPosts: PostWithDetails[];
  currentUserId?: string;
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getPostTypeTag(postType: string) {
  const tags = {
    adoption: { label: 'Adoption', color: 'bg-green-100 text-green-800' },
    lost_pet: { label: 'Lost Pet', color: 'bg-red-100 text-red-800' },
    found_pet: { label: 'Found Pet', color: 'bg-blue-100 text-blue-800' },
    event: { label: 'Event', color: 'bg-purple-100 text-purple-800' },
    story: { label: 'Success Story', color: 'bg-yellow-100 text-yellow-800' },
    feed: { label: 'Post', color: 'bg-gray-100 text-gray-800' },
  };
  return tags[postType as keyof typeof tags] || tags.feed;
}

export function FeedList({ initialPosts, currentUserId }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});
  // Track posts with pending like actions to prevent realtime race conditions
  const pendingLikes = useRef<Set<string>>(new Set());
  // Debounce timers for realtime like count fetches
  const likeDebounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // Update posts when initialPosts changes (e.g., on page refetch)
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Store postIds in a ref to avoid subscription churn
  const postIdsRef = useRef<string[]>([]);
  useEffect(() => {
    postIdsRef.current = posts.map(p => p.id);
  }, [posts]);

  // Realtime subscriptions for likes and comments
  useEffect(() => {
    const supabase = createClient();
    
    // Helper to fetch and update like count with debouncing
    const fetchAndUpdateLikeCount = (postId: string, fromUserId: string) => {
      // Skip if this is the current user's action (handled by server response)
      if (fromUserId === currentUserId) return;
      
      // Skip posts not in our list
      if (!postIdsRef.current.includes(postId)) return;
      
      // Skip if we have a pending like action for this post
      if (pendingLikes.current.has(postId)) return;
      
      // Clear any existing timer for this post
      if (likeDebounceTimers.current[postId]) {
        clearTimeout(likeDebounceTimers.current[postId]);
      }
      
      // Debounce: wait 200ms before fetching to handle rapid like/unlike
      likeDebounceTimers.current[postId] = setTimeout(async () => {
        // Double-check pending status after debounce
        if (pendingLikes.current.has(postId)) return;
        
        // Fetch the actual count from the database
        const { count, error } = await supabase
          .from('likes')
          .select('*', { count: 'exact', head: true })
          .eq('post_id', postId);
        
        if (error) {
          console.error('Error fetching like count:', error);
          return;
        }
        
        setPosts(prevPosts =>
          prevPosts.map(post => {
            if (post.id !== postId) return post;
            return {
              ...post,
              like_count: count ?? post.like_count,
            };
          })
        );
      }, 200);
    };

    // Subscribe to likes table for count updates
    const likesChannel = supabase
      .channel('likes_realtime_v2')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        (payload) => {
          const likeData = (payload.new || payload.old) as any;
          if (!likeData?.post_id || !likeData?.user_id) return;
          
          fetchAndUpdateLikeCount(likeData.post_id, likeData.user_id);
        }
      )
      .subscribe((status) => {
        console.log('Likes subscription status:', status);
      });

    // Subscribe to comments for realtime comment updates - for ALL viewers
    const commentsChannel = supabase
      .channel('comments_realtime_v2')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        async (payload) => {
          const newComment = payload.new as any;
          if (!postIdsRef.current.includes(newComment.post_id)) return;
          
          // Fetch comment with user data
          const { data: commentWithUser } = await supabase
            .from('comments')
            .select('*, user:users(id, username, avatar_url)')
            .eq('id', newComment.id)
            .single();

          if (commentWithUser) {
            // Normalize user data (Supabase returns single relations as objects, not arrays)
            const normalizedComment = {
              ...commentWithUser,
              user: Array.isArray(commentWithUser.user) 
                ? commentWithUser.user[0] 
                : commentWithUser.user
            };
            
            setPosts(prevPosts =>
              prevPosts.map(post => {
                if (post.id !== newComment.post_id) return post;
                // Check if comment already exists (avoid duplicates)
                const exists = post.comments?.some((c: any) => c.id === normalizedComment.id);
                if (exists) return post;
                return {
                  ...post,
                  comments: [...(post.comments || []), normalizedComment as CommentWithUser],
                };
              })
            );
          }
        }
      )
      .subscribe((status) => {
        console.log('Comments subscription status:', status);
      });

    return () => {
      // Clear all debounce timers
      Object.values(likeDebounceTimers.current).forEach(timer => clearTimeout(timer));
      likeDebounceTimers.current = {};
      
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  // Only recreate subscription when currentUserId changes (login/logout)
  // postIdsRef handles post changes without subscription churn
  }, [currentUserId]);

  const handleLike = useCallback(async (postId: string) => {
    // Mark this post as having a pending like action
    pendingLikes.current.add(postId);
    
    // Get current state for this post BEFORE optimistic update
    const currentPost = posts.find(p => p.id === postId);
    const wasLiked = currentPost?.is_liked_by_user || false;
    const originalCount = currentPost?.like_count || 0;
    
    // Optimistic update
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            is_liked_by_user: !post.is_liked_by_user,
            like_count: (post.like_count || 0) + (post.is_liked_by_user ? -1 : 1)
          }
        : post
    ));

    try {
      const result = await likePost(postId);
      
      // Clear pending status
      pendingLikes.current.delete(postId);
      
      if (result.success) {
        // Update with the actual server count - this is authoritative
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked_by_user: result.liked,
                like_count: result.count
              }
            : post
        ));
      } else {
        // Revert on error - use original values
        console.error('Like action failed:', result.error);
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked_by_user: wasLiked,
                like_count: originalCount
              }
            : post
        ));
      }
    } catch (error) {
      // Revert on exception
      console.error('Like action exception:', error);
      pendingLikes.current.delete(postId);
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              is_liked_by_user: wasLiked,
              like_count: originalCount
            }
          : post
      ));
    }
  }, [posts]);

  const handleSave = useCallback(async (postId: string) => {
    const result = await savePost(postId);
    if (result.success) {
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { ...post, is_saved_by_user: result.saved }
          : post
      ));
    }
  }, []);

  const handleComment = useCallback(async (postId: string, content: string) => {
    if (!content.trim()) return;

    const result = await createComment(postId, content.trim());
    if (result.success && result.data) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      // Optimistically add comment (realtime will dedupe)
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: [...(post.comments || []), result.data]
            }
          : post
      ));
    }
  }, []);

  const getVisibleComments = (post: PostWithDetails) => {
    const comments = post.comments || [];
    if (showAllComments[post.id] || comments.length <= 2) {
      return comments;
    }
    return comments.slice(-2); // Show last 2 comments
  };

  const getRemainingCommentsCount = (post: PostWithDetails) => {
    const comments = post.comments || [];
    if (comments.length <= 2) return 0;
    return comments.length - 2;
  };

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No posts yet. Check back later!</p>
        </div>
      ) : (
        posts.map((post) => {
          const tag = getPostTypeTag(post.post_type);
          const mediaUrls = Array.isArray(post.media_urls) ? post.media_urls : [];
          const visibleComments = getVisibleComments(post);
          const remainingCount = getRemainingCommentsCount(post);
          // Normalize user data (handle array or object)
          const postUser = Array.isArray(post.user) ? post.user[0] : post.user || {};

          return (
            <article key={post.id} className="bg-white rounded-lg shadow-md overflow-visible">
              {/* Post Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <Link href={`/profile/${postUser.id}`} className="flex items-center gap-3">
                  {postUser.avatar_url ? (
                    <Image
                      src={postUser.avatar_url}
                      alt={postUser.username || 'User'}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 font-semibold">
                        {postUser.username?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{postUser.username}</p>
                    {(postUser.city || postUser.state) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[postUser.city, postUser.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </Link>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                  {tag.label}
                </span>
              </div>

              {/* Post Image(s) */}
              {mediaUrls.length > 0 && (
                <ImageCarousel 
                  images={mediaUrls as string[]} 
                  alt={post.title || 'Post image'} 
                />
              )}

              {/* Post Actions */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => handleLike(post.id)}
                      className="flex items-center gap-2 hover:opacity-70 transition-opacity"
                    >
                      <Heart
                        className={`w-6 h-6 ${
                          post.is_liked_by_user 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-700'
                        }`}
                      />
                      <span className="text-sm font-semibold text-gray-900">
                        {post.like_count || 0}
                      </span>
                    </button>
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-6 h-6 text-gray-700" />
                      <span className="text-sm font-semibold text-gray-900">
                        {post.comments?.length || 0}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleSave(post.id)}
                    className="hover:opacity-70 transition-opacity"
                  >
                    <Bookmark className={`w-6 h-6 ${
                      (post as any).is_saved_by_user
                        ? 'fill-gray-700 text-gray-700'
                        : 'text-gray-700'
                    }`} />
                  </button>
                </div>

                {/* Pet Details */}
                {post.pet && (
                  <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <Link href={`/pets/${post.pet.id}`} className="block hover:underline">
                      <p className="font-bold text-green-900 text-lg">{post.pet.name}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.pet.species && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs text-gray-700">
                            {post.pet.species}
                          </span>
                        )}
                        {post.pet.breed && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs text-gray-700">
                            {post.pet.breed}
                          </span>
                        )}
                        {post.pet.gender && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs text-gray-700">
                            {post.pet.gender}
                          </span>
                        )}
                        {post.pet.age_years !== null && (
                          <span className="px-2 py-1 bg-white rounded-full text-xs text-gray-700">
                            {post.pet.age_years}y {post.pet.age_months}m
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                )}

                {/* Lost Pet Details */}
                {post.lost_pet && (
                  <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <p className="font-bold text-red-900 text-lg">{post.lost_pet.pet_name}</p>
                    <p className="text-sm text-red-800 flex items-center gap-1 mt-1">
                      <MapPin className="w-4 h-4" />
                      Last seen: {post.lost_pet.last_seen_location}
                    </p>
                    <p className="text-xs text-red-700 mt-1">
                      {formatDate(post.lost_pet.last_seen_date)}
                    </p>
                  </div>
                )}

                {/* Event Details */}
                {post.event && (
                  <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <Link href={`/events/${post.event.id}`} className="block hover:underline">
                      <p className="font-bold text-purple-900 text-lg">{post.event.event_name}</p>
                      <p className="text-sm text-purple-800 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.event.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                    </Link>
                  </div>
                )}

                {/* Post Description */}
                <div className="mb-2">
                  <p className="text-gray-900">
                    <Link href={`/profile/${post.user.id}`} className="font-semibold hover:underline">
                      {post.user.username}
                    </Link>
                    {' '}
                    <span>{post.description}</span>
                  </p>
                </div>

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {post.tags.map((tag, index) => (
                      <span key={index} className="text-sm text-blue-600">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Timestamp */}
                <p className="text-xs text-gray-500 uppercase" suppressHydrationWarning>
                  {formatDate(post.created_at)}
                </p>

                {/* Comments Section - Always visible like Facebook */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  {post.comments && post.comments.length > 0 && (
                    <>
                      {/* View All Comments Button */}
                      {remainingCount > 0 && !showAllComments[post.id] && (
                        <button
                          onClick={() => setShowAllComments({ ...showAllComments, [post.id]: true })}
                          className="text-sm text-gray-500 hover:text-gray-700 mb-3 font-medium"
                        >
                          View all {post.comments.length} comments
                        </button>
                      )}
                      
                      {/* Hide comments button when expanded */}
                      {showAllComments[post.id] && post.comments.length > 2 && (
                        <button
                          onClick={() => setShowAllComments({ ...showAllComments, [post.id]: false })}
                          className="text-sm text-gray-500 hover:text-gray-700 mb-3 font-medium"
                        >
                          Hide comments
                        </button>
                      )}
                      
                      <div className="space-y-3 mb-4">
                          {visibleComments.map((comment: any) => {
                            // Handle user data that might be an array or object
                            const rawUser = comment.user;
                            const commentUser = Array.isArray(rawUser) ? rawUser[0] : rawUser || {};
                            return (
                            <div key={comment.id} className="flex gap-2">
                              <Link href={`/profile/${commentUser.id || '#'}`}>
                                {commentUser.avatar_url ? (
                                  <Image
                                    src={commentUser.avatar_url}
                                    alt={commentUser.username || 'User'}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                    <span className="text-xs text-gray-600 font-semibold">
                                      {commentUser.username?.[0]?.toUpperCase() || 'U'}
                                    </span>
                                  </div>
                                )}
                              </Link>
                              <div className="flex-1">
                                <p className="text-sm">
                                  <Link href={`/profile/${commentUser.id || '#'}`} className="font-semibold hover:underline">
                                    {commentUser.username || 'User'}
                                  </Link>
                                  {' '}
                                  <span className="text-gray-700">{comment.content}</span>
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {formatDate(comment.created_at)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </>
                    )}

                    {/* Add Comment Input - Always visible */}
                    {currentUserId && (
                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          placeholder="Write a comment..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && handleComment(post.id, commentInputs[post.id] || '')}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-gray-50"
                        />
                        <button
                          onClick={() => handleComment(post.id, commentInputs[post.id] || '')}
                          disabled={!commentInputs[post.id]?.trim()}
                          className="px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                        >
                          Post
                        </button>
                      </div>
                    )}

                    {/* Show message if no comments yet */}
                    {(!post.comments || post.comments.length === 0) && (
                      <p className="text-sm text-gray-400 italic mb-3">No comments yet. Be the first to comment!</p>
                    )}
                  </div>
              </div>
            </article>
          );
        })
      )}
      
    </div>
  );
}

