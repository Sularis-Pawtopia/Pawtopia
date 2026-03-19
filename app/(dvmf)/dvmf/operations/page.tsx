import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getEvents } from '@/lib/actions/event.actions';
import { getDvmfRegistryRecords } from '@/lib/actions/dvmf.actions';
import { getShelterPets } from '@/lib/actions/pet.actions';
import { getAdoptionRequests } from '@/lib/actions/adoption.actions';
import Link from 'next/link';
import {
  getDvmfHealthcareCalendar,
  getDvmfHealthcareAppointmentRequests,
  getDvmfHealthcareServicesForOwner,
} from '@/lib/actions/healthcare.actions';
import { DvmfDashboardContent } from '@/components/dvmf/DVMFDashboardContent';

export default async function DvmfOperationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  if (user.role !== 'dvmf') {
    redirect('/dashboard');
  }

  const [
    eventsResult,
    registryResult,
    petsResult,
    requestsResult,
    healthcareRequestsResult,
    healthcareCalendarResult,
    healthcareServicesResult,
  ] = await Promise.all([
    getEvents({ shelterId: user.id }),
    getDvmfRegistryRecords(),
    getShelterPets(user.id),
    getAdoptionRequests(user.id),
    getDvmfHealthcareAppointmentRequests(),
    getDvmfHealthcareCalendar('week'),
    getDvmfHealthcareServicesForOwner(),
  ]);

  const events = (eventsResult.success ? eventsResult.data : []) || [];
  const records = (registryResult.success ? registryResult.data : []) || [];
  const pets = petsResult.data || [];
  const allRequests = requestsResult.data || [];
  const pendingRequests = allRequests.filter((request: { status: string }) => request.status === 'pending');
  const healthcareRequests = (healthcareRequestsResult.success ? healthcareRequestsResult.data : []) || [];
  const healthcareCalendarData = (healthcareCalendarResult.success ? healthcareCalendarResult.data : null) || null;
  const healthcareServices = (healthcareServicesResult.success ? healthcareServicesResult.data : []) || [];
  const pendingHealthcareRequests = healthcareRequests.filter(
    (request: { status: string }) => request.status === 'pending_approval'
  );
  const isPendingVerification = !user.is_verified;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1440px] mx-auto px-4 py-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">DVMF Operations</h1>
          <p className="text-gray-600">Execute event and registry workflows from a dedicated operations workspace.</p>
          <p className="text-sm text-gray-500 mt-2">
            Branch profile and operating schedule are now managed in{' '}
            <Link href="/settings" className="text-primary-700 font-medium hover:text-primary-800 underline">
              Settings
            </Link>
            .
          </p>
        </div>

        <DvmfDashboardContent
          events={events}
          records={records}
          pets={pets}
          allRequests={allRequests}
          healthcareRequests={healthcareRequests}
          healthcareCalendarData={healthcareCalendarData}
          healthcareServices={healthcareServices}
          pendingCount={pendingRequests.length}
          pendingHealthcareCount={pendingHealthcareRequests.length}
          isPendingVerification={isPendingVerification}
          organizerId={user.id}
        />
      </div>
    </div>
  );
}
