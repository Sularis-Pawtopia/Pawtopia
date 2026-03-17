import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getEvents } from '@/lib/actions/event.actions';
import { getDvmfRegistryRecords } from '@/lib/actions/dvmf.actions';
import { DvmfDashboardContent } from '@/components/dvmf/DVMFDashboardContent';

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DVMF Dashboard</h1>
            <p className="text-gray-600">Manage DVMF drives and digitize pet owner records.</p>
          </div>

          <DvmfDashboardContent events={events} records={records} organizerId={user.id} />
        </div>
      </div>
    </div>
  );
}
