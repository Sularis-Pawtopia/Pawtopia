ALTER TABLE donation_transactions
  ADD COLUMN IF NOT EXISTS donor_is_anonymous BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS donor_display_name TEXT;

CREATE INDEX IF NOT EXISTS idx_donation_transactions_organizer_created_at
  ON donation_transactions(organizer_id, created_at DESC);
