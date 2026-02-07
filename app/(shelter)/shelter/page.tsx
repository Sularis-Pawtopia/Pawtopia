import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { getShelterPets } from '@/lib/actions/pet.actions';
import { getAdoptionRequests } from '@/lib/actions/adoption.actions';
import { ShelterStats } from '@/components/shelter/ShelterStats';
import { ShelterDashboardContent } from '@/components/shelter/ShelterDashboardContent';
import Link from 'next/link';

export default async function ShelterDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (user.role !== 'shelter') {
    redirect('/dashboard');
  }

  const isPendingVerification = !user.is_verified;

  const [petsResult, requestsResult] = await Promise.all([
    getShelterPets(user.id),
    getAdoptionRequests(user.id),
  ]);

  const pets = petsResult.data || [];
  const allRequests = requestsResult.data || [];
  const pendingRequests = allRequests.filter((r: { status: string }) => r.status === 'pending');

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Pending Verification Banner */}
          {isPendingVerification && (
            <div className="mb-6 bg-amber-50 border border-amber-300 rounded-xl p-5 flex items-start gap-4">
              <span className="text-3xl">⏳</span>
              <div>
                <h3 className="font-bold text-amber-900 text-lg">Verification Pending</h3>
                <p className="text-amber-800 text-sm mt-1">
                  Your shelter registration is currently under review by our admin team.
                  You won&apos;t be able to post pets for adoption until your account is verified.
                  This usually takes 1–3 business days.
                </p>
                <Link
                  href="/onboarding/shelter/pending"
                  className="inline-block mt-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
                >
                  View submission status
                </Link>
              </div>
            </div>
          )}

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Shelter Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your pets and adoption applications
            </p>
          </div>

          {/* Stats */}
          <ShelterStats />

          {/* Tabbed Content */}
          <ShelterDashboardContent
            pets={pets}
            allRequests={allRequests}
            pendingCount={pendingRequests.length}
            isPendingVerification={isPendingVerification}
          />
        </div>
      </div>
    </div>
  );
}
