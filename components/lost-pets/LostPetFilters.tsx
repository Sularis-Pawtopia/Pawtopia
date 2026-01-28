'use client';

import { useState } from 'react';

export function LostPetFilters() {
  const [status, setStatus] = useState('all');
  const [species, setSpecies] = useState('all');

  return (
    <div className="bg-white rounded-lg shadow p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>

      <div className="space-y-6">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="lost">Lost</option>
            <option value="found">Found</option>
            <option value="reunited">Reunited</option>
          </select>
        </div>

        {/* Species Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Species
          </label>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="Enter city or area"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Quick Stats */}
        <div className="pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Quick Stats</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Lost</span>
              <span className="font-semibold text-red-600">12</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Found</span>
              <span className="font-semibold text-blue-600">8</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reunited</span>
              <span className="font-semibold text-green-600">45</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
