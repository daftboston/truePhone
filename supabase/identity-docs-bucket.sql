-- @file identity-docs-bucket.sql
-- @description Creates private identity-docs storage bucket and owner-scoped RLS for cédula/selfie uploads.
-- @dependencies PostgreSQL 15+, Supabase Storage

-- Private bucket for cédula + selfie uploads (Phase 4)
-- Run once in the Supabase SQL editor

insert into storage.buckets (id, name, public)
values ('identity-docs', 'identity-docs', false)
on conflict (id) do update set public = false;

drop policy if exists "Users can read own identity docs" on storage.objects;
drop policy if exists "Users can upload own identity docs" on storage.objects;
drop policy if exists "Users can update own identity docs" on storage.objects;
drop policy if exists "Users can delete own identity docs" on storage.objects;

create policy "Users can read own identity docs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'identity-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can upload own identity docs"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'identity-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own identity docs"
on storage.objects for update
to authenticated
using (
  bucket_id = 'identity-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'identity-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own identity docs"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'identity-docs'
  and (storage.foldername(name))[1] = auth.uid()::text
);
