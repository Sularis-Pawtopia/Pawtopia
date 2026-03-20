'use client';

import { useEffect, useState } from 'react';
import { callApiAction } from '@/lib/api/action-client';

interface DonationDonorPanelProps {
  campaignId: string;
  organizerName: string;
  monetaryEnabled: boolean;
  inKindEnabled: boolean;
  beneficiary?: string;
  dropoffAddress?: string;
  dropoffMapUrl?: string;
  dropoffInstructions?: string;
  currentUserId?: string;
  organizerId?: string;
}

export function DonationDonorPanel({
  campaignId,
  organizerName,
  monetaryEnabled,
  inKindEnabled,
  beneficiary,
  dropoffAddress,
  dropoffMapUrl,
  dropoffInstructions,
  currentUserId,
  organizerId,
}: DonationDonorPanelProps) {
  type CampaignDonor = {
    id: string;
    donor_label: string;
    amount_php: number;
    donated_at: string;
    donor_avatar_url?: string | null;
    is_anonymous: boolean;
  };

  const [donationMode, setDonationMode] = useState<'monetary' | 'in-kind' | null>(null);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isAnonymousDonation, setIsAnonymousDonation] = useState(false);
  const [inKindSummary, setInKindSummary] = useState('');
  const [inKindQuantity, setInKindQuantity] = useState('');
  const [inKindNotes, setInKindNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [donors, setDonors] = useState<CampaignDonor[]>([]);
  const [donorLoading, setDonorLoading] = useState(true);

  const isOrganizer = currentUserId === organizerId;

  useEffect(() => {
    const loadDonors = async () => {
      setDonorLoading(true);
      const result = await callApiAction('donations', 'getDonationCampaignDonors', [campaignId]);
      if (result.success) {
        setDonors((result.data as any) || []);
      }
      setDonorLoading(false);
    };

    void loadDonors();
  }, [campaignId]);

  const donorCount = donors.length;
  const totalRaised = donors.reduce((sum, row) => sum + Number(row.amount_php || 0), 0);

  const handleMonetaryDonation = async () => {
    setError('');
    setSuccess('');

    const amount = Number(donationAmount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Donation amount must be greater than zero');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await callApiAction('donations', 'createDonationCheckout', [
        {
          campaign_id: campaignId,
          amount_php: amount,
          donor_message: donationMessage || undefined,
          is_anonymous: isAnonymousDonation,
        },
      ]);

      if (!result.success) {
        setError(result.error || 'Failed to create donation checkout');
        setIsSubmitting(false);
        return;
      }

      const checkoutUrl = (result.data as any)?.checkout_url;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError('No checkout URL provided');
        setIsSubmitting(false);
      }
    } catch {
      setError('An error occurred while initiating donation');
      setIsSubmitting(false);
    }
  };

  const handleInKindIntent = async () => {
    setError('');
    setSuccess('');

    if (!inKindSummary.trim()) {
      setError('Please describe the items you want to donate');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await callApiAction('donations', 'createInKindDonationIntent', [
        {
          campaign_id: campaignId,
          item_summary: inKindSummary,
          quantity_label: inKindQuantity || undefined,
          donor_notes: inKindNotes || undefined,
        },
      ]);

      if (!result.success) {
        setError(result.error || 'Failed to submit in-kind donation intent');
        setIsSubmitting(false);
        return;
      }

      setSuccess('In-kind donation intent submitted! The organizer will contact you for drop-off details.');
      setInKindSummary('');
      setInKindQuantity('');
      setInKindNotes('');
      setDonationMode(null);
      setIsSubmitting(false);
    } catch {
      setError('An error occurred while submitting your intent');
      setIsSubmitting(false);
    }
  };

  if (!monetaryEnabled && !inKindEnabled) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <p className="text-sm text-gray-600">This campaign is not currently accepting donations.</p>
      </div>
    );
  }

  if (!currentUserId) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <p className="text-sm text-gray-600">Please log in to make or pledge a donation.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Support This Campaign</h3>
        <p className="text-sm text-gray-600 mb-4">
          {organizerName} is raising for {beneficiary || 'a good cause'}
        </p>
      </div>

      {isOrganizer && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700">
          This is your campaign. You cannot donate to your own donation drive.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-2 text-sm">{success}</div>
      )}

      {!isOrganizer && donationMode === null && (
        <div className="grid grid-cols-2 gap-2">
          {monetaryEnabled && (
            <button
              onClick={() => setDonationMode('monetary')}
              className="px-4 py-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
            >
              💰 Give Money
            </button>
          )}
          {inKindEnabled && (
            <button
              onClick={() => setDonationMode('in-kind')}
              className="px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-100 text-sm font-medium transition-colors"
            >
              📦 Donate Items
            </button>
          )}
        </div>
      )}

      {!isOrganizer && donationMode === 'monetary' && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Donation Amount (PHP)</label>
            <input
              type="number"
              min="1"
              value={donationAmount}
              onChange={(e) => setDonationAmount(e.target.value)}
              placeholder="10000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
            <textarea
              value={donationMessage}
              onChange={(e) => setDonationMessage(e.target.value)}
              placeholder="Leave a message of support..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={isAnonymousDonation}
              onChange={(e) => setIsAnonymousDonation(e.target.checked)}
              className="rounded border-gray-300"
            />
            Donate anonymously (organizers will see &quot;Anonymous Donor&quot;)
          </label>

          <div className="flex gap-2">
            <button
              onClick={() => setDonationMode(null)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMonetaryDonation}
              disabled={isSubmitting || !donationAmount}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 'Donate Now'}
            </button>
          </div>
        </div>
      )}

      {!isOrganizer && donationMode === 'in-kind' && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What are you donating? *</label>
            <input
              type="text"
              value={inKindSummary}
              onChange={(e) => setInKindSummary(e.target.value)}
              placeholder="e.g., Dog food, pet toys, blankets"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (optional)</label>
            <input
              type="text"
              value={inKindQuantity}
              onChange={(e) => setInKindQuantity(e.target.value)}
              placeholder="e.g., 5 bags, 10 packs"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={inKindNotes}
              onChange={(e) => setInKindNotes(e.target.value)}
              placeholder="Any special notes or conditions..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
          </div>

          {dropoffAddress && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
              <p className="font-medium text-amber-900">📍 Drop-off Location</p>
              <p className="text-amber-700 mt-1">{dropoffAddress}</p>
              {dropoffMapUrl && (
                <a href={dropoffMapUrl} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline text-xs mt-1 block">
                  View on map →
                </a>
              )}
              {dropoffInstructions && (
                <div className="mt-2 pt-2 border-t border-amber-200 text-amber-700 text-xs">{dropoffInstructions}</div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setDonationMode(null)}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleInKindIntent}
              disabled={isSubmitting || !inKindSummary}
              className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Intent'}
            </button>
          </div>
        </div>
      )}

      <div className="border-t border-gray-200 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Recent Donors</h4>
          <span className="text-xs text-gray-600">
            {donorCount} donor{donorCount === 1 ? '' : 's'} • PHP {totalRaised.toLocaleString('en-US', { maximumFractionDigits: 2 })}
          </span>
        </div>

        {donorLoading ? (
          <p className="text-xs text-gray-500">Loading donors...</p>
        ) : donors.length === 0 ? (
          <p className="text-xs text-gray-500">No paid donations yet.</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-auto pr-1">
            {donors.slice(0, 12).map((donor) => (
              <div key={donor.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-2 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  {donor.donor_avatar_url ? (
                    <img src={donor.donor_avatar_url} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">•</div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{donor.donor_label}</p>
                    <p className="text-[10px] text-gray-500">{new Date(donor.donated_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-emerald-700">PHP {Number(donor.amount_php || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
