import { notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getEventPostByEventId } from '@/lib/actions/post.actions';
import { FeedList } from '@/components/feed/FeedList';

interface EventDetailPageProps {
  params: {
    eventId: string;
  };
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const user = await getCurrentUser();
  const result = await getEventPostByEventId(params.eventId);

  if ('error' in result || !result.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Event Post</h1>
        <FeedList
          initialPosts={[result.data as any]}
          currentUserId={user?.id}
          userRole={user?.role}
        />
      </div>
    </div>
  );
}
