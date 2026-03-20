function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function resolveFrontendBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function sendHealthcarePaymentReceiptEmail(payload: {
  recipientEmail: string;
  recipientName: string;
  appointmentRequestId: string;
  serviceName: string;
  petName: string;
  amountTotal: number;
  amountService: number;
  amountPlatformFee: number;
  paidAtIso: string;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.PAYMENT_RECEIPT_FROM_EMAIL || process.env.MAYA_RECEIPT_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return {
      success: false as const,
      error: 'Email provider is not configured. Set RESEND_API_KEY and PAYMENT_RECEIPT_FROM_EMAIL.',
    };
  }

  const paidDate = new Date(payload.paidAtIso);
  const formattedPaidDate = Number.isNaN(paidDate.getTime())
    ? payload.paidAtIso
    : paidDate.toLocaleString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

  const amountTotal = Number(payload.amountTotal || 0).toFixed(2);
  const amountService = Number(payload.amountService || 0).toFixed(2);
  const amountPlatform = Number(payload.amountPlatformFee || 0).toFixed(2);
  const appBaseUrl = resolveFrontendBaseUrl().replace(/\/$/, '');
  const dashboardUrl = `${appBaseUrl}/dashboard`;

  const safeRecipientName = escapeHtml(payload.recipientName || 'Pet Owner');
  const safeServiceName = escapeHtml(payload.serviceName || 'Healthcare Service');
  const safePetName = escapeHtml(payload.petName || 'Pet');
  const safeAppointmentId = escapeHtml(payload.appointmentRequestId);

  const subject = `Payment Receipt - ${safeServiceName} (${safePetName})`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.55; color: #0f172a;">
      <h2 style="margin: 0 0 12px;">Payment Confirmed</h2>
      <p style="margin: 0 0 12px;">Hi ${safeRecipientName},</p>
      <p style="margin: 0 0 14px;">We received your payment for your DVMF healthcare appointment.</p>
      <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin: 0 0 14px; background: #f8fafc;">
        <p style="margin: 0 0 8px;"><strong>Appointment ID:</strong> ${safeAppointmentId}</p>
        <p style="margin: 0 0 8px;"><strong>Service:</strong> ${safeServiceName}</p>
        <p style="margin: 0 0 8px;"><strong>Pet:</strong> ${safePetName}</p>
        <p style="margin: 0 0 8px;"><strong>Paid On:</strong> ${escapeHtml(formattedPaidDate)}</p>
        <p style="margin: 0 0 6px;"><strong>Service Fee:</strong> PHP ${amountService}</p>
        <p style="margin: 0 0 6px;"><strong>Platform Fee:</strong> PHP ${amountPlatform}</p>
        <p style="margin: 8px 0 0; font-size: 16px;"><strong>Total Paid:</strong> PHP ${amountTotal}</p>
      </div>
      <p style="margin: 0 0 12px;">Your appointment is now marked as paid and scheduled.</p>
      <p style="margin: 0;">You can view updates in your dashboard: <a href="${escapeHtml(dashboardUrl)}">${escapeHtml(dashboardUrl)}</a></p>
    </div>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [payload.recipientEmail],
      subject,
      html,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    const errText = await response.text();
    return {
      success: false as const,
      error: `Failed to send receipt email: ${errText || 'Unknown email error'}`,
    };
  }

  return { success: true as const };
}