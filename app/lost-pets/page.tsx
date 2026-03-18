import { getLostPets } from '@/lib/actions/lost-pet.actions';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { LostPetGrid } from '@/components/lost-pets/LostPetGrid';
import { LostPetFilters } from '@/components/lost-pets/LostPetFilters';
import { PostLostPetButton } from '@/components/lost-pets/PostLostPetButton';
import Link from 'next/link';

export default async function LostPetsPage() {
  const user = await getCurrentUser();
  const lostPetsResult = await getLostPets();
  const lostPets = lostPetsResult.success ? lostPetsResult.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lost & Found Pets</h1>
              <p className="text-gray-600 mt-1">
                Help reunite lost pets with their families
              </p>
            </div>
            {user && <PostLostPetButton />}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Info Banner */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🔍</div>
            <div>
              <h2 className="text-lg font-semibold text-primary-900 mb-2">
                Help Us Reunite Families
              </h2>
              <p className="text-primary-800">
                If you've lost a pet or found one, post it here. Our community will help spread the word 
                and increase the chances of a happy reunion.
              </p>
              {!user && (
                <Link
                  href="/auth/signup"
                  className="inline-block mt-4 bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Sign Up to Post
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <LostPetFilters />
          </div>

          {/* Lost Pets Grid */}
          <div className="lg:col-span-3">
            {lostPets?.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">🐾</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No Lost Pets Reported
                </h3>
                <p className="text-gray-600">
                  Great news! There are currently no lost pets in your area.
                </p>
              </div>
            ) : (
              <LostPetGrid pets={lostPets || []} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
