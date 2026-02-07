-- Add owner_id to pets so adopters can add their own personal pets
-- and track ownership after adoption

-- 1. Add owner_id column
ALTER TABLE pets ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES users(id) ON DELETE CASCADE;

-- 2. Make shelter_id nullable (adopter-owned pets won't have a shelter)
ALTER TABLE pets ALTER COLUMN shelter_id DROP NOT NULL;

-- 3. Add constraint: every pet must have either a shelter or an owner
ALTER TABLE pets ADD CONSTRAINT pets_must_have_owner_or_shelter
  CHECK (shelter_id IS NOT NULL OR owner_id IS NOT NULL);

-- 4. Create index on owner_id
CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON pets(owner_id);

-- 5. RLS: Adopters can create their own pets (owner_id = auth.uid())
CREATE POLICY "Adopters can create own pets" ON pets
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'adopter'
    )
  );

-- 6. RLS: Owners can update their own pets
CREATE POLICY "Owners can update own pets" ON pets
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- 7. RLS: Owners can delete their own pets
CREATE POLICY "Owners can delete own pets" ON pets
  FOR DELETE
  USING (auth.uid() = owner_id);
