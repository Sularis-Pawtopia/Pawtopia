'use client';

import { useState, useEffect } from 'react';
import { Heart, MapPin, Edit, PawPrint } from 'lucide-react';
import { PetDetailModal } from './PetDetailModal';
import { AdoptionApplicationModal } from './AdoptionApplicationModal';
import { createClient } from '@/lib/supabase/client';

interface Pet {
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
}

interface PetGridProps {
  pets: Pet[];
  isOwner?: boolean;
  userRole?: string;
  userId?: string;
  onPetClick?: (pet: Pet) => void;
}

export function PetGrid({ pets, isOwner, userRole, userId, onPetClick }: PetGridProps) {
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [existingRequests, setExistingRequests] = useState<Record<string, { id: string; status: string } | null>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch existing adoption requests for the current user
  useEffect(() => {
    if (!userId || userRole !== 'adopter') return;

    const fetchExistingRequests = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('adoption_requests')
        .select('id, pet_id, status')
        .eq('adopter_id', userId);
      
      if (data) {
        const map: Record<string, { id: string; status: string }> = {};
        data.forEach((req: { id: string; pet_id: string; status: string }) => {
          map[req.pet_id] = { id: req.id, status: req.status };
        });
        setExistingRequests(map);
      }
    };

    fetchExistingRequests();
  }, [userId, userRole]);

  const formatAge = (years?: number, months?: number) => {
    const parts = [];
    if (years && years > 0) parts.push(`${years}y`);
    if (months && months > 0) parts.push(`${months}m`);
    return parts.length > 0 ? parts.join(' ') : 'Age unknown';
  };

  const handlePetClick = (pet: Pet) => {
    if (onPetClick) {
      onPetClick(pet);
      return;
    }

    if (isOwner) {
      // Owner: navigate to edit
      window.location.href = `/shelter/pets/${pet.id}/edit`;
      return;
    }
    setSelectedPet(pet);
  };

  const handleAdopt = () => {
    setShowApplicationModal(true);
  };

  const handleApplicationSuccess = () => {
    setShowApplicationModal(false);
    if (selectedPet) {
      setExistingRequests((prev) => ({
        ...prev,
        [selectedPet.id]: { id: 'new', status: 'pending' },
      }));
      setSuccessMessage(`Your adoption request for ${selectedPet.name} has been submitted! The shelter will review your application.`);
      setSelectedPet(null);
      setTimeout(() => setSuccessMessage(null), 5000);
    }
  };

  return (
    <>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
          <div className="text-2xl">🎉</div>
          <div>
            <p className="text-green-800 font-medium">Application Sent!</p>
            <p className="text-green-700 text-sm mt-1">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pets.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-6xl mb-4">🐾</div>
            <p className="text-gray-500">No pets found</p>
          </div>
        ) : (
          pets.map((pet) => {
            const existingRequest = existingRequests[pet.id] || null;

            return (
              <div 
                key={pet.id}
                onClick={() => handlePetClick(pet)}
                className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all cursor-pointer"
              >
                {/* Image */}
                <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                  {pet.post?.media_urls?.[0] ? (
                    <img 
                      src={pet.post.media_urls[0]}
                      alt={pet.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      🐾
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pet.status === 'available' ? 'bg-green-100 text-green-800' :
                      pet.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {pet.status === 'available' ? 'Available' : 
                       pet.status === 'pending' ? 'Pending' : 'Adopted'}
                    </span>
                  </div>

                  {/* Existing Request Badge */}
                  {existingRequest && (
                    <div className="absolute top-3 right-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        existingRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        existingRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                        existingRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {existingRequest.status === 'pending' ? 'Reviewing' :
                         existingRequest.status === 'approved' ? 'Approved' :
                         existingRequest.status === 'rejected' ? 'Declined' : 'Completed'}
                      </span>
                    </div>
                  )}

                  {/* Edit indicator for owner */}
                  {isOwner && (
                    <div className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit className="w-4 h-4 text-gray-600" />
                    </div>
                  )}

                  {/* Favorite button (for non-owners, no existing request) */}
                  {!isOwner && !existingRequest && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement favorites
                      }}
                      className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                    >
                      <Heart className="w-4 h-4 text-gray-600 hover:text-red-500" />
                    </button>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                        {pet.name}
                      </h3>
                      <p className="text-sm text-gray-600 capitalize">
                        {pet.species} {pet.breed && `• ${pet.breed}`}
                      </p>
                    </div>
                    {pet.adoption_fee !== undefined && (
                      <span className="text-green-600 font-semibold whitespace-nowrap">
                        {pet.adoption_fee > 0 ? `₱${pet.adoption_fee.toLocaleString()}` : 'Free'}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
                    <span>{formatAge(pet.age_years, pet.age_months)}</span>
                    <span>•</span>
                    <span className="capitalize">{pet.gender}</span>
                    <span>•</span>
                    <span className="capitalize">{pet.size}</span>
                  </div>

                  {/* Shelter location (for non-owners) */}
                  {!isOwner && pet.shelter && (pet.shelter.city || pet.shelter.state) && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {[pet.shelter.city, pet.shelter.state].filter(Boolean).join(', ')}
                    </div>
                  )}

                  {/* Quick Adopt Button on card */}
                  {!isOwner && pet.status === 'available' && !existingRequest && (
                    <div className="mt-3">
                      {userRole === 'adopter' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPet(pet);
                          }}
                          className="w-full py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-1.5"
                        >
                          <PawPrint className="w-4 h-4" />
                          View & Adopt
                        </button>
                      ) : (
                        <div className="group/tooltip relative">
                          <button
                            disabled
                            className="w-full py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-1.5"
                          >
                            <PawPrint className="w-4 h-4" />
                            Adopt
                          </button>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                            Apply as an adopter to adopt pets
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pet Detail Modal */}
      {selectedPet && !showApplicationModal && (
        <PetDetailModal
          pet={selectedPet}
          userRole={userRole}
          existingRequest={existingRequests[selectedPet.id] || null}
          onClose={() => setSelectedPet(null)}
          onAdopt={handleAdopt}
        />
      )}

      {/* Adoption Application Modal */}
      {showApplicationModal && selectedPet && (
        <AdoptionApplicationModal
          petId={selectedPet.id}
          petName={selectedPet.name}
          shelterName={selectedPet.shelter?.shelter_profile?.shelter_name || selectedPet.shelter?.username}
          onClose={() => setShowApplicationModal(false)}
          onSuccess={handleApplicationSuccess}
        />
      )}
    </>
  );
}
