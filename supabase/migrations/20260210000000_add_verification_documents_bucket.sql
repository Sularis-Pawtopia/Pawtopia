-- Add verification-documents storage bucket (used by adopter & shelter onboarding)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('verification-documents', 'verification-documents', true, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification-documents bucket
CREATE POLICY "Allow authenticated users to upload verification docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'verification-documents');

CREATE POLICY "Allow public to view verification docs"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'verification-documents');

CREATE POLICY "Allow users to update own verification docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete own verification docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'verification-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
