-- Allow personal pet creation for adopter, volunteer, and regular_user roles.
-- This aligns RLS with app logic for profile-owned pets (owner_id = auth.uid()).

DROP POLICY IF EXISTS "Adopters can create own pets" ON pets;
DROP POLICY IF EXISTS "Allowed roles can create own personal pets" ON pets;

CREATE POLICY "Allowed roles can create own personal pets" ON pets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND shelter_id IS NULL
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('adopter', 'volunteer', 'regular_user')
    )
  );
