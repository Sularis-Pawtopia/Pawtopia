-- Harden verification-documents bucket:
-- 1) make bucket private
-- 2) remove public read policy
-- 3) enforce per-user folder ownership for writes

UPDATE storage.buckets
SET public = false
WHERE id = 'verification-documents';

DROP POLICY IF EXISTS "Allow public to view verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update own verification docs" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete own verification docs" ON storage.objects;

CREATE POLICY "Allow authenticated users to view verification docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'verification-documents');

CREATE POLICY "Allow users to upload own verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'verification-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Allow users to update own verification docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'verification-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[2] = auth.uid()::text
);

CREATE POLICY "Allow users to delete own verification docs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[2] = auth.uid()::text
);
