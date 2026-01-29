'use client';

import { useState, useTransition } from 'react';
import { updateAdoptionRequestStatus, completeAdoption } from '@/lib/actions/adoption.actions';
import { Check, X, Eye, Loader2, User, Phone, Mail, MapPin, Calendar, FileText } from 'lucide-react';

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
    };
  };
}

interface AdoptionRequestsListProps {
  requests: AdoptionRequest[];
}

export function AdoptionRequestsList({ requests }: AdoptionRequestsListProps) {
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showCompleteModal, setShowCompleteModal] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (requestId: string) => {
    setProcessingId(requestId);
    setError(null);
    
    startTransition(async () => {
      const result = await updateAdoptionRequestStatus(requestId, 'approved');
      if (result.error) {
        setError(result.error);
      }
      setProcessingId(null);
    });
  };

  const handleReject = async (requestId: string) => {
    if (!rejectionReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    
    setProcessingId(requestId);
    setError(null);
    
    startTransition(async () => {
      const result = await updateAdoptionRequestStatus(
        requestId, 
        'rejected',
        undefined,
        rejectionReason
      );
      if (result.error) {
        setError(result.error);
      }
      setShowRejectModal(null);
      setRejectionReason('');
      setProcessingId(null);
    });
  };

  const handleComplete = async (requestId: string, adoptionFee: number) => {
    setProcessingId(requestId);
    setError(null);
    
    startTransition(async () => {
      const result = await completeAdoption(requestId, adoptionFee);
      if (result.error) {
        setError(result.error);
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

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {requests.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No pending requests</p>
        </div>
      ) : (
        requests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 flex items-start gap-4">
              {/* Pet Image */}
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {request.pet.post?.media_urls?.[0] ? (
                  <img 
                    src={request.pet.post.media_urls[0]} 
                    alt={request.pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    🐾
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Adoption Request for {request.pet.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {request.pet.species} {request.pet.breed && `• ${request.pet.breed}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    request.status === 'approved' ? 'bg-green-100 text-green-800' :
                    request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
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
                      {request.adopter.adopter_profile?.first_name 
                        ? `${request.adopter.adopter_profile.first_name} ${request.adopter.adopter_profile.last_name}`
                        : request.adopter.username
                      }
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
                className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
              >
                <Eye className="w-4 h-4" />
                {expandedRequest === request.id ? 'Hide Details' : 'View Details'}
              </button>

              {request.status === 'pending' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(request.id)}
                    disabled={processingId === request.id}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                  >
                    {processingId === request.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Approve
                  </button>
                  <button
                    onClick={() => setShowRejectModal(request.id)}
                    disabled={processingId === request.id}
                    className="px-3 py-1.5 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}

              {request.status === 'approved' && (
                <button
                  onClick={() => setShowCompleteModal(request.id)}
                  disabled={processingId === request.id}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
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
                      <Mail className="w-4 h-4" />
                      {request.adopter.email}
                    </div>
                    {request.adopter.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4" />
                        {request.adopter.phone}
                      </div>
                    )}
                    {(request.adopter.city || request.adopter.state) && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        {[request.adopter.city, request.adopter.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Adopter Profile */}
                {request.adopter.adopter_profile && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Household Information</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {request.adopter.adopter_profile.occupation && (
                        <div>
                          <span className="text-gray-500">Occupation:</span>
                          <p className="font-medium">{request.adopter.adopter_profile.occupation}</p>
                        </div>
                      )}
                      {request.adopter.adopter_profile.household_size && (
                        <div>
                          <span className="text-gray-500">Household Size:</span>
                          <p className="font-medium">{request.adopter.adopter_profile.household_size}</p>
                        </div>
                      )}
                      {request.adopter.adopter_profile.home_type && (
                        <div>
                          <span className="text-gray-500">Home Type:</span>
                          <p className="font-medium capitalize">{request.adopter.adopter_profile.home_type}</p>
                        </div>
                      )}
                      {request.adopter.adopter_profile.home_ownership && (
                        <div>
                          <span className="text-gray-500">Ownership:</span>
                          <p className="font-medium capitalize">{request.adopter.adopter_profile.home_ownership}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">Has Children:</span>
                        <p className="font-medium">{request.adopter.adopter_profile.has_children ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Has Other Pets:</span>
                        <p className="font-medium">{request.adopter.adopter_profile.has_other_pets ? 'Yes' : 'No'}</p>
                      </div>
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
                          <span className="text-gray-500 capitalize">
                            {key.replace(/_/g, ' ')}:
                          </span>
                          <p className="mt-1 text-gray-900">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rejection reason if rejected */}
                {request.status === 'rejected' && request.rejection_reason && (
                  <div className="bg-red-50 p-3 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-1">Rejection Reason</h4>
                    <p className="text-sm text-red-700">{request.rejection_reason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ))
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject Application
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for rejecting this adoption application. 
              This will be shared with the applicant.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Reject Application
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
  onComplete,
  onClose,
  isPending,
}: {
  requestId: string;
  adoptionFee: number;
  petName: string;
  onComplete: (id: string, fee: number) => void;
  onClose: () => void;
  isPending: boolean;
}) {
  const [fee, setFee] = useState(adoptionFee);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Complete Adoption for {petName}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Confirm the adoption fee received and complete the adoption process.
          This will mark the pet as adopted.
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adoption Fee Received (PHP)
          </label>
          <input
            type="number"
            min="0"
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onComplete(requestId, fee)}
            disabled={isPending}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Complete Adoption
          </button>
        </div>
      </div>
    </div>
  );
}
