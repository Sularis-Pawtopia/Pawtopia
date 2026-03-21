"use client";

import { useState, useEffect } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { notify } from '@/lib/ui/notify';
import { PageLoaderOverlay } from '@/components/ui/PageLoaderOverlay';

interface AdoptPetModalProps {
  pet: any;
  shelterProfile?: any;
  viewerRole?: string | null;
  existingRequest?: { id: string; status: string; created_at?: string } | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AdoptPetModal({ pet, shelterProfile, viewerRole, existingRequest: externalRequest, onClose, onSuccess }: AdoptPetModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);

  // Existing request state — either passed in as prop or fetched
  const [existingReq, setExistingReq] = useState<{ id: string; status: string; created_at?: string } | null>(externalRequest || null);
  const [checkingExisting, setCheckingExisting] = useState(!externalRequest && viewerRole === 'adopter');

  const mediaUrls = pet.post?.media_urls;
  const images: string[] = Array.isArray(mediaUrls) ? mediaUrls : [];
  const [currentImg, setCurrentImg] = useState(0);
  const tags = pet.post?.tags || pet.temperament || [];
  const description = pet.post?.description || '';
  const shelter = shelterProfile?.profile;

  const isAdopted = pet.status === 'adopted';
  const isViewerAdopter = viewerRole === 'adopter';
  const isViewerShelterOwner = shelterProfile?.isOwner;

  // Check if the current adopter already has a pending request for this pet
  useEffect(() => {
    if (externalRequest || !isViewerAdopter || isAdopted) {
      setCheckingExisting(false);
      return;
    }
    setCheckingExisting(true);
    callApiAction<{ id: string; status: string; created_at?: string } | null>(
      'adoption',
      'getMyAdoptionRequestForPet',
      [pet.id]
    )
      .then((res) => {
        if (res.success && res.data) {
          setExistingReq(res.data);
        }
        setCheckingExisting(false);
      })
      .catch(() => {
        setCheckingExisting(false);
      });
  }, [pet.id, externalRequest, isViewerAdopter, isAdopted]);

  const handleAdopt = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res: any = await callApiAction('adoption', 'createAdoptionRequest', [pet.id]);
      if (res.error) {
        setError(res.error);
        notify.error({ title: 'Adoption request failed', description: res.error });
      } else {
        setSuccess(true);
        notify.success({ title: 'Request submitted', description: 'Your adoption request was sent to the shelter.' });
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to apply';
      setError(message);
      notify.error({ title: 'Adoption request failed', description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!existingReq) return;
    setIsCancelling(true);
    setError('');
    try {
      const res: any = await callApiAction('adoption', 'cancelAdoptionRequest', [existingReq.id, cancelReason || undefined]);
      if (res.error) {
        setError(res.error);
        notify.error({ title: 'Cancellation failed', description: res.error });
      } else {
        setCancelSuccess(true);
        notify.success({ title: 'Request cancelled', description: 'Your adoption request was cancelled.' });
        setExistingReq(null);
        setShowCancelConfirm(false);
        setCancelReason('');
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      }
    } catch (err: any) {
      const message = err?.message || 'Failed to cancel';
      setError(message);
      notify.error({ title: 'Cancellation failed', description: message });
    } finally {
      setIsCancelling(false);
    }
  };

  const ageText = (() => {
    const parts: string[] = [];
    if (pet.age_years) parts.push(`${pet.age_years} year${pet.age_years > 1 ? 's' : ''}`);
    if (pet.age_months) parts.push(`${pet.age_months} month${pet.age_months > 1 ? 's' : ''}`);
    return parts.join(', ') || 'Unknown';
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      {(isLoading || isCancelling) && <PageLoaderOverlay label={isCancelling ? 'Cancelling request...' : 'Submitting request...'} />}
      <div
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ——— Left: Image gallery ——— */}
        <div className="md:w-[45%] flex-shrink-0 bg-gray-100 relative p-2">
          {images.length > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images[currentImg]}
                alt={pet.name}
                className="w-full h-64 md:h-full object-cover rounded-xl"
              />
              {images.length > 1 && (
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setCurrentImg(i)}
                      className={`w-2 h-2 rounded-full transition-colors ${i === currentImg ? 'bg-white' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-64 md:h-full text-gray-300">
              <svg className="w-20 h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
              </svg>
            </div>
          )}
        </div>

        {/* ——— Right: Details ——— */}
        <div className="md:w-[55%] flex flex-col overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 md:relative md:top-0 md:right-0 md:self-end md:mt-3 md:mr-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="px-6 pb-6 pt-2 flex flex-col gap-4 flex-1">
            {/* Status badge */}
            <span className={`self-start px-3 py-1 rounded-full text-xs font-semibold ${
              isAdopted
                ? 'bg-blue-100 text-blue-700'
                : 'bg-amber-100 text-amber-700'
            }`}>
              {isAdopted ? 'Found a Home' : 'Looking for a Home'}
            </span>

            {/* Name & description */}
            <div>
              <h2 className="text-xl font-bold text-gray-900">{pet.name}</h2>
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>

            {/* Quick info grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <InfoChip label="Species" value={pet.species} />
              <InfoChip label="Breed" value={pet.breed || '—'} />
              <InfoChip label="Gender" value={pet.gender ? pet.gender.charAt(0).toUpperCase() + pet.gender.slice(1) : '—'} />
              <InfoChip label="Age" value={ageText} />
              <InfoChip label="Size" value={pet.size ? pet.size.charAt(0).toUpperCase() + pet.size.slice(1) : '—'} />
              <InfoChip label="Color" value={pet.color || '—'} />
              {pet.weight && <InfoChip label="Weight" value={`${pet.weight} kg`} />}
              {pet.energy_level && <InfoChip label="Energy" value={pet.energy_level.charAt(0).toUpperCase() + pet.energy_level.slice(1)} />}
            </div>

            {/* Health badges */}
            <div className="flex flex-wrap gap-2">
              <HealthBadge label="Vaccinated" value={pet.is_vaccinated} />
              <HealthBadge label="Spayed/Neutered" value={pet.is_spayed_neutered} />
              {pet.good_with_kids != null && <CompatBadge label="Kids" value={pet.good_with_kids} />}
              {pet.good_with_dogs != null && <CompatBadge label="Dogs" value={pet.good_with_dogs} />}
              {pet.good_with_cats != null && <CompatBadge label="Cats" value={pet.good_with_cats} />}
            </div>

            {/* Tags / Temperament */}
            {tags.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag: string, i: number) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Special needs */}
            {pet.special_needs && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Special Needs</p>
                <p className="text-sm text-amber-800">{pet.special_needs}</p>
              </div>
            )}

            {/* Medical History */}
            {pet.medical_history && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Medical History</p>
                <p className="text-sm text-blue-800">{pet.medical_history}</p>
              </div>
            )}

            {/* Shelter info card */}
            {shelter && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-800">Shelter Information</p>
                  <a
                    href={`/profile/${shelterProfile.id}`}
                    className="text-gray-400 hover:text-gray-600"
                    title="View shelter profile"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                </div>
                <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Shelter Name:</p>
                    <p className="font-medium text-gray-800">{shelter.shelter_name || shelterProfile.username}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Location:</p>
                    <p className="font-medium text-gray-800">{shelter.address || shelterProfile.city || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Contact:</p>
                    <p className="font-medium text-gray-800">{shelter.contact_number || shelterProfile.phone || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom action area */}
            <div className="mt-auto pt-2">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Application submitted! Your profile information has been forwarded to the shelter.
                </div>
              )}

              {cancelSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Adoption request cancelled successfully.
                </div>
              )}

              <div className="flex items-center justify-between">
                {pet.adoption_fee != null && !isAdopted && (
                  <p className="text-sm font-medium text-gray-700">
                    Adoption Fee: <span className="text-primary-700 font-bold">₱{Number(pet.adoption_fee).toLocaleString()}</span>
                  </p>
                )}

                {checkingExisting ? (
                  <span className="ml-auto px-4 py-2 text-gray-400 text-sm">Checking...</span>
                ) : isAdopted ? (
                  <span className="ml-auto px-4 py-2 bg-gray-300 text-gray-600 rounded-full text-sm font-medium cursor-not-allowed">
                    Already Adopted
                  </span>
                ) : isViewerAdopter && !isViewerShelterOwner && existingReq ? (
                  /* Existing request — show status + cancel */
                  showCancelConfirm ? (
                    <div className="ml-auto flex flex-col items-end gap-2 w-full">
                      <p className="text-sm text-gray-600 text-right">Are you sure you want to cancel this adoption request?</p>
                      <textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="Reason for cancellation (optional)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setShowCancelConfirm(false); setCancelReason(''); }}
                          disabled={isCancelling}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
                        >
                          Keep Request
                        </button>
                        <button
                          onClick={handleCancelRequest}
                          disabled={isCancelling}
                          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="ml-auto flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                          existingReq.status === 'pending'
                            ? 'bg-amber-100 text-amber-700'
                            : existingReq.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {existingReq.status === 'pending' ? 'Request Pending' : existingReq.status === 'approved' ? 'Approved' : existingReq.status}
                        </span>
                        <span className="text-xs text-gray-400">
                          {existingReq.created_at ? new Date(existingReq.created_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      {existingReq.status === 'pending' && (
                        <button
                          onClick={() => setShowCancelConfirm(true)}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-full text-sm font-medium transition-colors border border-red-200"
                        >
                          Cancel Request
                        </button>
                      )}
                    </div>
                  )
                ) : isViewerAdopter && !isViewerShelterOwner ? (
                  showConfirm ? (
                    <div className="ml-auto flex flex-col items-end gap-2">
                      <p className="text-sm text-gray-600 text-right">
                        Your adopter profile information will be shared with this shelter. Continue?
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowConfirm(false)}
                          disabled={isLoading}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleAdopt}
                          disabled={isLoading || success}
                          className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm font-semibold transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {isLoading ? 'Submitting...' : 'Confirm Adoption Request'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowConfirm(true)}
                      className="ml-auto px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-full text-sm font-semibold transition-colors shadow-sm"
                    >
                      Take Me Home
                    </button>
                  )
                ) : (
                  /* Not an adopter — don't show button */
                  !isAdopted && (
                    <span className="ml-auto text-sm text-gray-400 italic">
                      Sign in as an adopter to apply
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Helper sub-components ---- */

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}

function HealthBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
      value ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {value ? (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      )}
      {label}
    </span>
  );
}

function CompatBadge({ label, value }: { label: string; value: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
      value ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-500'
    }`}>
      {value ? '✓' : '✗'} Good with {label}
    </span>
  );
}
