'use client';

import { useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { toVerificationDocumentUrl } from '@/lib/storage/verification-documents';
import { Check, X, Eye, Loader2, User, FileText, AlertTriangle, Clock } from 'lucide-react';

interface AdoptionRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  application_data: Record<string, unknown>;
  created_at: string;
  reviewed_at?: string;
  notes?: string;
  rejection_reason?: string;
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    adoption_fee?: number;
    post?: {
      media_urls?: string[];
    };
  };
  adopter: {
    id: string;
    username: string;
    email: string;
    phone?: string;
    avatar_url?: string;
    city?: string;
    state?: string;
    address?: string;
    adopter_profile?: {
      first_name?: string;
      last_name?: string;
      mi?: string;
      date_of_birth?: string;
      gender?: string;
      contact_number?: string;
      email?: string;
      occupation?: string;
      business_name?: string;
      social_media_link?: string;
      civil_status?: string;
      income_range?: string;
      household_size?: number;
      has_children?: boolean;
      has_other_pets?: boolean;
      home_type?: string;
      home_ownership?: string;
      yard_size?: string;
      pet_experience?: string;
      prompted_by?: string[];
      first_time_adopter?: string;
      // Alternative contact
      alt_first_name?: string;
      alt_last_name?: string;
      alt_mi?: string;
      alt_birth_date?: string;
      alt_relationship?: string;
      alt_contact_number?: string;
      // Questionnaire
      looking_to_adopt?: string;
      specific_shelter_animal?: string;
      ideal_pet_description?: string;
      building_type?: string;
      do_you_rent?: string;
      pet_when_moving?: string;
      live_with?: string[];
      household_allergic?: string;
      pet_caretaker?: string;
      financial_responsible?: string;
      vacation_care?: string;
      hours_alone?: string;
      introduce_steps?: string;
      family_support?: string;
      had_pets_before?: string;
      home_photos?: string[];
      valid_id_urls?: string[];
    };
  };
}

interface AdoptionRequestsListProps {
  requests: AdoptionRequest[];
  showPetInfo?: boolean;
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Reviewing', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800', icon: Check },
  rejected: { label: 'Declined', color: 'bg-red-100 text-red-800', icon: X },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800', icon: FileText },
};

export function AdoptionRequestsList({ requests, showPetInfo = true }: AdoptionRequestsListProps) {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);
    setSuccessMessage(null);
    
    startTransition(async () => {
      const result = await callApiAction('adoption', 'updateAdoptionRequestStatus', [requestId, 'approved']);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Application has been approved successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      setShowApproveConfirm(null);
      setProcessingId(null);
    });
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for declining');
      return;
    }
    
    setProcessingId(requestId);
    setError(null);
    setSuccessMessage(null);
    
    startTransition(async () => {
      const result = await callApiAction('adoption', 'updateAdoptionRequestStatus', [
        requestId, 
        'rejected',
        undefined,
        rejectionReason
      ]);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Application has been declined.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      setShowRejectModal(null);
      setRejectionReason('');
      setProcessingId(null);
    });
  };

  const handleComplete = async (requestId: string, adoptionFee: number) => {
    setProcessingId(requestId);
    setError(null);
    setSuccessMessage(null);
    
    startTransition(async () => {
      const result = await callApiAction('adoption', 'completeAdoption', [requestId, adoptionFee]);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccessMessage('Adoption has been completed successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      setShowCompleteModal(null);
      setProcessingId(null);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getAdopterName = (adopter: AdoptionRequest['adopter']) => {
    const raw = adopter.adopter_profile;
    const profile = Array.isArray(raw) ? raw[0] : raw;
    if (profile?.first_name) {
      return `${profile.first_name} ${profile.last_name}`;
    }
    return adopter.username;
  };

  return (
    <div className="space-y-4">
      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {successMessage}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No adoption requests</p>
        </div>
      ) : (
        requests.map((request) => {
          const config = statusConfig[request.status] || statusConfig.pending;
          const StatusIcon = config.icon;
          
          return (
            <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {/* Header */}
              <div className="p-4 flex items-start gap-4">
                {/* Pet Image */}
                {showPetInfo && (
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                    {request.pet.post?.media_urls?.[0] ? (
                      <img 
                        src={request.pet.post.media_urls[0]} 
                        alt={request.pet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                        🐾
                      </div>
                    )}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Request for {request.pet.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {request.pet.species} {request.pet.breed && `• ${request.pet.breed}`}
                      </p>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${config.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  </div>

                  {/* Applicant Info */}
                  <div className="mt-2 flex items-center gap-3">
                    {request.adopter.avatar_url ? (
                      <img 
                        src={request.adopter.avatar_url}
                        alt={request.adopter.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {getAdopterName(request.adopter)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Applied {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between border-t border-gray-100">
                <button
                  onClick={() => setExpandedRequest(
                    expandedRequest === request.id ? null : request.id
                  )}
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium"
                >
                  <Eye className="w-4 h-4" />
                  {expandedRequest === request.id ? 'Hide Details' : 'View Details'}
                </button>

                {request.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowApproveConfirm(request.id)}
                      disabled={processingId === request.id}
                      className="px-4 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5 font-medium transition"
                    >
                      <Check className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={() => setShowRejectModal(request.id)}
                      disabled={processingId === request.id}
                      className="px-4 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-1.5 font-medium transition"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </button>
                  </div>
                )}

                {request.status === 'approved' && (
                  <button
                    onClick={() => setShowCompleteModal(request.id)}
                    disabled={processingId === request.id}
                    className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 font-medium transition"
                  >
                    <FileText className="w-4 h-4" />
                    Complete Adoption
                  </button>
                )}
              </div>

              {/* Expanded Details */}
              {expandedRequest === request.id && (
                (() => {
                  // Normalize adopter_profile — Supabase may return it as array or object
                  const rawProfile = request.adopter.adopter_profile;
                  const profile: AdoptionRequest['adopter']['adopter_profile'] =
                    Array.isArray(rawProfile) ? rawProfile[0] : rawProfile;

                  return (
                <div className="px-4 py-4 border-t border-gray-100 space-y-5">
                  {/* Header */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Full Adopter Information</h3>
                    <p className="text-sm text-gray-500">Complete details about the adopter.</p>
                  </div>

                  {/* Request Info + Personal Info cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Request Information */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3">Request Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700 whitespace-nowrap">Adopter Name:</span>
                          <span className="text-gray-900">{request.adopter.username}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700 whitespace-nowrap">Email:</span>
                          <span className="text-gray-900">{request.adopter.email}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700 whitespace-nowrap">Status:</span>
                          <span className={`capitalize ${
                            request.status === 'pending' ? 'text-amber-600' :
                            request.status === 'approved' ? 'text-green-600' :
                            request.status === 'rejected' ? 'text-red-600' : 'text-blue-600'
                          }`}>{request.status}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700 whitespace-nowrap">Reviewed At:</span>
                          <span className="text-gray-900">{request.reviewed_at ? formatDate(request.reviewed_at) : 'N/A'}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="font-medium text-gray-700 whitespace-nowrap">Submitted At:</span>
                          <span className="text-gray-900">{formatDate(request.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3">Personal Information</h4>
                      {profile ? (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          {profile.first_name && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-700">Name: </span>
                              <span className="text-gray-900 uppercase">
                                {profile.first_name} {profile.mi ? `${profile.mi} ` : ''}{profile.last_name}
                              </span>
                            </div>
                          )}
                          {profile.date_of_birth && (
                            <div>
                              <span className="font-medium text-gray-700">Birth Date: </span>
                              <span className="text-gray-900">{new Date(profile.date_of_birth).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>
                          )}
                          {profile.gender && (
                            <div>
                              <span className="font-medium text-gray-700">Gender: </span>
                              <span className="text-gray-900 capitalize">{profile.gender}</span>
                            </div>
                          )}
                          {(profile.email || request.adopter.email) && (
                            <div>
                              <span className="font-medium text-gray-700">Email: </span>
                              <span className="text-gray-900">{profile.email || request.adopter.email}</span>
                            </div>
                          )}
                          {(profile.contact_number || request.adopter.phone) && (
                            <div>
                              <span className="font-medium text-gray-700">Contact: </span>
                              <span className="text-gray-900">{profile.contact_number || request.adopter.phone}</span>
                            </div>
                          )}
                          {(request.adopter.address || request.adopter.city) && (
                            <div>
                              <span className="font-medium text-gray-700">Address: </span>
                              <span className="text-gray-900">{[request.adopter.address, request.adopter.city, request.adopter.state].filter(Boolean).join(', ')}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium text-gray-700">Business Name: </span>
                            <span className="text-gray-900">{profile.business_name || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Occupation: </span>
                            <span className="text-gray-900">{profile.occupation || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Social Media: </span>
                            <span className="text-gray-900">{profile.social_media_link || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Marital Status: </span>
                            <span className="text-gray-900 capitalize">{profile.civil_status || 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No personal information provided</p>
                      )}
                    </div>
                  </div>

                  {/* Questionnaire */}
                  {profile && (() => {
                    const questions: { label: string; value: string | undefined | null }[] = [
                      { label: 'What kind of animal are you looking to adopt?', value: profile.looking_to_adopt },
                      { label: 'Is there a specific shelter animal you want to adopt?', value: profile.specific_shelter_animal },
                      { label: 'Describe your ideal pet (sex, age, appearance, temperament, etc.):', value: profile.ideal_pet_description },
                      { label: 'Type of building/residence:', value: profile.building_type },
                      { label: 'Do you rent?', value: profile.do_you_rent },
                      { label: 'What happens to your pet if or when you move?', value: profile.pet_when_moving },
                      { label: 'Who do you live with?', value: Array.isArray(profile.live_with) ? profile.live_with.join(', ') : profile.live_with },
                      { label: 'Allergy Response:', value: profile.household_allergic },
                      { label: 'Who will be responsible for feeding, grooming, and generally caring for your pet?', value: profile.pet_caretaker },
                      { label: "Who will be financially responsible for your pet's needs (food, vet bills, etc.)?", value: profile.financial_responsible },
                      { label: 'Who will look after your pet if you go on vacation or in case of emergency?', value: profile.vacation_care },
                      { label: 'How many hours in your average work day will your pet be left alone?', value: profile.hours_alone },
                      { label: 'What steps will you take to introduce your new pet to his/her surroundings?', value: profile.introduce_steps },
                      { label: 'Does your family support this adoption?', value: profile.family_support },
                      { label: 'Have you had pets before?', value: profile.had_pets_before },
                      { label: 'First-time adopter?', value: profile.first_time_adopter },
                    ];
                    const filled = questions.filter(q => q.value);
                    if (filled.length === 0) return null;
                    return (
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <h4 className="font-semibold text-gray-900 mb-3">Questionnaire</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {filled.map((q, i) => (
                            <div key={i} className="bg-white rounded-lg p-3 border border-gray-200">
                              <p className="text-sm font-semibold text-gray-800 mb-1">{q.label}</p>
                              <p className="text-sm text-gray-600">{q.value}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Alternative Contact */}
                  {profile?.alt_first_name && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <h4 className="font-semibold text-gray-900 mb-3">Alternative Contact Person</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Name: </span>
                          <span className="text-gray-900">{profile.alt_first_name} {profile.alt_mi ? `${profile.alt_mi} ` : ''}{profile.alt_last_name}</span>
                        </div>
                        {profile.alt_relationship && (
                          <div>
                            <span className="font-medium text-gray-700">Relationship: </span>
                            <span className="text-gray-900">{profile.alt_relationship}</span>
                          </div>
                        )}
                        {profile.alt_contact_number && (
                          <div>
                            <span className="font-medium text-gray-700">Contact: </span>
                            <span className="text-gray-900">{profile.alt_contact_number}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Home Photos & Valid IDs */}
                  {profile && ((profile.home_photos && profile.home_photos.length > 0) || (profile.valid_id_urls && profile.valid_id_urls.length > 0)) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.home_photos && profile.home_photos.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-3">Home Photos</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {profile.home_photos.map((url, i) => (
                              <a key={i} href={toVerificationDocumentUrl(url)} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={toVerificationDocumentUrl(url)}
                                  alt={`Home photo ${i + 1}`}
                                  className="w-full h-28 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {profile.valid_id_urls && profile.valid_id_urls.length > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <h4 className="font-semibold text-gray-900 mb-3">Valid IDs</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {profile.valid_id_urls.map((url, i) => (
                              <a key={i} href={toVerificationDocumentUrl(url)} target="_blank" rel="noopener noreferrer" className="block">
                                <img
                                  src={toVerificationDocumentUrl(url)}
                                  alt={`Valid ID ${i + 1}`}
                                  className="w-full h-28 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection reason if rejected */}
                  {request.status === 'rejected' && request.rejection_reason && (
                    <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <h4 className="font-medium text-red-800 mb-1 text-sm">Reason for Decline</h4>
                      <p className="text-sm text-red-700">{request.rejection_reason}</p>
                    </div>
                  )}
                </div>
                  );
                })()
              )}
            </div>
          );
        })
      )}

      {/* Approve Confirmation Modal */}
      {showApproveConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Approve Application?
                </h3>
                <p className="text-sm text-gray-500">
                  for {requests.find(r => r.id === showApproveConfirm)?.pet.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to approve <strong>{
                (() => {
                  const req = requests.find(r => r.id === showApproveConfirm);
                  return req ? getAdopterName(req.adopter) : '';
                })()
              }</strong>&apos;s adoption application? The applicant will be notified of the approval.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowApproveConfirm(null)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(showApproveConfirm)}
                disabled={isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Decline Application?
                </h3>
                <p className="text-sm text-gray-500">
                  for {requests.find(r => r.id === showRejectModal)?.pet.name}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for declining this adoption application. 
              This will be visible to the applicant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for declining this application..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={isPending || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Decline Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Adoption Modal */}
      {showCompleteModal && (
        <CompleteAdoptionModal
          requestId={showCompleteModal}
          adoptionFee={requests.find(r => r.id === showCompleteModal)?.pet.adoption_fee || 0}
          petName={requests.find(r => r.id === showCompleteModal)?.pet.name || ''}
          adopterName={(() => {
            const req = requests.find(r => r.id === showCompleteModal);
            return req ? getAdopterName(req.adopter) : '';
          })()}
          onComplete={handleComplete}
          onClose={() => setShowCompleteModal(null)}
          isPending={isPending}
        />
      )}
    </div>
  );
}

function CompleteAdoptionModal({
  requestId,
  adoptionFee,
  petName,
  adopterName,
  onComplete,
  onClose,
  isPending,
}: {
  requestId: string;
  adoptionFee: number;
  petName: string;
  adopterName: string;
  onComplete: (id: string, fee: number) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [fee, setFee] = useState(adoptionFee);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
            🎉
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Complete Adoption
            </h3>
            <p className="text-sm text-gray-500">{petName} → {adopterName}</p>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Confirm the adoption fee received and complete the adoption process.
          This will mark <strong>{petName}</strong> as adopted and decline any other pending applications.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adoption Fee Received (₱)
          </label>
          <input
            type="number"
            min="0"
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <label className="flex items-start gap-2 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 rounded border-gray-300 text-green-600 focus:ring-green-500"
          />
          <span className="text-sm text-gray-600">
            I confirm that all required documents have been signed and the adoption process is complete.
          </span>
        </label>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onComplete(requestId, fee)}
            disabled={isPending || !confirmed}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Complete Adoption
          </button>
        </div>
      </div>
    </div>
  );
}
