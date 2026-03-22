-- DVMF healthcare scheduling foundation (services, slots, approvals, payments)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'healthcare_service_type'
  ) THEN
    CREATE TYPE healthcare_service_type AS ENUM ('spay_neuter', 'vaccination', 'deworming');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'appointment_request_status'
  ) THEN
    CREATE TYPE appointment_request_status AS ENUM (
      'pending_approval',
      'approved_pending_payment',
      'paid_scheduled',
      'rejected',
      'completed',
      'cancelled'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'healthcare_payment_status'
  ) THEN
    CREATE TYPE healthcare_payment_status AS ENUM (
      'pending',
      'paid',
      'failed',
      'cancelled',
      'refunded'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS dvmf_healthcare_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dvmf_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_type healthcare_service_type NOT NULL,
  service_name TEXT NOT NULL,
  description TEXT,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  base_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dvmf_healthcare_services_base_fee_non_negative CHECK (base_fee >= 0),
  CONSTRAINT dvmf_healthcare_services_unique_type_per_dvmf UNIQUE (dvmf_id, service_type)
);

CREATE INDEX IF NOT EXISTS idx_dvmf_healthcare_services_dvmf_id
  ON dvmf_healthcare_services(dvmf_id);
CREATE INDEX IF NOT EXISTS idx_dvmf_healthcare_services_active
  ON dvmf_healthcare_services(dvmf_id, is_active);

CREATE TABLE IF NOT EXISTS dvmf_healthcare_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dvmf_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES dvmf_healthcare_services(id) ON DELETE CASCADE,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  approved_bookings_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dvmf_healthcare_slots_capacity_positive CHECK (capacity > 0),
  CONSTRAINT dvmf_healthcare_slots_bookings_non_negative CHECK (approved_bookings_count >= 0),
  CONSTRAINT dvmf_healthcare_slots_time_range_valid CHECK (slot_end > slot_start)
);

CREATE INDEX IF NOT EXISTS idx_dvmf_healthcare_slots_dvmf_id
  ON dvmf_healthcare_slots(dvmf_id);
CREATE INDEX IF NOT EXISTS idx_dvmf_healthcare_slots_service_id
  ON dvmf_healthcare_slots(service_id);
CREATE INDEX IF NOT EXISTS idx_dvmf_healthcare_slots_start
  ON dvmf_healthcare_slots(slot_start);
CREATE INDEX IF NOT EXISTS idx_dvmf_healthcare_slots_dvmf_start
  ON dvmf_healthcare_slots(dvmf_id, slot_start);

CREATE TABLE IF NOT EXISTS healthcare_appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dvmf_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE RESTRICT,
  service_id UUID NOT NULL REFERENCES dvmf_healthcare_services(id) ON DELETE RESTRICT,
  slot_id UUID REFERENCES dvmf_healthcare_slots(id) ON DELETE SET NULL,
  reason TEXT,
  requester_notes TEXT,
  status appointment_request_status NOT NULL DEFAULT 'pending_approval',
  service_base_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_service_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  payment_required BOOLEAN NOT NULL DEFAULT FALSE,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT healthcare_appointment_requests_fee_non_negative CHECK (
    service_base_fee >= 0
    AND platform_service_fee >= 0
    AND total_fee >= 0
  )
);

CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_requester
  ON healthcare_appointment_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_dvmf
  ON healthcare_appointment_requests(dvmf_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_status
  ON healthcare_appointment_requests(status);
CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_slot
  ON healthcare_appointment_requests(slot_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_service
  ON healthcare_appointment_requests(service_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_appointment_requests_created
  ON healthcare_appointment_requests(created_at DESC);

CREATE TABLE IF NOT EXISTS healthcare_payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_request_id UUID NOT NULL REFERENCES healthcare_appointment_requests(id) ON DELETE CASCADE,
  requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dvmf_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'maya',
  provider_reference TEXT,
  provider_checkout_url TEXT,
  amount_service NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_platform_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  amount_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status healthcare_payment_status NOT NULL DEFAULT 'pending',
  provider_payload JSONB,
  provider_callback_payload JSONB,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT healthcare_payment_transactions_amounts_non_negative CHECK (
    amount_service >= 0
    AND amount_platform_fee >= 0
    AND amount_total >= 0
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_healthcare_payment_transactions_unique_appointment
  ON healthcare_payment_transactions(appointment_request_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_payment_transactions_requester
  ON healthcare_payment_transactions(requester_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_payment_transactions_dvmf
  ON healthcare_payment_transactions(dvmf_id);
CREATE INDEX IF NOT EXISTS idx_healthcare_payment_transactions_status
  ON healthcare_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_healthcare_payment_transactions_provider_ref
  ON healthcare_payment_transactions(provider_reference);

-- Keep updated_at timestamps in sync.
DROP TRIGGER IF EXISTS update_dvmf_healthcare_services_updated_at ON dvmf_healthcare_services;
CREATE TRIGGER update_dvmf_healthcare_services_updated_at
  BEFORE UPDATE ON dvmf_healthcare_services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_dvmf_healthcare_slots_updated_at ON dvmf_healthcare_slots;
CREATE TRIGGER update_dvmf_healthcare_slots_updated_at
  BEFORE UPDATE ON dvmf_healthcare_slots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_healthcare_appointment_requests_updated_at ON healthcare_appointment_requests;
CREATE TRIGGER update_healthcare_appointment_requests_updated_at
  BEFORE UPDATE ON healthcare_appointment_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_healthcare_payment_transactions_updated_at ON healthcare_payment_transactions;
CREATE TRIGGER update_healthcare_payment_transactions_updated_at
  BEFORE UPDATE ON healthcare_payment_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION refresh_healthcare_slot_approved_counts(target_slot_id UUID)
RETURNS VOID AS $$
DECLARE
  approved_count INTEGER;
BEGIN
  IF target_slot_id IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*)::INTEGER INTO approved_count
  FROM healthcare_appointment_requests
  WHERE slot_id = target_slot_id
    AND status IN ('approved_pending_payment', 'paid_scheduled', 'completed');

  UPDATE dvmf_healthcare_slots
  SET approved_bookings_count = COALESCE(approved_count, 0),
      updated_at = NOW()
  WHERE id = target_slot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_healthcare_appointment_request_change_refresh_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM refresh_healthcare_slot_approved_counts(OLD.slot_id);
    RETURN OLD;
  END IF;

  PERFORM refresh_healthcare_slot_approved_counts(NEW.slot_id);

  IF TG_OP = 'UPDATE' AND OLD.slot_id IS DISTINCT FROM NEW.slot_id THEN
    PERFORM refresh_healthcare_slot_approved_counts(OLD.slot_id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS healthcare_appointment_requests_refresh_slot_counts ON healthcare_appointment_requests;
CREATE TRIGGER healthcare_appointment_requests_refresh_slot_counts
  AFTER INSERT OR UPDATE OR DELETE ON healthcare_appointment_requests
  FOR EACH ROW
  EXECUTE FUNCTION on_healthcare_appointment_request_change_refresh_counts();

CREATE OR REPLACE FUNCTION seed_default_dvmf_healthcare_services(target_dvmf_id UUID)
RETURNS VOID AS $$
BEGIN
  IF target_dvmf_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO dvmf_healthcare_services (dvmf_id, service_type, service_name, description, is_paid, base_fee)
  VALUES
    (target_dvmf_id, 'spay_neuter', 'Spay/Neuter', 'Sterilization procedure for eligible pets.', TRUE, 0),
    (target_dvmf_id, 'vaccination', 'Vaccination', 'Core vaccination service.', FALSE, 0),
    (target_dvmf_id, 'deworming', 'Deworming', 'Routine parasite treatment.', FALSE, 0)
  ON CONFLICT (dvmf_id, service_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION on_user_seed_default_dvmf_healthcare_services()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'dvmf' AND (TG_OP = 'INSERT' OR OLD.role IS DISTINCT FROM 'dvmf') THEN
    PERFORM seed_default_dvmf_healthcare_services(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS users_seed_default_dvmf_healthcare_services_trigger ON users;
CREATE TRIGGER users_seed_default_dvmf_healthcare_services_trigger
  AFTER INSERT OR UPDATE OF role ON users
  FOR EACH ROW
  EXECUTE FUNCTION on_user_seed_default_dvmf_healthcare_services();

-- Backfill defaults for existing DVMF accounts.
SELECT seed_default_dvmf_healthcare_services(users.id)
FROM users
WHERE users.role = 'dvmf';

ALTER TABLE dvmf_healthcare_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE dvmf_healthcare_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE healthcare_payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view healthcare services" ON dvmf_healthcare_services;
CREATE POLICY "Users can view healthcare services" ON dvmf_healthcare_services
  FOR SELECT
  TO authenticated
  USING (
    is_active = TRUE
    OR auth.uid() = dvmf_id
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "DVMF can manage own healthcare services" ON dvmf_healthcare_services;
CREATE POLICY "DVMF can manage own healthcare services" ON dvmf_healthcare_services
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can view healthcare slots" ON dvmf_healthcare_slots;
CREATE POLICY "Users can view healthcare slots" ON dvmf_healthcare_slots
  FOR SELECT
  TO authenticated
  USING (
    (is_active = TRUE)
    OR (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "DVMF can manage own healthcare slots" ON dvmf_healthcare_slots;
CREATE POLICY "DVMF can manage own healthcare slots" ON dvmf_healthcare_slots
  FOR ALL
  TO authenticated
  USING (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Users can view related appointment requests" ON healthcare_appointment_requests;
CREATE POLICY "Users can view related appointment requests" ON healthcare_appointment_requests
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id
    OR (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Allowed roles can create appointment requests" ON healthcare_appointment_requests;
CREATE POLICY "Allowed roles can create appointment requests" ON healthcare_appointment_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('adopter', 'volunteer', 'regular_user')
    )
    AND EXISTS (
      SELECT 1
      FROM users target_dvmf
      WHERE target_dvmf.id = healthcare_appointment_requests.dvmf_id
        AND target_dvmf.role = 'dvmf'
    )
    AND EXISTS (
      SELECT 1
      FROM pets
      WHERE pets.id = healthcare_appointment_requests.pet_id
        AND pets.owner_id IS NOT NULL
    )
    AND status = 'pending_approval'
  );

DROP POLICY IF EXISTS "Requesters can update own pending requests" ON healthcare_appointment_requests;
CREATE POLICY "Requesters can update own pending requests" ON healthcare_appointment_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = requester_id
    AND status IN ('pending_approval', 'approved_pending_payment')
  )
  WITH CHECK (
    auth.uid() = requester_id
    AND status IN ('pending_approval', 'approved_pending_payment', 'cancelled')
  );

DROP POLICY IF EXISTS "DVMF can review own appointment requests" ON healthcare_appointment_requests;
CREATE POLICY "DVMF can review own appointment requests" ON healthcare_appointment_requests
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = dvmf_id
    AND is_dvmf(auth.uid())
  )
  WITH CHECK (
    auth.uid() = dvmf_id
    AND is_dvmf(auth.uid())
  );

DROP POLICY IF EXISTS "Users can view related healthcare payments" ON healthcare_payment_transactions;
CREATE POLICY "Users can view related healthcare payments" ON healthcare_payment_transactions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = requester_id
    OR (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "Requesters can create own healthcare payments" ON healthcare_payment_transactions;
CREATE POLICY "Requesters can create own healthcare payments" ON healthcare_payment_transactions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = requester_id
    AND EXISTS (
      SELECT 1
      FROM healthcare_appointment_requests req
      WHERE req.id = healthcare_payment_transactions.appointment_request_id
        AND req.requester_id = auth.uid()
        AND req.status = 'approved_pending_payment'
    )
  );

DROP POLICY IF EXISTS "Requesters can update own healthcare payments" ON healthcare_payment_transactions;
CREATE POLICY "Requesters can update own healthcare payments" ON healthcare_payment_transactions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id)
  WITH CHECK (auth.uid() = requester_id);