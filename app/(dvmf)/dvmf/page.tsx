import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getEvents } from '@/lib/actions/event.actions';
import { getDvmfRegistryRecords } from '@/lib/actions/dvmf.actions';
import { DvmfInsightsDashboard } from '@/components/dvmf/DvmfInsightsDashboard';
import Link from 'next/link';

export default async function DvmfDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'dvmf') {
    redirect('/dashboard');
  }

  const [eventsResult, registryResult] = await Promise.all([
    getEvents({ shelterId: user.id }),
    getDvmfRegistryRecords(),
  ]);

  const events = (eventsResult.success ? eventsResult.data : []) || [];
  const records = (registryResult.success ? registryResult.data : []) || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DVMF Insights</h1>
            <p className="text-gray-600">Review key metrics first, then move to operations when you are ready to execute workflows.</p>
          </div>

          <DvmfInsightsDashboard events={events} records={records} />

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-lg font-semibold text-gray-900">Operations</h3>
            <p className="text-sm text-gray-600 mt-1">
              Keep execution workflows in one place to reduce context switching and dashboard clutter.
            </p>
            <div className="mt-4">
              <Link
                href="/dvmf/operations"
                className="inline-flex items-center px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700"
              >
                Open DVMF Operations
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
