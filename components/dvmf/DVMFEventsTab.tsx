'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Heart, MessageCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface EventItem {
  id: string;
  event_name: string;
  event_type: string;
  event_date: string;
  location: string;
  capacity?: number | null;
  attendee_count?: number | null;
  posts?: {
    id?: string;
    description?: string;
    created_at?: string;
    media_urls?: string[];
    like_count?: number;
    comment_count?: number;
  };
}

interface DvmfEventsTabProps {
  events: EventItem[];
  organizerId?: string;
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: '2-digit',
  day: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'Asia/Manila',
});

function formatDateTimeMDY(value?: string) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return `${dateTimeFormatter.format(date)} PHT`;
}

export function DvmfEventsTab({ events, organizerId }: DvmfEventsTabProps) {
  void organizerId;

  const [eventsState, setEventsState] = useState<EventItem[]>(events);

  useEffect(() => {
    setEventsState(events);
  }, [events]);

  const postIds = useMemo(
    () => eventsState.map((event) => event.posts?.id).filter((id): id is string => Boolean(id)),
    [eventsState]
  );

  useEffect(() => {
    if (postIds.length === 0) return;
    const supabase = createClient();

    const updateLikeCount = async (postId: string) => {
      const { count } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setEventsState((prev) =>
        prev.map((event) =>
          event.posts?.id === postId
            ? {
                ...event,
                posts: {
                  ...event.posts,
                  like_count: count || 0,
                },
              }
            : event
        )
      );
    };

    const updateCommentCount = async (postId: string) => {
      const { count } = await supabase
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId);

      setEventsState((prev) =>
        prev.map((event) =>
          event.posts?.id === postId
            ? {
                ...event,
                posts: {
                  ...event.posts,
                  comment_count: count || 0,
                },
              }
            : event
        )
      );
    };

    const likesChannel = supabase
      .channel('dvmf-events-like-counts-v2')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
        },
        async (payload) => {
          const like = (payload.new || payload.old) as any;
          if (!like?.post_id || !postIds.includes(like.post_id)) return;
          await updateLikeCount(like.post_id);
        }
      )
      .subscribe();

    const commentsChannel = supabase
      .channel('dvmf-events-comment-counts-v2')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
        },
        async (payload) => {
          const comment = (payload.new || payload.old) as any;
          if (!comment?.post_id || !postIds.includes(comment.post_id)) return;
          await updateCommentCount(comment.post_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(commentsChannel);
    };
  }, [postIds]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Drives and Community Events</h3>
          <p className="text-sm text-gray-600 mt-1">
            Publish DVMF drives to the public feed and events tab instantly.
          </p>
        </div>
        <Link
          href="/events/new"
          className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
        >
          Create Drive/Event
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Recent DVMF Events</h3>
          <span className="text-sm text-gray-500">{eventsState.length} total</span>
        </div>
        <div className="divide-y divide-gray-100">
          {eventsState.length === 0 ? (
            <div className="px-5 py-8 text-sm text-gray-500">No DVMF events yet.</div>
          ) : (
            eventsState.map((event) => (
              <div key={event.id} className="px-5 py-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4">
                  <Link
                    href={`/events/${event.id}`}
                    className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 block"
                    title="View event details"
                  >
                    {event.posts?.media_urls?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.posts.media_urls[0]}
                        alt={event.event_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[11px] text-gray-400">
                        No Image
                      </div>
                    )}
                  </Link>

                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 truncate">{event.event_name}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDateTimeMDY(event.event_date)} | {event.location} | {event.event_type}
                    </p>
                    {event.posts?.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.posts.description}</p>
                    )}

                    <div className="mt-2 flex items-center gap-5 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5" />
                        {event.posts?.like_count || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5" />
                        {event.posts?.comment_count || 0}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        {typeof event.capacity === 'number' && event.capacity > 0
                          ? `${event.attendee_count || 0}/${event.capacity} registered`
                          : `${event.attendee_count || 0} registered`}
                      </span>
                      {event.posts?.created_at && (
                        <span className="text-gray-400">Posted {formatDateTimeMDY(event.posts.created_at)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
