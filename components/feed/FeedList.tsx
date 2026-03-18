'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, MessageCircle, Bookmark, MapPin, Calendar, PawPrint, MoreHorizontal, Pencil, Trash2, Archive, ArchiveX } from 'lucide-react';
import { PostWithDetails, CommentWithUser } from '@/types';
import { callApiAction } from '@/lib/api/action-client';
import { createClient } from '@/lib/supabase/client';
import { ImageCarousel } from './ImageCarousel';
import { PetDetailModal } from '../pets/PetDetailModal';
import AdoptPetModal from '../profile/AdoptPetModal';

interface FeedListProps {
  initialPosts: PostWithDetails[];
  currentUserId?: string;
  userRole?: string;
  hideComments?: boolean;
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

function getPostTypeTag(post: PostWithDetails) {
  const isDonationDrive = post.post_type === 'event' && String(post.event?.event_type || '').toLowerCase() === 'donation_drive';

  const tags = {
    adoption: { label: 'Adoption', color: 'bg-green-100 text-green-800' },
    lost_pet: { label: 'Lost Pet', color: 'bg-red-100 text-red-800' },
    found_pet: { label: 'Found Pet', color: 'bg-blue-100 text-blue-800' },
    event: { label: 'Event', color: 'bg-purple-100 text-purple-800' },
    donation_drive: { label: 'Donation Drive', color: 'bg-amber-100 text-amber-800' },
    story: { label: 'Success Story', color: 'bg-yellow-100 text-yellow-800' },
    feed: { label: 'Post', color: 'bg-gray-100 text-gray-800' },
  };

  if (isDonationDrive) {
    return tags.donation_drive;
  }

  return tags[post.post_type as keyof typeof tags] || tags.feed;
}

type ParticipantStatus = 'pending' | 'registered' | 'waitlisted' | 'cancelled' | null;
type VolunteerStatus = 'pending' | 'approved' | 'rejected' | 'attended' | 'no_show' | null;

export function FeedList({ initialPosts, currentUserId, userRole, hideComments = false }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts);
  const [participantStatusByEvent, setParticipantStatusByEvent] = useState<Record<string, ParticipantStatus>>({});
  const [volunteerStatusByEvent, setVolunteerStatusByEvent] = useState<Record<string, VolunteerStatus>>({});
  const [eventActionPendingId, setEventActionPendingId] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [showAllComments, setShowAllComments] = useState<Record<string, boolean>>({});
  const [selectedPetPost, setSelectedPetPost] = useState<PostWithDetails | null>(null);
  const [showAdoptModal, setShowAdoptModal] = useState<{ pet: any; shelterUser: any } | null>(null);
  const [existingRequests, setExistingRequests] = useState<Record<string, { id: string; status: string; created_at?: string } | null>>({});
  const [adoptTooltip, setAdoptTooltip] = useState<string | null>(null);
  const [openKebab, setOpenKebab] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<{ id: string; description: string } | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editPending, setEditPending] = useState(false);
  const [editError, setEditError] = useState('');
  const kebabRef = useRef<HTMLDivElement | null>(null);

  // Update posts when initialPosts changes (e.g., on page refetch)
  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  useEffect(() => {
    if (!currentUserId) return;

    const eventIds = posts
      .map((post) => post.event?.id)
      .filter((id): id is string => Boolean(id));

    if (eventIds.length === 0) return;

    let active = true;

    (async () => {
      const participantEntries: Array<[string, ParticipantStatus]> = [];
      const volunteerEntries: Array<[string, VolunteerStatus]> = [];

      await Promise.all(
        eventIds.map(async (eventId) => {
          const [participantResult, volunteerResult] = await Promise.all([
            callApiAction<any>('events', 'getMyParticipantRegistrationStatus', [eventId]),
            callApiAction<any>('volunteer', 'getMyEventVolunteerApplication', [eventId]),
          ]);

          participantEntries.push([
            eventId,
            participantResult.success && participantResult.data
              ? (participantResult.data.status as ParticipantStatus)
              : null,
          ]);

          volunteerEntries.push([
            eventId,
            volunteerResult.success && volunteerResult.data
              ? (volunteerResult.data.status as VolunteerStatus)
              : null,
          ]);
        })
      );

      if (!active) return;
      setParticipantStatusByEvent(Object.fromEntries(participantEntries));
      setVolunteerStatusByEvent(Object.fromEntries(volunteerEntries));
    })();

    return () => {
      active = false;
    };
  }, [currentUserId, posts]);

  const registerParticipantOnPost = useCallback(async (eventId: string) => {
    setEventActionPendingId(eventId);
    const result = await callApiAction<any>('events', 'registerParticipant', [eventId]);
    setEventActionPendingId(null);
    if (!result.success) {
      alert(result.error || 'Failed to register participant');
      return;
    }

    const status = (result.data?.status as ParticipantStatus) || 'registered';
    setParticipantStatusByEvent((prev) => ({ ...prev, [eventId]: status }));

    if (typeof result.data?.attendee_count === 'number') {
      setPosts((prev) =>
        prev.map((post) =>
          post.event?.id === eventId
            ? {
                ...post,
                event: {
                  ...post.event,
                  attendee_count: result.data.attendee_count,
                  waitlist_count: result.data.waitlist_count,
                },
              }
            : post
        )
      );
    }
  }, []);

  const cancelParticipantOnPost = useCallback(async (eventId: string) => {
    setEventActionPendingId(eventId);
    const result = await callApiAction<any>('events', 'cancelParticipantRegistration', [eventId]);
    setEventActionPendingId(null);
    if (!result.success) {
      alert(result.error || 'Failed to cancel participant registration');
      return;
    }

    setParticipantStatusByEvent((prev) => ({ ...prev, [eventId]: 'cancelled' }));

    if (typeof result.data?.attendee_count === 'number') {
      setPosts((prev) =>
        prev.map((post) =>
          post.event?.id === eventId
            ? {
                ...post,
                event: {
                  ...post.event,
                  attendee_count: result.data.attendee_count,
                  waitlist_count: result.data.waitlist_count,
                },
              }
            : post
        )
      );
    }
  }, []);

  const applyVolunteerOnPost = useCallback(async (eventId: string) => {
    setEventActionPendingId(eventId);
    const result = await callApiAction<any>('volunteer', 'applyToEvent', [
      {
        event_id: eventId,
        volunteer_id: currentUserId,
        application_message: 'Interested in helping for this event.',
      },
    ]);
    setEventActionPendingId(null);
    if (!result.success) {
      alert(result.error || 'Failed to apply as volunteer');
      return;
    }

    setVolunteerStatusByEvent((prev) => ({ ...prev, [eventId]: 'pending' }));
  }, [currentUserId]);

  const cancelVolunteerOnPost = useCallback(async (eventId: string) => {
    setEventActionPendingId(eventId);
    const result = await callApiAction<any>('volunteer', 'cancelMyEventVolunteerApplication', [eventId]);
    setEventActionPendingId(null);
    if (!result.success) {
      alert(result.error || 'Failed to cancel volunteer registration');
      return;
    }

    setVolunteerStatusByEvent((prev) => ({ ...prev, [eventId]: null }));
  }, []);

  // Close kebab when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
        setOpenKebab(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDeletePost = useCallback(async (postId: string) => {
    setOpenKebab(null);
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    const result = await callApiAction('posts', 'deletePost', [postId]);
    if (result.error) {
      alert(result.error);
      return;
    }
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const openEditModal = useCallback((post: PostWithDetails) => {
    setOpenKebab(null);
    setEditingPost({ id: post.id, description: post.description });
    setEditDescription(post.description);
    setEditError('');
  }, []);

  const handleEditSubmit = useCallback(async () => {
    if (!editingPost) return;
    setEditPending(true);
    setEditError('');
    const result = await callApiAction('posts', 'updatePost', [editingPost.id, { description: editDescription }]);
    setEditPending(false);
    if (result.error) {
      setEditError(result.error);
      return;
    }
    setPosts((prev) => prev.map((p) => p.id === editingPost.id ? { ...p, description: editDescription } : p));
    setEditingPost(null);
  }, [editingPost, editDescription]);

  // Store postIds in a ref to avoid subscription churn
  const postIdsRef = useRef<string[]>([]);
  useEffect(() => {
    postIdsRef.current = posts.map(p => p.id);
  }, [posts]);

  // Realtime subscriptions for like/comment counts and comment content
  useEffect(() => {
    const supabase = createClient();

    const updateLikeCount = async (postId: string) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                like_count: count || 0,
              }
            : post
        )
      );
    };

    const updateCommentCount = async (postId: string) => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? {
                ...post,
                comment_count: count || 0,
              }
            : post
        )
      );
    };

    const likesChannel = supabase
      .channel('likes_realtime_v4')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        async (payload) => {
          const like = (payload.new || payload.old) as any;
          if (!like?.post_id || !postIdsRef.current.includes(like.post_id)) return;
          await updateLikeCount(like.post_id);
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('comments_realtime_v3')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedComment = payload.old as any;
            if (!deletedComment?.post_id || !postIdsRef.current.includes(deletedComment.post_id)) return;

            setPosts((prevPosts) =>
              prevPosts.map((post) =>
                post.id === deletedComment.post_id
                  ? {
                      ...post,
                      comments: (post.comments || []).filter((comment: any) => comment.id !== deletedComment.id),
                    }
                  : post
              )
            );
            await updateCommentCount(deletedComment.post_id);
            return;
          }

          const changedComment = payload.new as any;
          if (!changedComment?.post_id || !postIdsRef.current.includes(changedComment.post_id)) return;

          const { data: commentWithUser } = await supabase
            .from('comments')
            .select('*, user:users(id, username, avatar_url)')
            .eq('id', changedComment.id)
            .single();

          if (!commentWithUser) return;

          const normalizedComment = {
            ...commentWithUser,
            user: Array.isArray(commentWithUser.user)
              ? commentWithUser.user[0]
              : commentWithUser.user,
          };

          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (post.id !== changedComment.post_id) return post;

              const currentComments = post.comments || [];
              const commentIndex = currentComments.findIndex((comment: any) => comment.id === normalizedComment.id);

              if (commentIndex < 0) {
                return {
                  ...post,
                  comments: [...currentComments, normalizedComment as CommentWithUser],
                };
              }

              const nextComments = [...currentComments];
              nextComments[commentIndex] = normalizedComment as CommentWithUser;
              return { ...post, comments: nextComments };
            })
          );

          await updateCommentCount(changedComment.post_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [currentUserId]);

  const handleLike = useCallback(async (postId: string) => {
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
      const result = await callApiAction<{ liked: boolean; count: number }>('posts', 'likePost', [postId]);

      if (result.success) {
        const liked = typeof result.liked === 'boolean' ? result.liked : !wasLiked;
        const count = typeof result.count === 'number' ? result.count : originalCount;
        // Update with the actual server count - this is authoritative
        setPosts(prevPosts => prevPosts.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                is_liked_by_user: liked,
                like_count: count
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
    const result = await callApiAction<{ saved: boolean }>('posts', 'savePost', [postId]);
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

    const result = await callApiAction<CommentWithUser>('posts', 'createComment', [postId, content.trim()]);
    const createdComment = result.data as CommentWithUser | undefined;
    if (result.success && createdComment) {
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      const nextCount = typeof (result as any).count === 'number' ? (result as any).count : undefined;
      // Optimistically add comment (realtime will dedupe)
      setPosts(prevPosts => prevPosts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              comments: [...(post.comments || []), createdComment],
              comment_count: typeof nextCount === 'number' ? nextCount : post.comment_count,
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

  // Check for existing adoption requests when posts load
  useEffect(() => {
    if (!currentUserId || userRole !== 'adopter') return;
    
    const petPosts = posts.filter(p => p.pet && p.pet.status === 'available');
    petPosts.forEach(async (post) => {
      if (!post.pet || existingRequests[post.pet.id] !== undefined) return;
      const result = await callApiAction<{ id: string; status: string; created_at?: string }>('adoption', 'getAdoptionRequestForPet', [post.pet.id, currentUserId]);
      if (result.data) {
        setExistingRequests(prev => ({ ...prev, [post.pet!.id]: result.data! }));
      } else {
        setExistingRequests(prev => ({ ...prev, [post.pet!.id]: null }));
      }
    });
  }, [posts, currentUserId, userRole]);

  const handleViewPet = useCallback((post: PostWithDetails) => {
    setSelectedPetPost(post);
  }, []);

  const handleAdoptClick = useCallback((post: PostWithDetails) => {
    if (!post.pet) return;
    const postUser = Array.isArray(post.user) ? post.user[0] : post.user;
    setShowAdoptModal({
      pet: {
        ...post.pet,
        post: {
          description: post.description,
          media_urls: post.media_urls as string[],
          tags: post.tags || [],
        },
      },
      shelterUser: postUser,
    });
  }, []);

  const handleAdoptionSuccess = useCallback((petId: string) => {
    setShowAdoptModal(null);
    setSelectedPetPost(null);
    setExistingRequests(prev => ({ ...prev, [petId]: { id: 'new', status: 'pending' } }));
  }, []);

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <PawPrint className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No posts yet. Check back later!</p>
        </div>
      ) : (
        posts.map((post) => {
          const tag = getPostTypeTag(post);
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

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${tag.color}`}>
                    {tag.label}
                  </span>

                  {/* Kebab — only visible to the post owner */}
                  {currentUserId && postUser.id === currentUserId && (
                    <div className="relative" ref={openKebab === post.id ? kebabRef : null}>
                      <button
                        onClick={() => setOpenKebab(openKebab === post.id ? null : post.id)}
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Post options"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {openKebab === post.id && (
                        <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-xl shadow-lg border border-gray-200 py-1.5 z-30">
                          <button
                            onClick={() => openEditModal(post)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit post
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete post
                          </button>
                          <hr className="my-1 border-gray-100" />
                          <button
                            disabled
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                          >
                            <Archive className="w-4 h-4" />
                            Move to archive
                          </button>
                          <button
                            disabled
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-400 cursor-not-allowed"
                          >
                            <ArchiveX className="w-4 h-4" />
                            Move to trash
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Post Image(s) */}
              {mediaUrls.length > 0 && (
                post.event ? (
                  <Link href={`/events/${post.event.id}`} className="block">
                    <ImageCarousel
                      images={mediaUrls as string[]}
                      alt={post.event.event_name || post.title || 'Post image'}
                    />
                  </Link>
                ) : (
                  <ImageCarousel
                    images={mediaUrls as string[]}
                    alt={post.title || 'Post image'}
                  />
                )
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
                        {post.comment_count || post.comments?.length || 0}
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
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="flex-1 cursor-pointer hover:underline"
                        onClick={() => handleViewPet(post)}
                      >
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
                      </div>

                      {/* Adopt Button */}
                      {post.pet.status === 'available' && (
                        <div className="relative flex-shrink-0">
                          {existingRequests[post.pet.id] ? (
                            <span className={`inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold ${
                              existingRequests[post.pet.id]!.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              existingRequests[post.pet.id]!.status === 'approved' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {existingRequests[post.pet.id]!.status === 'pending' ? '⏳ Under Review' :
                               existingRequests[post.pet.id]!.status === 'approved' ? '✅ Approved' :
                               '📋 Submitted'}
                            </span>
                          ) : userRole === 'adopter' ? (
                            <button
                              onClick={() => handleAdoptClick(post)}
                              className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 active:bg-green-800 transition-all shadow-sm hover:shadow-md flex items-center gap-1.5"
                            >
                              <PawPrint className="w-4 h-4" />
                              Adopt Me
                            </button>
                          ) : (
                            <div
                              className="relative"
                              onMouseEnter={() => setAdoptTooltip(post.id)}
                              onMouseLeave={() => setAdoptTooltip(null)}
                            >
                              <button
                                disabled
                                className="px-4 py-2 bg-gray-200 text-gray-500 text-sm font-semibold rounded-lg cursor-not-allowed flex items-center gap-1.5"
                              >
                                <PawPrint className="w-4 h-4" />
                                Adopt Me
                              </button>
                              {adoptTooltip === post.id && (
                                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-20">
                                  Sign up as an adopter to adopt pets
                                  <div className="absolute top-full right-4 w-2 h-2 bg-gray-900 transform rotate-45 -translate-y-1"></div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {post.pet.status === 'adopted' && (
                        <span className="px-3 py-2 bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg">
                          🏠 Adopted
                        </span>
                      )}
                      {post.pet.status === 'pending' && (
                        <span className="px-3 py-2 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-lg">
                          ⏳ Pending
                        </span>
                      )}
                    </div>
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
                {post.event && (() => {
                  const isDonationDrive = String(post.event.event_type || '').toLowerCase() === 'donation_drive';
                  const tagList = Array.isArray(post.tags) ? post.tags : [];
                  const goalTag = tagList.find((tag) => tag.startsWith('goal_php:'));
                  const raisedTag = tagList.find((tag) => tag.startsWith('raised_php:'));
                  const beneficiaryTag = tagList.find((tag) => tag.startsWith('beneficiary:'));
                  const paymentTag = tagList.find((tag) => tag.startsWith('payment_method:'));

                  const donationGoal = Number(goalTag?.split(':')[1] || 0);
                  const raisedAmount = Number(raisedTag?.split(':')[1] || 0);
                  const beneficiary = beneficiaryTag?.split(':').slice(1).join(':') || 'Community beneficiaries';
                  const paymentMethod = paymentTag?.split(':')[1] || 'gcash';
                  const percent = donationGoal > 0 ? Math.min(100, Math.round((raisedAmount / donationGoal) * 100)) : 0;

                  if (isDonationDrive) {
                    return (
                      <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="font-bold text-amber-900 text-lg">{post.event.event_name}</p>
                        <p className="text-sm text-amber-800 flex items-center gap-1 mt-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(post.event.event_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <p className="text-xs text-amber-800 mt-1">Beneficiary: {beneficiary}</p>
                        <p className="text-xs text-amber-800 mt-1">Payment: {paymentMethod.toUpperCase()} (static prototype)</p>
                        <div className="mt-2 h-2 w-full bg-amber-100 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                        <p className="text-xs text-amber-700 mt-1">
                          PHP {raisedAmount.toLocaleString()} raised of PHP {donationGoal.toLocaleString()} goal
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="mb-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <p className="font-bold text-purple-900 text-lg">{post.event.event_name}</p>
                      <p className="text-sm text-purple-800 flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.event.event_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-purple-700 mt-1">
                        {typeof post.event.capacity === 'number' && post.event.capacity > 0
                          ? `${post.event.attendee_count || 0}/${post.event.capacity} registered`
                          : `${post.event.attendee_count || 0} registered`}
                      </p>
                      {post.event.is_volunteer_event && (
                        <p className="text-xs text-purple-700 mt-1">
                          {typeof post.event.volunteers_needed === 'number' && post.event.volunteers_needed > 0
                            ? `${post.event.volunteers_confirmed || 0}/${post.event.volunteers_needed} volunteers approved`
                            : `${post.event.volunteers_confirmed || 0} volunteers approved`}
                        </p>
                      )}

                      {currentUserId &&
                        currentUserId !== post.event.organizer_id &&
                        currentUserId !== post.event.shelter_id && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {(participantStatusByEvent[post.event.id] === 'registered' ||
                              participantStatusByEvent[post.event.id] === 'waitlisted' ||
                              participantStatusByEvent[post.event.id] === 'pending') ? (
                              <button
                                onClick={() => cancelParticipantOnPost(post.event!.id)}
                                disabled={eventActionPendingId === post.event.id}
                                className="px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                              >
                                Cancel Participant ({participantStatusByEvent[post.event.id]})
                              </button>
                            ) : (
                              <button
                                onClick={() => registerParticipantOnPost(post.event!.id)}
                                disabled={eventActionPendingId === post.event.id}
                                className="px-3 py-1.5 rounded-md bg-primary-600 text-white text-xs hover:bg-primary-700 disabled:opacity-50"
                              >
                                Register as Participant
                              </button>
                            )}

                            {post.event.is_volunteer_event && (
                              volunteerStatusByEvent[post.event.id] ? (
                                <button
                                  onClick={() => cancelVolunteerOnPost(post.event!.id)}
                                  disabled={eventActionPendingId === post.event.id}
                                  className="px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                >
                                  Cancel Volunteer ({volunteerStatusByEvent[post.event.id]})
                                </button>
                              ) : (
                                <button
                                  onClick={() => applyVolunteerOnPost(post.event!.id)}
                                  disabled={eventActionPendingId === post.event.id}
                                  className="px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs hover:bg-indigo-700 disabled:opacity-50"
                                >
                                  Apply as Volunteer
                                </button>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  );
                })()}

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
                {!hideComments && <div className="mt-4 pt-4 border-t border-gray-200">
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
                  </div>}
              </div>
            </article>
          );
        })
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setEditingPost(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit post</h2>
              <button
                onClick={() => setEditingPost(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="mb-3 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
                {editError}
              </div>
            )}

            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none resize-none"
              rows={5}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              autoFocus
            />

            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditingPost(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSubmit}
                disabled={editPending || !editDescription.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-50"
              >
                {editPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pet Detail Modal */}
      {selectedPetPost && selectedPetPost.pet && (
        <PetDetailModal
          pet={{
            ...selectedPetPost.pet,
            post: {
              description: selectedPetPost.description,
              media_urls: selectedPetPost.media_urls as string[],
              tags: selectedPetPost.tags || [],
            },
            shelter: (() => {
              const u = Array.isArray(selectedPetPost.user) ? selectedPetPost.user[0] : selectedPetPost.user;
              return {
                id: u?.id || '',
                username: u?.username || '',
                avatar_url: u?.avatar_url || undefined,
                city: u?.city || undefined,
                state: u?.state || undefined,
              };
            })(),
          }}
          userRole={userRole}
          existingRequest={existingRequests[selectedPetPost.pet.id] || null}
          onClose={() => setSelectedPetPost(null)}
          onAdopt={() => {
            const postUser = Array.isArray(selectedPetPost.user) ? selectedPetPost.user[0] : selectedPetPost.user;
            setSelectedPetPost(null);
            setShowAdoptModal({
              pet: {
                ...selectedPetPost.pet!,
                post: {
                  description: selectedPetPost.description,
                  media_urls: selectedPetPost.media_urls as string[],
                  tags: selectedPetPost.tags || [],
                },
              },
              shelterUser: postUser,
            });
          }}
        />
      )}

      {/* Adopt Pet Modal — same flow as shelter profile */}
      {showAdoptModal && (
        <AdoptPetModal
          pet={showAdoptModal.pet}
          viewerRole={userRole}
          existingRequest={existingRequests[showAdoptModal.pet.id] || undefined}
          onClose={() => setShowAdoptModal(null)}
          onSuccess={() => handleAdoptionSuccess(showAdoptModal.pet.id)}
        />
      )}
    </div>
  );
}
