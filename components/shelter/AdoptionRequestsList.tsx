'use client';

import { useState, useTransition } from 'react';
import { updateAdoptionRequestStatus, completeAdoption } from '@/lib/actions/adoption.actions';
import { Check, X, Eye, Loader2, User, Phone, Mail, MapPin, Calendar, FileText, AlertTriangle, Clock } from 'lucide-react';

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
    adopter_profile?: {
      first_name?: string;
      last_name?: string;
      occupation?: string;
      household_size?: number;
      has_children?: boolean;
      has_other_pets?: boolean;
      home_type?: string;
      home_ownership?: string;
      pet_experience?: string;
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
      const result = await updateAdoptionRequestStatus(requestId, 'approved');
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
      const result = await updateAdoptionRequestStatus(
        requestId, 
        'rejected',
        undefined,
        rejectionReason
      );
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
      const result = await completeAdoption(requestId, adoptionFee);
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
    if (adopter.adopter_profile?.first_name) {
      return `${adopter.adopter_profile.first_name} ${adopter.adopter_profile.last_name}`;
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
                <div className="px-4 py-4 border-t border-gray-100 space-y-4">
                  {/* Applicant Contact */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {request.adopter.email}
                      </div>
                      {request.adopter.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {request.adopter.phone}
                        </div>
                      )}
                      {(request.adopter.city || request.adopter.state) && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          {[request.adopter.city, request.adopter.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Adopter Profile */}
                  {request.adopter.adopter_profile && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Household Information</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {request.adopter.adopter_profile.occupation && (
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <span className="text-gray-500 text-xs block">Occupation</span>
                            <p className="font-medium text-gray-900">{request.adopter.adopter_profile.occupation}</p>
                          </div>
                        )}
                        {request.adopter.adopter_profile.household_size && (
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <span className="text-gray-500 text-xs block">Household Size</span>
                            <p className="font-medium text-gray-900">{request.adopter.adopter_profile.household_size}</p>
                          </div>
                        )}
                        {request.adopter.adopter_profile.home_type && (
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <span className="text-gray-500 text-xs block">Home Type</span>
                            <p className="font-medium text-gray-900 capitalize">{request.adopter.adopter_profile.home_type}</p>
                          </div>
                        )}
                        {request.adopter.adopter_profile.home_ownership && (
                          <div className="bg-gray-50 rounded-lg p-2.5">
                            <span className="text-gray-500 text-xs block">Ownership</span>
                            <p className="font-medium text-gray-900 capitalize">{request.adopter.adopter_profile.home_ownership}</p>
                          </div>
                        )}
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <span className="text-gray-500 text-xs block">Has Children</span>
                          <p className="font-medium text-gray-900">{request.adopter.adopter_profile.has_children ? 'Yes' : 'No'}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2.5">
                          <span className="text-gray-500 text-xs block">Has Other Pets</span>
                          <p className="font-medium text-gray-900">{request.adopter.adopter_profile.has_other_pets ? 'Yes' : 'No'}</p>
                        </div>
                        {request.adopter.adopter_profile.pet_experience && (
                          <div className="bg-gray-50 rounded-lg p-2.5 col-span-2 md:col-span-3">
                            <span className="text-gray-500 text-xs block">Pet Experience</span>
                            <p className="font-medium text-gray-900">{request.adopter.adopter_profile.pet_experience}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Application Responses */}
                  {request.application_data && Object.keys(request.application_data).length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Application Responses</h4>
                      <div className="space-y-3 text-sm">
                        {Object.entries(request.application_data).map(([key, value]) => (
                          <div key={key} className="bg-gray-50 p-3 rounded-lg">
                            <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <p className="mt-1 text-gray-900">{String(value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reviewed Info */}
                  {request.reviewed_at && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <Calendar className="w-3 h-3" />
                      Reviewed on {formatDate(request.reviewed_at)}
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
