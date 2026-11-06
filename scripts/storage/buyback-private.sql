-- Run on the ISOLATED Supabase preview first, separately from Prisma migrations.
-- Requires a privileged Supabase SQL connection. Never make this bucket public.
BEGIN;
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('buyback-photos', 'buyback-photos', false, 4194304, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
-- Restrictive policies prevent broader existing permissive policies from letting
-- browser/anon clients replace evidence. Trusted service-role server bypasses RLS.
DROP POLICY IF EXISTS buyback_server_only ON storage.objects;
CREATE POLICY buyback_server_only ON storage.objects AS RESTRICTIVE
  FOR ALL TO anon, authenticated
  USING (bucket_id <> 'buyback-photos') WITH CHECK (bucket_id <> 'buyback-photos');
COMMIT;
