'use client';

import Link from 'next/link';
import { Heart, MapPin, Edit } from 'lucide-react';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age_years?: number;
  age_months?: number;
  gender: string;
  size: string;
  status: string;
  adoption_fee?: number;
  post?: {
    media_urls?: string[];
  };
  shelter?: {
    id: string;
    username: string;
    city?: string;
    state?: string;
  };
}

interface PetGridProps {
  pets: Pet[];
  isOwner?: boolean;
}

export function PetGrid({ pets, isOwner }: PetGridProps) {
  const formatAge = (years?: number, months?: number) => {
    const parts = [];
    if (years && years > 0) parts.push(`${years}y`);
    if (months && months > 0) parts.push(`${months}m`);
    return parts.length > 0 ? parts.join(' ') : 'Age unknown';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <div className="text-6xl mb-4">🐾</div>
          <p className="text-gray-500">No pets found</p>
        </div>
      ) : (
        pets.map((pet) => (
          <Link 
            key={pet.id} 
            href={isOwner ? `/shelter/pets/${pet.id}/edit` : `/pets/${pet.id}`}
            className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
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

              {/* Edit indicator for owner */}
              {isOwner && (
                <div className="absolute top-3 right-3 bg-white/90 p-1.5 rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity">
                  <Edit className="w-4 h-4 text-gray-600" />
                </div>
              )}

              {/* Favorite button (for non-owners) */}
              {!isOwner && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
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
            </div>
          </Link>
        ))
      )}
    </div>
  );
}
