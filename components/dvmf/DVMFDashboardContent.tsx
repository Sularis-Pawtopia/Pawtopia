'use client';

import { useState } from 'react';
import { DvmfEventsTab } from './DVMFEventsTab';
import { DvmfRegistryTab } from './DvmfRegistryTab';
import { OrganizerEventRegistrantsBoard } from '@/components/events/OrganizerEventRegistrantsBoard';

interface DvmfDashboardContentProps {
  events: any[];
  records: any[];
  organizerId?: string;
}

export function DvmfDashboardContent({ events, records, organizerId }: DvmfDashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'registrants' | 'registry'>('events');

  return (
    <div>
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'events' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Events & Drives
        </button>
        <button
          onClick={() => setActiveTab('registrants')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'registrants' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Event Registrants
        </button>
        <button
          onClick={() => setActiveTab('registry')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'registry' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pet Registry
        </button>
      </div>

      {activeTab === 'events' ? (
        <DvmfEventsTab events={events} organizerId={organizerId} />
      ) : activeTab === 'registrants' ? (
        organizerId ? (
          <OrganizerEventRegistrantsBoard organizerId={organizerId} title="DVMF Event Registrants" />
        ) : null
      ) : (
        <DvmfRegistryTab initialRecords={records} />
      )}
    </div>
  );
}
