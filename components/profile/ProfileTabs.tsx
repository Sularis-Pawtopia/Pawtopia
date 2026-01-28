'use client';

import { useState } from 'react';

export function ProfileTabs({ profile }: { profile: any }) {
  const [activeTab, setActiveTab] = useState('posts');
  const isShelter = profile.role === 'shelter';

  const tabs = isShelter
    ? [
        { id: 'posts', label: 'Posts', icon: '📝' },
        { id: 'adoptables', label: 'Available Pets', icon: '🐕' },
        { id: 'events', label: 'Events', icon: '📅' },
        { id: 'stories', label: 'Success Stories', icon: '❤️' },
      ]
    : [
        { id: 'posts', label: 'Posts', icon: '📝' },
        { id: 'adopted', label: 'Adopted Pets', icon: '🏡' },
        { id: 'comments', label: 'Comments', icon: '💬' },
        { id: 'likes', label: 'Liked Posts', icon: '❤️' },
      ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-2 font-semibold transition-colors relative ${
                activeTab === tab.id
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
        <div className="text-6xl mb-4">{tabs.find(t => t.id === activeTab)?.icon}</div>
        <p>No {tabs.find(t => t.id === activeTab)?.label.toLowerCase()} to display</p>
      </div>
    </div>
  );
}
