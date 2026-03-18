-- Allow verified DVMF users to create/manage adoptable pets the same way as shelters.

DROP POLICY IF EXISTS "Shelters can create pets" ON pets;
DROP POLICY IF EXISTS "Shelters can update own pets" ON pets;
DROP POLICY IF EXISTS "Shelters can delete own pets" ON pets;
DROP POLICY IF EXISTS "Organizers can create own pets" ON pets;
DROP POLICY IF EXISTS "Organizers can update own pets" ON pets;
DROP POLICY IF EXISTS "Organizers can delete own pets" ON pets;

CREATE POLICY "Organizers can create own pets" ON pets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = shelter_id
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('shelter', 'dvmf')
        AND users.is_verified = TRUE
    )
  );

CREATE POLICY "Organizers can update own pets" ON pets
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = shelter_id
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('shelter', 'dvmf')
    )
  )
  WITH CHECK (
    auth.uid() = shelter_id
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('shelter', 'dvmf')
    )
  );

CREATE POLICY "Organizers can delete own pets" ON pets
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = shelter_id
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE users.id = auth.uid()
        AND users.role IN ('shelter', 'dvmf')
    )
  );
