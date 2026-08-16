-- @file listing-images-bucket.sql
-- @description Creates public listing-images storage bucket and seller-scoped RLS for gallery/possession photos.
-- @dependencies PostgreSQL 15+, Supabase Storage

-- Public gallery + possession photos for listings (Phase 5)
-- Run once in the Supabase SQL editor

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Listing images are publicly readable" on storage.objects;
drop policy if exists "Sellers can upload listing images" on storage.objects;
drop policy if exists "Sellers can update listing images" on storage.objects;
drop policy if exists "Sellers can delete listing images" on storage.objects;

create policy "Listing images are publicly readable"
on storage.objects for select
using (bucket_id = 'listing-images');

create policy "Sellers can upload listing images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Sellers can update listing images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Sellers can delete listing images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'listing-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
