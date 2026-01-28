'use client';

import { useState } from 'react';

export function EventFilters() {
  const [eventType, setEventType] = useState('all');
  const [timeFilter, setTimeFilter] = useState('upcoming');

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Events</h3>

      <div className="space-y-6">
        {/* Time Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            When
          </label>
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="upcoming">Upcoming</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="past">Past Events</option>
          </select>
        </div>

        {/* Event Type Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Event Type
          </label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Events</option>
            <option value="adoption">Adoption Drive</option>
            <option value="fundraiser">Fundraiser</option>
            <option value="education">Education & Training</option>
            <option value="community">Community Gathering</option>
            <option value="vaccination">Vaccination Clinic</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="Enter city or zip"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Popular Event Types */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Popular Categories</h4>
          <div className="space-y-2">
            {[
              { icon: '🐕', label: 'Adoption Events', count: 12 },
              { icon: '💰', label: 'Fundraisers', count: 8 },
              { icon: '📚', label: 'Training Sessions', count: 5 },
              { icon: '⚕️', label: 'Health Clinics', count: 3 },
            ].map((category) => (
              <button
                key={category.label}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <span>{category.icon}</span>
                  <span className="text-sm text-gray-700">{category.label}</span>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
