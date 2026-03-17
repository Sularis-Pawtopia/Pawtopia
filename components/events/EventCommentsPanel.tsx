'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { callApiAction } from '@/lib/api/action-client';
import { createClient } from '@/lib/supabase/client';

interface EventCommentsPanelProps {
  postId: string;
  currentUserId?: string;
  initialComments?: any[];
}

export function EventCommentsPanel({ postId, currentUserId, initialComments = [] }: EventCommentsPanelProps) {
  const [comments, setComments] = useState<any[]>(initialComments);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`event-comments-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${postId}`,
        },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            const deleted = payload.old as any;
            setComments((prev) => prev.filter((comment) => comment.id !== deleted.id));
            return;
          }

          const changed = payload.new as any;
          if (!changed?.id) return;

          const { data } = await supabase
            .from('comments')
            .select('*, user:users(id, username, avatar_url)')
            .eq('id', changed.id)
            .single();

          if (!data) return;

          const normalized = {
            ...data,
            user: Array.isArray(data.user) ? data.user[0] : data.user,
          };

          setComments((prev) => {
            const index = prev.findIndex((comment) => comment.id === normalized.id);
            if (index === -1) return [...prev, normalized];
            const next = [...prev];
            next[index] = normalized;
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const submitComment = async () => {
    const content = input.trim();
    if (!content || !currentUserId) return;

    setPending(true);
    const createResult = await callApiAction<any>('posts', 'createComment', [postId, content]);
    if (!createResult.success) {
      setPending(false);
      return;
    }
    setPending(false);
    setInput('');
  };

  return (
    <aside className="bg-white rounded-xl border border-gray-200 p-4">
      <h3 className="text-sm font-semibold text-gray-900">Comments</h3>

      <div className="mt-3 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : (
          comments.map((comment) => {
            const rawUser = comment.user;
            const commentUser = Array.isArray(rawUser) ? rawUser[0] : rawUser || {};
            return (
              <div key={comment.id} className="text-sm flex gap-2">
                <Link href={`/profile/${commentUser.id || '#'}`}>
                  {commentUser.avatar_url ? (
                    <Image
                      src={commentUser.avatar_url}
                      alt={commentUser.username || 'User'}
                      width={28}
                      height={28}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-semibold">
                      {(commentUser.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
                <div className="min-w-0">
                  <Link href={`/profile/${commentUser.id || '#'}`} className="font-semibold text-gray-900 hover:underline">
                    {commentUser.username || 'User'}
                  </Link>
                  <span className="text-gray-700"> {comment.content}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {currentUserId && (
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitComment()}
            placeholder="Write a comment..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <button
            onClick={submitComment}
            disabled={pending || !input.trim()}
            className="px-3 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50"
          >
            Post
          </button>
        </div>
      )}
    </aside>
  );
}
