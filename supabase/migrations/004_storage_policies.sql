-- =====================================================
-- STORAGE POLICIES
-- =====================================================

-- NOTE:
-- Create buckets in Supabase Dashboard:
-- - datasets (private)
-- - models (private)
-- - exports (public)

-- Allow authenticated users to upload to datasets bucket
CREATE POLICY "Users can upload datasets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'datasets' AND
  auth.role() = 'authenticated'
);

-- Allow users to read their own uploads (or demo assets)
CREATE POLICY "Users can read own datasets"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'datasets' AND
  (auth.uid()::text = (storage.foldername(name))[1] OR (storage.foldername(name))[1] = 'demo')
);

-- Allow users to upload models
CREATE POLICY "Users can upload models"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'models' AND
  auth.role() = 'authenticated'
);

-- Allow users to read their own models
CREATE POLICY "Users can read own models"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'models' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read exports (public bucket)
CREATE POLICY "Anyone can read exports"
ON storage.objects FOR SELECT
USING (bucket_id = 'exports');
