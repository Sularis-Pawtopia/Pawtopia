'use client';

import { useState } from 'react';
import { ProfilePhotoEditor } from './ProfilePhotoEditor';

interface ProfileHeaderProps {
  profile: any;
}

export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const isShelter = profile.role === 'shelter';
  const isAdopter = profile.role === 'adopter';
  const isOwner = profile.isOwner;
  const p = profile.profile; // role-specific profile data

  const displayName = isShelter && p?.shelter_name
    ? p.shelter_name
    : isAdopter && p?.first_name
      ? `${p.first_name} ${p.last_name}`
      : profile.full_name || profile.username;

  return (
    <div className="bg-white border-b">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Cover Photo */}
        <div className="h-44 bg-gradient-to-r from-primary-400 to-primary-600 rounded-xl mb-6 relative overflow-hidden group">
          {profile.cover_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={profile.cover_photo_url} 
              alt="Cover photo" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-20">
              <svg className="w-full h-full" viewBox="0 0 400 200" fill="none">
                <circle cx="50" cy="100" r="80" fill="white" />
                <circle cx="350" cy="50" r="60" fill="white" />
                <circle cx="200" cy="180" r="40" fill="white" />
              </svg>
            </div>
          )}
          {isOwner && (
            <button
              onClick={() => setShowPhotoEditor(true)}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-opacity-70 transition-all opacity-0 group-hover:opacity-100"
            >
              📷 Edit Photos
            </button>
          )}
        </div>

        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="relative -mt-16 flex-shrink-0 group">
            <div className="w-28 h-28 rounded-full bg-white p-1.5 shadow-lg">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-4xl">
                  {isShelter ? '🏠' : '👤'}
                </div>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => setShowPhotoEditor(true)}
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-primary-600 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                title="Edit profile photos"
              >
                📷
              </button>
            )}
            {profile.is_verified && (
              <div className="absolute bottom-1 right-1 bg-blue-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow">
                ✓
              </div>
            )}
            {!profile.is_verified && isShelter && (
              <div className="absolute bottom-1 right-1 bg-amber-400 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm shadow" title="Pending verification">
                ⏳
              </div>
            )}
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
                <p className="text-gray-500 text-sm">@{profile.username}</p>

                {/* Role Badge */}
                {isShelter && (
                  <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    profile.is_verified
                      ? 'bg-green-100 text-green-800 border border-green-200'
                      : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    {profile.is_verified ? '✅ Verified Shelter' : '⏳ Pending Verification'}
                  </span>
                )}
                {isAdopter && (
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-800 border border-primary-200">
                    🐾 Adopter
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 flex-shrink-0">
                {isOwner ? (
                  <a
                    href="#edit"
                    className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                  >
                    Edit Profile
                  </a>
                ) : (
                  <button className="bg-primary-500 text-white px-5 py-2 rounded-lg hover:bg-primary-600 transition-colors font-semibold text-sm">
                    Follow
                  </button>
                )}
              </div>
            </div>

            {/* Location & Links */}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              {profile.address && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  {profile.address}{profile.city ? `, ${profile.city}` : ''}
                </span>
              )}
              {isShelter && p?.website && (
                <a href={p.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582" />
                  </svg>
                  Website
                </a>
              )}
              {isAdopter && p?.social_media_link && (
                <a href={p.social_media_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-primary-600 hover:underline">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.87-3.566a4.5 4.5 0 00-1.242-7.244l4.5-4.5a4.5 4.5 0 016.364 6.364l-1.757 1.757" />
                  </svg>
                  Social Media
                </a>
              )}
              {p?.email && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  {p.email}
                </span>
              )}
            </div>

            {/* Bio / Description */}
            {(profile.bio || p?.description) && (
              <p className="mt-3 text-gray-600 text-sm max-w-2xl">{profile.bio || p?.description}</p>
            )}

            {/* Stats */}
            <div className="mt-4 flex gap-6">
              {isShelter ? (
                <>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900">{p?.stats?.totalPets || 0}</div>
                    <div className="text-xs text-gray-500">Pets Listed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">{p?.stats?.successfulAdoptions || 0}</div>
                    <div className="text-xs text-gray-500">Adoptions</div>
                  </div>
                </>
              ) : isAdopter ? (
                <div className="text-center">
                  <div className="text-xl font-bold text-green-600">{p?.stats?.adoptedPets || 0}</div>
                  <div className="text-xs text-gray-500">Adopted</div>
                </div>
              ) : null}
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">0</div>
                <div className="text-xs text-gray-500">Following</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <ProfilePhotoEditor 
        profile={profile}
        isOpen={showPhotoEditor}
        onClose={() => setShowPhotoEditor(false)}
      />
    </div>
  );
}
