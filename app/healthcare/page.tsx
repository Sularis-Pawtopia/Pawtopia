import { redirect } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import {
  getDvmfHealthcareBranches,
  getHealthcareEligiblePets,
  getHealthcareServices,
  getMyHealthcareAppointmentRequests,
  syncMayaPaymentStatus,
} from '@/lib/actions/healthcare.actions';
import { HealthcareBookingCard } from '@/components/healthcare/HealthcareBookingCard';
import { MyHealthcareAppointments } from '@/components/healthcare/MyHealthcareAppointments';

type HealthcarePageProps = {
  searchParams?: {
    healthcarePayment?: string;
    appointmentId?: string;
  };
};

export default async function HealthcarePage({ searchParams }: HealthcarePageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const canUseHealthcareRequesterFlow = ['adopter', 'volunteer', 'regular_user'].includes(user.role);
  if (!canUseHealthcareRequesterFlow) {
    redirect('/dashboard');
  }

  if (
    searchParams?.healthcarePayment === 'success' &&
    typeof searchParams?.appointmentId === 'string' &&
    searchParams.appointmentId.length > 0
  ) {
    await syncMayaPaymentStatus(searchParams.appointmentId, { assumePaidOnSuccessReturn: true });
  }

  const [healthcareRequestsResult, healthcareBranchesResult, healthcareServicesResult, healthcarePetsResult] = await Promise.all([
    getMyHealthcareAppointmentRequests(),
    getDvmfHealthcareBranches(),
    getHealthcareServices(),
    getHealthcareEligiblePets(),
  ]);

  const healthcareRequests = (healthcareRequestsResult.success ? healthcareRequestsResult.data : []) || [];
  const healthcareBranches = (healthcareBranchesResult.success ? healthcareBranchesResult.data : []) || [];
  const branchIds = new Set(healthcareBranches.map((branch: any) => branch.user_id));
  const healthcareServices = ((healthcareServicesResult.success ? healthcareServicesResult.data : []) || [])
    .filter((service: any) => branchIds.has(service.dvmf_id))
    .sort((a: any, b: any) => String(a.service_name || '').localeCompare(String(b.service_name || '')));
  const healthcarePets = (healthcarePetsResult.success ? healthcarePetsResult.data : []) || [];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-amber-50 via-white to-cyan-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
          <div className="rounded-2xl border border-orange-100 bg-white/90 shadow-sm p-5 lg:p-7 mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange-500">Healthcare Desk</p>
            <h1 className="mt-2 text-2xl lg:text-3xl font-bold text-slate-900">Book DVMF Healthcare Services</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-3xl">
              Schedule consultations and treatments in one place. Submit your preferred date/time, then track approval, payment,
              and appointment completion from your request timeline.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-5">
              <HealthcareBookingCard
                initialBranches={healthcareBranches}
                initialServices={healthcareServices}
                initialPets={healthcarePets}
                canAddPet={canUseHealthcareRequesterFlow}
              />
            </div>
            <div className="xl:col-span-7">
              <MyHealthcareAppointments initialRequests={healthcareRequests} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}