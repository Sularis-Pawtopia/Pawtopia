-- Allow all organizer roles to manage their own event images
DROP POLICY IF EXISTS "Allow shelters to upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow shelters to update own event images" ON storage.objects;
DROP POLICY IF EXISTS "Allow shelters to delete own event images" ON storage.objects;

CREATE POLICY "Allow organizers to upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('shelter', 'ngo', 'dvmf')
  )
);

CREATE POLICY "Allow organizers to update own event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('shelter', 'ngo', 'dvmf')
  )
);

CREATE POLICY "Allow organizers to delete own event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role IN ('shelter', 'ngo', 'dvmf')
  )
);
