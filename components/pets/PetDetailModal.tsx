'use client';

import { useState } from 'react';
import { X, MapPin, Heart, Shield, DollarSign, Info, ChevronLeft, ChevronRight } from 'lucide-react';

interface PetDetailModalProps {
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    age_years?: number;
    age_months?: number;
    gender: string;
    size: string;
    color?: string;
    weight?: number;
    status: string;
    is_vaccinated: boolean;
    is_spayed_neutered: boolean;
    medical_history?: string;
    temperament?: string[];
    good_with_kids?: boolean;
    good_with_dogs?: boolean;
    good_with_cats?: boolean;
    energy_level?: string;
    special_needs?: string;
    adoption_fee?: number;
    post?: {
      description?: string;
      media_urls?: string[];
      tags?: string[];
    };
    shelter?: {
      id: string;
      username: string;
      avatar_url?: string;
      city?: string;
      state?: string;
      shelter_profile?: {
        shelter_name?: string;
        phone?: string;
      };
    };
  };
  userRole?: string;
  existingRequest?: { id: string; status: string } | null;
  onClose: () => void;
  onAdopt: () => void;
}

export function PetDetailModal({ pet, userRole, existingRequest, onClose, onAdopt }: PetDetailModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = (pet.post?.media_urls as string[]) || [];
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
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg hover:bg-white transition"
        >
          <X className="w-5 h-5 text-gray-700" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-gray-100">
            {images.length > 0 ? (
              <>
                <div className="aspect-square relative overflow-hidden">
                  <img
                    src={images[currentImageIndex]}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow hover:bg-white transition"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev + 1) % images.length)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-1.5 rounded-full shadow hover:bg-white transition"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          className={`w-2 h-2 rounded-full transition ${
                            i === currentImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="aspect-square flex items-center justify-center text-8xl">
                🐾
              </div>
            )}

            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                pet.status === 'available' ? 'bg-green-100 text-green-800' :
                pet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {pet.status === 'available' ? 'Looking for a Home' : 
                 pet.status === 'pending' ? 'Pending Adoption' : 'Adopted'}
              </span>
            </div>
          </div>

          {/* Details Section */}
          <div className="p-6 flex flex-col">
            {/* Pet Name & Basic Info */}
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-900">{pet.name}</h2>
              <p className="text-gray-600 capitalize mt-1">
                {pet.species} {pet.breed && `• ${pet.breed}`}
              </p>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block">Age</span>
                <span className="font-medium text-gray-900">{formatAge(pet.age_years, pet.age_months)}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block">Gender</span>
                <span className="font-medium text-gray-900 capitalize">{pet.gender}</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <span className="text-xs text-gray-500 block">Size</span>
                <span className="font-medium text-gray-900 capitalize">{pet.size}</span>
              </div>
              {pet.weight && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-xs text-gray-500 block">Weight</span>
                  <span className="font-medium text-gray-900">{pet.weight} kg</span>
                </div>
              )}
              {pet.color && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-xs text-gray-500 block">Color</span>
                  <span className="font-medium text-gray-900 capitalize">{pet.color}</span>
                </div>
              )}
              {pet.energy_level && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-xs text-gray-500 block">Energy</span>
                  <span className="font-medium text-gray-900 capitalize">{pet.energy_level}</span>
                </div>
              )}
            </div>

            {/* Description */}
            {pet.post?.description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-1">About</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{pet.post.description}</p>
              </div>
            )}

            {/* Health & Temperament */}
            <div className="mb-4 space-y-3">
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
                  {pet.temperament.map((trait) => (
                    <span key={trait} className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs rounded-full capitalize">
                      {trait}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tags */}
            {pet.post?.tags && pet.post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {pet.post.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Special Needs */}
            {pet.special_needs && (
              <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Special Needs</span>
                </div>
                <p className="text-sm text-amber-700">{pet.special_needs}</p>
              </div>
            )}

            {/* Shelter Info */}
            {pet.shelter && (
              <div className="mb-4 bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Shelter Information</h3>
                <div className="flex items-center gap-3">
                  {pet.shelter.avatar_url ? (
                    <img 
                      src={pet.shelter.avatar_url} 
                      alt={pet.shelter.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-lg">
                      🏠
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {pet.shelter.shelter_profile?.shelter_name || pet.shelter.username}
                    </p>
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

            {/* Adoption Fee */}
            {pet.adoption_fee !== undefined && pet.adoption_fee !== null && (
              <div className="mb-4 flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-700">
                  {pet.adoption_fee > 0 ? `₱${pet.adoption_fee.toLocaleString()}` : 'Free Adoption'}
                </span>
              </div>
            )}

            {/* Existing Request Status */}
            {hasExistingRequest && existingRequest && (
              <div className={`mb-4 px-4 py-3 rounded-lg border ${
                existingRequest.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                existingRequest.status === 'approved' ? 'bg-green-50 border-green-200' :
                existingRequest.status === 'rejected' ? 'bg-red-50 border-red-200' :
                'bg-blue-50 border-blue-200'
              }`}>
                <p className="text-sm font-medium">
                  Your adoption request is: <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor(existingRequest.status)}`}>
                    {statusLabel(existingRequest.status)}
                  </span>
                </p>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Adopt Button */}
            <div className="mt-4">
              {hasExistingRequest ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
                >
                  Request Already Submitted
                </button>
              ) : !isAvailable ? (
                <button
                  disabled
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed"
                >
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
                  <button
                    disabled
                    className="w-full py-3 rounded-xl bg-gray-200 text-gray-500 font-semibold cursor-not-allowed"
                  >
                    🐾 Adopt {pet.name}
                  </button>
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    You need to be an adopter to adopt a pet. 
                    <br />
                    <a href="/onboarding/adopter" className="text-green-400 underline pointer-events-auto">
                      Apply as an adopter
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
