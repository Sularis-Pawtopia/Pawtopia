'use client';

import { useMemo, useState } from 'react';

type FilterMonth = 'all' | number;

interface ShelterInsightsDashboardProps {
  pets: any[];
  requests: any[];
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function ShelterInsightsDashboard({ pets, requests }: ShelterInsightsDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<FilterMonth>('all');

  const yearOptions = useMemo(() => {
    const years = new Set<number>();

    pets.forEach((pet) => {
      const createdAt = parseDate(pet?.created_at);
      if (createdAt) years.add(createdAt.getFullYear());
      const updatedAt = parseDate(pet?.updated_at);
      if (updatedAt) years.add(updatedAt.getFullYear());
    });

    requests.forEach((request) => {
      const createdAt = parseDate(request?.created_at);
      if (createdAt) years.add(createdAt.getFullYear());
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [pets, requests]);

  const dateInFilter = (value?: string) => {
    const date = parseDate(value);
    if (!date) return false;

    const matchesYear = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
    const matchesMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;

    return matchesYear && matchesMonth;
  };

  const filteredPets = useMemo(
    () => pets.filter((pet) => dateInFilter(pet?.created_at)),
    [pets, selectedYear, selectedMonth]
  );

  const filteredRequests = useMemo(
    () => requests.filter((request) => dateInFilter(request?.created_at)),
    [requests, selectedYear, selectedMonth]
  );

  const adoptedPets = filteredPets.filter((pet) => pet?.status === 'adopted').length;
  const remainingPets = filteredPets.filter((pet) => pet?.status !== 'adopted').length;
  const availablePets = filteredPets.filter((pet) => pet?.status === 'available').length;
  const pendingPets = filteredPets.filter((pet) => pet?.status === 'pending').length;

  const pendingRequests = filteredRequests.filter((request) => request?.status === 'pending').length;
  const approvedRequests = filteredRequests.filter((request) => request?.status === 'approved').length;
  const rejectedRequests = filteredRequests.filter((request) => request?.status === 'rejected').length;

  const adoptionRate = filteredPets.length > 0 ? Math.round((adoptedPets / filteredPets.length) * 100) : 0;

  const monthlyIntake = useMemo(() => {
    const values = Array.from({ length: 12 }, () => 0);
    filteredPets.forEach((pet) => {
      const createdAt = parseDate(pet?.created_at);
      if (!createdAt) return;
      values[createdAt.getMonth()] += 1;
    });
    return values;
  }, [filteredPets]);

  const monthlyAdoptions = useMemo(() => {
    const values = Array.from({ length: 12 }, () => 0);
    filteredPets.forEach((pet) => {
      if (pet?.status !== 'adopted') return;
      const updatedAt = parseDate(pet?.updated_at) || parseDate(pet?.created_at);
      if (!updatedAt) return;
      values[updatedAt.getMonth()] += 1;
    });
    return values;
  }, [filteredPets]);

  const intakeMax = Math.max(...monthlyIntake, ...monthlyAdoptions, 1);

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
          <p className="text-xs text-gray-500">Total Pets</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredPets.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Adopted Pets</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{adoptedPets}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Remaining in Care</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{remainingPets}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Pending Requests</p>
          <p className="text-2xl font-bold text-yellow-600 mt-1">{pendingRequests}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Approved Requests</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{approvedRequests}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Adoption Rate</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{adoptionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Pets Intake vs Adoptions</h3>
          <div className="space-y-2">
            {monthlyIntake.map((value, index) => (
              <div key={index} className="grid grid-cols-[40px_1fr_55px_55px] items-center gap-2 text-xs">
                <span className="text-gray-500">{monthFormatter.format(new Date(2024, index, 1))}</span>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden relative">
                  <div
                    className="h-full bg-primary-500 rounded-full"
                    style={{ width: `${(value / intakeMax) * 100}%` }}
                  />
                  <div
                    className="h-full bg-green-500 rounded-full absolute top-0 left-0 opacity-70"
                    style={{ width: `${(monthlyAdoptions[index] / intakeMax) * 100}%` }}
                  />
                </div>
                <span className="text-gray-700 text-right">{value}</span>
                <span className="text-green-700 text-right">{monthlyAdoptions[index]}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-4 text-xs text-gray-600">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-primary-500 inline-block" /> Intake</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Adopted</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Current Care & Request Pipeline</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Available Pets</span>
              <span className="font-semibold text-gray-900">{availablePets}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Pending Placement</span>
              <span className="font-semibold text-yellow-700">{pendingPets}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Rejected Requests</span>
              <span className="font-semibold text-red-600">{rejectedRequests}</span>
            </div>
            <div className="h-px bg-gray-100 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Remaining in Care</span>
              <span className="font-bold text-blue-700">{remainingPets}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
