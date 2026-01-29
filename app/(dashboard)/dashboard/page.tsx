import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getFeedPosts } from '@/lib/actions/post.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { FeedList } from '@/components/feed/FeedList';
import { CreatePostButton } from '@/components/feed/CreatePostButton';
import { SuggestedShelters } from '@/components/SuggestedShelters';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (!user.is_verified) {
    redirect('/onboarding/adopter');
  }

  const { data: initialPosts } = await getFeedPosts({ limit: 10 });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Main Feed */}
            <div className="lg:col-span-8">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back, {user.username}!
                </h1>
                <p className="text-gray-600">
                  Discover pets looking for their forever homes
                </p>
              </div>

              <CreatePostButton />
              
              <div className="mt-6">
                <FeedList initialPosts={initialPosts || []} currentUserId={user.id} />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-4">
              <div className="sticky top-6">
                <SuggestedShelters />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

