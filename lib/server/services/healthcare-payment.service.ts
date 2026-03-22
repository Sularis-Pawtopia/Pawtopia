import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyMayaSignature } from '@/lib/server/utils/maya-crypto';
import { sendHealthcarePaymentReceiptEmail } from '@/lib/server/utils/healthcare-receipt-email';

type CheckoutResult = {
  checkout_url: string;
  checkout_id: string;
  payment_transaction_id: string;
};

function normalizeMayaBaseUrl() {
  return (process.env.MAYA_SANDBOX_BASE_URL || 'https://pg-sandbox.paymaya.com').replace(/\/$/, '');
}

function resolveMayaCredentials() {
  const apiKey = process.env.MAYA_API_KEY;
  const secretKey = process.env.MAYA_SECRET_KEY;

  if (!apiKey || !secretKey) {
    return { error: 'Maya sandbox credentials are not configured' as const };
  }

  return { apiKey, secretKey };
}

function resolveFrontendBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

function isRequestReferenceNumber(value?: string | null) {
  if (!value) return false;
  return /^hc-[a-f0-9]{8}-\d+$/i.test(String(value));
}

function extractCheckoutId(payload: any) {
  return payload?.checkoutId || payload?.id || payload?.referenceNumber || payload?.resource?.id || payload?.data?.checkoutId || payload?.data?.id || null;
}

function extractCheckoutUrl(payload: any) {
  return payload?.redirectUrl || payload?.checkoutUrl || payload?.url || payload?.paymentUrl || null;
}

function mapWebhookStatus(rawStatus: string | null | undefined) {
  const status = String(rawStatus || '').toLowerCase();

  if (['paid', 'payment_success', 'payment_successful', 'success', 'completed', 'executed', 'captured', 'authorized'].includes(status)) {
    return 'paid' as const;
  }

  if (['cancelled', 'canceled', 'voided'].includes(status)) {
    return 'cancelled' as const;
  }

  if (['refunded', 'partial_refunded'].includes(status)) {
    return 'refunded' as const;
  }

  if (['failed', 'payment_failed', 'declined', 'expired'].includes(status)) {
    return 'failed' as const;
  }

  return 'pending' as const;
}

function mapMayaCheckoutStatus(payload: any) {
  return mapWebhookStatus(
    payload?.status ||
    payload?.paymentStatus ||
    payload?.state ||
    payload?.event ||
    payload?.resultStatus ||
    payload?.payments?.[0]?.status ||
    payload?.data?.status ||
    payload?.result?.status
  );
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

function extractAppointmentPrefixFromRequestReference(requestReferenceNumber?: string | null) {
  if (!requestReferenceNumber) return null;
  const match = String(requestReferenceNumber).match(/^hc-([a-f0-9]{8})-/i);
  return match?.[1]?.toLowerCase() || null;
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

  const text = await response.text();
  let payload: any = null;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    return {
      success: false as const,
      error: payload?.message || 'Failed to fetch Maya checkout status',
    };
  }

  return {
    success: true as const,
    payload,
    status: mapMayaCheckoutStatus(payload),
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
    .select('id, role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    return { error: 'User profile not found' as const };
  }

  return { db, user: profile as { id: string; role: string } };
}

export async function initiateMayaCheckoutService(
  appointmentRequestId: string
): Promise<{ success: true; data: CheckoutResult } | { success: false; error: string }> {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error || 'Not authenticated' };
    }

    const { db, user } = auth;
    const credentials = resolveMayaCredentials();
    if ('error' in credentials) {
      return { success: false, error: credentials.error || 'Maya credentials are not configured' };
    }

    const { data: appointment, error: appointmentError } = await db
      .from('healthcare_appointment_requests')
      .select('id, requester_id, dvmf_id, status, payment_required, service_base_fee, platform_service_fee, total_fee')
      .eq('id', appointmentRequestId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Appointment request not found' };
    }

    const canInitiate = appointment.requester_id === user.id || (appointment.dvmf_id === user.id && user.role === 'dvmf');
    if (!canInitiate) {
      return { success: false, error: 'Not authorized to initiate payment for this appointment' };
    }

    if (!appointment.payment_required) {
      return { success: false, error: 'This appointment does not require payment' };
    }

    if (appointment.status !== 'approved_pending_payment') {
      return { success: false, error: 'Payment can only be initiated after DVMF approval' };
    }

    const total = Number(appointment.total_fee || 0);
    const serviceAmount = Number(appointment.service_base_fee || 0);
    const platformFee = Number(appointment.platform_service_fee || 0);

    if (Math.abs(total - (serviceAmount + platformFee)) > 0.01) {
      return { success: false, error: 'Payment amount mismatch detected for this appointment' };
    }

    const frontendBase = resolveFrontendBaseUrl().replace(/\/$/, '');
    const requestReferenceNumber = `hc-${appointment.id.slice(0, 8)}-${Date.now()}`;

    const payload = {
      totalAmount: {
        currency: 'PHP',
        value: total,
      },
      requestReferenceNumber,
      redirectUrl: {
        success: `${frontendBase}/healthcare?healthcarePayment=success&appointmentId=${appointment.id}`,
        failure: `${frontendBase}/healthcare?healthcarePayment=failure&appointmentId=${appointment.id}`,
        cancel: `${frontendBase}/healthcare?healthcarePayment=cancelled&appointmentId=${appointment.id}`,
      },
      metadata: {
        appointment_request_id: appointment.id,
        requester_id: appointment.requester_id,
        dvmf_id: appointment.dvmf_id,
      },
      items: [
        {
          name: 'DVMF Healthcare Service',
          quantity: 1,
          amount: {
            value: total,
            details: {
              subtotal: serviceAmount,
              serviceCharge: platformFee,
              discount: 0,
            },
          },
          totalAmount: {
            value: total,
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

    const responseText = await response.text();
    let responsePayload: any = null;
    try {
      responsePayload = JSON.parse(responseText);
    } catch {
      responsePayload = { raw: responseText };
    }

    if (!response.ok) {
      return { success: false, error: responsePayload?.message || 'Failed to initialize Maya checkout session' };
    }

    const checkoutIdRaw = extractCheckoutId(responsePayload);
    const checkoutUrl = extractCheckoutUrl(responsePayload);
    const checkoutId = !isRequestReferenceNumber(checkoutIdRaw)
      ? checkoutIdRaw
      : extractCheckoutIdFromUrl(checkoutUrl);

    if (!checkoutId || !checkoutUrl) {
      return { success: false, error: 'Maya response missing checkout reference or URL' };
    }

    const { data: transaction, error: upsertError } = await db
      .from('healthcare_payment_transactions')
      .upsert(
        {
          appointment_request_id: appointment.id,
          requester_id: appointment.requester_id,
          dvmf_id: appointment.dvmf_id,
          provider: 'maya',
          provider_reference: checkoutId,
          provider_checkout_url: checkoutUrl,
          amount_service: serviceAmount,
          amount_platform_fee: platformFee,
          amount_total: total,
          status: 'pending',
          provider_payload: {
            ...payload,
            maya_checkout_id: checkoutId,
          },
        },
        { onConflict: 'appointment_request_id' }
      )
      .select('id')
      .single();

    if (upsertError || !transaction) {
      return { success: false, error: upsertError?.message || 'Failed to persist payment transaction' };
    }

    return {
      success: true,
      data: {
        checkout_url: checkoutUrl,
        checkout_id: checkoutId,
        payment_transaction_id: transaction.id,
      },
    };
  } catch {
    return { success: false, error: 'Unexpected error while creating Maya checkout session' };
  }
}

export async function processMayaWebhookService(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.MAYA_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return { success: false, statusCode: 500, error: 'Maya webhook secret is not configured' };
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
    payload?.referenceNumber ||
    payload?.transactionId ||
    payload?.resource?.id ||
    payload?.resource?.checkoutId ||
    payload?.result?.id ||
    payload?.result?.checkoutId ||
    payload?.data?.id ||
    payload?.data?.checkoutId ||
    payload?.data?.transactionId ||
    payload?.data?.referenceNumber ||
    null;

  const appointmentId =
    payload?.metadata?.appointment_request_id ||
    payload?.resource?.metadata?.appointment_request_id ||
    payload?.result?.metadata?.appointment_request_id ||
    payload?.data?.metadata?.appointment_request_id ||
    null;

  const requestReferenceNumber =
    payload?.requestReferenceNumber ||
    payload?.data?.requestReferenceNumber ||
    payload?.resource?.requestReferenceNumber ||
    payload?.result?.requestReferenceNumber ||
    null;

  if (!providerReference && !appointmentId) {
    return { success: false, statusCode: 400, error: 'Webhook is missing transaction reference' };
  }

  const mappedStatus = mapWebhookStatus(payload?.status || payload?.event || payload?.data?.status);
  const paidAt = mappedStatus === 'paid' ? new Date().toISOString() : null;

  const admin = createAdminClient() as any;

  let transaction: any = null;
  if (providerReference) {
    const lookup = await admin
      .from('healthcare_payment_transactions')
      .select('id, appointment_request_id, status, provider_reference')
      .eq('provider_reference', providerReference)
      .maybeSingle();

    transaction = lookup.data || null;
  }

  if (!transaction && appointmentId) {
    const fallback = await admin
      .from('healthcare_payment_transactions')
      .select('id, appointment_request_id, status, provider_reference')
      .eq('appointment_request_id', appointmentId)
      .maybeSingle();

    transaction = fallback.data || null;
  }

  if (!transaction && requestReferenceNumber) {
    const fallback = await admin
      .from('healthcare_payment_transactions')
      .select('id, appointment_request_id, status, provider_reference, provider_payload')
      .order('created_at', { ascending: false })
      .limit(25);

    if (!fallback.error && Array.isArray(fallback.data)) {
      transaction =
        fallback.data.find(
          (row: any) =>
            String(row?.provider_payload?.requestReferenceNumber || '') === String(requestReferenceNumber)
        ) || null;
    }
  }

  let derivedAppointmentIdFromReference: string | null = null;
  if (!transaction && requestReferenceNumber) {
    const prefix = extractAppointmentPrefixFromRequestReference(requestReferenceNumber);
    if (prefix) {
      const apptLookup = await admin
        .from('healthcare_appointment_requests')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(80);

      if (!apptLookup.error && Array.isArray(apptLookup.data)) {
        const matched = apptLookup.data.find((row: any) => String(row?.id || '').toLowerCase().startsWith(prefix));
        derivedAppointmentIdFromReference = matched?.id || null;
      }

      if (derivedAppointmentIdFromReference) {
        const txLookup = await admin
          .from('healthcare_payment_transactions')
          .select('id, appointment_request_id, status, provider_reference')
          .eq('appointment_request_id', derivedAppointmentIdFromReference)
          .maybeSingle();

        if (!txLookup.error && txLookup.data) {
          transaction = txLookup.data;
        }
      }
    }
  }

  if (transaction?.status === 'paid' && mappedStatus === 'paid') {
    return { success: true, statusCode: 200, data: { already_processed: true } };
  }

  if (transaction) {
    const updatePayload: Record<string, unknown> = {
      status: mappedStatus,
      provider_callback_payload: payload,
      updated_at: new Date().toISOString(),
    };

    if (providerReference) {
      updatePayload.provider_reference = providerReference;
    }

    if (paidAt) {
      updatePayload.paid_at = paidAt;
    }

    const { error: updateError } = await admin
      .from('healthcare_payment_transactions')
      .update(updatePayload)
      .eq('id', transaction.id);

    if (updateError) {
      return { success: false, statusCode: 500, error: updateError.message };
    }
  }

  const appointmentRequestId = transaction?.appointment_request_id || appointmentId || derivedAppointmentIdFromReference;
  if (mappedStatus === 'paid' && appointmentRequestId) {
    const { error: appointmentError } = await admin
      .from('healthcare_appointment_requests')
      .update({
        status: 'paid_scheduled',
        paid_at: paidAt,
      })
      .eq('id', appointmentRequestId)
      .in('status', ['approved_pending_payment', 'paid_scheduled']);

    if (appointmentError) {
      return { success: false, statusCode: 500, error: appointmentError.message };
    }

    const { data: appointmentDetails } = await admin
      .from('healthcare_appointment_requests')
      .select(`
        id,
        requester_id,
        total_fee,
        service_base_fee,
        platform_service_fee,
        paid_at,
        service:dvmf_healthcare_services(service_name),
        pet:pets(name),
        requester:users!healthcare_appointment_requests_requester_id_fkey(email, username)
      `)
      .eq('id', appointmentRequestId)
      .maybeSingle();

    const recipientEmail = appointmentDetails?.requester?.email || null;
    if (recipientEmail) {
      const receiptResult = await sendHealthcarePaymentReceiptEmail({
        recipientEmail,
        recipientName: appointmentDetails?.requester?.username || 'Pet Owner',
        appointmentRequestId,
        serviceName: appointmentDetails?.service?.service_name || 'Healthcare Service',
        petName: appointmentDetails?.pet?.name || 'Pet',
        amountTotal: Number(appointmentDetails?.total_fee || 0),
        amountService: Number(appointmentDetails?.service_base_fee || 0),
        amountPlatformFee: Number(appointmentDetails?.platform_service_fee || 0),
        paidAtIso: appointmentDetails?.paid_at || paidAt || new Date().toISOString(),
      });

      if (!receiptResult.success) {
        console.error('Healthcare payment receipt email failed:', receiptResult.error);
      }
    }
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      provider_reference: providerReference,
      appointment_request_id: appointmentRequestId,
      payment_status: mappedStatus,
    },
  };
}

export async function syncMayaPaymentStatusService(
  appointmentRequestId: string,
  options?: { assumePaidOnSuccessReturn?: boolean }
): Promise<{ success: true; data: any } | { success: false; error: string }> {
  try {
    const auth = await getCurrentUserWithRole();
    if ('error' in auth) {
      return { success: false, error: auth.error || 'Not authenticated' };
    }

    const { db, user } = auth;
    const admin = createAdminClient() as any;

    const { data: appointment, error: appointmentError } = await db
      .from('healthcare_appointment_requests')
      .select('id, requester_id, dvmf_id, status')
      .eq('id', appointmentRequestId)
      .single();

    if (appointmentError || !appointment) {
      return { success: false, error: 'Appointment request not found' };
    }

    const isAuthorized = appointment.requester_id === user.id || appointment.dvmf_id === user.id || user.role === 'admin';
    if (!isAuthorized) {
      return { success: false, error: 'Not authorized to sync this appointment payment' };
    }

    const { data: transaction, error: transactionError } = await admin
      .from('healthcare_payment_transactions')
      .select('id, provider_reference, provider_checkout_url, provider_payload, status, paid_at, amount_service, amount_platform_fee, amount_total')
      .eq('appointment_request_id', appointmentRequestId)
      .maybeSingle();

    if (transactionError) {
      return { success: false, error: transactionError.message };
    }

    const checkoutReferenceCandidates = [
      transaction?.provider_reference && !isRequestReferenceNumber(transaction.provider_reference)
        ? transaction.provider_reference
        : null,
      extractCheckoutIdFromUrl(transaction?.provider_checkout_url),
      transaction?.provider_payload?.maya_checkout_id,
      transaction?.provider_payload?.checkoutId,
      transaction?.provider_payload?.checkout_id,
      transaction?.provider_payload?.id,
    ];

    const checkoutReference = checkoutReferenceCandidates.find((candidate) => Boolean(candidate)) || null;

    let mappedStatus: 'paid' | 'pending' | 'failed' | 'cancelled' | 'refunded' = 'pending';
    let mayaPayload: any = null;

    if (!checkoutReference) {
      if (!options?.assumePaidOnSuccessReturn) {
        return { success: true, data: { synced: false, reason: 'No Maya checkout reference yet' } };
      }

      mappedStatus = 'paid';
      mayaPayload = {
        source: 'redirect_success_fallback',
        note: 'Marked as paid from successful return redirect without checkout status lookup.',
      };
    } else {
      const mayaStatus = await fetchMayaCheckoutStatus(checkoutReference);
      if (!mayaStatus.success) {
        if (!options?.assumePaidOnSuccessReturn) {
          return { success: false, error: mayaStatus.error };
        }

        mappedStatus = 'paid';
        mayaPayload = {
          source: 'redirect_success_fallback',
          note: 'Marked as paid from successful return redirect because Maya checkout status lookup failed.',
          checkout_reference: checkoutReference,
        };
      } else {
        mappedStatus = mayaStatus.status;
        mayaPayload = mayaStatus.payload;
      }
    }

    const paidAt = mappedStatus === 'paid' ? new Date().toISOString() : null;

    const { error: txUpdateError } = await admin
      .from('healthcare_payment_transactions')
      .update({
        status: mappedStatus,
        provider_callback_payload: mayaPayload,
        paid_at: mappedStatus === 'paid' ? paidAt : transaction.paid_at,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transaction.id);

    if (txUpdateError) {
      return { success: false, error: txUpdateError.message };
    }

    if (mappedStatus === 'paid') {
      const { error: appointmentUpdateError } = await admin
        .from('healthcare_appointment_requests')
        .update({
          status: 'paid_scheduled',
          paid_at: paidAt,
        })
        .eq('id', appointmentRequestId)
        .in('status', ['approved_pending_payment', 'paid_scheduled']);

      if (appointmentUpdateError) {
        return { success: false, error: appointmentUpdateError.message };
      }

      if (transaction.status !== 'paid') {
        const { data: appointmentDetails } = await admin
          .from('healthcare_appointment_requests')
          .select(`
            id,
            total_fee,
            service_base_fee,
            platform_service_fee,
            paid_at,
            service:dvmf_healthcare_services(service_name),
            pet:pets(name),
            requester:users!healthcare_appointment_requests_requester_id_fkey(email, username)
          `)
          .eq('id', appointmentRequestId)
          .maybeSingle();

        const recipientEmail = appointmentDetails?.requester?.email || null;
        if (recipientEmail) {
          const receiptResult = await sendHealthcarePaymentReceiptEmail({
            recipientEmail,
            recipientName: appointmentDetails?.requester?.username || 'Pet Owner',
            appointmentRequestId,
            serviceName: appointmentDetails?.service?.service_name || 'Healthcare Service',
            petName: appointmentDetails?.pet?.name || 'Pet',
            amountTotal: Number(appointmentDetails?.total_fee || 0),
            amountService: Number(appointmentDetails?.service_base_fee || 0),
            amountPlatformFee: Number(appointmentDetails?.platform_service_fee || 0),
            paidAtIso: appointmentDetails?.paid_at || paidAt || new Date().toISOString(),
          });

          if (!receiptResult.success) {
            console.error('Healthcare payment receipt email failed:', receiptResult.error);
          }
        }
      }
    }

    return {
      success: true,
      data: {
        synced: true,
        appointment_request_id: appointmentRequestId,
        payment_status: mappedStatus,
      },
    };
  } catch {
    return { success: false, error: 'Failed to sync Maya payment status' };
  }
}
