-- Allow DVMF reviewers to read adopter onboarding details during adoption request review.
-- This keeps profile ownership restrictions while restoring shelter/DVMF parity.

DROP POLICY IF EXISTS "Adopter profiles viewable by user and shelters" ON adopter_profiles;
DROP POLICY IF EXISTS "Adopter profiles viewable by user, shelters, and dvmf" ON adopter_profiles;

CREATE POLICY "Adopter profiles viewable by user, shelters, and dvmf" ON adopter_profiles
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role IN ('shelter', 'dvmf')
    )
  );
