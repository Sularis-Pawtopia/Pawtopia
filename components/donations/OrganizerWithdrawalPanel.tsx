'use client';

import { useEffect, useState } from 'react';
import { callApiAction } from '@/lib/api/action-client';
import { Skeleton } from '@/components/ui/Skeleton';

interface WithdrawalRequest {
  id: string;
  amount_requested: number;
  estimated_transfer_fee: number;
  status: string;
  billing_account_id: string;
  requested_at: string;
  reviewed_at?: string;
  processed_at?: string;
  review_notes?: string;
  payout_reference?: string;
  billing_account?: {
    id: string;
    account_type: string;
    provider_name: string;
    account_name: string;
    account_number_last4: string;
  };
}

interface BillingAccount {
  id: string;
  account_type: 'bank' | 'e_wallet';
  provider_name: string;
  account_name: string;
  account_number_last4: string;
  is_active: boolean;
}

interface OrganizerBalanceData {
  total_received: number;
  total_fees: number;
  withdrawn: number;
  pending_withdrawal: number;
  available_balance: number;
}

interface WithdrawalFormData {
  billing_account_id: string;
  amount_requested: string;
}

export function OrganizerWithdrawalPanel({
  balance,
  accounts,
}: {
  balance?: OrganizerBalanceData;
  accounts?: BillingAccount[];
}) {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<WithdrawalFormData>({
    billing_account_id: '',
    amount_requested: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    setLoading(true);
    const result = await callApiAction('donations', 'getOrganizerWithdrawalRequests', []);
    if (result.success) {
      setWithdrawals((result.data as any) || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.billing_account_id || !formData.amount_requested) {
      setError('Please select an account and enter an amount');
      return;
    }

    const amount = Number(formData.amount_requested);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }

    if (balance && amount > balance.available_balance) {
      setError('Insufficient available balance');
      return;
    }

    setIsSubmitting(true);
    const result = await callApiAction('donations', 'createWithdrawalRequest', [
      {
        billing_account_id: formData.billing_account_id,
        amount_requested: amount,
      },
    ]);

    if (!result.success) {
      setError(result.error || 'Failed to create withdrawal request');
      setIsSubmitting(false);
      return;
    }

    setSuccess('Withdrawal request submitted! You will be notified once it is reviewed.');
    setFormData({ billing_account_id: '', amount_requested: '' });
    setShowForm(false);
    await loadWithdrawals();
    setIsSubmitting(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'approved':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'processing':
        return 'bg-purple-50 border-purple-200 text-purple-800';
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '⏳ Pending';
      case 'approved':
        return '✓ Approved';
      case 'processing':
        return '⟳ Processing';
      case 'completed':
        return '✓ Completed';
      case 'rejected':
        return '✗ Rejected';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

      {success && <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm">{success}</div>}

      {/* Request Form */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">New Withdrawal Request</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showForm ? 'Cancel' : 'Request Withdrawal'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="border-t border-gray-200 pt-4 space-y-4">
            {balance && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900">
                  Available balance: <strong>PHP {balance.available_balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</strong>
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payout Account *</label>
              <select
                value={formData.billing_account_id}
                onChange={(e) => setFormData({ ...formData, billing_account_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select a payout account</option>
                {accounts?.filter((a) => a.is_active).map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.provider_name} •••• {account.account_number_last4}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Withdraw (PHP) *</label>
              <input
                type="number"
                min="1"
                value={formData.amount_requested}
                onChange={(e) => setFormData({ ...formData, amount_requested: e.target.value })}
                placeholder="10000"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              {balance && (
                <p className="text-xs text-gray-500 mt-1">Transfer fee will be deducted: PHP {balance.available_balance === 0 ? 0 : balance.available_balance}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !formData.billing_account_id || !formData.amount_requested}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Withdrawal History</h3>

        {withdrawals.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-4">No withdrawal requests yet.</p>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <div key={w.id} className={`border rounded-lg p-4 ${getStatusColor(w.status)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">PHP {w.amount_requested.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full inline-block border`}>{getStatusLabel(w.status)}</span>
                    </div>

                    {w.billing_account && (
                      <p className="text-sm mb-1">
                        {w.billing_account.provider_name} •••• {w.billing_account.account_number_last4}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-xs mt-2">
                      <div>
                        <p className="text-gray-600">Requested</p>
                        <p className="font-medium">{new Date(w.requested_at).toLocaleDateString()}</p>
                      </div>
                      {w.reviewed_at && (
                        <div>
                          <p className="text-gray-600">Reviewed</p>
                          <p className="font-medium">{new Date(w.reviewed_at).toLocaleDateString()}</p>
                        </div>
                      )}
                      {w.processed_at && (
                        <div>
                          <p className="text-gray-600">Processed</p>
                          <p className="font-medium">{new Date(w.processed_at).toLocaleDateString()}</p>
                        </div>
                      )}
                    </div>

                    {w.review_notes && (
                      <div className="text-xs mt-2 p-2 bg-black bg-opacity-5 rounded">
                        <p className="font-medium">Review Notes:</p>
                        <p>{w.review_notes}</p>
                      </div>
                    )}

                    {w.payout_reference && (
                      <div className="text-xs mt-2">
                        <p className="font-medium">Payout Ref: {w.payout_reference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
