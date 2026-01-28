'use client';

import Link from 'next/link';

export function FeaturedPets({ pets }: { pets: any[] }) {
  if (pets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
        <div className="text-6xl mb-4">🐾</div>
        <p>No featured pets available at the moment</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <Link
          key={pet.id}
          href={`/pets/${pet.id}`}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden group"
        >
          {/* Pet Image */}
          <div className="relative aspect-square bg-gray-100">
            {pet.photos?.[0] ? (
              <img
                src={pet.photos[0]}
                alt={pet.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl">
                {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'}
              </div>
            )}
            {pet.is_featured && (
              <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-bold">
                ⭐ Featured
              </div>
            )}
          </div>

          {/* Pet Info */}
          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{pet.name}</h3>
                <p className="text-sm text-gray-600">
                  {pet.breed} • {pet.age_years}y {pet.age_months}m
                </p>
              </div>
              <div className="text-2xl">
                {pet.gender === 'male' ? '♂️' : '♀️'}
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-2">
              {pet.description}
            </p>

            <div className="flex gap-2 flex-wrap mb-4">
              {pet.good_with_kids && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  👶 Good with kids
                </span>
              )}
              {pet.good_with_pets && (
                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                  🐕 Good with pets
                </span>
              )}
            </div>

            {pet.shelter && (
              <div className="text-sm text-gray-500 border-t pt-3">
                📍 {pet.shelter.shelter_name}
                <br />
                {pet.shelter.city}, {pet.shelter.state}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
