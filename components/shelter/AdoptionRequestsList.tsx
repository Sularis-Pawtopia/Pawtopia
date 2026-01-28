'use client';

import { AdoptionRequest } from '@/types';

interface AdoptionRequestsListProps {
  requests: AdoptionRequest[];
}

export function AdoptionRequestsList({ requests }: AdoptionRequestsListProps) {
  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-lg shadow">
          <p className="text-gray-500">No pending requests</p>
        </div>
      ) : (
        requests.map((request) => (
          <div key={request.id} className="bg-white rounded-lg shadow p-6">
            <p className="font-medium text-gray-900">Adoption Request</p>
            <p className="text-sm text-gray-600 mt-1">Status: {request.status}</p>
          </div>
        ))
      )}
    </div>
  );
}
