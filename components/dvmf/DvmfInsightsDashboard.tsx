'use client';

import { useMemo, useState } from 'react';

type FilterMonth = 'all' | number;

interface DvmfInsightsDashboardProps {
  events: any[];
  records: any[];
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function DvmfInsightsDashboard({ events, records }: DvmfInsightsDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<FilterMonth>('all');

  const yearOptions = useMemo(() => {
    const years = new Set<number>();

    events.forEach((event) => {
      const date = parseDate(event?.event_date);
      if (date) years.add(date.getFullYear());
    });

    records.forEach((record) => {
      const date = parseDate(record?.created_at);
      if (date) years.add(date.getFullYear());
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [events, records]);

  const dateInFilter = (value?: string) => {
    const date = parseDate(value);
    if (!date) return false;

    const matchesYear = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
    const matchesMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;

    return matchesYear && matchesMonth;
  };

  const filteredEvents = useMemo(
    () => events.filter((event) => dateInFilter(event?.event_date)),
    [events, selectedYear, selectedMonth]
  );

  const filteredRecords = useMemo(
    () => records.filter((record) => dateInFilter(record?.created_at)),
    [records, selectedYear, selectedMonth]
  );

  const now = new Date();
  const totalParticipants = filteredEvents.reduce((sum, event) => sum + (Number(event?.attendee_count) || 0), 0);
  const totalWaitlisted = filteredEvents.reduce((sum, event) => sum + (Number(event?.waitlist_count) || 0), 0);

  const upcomingEvents = filteredEvents.filter((event) => {
    const date = parseDate(event?.event_date);
    return date ? date >= now : false;
  }).length;

  const vaccinatedRecords = filteredRecords.filter((record) => {
    const status = String(record?.vaccination_status || '').toLowerCase();
    return record?.is_vaccinated === true || status.includes('up') || status.includes('complete');
  }).length;

  const sterilizedRecords = filteredRecords.filter((record) => {
    const status = String(record?.spay_neuter_status || '').toLowerCase();
    return record?.is_spayed_neutered === true || status.includes('done') || status.includes('yes');
  }).length;

  const monthlyParticipants = useMemo(() => {
    const values = Array.from({ length: 12 }, () => 0);

    filteredEvents.forEach((event) => {
      const date = parseDate(event?.event_date);
      if (!date) return;
      values[date.getMonth()] += Number(event?.attendee_count) || 0;
    });

    return values;
  }, [filteredEvents]);

  const monthlyRegistryEntries = useMemo(() => {
    const values = Array.from({ length: 12 }, () => 0);

    filteredRecords.forEach((record) => {
      const date = parseDate(record?.created_at);
      if (!date) return;
      values[date.getMonth()] += 1;
    });

    return values;
  }, [filteredRecords]);

  const participantMax = Math.max(...monthlyParticipants, 1);
  const registryMax = Math.max(...monthlyRegistryEntries, 1);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Year</label>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All years</option>
            {yearOptions.map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-1">Month</label>
          <select
            value={selectedMonth}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedMonth(value === 'all' ? 'all' : Number(value));
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">All months</option>
            {Array.from({ length: 12 }).map((_, index) => (
              <option key={index} value={index}>
                {monthFormatter.format(new Date(2024, index, 1))}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredEvents.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Upcoming Events</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{upcomingEvents}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Participants</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalParticipants}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Waitlisted</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalWaitlisted}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Vaccinated Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{vaccinatedRecords}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Sterilized Records</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{sterilizedRecords}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Participants by Month</h3>
          <div className="space-y-2">
            {monthlyParticipants.map((value, index) => (
              <div key={index} className="grid grid-cols-[40px_1fr_50px] items-center gap-2 text-xs">
                <span className="text-gray-500">{monthFormatter.format(new Date(2024, index, 1))}</span>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(value / participantMax) * 100}%` }}
                  />
                </div>
                <span className="text-gray-700 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Registry Entries by Month</h3>
          <div className="space-y-2">
            {monthlyRegistryEntries.map((value, index) => (
              <div key={index} className="grid grid-cols-[40px_1fr_50px] items-center gap-2 text-xs">
                <span className="text-gray-500">{monthFormatter.format(new Date(2024, index, 1))}</span>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${(value / registryMax) * 100}%` }}
                  />
                </div>
                <span className="text-gray-700 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
