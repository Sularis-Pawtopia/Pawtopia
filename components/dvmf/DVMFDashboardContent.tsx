'use client';

import { useState } from 'react';
import { DvmfEventsTab } from './DVMFEventsTab';
import { DvmfRegistryTab } from './DvmfRegistryTab';
import { QuickRegisterModal } from './QuickRegisterModal';
import { HealthcareAppointmentRequestsList } from './HealthcareAppointmentRequestsList';
import { HealthcareCalendarWeek } from './HealthcareCalendarWeek';
import { HealthcareServicePricing } from './HealthcareServicePricing';
import { OrganizerEventRegistrantsBoard } from '@/components/events/OrganizerEventRegistrantsBoard';
import { AdoptionRequestsList } from '@/components/shelter/AdoptionRequestsList';
import { PetGrid } from '@/components/pets/PetGrid';
import { PetDetailModal } from '@/components/pets/PetDetailModal';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface DvmfDashboardContentProps {
  events: any[];
  records: any[];
  pets: any[];
  allRequests: any[];
  healthcareRequests: any[];
  healthcareCalendarData: {
    view: 'day' | 'week' | 'month';
    period_start: string;
    period_end: string;
    slots: any[];
  } | null;
  healthcareServices: any[];
  pendingCount: number;
  pendingHealthcareCount: number;
  isPendingVerification: boolean;
  organizerId?: string;
}

export function DvmfDashboardContent({
  events,
  records,
  pets,
  allRequests,
  healthcareRequests,
  healthcareCalendarData,
  healthcareServices,
  pendingCount,
  pendingHealthcareCount,
  isPendingVerification,
  organizerId,
}: DvmfDashboardContentProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'requests' | 'pets' | 'events' | 'registrants' | 'registry' | 'appointments' | 'calendar' | 'pricing'>('requests');
  const [selectedDvmfPet, setSelectedDvmfPet] = useState<any | null>(null);
  const [quickRegisterPet, setQuickRegisterPet] = useState<any | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
      <aside className="bg-white rounded-xl border border-gray-200 p-2 h-fit lg:sticky lg:top-24">
        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Operations Menu</p>
        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
        <button
          onClick={() => setActiveTab('requests')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'requests' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
          </svg>
          Adoption Requests
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
              {pendingCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('pets')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'pets' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          Adoptable Pets ({pets.length})
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'events' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25M3 18.75A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75M3 18.75v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          Events & Drives
        </button>
        <button
          onClick={() => setActiveTab('registrants')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'registrants' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Event Registrants
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'registry' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
          </svg>
          Pet Registry
        </button>
        <button
          onClick={() => setActiveTab('appointments')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'appointments' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 6.75v4.5m0 0v4.5m0-4.5h4.5m-4.5 0h-4.5M3.75 8.25h16.5M4.5 3.75h15a.75.75 0 01.75.75v15a.75.75 0 01-.75.75h-15a.75.75 0 01-.75-.75v-15a.75.75 0 01.75-.75z" />
          </svg>
          Healthcare Requests
          {pendingHealthcareCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-yellow-400 text-yellow-900">
              {pendingHealthcareCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'calendar' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 8.25h18M4.5 5.25h15A1.5 1.5 0 0121 6.75v12A1.5 1.5 0 0119.5 20.25h-15A1.5 1.5 0 013 18.75v-12a1.5 1.5 0 011.5-1.5z" />
          </svg>
          Healthcare Calendar
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`w-full flex items-center justify-start gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            activeTab === 'pricing' ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-9h6m-7.5 9h9a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0016.5 6h-9A1.5 1.5 0 006 7.5v9A1.5 1.5 0 007.5 18z" />
          </svg>
          Service Pricing
        </button>
        </div>
      </aside>

      <section>
      {activeTab === 'requests' ? (
        allRequests.length > 0 ? (
          <AdoptionRequestsList requests={allRequests} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No adoption requests yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Requests will appear here when adopters apply for your posted pets.
            </p>
          </div>
        )
      ) : activeTab === 'pets' ? (
        <div>
          <div className="flex items-center justify-end mb-4">
            {isPendingVerification ? (
              <span
                className="px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed text-sm"
                title="Your DVMF account must be verified before you can add pets"
              >
                Add New Pet (Verification Required)
              </span>
            ) : (
              <Link
                href="/dvmf/pets/new"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
              >
                Add New Pet
              </Link>
            )}
          </div>
          {pets.length > 0 ? (
            <PetGrid
              pets={pets}
              isOwner
              onPetClick={(pet) => setSelectedDvmfPet(pet)}
            />
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
              <div className="text-4xl mb-3">🐾</div>
              <p className="text-gray-500">No pets listed yet</p>
              <p className="text-gray-400 text-sm mt-1">Add pets so adopters can discover and apply.</p>
            </div>
          )}
        </div>
      ) : activeTab === 'events' ? (
        <DvmfEventsTab events={events} organizerId={organizerId} />
      ) : activeTab === 'registrants' ? (
        organizerId ? (
          <OrganizerEventRegistrantsBoard organizerId={organizerId} title="DVMF Event Registrants" />
        ) : null
      ) : activeTab === 'appointments' ? (
        <HealthcareAppointmentRequestsList requests={healthcareRequests} />
      ) : activeTab === 'calendar' ? (
        <HealthcareCalendarWeek initialCalendarData={healthcareCalendarData} />
      ) : activeTab === 'pricing' ? (
        <HealthcareServicePricing services={healthcareServices} />
      ) : (
        <DvmfRegistryTab initialRecords={records} />
      )}

      {selectedDvmfPet && (
        <PetDetailModal
          pet={selectedDvmfPet}
          showIdCard
          userRole="dvmf"
          showAdoptSection={false}
          onEdit={() => {
            window.location.href = `/shelter/pets/${selectedDvmfPet.id}/edit`;
          }}
          onChangePicture={() => {
            window.location.href = `/shelter/pets/${selectedDvmfPet.id}/edit`;
          }}
          onClose={() => setSelectedDvmfPet(null)}
          actions={[
            {
              label: 'View Post',
              tone: 'secondary',
              onClick: () => {
                window.location.href = `/pets/${selectedDvmfPet.id}`;
              },
            },
            {
              label: 'Quick Register',
              tone: 'primary',
              onClick: () => {
                setQuickRegisterPet(selectedDvmfPet);
              },
            },
          ]}
        />
      )}

      {quickRegisterPet && (
        <QuickRegisterModal
          pet={quickRegisterPet}
          onClose={() => setQuickRegisterPet(null)}
          onSuccess={() => {
            setQuickRegisterPet(null);
            setSelectedDvmfPet(null);
            setActiveTab('registry');
            router.refresh();
          }}
        />
      )}
      </section>
    </div>
  );
}
