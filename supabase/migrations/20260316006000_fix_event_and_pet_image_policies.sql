DROP POLICY IF EXISTS "Organizers can create events" ON events;
DROP POLICY IF EXISTS "Shelters can update own events" ON events;
DROP POLICY IF EXISTS "Organizers can update own events" ON events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON events;

CREATE POLICY "Organizers can create events" ON events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = shelter_id OR auth.uid() = organizer_id)
    AND EXISTS (
      SELECT 1
      FROM users
      WHERE id = auth.uid()
        AND role IN ('shelter', 'ngo', 'dvmf')
    )
  );

CREATE POLICY "Organizers can update own events" ON events
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = shelter_id OR auth.uid() = organizer_id)
  WITH CHECK (auth.uid() = shelter_id OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete own events" ON events
  FOR DELETE
  TO authenticated
  USING (auth.uid() = shelter_id OR auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Allow authenticated users to upload pet images" ON storage.objects;

CREATE POLICY "Allow authenticated users to upload pet images" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'pet-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );