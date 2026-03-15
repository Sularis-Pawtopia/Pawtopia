-- DVMF-owned pet inventory records (paper to digital)
CREATE TABLE IF NOT EXISTS dvmf_pet_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dvmf_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  registered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pet_name TEXT NOT NULL,
  markings TEXT NOT NULL,
  sex TEXT NOT NULL CHECK (sex IN ('male', 'female')),
  birth_date DATE,
  is_vaccinated BOOLEAN NOT NULL DEFAULT false,
  last_vaccination_date DATE,
  is_spayed_neutered BOOLEAN NOT NULL DEFAULT false,
  owner_name TEXT NOT NULL,
  owner_address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT dvmf_pet_registry_vaccination_date_consistency CHECK (
    (is_vaccinated = true AND last_vaccination_date IS NOT NULL)
    OR (is_vaccinated = false AND last_vaccination_date IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_dvmf_pet_registry_dvmf_id
  ON dvmf_pet_registry(dvmf_id);
CREATE INDEX IF NOT EXISTS idx_dvmf_pet_registry_created_at
  ON dvmf_pet_registry(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dvmf_pet_registry_owner_name
  ON dvmf_pet_registry(owner_name);
CREATE INDEX IF NOT EXISTS idx_dvmf_pet_registry_pet_name
  ON dvmf_pet_registry(pet_name);

CREATE OR REPLACE FUNCTION update_dvmf_pet_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS dvmf_pet_registry_updated_at_trigger ON dvmf_pet_registry;
CREATE TRIGGER dvmf_pet_registry_updated_at_trigger
  BEFORE UPDATE ON dvmf_pet_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_dvmf_pet_registry_updated_at();

ALTER TABLE dvmf_pet_registry ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "DVMF can view own registry" ON dvmf_pet_registry;
CREATE POLICY "DVMF can view own registry" ON dvmf_pet_registry
  FOR SELECT USING (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "DVMF can insert own registry" ON dvmf_pet_registry;
CREATE POLICY "DVMF can insert own registry" ON dvmf_pet_registry
  FOR INSERT WITH CHECK (
    auth.uid() = dvmf_id AND auth.uid() = registered_by AND is_dvmf(auth.uid())
  );

DROP POLICY IF EXISTS "DVMF can update own registry" ON dvmf_pet_registry;
CREATE POLICY "DVMF can update own registry" ON dvmf_pet_registry
  FOR UPDATE USING (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  )
  WITH CHECK (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );

DROP POLICY IF EXISTS "DVMF can delete own registry" ON dvmf_pet_registry;
CREATE POLICY "DVMF can delete own registry" ON dvmf_pet_registry
  FOR DELETE USING (
    (auth.uid() = dvmf_id AND is_dvmf(auth.uid()))
    OR is_admin(auth.uid())
  );
