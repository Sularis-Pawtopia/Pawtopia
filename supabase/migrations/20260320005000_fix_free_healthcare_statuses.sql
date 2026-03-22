-- Normalize legacy statuses for free healthcare requests.
-- If total fee is zero, requests should not remain in approved_pending_payment.

UPDATE healthcare_appointment_requests
SET
  status = 'paid_scheduled',
  payment_required = FALSE,
  paid_at = COALESCE(paid_at, NOW())
WHERE status = 'approved_pending_payment'
  AND COALESCE(total_fee, 0) <= 0;
