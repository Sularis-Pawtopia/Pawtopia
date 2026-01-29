import { getSuccessStories } from '@/lib/actions/story.actions';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { StoryGrid } from '@/components/stories/StoryGrid';
import { CreateStoryButton } from '@/components/stories/CreateStoryButton';

export default async function StoriesPage() {
  const user = await getCurrentUser();
  const storiesResult = await getSuccessStories();
  const stories = storiesResult.success ? storiesResult.data : [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold mb-4">Success Stories</h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-8">
            Heartwarming tales of pets who found their forever homes
          </p>
          {user && <CreateStoryButton />}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Inspiration Quote */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 text-center">
          <div className="text-6xl mb-4">❤️</div>
          <blockquote className="text-2xl font-serif italic text-gray-700 mb-4">
            "Saving one dog will not change the world, but surely for that one dog, the world will change forever."
          </blockquote>
          <p className="text-gray-500">- Karen Davison</p>
        </div>

        {/* Stories Grid */}
        {stories?.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Stories Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Be the first to share your adoption success story!
            </p>
            {user && <CreateStoryButton />}
          </div>
        ) : (
          <StoryGrid stories={stories || []} />
        )}
      </div>
      </div>
    </div>
  );
}