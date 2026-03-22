import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyMayaSignature } from '@/lib/server/utils/maya-crypto';

export type DonationPaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';
export type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'failed';

export type CreateDonationCheckoutInput = {
  campaign_id: string;
  amount_php: number;
  donor_message?: string;
  is_anonymous?: boolean;
};

export type UpsertOrganizerBillingAccountInput = {
  id?: string;
  account_type: 'bank' | 'e_wallet';
  provider_name: string;
  account_name: string;
  account_number: string;
  account_metadata?: Record<string, unknown>;
  is_default?: boolean;
  is_active?: boolean;
};

export type CreateWithdrawalRequestInput = {
  billing_account_id: string;
  amount_requested: number;
};

function normalizeMayaBaseUrl() {
  return (process.env.MAYA_SANDBOX_BASE_URL || 'https://pg-sandbox.paymaya.com').replace(/\/$/, '');
}

function resolveMayaCredentials() {
  const apiKey = process.env.DONATION_MAYA_API_KEY || process.env.MAYA_API_KEY;
  const secretKey = process.env.DONATION_MAYA_SECRET_KEY || process.env.MAYA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return { error: 'Maya donation credentials are not configured' as const };
  }

  return { apiKey, secretKey };
}

function resolveFrontendBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function isRequestReferenceNumber(value?: string | null) {
  if (!value) return false;
  return /^don-[a-f0-9]{8}-\d+$/i.test(String(value));
}

function extractCheckoutId(payload: any) {
  return payload?.checkoutId || payload?.id || payload?.resource?.id || payload?.data?.checkoutId || payload?.data?.id || null;
}

function extractCheckoutUrl(payload: any) {
  return payload?.redirectUrl || payload?.checkoutUrl || payload?.url || payload?.paymentUrl || null;
}

function extractCheckoutIdFromUrl(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get('id') || null;
  } catch {
    return null;
  }
}

function mapWebhookStatus(rawStatus: string | null | undefined): DonationPaymentStatus {
  const status = String(rawStatus || '').toLowerCase();

  if (['paid', 'payment_success', 'payment_successful', 'success', 'completed', 'executed', 'captured', 'authorized'].includes(status)) {
    return 'paid';
  }

  if (['cancelled', 'canceled', 'voided'].includes(status)) {
    return 'cancelled';
  }

  if (['refunded', 'partial_refunded'].includes(status)) {
    return 'refunded';
  }

  if (['failed', 'payment_failed', 'declined', 'expired'].includes(status)) {
    return 'failed';
  }

  return 'pending';
}

async function fetchMayaCheckoutStatus(checkoutId: string) {
  const credentials = resolveMayaCredentials();
  if ('error' in credentials) {
    return { success: false as const, error: credentials.error };
  }

  const authorization = Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString('base64');
  const response = await fetch(`${normalizeMayaBaseUrl()}/checkout/v1/checkouts/${checkoutId}`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${authorization}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  const raw = await response.text();
  let payload: any;
  try {
    payload = JSON.parse(raw);
  } catch {
    payload = { raw };
  }

  if (!response.ok) {
    return { success: false as const, error: payload?.message || 'Failed to fetch Maya checkout status' };
  }

  return {
    success: true as const,
    payload,
    status: mapWebhookStatus(payload?.status || payload?.paymentStatus || payload?.event || payload?.data?.status),
  };
}

async function getCurrentUserWithRole() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'Not authenticated' as const };
  }

  const db = supabase as any;
  const { data: profile, error } = await db
    .from('users')
    .select('id, role, is_verified, email, username')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { error: 'User profile not found' as const };
  }

  return {
    db,
    user: profile as { id: string; role: string; is_verified?: boolean; email?: string | null; username?: string | null },
  };
}

async function recomputeOrganizerBalance(admin: any, organizerId: string) {
  const [donationsResult, completedWithdrawalsResult, pendingWithdrawalsResult] = await Promise.all([
    admin
      .from('donation_transactions')
      .select('amount_gross, processor_fee, transfer_fee')
      .eq('organizer_id', organizerId)
      .eq('status', 'paid'),
    admin
      .from('withdrawal_requests')
      .select('amount_requested, actual_transfer_fee')
      .eq('organizer_id', organizerId)
      .eq('status', 'completed'),
    admin
      .from('withdrawal_requests')
      .select('amount_reserved')
      .eq('organizer_id', organizerId)
      .in('status', ['pending', 'approved', 'processing']),
  ]);

  if (donationsResult.error) {
    throw new Error(donationsResult.error.message);
  }
  if (completedWithdrawalsResult.error) {
    throw new Error(completedWithdrawalsResult.error.message);
  }
  if (pendingWithdrawalsResult.error) {
    throw new Error(pendingWithdrawalsResult.error.message);
  }

  const paidDonations = donationsResult.data || [];
  const completedWithdrawals = completedWithdrawalsResult.data || [];
  const pendingWithdrawals = pendingWithdrawalsResult.data || [];

  const totalReceived = paidDonations.reduce((sum: number, row: any) => sum + Number(row.amount_gross || 0), 0);
  const donationFees = paidDonations.reduce(
    (sum: number, row: any) => sum + Number(row.processor_fee || 0) + Number(row.transfer_fee || 0),
    0
  );
  const withdrawn = completedWithdrawals.reduce((sum: number, row: any) => sum + Number(row.amount_requested || 0), 0);
  const withdrawalFees = completedWithdrawals.reduce((sum: number, row: any) => sum + Number(row.actual_transfer_fee || 0), 0);
  const pendingWithdrawal = pendingWithdrawals.reduce((sum: number, row: any) => sum + Number(row.amount_reserved || 0), 0);

  const { error: upsertError } = await admin
    .from('organizer_balances')
    .upsert({
      organizer_id: organizerId,
      total_received: totalReceived,
      total_fees: donationFees + withdrawalFees,
      withdrawn,
      pending_withdrawal: pendingWithdrawal,
      updated_at: new Date().toISOString(),
    });

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  return {
    total_received: totalReceived,
    total_fees: donationFees + withdrawalFees,
    withdrawn,
    pending_withdrawal: pendingWithdrawal,
    available_balance: totalReceived - (donationFees + withdrawalFees) - withdrawn - pendingWithdrawal,
  };
}

async function appendBalanceLedger(
  admin: any,
  input: {
    organizerId: string;
    transactionType: string;
    amountPhp: number;
    referenceType?: string;
    referenceId?: string;
    notes?: string;
    createdBy?: string;
  }
) {
  await admin.from('balance_ledger').insert({
    organizer_id: input.organizerId,
    transaction_type: input.transactionType,
    amount_php: input.amountPhp,
    reference_type: input.referenceType || null,
    reference_id: input.referenceId || null,
    notes: input.notes || null,
    created_by: input.createdBy || null,
  });
}

function resolveProcessorFeePhp() {
  const raw = Number(process.env.DONATION_PROCESSOR_FEE_PHP || 0);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function resolveEstimatedTransferFeePhp() {
  const raw = Number(process.env.DONATION_WITHDRAWAL_TRANSFER_FEE_PHP || 0);
  return Number.isFinite(raw) && raw >= 0 ? raw : 0;
}

function encryptAccountNumber(accountNumber: string) {
  const secret = process.env.BILLING_ACCOUNT_ENCRYPTION_KEY;
  if (!secret) {
    return accountNumber;
  }

  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(accountNumber, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

export async function createDonationCheckoutService(input: CreateDonationCheckoutInput) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    const credentials = resolveMayaCredentials();
    if ('error' in credentials) {
      return { success: false, error: credentials.error };
    }

    const amount = Number(input.amount_php || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Donation amount must be greater than zero' };
    }

    const { data: campaign, error: campaignError } = await db
      .from('events')
      .select('id, event_name, event_type, organizer_id, donation_monetary_enabled')
      .eq('id', input.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return { success: false, error: 'Donation campaign not found' };
    }

    if (campaign.event_type !== 'donation_drive' || !campaign.donation_monetary_enabled) {
      return { success: false, error: 'This campaign is not accepting monetary donations' };
    }

    if (campaign.organizer_id === user.id) {
      return { success: false, error: 'Organizers cannot donate to their own campaign' };
    }

    const processorFee = resolveProcessorFeePhp();
    const transactionId = crypto.randomUUID();
    const isAnonymous = Boolean(input.is_anonymous);
    const donorDisplayName = isAnonymous ? null : user.username || user.email || 'Pawtopia Donor';
    const requestReferenceNumber = `don-${String(campaign.id).slice(0, 8)}-${Date.now()}`;
    const frontendBase = resolveFrontendBaseUrl().replace(/\/$/, '');

    const payload = {
      totalAmount: {
        currency: 'PHP',
        value: amount,
      },
      requestReferenceNumber,
      redirectUrl: {
        success: `${frontendBase}/events/${campaign.id}?donation=success&requestRef=${requestReferenceNumber}&tx=${transactionId}`,
        failure: `${frontendBase}/events/${campaign.id}?donation=failure&requestRef=${requestReferenceNumber}&tx=${transactionId}`,
        cancel: `${frontendBase}/events/${campaign.id}?donation=cancelled&requestRef=${requestReferenceNumber}&tx=${transactionId}`,
      },
      metadata: {
        donation_transaction_id: transactionId,
        campaign_id: campaign.id,
        organizer_id: campaign.organizer_id,
        donor_id: user.id,
        is_anonymous: isAnonymous,
      },
      items: [
        {
          name: `Donation - ${campaign.event_name || 'Pawtopia Campaign'}`,
          quantity: 1,
          amount: {
            value: amount,
            details: {
              subtotal: amount,
              serviceCharge: 0,
              discount: 0,
            },
          },
          totalAmount: {
            value: amount,
            currency: 'PHP',
          },
        },
      ],
    };

    const authorization = Buffer.from(`${credentials.apiKey}:${credentials.secretKey}`).toString('base64');
    const response = await fetch(`${normalizeMayaBaseUrl()}/checkout/v1/checkouts`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authorization}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    const raw = await response.text();
    let responsePayload: any;
    try {
      responsePayload = JSON.parse(raw);
    } catch {
      responsePayload = { raw };
    }

    if (!response.ok) {
      return { success: false, error: responsePayload?.message || 'Failed to initialize donation checkout' };
    }

    const checkoutIdRaw = extractCheckoutId(responsePayload);
    const checkoutUrl = extractCheckoutUrl(responsePayload);
    const checkoutId = !isRequestReferenceNumber(checkoutIdRaw)
      ? checkoutIdRaw
      : extractCheckoutIdFromUrl(checkoutUrl);

    if (!checkoutId || !checkoutUrl) {
      return { success: false, error: 'Maya response missing checkout reference or URL' };
    }

    const { data: transaction, error: txError } = await db
      .from('donation_transactions')
      .insert({
        id: transactionId,
        campaign_id: campaign.id,
        organizer_id: campaign.organizer_id,
        donor_id: user.id,
        amount_gross: amount,
        processor_fee: processorFee,
        transfer_fee: 0,
        currency: 'PHP',
        status: 'pending',
        provider: 'maya',
        provider_reference: checkoutId,
        provider_checkout_url: checkoutUrl,
        request_reference_number: requestReferenceNumber,
        donor_message: input.donor_message || null,
        donor_is_anonymous: isAnonymous,
        donor_display_name: donorDisplayName,
        provider_payload: {
          ...payload,
          maya_checkout_id: checkoutId,
        },
      })
      .select('id')
      .single();

    if (txError || !transaction) {
      return { success: false, error: txError?.message || 'Failed to create donation transaction record' };
    }

    return {
      success: true,
      data: {
        transaction_id: transaction.id,
        checkout_id: checkoutId,
        checkout_url: checkoutUrl,
      },
    };
  } catch {
    return { success: false, error: 'Unexpected error while creating donation checkout' };
  }
}

export async function processDonationMayaWebhookService(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.MAYA_DONATION_WEBHOOK_SECRET || process.env.MAYA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return { success: false, statusCode: 500, error: 'Maya donation webhook secret is not configured' };
  }

  if (!verifyMayaSignature(rawBody, signature, webhookSecret)) {
    return { success: false, statusCode: 401, error: 'Invalid Maya webhook signature' };
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return { success: false, statusCode: 400, error: 'Invalid webhook payload' };
  }

  const providerReference =
    payload?.id ||
    payload?.checkoutId ||
    payload?.transactionId ||
    payload?.resource?.id ||
    payload?.resource?.checkoutId ||
    payload?.data?.id ||
    payload?.data?.checkoutId ||
    null;

  const requestReferenceNumber =
    payload?.requestReferenceNumber ||
    payload?.resource?.requestReferenceNumber ||
    payload?.data?.requestReferenceNumber ||
    null;

  if (!providerReference && !requestReferenceNumber) {
    return { success: false, statusCode: 400, error: 'Webhook is missing transaction reference' };
  }

  const mappedStatus = mapWebhookStatus(payload?.status || payload?.paymentStatus || payload?.event || payload?.data?.status);
  const admin = createAdminClient() as any;

  let transaction: any = null;
  if (providerReference) {
    const result = await admin
      .from('donation_transactions')
      .select('*')
      .eq('provider_reference', providerReference)
      .maybeSingle();
    transaction = result.data || null;
  }

  if (!transaction && requestReferenceNumber) {
    const result = await admin
      .from('donation_transactions')
      .select('*')
      .eq('request_reference_number', requestReferenceNumber)
      .maybeSingle();
    transaction = result.data || null;
  }

  if (!transaction) {
    return { success: false, statusCode: 404, error: 'Donation transaction not found' };
  }

  const alreadyPaid = transaction.status === 'paid';
  const paidAt = mappedStatus === 'paid' ? new Date().toISOString() : null;

  const { error: updateError } = await admin
    .from('donation_transactions')
    .update({
      status: mappedStatus,
      provider_reference: providerReference || transaction.provider_reference,
      provider_callback_payload: payload,
      paid_at: paidAt || transaction.paid_at,
      updated_at: new Date().toISOString(),
    })
    .eq('id', transaction.id);

  if (updateError) {
    return { success: false, statusCode: 500, error: updateError.message };
  }

  if (mappedStatus === 'paid' && !alreadyPaid) {
    await recomputeOrganizerBalance(admin, transaction.organizer_id);
    await appendBalanceLedger(admin, {
      organizerId: transaction.organizer_id,
      transactionType: 'donation_paid',
      amountPhp: Number(transaction.amount_net || 0),
      referenceType: 'donation_transaction',
      referenceId: transaction.id,
      notes: `Donation payment received from donor ${transaction.donor_id}`,
    });
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      transaction_id: transaction.id,
      payment_status: mappedStatus,
      provider_reference: providerReference || transaction.provider_reference,
    },
  };
}

export async function syncDonationPaymentStatusService(
  transactionId: string,
  options?: { assumePaidOnSuccessReturn?: boolean }
) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { user } = auth;
    const admin = createAdminClient() as any;

    const { data: transaction, error: txError } = await admin
      .from('donation_transactions')
      .select('*')
      .eq('id', transactionId)
      .maybeSingle();

    if (txError || !transaction) {
      return { success: false, error: 'Donation transaction not found' };
    }

    const canAccess =
      transaction.donor_id === user.id ||
      transaction.organizer_id === user.id ||
      user.role === 'admin';

    if (!canAccess) {
      return { success: false, error: 'Not authorized to sync this donation transaction' };
    }

    const checkoutReferenceCandidates = [
      transaction?.provider_reference && !isRequestReferenceNumber(transaction.provider_reference)
        ? transaction.provider_reference
        : null,
      extractCheckoutIdFromUrl(transaction?.provider_checkout_url),
      transaction?.provider_payload?.maya_checkout_id,
      transaction?.provider_payload?.checkoutId,
      transaction?.provider_payload?.id,
    ];
    const checkoutReference = checkoutReferenceCandidates.find((value) => Boolean(value)) || null;

    let mappedStatus: DonationPaymentStatus = 'pending';
    let providerPayload: any = null;

    if (checkoutReference) {
      const mayaStatus = await fetchMayaCheckoutStatus(checkoutReference);
      if (!mayaStatus.success) {
        if (!options?.assumePaidOnSuccessReturn) {
          return { success: false, error: mayaStatus.error };
        }
        mappedStatus = 'paid';
        providerPayload = {
          source: 'redirect_success_fallback',
          note: 'Marked as paid from successful return redirect because checkout status lookup failed.',
          checkout_reference: checkoutReference,
        };
      } else {
        mappedStatus = mayaStatus.status;
        providerPayload = mayaStatus.payload;
      }
    } else if (options?.assumePaidOnSuccessReturn) {
      mappedStatus = 'paid';
      providerPayload = {
        source: 'redirect_success_fallback',
        note: 'Marked as paid from successful return redirect without checkout status lookup.',
      };
    } else {
      return { success: true, data: { synced: false, reason: 'No checkout reference available yet' } };
    }

    const paidAt = mappedStatus === 'paid' ? new Date().toISOString() : null;
    const wasPaid = transaction.status === 'paid';

    const { error: updateError } = await admin
      .from('donation_transactions')
      .update({
        status: mappedStatus,
        provider_callback_payload: providerPayload,
        paid_at: paidAt || transaction.paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    if (mappedStatus === 'paid' && !wasPaid) {
      await recomputeOrganizerBalance(admin, transaction.organizer_id);
      await appendBalanceLedger(admin, {
        organizerId: transaction.organizer_id,
        transactionType: 'donation_paid',
        amountPhp: Number(transaction.amount_net || 0),
        referenceType: 'donation_transaction',
        referenceId: transaction.id,
        notes: `Donation payment synced for transaction ${transaction.id}`,
        createdBy: user.id,
      });
    }

    return {
      success: true,
      data: {
        synced: true,
        transaction_id: transaction.id,
        payment_status: mappedStatus,
      },
    };
  } catch {
    return { success: false, error: 'Failed to sync donation payment status' };
  }
}

export async function syncDonationPaymentStatusByRequestRefService(
  requestReferenceNumber: string,
  options?: { assumePaidOnSuccessReturn?: boolean }
) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { user } = auth;
    const admin = createAdminClient() as any;

    const { data: transaction, error: txError } = await admin
      .from('donation_transactions')
      .select('id, donor_id, organizer_id')
      .eq('request_reference_number', requestReferenceNumber)
      .maybeSingle();

    if (txError || !transaction) {
      return { success: false, error: 'Donation transaction not found for request reference' };
    }

    const canAccess =
      transaction.donor_id === user.id ||
      transaction.organizer_id === user.id ||
      user.role === 'admin';

    if (!canAccess) {
      return { success: false, error: 'Not authorized to sync this donation transaction' };
    }

    return syncDonationPaymentStatusService(transaction.id, options);
  } catch {
    return { success: false, error: 'Failed to sync donation payment status by request reference' };
  }
}

export async function getMyDonationTransactionsService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    const { data, error } = await db
      .from('donation_transactions')
      .select(`
        *,
        campaign:events(id, event_name, organizer_id),
        organizer:users!donation_transactions_organizer_id_fkey(id, username, avatar_url)
      `)
      .eq('donor_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch donation transactions' };
  }
}

export async function getOrganizerDonationDashboardService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (!['shelter', 'ngo', 'dvmf'].includes(user.role)) {
      return { success: false, error: 'Only organizers can access donation dashboard' };
    }

    const admin = createAdminClient() as any;
    const balance = await recomputeOrganizerBalance(admin, user.id);

    const [recentTransactionsResult, recentWithdrawalsResult] = await Promise.all([
      db
        .from('donation_transactions')
        .select(`
          id,
          campaign_id,
          amount_gross,
          processor_fee,
          transfer_fee,
          amount_net,
          status,
          donor_id,
          donor_is_anonymous,
          donor_display_name,
          created_at,
          paid_at,
          donor:users!donation_transactions_donor_id_fkey(id, username, email, avatar_url)
        `)
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      db
        .from('withdrawal_requests')
        .select('*')
        .eq('organizer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ]);

    const recentTransactions = (recentTransactionsResult.data || []).map((row: any) => ({
      ...row,
      donor_label: row.donor_is_anonymous
        ? 'Anonymous Donor'
        : row.donor_display_name || row.donor?.username || row.donor?.email || `Donor ${String(row.donor_id || '').slice(0, 8)}`,
    }));

    return {
      success: true,
      data: {
        balance,
        recent_transactions: recentTransactions,
        recent_withdrawals: recentWithdrawalsResult.data || [],
      },
    };
  } catch {
    return { success: false, error: 'Failed to fetch organizer donation dashboard' };
  }
}

export async function upsertOrganizerBillingAccountService(input: UpsertOrganizerBillingAccountInput) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (!['shelter', 'ngo', 'dvmf'].includes(user.role) || !user.is_verified) {
      return { success: false, error: 'Only verified organizers can manage billing accounts' };
    }

    const sanitizedAccount = String(input.account_number || '').replace(/\s+/g, '');
    if (sanitizedAccount.length < 6) {
      return { success: false, error: 'Account number is invalid' };
    }

    const accountPayload = {
      organizer_id: user.id,
      account_type: input.account_type,
      provider_name: input.provider_name,
      account_name: input.account_name,
      account_number_ciphertext: encryptAccountNumber(sanitizedAccount),
      account_number_last4: sanitizedAccount.slice(-4),
      account_metadata: input.account_metadata || null,
      is_default: Boolean(input.is_default),
      is_active: input.is_active !== false,
    };

    if (accountPayload.is_default) {
      await db
        .from('organizer_billing_accounts')
        .update({ is_default: false })
        .eq('organizer_id', user.id)
        .neq('id', input.id || '');
    }

    let result;
    if (input.id) {
      result = await db
        .from('organizer_billing_accounts')
        .update(accountPayload)
        .eq('id', input.id)
        .eq('organizer_id', user.id)
        .select('*')
        .single();
    } else {
      result = await db
        .from('organizer_billing_accounts')
        .insert(accountPayload)
        .select('*')
        .single();
    }

    if (result.error || !result.data) {
      return { success: false, error: result.error?.message || 'Failed to save billing account' };
    }

    const safeData = {
      ...result.data,
      account_number_ciphertext: undefined,
    };

    return { success: true, data: safeData };
  } catch {
    return { success: false, error: 'Failed to save organizer billing account' };
  }
}

export async function getOrganizerBillingAccountsService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (!['shelter', 'ngo', 'dvmf'].includes(user.role)) {
      return { success: false, error: 'Only organizers can view billing accounts' };
    }

    const { data, error } = await db
      .from('organizer_billing_accounts')
      .select('*')
      .eq('organizer_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    const safe = (data || []).map((row: any) => ({
      ...row,
      account_number_ciphertext: undefined,
    }));

    return { success: true, data: safe };
  } catch {
    return { success: false, error: 'Failed to fetch organizer billing accounts' };
  }
}

export async function createWithdrawalRequestService(input: CreateWithdrawalRequestInput) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (!['shelter', 'ngo', 'dvmf'].includes(user.role) || !user.is_verified) {
      return { success: false, error: 'Only verified organizers can request withdrawals' };
    }

    const amount = Number(input.amount_requested || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return { success: false, error: 'Withdrawal amount must be greater than zero' };
    }

    const admin = createAdminClient() as any;
    const balance = await recomputeOrganizerBalance(admin, user.id);

    const estimatedTransferFee = resolveEstimatedTransferFeePhp();
    const reservedAmount = amount + estimatedTransferFee;

    if (reservedAmount > Number(balance.available_balance || 0)) {
      return { success: false, error: 'Insufficient available balance for this withdrawal request' };
    }

    const { data: billingAccount, error: accountError } = await db
      .from('organizer_billing_accounts')
      .select('id, organizer_id, is_active')
      .eq('id', input.billing_account_id)
      .eq('organizer_id', user.id)
      .maybeSingle();

    if (accountError || !billingAccount || !billingAccount.is_active) {
      return { success: false, error: 'Billing account is invalid or inactive' };
    }

    const { data: request, error: requestError } = await db
      .from('withdrawal_requests')
      .insert({
        organizer_id: user.id,
        billing_account_id: input.billing_account_id,
        amount_requested: amount,
        estimated_transfer_fee: estimatedTransferFee,
        status: 'pending',
      })
      .select('*')
      .single();

    if (requestError || !request) {
      return { success: false, error: requestError?.message || 'Failed to create withdrawal request' };
    }

    await recomputeOrganizerBalance(admin, user.id);
    await appendBalanceLedger(admin, {
      organizerId: user.id,
      transactionType: 'withdrawal_requested',
      amountPhp: -reservedAmount,
      referenceType: 'withdrawal_request',
      referenceId: request.id,
      notes: 'Withdrawal requested and amount reserved',
      createdBy: user.id,
    });

    return { success: true, data: request };
  } catch {
    return { success: false, error: 'Failed to create withdrawal request' };
  }
}

export async function getOrganizerWithdrawalRequestsService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (!['shelter', 'ngo', 'dvmf'].includes(user.role)) {
      return { success: false, error: 'Only organizers can view withdrawal requests' };
    }

    const { data, error } = await db
      .from('withdrawal_requests')
      .select(`
        *,
        billing_account:organizer_billing_accounts(id, account_type, provider_name, account_name, account_number_last4)
      `)
      .eq('organizer_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch organizer withdrawal requests' };
  }
}

export async function getPendingWithdrawalRequestsService() {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'admin') {
      return { success: false, error: 'Only admins can view pending withdrawal requests' };
    }

    const { data, error } = await db
      .from('withdrawal_requests')
      .select(`
        *,
        organizer:users!withdrawal_requests_organizer_id_fkey(id, username, avatar_url, role),
        billing_account:organizer_billing_accounts(id, account_type, provider_name, account_name, account_number_last4)
      `)
      .in('status', ['pending', 'approved', 'processing'])
      .order('created_at', { ascending: true });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch pending withdrawal requests' };
  }
}

export async function reviewWithdrawalRequestService(
  requestId: string,
  decision: 'approve' | 'reject',
  reviewNotes?: string
) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'admin') {
      return { success: false, error: 'Only admins can review withdrawal requests' };
    }

    const { data: request, error: requestError } = await db
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (requestError || !request) {
      return { success: false, error: 'Withdrawal request not found' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Only pending withdrawal requests can be reviewed' };
    }

    const nextStatus: WithdrawalStatus = decision === 'approve' ? 'approved' : 'rejected';
    const nowIso = new Date().toISOString();

    const { data: updated, error: updateError } = await db
      .from('withdrawal_requests')
      .update({
        status: nextStatus,
        reviewed_by: user.id,
        reviewed_at: nowIso,
        review_notes: reviewNotes || null,
      })
      .eq('id', requestId)
      .select('*')
      .single();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to review withdrawal request' };
    }

    const admin = createAdminClient() as any;
    await recomputeOrganizerBalance(admin, request.organizer_id);

    if (decision === 'reject') {
      await appendBalanceLedger(admin, {
        organizerId: request.organizer_id,
        transactionType: 'withdrawal_rejected',
        amountPhp: Number(request.amount_reserved || 0),
        referenceType: 'withdrawal_request',
        referenceId: request.id,
        notes: reviewNotes || 'Withdrawal request rejected and reserved amount returned',
        createdBy: user.id,
      });
    }

    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to review withdrawal request' };
  }
}

export async function completeWithdrawalRequestService(input: {
  request_id: string;
  payout_reference: string;
  proof_urls: string[];
  actual_transfer_fee?: number;
}) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;
    if (user.role !== 'admin') {
      return { success: false, error: 'Only admins can complete withdrawal requests' };
    }

    const { data: request, error: requestError } = await db
      .from('withdrawal_requests')
      .select('*')
      .eq('id', input.request_id)
      .maybeSingle();

    if (requestError || !request) {
      return { success: false, error: 'Withdrawal request not found' };
    }

    if (!['approved', 'processing'].includes(request.status)) {
      return { success: false, error: 'Only approved/processing withdrawals can be completed' };
    }

    const actualTransferFee = Number.isFinite(Number(input.actual_transfer_fee))
      ? Number(input.actual_transfer_fee)
      : Number(request.estimated_transfer_fee || 0);

    if (actualTransferFee < 0) {
      return { success: false, error: 'Actual transfer fee cannot be negative' };
    }

    const nowIso = new Date().toISOString();
    const { data: updated, error: updateError } = await db
      .from('withdrawal_requests')
      .update({
        status: 'completed',
        processed_by: user.id,
        processed_at: nowIso,
        payout_reference: input.payout_reference,
        proof_urls: input.proof_urls || [],
        actual_transfer_fee: actualTransferFee,
      })
      .eq('id', input.request_id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return { success: false, error: updateError?.message || 'Failed to complete withdrawal request' };
    }

    const admin = createAdminClient() as any;
    await recomputeOrganizerBalance(admin, request.organizer_id);

    await appendBalanceLedger(admin, {
      organizerId: request.organizer_id,
      transactionType: 'withdrawal_completed',
      amountPhp: -(Number(request.amount_requested || 0) + actualTransferFee),
      referenceType: 'withdrawal_request',
      referenceId: request.id,
      notes: `Withdrawal completed with payout reference ${input.payout_reference}`,
      createdBy: user.id,
    });

    return { success: true, data: updated };
  } catch {
    return { success: false, error: 'Failed to complete withdrawal request' };
  }
}

export async function createInKindDonationIntentService(input: {
  campaign_id: string;
  item_summary: string;
  quantity_label?: string;
  donor_notes?: string;
  estimated_dropoff_at?: string;
}) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;

    const { data: campaign, error: campaignError } = await db
      .from('events')
      .select('id, organizer_id, event_type, donation_in_kind_enabled')
      .eq('id', input.campaign_id)
      .single();

    if (campaignError || !campaign) {
      return { success: false, error: 'Donation campaign not found' };
    }

    if (campaign.event_type !== 'donation_drive' || !campaign.donation_in_kind_enabled) {
      return { success: false, error: 'This campaign is not accepting in-kind donations' };
    }

    if (campaign.organizer_id === user.id) {
      return { success: false, error: 'Organizers cannot submit in-kind intents to their own campaign' };
    }

    const { data, error } = await db
      .from('in_kind_donation_intents')
      .insert({
        campaign_id: campaign.id,
        organizer_id: campaign.organizer_id,
        donor_id: user.id,
        status: 'submitted',
        item_summary: input.item_summary,
        quantity_label: input.quantity_label || null,
        donor_notes: input.donor_notes || null,
        estimated_dropoff_at: input.estimated_dropoff_at || null,
      })
      .select('*')
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || 'Failed to submit in-kind donation intent' };
    }

    return { success: true, data };
  } catch {
    return { success: false, error: 'Failed to submit in-kind donation intent' };
  }
}

export async function getInKindDonationIntentsService(campaignId?: string) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db, user } = auth;

    let query = db
      .from('in_kind_donation_intents')
      .select(`
        *,
        campaign:events(id, event_name, organizer_id),
        donor:users!in_kind_donation_intents_donor_id_fkey(id, username, avatar_url),
        organizer:users!in_kind_donation_intents_organizer_id_fkey(id, username, avatar_url)
      `)
      .order('created_at', { ascending: false });

    if (campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (user.role === 'admin') {
      // no-op: admins can view all intents
    } else if (['shelter', 'ngo', 'dvmf'].includes(user.role)) {
      query = query.eq('organizer_id', user.id);
    } else {
      query = query.eq('donor_id', user.id);
    }

    const { data, error } = await query;
    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: data || [] };
  } catch {
    return { success: false, error: 'Failed to fetch in-kind donation intents' };
  }
}

export async function getDonationCampaignDonorsService(campaignId: string) {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error };
    }

    const { db } = auth;

    const { data, error } = await db
      .from('donation_transactions')
      .select(`
        id,
        campaign_id,
        amount_net,
        amount_gross,
        status,
        paid_at,
        created_at,
        donor_id,
        donor_is_anonymous,
        donor_display_name,
        donor:users!donation_transactions_donor_id_fkey(id, username, avatar_url)
      `)
      .eq('campaign_id', campaignId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return { success: false, error: error.message };
    }

    const donors = (data || []).map((row: any) => ({
      id: row.id,
      amount_php: Number(row.amount_net ?? row.amount_gross ?? 0),
      donated_at: row.paid_at || row.created_at,
      donor_label: row.donor_is_anonymous
        ? 'Anonymous Donor'
        : row.donor_display_name || row.donor?.username || `Donor ${String(row.donor_id || '').slice(0, 8)}`,
      donor_avatar_url: row.donor_is_anonymous ? null : row.donor?.avatar_url || null,
      is_anonymous: Boolean(row.donor_is_anonymous),
    }));

    return { success: true, data: donors };
  } catch {
    return { success: false, error: 'Failed to fetch campaign donors' };
  }
}
