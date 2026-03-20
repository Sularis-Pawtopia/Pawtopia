'use server';

import { revalidatePath } from 'next/cache';
import {
  createDonationCheckoutService,
  createInKindDonationIntentService,
  createWithdrawalRequestService,
  getInKindDonationIntentsService,
  getMyDonationTransactionsService,
  getOrganizerBillingAccountsService,
  getDonationCampaignDonorsService,
  getOrganizerDonationDashboardService,
  getOrganizerWithdrawalRequestsService,
  getPendingWithdrawalRequestsService,
  reviewWithdrawalRequestService,
  syncDonationPaymentStatusService,
  syncDonationPaymentStatusByRequestRefService,
  upsertOrganizerBillingAccountService,
  completeWithdrawalRequestService,
  type CreateDonationCheckoutInput,
  type CreateWithdrawalRequestInput,
  type UpsertOrganizerBillingAccountInput,
} from '@/lib/server/services/donation.service';

export async function createDonationCheckout(input: CreateDonationCheckoutInput) {
  return createDonationCheckoutService(input);
}

export async function syncDonationPaymentStatus(transactionId: string, options?: { assumePaidOnSuccessReturn?: boolean }) {
  const result = await syncDonationPaymentStatusService(transactionId, options);
  if (result.success) {
    revalidatePath('/events');
  }
  return result;
}

export async function syncDonationPaymentStatusByRequestRef(
  requestReferenceNumber: string,
  options?: { assumePaidOnSuccessReturn?: boolean }
) {
  const result = await syncDonationPaymentStatusByRequestRefService(requestReferenceNumber, options);
  if (result.success) {
    revalidatePath('/events');
  }
  return result;
}

export async function getMyDonationTransactions() {
  return getMyDonationTransactionsService();
}

export async function getOrganizerDonationDashboard() {
  return getOrganizerDonationDashboardService();
}

export async function upsertOrganizerBillingAccount(input: UpsertOrganizerBillingAccountInput) {
  const result = await upsertOrganizerBillingAccountService(input);
  if (result.success) {
    revalidatePath('/settings');
    revalidatePath('/dashboard');
  }
  return result;
}

export async function getOrganizerBillingAccounts() {
  return getOrganizerBillingAccountsService();
}

export async function createWithdrawalRequest(input: CreateWithdrawalRequestInput) {
  const result = await createWithdrawalRequestService(input);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/settings');
  }
  return result;
}

export async function getOrganizerWithdrawalRequests() {
  return getOrganizerWithdrawalRequestsService();
}

export async function getPendingWithdrawalRequests() {
  return getPendingWithdrawalRequestsService();
}

export async function reviewWithdrawalRequest(requestId: string, decision: 'approve' | 'reject', reviewNotes?: string) {
  const result = await reviewWithdrawalRequestService(requestId, decision, reviewNotes);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/settings');
  }
  return result;
}

export async function completeWithdrawalRequest(input: {
  request_id: string;
  payout_reference: string;
  proof_urls: string[];
  actual_transfer_fee?: number;
}) {
  const result = await completeWithdrawalRequestService(input);
  if (result.success) {
    revalidatePath('/dashboard');
    revalidatePath('/settings');
  }
  return result;
}

export async function createInKindDonationIntent(input: {
  campaign_id: string;
  item_summary: string;
  quantity_label?: string;
  donor_notes?: string;
  estimated_dropoff_at?: string;
}) {
  const result = await createInKindDonationIntentService(input);
  if (result.success) {
    revalidatePath('/events');
    revalidatePath(`/events/${input.campaign_id}`);
  }
  return result;
}

export async function getInKindDonationIntents(campaignId?: string) {
  return getInKindDonationIntentsService(campaignId);
}

export async function getDonationCampaignDonors(campaignId: string) {
  return getDonationCampaignDonorsService(campaignId);
}
