import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getEvents } from '@/lib/actions/event.actions';
import { getDvmfRegistryRecords } from '@/lib/actions/dvmf.actions';
import { getShelterPets } from '@/lib/actions/pet.actions';
import { getAdoptionRequests } from '@/lib/actions/adoption.actions';
import { DvmfDashboardContent } from '@/components/dvmf/DVMFDashboardContent';

export default async function DvmfOperationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'dvmf') {
    redirect('/dashboard');
  }

  const [eventsResult, registryResult, petsResult, requestsResult] = await Promise.all([
    getEvents({ shelterId: user.id }),
    getDvmfRegistryRecords(),
    getShelterPets(user.id),
    getAdoptionRequests(user.id),
  ]);

  const events = (eventsResult.success ? eventsResult.data : []) || [];
  const records = (registryResult.success ? registryResult.data : []) || [];
  const pets = petsResult.data || [];
  const allRequests = requestsResult.data || [];
  const pendingRequests = allRequests.filter((request: { status: string }) => request.status === 'pending');
  const isPendingVerification = !user.is_verified;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">DVMF Operations</h1>
            <p className="text-gray-600">Execute event and registry workflows from a dedicated operations workspace.</p>
          </div>

          <DvmfDashboardContent
            events={events}
            records={records}
            pets={pets}
            allRequests={allRequests}
            pendingCount={pendingRequests.length}
            isPendingVerification={isPendingVerification}
            organizerId={user.id}
          />
        </div>
      </div>
    </div>
  );
}
