'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';

const REPORT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'abuse', label: '🚨 Abuse' },
  { value: 'neglect', label: '⚠️ Neglect' },
  { value: 'stray', label: '🐕 Stray Animal' },
  { value: 'injured', label: '🩹 Injured Animal' },
  { value: 'hoarding', label: '🏠 Animal Hoarding' },
  { value: 'illegal_breeding', label: '🔒 Illegal Breeding' },
  { value: 'abandoned', label: '💔 Abandoned' },
  { value: 'other', label: '📋 Other' },
];

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: '🕐 Pending' },
  { value: 'under_review', label: '📝 Under Review' },
  { value: 'investigating', label: '🔍 Investigating' },
  { value: 'action_taken', label: '⚡ Action Taken' },
  { value: 'resolved', label: '✅ Resolved' },
  { value: 'closed', label: '🔒 Closed' },
  { value: 'referred', label: '↗️ Referred' },
];

const URGENCY_LEVELS = [
  { value: '', label: 'All Urgency' },
  { value: 'critical', label: '🔴 Critical' },
  { value: 'high', label: '🟠 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

export function ReportFiltersComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      params.delete('page'); // Reset page when filter changes
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(`/dashboard/reports?${createQueryString(name, value)}`);
  };

  const clearFilters = () => {
    router.push('/dashboard/reports');
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center">
        {/* Type Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Report Type
          </label>
          <select
            value={searchParams.get('type') || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
          >
            {REPORT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Status
          </label>
          <select
            value={searchParams.get('status') || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
          >
            {STATUSES.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </div>

        {/* Urgency Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            Urgency
          </label>
          <select
            value={searchParams.get('urgency') || ''}
            onChange={(e) => handleFilterChange('urgency', e.target.value)}
            className="rounded-lg border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
          >
            {URGENCY_LEVELS.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </div>

        {/* City Search */}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">
            City
          </label>
          <input
            type="text"
            placeholder="Search city..."
            defaultValue={searchParams.get('city') || ''}
            onBlur={(e) => handleFilterChange('city', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleFilterChange('city', e.currentTarget.value);
              }
            }}
            className="rounded-lg border-gray-300 text-sm focus:ring-orange-500 focus:border-orange-500"
          />
        </div>

        {/* Clear Filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  );
}
