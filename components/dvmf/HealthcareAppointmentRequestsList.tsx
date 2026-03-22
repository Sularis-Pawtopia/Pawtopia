'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface HealthcareAppointmentRequestsListProps {
  requests: any[];
}

const statusConfig: Record<string, { label: string; color: string }> = {
  pending_approval: { label: 'Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
  approved_pending_payment: { label: 'Approved - Awaiting Payment', color: 'bg-blue-100 text-blue-800' },
  paid_scheduled: { label: 'Paid and Scheduled', color: 'bg-green-100 text-green-800' },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  completed: { label: 'Completed', color: 'bg-indigo-100 text-indigo-800' },
  cancelled: { label: 'Cancelled', color: 'bg-gray-100 text-gray-700' },
};

const money = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  maximumFractionDigits: 2,
});

const dateTime = new Intl.DateTimeFormat('en-PH', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const dateOnly = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

function toReadableTime(timeValue?: string) {
  if (!timeValue) return 'Time not specified';
  const [hoursPart, minutesPart] = String(timeValue).split(':');
  const hours = Number(hoursPart);
  const minutes = Number(minutesPart);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return String(timeValue);
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${normalizedHours}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

export function HealthcareAppointmentRequestsList({ requests }: HealthcareAppointmentRequestsListProps) {
  const [rows, setRows] = useState<any[]>(requests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [petFilter, setPetFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'service_az' | 'pet_az' | 'requester_az'>('newest');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(requests);
  }, [requests]);

  const serviceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      const id = String(row?.service?.id || '');
      const name = String(row?.service?.service_name || '').trim();
      if (!id || !name) continue;
      map.set(id, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const petOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of rows) {
      const id = String(row?.pet?.id || '');
      const name = String(row?.pet?.name || '').trim();
      if (!id || !name) continue;
      map.set(id, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rows]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = rows.filter((row) => {
      if (serviceFilter !== 'all' && String(row?.service?.id || '') !== serviceFilter) {
        return false;
      }

      if (petFilter !== 'all' && String(row?.pet?.id || '') !== petFilter) {
        return false;
      }

      if (dateFilter) {
        const rowDate = String(row?.preferred_date || row?.created_at || '').slice(0, 10);
        if (rowDate !== dateFilter) {
          return false;
        }
      }

      if (normalizedSearch) {
        const haystack = [
          row?.requester?.username,
          row?.service?.service_name,
          row?.pet?.name,
          row?.status,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }

      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'service_az') {
        return String(a?.service?.service_name || '').localeCompare(String(b?.service?.service_name || ''));
      }
      if (sortBy === 'pet_az') {
        return String(a?.pet?.name || '').localeCompare(String(b?.pet?.name || ''));
      }
      if (sortBy === 'requester_az') {
        return String(a?.requester?.username || '').localeCompare(String(b?.requester?.username || ''));
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [rows, serviceFilter, petFilter, dateFilter, search, sortBy]);

  const reviewRequest = (requestId: string, decision: 'approve' | 'reject') => {
    setProcessingId(requestId);
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'reviewHealthcareAppointmentRequest', [
        requestId,
        decision,
        reviewNotes || undefined,
      ]);

      if (!result.success || result.error || !result.data) {
        setError(result.error || 'Failed to review healthcare appointment request');
        setProcessingId(null);
        return;
      }

      const updated = result.data;
      setRows((current) =>
        current.map((row) =>
          row.id === requestId
            ? {
                ...row,
                ...updated,
              }
            : row
        )
      );

      setSuccess(decision === 'approve' ? 'Appointment request approved.' : 'Appointment request rejected.');
      setTimeout(() => setSuccess(null), 3000);
      setApproveId(null);
      setRejectId(null);
      setReviewNotes('');
      setProcessingId(null);
    });
  };

  if (!rows.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="text-4xl mb-3">🩺</div>
        <p className="text-gray-600 font-medium">No healthcare requests yet.</p>
        <p className="text-gray-400 text-sm mt-1">Requests from adopters, volunteers, and regular users will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
      ) : null}
      {success ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{success}</div>
      ) : null}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2">
        <input
          type="text"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search requester, service, pet"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
        />
        <input
          type="date"
          value={dateFilter}
          onChange={(event) => setDateFilter(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
        />
        <select
          value={serviceFilter}
          onChange={(event) => setServiceFilter(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
        >
          <option value="all">All services</option>
          {serviceOptions.map((service) => (
            <option key={service.id} value={service.id}>{service.name}</option>
          ))}
        </select>
        <select
          value={petFilter}
          onChange={(event) => setPetFilter(event.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
        >
          <option value="all">All pets</option>
          {petOptions.map((pet) => (
            <option key={pet.id} value={pet.id}>{pet.name}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-xs"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="requester_az">Requester A-Z</option>
          <option value="service_az">Service A-Z</option>
          <option value="pet_az">Pet A-Z</option>
        </select>
      </div>

      {filteredRows.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          No healthcare requests match your current filters.
        </div>
      ) : null}

      {filteredRows.map((row) => {
        const effectiveStatus =
          row.status === 'approved_pending_payment' && Number(row.total_fee || 0) <= 0
            ? 'paid_scheduled'
            : row.status;
        const status = statusConfig[effectiveStatus] || statusConfig.pending_approval;
        const isExpanded = expandedId === row.id;
        const isRowProcessing = processingId === row.id || isPending;
        const appointmentDate = row.preferred_date ? new Date(`${row.preferred_date}T00:00:00`) : null;

        return (
          <div key={row.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 flex items-start gap-4">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                {row.requester?.avatar_url ? (
                  <img src={row.requester.avatar_url} alt={row.requester.username} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-lg">👤</div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{row.requester?.username || 'Unknown requester'}</p>
                    <p className="text-sm text-gray-600">
                      {row.service?.service_name || 'Healthcare service'} • {row.pet?.name || 'Unknown pet'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Requested {dateTime.format(new Date(row.created_at))}</p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Total Fee</p>
                    <p className="text-sm font-semibold text-gray-900">{money.format(Number(row.total_fee || 0))}</p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Payment</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {Number(row.total_fee || 0) > 0 ? 'Required' : 'Free service'}
                    </p>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">Appointment</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {appointmentDate ? dateOnly.format(appointmentDate) : 'Date not set'}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5">{toReadableTime(row.preferred_time)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setExpandedId(isExpanded ? null : row.id)}
                className="text-sm font-medium text-primary-700 hover:text-primary-800"
              >
                {isExpanded ? 'Hide Details' : 'View Details'}
              </button>

              {row.status === 'pending_approval' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectId(row.id)}
                    disabled={isRowProcessing}
                    className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveId(row.id)}
                    disabled={isRowProcessing}
                    className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    Approve
                  </button>
                </div>
              ) : null}
            </div>

            {isExpanded ? (
              <div className="px-4 pb-4 pt-3 border-t border-gray-100 bg-white space-y-2 text-sm">
                {row.reason ? <p className="text-gray-700"><span className="font-medium">Reason:</span> {row.reason}</p> : null}
                {row.requester_notes ? <p className="text-gray-700"><span className="font-medium">Requester Notes:</span> {row.requester_notes}</p> : null}
                {row.review_notes ? <p className="text-gray-700"><span className="font-medium">Review Notes:</span> {row.review_notes}</p> : null}
                <p className="text-gray-600">Service Fee: {money.format(Number(row.service_base_fee || 0))}</p>
                <p className="text-gray-600">Platform Fee: {money.format(Number(row.platform_service_fee || 0))}</p>
              </div>
            ) : null}

            {approveId === row.id ? (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-5">
                  <h4 className="text-lg font-semibold text-gray-900">Approve Appointment Request</h4>
                  <p className="text-sm text-gray-600 mt-1">Approval will either schedule immediately (free service) or mark as payment pending.</p>
                  <textarea
                    className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Optional review notes"
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                  />
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded-lg border border-gray-200"
                      onClick={() => {
                        setApproveId(null);
                        setReviewNotes('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                      disabled={isRowProcessing}
                      onClick={() => reviewRequest(row.id, 'approve')}
                    >
                      Confirm Approval
                    </button>
                  </div>
                </div>
              </div>
            ) : null}

            {rejectId === row.id ? (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-md w-full p-5">
                  <h4 className="text-lg font-semibold text-gray-900">Reject Appointment Request</h4>
                  <p className="text-sm text-gray-600 mt-1">Add a note so the requester knows what to adjust.</p>
                  <textarea
                    className="mt-3 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    rows={3}
                    placeholder="Reason or instructions"
                    value={reviewNotes}
                    onChange={(event) => setReviewNotes(event.target.value)}
                  />
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded-lg border border-gray-200"
                      onClick={() => {
                        setRejectId(null);
                        setReviewNotes('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="px-3 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
                      disabled={isRowProcessing}
                      onClick={() => reviewRequest(row.id, 'reject')}
                    >
                      Confirm Rejection
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
