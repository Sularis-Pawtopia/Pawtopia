
import { getAvailablePets } from '@/lib/actions/pet.actions';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { PetGrid } from '@/components/pets/PetGrid';
import { PetFilters } from '@/components/pets/PetFilters';
import { SearchBar } from '@/components/SearchBar';

export default async function PetsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const filters = {
    species: typeof params.species === 'string' ? params.species : undefined,
    breed: typeof params.breed === 'string' ? params.breed : undefined,
    size: typeof params.size === 'string' ? params.size : undefined,
    gender: typeof params.gender === 'string' ? params.gender : undefined,
  };

  const { data: pets } = await getAvailablePets(filters);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Find Your Perfect Companion
            </h1>
            <p className="text-gray-600">
              Browse available companions from shelters near you
            </p>
          </div>

          <div className="mb-6">
            <SearchBar placeholder="Search by name, breed, or species..." />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <PetFilters />
              </div>
            </div>

            {/* Pet Grid */}
            <div className="lg:col-span-3">
              {pets && pets.length > 0 ? (
                <PetGrid pets={pets} userRole={user?.role} userId={user?.id} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No pets found matching your criteria
                  </p>
                  <a
                    href="/pets"
                    className="mt-4 inline-block text-primary-600 hover:text-primary-700"
                  >
                    Clear filters
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
    </div>
  );
}
