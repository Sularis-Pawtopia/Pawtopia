import { getEvents } from '@/lib/actions/event.actions';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { CreateEventButton } from '@/components/events/CreateEventButton';
import { getFeedPosts } from '@/lib/actions/post.actions';
import { FeedList } from '@/components/feed/FeedList';

export default async function EventsPage() {
  const user = await getCurrentUser();
  const [eventsResult, eventPostsResult] = await Promise.all([
    getEvents(),
    getFeedPosts({ post_type: 'event' }),
  ]);

  const events = eventsResult.success ? eventsResult.data : [];
  const eventPosts = eventPostsResult.data || [];

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold mb-2">Community Events</h1>
              <p className="text-primary-100 text-lg">
                Join adoption events, fundraisers, and pet community gatherings
              </p>
            </div>
            {['shelter', 'ngo', 'dvmf'].includes(user?.role || '') && <CreateEventButton />}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">{events?.length || 0}</div>
              <div className="text-primary-100 text-sm">Upcoming Events</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">50+</div>
              <div className="text-primary-100 text-sm">Shelters Participating</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
              <div className="text-3xl font-bold">1,200+</div>
              <div className="text-primary-100 text-sm">RSVPs This Month</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {eventPosts.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Events Found
            </h3>
            <p className="text-gray-600">
              Check back soon for upcoming adoption events and community gatherings!
            </p>
          </div>
        ) : (
          <FeedList
            initialPosts={eventPosts as any}
            currentUserId={user?.id}
            userRole={user?.role}
          />
        )}
      </div>
    </div>
  );
}
