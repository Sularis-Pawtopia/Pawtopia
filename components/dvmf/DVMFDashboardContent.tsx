'use client';

import { useState } from 'react';
import { DvmfEventsTab } from './DVMFEventsTab';
import { DvmfRegistryTab } from './DvmfRegistryTab';

interface DvmfDashboardContentProps {
  events: any[];
  records: any[];
}

export function DvmfDashboardContent({ events, records }: DvmfDashboardContentProps) {
  const [activeTab, setActiveTab] = useState<'events' | 'registry'>('events');

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
          onClick={() => setActiveTab('registry')}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            activeTab === 'registry' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pet Registry
        </button>
      </div>

      {activeTab === 'events' ? <DvmfEventsTab events={events} /> : <DvmfRegistryTab initialRecords={records} />}
    </div>
  );
}
