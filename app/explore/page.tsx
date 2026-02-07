import { getExplorePets, getFeaturedShelters } from '@/lib/actions/explore.actions';
import { ExploreHeader } from '@/components/explore/ExploreHeader';
import { FeaturedPets } from '@/components/explore/FeaturedPets';
import { NearbyShelters } from '@/components/explore/NearbyShelters';
import { TrendingAdoptions } from '@/components/explore/TrendingAdoptions';
import { AdvancedFilters } from '@/components/explore/AdvancedFilters';

export default async function ExplorePage() {
  const [petsResult, sheltersResult] = await Promise.all([
    getExplorePets(),
    getFeaturedShelters(),
  ]);

  const pets = petsResult.success ? petsResult.data : [];
  const shelters = sheltersResult.success ? sheltersResult.data : [];

  return (
    <div className="min-h-screen bg-gray-50">
        <ExploreHeader />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex gap-8">
            {/* Advanced Filters Sidebar */}
            <aside className="w-72 flex-shrink-0">
              <AdvancedFilters />
            </aside>

            {/* Main Content */}
            <main className="flex-1 space-y-12">
              {/* Featured Pets */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🌟 Featured Pets
                </h2>
                <FeaturedPets pets={pets || []} />
              </section>

              {/* Nearby Shelters */}
              {shelters && shelters.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    📍 Shelters Near You
                  </h2>
                  <NearbyShelters shelters={shelters || []} />
                </section>
              )}

              {/* Trending Adoptions */}
              <section>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  🔥 Trending Adoptions
                </h2>
                <TrendingAdoptions />
              </section>
            </main>
          </div>
        </div>
    </div>
  );
}
