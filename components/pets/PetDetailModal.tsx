'use client';

import { useState } from 'react';
import { X, MapPin, Heart, Shield, DollarSign, Info, Camera, Pencil } from 'lucide-react';
import { PetIdCardDownload } from './PetIdCardDownload';

interface PetDetailModalProps {
  pet: any;
  ownerContext?: any;
  showIdCard?: boolean;
  userRole?: string;
  existingRequest?: { id: string; status: string } | null;
  onClose: () => void;
  onAdopt?: () => void;
  showAdoptSection?: boolean;
  onEdit?: () => void;
  onChangePicture?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    tone?: 'primary' | 'secondary' | 'danger';
  }>;
}

export function PetDetailModal({
  pet,
  ownerContext,
  showIdCard = false,
  userRole,
  existingRequest,
  onClose,
  onAdopt,
  showAdoptSection = true,
  onEdit,
  onChangePicture,
  actions = [],
}: PetDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = (pet.post?.media_urls as string[]) || [];
  const primaryImage = images[currentImageIndex] || '';
  const isAdopter = userRole === 'adopter';
  const hasExistingRequest = !!existingRequest;
  const isAvailable = pet.status === 'available';

  const formatAge = (years?: number, months?: number) => {
    const parts = [];
    if (years && years > 0) parts.push(`${years} year${years > 1 ? 's' : ''}`);
    if (months && months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' ') : 'Age unknown';
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Reviewing';
      case 'approved': return 'Approved';
      case 'rejected': return 'Declined';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-2 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={onChangePicture}
                disabled={!onChangePicture}
                className={`relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 bg-gray-100 ${onChangePicture ? 'cursor-pointer group' : 'cursor-default'}`}
                title={onChangePicture ? 'Change picture' : undefined}
              >
                {primaryImage ? (
                  <img src={primaryImage} alt={pet.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🐾</div>
                )}
                {onChangePicture && (
                  <span className="absolute inset-0 bg-black/35 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </span>
                )}
              </button>

              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{pet.name}</h2>
                <p className="text-sm text-gray-600 capitalize truncate">
                  {pet.species} {pet.breed ? `• ${pet.breed}` : ''}
                </p>
                <div className="mt-1.5">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    pet.status === 'available' ? 'bg-green-100 text-green-800' :
                    pet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {pet.status === 'available' ? 'Looking for a Home' : pet.status === 'pending' ? 'Pending Adoption' : 'Adopted'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
                  title="Edit"
                >
                  <Pencil className="w-4 h-4 text-gray-700" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50"
                title="Close"
              >
                <X className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
              {images.map((url, index) => (
                <button
                  key={url + index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border ${index === currentImageIndex ? 'border-primary-500' : 'border-gray-200'}`}
                >
                  <img src={url} alt={`${pet.name} ${index + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {showIdCard && (
            <div className="mb-4">
              <PetIdCardDownload pet={pet} ownerContext={ownerContext} />
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            <InfoTile label="Age" value={formatAge(pet.age_years, pet.age_months)} />
            <InfoTile label="Sex" value={(pet.gender || 'Unknown').toString()} />
            <InfoTile label="Size" value={(pet.size || 'N/A').toString()} />
            {pet.weight ? <InfoTile label="Weight" value={`${pet.weight} kg`} /> : null}
            {pet.color ? <InfoTile label="Color" value={pet.color} /> : null}
            {pet.energy_level ? <InfoTile label="Energy" value={pet.energy_level} /> : null}
          </div>

          <div className="mb-4 space-y-2">
            <div className="flex flex-wrap gap-2">
              {pet.is_vaccinated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 text-green-700 text-xs rounded-full">
                  <Shield className="w-3 h-3" /> Vaccinated
                </span>
              )}
              {pet.is_spayed_neutered && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                  <Shield className="w-3 h-3" /> Spayed/Neutered
                </span>
              )}
              {pet.good_with_kids && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 text-xs rounded-full">
                  <Heart className="w-3 h-3" /> Good with kids
                </span>
              )}
              {pet.good_with_dogs && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs rounded-full">
                  <Heart className="w-3 h-3" /> Good with dogs
                </span>
              )}
              {pet.good_with_cats && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-pink-50 text-pink-700 text-xs rounded-full">
                  <Heart className="w-3 h-3" /> Good with cats
                </span>
              )}
            </div>

            {pet.temperament && pet.temperament.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {pet.temperament.map((trait: string) => (
                  <span key={trait} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full capitalize">
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>

          {pet.post?.description && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">About</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{pet.post.description}</p>
            </div>
          )}

          {pet.special_needs && (
            <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Info className="w-4 h-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-800">Special Needs</span>
              </div>
              <p className="text-sm text-amber-700">{pet.special_needs}</p>
            </div>
          )}

          {pet.shelter && (
            <div className="mb-4 bg-gray-50 rounded-lg p-3">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Shelter Information</h3>
              <div className="flex items-center gap-3">
                {pet.shelter.avatar_url ? (
                  <img src={pet.shelter.avatar_url} alt={pet.shelter.username} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">🏠</div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{pet.shelter.shelter_profile?.shelter_name || pet.shelter.username}</p>
                  {(pet.shelter.city || pet.shelter.state) && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {[pet.shelter.city, pet.shelter.state].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {pet.adoption_fee !== undefined && pet.adoption_fee !== null && (
            <div className="mb-4 flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5 text-green-600" />
              <span className="font-bold text-green-700">{pet.adoption_fee > 0 ? `₱${pet.adoption_fee.toLocaleString()}` : 'Free Adoption'}</span>
            </div>
          )}

          {hasExistingRequest && existingRequest && (
            <div className={`mb-4 px-4 py-3 rounded-lg border ${
              existingRequest.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
              existingRequest.status === 'approved' ? 'bg-green-50 border-green-200' :
              existingRequest.status === 'rejected' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <p className="text-sm font-medium">
                Your adoption request is:{' '}
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(existingRequest.status)}`}>
                  {statusLabel(existingRequest.status)}
                </span>
              </p>
            </div>
          )}

          {actions.length > 0 && (
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              {actions.map((action) => {
                const toneClass =
                  action.tone === 'danger'
                    ? 'border-red-200 text-red-600 hover:bg-red-50'
                    : action.tone === 'primary'
                    ? 'bg-primary-600 text-white border-primary-600 hover:bg-primary-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50';

                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${toneClass}`}
                  >
                    {action.label}
                  </button>
                );
              })}
            </div>
          )}

          {showAdoptSection && (
            <div className="mt-4">
              {hasExistingRequest ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed">
                  Request Already Submitted
                </button>
              ) : !isAvailable ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed">
                  Not Available for Adoption
                </button>
              ) : isAdopter ? (
                <button
                  onClick={onAdopt}
                  className="w-full py-3 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                >
                  🐾 Adopt {pet.name}
                </button>
              ) : (
                <div className="group relative">
                  <button disabled className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 font-semibold cursor-not-allowed">
                    🐾 Adopt {pet.name}
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    You need to be an adopter to adopt a pet.
                    <br />
                    <a href="/onboarding/adopter" className="text-green-400 underline pointer-events-auto">Apply as an adopter</a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-sm font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  );
}
