import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/actions/auth.actions';
import { getPet } from '@/lib/actions/pet.actions';
import { Sidebar } from '@/components/layout/Sidebar';
import { AdoptionApplicationButton } from '@/components/pets/AdoptionApplicationButton';
import { ArrowLeft, Heart, MapPin, Calendar, Shield, Zap, Users, Dog, Cat, Baby, Edit } from 'lucide-react';

export async function generateMetadata({ params }: { params: { petId: string } }) {
  const result = await getPet(params.petId);
  if (!result.data) {
    return { title: 'Pet Not Found | Pawtopia' };
  }
  return {
    title: `${result.data.name} | Pawtopia`,
    description: result.data.post?.description?.substring(0, 160),
  };
}

export default async function PetDetailPage({
  params,
}: {
  params: { petId: string };
}) {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/auth/login');
  }

  const petResult = await getPet(params.petId);
  
  if (petResult.error || !petResult.data) {
    notFound();
  }

  const pet = petResult.data;
  const isOwner = pet.shelter_id === user.id;
  const canApply = user.role === 'adopter' && pet.status === 'available';

  const formatAge = () => {
    const years = pet.age_years || 0;
    const months = pet.age_months || 0;
    const parts = [];
    if (years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(', ') : 'Unknown age';
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6">
          {/* Back Button */}
          <Link 
            href="/pets"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pets
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Images */}
            <div className="lg:col-span-2 space-y-4">
              {/* Main Image */}
              <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden">
                {pet.post?.media_urls?.[0] ? (
                  <img 
                    src={pet.post.media_urls[0]}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🐾
                  </div>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {pet.post?.media_urls && pet.post.media_urls.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {pet.post.media_urls.map((url: string, index: number) => (
                    <div 
                      key={index}
                      className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100"
                    >
                      <img 
                        src={url}
                        alt={`${pet.name} photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {pet.name}</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {pet.post?.description || 'No description available.'}
                </p>
              </div>

              {/* Temperament & Behavior */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Personality</h2>
                
                {/* Temperament Tags */}
                {pet.temperament && pet.temperament.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {pet.temperament.map((trait: string) => (
                      <span 
                        key={trait}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                )}

                {/* Compatibility */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`p-3 rounded-lg ${pet.good_with_kids ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <Baby className={`w-5 h-5 mb-1 ${pet.good_with_kids ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium">
                      {pet.good_with_kids ? 'Good with Kids' : 'Not tested with kids'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${pet.good_with_dogs ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <Dog className={`w-5 h-5 mb-1 ${pet.good_with_dogs ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium">
                      {pet.good_with_dogs ? 'Good with Dogs' : 'Not tested with dogs'}
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${pet.good_with_cats ? 'bg-green-50' : 'bg-gray-50'}`}>
                    <Cat className={`w-5 h-5 mb-1 ${pet.good_with_cats ? 'text-green-600' : 'text-gray-400'}`} />
                    <p className="text-sm font-medium">
                      {pet.good_with_cats ? 'Good with Cats' : 'Not tested with cats'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <Zap className={`w-5 h-5 mb-1 ${
                      pet.energy_level === 'high' ? 'text-orange-500' :
                      pet.energy_level === 'medium' ? 'text-yellow-500' : 'text-blue-500'
                    }`} />
                    <p className="text-sm font-medium capitalize">
                      {pet.energy_level || 'Unknown'} Energy
                    </p>
                  </div>
                </div>
              </div>

              {/* Health Info */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Health Information</h2>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    pet.is_vaccinated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Shield className="w-4 h-4" />
                    {pet.is_vaccinated ? 'Vaccinated' : 'Not Vaccinated'}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    pet.is_spayed_neutered ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Heart className="w-4 h-4" />
                    {pet.is_spayed_neutered ? 'Spayed/Neutered' : 'Not Spayed/Neutered'}
                  </div>
                </div>

                {pet.medical_history && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Medical History</h3>
                    <p className="text-gray-600 text-sm">{pet.medical_history}</p>
                  </div>
                )}

                {pet.special_needs && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-1">Special Needs</h3>
                    <p className="text-gray-600 text-sm">{pet.special_needs}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Info */}
            <div className="space-y-4">
              {/* Pet Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold text-gray-900">{pet.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    pet.status === 'available' ? 'bg-green-100 text-green-800' :
                    pet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {pet.status === 'available' ? 'Available' : 
                     pet.status === 'pending' ? 'Pending' : 'Adopted'}
                  </span>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="text-lg">🐾</span>
                    <span className="capitalize">{pet.species} {pet.breed && `• ${pet.breed}`}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatAge()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="capitalize">{pet.gender}</span>
                    <span>•</span>
                    <span className="capitalize">{pet.size}</span>
                    {pet.weight && <span>• {pet.weight} kg</span>}
                  </div>
                  {pet.color && (
                    <div className="text-gray-600">
                      Color: {pet.color}
                    </div>
                  )}
                </div>

                {/* Adoption Fee */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-sm text-gray-500">Adoption Fee</p>
                  <p className="text-2xl font-bold text-green-600">
                    {pet.adoption_fee ? `₱${pet.adoption_fee.toLocaleString()}` : 'Free'}
                  </p>
                </div>

                {/* Actions */}
                {isOwner ? (
                  <Link
                    href={`/shelter/pets/${pet.id}/edit`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Pet
                  </Link>
                ) : canApply ? (
                  <AdoptionApplicationButton petId={pet.id} petName={pet.name} />
                ) : pet.status !== 'available' ? (
                  <p className="text-center text-gray-500 py-3">
                    This pet is no longer available for adoption
                  </p>
                ) : (
                  <p className="text-center text-gray-500 py-3">
                    Only adopters can apply for adoption
                  </p>
                )}

                {/* Shelter Info */}
                {pet.shelter && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <p className="text-sm text-gray-500 mb-2">Listed by</p>
                    <Link 
                      href={`/profile/${pet.shelter.id}`}
                      className="flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition"
                    >
                      {pet.shelter.avatar_url ? (
                        <img 
                          src={pet.shelter.avatar_url}
                          alt={pet.shelter.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-green-600" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{pet.shelter.username}</p>
                        {(pet.shelter.city || pet.shelter.state) && (
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {[pet.shelter.city, pet.shelter.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
