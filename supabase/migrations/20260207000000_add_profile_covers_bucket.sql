-- Add cover_photo_url column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_photo_url TEXT;

-- Add profile-covers storage bucket for cover photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-covers', 'profile-covers', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for profile-covers bucket
CREATE POLICY "Allow authenticated users to upload cover photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow public to view cover photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-covers');

CREATE POLICY "Allow users to update own cover photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete own cover photo"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
