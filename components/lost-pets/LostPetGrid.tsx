'use client';

import Link from 'next/link';

interface LostPetGridProps {
  pets: any[]; // TODO: Create proper type with post relation
}

export function LostPetGrid({ pets }: LostPetGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {pets.map((pet) => (
        <div
          key={pet.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Status Badge */}
          <div className="relative">
            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
              <span className="text-6xl">
                {pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐈' : '🐾'}
              </span>
            </div>
            <div className="absolute top-4 right-4">
              <StatusBadge status={pet.status} />
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900">{pet.pet_name}</h3>
                <p className="text-gray-600">{pet.species} {pet.breed && `• ${pet.breed}`}</p>
              </div>
              {pet.reward && (
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                  💰 ${pet.reward} reward
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-2">
                <span className="font-semibold">📍 Last seen:</span>
                <span>{pet.last_seen_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">📅 Date:</span>
                <span>{new Date(pet.last_seen_date).toLocaleDateString()}</span>
              </div>
              {pet.color && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold">🎨 Color:</span>
                  <span>{pet.color}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4">
              <Link
                href={`/lost-pets/${pet.id}`}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors text-center font-medium"
              >
                View Details
              </Link>
              <a
                href={`tel:${pet.contact_phone}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                📞 Contact
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: 'lost' | 'found' | 'reunited' }) {
  const config = {
    lost: { bg: 'bg-red-500', text: 'LOST', icon: '❌' },
    found: { bg: 'bg-blue-500', text: 'FOUND', icon: '✓' },
    reunited: { bg: 'bg-green-500', text: 'REUNITED', icon: '🎉' }
  };

  const { bg, text, icon } = config[status];

  return (
    <div className={`${bg} text-white px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 shadow-lg`}>
      <span>{icon}</span>
      <span>{text}</span>
    </div>
  );
}
