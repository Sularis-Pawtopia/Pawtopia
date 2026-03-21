import { getCurrentUser } from '@/lib/actions/auth.actions';
import { CreateEventButton } from '@/components/events/CreateEventButton';
import { getFeedPosts } from '@/lib/actions/post.actions';
import { EventsFeedPanel } from '@/components/events/EventsFeedPanel';

export default async function EventsPage() {
  const user = await getCurrentUser();
  const eventPostsResult = await getFeedPosts({ post_type: 'event' });
  const eventPosts = (eventPostsResult.data || []).filter((post: any) => !String(post?.event?.event_type || '').toLowerCase().includes('adoption'));
  const donationCount = eventPosts.filter((post: any) => String(post?.event?.event_type || '').toLowerCase().includes('donation')).length;
  const regularCount = eventPosts.length - donationCount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Community Events</h1>
              <p className="mt-1 text-sm text-gray-600">
                Discover donation campaigns and local gatherings in one place.
              </p>
            </div>
            {['shelter', 'ngo', 'dvmf'].includes(user?.role || '') && <CreateEventButton />}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-2xl font-bold text-gray-900">{eventPosts.length}</p>
              <p className="text-xs text-gray-500">Published Events</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-2xl font-bold text-gray-900">{regularCount}</p>
              <p className="text-xs text-gray-500">Regular Events</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <p className="text-2xl font-bold text-gray-900">{donationCount}</p>
              <p className="text-xs text-gray-500">Donation Drives</p>
            </div>
          </div>
        </div>

        <EventsFeedPanel eventPosts={eventPosts as any[]} currentUserId={user?.id} userRole={user?.role} />
      </div>
    </div>
  );
}
