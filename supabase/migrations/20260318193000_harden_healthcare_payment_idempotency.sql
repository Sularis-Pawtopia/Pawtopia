-- Harden healthcare payment idempotency for webhook callbacks.

CREATE UNIQUE INDEX IF NOT EXISTS idx_healthcare_payment_transactions_provider_reference_unique
  ON healthcare_payment_transactions(provider_reference)
  WHERE provider_reference IS NOT NULL;
