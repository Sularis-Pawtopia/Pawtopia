import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getPet } from '@/lib/actions/pet.actions';
import { getPostWithComments } from '@/lib/actions/post.actions';
import { FeedList } from '@/components/feed/FeedList';
import { EventCommentsPanel } from '@/components/events/EventCommentsPanel';

interface CompanionPostPageProps {
  params: {
    petId: string;
  };
}

function formatAge(ageYears?: number | null, ageMonths?: number | null) {
  const years = ageYears || 0;
  const months = ageMonths || 0;
  const parts: string[] = [];

  if (years > 0) {
    parts.push(`${years} year${years > 1 ? 's' : ''}`);
  }
  if (months > 0) {
    parts.push(`${months} month${months > 1 ? 's' : ''}`);
  }

  return parts.length > 0 ? parts.join(', ') : 'Unknown age';
}

export default async function CompanionPostPage({ params }: CompanionPostPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const petResult = await getPet(params.petId);
  if (petResult.error || !petResult.data) {
    notFound();
  }

  const pet = petResult.data;
  const postId = pet.post?.id;

  if (!postId) {
    notFound();
  }

  const postResult = await getPostWithComments(postId);
  if ('error' in postResult || !postResult.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Companions</h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <aside className="lg:col-span-3 bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="text-lg font-semibold text-gray-900">Companion Details</h2>
            <p className="text-sm text-gray-500 mt-1">{pet.name} is currently up for adoption.</p>

            <div className="mt-4 space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-semibold text-gray-900">Name:</span> {pet.name}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Species/Breed:</span> {pet.species} {pet.breed ? `• ${pet.breed}` : ''}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Age:</span> {formatAge(pet.age_years, pet.age_months)}
              </p>
              <p>
                <span className="font-semibold text-gray-900">Gender/Size:</span> {pet.gender} • {pet.size}
              </p>
              {pet.weight ? (
                <p>
                  <span className="font-semibold text-gray-900">Weight:</span> {pet.weight} kg
                </p>
              ) : null}
              {pet.color ? (
                <p>
                  <span className="font-semibold text-gray-900">Color:</span> {pet.color}
                </p>
              ) : null}
              <p>
                <span className="font-semibold text-gray-900">Status:</span> <span className="capitalize">{pet.status}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-900">Adoption Fee:</span> {pet.adoption_fee ? `PHP ${pet.adoption_fee.toLocaleString()}` : 'Free'}
              </p>
              {(pet.shelter?.city || pet.shelter?.state) && (
                <p className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {[pet.shelter?.city, pet.shelter?.state].filter(Boolean).join(', ')}
                </p>
              )}
              <p className="flex items-center gap-1 text-gray-600">
                <Calendar className="w-4 h-4" />
                Posted {new Date(postResult.data.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm text-gray-700">
              <p className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                {pet.is_vaccinated ? 'Vaccinated' : 'Vaccination status unavailable'}
              </p>
              <p className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-green-600" />
                {pet.is_spayed_neutered ? 'Spayed/Neutered' : 'Spay/Neuter status unavailable'}
              </p>
              {pet.energy_level ? (
                <p className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span className="capitalize">{pet.energy_level} energy</span>
                </p>
              ) : null}
            </div>

            {Array.isArray(pet.temperament) && pet.temperament.length > 0 ? (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Temperament</p>
                <div className="flex flex-wrap gap-1.5">
                  {pet.temperament.map((trait: string) => (
                    <span key={trait} className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-1.5 text-xs text-gray-600">
              <p>{pet.good_with_kids ? 'Good with kids' : 'Kids compatibility not confirmed'}</p>
              <p>{pet.good_with_dogs ? 'Good with dogs' : 'Dogs compatibility not confirmed'}</p>
              <p>{pet.good_with_cats ? 'Good with cats' : 'Cats compatibility not confirmed'}</p>
            </div>

            {(pet.medical_history || pet.special_needs) && (
              <div className="mt-4 pt-4 border-t border-gray-100 text-sm space-y-2">
                {pet.medical_history ? (
                  <p>
                    <span className="font-semibold text-gray-900">Medical History:</span> {pet.medical_history}
                  </p>
                ) : null}
                {pet.special_needs ? (
                  <p>
                    <span className="font-semibold text-gray-900">Special Needs:</span> {pet.special_needs}
                  </p>
                ) : null}
              </div>
            )}

            <div className="mt-5 space-y-2">
              <Link
                href={`/pets/${pet.id}`}
                className="w-full inline-flex items-center justify-center px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                View Full Profile
              </Link>
            </div>
          </aside>

          <div className="lg:col-span-6">
            <FeedList
              initialPosts={[postResult.data as any]}
              currentUserId={user.id}
              userRole={user.role}
              hideComments
              forceShowKebabMenu
              realtimeRefreshMs={2000}
            />
          </div>

          <div className="lg:col-span-3">
            <EventCommentsPanel
              postId={postResult.data.id}
              currentUserId={user.id}
              initialComments={(postResult.data as any).comments || []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
