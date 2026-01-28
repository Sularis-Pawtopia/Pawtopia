'use client';

import { Pet } from '@/types';

interface PetGridProps {
  pets: Pet[];
  isOwner?: boolean;
}

export function PetGrid({ pets }: PetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <p className="text-gray-500">No pets found</p>
        </div>
      ) : (
        pets.map((pet) => (
          <div key={pet.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900">{pet.name}</h3>
              <p className="text-gray-600">{pet.species} • {pet.breed || 'Mixed'}</p>
              <p className="text-sm text-gray-500 mt-2">
                {pet.age_years ? `${pet.age_years} years` : 'Age unknown'}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
