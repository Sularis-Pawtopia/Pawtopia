'use client';

import { useMemo, useState } from 'react';

type FilterMonth = 'all' | number;

interface DvmfInsightsDashboardProps {
  records: any[];
  adoptionRequests: any[];
  healthcareRequests: any[];
  events?: any[];
}

const monthFormatter = new Intl.DateTimeFormat('en-US', { month: 'short' });

function parseDate(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function DvmfInsightsDashboard({
  records,
  adoptionRequests,
  healthcareRequests,
  events = [],
}: DvmfInsightsDashboardProps) {
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<FilterMonth>('all');

  const yearOptions = useMemo(() => {
    const years = new Set<number>();

    records.forEach((record) => {
      const date = parseDate(record?.created_at);
      if (date) years.add(date.getFullYear());
    });

    adoptionRequests.forEach((request) => {
      const date = parseDate(request?.created_at);
      if (date) years.add(date.getFullYear());
    });

    healthcareRequests.forEach((request) => {
      const date = parseDate(request?.created_at);
      if (date) years.add(date.getFullYear());
    });

    events.forEach((event) => {
      const date = parseDate(event?.event_date);
      if (date) years.add(date.getFullYear());
    });

    return Array.from(years).sort((a, b) => b - a);
  }, [records, adoptionRequests, healthcareRequests, events]);

  const dateInFilter = (value?: string) => {
    const date = parseDate(value);
    if (!date) return false;

    const matchesYear = selectedYear === 'all' || date.getFullYear().toString() === selectedYear;
    const matchesMonth = selectedMonth === 'all' || date.getMonth() === selectedMonth;

    return matchesYear && matchesMonth;
  };

  const filteredRecords = useMemo(
    () => records.filter((record) => dateInFilter(record?.created_at)),
    [records, selectedYear, selectedMonth]
  );

  const filteredAdoptionRequests = useMemo(
    () => adoptionRequests.filter((request) => dateInFilter(request?.created_at)),
    [adoptionRequests, selectedYear, selectedMonth]
  );

  const getHealthcareServiceType = (request: any) => {
    return String(request?.service?.service_type || request?.service_type || '').toLowerCase();
  };

  const getHealthcareCompletionDate = (request: any) => {
    return request?.completed_at || request?.updated_at || request?.created_at;
  };

  const completedHealthcareRequests = useMemo(
    () =>
      healthcareRequests.filter((request) => {
        const status = String(request?.status || '').toLowerCase();
        if (status !== 'completed') return false;
        return dateInFilter(getHealthcareCompletionDate(request));
      }),
    [healthcareRequests, selectedYear, selectedMonth]
  );

  const fullyDocumentedWelfareCases = filteredRecords.filter((record) => {
    const notes = String(record?.notes || '').toLowerCase();
    return Boolean(record?.is_vaccinated) && Boolean(record?.is_spayed_neutered) && notes.includes('deworm');
  }).length;

  const adoptionApproved = filteredAdoptionRequests.filter((request) => {
    const status = String(request?.status || '').toLowerCase();
    return status === 'approved' || status === 'completed';
  }).length;

  const healthcareCompleted = completedHealthcareRequests.length;

  const completedByService = {
    spay_neuter: completedHealthcareRequests.filter((request) => getHealthcareServiceType(request) === 'spay_neuter').length,
    vaccination: completedHealthcareRequests.filter((request) => getHealthcareServiceType(request) === 'vaccination').length,
    deworming: completedHealthcareRequests.filter((request) => getHealthcareServiceType(request) === 'deworming').length,
  };

  const monthlyWelfareInterventions = useMemo(() => {
    const vaccinated = Array.from({ length: 12 }, () => 0);
    const sterilized = Array.from({ length: 12 }, () => 0);
    const dewormed = Array.from({ length: 12 }, () => 0);

    completedHealthcareRequests.forEach((request) => {
      const date = parseDate(getHealthcareCompletionDate(request));
      if (!date) return;

      const month = date.getMonth();
      const serviceType = getHealthcareServiceType(request);

      if (serviceType === 'vaccination') vaccinated[month] += 1;
      if (serviceType === 'spay_neuter') sterilized[month] += 1;
      if (serviceType === 'deworming') dewormed[month] += 1;
    });

    return { vaccinated, sterilized, dewormed };
  }, [completedHealthcareRequests]);

  const monthlyAdoptionOutcomes = useMemo(() => {
    const approved = Array.from({ length: 12 }, () => 0);
    const pending = Array.from({ length: 12 }, () => 0);
    const rejected = Array.from({ length: 12 }, () => 0);

    filteredAdoptionRequests.forEach((request) => {
      const date = parseDate(request?.created_at);
      if (!date) return;
      const month = date.getMonth();
      const status = String(request?.status || '').toLowerCase();

      if (status === 'approved' || status === 'completed') approved[month] += 1;
      else if (status === 'rejected') rejected[month] += 1;
      else pending[month] += 1;
    });

    return { approved, pending, rejected };
  }, [filteredAdoptionRequests]);

  const welfareBarMax = Math.max(
    ...monthlyWelfareInterventions.vaccinated,
    ...monthlyWelfareInterventions.sterilized,
    ...monthlyWelfareInterventions.dewormed,
    1
  );

  const adoptionBarMax = Math.max(
    ...monthlyAdoptionOutcomes.approved,
    ...monthlyAdoptionOutcomes.pending,
    ...monthlyAdoptionOutcomes.rejected,
    1
  );

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Registered Pets</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{filteredRecords.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Adoptions Approved</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{adoptionApproved}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Fully Documented Care</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{fullyDocumentedWelfareCases}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Welfare Interventions by Month</h3>
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, index) => {
              const vax = monthlyWelfareInterventions.vaccinated[index];
              const spay = monthlyWelfareInterventions.sterilized[index];
              const deworm = monthlyWelfareInterventions.dewormed[index];
              return (
                <div key={index} className="grid grid-cols-[40px_1fr_84px] items-center gap-2 text-xs">
                  <span className="text-gray-500">{monthFormatter.format(new Date(2024, index, 1))}</span>
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                    <div className="h-full bg-emerald-500" style={{ width: `${(vax / welfareBarMax) * 100}%` }} />
                    <div className="h-full bg-blue-500" style={{ width: `${(spay / welfareBarMax) * 100}%` }} />
                    <div className="h-full bg-amber-500" style={{ width: `${(deworm / welfareBarMax) * 100}%` }} />
                  </div>
                  <span className="text-gray-700 text-right">{vax + spay + deworm}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-3 text-[11px] text-gray-600">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Vaccinated</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" />Spayed/Neutered</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" />Dewormed</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Adoption Pipeline by Month</h3>
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, index) => {
              const approved = monthlyAdoptionOutcomes.approved[index];
              const pending = monthlyAdoptionOutcomes.pending[index];
              const rejected = monthlyAdoptionOutcomes.rejected[index];
              return (
                <div key={index} className="grid grid-cols-[40px_1fr_84px] items-center gap-2 text-xs">
                  <span className="text-gray-500">{monthFormatter.format(new Date(2024, index, 1))}</span>
                  <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                    <div className="h-full bg-emerald-500" style={{ width: `${(approved / adoptionBarMax) * 100}%` }} />
                    <div className="h-full bg-yellow-500" style={{ width: `${(pending / adoptionBarMax) * 100}%` }} />
                    <div className="h-full bg-rose-500" style={{ width: `${(rejected / adoptionBarMax) * 100}%` }} />
                  </div>
                  <span className="text-gray-700 text-right">{approved + pending + rejected}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-3 text-[11px] text-gray-600">
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Approved</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />Pending</span>
            <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Rejected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Healthcare Completed</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{healthcareCompleted}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Completed Spay/Neuter</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{completedByService.spay_neuter}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Completed Vaccinations</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{completedByService.vaccination}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <p className="text-xs text-gray-500">Completed Deworming</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{completedByService.deworming}</p>
        </div>
      </div>

      

    </div>
  );
}
