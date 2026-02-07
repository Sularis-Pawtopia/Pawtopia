'use client';

import { useState } from 'react';
import { Clock, Check, X, FileText, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';

interface AdoptionRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  created_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
  application_data?: Record<string, unknown>;
  pet: {
    id: string;
    name: string;
    species: string;
    breed?: string;
    adoption_fee?: number;
    status: string;
    post?: {
      media_urls?: string[];
    };
    shelter?: {
      id: string;
      username: string;
      avatar_url?: string;
      phone?: string;
      email?: string;
    };
  };
}

interface MyAdoptionRequestsProps {
  requests: AdoptionRequest[];
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: { label: 'Under Review', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-800', bgColor: 'bg-green-100', icon: Check },
  rejected: { label: 'Declined', color: 'text-red-800', bgColor: 'bg-red-100', icon: X },
  completed: { label: 'Completed', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: FileText },
};

export function MyAdoptionRequests({ requests }: MyAdoptionRequestsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (requests.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-3">🐾</div>
        <p className="text-gray-500 font-medium">No adoption requests yet</p>
        <p className="text-gray-400 text-sm mt-1">
          Browse available pets and submit an adoption application
        </p>
        <a
          href="/pets"
          className="inline-block mt-4 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
        >
          Browse Pets
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const config = statusConfig[request.status] || statusConfig.pending;
        const StatusIcon = config.icon;
        const isExpanded = expandedId === request.id;
        const pet = request.pet;

        return (
          <div key={request.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Main Row */}
            <div className="p-4 flex items-center gap-4">
              {/* Pet Image */}
              <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                {pet.post?.media_urls?.[0] ? (
                  <img 
                    src={pet.post.media_urls[0]} 
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">
                    🐾
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900">{pet.name}</h3>
                <p className="text-sm text-gray-600">
                  {pet.species} {pet.breed && `• ${pet.breed}`}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Applied {formatDate(request.created_at)}
                </p>
              </div>

              {/* Status */}
              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap ${config.bgColor} ${config.color}`}>
                <StatusIcon className="w-3 h-3" />
                {config.label}
              </span>

              {/* Expand */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : request.id)}
                className="p-1.5 hover:bg-gray-100 rounded-full transition"
              >
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">
                {/* Status Message */}
                {request.status === 'pending' && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      Your application is currently being reviewed by the shelter. 
                      You will be notified when there is an update.
                    </p>
                  </div>
                )}
                {request.status === 'approved' && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      Congratulations! Your adoption application has been approved! 
                      The shelter will contact you to complete the adoption process.
                    </p>
                  </div>
                )}
                {request.status === 'rejected' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-medium mb-1">Application Declined</p>
                    {request.rejection_reason && (
                      <p className="text-sm text-red-700">{request.rejection_reason}</p>
                    )}
                  </div>
                )}
                {request.status === 'completed' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                      🎉 Adoption complete! {pet.name} is now part of your family!
                    </p>
                  </div>
                )}

                {/* Shelter Contact Info */}
                {pet.shelter && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Shelter Contact</h4>
                    <div className="flex items-center gap-3">
                      {pet.shelter.avatar_url ? (
                        <img src={pet.shelter.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">🏠</div>
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{pet.shelter.username}</p>
                        {pet.shelter.phone && (
                          <p className="text-xs text-gray-500">{pet.shelter.phone}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Adoption Fee */}
                {pet.adoption_fee !== undefined && pet.adoption_fee !== null && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium text-gray-700">
                      Adoption Fee: {pet.adoption_fee > 0 ? `₱${pet.adoption_fee.toLocaleString()}` : 'Free'}
                    </span>
                  </div>
                )}

                {/* Reviewed Date */}
                {request.reviewed_at && (
                  <p className="text-xs text-gray-400">
                    Reviewed on {formatDate(request.reviewed_at)}
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
