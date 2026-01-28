'use client';

import { Post } from '@/types';

interface FeedListProps {
  initialPosts: Post[];
}

export function FeedList({ initialPosts }: FeedListProps) {
  return (
    <div className="space-y-6">
      {initialPosts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-gray-500">No posts yet. Check back later!</p>
        </div>
      ) : (
        initialPosts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-900">{post.description}</p>
            <p className="text-sm text-gray-500 mt-2">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
        ))
      )}
    </div>
  );
}
