'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface MyHealthcareAppointmentsProps {
  initialRequests: any[];
}

const statusConfig: Record<string, { label: string; color: string; message: string }> = {
  pending_approval: {
    label: 'Pending Approval',
    color: 'bg-yellow-100 text-yellow-800',
    message: 'DVMF is reviewing your request before scheduling.',
  },
  approved_pending_payment: {
    label: 'Payment Required',
    color: 'bg-blue-100 text-blue-800',
    message: 'Your request is approved. Complete Maya checkout to finalize the schedule.',
  },
  paid_scheduled: {
    label: 'Scheduled',
    color: 'bg-green-100 text-green-800',
    message: 'Payment confirmed and slot scheduled.',
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800',
    message: 'DVMF declined this request. Review notes for details.',
  },
  completed: {
    label: 'Completed',
    color: 'bg-indigo-100 text-indigo-800',
    message: 'Healthcare appointment has been completed.',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-gray-100 text-gray-700',
    message: 'This appointment request has been cancelled.',
  },
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

export function MyHealthcareAppointments({ initialRequests }: MyHealthcareAppointmentsProps) {
  const [requests, setRequests] = useState<any[]>(initialRequests || []);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncingPaymentIds, setSyncingPaymentIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [serviceFilter, setServiceFilter] = useState('all');
  const [petFilter, setPetFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'service_az' | 'pet_az'>('newest');
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRequests(initialRequests || []);
  }, [initialRequests]);

  useEffect(() => {
    const candidates = (initialRequests || []).filter(
      (request: any) => request.status === 'approved_pending_payment' && Boolean(request.payment_required)
    );

    if (candidates.length === 0) {
      return;
    }

    let cancelled = false;
    setSyncingPaymentIds(candidates.map((request: any) => request.id));

    const syncPendingPayments = async () => {
      const search = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const fromSuccessReturn = search?.get('healthcarePayment') === 'success';

      for (const request of candidates) {
        if (fromSuccessReturn) {
          await callApiAction<any>('healthcare', 'syncMayaPaymentStatus', [request.id, { assumePaidOnSuccessReturn: true }]);
        } else {
          await callApiAction<any>('healthcare', 'syncMayaPaymentStatus', [request.id]);
        }
      }

      const refreshed = await callApiAction<any>('healthcare', 'getMyHealthcareAppointmentRequests', []);
      if (!cancelled && refreshed.success && Array.isArray(refreshed.data)) {
        setRequests(refreshed.data);
      }

      if (!cancelled) {
        setSyncingPaymentIds([]);
      }
    };

    syncPendingPayments();

    return () => {
      cancelled = true;
    };
  }, [initialRequests]);

  const initiateCheckout = (requestId: string) => {
    setError(null);
    setProcessingId(requestId);

    startTransition(async () => {
      const result = await callApiAction<any>('healthcare', 'initiateMayaCheckout', [requestId]);

      if (!result.success || result.error || !result.data?.checkout_url) {
        setError(result.error || 'Could not initiate Maya checkout.');
        setProcessingId(null);
        return;
      }

      setRequests((current) =>
        current.map((row) =>
          row.id === requestId
            ? {
                ...row,
                payment_transaction: {
                  ...(row.payment_transaction || {}),
                  provider_checkout_url: result.data.checkout_url,
                  provider_reference: result.data.checkout_id,
                  status: 'pending',
                },
              }
            : row
        )
      );

      window.location.href = result.data.checkout_url;
    });
  };

  const serviceOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of requests) {
      const id = String(request?.service?.id || '');
      const name = String(request?.service?.service_name || '').trim();
      if (!id || !name) continue;
      map.set(id, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const petOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const request of requests) {
      const id = String(request?.pet?.id || '');
      const name = String(request?.pet?.name || '').trim();
      if (!id || !name) continue;
      map.set(id, name);
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = requests.filter((request) => {
      if (serviceFilter !== 'all' && String(request?.service?.id || '') !== serviceFilter) {
        return false;
      }

      if (petFilter !== 'all' && String(request?.pet?.id || '') !== petFilter) {
        return false;
      }

      if (dateFilter) {
        const requestDate = String(request?.preferred_date || request?.created_at || '').slice(0, 10);
        if (requestDate !== dateFilter) {
          return false;
        }
      }

      if (normalizedSearch) {
        const haystack = [
          request?.service?.service_name,
          request?.pet?.name,
          request?.dvmf?.username,
          request?.status,
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
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return filtered;
  }, [requests, serviceFilter, petFilter, dateFilter, search, sortBy]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-1">My Healthcare Appointments</h3>
      <p className="text-xs text-gray-500 mb-4">Track approval, payment, and scheduling progress.</p>

      {error ? (
        <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">{error}</div>
      ) : null}

      {requests.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-200 p-4 text-xs text-gray-500">
          No healthcare requests yet. Submit one using the booking card.
        </div>
      ) : (
        <>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 mb-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search service, pet, or DVMF"
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
              <option value="service_az">Service A-Z</option>
              <option value="pet_az">Pet A-Z</option>
            </select>
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 p-4 text-xs text-gray-500">
              No appointments match your current filters.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredRequests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.pending_approval;
            const canPay = request.status === 'approved_pending_payment' && request.payment_required;
            const isProcessing = (isPending && processingId === request.id) || processingId === request.id;
            const isSyncingPayment = syncingPaymentIds.includes(request.id);

            return (
              <div key={request.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{request.service?.service_name || 'Healthcare service'}</p>
                    <p className="text-xs text-gray-600">
                      {request.pet?.name || 'Unknown pet'} • {request.dvmf?.username || 'DVMF'}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-1">Requested {dateTime.format(new Date(request.created_at))}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-2">{status.message}</p>
                {isSyncingPayment ? <p className="text-[11px] text-blue-600 mt-1">Checking Maya payment status...</p> : null}

                <div className="mt-2 text-xs text-gray-700 space-y-1">
                  <p>Total Fee: {request.payment_required ? money.format(Number(request.total_fee || 0)) : 'PHP 0.00 (Free Service)'}</p>
                  {request.slot ? <p>Slot: {dateTime.format(new Date(request.slot.slot_start))}</p> : <p>Slot assignment pending</p>}
                  {request.status === 'cancelled' && request.review_notes ? <p>Cancellation Reason: {request.review_notes}</p> : null}
                  {request.review_notes ? <p>DVMF Notes: {request.review_notes}</p> : null}
                </div>

                {canPay ? (
                  <button
                    type="button"
                    onClick={() => initiateCheckout(request.id)}
                    disabled={isProcessing}
                    className="mt-3 w-full px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isProcessing ? 'Redirecting to Maya...' : 'Pay with Maya (Sandbox)'}
                  </button>
                ) : null}
              </div>
              );
            })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
