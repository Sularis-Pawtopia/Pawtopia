-- Extend healthcare services and slot generation support for branch-based scheduling.

ALTER TABLE dvmf_healthcare_services
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER NOT NULL DEFAULT 60;

ALTER TABLE dvmf_healthcare_services
  DROP CONSTRAINT IF EXISTS dvmf_healthcare_services_duration_minutes_positive;

ALTER TABLE dvmf_healthcare_services
  ADD CONSTRAINT dvmf_healthcare_services_duration_minutes_positive CHECK (duration_minutes > 0);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dvmf_healthcare_slots_unique_range
  ON dvmf_healthcare_slots(dvmf_id, service_id, slot_start, slot_end);
