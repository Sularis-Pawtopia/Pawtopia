'use client';

import { useEffect, useState } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface Organizer {
  id: string;
  username: string;
  avatar_url?: string;
  role: string;
}

interface BillingAccount {
  id: string;
  account_type: string;
  provider_name: string;
  account_name: string;
  account_number_last4: string;
}

interface WithdrawalRequest {
  id: string;
  organizer_id: string;
  amount_requested: number;
  estimated_transfer_fee: number;
  status: string;
  requested_at: string;
  reviewed_at?: string;
  processed_at?: string;
  review_notes?: string;
  payout_reference?: string;
  proof_urls?: string[];
  actual_transfer_fee?: number;
  organizer?: Organizer;
  billing_account?: BillingAccount;
}

type ActionMode = null | 'approve' | 'reject' | 'complete';

export function AdminWithdrawalManagementPanel() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [payoutRef, setPayoutRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [actualFee, setActualFee] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    setLoading(true);
    setError('');
    const result = await callApiAction('donations', 'getPendingWithdrawalRequests', []);
    if (result.success) {
      setWithdrawals((result.data as any) || []);
    } else {
      setError(result.error || 'Failed to load withdrawal requests');
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedWithdrawal) return;

    setError('');
    setIsSubmitting(true);

    const result = await callApiAction('donations', 'reviewWithdrawalRequest', [
      selectedWithdrawal.id,
      'approve',
      reviewNotes || undefined,
    ]);

    if (!result.success) {
      setError(result.error || 'Failed to approve withdrawal');
      setIsSubmitting(false);
      return;
    }

    setSuccess('Withdrawal request approved!');
    setActionMode(null);
    setReviewNotes('');
    setSelectedWithdrawal(null);
    await loadWithdrawals();
    setIsSubmitting(false);
  };

  const handleReject = async () => {
    if (!selectedWithdrawal) return;

    setError('');
    setIsSubmitting(true);

    const result = await callApiAction('donations', 'reviewWithdrawalRequest', [
      selectedWithdrawal.id,
      'reject',
      reviewNotes || 'Withdrawal request rejected by admin',
    ]);

    if (!result.success) {
      setError(result.error || 'Failed to reject withdrawal');
      setIsSubmitting(false);
      return;
    }

    setSuccess('Withdrawal request rejected.');
    setActionMode(null);
    setReviewNotes('');
    setSelectedWithdrawal(null);
    await loadWithdrawals();
    setIsSubmitting(false);
  };

  const handleComplete = async () => {
    if (!selectedWithdrawal) return;

    setError('');

    if (!payoutRef.trim()) {
      setError('Payout reference is required');
      return;
    }

    setIsSubmitting(true);

    const proofUrls = proofUrl.trim() ? [proofUrl] : [];

    const result = await callApiAction('donations', 'completeWithdrawalRequest', [
      {
        request_id: selectedWithdrawal.id,
        payout_reference: payoutRef,
        proof_urls: proofUrls,
        actual_transfer_fee: actualFee ? Number(actualFee) : undefined,
      },
    ]);

    if (!result.success) {
      setError(result.error || 'Failed to complete withdrawal');
      setIsSubmitting(false);
      return;
    }

    setSuccess('Withdrawal completed successfully!');
    setActionMode(null);
    setPayoutRef('');
    setProofUrl('');
    setActualFee('');
    setSelectedWithdrawal(null);
    await loadWithdrawals();
    setIsSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full font-medium">⏳ Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">✓ Approved</span>;
      case 'processing':
        return <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">⟳ Processing</span>;
      case 'completed':
        return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">✓ Completed</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">✗ Rejected</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-medium">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-gray-600">Loading withdrawal requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm">{success}</div>}

      {selectedWithdrawal && actionMode ? (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {actionMode === 'approve' && 'Approve Withdrawal'}
              {actionMode === 'reject' && 'Reject Withdrawal'}
              {actionMode === 'complete' && 'Complete Withdrawal'}
            </h3>
            <button
              onClick={() => {
                setActionMode(null);
                setSelectedWithdrawal(null);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              ✕
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <p className="text-sm">
              <strong>Organizer:</strong> {selectedWithdrawal.organizer?.username}
            </p>
            <p className="text-sm">
              <strong>Amount:</strong> PHP {selectedWithdrawal.amount_requested.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm">
              <strong>Transfer Fee (est):</strong> PHP {selectedWithdrawal.estimated_transfer_fee.toLocaleString('en-US', { maximumFractionDigits: 2 })}
            </p>
            <p className="text-sm">
              <strong>Account:</strong> {selectedWithdrawal.billing_account?.provider_name} •••• {selectedWithdrawal.billing_account?.account_number_last4}
            </p>
          </div>

          {(actionMode === 'approve' || actionMode === 'reject') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes (optional)</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add any relevant notes about this decision"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}

          {actionMode === 'complete' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Reference Number *</label>
                <input
                  type="text"
                  value={payoutRef}
                  onChange={(e) => setPayoutRef(e.target.value)}
                  placeholder="e.g., TXN-20260320-001234"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Proof Document URL</label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="e.g., https://storage.pawtopia.local/proof.pdf"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Actual Transfer Fee (PHP)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={actualFee}
                  onChange={(e) => setActualFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </>
          )}

          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setActionMode(null);
                setSelectedWithdrawal(null);
              }}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            {actionMode === 'approve' && (
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Approving...' : 'Approve'}
              </button>
            )}

            {actionMode === 'reject' && (
              <button
                onClick={handleReject}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Rejecting...' : 'Reject'}
              </button>
            )}

            {actionMode === 'complete' && (
              <button
                onClick={handleComplete}
                disabled={isSubmitting || !payoutRef}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Completing...' : 'Complete'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Pending Withdrawal Requests</h3>
            <button
              onClick={loadWithdrawals}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              ↻ Refresh
            </button>
          </div>

          {withdrawals.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No pending withdrawal requests.</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {w.organizer?.avatar_url && (
                          <img src={w.organizer.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{w.organizer?.username}</p>
                          <p className="text-xs text-gray-500">{new Date(w.requested_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Amount</p>
                          <p className="font-medium">PHP {w.amount_requested.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Account</p>
                          <p className="font-medium text-xs">
                            {w.billing_account?.provider_name} •••• {w.billing_account?.account_number_last4}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Status</p>
                          {getStatusBadge(w.status)}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setActionMode('approve');
                            }}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(w);
                              setActionMode('reject');
                            }}
                            className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {w.status === 'approved' && (
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(w);
                            setActionMode('complete');
                          }}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium hover:bg-green-200 transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
