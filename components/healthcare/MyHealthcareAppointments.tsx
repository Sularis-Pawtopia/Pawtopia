'use client';

import { useEffect, useState, useTransition } from 'react';
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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRequests(initialRequests || []);
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
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
          {requests.map((request) => {
            const status = statusConfig[request.status] || statusConfig.pending_approval;
            const canPay = request.status === 'approved_pending_payment' && request.payment_required;
            const isProcessing = (isPending && processingId === request.id) || processingId === request.id;

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

                <div className="mt-2 text-xs text-gray-700 space-y-1">
                  <p>Total Fee: {request.payment_required ? money.format(Number(request.total_fee || 0)) : 'PHP 0.00 (Free Service)'}</p>
                  {request.slot ? <p>Slot: {dateTime.format(new Date(request.slot.slot_start))}</p> : <p>Slot assignment pending</p>}
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
    </div>
  );
}
