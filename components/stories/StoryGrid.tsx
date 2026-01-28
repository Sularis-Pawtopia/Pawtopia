'use client';

import Link from 'next/link';

interface StoryGridProps {
  stories: any[];
}

export function StoryGrid({ stories }: StoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {stories.map((story) => (
        <div
          key={story.id}
          className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1"
        >
          {/* Story Image */}
          <div className="relative h-64 bg-gradient-to-br from-green-100 to-emerald-100">
            {story.posts?.media_urls && story.posts.media_urls.length > 0 ? (
              <img
                src={story.posts.media_urls[0]}
                alt={story.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                ❤️
              </div>
            )}
            <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
              ✨ Success Story
            </div>
          </div>

          {/* Story Content */}
          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
              {story.title}
            </h3>

            {story.pets && (
              <div className="flex items-center gap-2 mb-3 text-gray-600">
                <span className="text-2xl">🐕</span>
                <span className="font-semibold">{story.pets.name}</span>
                <span className="text-sm">•</span>
                <span className="text-sm">{story.pets.species}</span>
              </div>
            )}

            <p className="text-gray-600 line-clamp-3 mb-4">
              {story.posts?.description || 'A heartwarming adoption story...'}
            </p>

            {story.users && (
              <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                <span>👤</span>
                <span>By {story.users.full_name || story.users.username}</span>
              </div>
            )}

            <Link
              href={`/stories/${story.id}`}
              className="block w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-center font-semibold"
            >
              Read Full Story
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
