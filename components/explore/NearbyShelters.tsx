'use client';

import Link from 'next/link';

export function NearbyShelters({ shelters }: { shelters: any[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {shelters.map((shelter) => (
        <Link
          key={shelter.user_id}
          href={`/profile/${shelter.user_id}`}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6"
        >
          <div className="flex items-start gap-4">
            {/* Shelter Avatar */}
            <div className="w-16 h-16 rounded-full bg-primary-100 flex-shrink-0 flex items-center justify-center text-2xl">
              {shelter.user?.avatar_url ? (
                <img
                  src={shelter.user.avatar_url}
                  alt={shelter.shelter_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                '🏠'
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900 truncate">
                  {shelter.shelter_name}
                </h3>
                {shelter.user?.is_verified && (
                  <span className="text-blue-500 flex-shrink-0">✓</span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-3">
                📍 {shelter.city}, {shelter.state}
              </p>

              <div className="flex gap-4 text-sm">
                <div>
                  <div className="font-bold text-primary-600">
                    {shelter.availablePets}
                  </div>
                  <div className="text-gray-500 text-xs">Available Pets</div>
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
