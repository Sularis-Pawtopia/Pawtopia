'use client';

import { useState, useEffect } from 'react';
import { AdopterProfileInfo } from './AdopterProfileInfo';
import { ShelterProfileInfo } from './ShelterProfileInfo';
import { AdopterEditForm } from './AdopterEditForm';
import { ShelterEditForm } from './ShelterEditForm';
import AdoptPetModal from './AdoptPetModal';
import { PetDetailModal } from '@/components/pets/PetDetailModal';
import { callApiAction } from '@/lib/api/action-client';
import { createClient } from '@/lib/supabase/client';

interface ProfileContentProps {
  profile: any;
}

export function ProfileContent({ profile }: ProfileContentProps) {
  const isShelter = profile.role === 'shelter';
  const isAdopter = profile.role === 'adopter';
  const isPersonalPetRole = ['adopter', 'volunteer', 'regular_user'].includes(profile.role);
  const isOwner = profile.isOwner;
  const [activeTab, setActiveTab] = useState('about');
  const [isEditing, setIsEditing] = useState(false);

  // Shelter-specific data
  const [adoptablePets, setAdoptablePets] = useState<any[]>([]);
  const [adoptedPets, setAdoptedPets] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingPets, setLoadingPets] = useState(false);
  const [loadingAdopted, setLoadingAdopted] = useState(false);
  const [loadingEvents, setLoadingEvents] = useState(false);

  // Search & filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState<string | undefined>(undefined);
  const [sizeFilter, setSizeFilter] = useState<string | undefined>(undefined);
  const [minAge, setMinAge] = useState<number | undefined>(undefined);
  const [maxAge, setMaxAge] = useState<number | undefined>(undefined);
  const [isSpayed, setIsSpayed] = useState<boolean | undefined>(undefined);
  const [isVaccinated, setIsVaccinated] = useState<boolean | undefined>(undefined);

  const [selectedPet, setSelectedPet] = useState<any | null>(null);

  // Adopter-specific data
  const [adopterPets, setAdopterPets] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loadingAdopterPets, setLoadingAdopterPets] = useState(false);
  const [loadingPending, setLoadingPending] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [editingPersonalPet, setEditingPersonalPet] = useState<any | null>(null);
  const [isDeletingPersonalPet, setIsDeletingPersonalPet] = useState(false);

  // Selected pending request for modal
  const [selectedPendingReq, setSelectedPendingReq] = useState<any | null>(null);

  // Load data when tab changes (shelter only)
  useEffect(() => {
    if (!isShelter) return;

    if (activeTab === 'adoptables' && adoptablePets.length === 0) {
      setLoadingPets(true);
      callApiAction<any[]>('profile', 'getShelterPetsByStatus', [profile.id, 'available', {
        gender: genderFilter,
        size: sizeFilter,
        minAgeYears: minAge,
        maxAgeYears: maxAge,
        is_spayed_neutered: isSpayed,
        is_vaccinated: isVaccinated,
        search,
      }]).then((res) => {
        if (res.success) setAdoptablePets(res.data || []);
        setLoadingPets(false);
      });
    }

    if (activeTab === 'adopted' && adoptedPets.length === 0) {
      setLoadingAdopted(true);
      callApiAction<any[]>('profile', 'getShelterPetsByStatus', [profile.id, 'adopted', { search }]).then((res) => {
        if (res.success) setAdoptedPets(res.data || []);
        setLoadingAdopted(false);
      });
    }

    if (activeTab === 'events' && events.length === 0) {
      setLoadingEvents(true);
      callApiAction<any[]>('profile', 'getShelterEvents', [profile.id]).then((res) => {
        if (res.success) setEvents(res.data || []);
        setLoadingEvents(false);
      });
    }
  }, [activeTab, isShelter, profile.id, adoptablePets.length, adoptedPets.length, events.length]);

  // Refresh adoptables when filters/search change while on adoptables tab
  useEffect(() => {
    if (!isShelter) return;
    if (activeTab !== 'adoptables') return;
    setLoadingPets(true);
    callApiAction<any[]>('profile', 'getShelterPetsByStatus', [profile.id, 'available', {
      gender: genderFilter,
      size: sizeFilter,
      minAgeYears: minAge,
      maxAgeYears: maxAge,
      is_spayed_neutered: isSpayed,
      is_vaccinated: isVaccinated,
      search,
    }]).then((res) => {
      if (res.success) setAdoptablePets(res.data || []);
      setLoadingPets(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genderFilter, sizeFilter, minAge, maxAge, isSpayed, isVaccinated, search]);

  // Load data when tab changes (adopter)
  useEffect(() => {
    if (!isPersonalPetRole) return;

    if (activeTab === 'my-pets' && adopterPets.length === 0) {
      setLoadingAdopterPets(true);
      callApiAction<any[]>('pets', 'getAdopterAllPets', [profile.id]).then((res) => {
        setAdopterPets(res.data || []);
        setLoadingAdopterPets(false);
      });
    }

    if (isAdopter && activeTab === 'pending' && pendingRequests.length === 0) {
      setLoadingPending(true);
      callApiAction<any[]>('adoption', 'getUserAdoptionRequests', [profile.id]).then((res) => {
        setPendingRequests(res.data || []);
        setLoadingPending(false);
      });
    }
  }, [activeTab, isAdopter, isPersonalPetRole, profile.id, adopterPets.length, pendingRequests.length]);

  const shelterTabs = [
    { id: 'about', label: 'About', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )},
    { id: 'adoptables', label: 'Adoptables', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    )},
    { id: 'adopted', label: 'Adopted', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
    { id: 'events', label: 'Events', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    )},
  ];

  const personalPetTabs = [
    { id: 'about', label: 'About', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    )},
    { id: 'my-pets', label: 'My Pets', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    )},
  ];

  const adopterTabs = [
    ...personalPetTabs,
    { id: 'pending', label: 'Pending Adoptions', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )},
  ];

  const tabs = isShelter ? shelterTabs : isAdopter ? adopterTabs : personalPetTabs;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setIsEditing(false); }}
              className={`flex items-center gap-1.5 pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'about' && (
        <div>
          {isOwner && !isEditing && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                </svg>
                Edit Information
              </button>
            </div>
          )}

          {isEditing && isOwner ? (
            isShelter ? (
              <ShelterEditForm profile={profile} onCancel={() => setIsEditing(false)} onSaved={() => setIsEditing(false)} />
            ) : isAdopter ? (
              <AdopterEditForm profile={profile} onCancel={() => setIsEditing(false)} onSaved={() => setIsEditing(false)} />
            ) : (
              <div className="text-center py-8 text-gray-500">Edit not available for this role.</div>
            )
          ) : (
            isShelter ? (
              <ShelterProfileInfo profile={profile} />
            ) : isAdopter ? (
              <AdopterProfileInfo profile={profile} />
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
                No profile information to display.
              </div>
            )
          )}
        </div>
      )}

      {/* Search & Filters (Shelter Adoptables) */}
      {isShelter && activeTab === 'adoptables' && (
        <div className="mb-4 flex flex-col md:flex-row md:items-center gap-3">
          <div className="flex-1">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, breed or species"
              className="w-full border rounded px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select value={genderFilter ?? ''} onChange={(e) => setGenderFilter(e.target.value || undefined)} className="border rounded px-2 py-2 text-sm">
              <option value="">Any gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select value={sizeFilter ?? ''} onChange={(e) => setSizeFilter(e.target.value || undefined)} className="border rounded px-2 py-2 text-sm">
              <option value="">Any size</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
            <input type="number" placeholder="Min age (yrs)" value={minAge ?? ''} onChange={(e) => setMinAge(e.target.value ? Number(e.target.value) : undefined)} className="w-28 border rounded px-2 py-2 text-sm" />
            <input type="number" placeholder="Max age (yrs)" value={maxAge ?? ''} onChange={(e) => setMaxAge(e.target.value ? Number(e.target.value) : undefined)} className="w-28 border rounded px-2 py-2 text-sm" />
            <select value={isSpayed === undefined ? '' : isSpayed ? 'yes' : 'no'} onChange={(e) => setIsSpayed(e.target.value === '' ? undefined : e.target.value === 'yes')} className="border rounded px-2 py-2 text-sm">
              <option value="">Neuter/Spay</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
            <select value={isVaccinated === undefined ? '' : isVaccinated ? 'yes' : 'no'} onChange={(e) => setIsVaccinated(e.target.value === '' ? undefined : e.target.value === 'yes')} className="border rounded px-2 py-2 text-sm">
              <option value="">Vaccinated</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>
      )}

      {/* Adoptable Pets Tab (Shelter) */}
      {activeTab === 'adoptables' && isShelter && (
        <div>
          {loadingPets ? (
            <LoadingGrid />
          ) : adoptablePets.length === 0 ? (
            <EmptyState icon="🐾" message="No adoptable pets listed yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adoptablePets.map((pet) => (
                <PetCard key={pet.id} pet={pet} status="available" onClick={() => setSelectedPet(pet)} />
              ))}
            </div>
          )}
          {selectedPet && (
            <AdoptPetModal
              pet={selectedPet}
              shelterProfile={profile}
              viewerRole={profile.viewerRole}
              onClose={() => setSelectedPet(null)}
              onSuccess={() => {
                setAdoptablePets((prev) => prev.filter((p) => p.id !== selectedPet.id));
              }}
            />
          )}
        </div>
      )}

      {/* Adopted Pets Tab (Shelter) */}
      {activeTab === 'adopted' && isShelter && (
        <div>
          {loadingAdopted ? (
            <LoadingGrid />
          ) : adoptedPets.length === 0 ? (
            <EmptyState icon="🏡" message="No successfully adopted pets yet." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {adoptedPets.map((pet) => (
                  <PetCard key={pet.id} pet={pet} status="adopted" onClick={() => setSelectedPet(pet)} />
                ))}
            </div>
          )}
          {selectedPet && (
            <AdoptPetModal
              pet={selectedPet}
              shelterProfile={profile}
              viewerRole={profile.viewerRole}
              onClose={() => setSelectedPet(null)}
            />
          )}
        </div>
      )}

      {/* Events Tab (Shelter) */}
      {activeTab === 'events' && isShelter && (
        <div>
          {loadingEvents ? (
            <LoadingGrid />
          ) : events.length === 0 ? (
            <EmptyState icon="📅" message="No events created yet." />
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Pets Tab (Adopter) */}
      {activeTab === 'my-pets' && isPersonalPetRole && (
        <div>
          {isOwner && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowAddPet(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm font-medium transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Add Pet
              </button>
            </div>
          )}

          {showAddPet && isOwner && (
            <AddAdopterPetForm
              onClose={() => setShowAddPet(false)}
              onSaved={() => {
                setShowAddPet(false);
                setAdopterPets([]);
                setLoadingAdopterPets(true);
                callApiAction<any[]>('pets', 'getAdopterAllPets', [profile.id]).then((res) => {
                  setAdopterPets(res.data || []);
                  setLoadingAdopterPets(false);
                });
              }}
            />
          )}

          {loadingAdopterPets ? (
            <LoadingGrid />
          ) : adopterPets.length === 0 ? (
            <EmptyState icon="🐾" message={isOwner ? "You haven't added any pets yet. Add your furry friends!" : "No pets to display."} />
          ) : (
            <>
              {/* Personal pets section */}
              {adopterPets.filter((p) => p._source === 'personal').length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">My Pets</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adopterPets.filter((p) => p._source === 'personal').map((pet) => (
                      <AdopterPetCard key={pet.id} pet={pet} onClick={() => setSelectedPet(pet)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Adopted pets section */}
              {adopterPets.filter((p) => p._source === 'adopted').length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Adopted Pets</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {adopterPets.filter((p) => p._source === 'adopted').map((pet) => (
                      <AdopterPetCard key={pet.id} pet={pet} onClick={() => setSelectedPet(pet)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {selectedPet && selectedPet._source !== 'personal' && (
            <AdoptPetModal
              pet={selectedPet}
              viewerRole={profile.viewerRole}
              onClose={() => setSelectedPet(null)}
            />
          )}

          {selectedPet && selectedPet._source === 'personal' && (
            <PetDetailModal
              pet={selectedPet}
              userRole={profile.viewerRole || profile.role}
              showAdoptSection={false}
              onEdit={() => setEditingPersonalPet(selectedPet)}
              onChangePicture={() => setEditingPersonalPet(selectedPet)}
              onClose={() => setSelectedPet(null)}
              actions={isOwner ? [
                {
                  label: 'View Post',
                  tone: 'secondary',
                  onClick: () => {
                    window.location.href = `/pets/${selectedPet.id}`;
                  },
                },
                {
                  label: isDeletingPersonalPet ? 'Deleting...' : 'Delete Pet',
                  tone: 'danger',
                  onClick: async () => {
                    if (isDeletingPersonalPet) return;
                    if (!confirm('Delete this pet? This cannot be undone.')) return;
                    setIsDeletingPersonalPet(true);
                    const result = await callApiAction<any>('pets', 'deleteAdopterPet', [selectedPet.id]);
                    setIsDeletingPersonalPet(false);
                    if (!result.success || result.error) return;
                    setSelectedPet(null);
                    setAdopterPets((prev) => prev.filter((pet) => pet.id !== selectedPet.id));
                  },
                },
              ] : []}
            />
          )}

          {editingPersonalPet && (
            <EditAdopterPetForm
              pet={editingPersonalPet}
              onClose={() => setEditingPersonalPet(null)}
              onSaved={(updated) => {
                setEditingPersonalPet(null);
                setSelectedPet(updated);
                setAdopterPets((prev) => prev.map((pet) => (pet.id === updated.id ? { ...pet, ...updated, _source: 'personal' } : pet)));
              }}
            />
          )}
        </div>
      )}

      {/* Pending Adoptions Tab (Adopter, owner only) */}
      {activeTab === 'pending' && isAdopter && (
        <div>
          {loadingPending ? (
            <LoadingGrid />
          ) : pendingRequests.length === 0 ? (
            <EmptyState icon="📋" message="No adoption requests yet." />
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((req: any) => (
                <AdoptionRequestCard
                  key={req.id}
                  request={req}
                  onClick={() => setSelectedPendingReq(req)}
                />
              ))}
            </div>
          )}

          {selectedPendingReq && selectedPendingReq.pet && (
            <AdoptPetModal
              pet={selectedPendingReq.pet}
              shelterProfile={selectedPendingReq.pet.shelter ? {
                id: selectedPendingReq.pet.shelter.id,
                username: selectedPendingReq.pet.shelter.username,
                phone: selectedPendingReq.pet.shelter.phone,
                profile: selectedPendingReq.pet.shelter.shelter_profile?.[0] || selectedPendingReq.pet.shelter.shelter_profile || null,
              } : undefined}
              viewerRole={profile.viewerRole}
              existingRequest={{ id: selectedPendingReq.id, status: selectedPendingReq.status, created_at: selectedPendingReq.created_at }}
              onClose={() => setSelectedPendingReq(null)}
              onSuccess={() => {
                // Refresh the pending requests list
                setPendingRequests([]);
                setLoadingPending(true);
                callApiAction<any[]>('adoption', 'getUserAdoptionRequests', [profile.id]).then((res) => {
                  setPendingRequests(res.data || []);
                  setLoadingPending(false);
                });
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function PetCard({ pet, status, onClick }: { pet: any; status: 'available' | 'adopted'; onClick?: () => void }) {
  const mediaUrls = pet.post?.media_urls;
  const imageUrl = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : null;

  return (
    <button onClick={onClick} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow text-left w-full">
      {/* Pet Image */}
      <div className="h-48 bg-gray-100 relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        {/* Status badge */}
        <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
          status === 'available'
            ? 'bg-green-100 text-green-700'
            : 'bg-blue-100 text-blue-700'
        }`}>
          {status === 'available' ? 'Adoptable' : 'Adopted'}
        </div>
      </div>

      {/* Pet Info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-lg">{pet.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {pet.breed || pet.species}{pet.gender ? ` · ${pet.gender}` : ''}
        </p>

        <div className="flex flex-wrap gap-2 mt-3">
          {pet.age_years != null && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              🎂 {pet.age_years > 0 ? `${pet.age_years}y` : ''}{pet.age_months ? `${pet.age_months}m` : ''}
            </span>
          )}
          {pet.size && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              📏 {pet.size}
            </span>
          )}
          {pet.is_vaccinated && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
              💉 Vaccinated
            </span>
          )}
          {pet.is_spayed_neutered && (
            <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 px-2 py-1 rounded-full">
              ✂️ Spayed/Neutered
            </span>
          )}
        </div>

        {pet.temperament && pet.temperament.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {pet.temperament.slice(0, 3).map((t: string, i: number) => (
              <span key={i} className="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">
                {t}
              </span>
            ))}
          </div>
        )}

        {pet.adoption_fee != null && status === 'available' && (
          <p className="mt-3 text-sm font-medium text-primary-700">
            Adoption Fee: ₱{Number(pet.adoption_fee).toLocaleString()}
          </p>
        )}
      </div>
    </button>
  );
}

function EventCard({ event }: { event: any }) {
  const mediaUrls = event.post?.media_urls;
  const imageUrl = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : null;
  const eventDate = new Date(event.event_date);
  const endDate = event.end_date ? new Date(event.end_date) : null;
  const isPast = eventDate < new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row">
        {/* Event Image or Date block */}
        {imageUrl ? (
          <div className="sm:w-48 h-40 sm:h-auto bg-gray-100 flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={event.event_name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="sm:w-48 h-32 sm:h-auto bg-gradient-to-br from-primary-100 to-primary-200 flex-shrink-0 flex flex-col items-center justify-center p-4">
            <span className="text-3xl font-bold text-primary-700">{eventDate.getDate()}</span>
            <span className="text-sm font-medium text-primary-600 uppercase">
              {eventDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
          </div>
        )}

        {/* Event Details */}
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{event.event_name}</h3>
              {event.event_type && (
                <span className="inline-block text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full mt-1">
                  {event.event_type}
                </span>
              )}
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${
              isPast ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-700'
            }`}>
              {isPast ? 'Past' : 'Upcoming'}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>
                {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                {' at '}
                {eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {endDate && (
                  <> — {endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span>{event.location}</span>
            </div>
            {event.capacity && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <span>Capacity: {event.capacity}</span>
              </div>
            )}
          </div>

          {event.post?.description && (
            <p className="mt-2 text-sm text-gray-500 line-clamp-2">{event.post.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
      <div className="text-5xl mb-3">{icon}</div>
      <p>{message}</p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdopterPetCard({ pet, onClick }: { pet: any; onClick?: () => void }) {
  const mediaUrls = pet.post?.media_urls;
  const imageUrl = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : null;
  const isAdopted = pet._source === 'adopted';

  return (
    <button onClick={onClick} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow text-left w-full">
      <div className="h-48 bg-gray-100 relative">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt={pet.name} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-300">
            <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
            </svg>
          </div>
        )}
        <div className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-semibold ${
          isAdopted ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
        }`}>
          {isAdopted ? 'Adopted' : 'My Pet'}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-lg">{pet.name}</h3>
        <p className="text-sm text-gray-500 mt-0.5">
          {pet.breed || pet.species}{pet.gender ? ` · ${pet.gender}` : ''}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          {pet.age_years != null && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              🎂 {pet.age_years > 0 ? `${pet.age_years}y` : ''}{pet.age_months ? `${pet.age_months}m` : ''}
            </span>
          )}
          {pet.size && (
            <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              📏 {pet.size}
            </span>
          )}
          {pet.is_vaccinated && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">
              💉 Vaccinated
            </span>
          )}
        </div>
        {isAdopted && pet._adoption?.shelter && (
          <p className="mt-2 text-xs text-gray-400">
            Adopted from <span className="font-medium text-gray-600">{pet._adoption.shelter.username}</span>
            {pet._adoption.adoption_date && (
              <> on {new Date(pet._adoption.adoption_date).toLocaleDateString()}</>
            )}
          </p>
        )}
      </div>
    </button>
  );
}

function AdoptionRequestCard({ request, onClick }: { request: any; onClick?: () => void }) {
  const pet = request.pet;
  const mediaUrls = pet?.post?.media_urls;
  const imageUrl = Array.isArray(mediaUrls) && mediaUrls.length > 0 ? mediaUrls[0] : null;
  const shelter = pet?.shelter;

  const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending Review' },
    approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Approved' },
    rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Declined' },
    completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
  };
  const st = statusConfig[request.status] || statusConfig.pending;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow w-full text-left cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Pet image */}
        <div className="sm:w-40 h-36 sm:h-auto bg-gray-100 flex-shrink-0">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={pet?.name} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-300">
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
        </div>

        {/* Request details */}
        <div className="p-4 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-800 text-lg">{pet?.name || 'Unknown Pet'}</h3>
              <p className="text-sm text-gray-500">
                {pet?.breed || pet?.species}{pet?.gender ? ` · ${pet.gender}` : ''}
              </p>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${st.bg} ${st.text}`}>
              {st.label}
            </span>
          </div>

          <div className="mt-3 space-y-1.5 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              <span>Applied on {new Date(request.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {shelter && (
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                </svg>
                <span>
                  <a href={`/profile/${shelter.id}`} className="text-primary-600 hover:underline">
                    {shelter.username}
                  </a>
                </span>
              </div>
            )}
          </div>

          {request.rejection_reason && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
              <span className="font-medium">Reason:</span> {request.rejection_reason}
            </div>
          )}

          {request.notes && (
            <div className="mt-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
              <span className="font-medium">Note:</span> {request.notes}
            </div>
          )}

          <p className="mt-3 text-xs text-primary-500 font-medium">Click to view details &rarr;</p>
        </div>
      </div>
    </button>
  );
}

function AddAdopterPetForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const addImages = (files: File[]) => {
    if (!files.length) return;

    setError('');

    if (images.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    const invalidType = files.find((file) => !file.type.startsWith('image/'));
    if (invalidType) {
      setError('Only image files are allowed.');
      return;
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized) {
      setError('Each image must be 5MB or smaller.');
      return;
    }

    setImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews((prev) => [...prev, (reader.result as string) || '']);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    addImages(files);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = Array.from(event.dataTransfer.files || []);
    addImages(files);
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (): Promise<string[]> => {
    if (images.length === 0) return [];

    setUploadingImages(true);
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const uploadedUrls: string[] = [];

      for (const image of images) {
        const safeName = image.name.replace(/\s+/g, '-').toLowerCase();
        const fileName = `${user.id}/personal-pets/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;

        const { data, error: uploadError } = await supabase.storage
          .from('pet-images')
          .upload(fileName, image);

        if (uploadError || !data) {
          throw new Error(uploadError?.message || 'Failed to upload pet image');
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('pet-images').getPublicUrl(data.path);

        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get('name') as string,
      species: formData.get('species') as string,
      breed: (formData.get('breed') as string) || undefined,
      age_years: formData.get('age_years') ? Number(formData.get('age_years')) : undefined,
      age_months: formData.get('age_months') ? Number(formData.get('age_months')) : undefined,
      gender: (formData.get('gender') as 'male' | 'female' | 'unknown') || 'unknown',
      size: (formData.get('size') as 'small' | 'medium' | 'large' | 'extra_large') || 'medium',
      color: (formData.get('color') as string) || undefined,
      weight: formData.get('weight') ? Number(formData.get('weight')) : undefined,
      is_vaccinated: formData.get('is_vaccinated') === 'on',
      is_spayed_neutered: formData.get('is_spayed_neutered') === 'on',
      medical_history: (formData.get('medical_history') as string) || undefined,
      temperament: (formData.get('temperament') as string)?.split(',').map(t => t.trim()).filter(Boolean) || ['friendly'],
      good_with_kids: formData.get('good_with_kids') === 'on' ? true : undefined,
      good_with_dogs: formData.get('good_with_dogs') === 'on' ? true : undefined,
      good_with_cats: formData.get('good_with_cats') === 'on' ? true : undefined,
      energy_level: (formData.get('energy_level') as 'low' | 'medium' | 'high') || 'medium',
      description: (formData.get('description') as string) || `Meet ${formData.get('name')}!`,
      tags: [],
    };

    try {
      const mediaUrls = await uploadImages();
      const { createAdopterPet } = await import('@/lib/actions/pet.actions');
      const res = await createAdopterPet(data, mediaUrls);

      if (res.error) {
        setError(res.error);
        setIsSubmitting(false);
      } else {
        onSaved();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to upload photos');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Add a New Pet</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input name="name" required className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
            <input name="species" required placeholder="Dog, Cat, etc." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
            <input name="breed" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input name="color" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select name="gender" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <select name="size" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
              <option value="extra_large">Extra Large</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
            <input name="age_years" type="number" min="0" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Age (months)</label>
            <input name="age_months" type="number" min="0" max="11" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
            <input name="weight" type="number" min="0" step="0.1" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Energy Level</label>
            <select name="energy_level" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Temperament (comma-separated)</label>
          <input name="temperament" placeholder="friendly, playful, calm" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows={3} placeholder="Tell us about your pet..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-300 focus:border-primary-400 outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Photos (optional, up to 5, max 5MB each)</label>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors ${
              isDragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 bg-gray-50'
            }`}
          >
            <p className="text-sm text-gray-600 mb-2">Drag and drop pet photos here</p>
            <label className="inline-flex cursor-pointer items-center rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
              Choose files
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
          </div>
          {imagePreviews.length > 0 && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt={`Pet preview ${index + 1}`} className="w-full h-20 object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs"
                    aria-label="Remove image"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="is_vaccinated" className="rounded border-gray-300 text-primary-500 focus:ring-primary-300" />
            Vaccinated
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="is_spayed_neutered" className="rounded border-gray-300 text-primary-500 focus:ring-primary-300" />
            Spayed/Neutered
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="good_with_kids" className="rounded border-gray-300 text-primary-500 focus:ring-primary-300" />
            Good with kids
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="good_with_dogs" className="rounded border-gray-300 text-primary-500 focus:ring-primary-300" />
            Good with dogs
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="good_with_cats" className="rounded border-gray-300 text-primary-500 focus:ring-primary-300" />
            Good with cats
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploadingImages}
            className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            {uploadingImages ? 'Uploading photos...' : isSubmitting ? 'Adding...' : 'Add Pet'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditAdopterPetForm({
  pet,
  onClose,
  onSaved,
}: {
  pet: any;
  onClose: () => void;
  onSaved: (pet: any) => void;
}) {
  const MAX_IMAGES = 5;
  const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [error, setError] = useState('');
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>(Array.isArray(pet?.post?.media_urls) ? pet.post.media_urls : []);

  const addImages = (files: File[]) => {
    if (!files.length) return;
    setError('');

    if (existingImageUrls.length + newImages.length + files.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed.`);
      return;
    }

    const invalidType = files.find((file) => !file.type.startsWith('image/'));
    if (invalidType) {
      setError('Only image files are allowed.');
      return;
    }

    const oversized = files.find((file) => file.size > MAX_IMAGE_SIZE_BYTES);
    if (oversized) {
      setError('Each image must be 5MB or smaller.');
      return;
    }

    setNewImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setNewImagePreviews((prev) => [...prev, (reader.result as string) || '']);
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addImages(Array.from(event.target.files || []));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    addImages(Array.from(event.dataTransfer.files || []));
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async () => {
    if (!newImages.length) return [] as string[];

    setUploadingImages(true);
    const supabase = createClient();
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      const uploadedUrls: string[] = [];
      for (const image of newImages) {
        const safeName = image.name.replace(/\s+/g, '-').toLowerCase();
        const fileName = `${user.id}/personal-pets/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`;
        const { data, error: uploadError } = await supabase.storage.from('pet-images').upload(fileName, image);
        if (uploadError || !data) {
          throw new Error(uploadError?.message || 'Failed to upload pet image');
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from('pet-images').getPublicUrl(data.path);
        uploadedUrls.push(publicUrl);
      }

      return uploadedUrls;
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get('name') || '').trim(),
      species: String(formData.get('species') || '').trim(),
      breed: String(formData.get('breed') || '').trim() || undefined,
      age_years: formData.get('age_years') ? Number(formData.get('age_years')) : pet.age_years ?? undefined,
      age_months: formData.get('age_months') ? Number(formData.get('age_months')) : pet.age_months ?? undefined,
      gender: (String(formData.get('gender') || 'unknown') as 'male' | 'female' | 'unknown'),
      size: (String(formData.get('size') || 'medium') as 'small' | 'medium' | 'large' | 'extra_large'),
      color: String(formData.get('color') || '').trim() || undefined,
      weight: formData.get('weight') ? Number(formData.get('weight')) : pet.weight ?? undefined,
      is_vaccinated: formData.get('is_vaccinated') === 'on',
      is_spayed_neutered: formData.get('is_spayed_neutered') === 'on',
      medical_history: String(formData.get('medical_history') || '').trim() || undefined,
      temperament: String(formData.get('temperament') || 'friendly').split(',').map((value) => value.trim()).filter(Boolean),
      good_with_kids: formData.get('good_with_kids') === 'on' ? true : undefined,
      good_with_dogs: formData.get('good_with_dogs') === 'on' ? true : undefined,
      good_with_cats: formData.get('good_with_cats') === 'on' ? true : undefined,
      energy_level: (String(formData.get('energy_level') || pet.energy_level || 'medium') as 'low' | 'medium' | 'high'),
      special_needs: String(formData.get('special_needs') || '').trim() || undefined,
      description: String(formData.get('description') || `Meet ${String(formData.get('name') || '').trim()}!`).trim(),
      tags: [] as string[],
    };

    if (!payload.name || !payload.species) {
      setError('Name and species are required.');
      setIsSubmitting(false);
      return;
    }

    if (!payload.temperament.length) {
      payload.temperament = ['friendly'];
    }

    try {
      const uploaded = await uploadNewImages();
      const mediaUrls = [...existingImageUrls, ...uploaded];
      const result = await callApiAction<any>('pets', 'updateAdopterPet', [pet.id, payload, mediaUrls]);
      if (!result.success || result.error || !result.data) {
        setError(result.error || 'Failed to update pet');
        setIsSubmitting(false);
        return;
      }
      onSaved({ ...result.data, _source: 'personal' });
    } catch (err: any) {
      setError(err?.message || 'Failed to update pet');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 p-4 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Edit Pet</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">x</button>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">{error}</div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input name="name" required defaultValue={pet.name} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Species *</label>
              <input name="species" required defaultValue={pet.species} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
              <input name="breed" defaultValue={pet.breed || ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
              <input name="color" defaultValue={pet.color || ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select name="gender" defaultValue={pet.gender || 'unknown'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
              <select name="size" defaultValue={pet.size || 'medium'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra_large">Extra Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (years)</label>
              <input name="age_years" type="number" min="0" defaultValue={pet.age_years ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age (months)</label>
              <input name="age_months" type="number" min="0" max="11" defaultValue={pet.age_months ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input name="weight" type="number" min="0" step="0.1" defaultValue={pet.weight ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Energy Level</label>
              <select name="energy_level" defaultValue={pet.energy_level || 'medium'} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" defaultValue={pet.post?.description || ''} rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Temperament (comma-separated)</label>
            <input name="temperament" defaultValue={Array.isArray(pet.temperament) ? pet.temperament.join(', ') : ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
            <textarea name="medical_history" defaultValue={pet.medical_history || ''} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Needs</label>
            <textarea name="special_needs" defaultValue={pet.special_needs || ''} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="is_vaccinated" defaultChecked={Boolean(pet.is_vaccinated)} /> Vaccinated
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="is_spayed_neutered" defaultChecked={Boolean(pet.is_spayed_neutered)} /> Spayed/Neutered
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="good_with_kids" defaultChecked={Boolean(pet.good_with_kids)} /> Good with kids
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="good_with_dogs" defaultChecked={Boolean(pet.good_with_dogs)} /> Good with dogs
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="good_with_cats" defaultChecked={Boolean(pet.good_with_cats)} /> Good with cats
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Manage Photos</label>
            {existingImageUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-3">
                {existingImageUrls.map((url, index) => (
                  <div key={url + index} className="relative rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Existing pet ${index + 1}`} className="w-full h-20 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`rounded-lg border-2 border-dashed px-4 py-4 text-center transition-colors ${
                isDragOver ? 'border-primary-400 bg-primary-50' : 'border-gray-300 bg-gray-50'
              }`}
            >
              <p className="text-sm text-gray-600 mb-2">Drag and drop new pet photos here</p>
              <label className="inline-flex cursor-pointer items-center rounded-full bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Choose files
                <input type="file" accept="image/*" multiple onChange={handleImageChange} className="sr-only" />
              </label>
            </div>

            {newImagePreviews.length > 0 ? (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {newImagePreviews.map((url, index) => (
                  <div key={url + index} className="relative rounded-lg overflow-hidden border border-gray-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`New pet ${index + 1}`} className="w-full h-20 object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white text-xs"
                    >
                      x
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadingImages}
              className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm font-semibold disabled:opacity-50"
            >
              {uploadingImages ? 'Uploading photos...' : isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
