import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { getShelterPets } from '@/lib/actions/pet.actions';
import { getAdoptionRequests } from '@/lib/actions/adoption.actions';
import { ShelterStats } from '@/components/shelter/ShelterStats';
import { PetGrid } from '@/components/pets/PetGrid';
import { AdoptionRequestsList } from '@/components/shelter/AdoptionRequestsList';
import Link from 'next/link';

export default async function ShelterDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (user.role !== 'shelter') {
    redirect('/dashboard');
  }

  // If not verified and no shelter profile yet, go to onboarding
  // If not verified but has shelter profile, show pending banner
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

          {/* Adoption Requests - Show all with pending highlighted */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Adoption Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {pendingRequests.length} pending
                </span>
              )}
            </h2>
            {allRequests.length > 0 ? (
              <AdoptionRequestsList requests={allRequests} />
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-gray-500">No adoption requests yet</p>
                <p className="text-gray-400 text-sm mt-1">Requests will appear here when adopters apply for your pets</p>
              </div>
            )}
          </div>

          {/* Available Pets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Pets ({pets.length})
              </h2>
              {isPendingVerification ? (
                <span className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
                  title="Your shelter must be verified before you can add pets"
                >
                  Add New Pet (Verification Required)
                </span>
              ) : (
                <a
                  href="/shelter/pets/new"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                >
                  Add New Pet
                </a>
              )}
            </div>
            <PetGrid pets={pets} isOwner />
          </div>
        </div>
      </div>
    </div>
  );
}
