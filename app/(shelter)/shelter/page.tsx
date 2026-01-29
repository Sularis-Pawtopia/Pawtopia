import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { getShelterPets } from '@/lib/actions/pet.actions';
import { getAdoptionRequests } from '@/lib/actions/adoption.actions';
import { ShelterStats } from '@/components/shelter/ShelterStats';
import { PetGrid } from '@/components/pets/PetGrid';
import { AdoptionRequestsList } from '@/components/shelter/AdoptionRequestsList';

export default async function ShelterDashboardPage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }
  
  if (user.role !== 'shelter') {
    redirect('/dashboard');
  }
  
  if (!user.is_verified) {
    redirect('/onboarding/shelter');
  }

  const [petsResult, requestsResult] = await Promise.all([
    getShelterPets(user.id),
    getAdoptionRequests(user.id, 'pending'),
  ]);

  const pets = petsResult.data || [];
  const pendingRequests = requestsResult.data || [];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 py-6">
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

          {/* Pending Adoption Requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Pending Applications ({pendingRequests.length})
              </h2>
              <AdoptionRequestsList requests={pendingRequests} />
            </div>
          )}

          {/* Available Pets */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Pets ({pets.length})
              </h2>
              <a
                href="/shelter/pets/new"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Add New Pet
              </a>
            </div>
            <PetGrid pets={pets} isOwner />
          </div>
        </div>
      </div>
    </div>
  );
}
