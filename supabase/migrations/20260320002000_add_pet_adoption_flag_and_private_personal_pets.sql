-- Separate personal pets from adoptable pets with an explicit flag.
-- This prevents personal pets from leaking into adoption queries.

ALTER TABLE pets
ADD COLUMN IF NOT EXISTS is_for_adoption BOOLEAN NOT NULL DEFAULT false;

-- Backfill existing data conservatively.
UPDATE pets
SET is_for_adoption = CASE
  WHEN owner_id IS NOT NULL THEN false
  WHEN shelter_id IS NOT NULL AND status IN ('available', 'pending') THEN true
  ELSE false
END;

CREATE INDEX IF NOT EXISTS idx_pets_is_for_adoption_status
  ON pets(is_for_adoption, status, shelter_id, owner_id);

-- Keep the flag synchronized even if rows are updated outside app actions.
CREATE OR REPLACE FUNCTION sync_pets_is_for_adoption()
RETURNS trigger AS $$
BEGIN
  IF NEW.owner_id IS NOT NULL THEN
    NEW.is_for_adoption := false;
  ELSIF NEW.shelter_id IS NOT NULL AND NEW.status IN ('available', 'pending') THEN
    NEW.is_for_adoption := true;
  ELSE
    NEW.is_for_adoption := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_pets_is_for_adoption ON pets;
CREATE TRIGGER trg_sync_pets_is_for_adoption
BEFORE INSERT OR UPDATE ON pets
FOR EACH ROW
EXECUTE FUNCTION sync_pets_is_for_adoption();
