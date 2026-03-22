'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { callApiAction } from '@/lib/api/action-client';
import { Skeleton } from '@/components/ui/Skeleton';

interface OrganizerBillingAccount {
  id: string;
  account_type: 'bank' | 'e_wallet';
  provider_name: string;
  account_name: string;
  account_number_last4: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

interface OrganizerBalanceData {
  total_received: number;
  total_fees: number;
  withdrawn: number;
  pending_withdrawal: number;
  available_balance: number;
}

export function OrganizerBillingPanel() {
  const [accounts, setAccounts] = useState<OrganizerBillingAccount[]>([]);
  const [balance, setBalance] = useState<OrganizerBalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    account_type: 'bank' as const,
    provider_name: '',
    account_name: '',
    account_number: '',
    is_default: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    const [accountsResult, balanceResult] = await Promise.all([
      callApiAction('donations', 'getOrganizerBillingAccounts', []),
      callApiAction('donations', 'getOrganizerDonationDashboard', []),
    ]);

    if (!accountsResult.success) {
      setError(accountsResult.error || 'Failed to load billing accounts');
    } else {
      setAccounts((accountsResult.data as any) || []);
    }

    if (balanceResult.success && balanceResult.data) {
      setBalance((balanceResult.data as any).balance);
    }

    setLoading(false);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!formData.provider_name.trim() || !formData.account_name.trim() || !formData.account_number.trim()) {
      setError('All fields are required');
      setIsSubmitting(false);
      return;
    }

    const result = await callApiAction('donations', 'upsertOrganizerBillingAccount', [
      {
        account_type: formData.account_type,
        provider_name: formData.provider_name,
        account_name: formData.account_name,
        account_number: formData.account_number,
        is_default: formData.is_default,
      },
    ]);

    if (!result.success) {
      setError(result.error || 'Failed to save billing account');
      setIsSubmitting(false);
      return;
    }

    setFormData({
      account_type: 'bank',
      provider_name: '',
      account_name: '',
      account_number: '',
      is_default: false,
    });
    setShowAddForm(false);
    await loadData();
    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="space-y-3">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={`balance-skeleton-${index}`} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-10 w-44" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}

      {/* Balance Overview */}
      {balance && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Balance Overview</h3>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Total Received</p>
              <p className="text-2xl font-bold text-green-700 mt-1">PHP {balance.total_received.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Fees</p>
              <p className="text-2xl font-bold text-amber-700 mt-1">-PHP {balance.total_fees.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Available Balance</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">PHP {balance.available_balance.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Withdrawn</p>
              <p className="text-xl font-bold text-purple-700 mt-1">PHP {balance.withdrawn.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-xs text-gray-600 uppercase tracking-wide">Pending Withdrawal</p>
              <p className="text-xl font-bold text-orange-700 mt-1">PHP {balance.pending_withdrawal.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Billing Accounts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">Payout Accounts</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
          >
            {showAddForm ? 'Cancel' : '+ Add Account'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddAccount} className="border-t border-gray-200 pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData({ ...formData, account_type: (e.target.value as any) as typeof formData.account_type })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="bank">Bank Account</option>
                  <option value="e_wallet">E-Wallet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider (Bank/Service) *</label>
                <input
                  type="text"
                  value={formData.provider_name}
                  onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                  placeholder="e.g., BDO, GCash, PayMaya"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Holder Name *</label>
                <input
                  type="text"
                  value={formData.account_name}
                  onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                  placeholder="Full name on account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Number *</label>
                <input
                  type="text"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  placeholder="Full account number (encrypted)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_default}
                    onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Set as default withdrawal account</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Saving...' : 'Save Account'}
            </button>
          </form>
        )}

        {accounts.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-4">No payout accounts added yet.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div key={account.id} className={`border rounded-lg p-3 ${account.is_default ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{account.provider_name}</p>
                    <p className="text-sm text-gray-600">{account.account_name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {account.account_type === 'bank' ? '🏦' : '📱'} •••• {account.account_number_last4}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium ${account.is_default ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-700'}`}>
                    {account.is_default ? 'Default' : 'Secondary'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Withdrawal Button */}
      {balance && balance.available_balance > 0 && accounts.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h4 className="font-semibold text-green-900 mb-2">Ready to Withdraw?</h4>
          <p className="text-sm text-green-700 mb-4">You have PHP {balance.available_balance.toLocaleString('en-US', { maximumFractionDigits: 2 })} available to request.</p>
          <Link
            href="/dashboard/donations/withdraw"
            className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
          >
            Request Withdrawal
          </Link>
        </div>
      )}
    </div>
  );
}
