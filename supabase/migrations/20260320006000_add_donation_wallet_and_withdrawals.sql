DO $$
BEGIN
  CREATE TYPE donation_payment_status AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'processing', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE payout_account_type AS ENUM ('bank', 'e_wallet');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE in_kind_intent_status AS ENUM ('submitted', 'acknowledged', 'received', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS donation_monetary_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS donation_in_kind_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS donation_goal_php NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS donation_beneficiary TEXT,
  ADD COLUMN IF NOT EXISTS donation_dropoff_address TEXT,
  ADD COLUMN IF NOT EXISTS donation_dropoff_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS donation_dropoff_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS donation_dropoff_place_id TEXT,
  ADD COLUMN IF NOT EXISTS donation_dropoff_map_url TEXT,
  ADD COLUMN IF NOT EXISTS donation_notes TEXT;

CREATE TABLE IF NOT EXISTS organizer_billing_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_type payout_account_type NOT NULL,
  provider_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number_ciphertext TEXT NOT NULL,
  account_number_last4 TEXT NOT NULL,
  account_metadata JSONB,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organizer_billing_accounts_last4_digits CHECK (account_number_last4 ~ '^[0-9]{4}$')
);

CREATE TABLE IF NOT EXISTS organizer_balances (
  organizer_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_received NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_fees NUMERIC(12,2) NOT NULL DEFAULT 0,
  withdrawn NUMERIC(12,2) NOT NULL DEFAULT 0,
  pending_withdrawal NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT organizer_balances_non_negative CHECK (
    total_received >= 0 AND total_fees >= 0 AND withdrawn >= 0 AND pending_withdrawal >= 0
  )
);

CREATE TABLE IF NOT EXISTS donation_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_gross NUMERIC(12,2) NOT NULL,
  processor_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  transfer_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_net NUMERIC(12,2) GENERATED ALWAYS AS (amount_gross - processor_fee - transfer_fee) STORED,
  currency TEXT NOT NULL DEFAULT 'PHP',
  status donation_payment_status NOT NULL DEFAULT 'pending',
  provider TEXT NOT NULL DEFAULT 'maya',
  provider_reference TEXT,
  provider_checkout_url TEXT,
  request_reference_number TEXT,
  donor_message TEXT,
  provider_payload JSONB,
  provider_callback_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT donation_transactions_amounts_non_negative CHECK (
    amount_gross >= 0 AND processor_fee >= 0 AND transfer_fee >= 0
  )
);

CREATE TABLE IF NOT EXISTS balance_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL,
  amount_php NUMERIC(12,2) NOT NULL,
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_account_id UUID NOT NULL REFERENCES organizer_billing_accounts(id) ON DELETE RESTRICT,
  amount_requested NUMERIC(12,2) NOT NULL,
  estimated_transfer_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_transfer_fee NUMERIC(12,2),
  amount_reserved NUMERIC(12,2) GENERATED ALWAYS AS (amount_requested + estimated_transfer_fee) STORED,
  status withdrawal_status NOT NULL DEFAULT 'pending',
  payout_reference TEXT,
  proof_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  processed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT withdrawal_requests_amount_positive CHECK (amount_requested > 0),
  CONSTRAINT withdrawal_requests_fees_non_negative CHECK (
    estimated_transfer_fee >= 0 AND (actual_transfer_fee IS NULL OR actual_transfer_fee >= 0)
  )
);

CREATE TABLE IF NOT EXISTS in_kind_donation_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status in_kind_intent_status NOT NULL DEFAULT 'submitted',
  item_summary TEXT NOT NULL,
  quantity_label TEXT,
  donor_notes TEXT,
  estimated_dropoff_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizer_billing_accounts_one_default
  ON organizer_billing_accounts(organizer_id)
  WHERE is_default = TRUE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_donation_transactions_provider_ref_unique
  ON donation_transactions(provider_reference)
  WHERE provider_reference IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_donation_transactions_campaign ON donation_transactions(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_donor ON donation_transactions(donor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_organizer ON donation_transactions(organizer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donation_transactions_request_ref ON donation_transactions(request_reference_number);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_organizer_status ON withdrawal_requests(organizer_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_in_kind_intents_campaign ON in_kind_donation_intents(campaign_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_balance_ledger_organizer ON balance_ledger(organizer_id, created_at DESC);

DROP TRIGGER IF EXISTS update_organizer_billing_accounts_updated_at ON organizer_billing_accounts;
CREATE TRIGGER update_organizer_billing_accounts_updated_at
  BEFORE UPDATE ON organizer_billing_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizer_balances_updated_at ON organizer_balances;
CREATE TRIGGER update_organizer_balances_updated_at
  BEFORE UPDATE ON organizer_balances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_donation_transactions_updated_at ON donation_transactions;
CREATE TRIGGER update_donation_transactions_updated_at
  BEFORE UPDATE ON donation_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_withdrawal_requests_updated_at ON withdrawal_requests;
CREATE TRIGGER update_withdrawal_requests_updated_at
  BEFORE UPDATE ON withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_in_kind_donation_intents_updated_at ON in_kind_donation_intents;
CREATE TRIGGER update_in_kind_donation_intents_updated_at
  BEFORE UPDATE ON in_kind_donation_intents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE organizer_billing_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE donation_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_kind_donation_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Organizers can view own billing accounts" ON organizer_billing_accounts;
CREATE POLICY "Organizers can view own billing accounts" ON organizer_billing_accounts
  FOR SELECT TO authenticated
  USING (auth.uid() = organizer_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Verified organizers can manage own billing accounts" ON organizer_billing_accounts;
CREATE POLICY "Verified organizers can manage own billing accounts" ON organizer_billing_accounts
  FOR ALL TO authenticated
  USING (
    (auth.uid() = organizer_id AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('shelter', 'ngo', 'dvmf')
        AND users.is_verified = TRUE
    ))
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = organizer_id AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('shelter', 'ngo', 'dvmf')
        AND users.is_verified = TRUE
    ))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Organizers can view own balances" ON organizer_balances;
CREATE POLICY "Organizers can view own balances" ON organizer_balances
  FOR SELECT TO authenticated
  USING (auth.uid() = organizer_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage organizer balances" ON organizer_balances;
CREATE POLICY "Admins can manage organizer balances" ON organizer_balances
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view related donation transactions" ON donation_transactions;
CREATE POLICY "Users can view related donation transactions" ON donation_transactions
  FOR SELECT TO authenticated
  USING (
    auth.uid() = donor_id
    OR auth.uid() = organizer_id
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Donors can create donation transactions" ON donation_transactions;
CREATE POLICY "Donors can create donation transactions" ON donation_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = donor_id
    AND auth.uid() <> organizer_id
    AND EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = donation_transactions.campaign_id
        AND events.event_type = 'donation_drive'
        AND events.organizer_id = donation_transactions.organizer_id
        AND COALESCE(events.donation_monetary_enabled, FALSE) = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can manage donation transactions" ON donation_transactions;
CREATE POLICY "Admins can manage donation transactions" ON donation_transactions
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Organizers can view own ledger" ON balance_ledger;
CREATE POLICY "Organizers can view own ledger" ON balance_ledger
  FOR SELECT TO authenticated
  USING (auth.uid() = organizer_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage balance ledger" ON balance_ledger;
CREATE POLICY "Admins can manage balance ledger" ON balance_ledger
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Organizers can view own withdrawals" ON withdrawal_requests;
CREATE POLICY "Organizers can view own withdrawals" ON withdrawal_requests
  FOR SELECT TO authenticated
  USING (auth.uid() = organizer_id OR is_admin(auth.uid()));

DROP POLICY IF EXISTS "Verified organizers can request withdrawals" ON withdrawal_requests;
CREATE POLICY "Verified organizers can request withdrawals" ON withdrawal_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = organizer_id
    AND status = 'pending'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('shelter', 'ngo', 'dvmf')
        AND users.is_verified = TRUE
    )
    AND EXISTS (
      SELECT 1 FROM organizer_billing_accounts
      WHERE organizer_billing_accounts.id = withdrawal_requests.billing_account_id
        AND organizer_billing_accounts.organizer_id = auth.uid()
        AND organizer_billing_accounts.is_active = TRUE
    )
  );

DROP POLICY IF EXISTS "Admins can review withdrawals" ON withdrawal_requests;
CREATE POLICY "Admins can review withdrawals" ON withdrawal_requests
  FOR UPDATE TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can view related in-kind intents" ON in_kind_donation_intents;
CREATE POLICY "Users can view related in-kind intents" ON in_kind_donation_intents
  FOR SELECT TO authenticated
  USING (
    auth.uid() = donor_id
    OR auth.uid() = organizer_id
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Donors can submit in-kind intents" ON in_kind_donation_intents;
CREATE POLICY "Donors can submit in-kind intents" ON in_kind_donation_intents
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = donor_id
    AND auth.uid() <> organizer_id
    AND status = 'submitted'
    AND EXISTS (
      SELECT 1
      FROM events
      WHERE events.id = in_kind_donation_intents.campaign_id
        AND events.event_type = 'donation_drive'
        AND events.organizer_id = in_kind_donation_intents.organizer_id
        AND COALESCE(events.donation_in_kind_enabled, FALSE) = TRUE
    )
  );

DROP POLICY IF EXISTS "Donors can cancel own in-kind intents" ON in_kind_donation_intents;
CREATE POLICY "Donors can cancel own in-kind intents" ON in_kind_donation_intents
  FOR UPDATE TO authenticated
  USING (auth.uid() = donor_id AND status IN ('submitted', 'acknowledged'))
  WITH CHECK (auth.uid() = donor_id AND status IN ('submitted', 'acknowledged', 'cancelled'));

DROP POLICY IF EXISTS "Organizers and admins can update in-kind intents" ON in_kind_donation_intents;
CREATE POLICY "Organizers and admins can update in-kind intents" ON in_kind_donation_intents
  FOR UPDATE TO authenticated
  USING (auth.uid() = organizer_id OR is_admin(auth.uid()))
  WITH CHECK (auth.uid() = organizer_id OR is_admin(auth.uid()));