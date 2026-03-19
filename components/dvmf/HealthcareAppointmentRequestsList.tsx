'use client';

import { useEffect, useState, useTransition } from 'react';
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

export function HealthcareAppointmentRequestsList({ requests }: HealthcareAppointmentRequestsListProps) {
  const [rows, setRows] = useState<any[]>(requests);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setRows(requests);
  }, [requests]);

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

      {rows.map((row) => {
        const status = statusConfig[row.status] || statusConfig.pending_approval;
        const isExpanded = expandedId === row.id;
        const isRowProcessing = processingId === row.id || isPending;

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

                <div className="mt-2 text-sm text-gray-700 flex flex-wrap gap-3">
                  <span>Fee: {money.format(Number(row.total_fee || 0))}</span>
                  <span>Payment: {row.payment_required ? 'Required' : 'Free service'}</span>
                  {row.slot ? <span>Slot: {dateTime.format(new Date(row.slot.slot_start))}</span> : <span>Slot: Not assigned</span>}
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
