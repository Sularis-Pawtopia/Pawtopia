'use client';

import { useState } from 'react';
import { AdoptionRequestsList } from './AdoptionRequestsList';
import { PetGrid } from '../pets/PetGrid';

interface ShelterDashboardContentProps {
  pets: any[];
  allRequests: any[];
  pendingCount: number;
  isPendingVerification: boolean;
}

export function ShelterDashboardContent({
  pets,
  allRequests,
  pendingCount,
  isPendingVerification,
}: ShelterDashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'requests' | 'pets'>('requests');

  const tabs = [
    {
      id: 'requests' as const,
      label: 'Adoption Requests',
      badge: pendingCount > 0 ? pendingCount : undefined,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      id: 'pets' as const,
      label: `Adoptable Pets (${pets.length})`,
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'requests' && (
        <div>
          {allRequests.length > 0 ? (
            <AdoptionRequestsList requests={allRequests} />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500">No adoption requests yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Requests will appear here when adopters apply for your pets
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'pets' && (
        <div>
          <div className="flex items-center justify-end mb-4">
            {isPendingVerification ? (
              <span
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
                title="Your shelter must be verified before you can add pets"
              >
                Add New Pet (Verification Required)
              </span>
            ) : (
              <a
                href="/shelter/pets/new"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Add New Pet
              </a>
            )}
          </div>
          {pets.length > 0 ? (
            <PetGrid pets={pets} isOwner />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-gray-500">No pets listed yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Add your pets so adopters can find them
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
