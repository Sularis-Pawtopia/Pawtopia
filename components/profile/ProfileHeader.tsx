'use client';

export function ProfileHeader({ profile }: { profile: any }) {
  const isShelter = profile.role === 'shelter';

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg mb-6"></div>

        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="relative -mt-20">
            <div className="w-32 h-32 rounded-full bg-white p-2 shadow-lg">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-4xl">
                  {isShelter ? '🏠' : '👤'}
                </div>
              )}
            </div>
            {profile.is_verified && (
              <div className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-2">
                ✓
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isShelter && profile.profile?.shelter_name
                    ? profile.profile.shelter_name
                    : profile.full_name || profile.username}
                </h1>
                <p className="text-gray-600">@{profile.username}</p>
                
                {isShelter && profile.profile && (
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    {profile.city && profile.state && (
                      <span>📍 {profile.city}, {profile.state}</span>
                    )}
                    {profile.profile.website && (
                      <a
                        href={profile.profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:underline"
                      >
                        🌐 Website
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Follow Button */}
              <button className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition-colors font-semibold">
                Follow
              </button>
            </div>

            {/* Bio/Description */}
            {profile.profile?.description && (
              <p className="mt-4 text-gray-700 max-w-2xl">
                {profile.profile.description}
              </p>
            )}

            {/* Stats */}
            <div className="mt-6 flex gap-8">
              {isShelter ? (
                <>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">
                      {profile.profile?.stats?.totalPets || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Pets</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {profile.profile?.stats?.successfulAdoptions || 0}
                    </div>
                    <div className="text-sm text-gray-600">Successful Adoptions</div>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {profile.profile?.stats?.adoptedPets || 0}
                  </div>
                  <div className="text-sm text-gray-600">Adopted Pets</div>
                </div>
              )}
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
